# ADR-0011: Bot Studio Architecture

**Date:** 2026-09-20  
**Status:** Proposed  
**Deciders:** Founder, Lead Software Architect, Platform Engineer  
**Context Tags:** bot-builder, bot-studio, custom-agents, telegram, edge-functions

---

## Problem Statement
TanAir Cloud plans to empower Malaysian business owners to build their own autonomous custom bots (Bot Studio) with tailored personalities, business knowledge, and Telegram channels (Finding: `existing-feature-matrix.md §9`). Creating a custom execution runtime for every user bot would introduce immense server infrastructure overhead and cost. We need an architecture that allows dynamic bot creation while sharing the core Hermes reasoning engine safely under multi-tenant isolation.

## Context & Constraints
- **Tier Entitlements:**
  - Free: 0 bots.
  - Pro: Up to 3 active bots.
  - Empire: Up to 10 active bots.
- **Bot Creation Wizard:** 3-step configuration: (1) Identity & Persona, (2) Specialized Skills & Knowledge, (3) Channels & Triggers (Telegram bot token, webhooks).
- **Security:** Bot tokens and third-party secrets must never be exposed to other tenants or client-side bundles.

## Options Considered

### Option A: Dedicated Docker Container per Bot
Spin up an isolated container for each user bot on the VPS.
- **Pros:** Full runtime isolation.
- **Cons:** Extremely heavy memory overhead; cannot scale beyond a few dozen bots on a single VPS; slow startup times.

### Option B: Declarative Prompt & Tool Configuration over Shared Hermes Engine (Recommended)
Model bots as declarative rows in a Supabase `bots` table. When a bot is invoked (via web chat or external Telegram webhook), dynamically construct an ephemeral execution context, merge the bot's custom system prompt, and dispatch it to the shared Hermes ReAct engine.
- **Pros:**
  - Near-zero resource footprint when bots are idle.
  - Scales to thousands of bots without infrastructure cost increases.
  - Reuses the existing `IHermesAdapter` streaming pipeline.
  - Channels (Telegram) are handled by lightweight serverless Supabase Edge Functions.
- **Cons:** Bots must operate within the capability boundaries supported by the Hermes ReAct engine.

## Decision
We decide to adopt **Option B: Declarative Prompt & Tool Configuration over Shared Hermes Engine**.

1. **Storage:** Bot specifications are persisted in a `bots` table in Supabase, linked to `user_id` with strict RLS policies.
2. **Execution:** The Bot Studio UI provides an interactive test sandbox (`BotPreviewChat.tsx`). When chatting with a custom bot, `ChatService` loads the bot's prompt overrides and dispatches the session to `IHermesAdapter`.
3. **Channel Ingress:** External channels (Telegram Bot API) route incoming webhook updates to a dedicated Supabase Edge Function (`/functions/telegram-webhook`). The function validates the bot token, extracts the message, authenticates the bot's owner, asserts quota balance, and queries Hermes.
4. **Limits:** Enforce bot count restrictions (`Pro <= 3`, `Empire <= 10`) at the Application Service layer.

## Consequences

### Positive
- Solopreneurs can deploy custom Telegram business assistants in minutes without server setup.
- Compute is 100% pay-as-you-go; idle bots consume zero CPU or RAM.
- Strict tenant isolation enforced by PostgreSQL RLS on the `bots` table.

### Negative / Trade-offs
- Background scheduled tasks (e.g. daily cron triggers) require integration with Supabase `pg_cron` in Phase 7.

## Implementation Guidance

### Supabase Table Schema (`bots`)
```sql
CREATE TABLE public.bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '🤖',
  system_prompt TEXT NOT NULL,
  selected_skills TEXT[] NOT NULL DEFAULT '{}',  -- e.g. ['bursa_market', 'copywriting_bm']
  telegram_token_encrypted TEXT DEFAULT NULL,    -- Stored encrypted
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_bots" ON public.bots
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_bots_user ON public.bots (user_id);
```

### Bot Studio 3-Step Wizard Flow
```
Step 1: Identiti Ejen
  ├── Nama Bot (cth: "Pembantu Daging Salai")
  ├── Emoji / Avatar
  └── Nada Bahasa (cth: "Mesra & Santai Bahasa Melayu")

Step 2: Kemahiran & Pengetahuan
  ├── Pilih Kemahiran Asas (Aura-Pen Copywriting, Khidmat Pelanggan)
  └── Arahan Khusus / FAQ Perniagaan

Step 3: Saluran & Pelancaran
  ├── Uji dalam Kotak Pratonton Langsung
  ├── Sambung ke Telegram (Masukkan Bot Token)
  └── Aktifkan Bot
```

## Related ADRs
- ADR-0004: Repository Pattern
- ADR-0005: Hermes Adapter Layer
- ADR-0007: Authorization Boundary
- ADR-0014: Connector Architecture
