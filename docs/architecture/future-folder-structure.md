# TanAir Cloud — Target Folder Structure
## Architecture Documentation

**Version:** 0C  
**Date:** 2026-09-20  
**Author:** Antigravity (Lead Software Architect)  
**Evidence:** ARC-001 (God Component), ARC-002 (no adapter interfaces), ARC-004 (no type boundaries), ARC-010 (magic values)

---

## 1. Design Philosophy

The folder structure enforces **two complementary principles**:

1. **Vertical Feature Slices** — Each product capability (chat, bots, admin) owns its UI components, hooks, and local service calls. Features do not import from each other.

2. **Horizontal Layer Isolation** — Shared concern layers (domain types, adapter interfaces, repositories) exist below feature slices. Data only flows down (UI → Service → Domain → Repository/Adapter → External).

This maps exactly to **DEC-010**: `UI → Application Service → Domain → Repository/Adapter Interface → Implementation`.

---

## 2. Full Target Structure

```
tanair-cloud/
│
├── app/                          ← Next.js App Router root
│   ├── (public)/                 ← Unauthenticated route group
│   │   ├── layout.tsx            ← Public layout (no sidebar)
│   │   ├── page.tsx              ← Landing page hero
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   └── onboarding/
│   │       └── page.tsx
│   │
│   ├── (app)/                    ← Authenticated route group
│   │   ├── layout.tsx            ← AppShell (sidebar + header + auth guard)
│   │   ├── chat/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── bots/
│   │   │   ├── page.tsx          ← Bot list
│   │   │   └── [botId]/
│   │   │       └── page.tsx      ← Bot edit
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── (admin)/                  ← Admin-only route group
│   │   ├── layout.tsx            ← Admin layout (admin nav)
│   │   ├── admin/
│   │   │   ├── page.tsx          ← Admin overview
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   └── revenue/
│   │   │       └── page.tsx
│   │
│   ├── api/                      ← Server-side routes
│   │   ├── chat/
│   │   │   └── route.ts          ← Chat gateway proxy (thin handler)
│   │   ├── memory/
│   │   │   └── route.ts
│   │   ├── quota/
│   │   │   └── route.ts
│   │   ├── bots/
│   │   │   └── route.ts
│   │   └── admin/
│   │       └── route.ts
│   │
│   ├── error.tsx                 ← Route-level error boundary
│   ├── global-error.tsx          ← App-wide error boundary
│   ├── loading.tsx               ← Suspense fallback
│   ├── layout.tsx                ← Root layout (fonts, lang, metadata)
│   └── globals.css               ← Global design tokens
│
├── middleware.ts                 ← Auth + rate limit guard for /app/* /api/* /admin/*
│
│
├── features/                     ← Vertical product feature slices
│   ├── chat/                     ← Chat feature
│   │   ├── components/
│   │   │   ├── ChatShell.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── hooks/
│   │   │   ├── useChatStream.ts
│   │   │   └── useSessionManager.ts
│   │   └── index.ts              ← Public API of this feature
│   │
│   ├── agents/                   ← Agent selector feature
│   │   ├── components/
│   │   │   ├── AgentSelector.tsx
│   │   │   └── AgentCard.tsx
│   │   ├── data/
│   │   │   └── agents.config.ts  ← AGENTS array (moved from page.tsx)
│   │   └── index.ts
│   │
│   ├── auth/                     ← Auth feature
│   │   ├── components/
│   │   │   ├── AuthGate.tsx
│   │   │   └── LoginCard.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── index.ts
│   │
│   ├── memory/                   ← AI Memory feature
│   │   ├── components/
│   │   │   ├── MemoryPanel.tsx
│   │   │   └── MemoryChip.tsx
│   │   ├── hooks/
│   │   │   └── useMemory.ts
│   │   └── index.ts
│   │
│   ├── bots/                     ← Bot Studio feature
│   │   ├── components/
│   │   │   ├── BotList.tsx
│   │   │   ├── BotWizard.tsx
│   │   │   └── BotCard.tsx
│   │   ├── hooks/
│   │   │   └── useBotBuilder.ts
│   │   └── index.ts
│   │
│   ├── quota/                    ← Credits + Quota feature
│   │   ├── components/
│   │   │   ├── CreditsChip.tsx
│   │   │   └── QuotaWarning.tsx
│   │   ├── hooks/
│   │   │   └── useQuota.ts
│   │   └── index.ts
│   │
│   ├── trial/                    ← Trial Pro activation feature
│   │   ├── components/
│   │   │   ├── TrialBanner.tsx
│   │   │   └── TrialCountdown.tsx
│   │   ├── hooks/
│   │   │   └── useTrial.ts
│   │   └── index.ts
│   │
│   ├── profile/                  ← User Profile feature
│   │   ├── components/
│   │   │   ├── ProfileCard.tsx
│   │   │   └── ProfileEditor.tsx
│   │   ├── hooks/
│   │   │   └── useProfile.ts
│   │   └── index.ts
│   │
│   └── admin/                    ← Admin Dashboard feature
│       ├── components/
│       │   ├── UserTable.tsx
│       │   └── RevenueChart.tsx
│       ├── hooks/
│       │   └── useAdminData.ts
│       └── index.ts
│
│
├── components/                   ← Shared UI design system (feature-agnostic)
│   ├── ui/                       ← Primitives (atomic design)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Modal.tsx
│   │   ├── Sheet.tsx             ← Sidebar drawer
│   │   ├── Toast.tsx             ← Replaces alert()
│   │   └── Spinner.tsx
│   ├── layout/                   ← Structural components
│   │   ├── AppShell.tsx          ← Sidebar + header wrapper
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MobileDrawer.tsx
│   └── feedback/                 ← State feedback
│       ├── ErrorBoundary.tsx
│       ├── LoadingState.tsx
│       └── EmptyFeedback.tsx
│
│
├── domain/                       ← Core domain types (no external deps)
│   ├── types/
│   │   ├── message.ts            ← Message, MessageRole types
│   │   ├── session.ts            ← ChatSession type
│   │   ├── agent.ts              ← Agent, AgentId, AgentCapability types
│   │   ├── user.ts               ← User, UserProfile, UserTier types
│   │   ├── memory.ts             ← Memory type
│   │   ├── bot.ts                ← Bot, BotConfig types
│   │   ├── credit.ts             ← CreditBalance, LedgerEntry types
│   │   └── quota.ts              ← QuotaStatus, QuotaCheck types
│   └── constants/
│       ├── agents.ts             ← Agent IDs and metadata
│       ├── tiers.ts              ← Tier names and limits
│       └── routes.ts             ← Route paths as typed constants
│
│
├── services/                     ← Application services (orchestrate domain + adapters)
│   ├── chat.service.ts           ← Orchestrates HermesAdapter + QuotaService + AuditService
│   ├── auth.service.ts           ← Wraps Supabase auth operations
│   ├── quota.service.ts          ← Checks/deducts tokens from CreditRepository
│   ├── memory.service.ts         ← CRUD operations on memories
│   ├── entitlement.service.ts    ← Evaluates user tier and capability access
│   ├── trial.service.ts          ← Activates/checks trial Pro status
│   └── audit.service.ts          ← Writes structured audit log entries
│
│
├── adapters/                     ← Interfaces + implementations (Adapter Pattern)
│   ├── hermes/
│   │   ├── IHermesAdapter.ts     ← Interface: chat(), healthCheck()
│   │   ├── HermesGatewayAdapter.ts ← Real HTTPS gateway implementation
│   │   └── MockHermesAdapter.ts  ← Test / local dev implementation
│   └── storage/
│       ├── ISessionRepository.ts
│       ├── IMessageRepository.ts
│       ├── ICreditRepository.ts
│       ├── IProfileRepository.ts
│       ├── IBotRepository.ts
│       ├── IMemoryRepository.ts
│       ├── supabase/              ← Supabase implementations (Phase 10)
│       │   ├── SupabaseSessionRepository.ts
│       │   └── SupabaseMessageRepository.ts
│       └── memory/               ← In-memory implementations (Phase 4)
│           ├── MemorySessionRepository.ts
│           └── MemoryMessageRepository.ts
│
│
├── lib/                          ← Low-level shared utilities
│   ├── supabase-browser.ts       ← createBrowserClient() from @supabase/ssr
│   ├── supabase-server.ts        ← createServerClient() from @supabase/ssr
│   ├── config.ts                 ← All magic values: timeouts, limits, constants
│   ├── errors.ts                 ← Typed error classes (AuthError, QuotaError, etc.)
│   └── logger.ts                 ← Structured JSON logger with correlation IDs
│
│
├── supabase/                     ← Supabase project configuration
│   ├── migrations/               ← SQL migration files (Supabase CLI managed)
│   │   ├── 001_profiles.sql
│   │   ├── 002_sessions.sql
│   │   ├── 003_messages.sql
│   │   ├── 004_credit_ledger.sql
│   │   ├── 005_memories.sql
│   │   ├── 006_bots.sql
│   │   └── 007_audit_log.sql
│   ├── seed.sql                  ← Development seed data
│   └── config.toml               ← Supabase CLI config
│
│
├── docs/                         ← Architecture & audit documentation
│   ├── adr/                      ← Architecture Decision Records
│   ├── architecture/             ← System design documents
│   └── audit/                    ← Phase 0A/0B/0C audit reports
│
│
├── .github/
│   └── workflows/
│       ├── ci.yml                ← Lint + typecheck + test + build
│       └── deploy.yml            ← Vercel deployment (optional)
│
│
├── .env.example                  ← Documented env vars (no raw IPs, no secrets)
├── .env.local                    ← Local values (gitignored)
├── .nvmrc                        ← Node.js version: 22
├── .editorconfig
├── .prettierrc
├── next.config.ts                ← Security headers + image domains
├── tsconfig.json                 ← Strict mode (never weaken)
├── eslint.config.mjs
├── vitest.config.ts
├── playwright.config.ts
├── package.json
└── README.md                     ← Project README (not Next.js template)
```

