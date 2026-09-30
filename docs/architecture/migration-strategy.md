# TanAir Cloud — Migration Strategy
## Architecture Documentation

**Version:** 0C  
**Date:** 2026-09-20  
**Author:** Antigravity (Lead Software Architect)  
**Evidence:** ARC-001 (God Component), RR-DAT-001 (ephemeral state), ADR-0004 (Repository Pattern), ADR-0013 (Supabase Migration)

---

## 1. Overview

TanAir Cloud's migration strategy is anchored around two major transitions:

1. **Code Architecture Migration** — Decomposing the prototype (657-line `page.tsx`) into a layered, modular architecture without breaking existing functionality.

2. **Data Persistence Migration** — Moving from ephemeral in-memory React state to Supabase-backed persistent storage via the Repository Pattern.

Both migrations are **non-destructive** — the application remains functional throughout, using the Repository Pattern to swap implementations without changing consumers.

---

## 2. Core Migration Principle: The Repository Swap

The Repository Pattern (ADR-0004) makes the Supabase migration non-breaking:

```
Phase 4 (In-memory implementations):
  ChatService → IMessageRepository → MemoryMessageRepository (React state / localStorage)

Phase 10 (Supabase implementations):
  ChatService → IMessageRepository → SupabaseMessageRepository (PostgreSQL + RLS)
```

**The ChatService, UI components, and hooks are unchanged.** Only the injected implementation changes.

---

## 3. Code Architecture Migration

### Phase 1: Foundation (Security + Tooling)
**What changes:** Tooling, middleware, lib/ utilities  
**What stays the same:** `app/page.tsx` (untouched), `app/api/chat/route.ts` (thin auth wrapper added), existing Vercel deployment

```
Current → Target:
lib/supabase.ts → lib/supabase-browser.ts + lib/supabase-server.ts
(nothing) → middleware.ts
(nothing) → lib/config.ts
(nothing) → domain/types/
(nothing) → .nvmrc, .prettierrc, .editorconfig
(nothing) → .github/workflows/ci.yml
```

**Risk:** Low. Auth wrapper on `/api/chat` is additive.

---

### Phase 2: Design System + App Shell Decomposition
**What changes:** `page.tsx` is decomposed feature by feature  
**Strategy:** Extract components one at a time; each extraction is a separate PR verified by tests

```
Step 1: Extract AGENTS config → features/agents/data/agents.config.ts
Step 2: Extract AgentSelector → features/agents/components/AgentSelector.tsx
Step 3: Extract ChatInput → features/chat/components/ChatInput.tsx
Step 4: Extract MessageList → features/chat/components/MessageList.tsx
Step 5: Extract Sidebar → components/layout/Sidebar.tsx
Step 6: Extract AuthGate → features/auth/components/AuthGate.tsx
Step 7: Extract AppShell → components/layout/AppShell.tsx (new layout.tsx)
Step 8: Remove (nearly empty) page.tsx → route to features
```

**Guiding rule:** Existing behaviour must be identical after each extraction. No feature changes during decomposition.

**Risk:** Medium. Each extraction PR must include component tests.

---

### Phase 4: Hermes Adapter Layer
**What changes:** `app/api/chat/route.ts` business logic extracted  
**Strategy:** Create HermesGatewayAdapter, update route.ts to be a thin delegation handler

```
Current route.ts (121 lines):
  → Parse → Check auth → Attempt Hermes → Fallback → Stream

Target route.ts (~30 lines):
  → Parse body
  → Validate with Zod
  → Await middleware session (from headers)
  → chatService.sendMessage(params)
  → Return stream

HermesGatewayAdapter handles:
  → HTTPS gateway call
  → Auth header injection
  → Retry / timeout / abort
  → agent forwarding
  → Error classification
```

---

## 4. Data Persistence Migration

### Current State (Prototype)
| Data | Storage | Durability |
|---|---|---|
| Chat messages | `useState<Message[]>` | Lost on refresh |
| Sessions | `useState<ChatSession[]>` | Lost on refresh |
| Credits balance | `useState("10.00")` | Lost on refresh |
| User identity | Supabase Auth session (localStorage cookie) | ✅ Persistent |

---

### Phase 4 Intermediate State (localStorage + In-Memory Repo)
| Data | Storage | Durability |
|---|---|---|
| Chat messages | `MemoryMessageRepository` (optionally persisted to localStorage) | Survives refresh |
| Sessions | `MemorySessionRepository` + localStorage | Survives refresh |
| Credits balance | In-memory + Supabase API call for real balance | ✅ Real balance server-side |
| User identity | Supabase Auth session | ✅ Persistent |

