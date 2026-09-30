# ADR-0005: Hermes Adapter Layer

**Date:** 2026-09-20  
**Status:** Proposed  
**Deciders:** Founder, Lead Software Architect, Platform Engineer  
**Context Tags:** hermes, ai-gateway, adapter-pattern, sse, react-engine, dec-010

---

## Problem Statement
The current Next.js API route `app/api/chat/route.ts` directly executes raw HTTP calls to the Hermes VPS gateway over unencrypted plaintext HTTP (`http://43.134.124.127:9119`). Crucially, the selected agent persona (e.g. `Aura-Trade`, `Aura-Pen`, `Aura-Art`) selected in the UI is **completely omitted** from the gateway payload—only `message` and `session_id` are forwarded (Finding: `RR-ARC-003`). Furthermore, there is no abstraction to run offline tests or simulate specific LLM failures.

## Context & Constraints
- **Audit Findings:** `hermes-integration-map.md`, `RR-SEC-002` (Plaintext HTTP), `RR-SEC-005` (Client-exposed URL), `RR-ARC-003` (Agent selection dropped), `RR-PERF-001` (Non-abortable SSE streams).
- **Hermes Gateway Protocol:**
  1. `POST /api/chat/start` with payload `{ message, session_id, agent_id }` → returns `{ stream_id }`
  2. `GET /api/chat/stream?stream_id={id}` → returns Server-Sent Events (SSE) stream.
- **Requirement:** Must support abort signals, retry mechanisms, HTTPS transport, and a mock implementation for automated testing.

## Options Considered

### Option A: Inline Fetch Calls inside Route Handlers
Keep calling `fetch()` directly within `app/api/chat/route.ts` with minor fixes.
- **Pros:** Least effort in the immediate term.
- **Cons:** Violates `DEC-010`; impossible to mock during CI tests; cannot switch gateway protocols without rewriting route logic.

### Option B: Vendor SDK Replacement (Vercel AI SDK)
Replace Hermes custom gateway with standard Vercel AI SDK primitives.
- **Pros:** Rich UI hooks and streaming helpers.
- **Cons:** Hermes is not a standard OpenAI-compatible endpoint; it operates a specialized stateful ReAct Re-entrant loop on a custom VPS, requiring custom start/stream protocol negotiation.

### Option C: `IHermesAdapter` Interface & Gateway Implementation (Recommended)
Define a formal `IHermesAdapter` interface in `adapters/hermes/`. Implement `HermesGatewayAdapter` (for production HTTPS communication) and `MockHermesAdapter` (for CI test suites and offline local development).
- **Pros:**
  - Fully isolates the two-step protocol (`/api/chat/start` + `/api/chat/stream`).
  - Forwards the `agent` identifier properly as `agent_id` or `capability_hint`.
  - Supports `AbortSignal` to terminate backend compute when users navigate away or hit stop.
  - Allows unit and integration tests to run with `MockHermesAdapter` without spinning up the remote VPS.
- **Cons:** Requires maintaining two adapter implementations.

## Decision
We decide to adopt **Option C: `IHermesAdapter` Interface & Gateway Implementation**.

1. `app/api/chat/route.ts` delegates entirely to `ChatService`, which invokes `IHermesAdapter`.
2. All production traffic routes over **HTTPS** to a secured domain (e.g. `https://gateway.tanair.my`), configured with an authentication secret header (`X-Aura-Secret`).
3. The selected agent ID is passed explicitly to the Hermes ReAct engine.
4. `MockHermesAdapter` provides instant, deterministic BM responses during automated testing.

## Consequences

### Positive
- Prevents cleartext MITM eavesdropping on sensitive financial and business prompts (`SEC-002`).
- Restores the multi-agent value proposition: selecting `Aura-Trade` actually directs Hermes to use Bursa Malaysia market data tools.
- Enables offline local development (`MOCK_HERMES=true`).

### Negative / Trade-offs
- Requires setting up SSL/TLS reverse proxy (Cloudflare or Nginx) in front of the Tencent Cloud VPS.

## Implementation Guidance

### Interface Definition (`adapters/hermes/IHermesAdapter.ts`)
```typescript
export interface ChatRequestParams {
  message: string;
  sessionId: string;
  agentId: string;
  userId: string;
  signal?: AbortSignal;
}

export interface IHermesAdapter {
  streamChat(params: ChatRequestParams): Promise<ReadableStream<Uint8Array>>;
  healthCheck(): Promise<boolean>;
}
```

### Gateway Implementation (`adapters/hermes/HermesGatewayAdapter.ts`)
```typescript
import { IHermesAdapter, ChatRequestParams } from './IHermesAdapter';

export class HermesGatewayAdapter implements IHermesAdapter {
  constructor(
    private readonly baseUrl: string,
    private readonly secretKey: string,
    private readonly timeoutMs: number = 3500
  ) {}

  async streamChat(params: ChatRequestParams): Promise<ReadableStream<Uint8Array>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    // Step 1: Start Session & Forward Agent Persona
    const startRes = await fetch(`${this.baseUrl}/api/chat/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Aura-Secret': this.secretKey,
      },
      body: JSON.stringify({
        message: params.message,
        session_id: params.sessionId,
        agent_id: params.agentId,
        user_id: params.userId,
      }),
      signal: params.signal || controller.signal,
    });
    clearTimeout(timeout);

    if (!startRes.ok) {
      throw new Error(`Hermes Gateway error: ${startRes.statusText}`);
    }

    const { stream_id } = await startRes.json();

    // Step 2: Stream SSE tokens
    const streamRes = await fetch(`${this.baseUrl}/api/chat/stream?stream_id=${stream_id}`, {
      headers: { 'X-Aura-Secret': this.secretKey },
      signal: params.signal,
    });

    if (!streamRes.body) {
      throw new Error('Hermes Gateway returned empty response body');
    }

    return streamRes.body;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }
}
```

## Related ADRs
- ADR-0001: Application Architecture
- ADR-0006: Authentication Boundary
- ADR-0009: Quota Architecture