---

## 3. Layer Rules: What Is Allowed and Forbidden

### `app/` — Next.js Route Layer
**Allowed:**
- Page components (server or client)
- Layout components
- API route handlers (thin — parse, validate, delegate, respond)
- Importing from `features/`, `components/`, `lib/`

**Forbidden:**
- Business logic in page files
- Direct Supabase calls in page files (use services)
- Direct Hermes fetch calls in page files
- Importing from `adapters/` or `repositories/` directly (use services)

---

### `features/` — Vertical Feature Slices
**Allowed:**
- React components specific to one feature
- React hooks that call application services
- Feature-specific local types
- Exporting a clean `index.ts` public API

**Forbidden:**
- One feature importing from another feature (`features/chat` cannot import `features/bots`)
- Direct database calls (use services)
- Direct Hermes calls (use ChatService)
- Business logic — delegate to `services/`

---

### `components/` — Shared Design System
**Allowed:**
- Reusable presentational components (Button, Input, Modal)
- Layout structural components (AppShell, Sidebar, Header)
- No feature-specific logic

**Forbidden:**
- Any Supabase imports
- Any Hermes imports
- Any business logic
- Any feature-specific props that make components non-reusable

---

### `domain/` — Domain Types & Constants
**Allowed:**
- TypeScript interfaces and type definitions
- Pure constants (no logic, no computations)
- Enums for type safety

