import { NextRequest } from 'next/server';
import { authenticateChatRequest } from '@/lib/supabase-server';
import { validateChatPayload } from '@/lib/security/validation';
import { defaultChatRateLimiter } from '@/lib/security/rate-limiter';
import { resolveRequestId } from '@/lib/security/correlation';
import { createSafeErrorResponse } from '@/lib/security/errors';
import { safeLogger } from '@/lib/logger';
import { HermesGatewayAdapter } from '@/adapters/hermes/HermesGatewayAdapter';
import { generateFallbackStream } from '@/lib/fallback-chat';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = resolveRequestId(req.headers.get('x-request-id'));

  safeLogger.info('Chat request received', { requestId });

  try {
    // 1. Server-Side Authentication Guard (ADR-0006, SEC-001)
    const user = await authenticateChatRequest(req);
    if (!user) {
      safeLogger.warn('Chat request rejected: unauthenticated', {
        requestId,
        statusCode: 401,
        errorCategory: 'AUTH_REQUIRED',
      });
      return createSafeErrorResponse(
        401,
        'AUTH_REQUIRED',
        'Akses tidak sah. Sila log masuk ke akaun TanAir anda terlebih dahulu.',
        requestId,
      );
    }

    // 2. Server-Side Rate Limiting (ADR-0007, SEC-003)
    const rateLimit = await defaultChatRateLimiter.check(user.id);
    if (!rateLimit.allowed) {
      safeLogger.warn('Chat request rejected: rate limit exceeded', {
        requestId,
        userId: user.id,
        statusCode: 429,
        errorCategory: 'RATE_LIMITED',
      });
      return createSafeErrorResponse(
        429,
        'RATE_LIMITED',
        'Had kekerapan permintaan telah dicapai. Sila tunggu sebentar sebelum menghantar mesej baru.',
        requestId,
        rateLimit.resetSeconds,
      );
    }

    // 3. Request Body Parsing & Defensive Validation (SEC-010)
    let rawText = '';
    try {
      rawText = await req.text();
    } catch {
      return createSafeErrorResponse(
        400,
        'INVALID_INPUT',
        'Gagal membaca data permintaan.',
        requestId,
      );
    }

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(rawText);
    } catch {
      safeLogger.warn('Chat request rejected: malformed JSON', {
        requestId,
        userId: user.id,
        statusCode: 400,
      });
      return createSafeErrorResponse(
        400,
        'INVALID_INPUT',
        'Format data mestilah JSON yang sah.',
        requestId,
      );
    }

    const validation = validateChatPayload(rawJson, Buffer.byteLength(rawText, 'utf8'));
    if (!validation.valid) {
      safeLogger.warn('Chat request rejected: invalid payload', {
        requestId,
        userId: user.id,
        statusCode: validation.status,
        errorCategory: validation.code,
      });
      return createSafeErrorResponse(
        validation.status,
        validation.code,
        validation.error,
        requestId,
      );
    }

    const { message, sessionId, agent, hermesAgentId } = validation.data;

    safeLogger.info('Chat request validated', {
      requestId,
      userId: user.id,
      agent,
    });

    // 4. Hermes Gateway Forwarding with Safe Fallback (ADR-0005, RR-ARC-003)
    const gatewayUrl = process.env.HERMES_GATEWAY_URL;
    let stream: ReadableStream<Uint8Array>;

    if (gatewayUrl) {
      try {
        const adapter = new HermesGatewayAdapter({ gatewayUrl });
        stream = await adapter.streamChat(
          {
            message,
            sessionId,
            agentId: hermesAgentId,
            userId: user.id,
          },
          {
            signal: req.signal,
            requestId,
          },
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        if (errorMessage === 'CLIENT_ABORTED') {
          safeLogger.info('Request cancelled by client', { requestId, userId: user.id });
          return new Response(null, { status: 499 });
        }

        if (errorMessage === 'UPSTREAM_TIMEOUT') {
          safeLogger.warn('Upstream Hermes timeout triggered fallback', {
            requestId,
            userId: user.id,
            durationMs: Date.now() - startTime,
          });
          stream = generateFallbackStream(message, agent);
        } else {
          safeLogger.warn('Hermes gateway unreachable; activating intelligent fallback', {
            requestId,
            userId: user.id,
            errorDetail: errorMessage,
          });
          stream = generateFallbackStream(message, agent);
        }
      }
    } else {
      // Local dev or gateway unconfigured: serve intelligent BM fallback
      stream = generateFallbackStream(message, agent);
    }

    safeLogger.info('Streaming response started', {
      requestId,
      userId: user.id,
      agent,
      durationMs: Date.now() - startTime,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'x-request-id': requestId,
      },
    });
  } catch (err: unknown) {
    safeLogger.error('Internal server error in chat route', {
      requestId,
      errorDetail: err instanceof Error ? err.message : String(err),
    });
    return createSafeErrorResponse(
      500,
      'INTERNAL_ERROR',
      'Ralat dalaman pelayan. Sila cuba sebentar lagi.',
      requestId,
    );
  }
}
