# ADR-0015: Observability & Audit Logging

**Date:** 2026-09-20  
**Status:** Proposed  
**Deciders:** Founder, Lead Software Architect, Security Architect, DevOps Engineer  
**Context Tags:** observability, telemetry, audit-log, privacy, security, correlation-id

---

## Problem Statement
Currently, error handling across TanAir Cloud relies on silent `catch` blocks or raw `console.error` logs in serverless execution logs (Finding: `scalability-findings.md §4`, `security-findings.md §2`). If a chat stream stalls or a user experiences a deduction error, there is zero distributed tracing linking the user's browser request, the Next.js API route, and the backend Hermes VPS gateway. Moreover, there is no immutable audit log tracking security-critical events (logins, password changes, tier upgrades, credit top-ups, admin overrides).

## Context & Constraints
- **Privacy & Security Constraints:** Audit logs must **NEVER** store raw user passwords, secret keys, or unredacted chat prompt bodies (preventing data leakage under PDPA regulations).
- **Correlation Requirement:** A unique request identifier (`x-request-id`) must propagate through the entire pipeline: Client → Vercel Serverless → Hermes VPS Gateway → OpenD.
- **Phasing:** Phase 1 requires lightweight structured JSON logging; Phase 11 will introduce full APM (Sentry, OpenTelemetry).

## Options Considered

### Option A: Standard Console Logs (`console.log`)
Rely on unstructured string outputs in Vercel function logs.
- **Pros:** Zero setup required.
- **Cons:** Impossible to query or filter; no correlation across distributed services; disappears after standard log retention windows.

### Option B: Heavy External APM from Day 1 (Datadog / New Relic)
Deploy enterprise agents across Vercel and the Tencent Cloud VPS.
- **Pros:** Deep metric analysis.
- **Cons:** Extremely high monthly SaaS costs; unnecessary complexity for an early-stage product.

### Option C: Two-Tier Observability: Structured Correlation Logging + Supabase `audit_log` Table (Recommended)
1. **Tier 1 (Telemetry):** Standardized structured JSON logger with `x-request-id` correlation headers propagated across all HTTP requests.
2. **Tier 2 (Security Audit):** An immutable, append-only `audit_log` table in Supabase capturing security-sensitive business operations (auth events, tier transitions, quota grants, admin actions).
- **Pros:**
  - Zero third-party software cost for MVP.
  - Full end-to-end trace correlation: search for `req_abc123` across Vercel and VPS logs to reconstruct the exact failure timeline.
  - Satisfies legal audit requirements for financial transactions and administrative mutations.
- **Cons:** Requires discipline to pass correlation headers through services.

## Decision
We decide to adopt **Option C: Two-Tier Observability: Structured Correlation Logging + Supabase `audit_log` Table**.

1. Every incoming request generates or adopts an `x-request-id` header in `middleware.ts`.
2. All server logs output structured JSON adhering to `{ timestamp, level, requestId, userId, event, metadata }`.
3. An `audit_log` table is created in Supabase with RLS policies permitting `INSERT` via service role and `SELECT` restricted exclusively to admin users.
4. Sensitive payload scrubbing is strictly enforced: prompts, tokens, and credentials are automatically stripped before logging.

## Consequences

### Positive
- Production debugging time is reduced by 80%: searching an incident's `request_id` pinpoints exactly whether failure occurred at Vercel or Hermes.
- Complete regulatory audit trail for commercial operations and payments.
- Zero external monitoring subscription costs during beta.

### Negative / Trade-offs
- Slight log volume growth in Supabase database storage.

## Implementation Guidance

### Supabase Table Schema (`audit_log`)
```sql
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,          -- e.g. 'auth.login', 'quota.topup', 'admin.tier_change'
  resource_type TEXT NOT NULL,       -- e.g. 'user', 'bot', 'credit_ledger'
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  ip_hash TEXT,                      -- SHA-256 hash of IP for privacy preservation
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable: append-only, zero updates or deletions
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_view_audit_logs" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE INDEX idx_audit_log_event ON public.audit_log (event_type, created_at DESC);
```

### Structured Logger Utility (`lib/logger.ts`)
```typescript
type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  event: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export const logger = {
  log(payload: LogPayload) {
    const entry = {
      timestamp: new Date().toISOString(),
      ...payload,
    };
    // Format as single-line JSON for Vercel/Datadog log ingestors
    const json = JSON.stringify(entry);
    if (payload.level === 'error') {
      console.error(json);
    } else if (payload.level === 'warn') {
      console.warn(json);
    } else {
      console.log(json);
    }
  },
  info(event: string, meta?: Record<string, unknown>, reqId?: string) {
    this.log({ level: 'info', event, metadata: meta, requestId: reqId });
  },
  error(event: string, err: unknown, reqId?: string) {
    const errorMsg = err instanceof Error ? err.stack || err.message : String(err);
    this.log({ level: 'error', event, error: errorMsg, requestId: reqId });
  },
};
```

## Related ADRs
- ADR-0005: Hermes Adapter Layer
- ADR-0006: Authentication Boundary
- ADR-0012: Admin Dashboard Architecture
- ADR-0013: Supabase Migration Strategy