---

### Phase 10 Target State (Full Supabase)
| Data | Storage | Durability |
|---|---|---|
| Chat messages | `SupabaseMessageRepository` (PostgreSQL + RLS) | ✅ Permanent |
| Sessions | `SupabaseSessionRepository` | ✅ Permanent |
| Credits balance | `SupabaseCreditRepository` (append-only ledger) | ✅ Immutable ledger |
| User identity | Supabase Auth session | ✅ Persistent |
| User profile | `SupabaseProfileRepository` | ✅ Permanent |
| AI Memories | `SupabaseMemoryRepository` | ✅ Permanent |
| Bot definitions | `SupabaseBotRepository` | ✅ Permanent |
| Audit log | `SupabaseAuditRepository` | ✅ Immutable |

---

## 5. Supabase Schema Migration Sequence

Migrations run via Supabase CLI in sequence. Each migration is idempotent and transactional.

### Migration 001: `profiles` table
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'trial_pro', 'pro', 'empire')),
  trial_started_at TIMESTAMPTZ,
  trial_expires_at TIMESTAMPTZ,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Migration 002: `sessions` table
```sql
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Perbualan Baru',
  agent_id TEXT NOT NULL DEFAULT 'Aura',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_sessions" ON public.sessions
  USING (auth.uid() = user_id);
CREATE INDEX idx_sessions_user_id ON public.sessions (user_id, created_at DESC);
```

### Migration 003: `messages` table
```sql
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_id TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_messages" ON public.messages
  USING (auth.uid() = user_id);
CREATE INDEX idx_messages_session ON public.messages (session_id, created_at ASC);
```

### Migration 004: `credit_ledger` table (append-only)
```sql
CREATE TABLE public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_delta INTEGER NOT NULL,        -- positive = credit, negative = debit
  balance_after INTEGER NOT NULL,       -- snapshot balance after this entry
  event_type TEXT NOT NULL CHECK (event_type IN ('subscription', 'topup', 'chat_debit', 'image_debit', 'video_debit', 'refund', 'admin_adjustment')),
  reference_id UUID,                    -- message_id, payment_id, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable: no UPDATE or DELETE
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_ledger" ON public.credit_ledger
  FOR SELECT USING (auth.uid() = user_id);
-- INSERT is allowed via service_role only (no RLS insert policy for user role)
```

### Migration 005: `memories` table
```sql
CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('preference', 'context', 'goal', 'fact')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  source_message_id UUID REFERENCES public.messages(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_memories" ON public.memories
  USING (auth.uid() = user_id);
```

### Migration 006: `bots` table
```sql
CREATE TABLE public.bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_emoji TEXT,
  system_prompt TEXT,
  selected_skills TEXT[] DEFAULT '{}',
  channel_config JSONB DEFAULT '{}',
  schedule_config JSONB DEFAULT '{}',
  tier_required TEXT NOT NULL DEFAULT 'pro',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_bots" ON public.bots
  USING (auth.uid() = user_id);
```

### Migration 007: `audit_log` table
```sql
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),   -- nullable for system events
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_hash TEXT,                                   -- hashed, not raw IP
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable: append-only, no UPDATE/DELETE for non-admin
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_audit_log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

---

## 6. Environment Separation Plan

| Environment | Supabase Project | Vercel | Hermes |
|---|---|---|---|
| Local Dev | `tanair-dev` (new project) | localhost:3000 | Mock adapter or real VPS |
| Preview (PR) | `tanair-dev` | Vercel preview URL | Mock adapter |
| Staging | `tanair-staging` (new project) | Vercel staging URL | Real VPS (test env) |
| Production | `AuraAgentic` (existing) | Vercel production URL | Real VPS (production) |

**Phase 1 action:** Create `tanair-dev` Supabase project to stop local dev polluting production.

---

## 7. Rollback Plan

| Migration | Rollback Strategy |
|---|---|
| Code decomposition | Git revert — each extraction is a separate PR |
| `middleware.ts` auth | Remove from middleware, keep route handler auth as backup |
| Supabase schema | Each migration file has a paired `down.sql` reverting changes |
| Repository swap | Revert to in-memory implementation by changing DI injection |

---

*End of Migration Strategy — Phase 0C*