**Forbidden:**
- Any imports from `services/`, `adapters/`, `lib/`, `features/`, `app/`
- Any runtime logic or class implementations
- Any external package imports (must be pure TypeScript)

---

### `services/` — Application Services
**Allowed:**
- Orchestrating multiple adapters and repositories
- Implementing business rules (quota checks, entitlement evaluation)
- Calling `adapters/` interfaces
- Importing from `domain/`

**Forbidden:**
- Direct Supabase client calls (use repositories)
- Direct Hermes fetch calls (use HermesAdapter)
- UI concerns (no React, no JSX)
- Importing from `features/` or `app/`

---

### `adapters/` — Interfaces + Implementations
**Allowed:**
- Interface definitions (`I*Adapter.ts`, `I*Repository.ts`)
- Concrete implementations of those interfaces
- Direct Supabase client calls (in Supabase implementations)
- Direct HTTP calls (in HermesGatewayAdapter)

**Forbidden:**
- Business logic (belongs in services)
- UI concerns
- Importing from `features/` or `app/`
- Implementations importing from each other

---

### `lib/` — Low-Level Utilities
**Allowed:**
- Supabase client factory functions
- Configuration constants
- Typed error classes
- Structured logger

**Forbidden:**
- Business logic
- Feature-specific code
- Direct feature or domain imports

---

### `supabase/` — Database Migrations
**Allowed:**
- SQL migration files
- Seed data
- Supabase CLI configuration

**Forbidden:**
- Application code
- TypeScript files (use `domain/types/` for TypeScript representations)
- Any secrets or credentials

---

## 4. Dependency Arrows (Simplified)

```
app/ → features/ → services/ → adapters/ → External (Supabase, Hermes)
                              → domain/
app/ → components/
lib/ ← services/
lib/ ← adapters/
domain/ ← (nobody imports into domain — it is the leaf)
```

**Rule:** Dependencies only point DOWN (or sideways to `lib/` and `domain/`). No upward imports. No circular imports.

---

## 5. Migration Plan from Current State

| Current | Future | Phase |
|---|---|---|
| `app/page.tsx` (657 lines) | `(app)/chat/page.tsx` (thin RSC) + `features/chat/` | Phase 2 |
| `AGENTS` array in `page.tsx` | `features/agents/data/agents.config.ts` | Phase 2 |
| Auth in `page.tsx` | `features/auth/hooks/useAuth.ts` + `middleware.ts` | Phase 1/2 |
| `lib/supabase.ts` (4 lines) | `lib/supabase-browser.ts` + `lib/supabase-server.ts` | Phase 1 |
| Hermes fetch in `route.ts` | `adapters/hermes/HermesGatewayAdapter.ts` | Phase 4 |
| Credits state in `page.tsx` | `features/quota/` + `adapters/storage/ICreditRepository.ts` | Phase 6 |
| No types directory | `domain/types/` | Phase 1 |
| No config constants | `lib/config.ts` | Phase 1 |

---

*End of Future Folder Structure — Phase 0C*

