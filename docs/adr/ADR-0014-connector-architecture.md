# ADR-0014: Connector Architecture

**Date:** 2026-09-20  
**Status:** Proposed  
**Deciders:** Founder, Lead Software Architect, Platform Engineer  
**Context Tags:** connectors, integrations, telegram, webhooks, edge-functions, supabase-vault

---

## Problem Statement
TanAir Cloud envisions connecting AI agents to external commercial channels: Telegram, WhatsApp, Email, Airtable, Google Sheets, and Facebook Pages (Finding: `existing-feature-matrix.md §9`, `project-input-review.md §14`). Directly handling asynchronous webhooks and storing third-party API keys within the core Next.js web application creates two major hazards: (1) third-party webhook floods could degrade web chat responsiveness, and (2) storing external API tokens in plaintext creates severe security exposure.

## Context & Constraints
- **Tier Entitlements:**
  - Free: 0 connectors.
  - Pro: Telegram Bot connector.
  - Empire: All connectors (Telegram, Email, Sheets, Airtable, Facebook).
- **Security:** Connector secrets (Telegram Bot Tokens, Google OAuth refresh tokens) must be encrypted at rest.
- **Resilience:** If Telegram API is down, core TanAir web chat must remain 100% operational.

## Options Considered

### Option A: Next.js API Route Webhook Handlers (`/api/webhooks/*`)
Handle incoming webhooks directly inside Next.js serverless functions.
- **Pros:** Co-located in the same Next.js repository.
- **Cons:** Serverless execution timeouts on long-running ReAct agent reasoning; increases Vercel serverless function invocation costs.

### Option B: Dedicated VPS Background Worker Daemon
Run long-polling Python bot processes directly on the Hermes VPS.
- **Pros:** Native Python environment.
- **Cons:** High RAM usage per active user bot; does not scale for hundreds of solopreneurs; restarts drop active connections.

### Option C: Serverless Webhooks via Supabase Edge Functions + Supabase Vault (Recommended)
Deploy isolated Deno/TypeScript Supabase Edge Functions as public webhook receivers. Store sensitive credentials inside Supabase Vault (PostgreSQL transparent column encryption). Disconnect ingress from inference by dispatching async requests to the Hermes gateway.
- **Pros:**
  - Complete fault isolation: webhook spikes cannot degrade Next.js frontend performance.
  - Encryption at rest: third-party API tokens are securely decrypted only in the database layer via Vault extension (`vault.decrypted_secrets`).
  - Scales automatically from 0 to millions of webhook hits with zero server maintenance.
- **Cons:** Requires managing Deno-based Edge Functions alongside Next.js.

## Decision
We decide to adopt **Option C: Serverless Webhooks via Supabase Edge Functions + Supabase Vault**.

1. Each third-party connector adheres to an `IConnector` contract defining setup, webhook payload parsing, and health verification.
2. Incoming webhook endpoints live under `supabase/functions/<connector-name>/` (e.g. `supabase/functions/telegram-webhook`).
3. External tokens are encrypted using Supabase Vault via pgsodium before storage in `bot_connectors`.
4. Connector failures trigger an automatic circuit breaker: after 5 consecutive delivery failures, the connector is flagged as `error` and alerts the user in their cockpit.

## Consequences

### Positive
- Military-grade secret protection: client-side JavaScript never has access to raw third-party integration secrets.
- Webhook traffic does not consume Vercel serverless execution limits.
- Clear user visibility: connector health status chips (Green/Yellow/Red) display directly inside the Bot Studio.

### Negative / Trade-offs
- Webhook endpoints must be tested using Supabase Edge Function testing tools or ngrok locally.

## Implementation Guidance

### Connector Schema with Supabase Vault
```sql
CREATE TABLE public.bot_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connector_type TEXT NOT NULL CHECK (
    connector_type IN ('telegram', 'whatsapp', 'email', 'airtable', 'google_sheets')
  ),
  secret_vault_id UUID,                -- Pointer to vault.secrets table
  config JSONB NOT NULL DEFAULT '{}',  -- Non-sensitive config (e.g. chat_id, sheet_id)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_connectors" ON public.bot_connectors
  FOR ALL USING (auth.uid() = user_id);
```

### Connector Interface Contract (`domain/types/connector.ts`)
```typescript
export interface ConnectorPayload {
  channelId: string;
  senderName: string;
  messageText: string;
  rawPayload: Record<string, unknown>;
}

export interface IConnector {
  readonly type: 'telegram' | 'whatsapp' | 'email' | 'airtable' | 'google_sheets';
  validateWebhookSignature(request: Request): Promise<boolean>;
  parseIncomingMessage(request: Request): Promise<ConnectorPayload>;
  sendOutgoingMessage(channelId: string, replyText: string): Promise<void>;
  checkHealth(connectorId: string): Promise<{ healthy: boolean; latencyMs: number }>;
}
```

## Related ADRs
- ADR-0011: Bot Studio Architecture
- ADR-0013: Supabase Migration Strategy
- ADR-0015: Observability & Audit Logging
