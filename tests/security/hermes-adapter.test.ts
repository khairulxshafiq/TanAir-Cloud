import { describe, it, expect, vi, afterEach } from 'vitest';
import { HermesGatewayAdapter } from '@/adapters/hermes/HermesGatewayAdapter';
import { MockHermesAdapter } from '@/adapters/hermes/MockHermesAdapter';

describe('Hermes Adapter Boundary (adapters/hermes)', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('HermesGatewayAdapter Configuration & Security', () => {
    it('throws error when HERMES_GATEWAY_URL is missing', () => {
      delete process.env.HERMES_GATEWAY_URL;
      expect(() => new HermesGatewayAdapter({ gatewayUrl: '' })).toThrow(
        'HERMES_GATEWAY_URL tidak dikonfigurasi',
      );
    });

    it('throws error on invalid URL format', () => {
      expect(() => new HermesGatewayAdapter({ gatewayUrl: 'not-a-valid-url' })).toThrow(
        'Format HERMES_GATEWAY_URL tidak sah',
      );
    });

    it('rejects plain HTTP in production mode by default', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
      expect(
        () =>
          new HermesGatewayAdapter({
            gatewayUrl: 'http://43.134.124.127:9119',
            allowInsecureHttp: false,
          }),
      ).toThrow('Protokol HTTP tidak selamat ditolak dalam mod produksi');
    });

    it('allows HTTPS in production mode', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
      expect(
        () => new HermesGatewayAdapter({ gatewayUrl: 'https://gateway.tanair.my' }),
      ).not.toThrow();
    });

    it('allows HTTP in production only when explicitly overridden for local/debug access', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
      expect(
        () =>
          new HermesGatewayAdapter({
            gatewayUrl: 'http://localhost:9119',
            allowInsecureHttp: true,
          }),
      ).not.toThrow();
    });
  });

  describe('MockHermesAdapter Execution', () => {
    it('streams simulated SSE tokens with data prefix and DONE token', async () => {
      const adapter = new MockHermesAdapter({ simulatedDelayMs: 0 });
      const stream = await adapter.streamChat(
        {
          message: 'Uji sistem',
          sessionId: 'test-session-1',
          agentId: 'aura-trade',
          userId: 'user-001',
        },
        {
          requestId: 'test-req-1234567890',
        },
      );

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let output = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        output += decoder.decode(value);
      }

      expect(output).toContain('data: ');
      expect(output).toContain('data: [DONE]\n\n');
      expect(adapter.lastRequest?.agentId).toBe('aura-trade');
      expect(adapter.lastOptions?.requestId).toBe('test-req-1234567890');
    });

    it('throws UPSTREAM_TIMEOUT when timeout is simulated', async () => {
      const adapter = new MockHermesAdapter({ shouldTimeout: true });
      await expect(
        adapter.streamChat(
          { message: 'Hi', sessionId: 's1', agentId: 'aura', userId: 'u1' },
          { requestId: 'req-1' },
        ),
      ).rejects.toThrow('UPSTREAM_TIMEOUT');
    });

    it('throws UPSTREAM_ERROR when failure is simulated', async () => {
      const adapter = new MockHermesAdapter({ shouldFail: true });
      await expect(
        adapter.streamChat(
          { message: 'Hi', sessionId: 's1', agentId: 'aura', userId: 'u1' },
          { requestId: 'req-1' },
        ),
      ).rejects.toThrow('UPSTREAM_ERROR');
    });
  });
});
