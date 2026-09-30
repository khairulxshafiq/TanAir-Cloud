# TanAir Cloud — Implementation Roadmap
## Architecture Documentation

**Version:** 0C  
**Date:** 2026-09-20  
**Author:** Antigravity (Lead Software Architect)  
**Evidence:** Phase 0A/0B audit findings, risk register, remediation plan P1–P20

---

## Phase 1: Engineering Foundation

**Objective:** Harden the codebase and development environment before adding any product features. Stop the bleeding. Protect existing functionality.

**Duration Estimate:** 1–2 weeks

### Scope

| Item | Priority | Effort |
|---|---|---|
| Add `middleware.ts` — server-side Supabase JWT session validation on all `/api/*` routes | MUST | S |
| Install `@supabase/ssr` — enable server-side auth (replaces `@supabase/supabase-js` client-only) | MUST | S |
| Create `lib/supabase-browser.ts` + `lib/supabase-server.ts` | MUST | S |
| Add Zod validation to `/api/chat` route — message length, sessionId format, agent enum | MUST | S |
| Add rate limiting to `/api/chat` — 20 req/min per user via Upstash Redis or Vercel Edge Config | MUST | M |
| Replace `NEXT_PUBLIC_GATEWAY_URL` with server-only `HERMES_GATEWAY_URL` in route.ts | MUST | S |
| Redact raw VPS IP from `.env.example` — replace with domain placeholder | MUST | XS |
| Add HTTP security headers to `next.config.ts` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) | MUST | S |
| Replace `alert()` in `page.tsx` with inline error state | MUST | S |
| Remove hardcoded Supabase URL fallback from `lib/supabase.ts` | MUST | XS |
| Create `lib/config.ts` — extract all magic values (timeout, fallback delay, credits, endpoints) | MUST | S |
| Create `domain/types/` directory with `message.ts`, `session.ts`, `agent.ts`, `user.ts` | MUST | S |
| Add `.nvmrc` (Node 22), `engines` field in `package.json` | MUST | XS |
| Add Prettier + `prettier-plugin-tailwindcss`, `.prettierrc`, `.editorconfig` | MUST | S |
| Add `typecheck` script: `"typecheck": "tsc --noEmit"` | MUST | XS |
| Install Vitest + React Testing Library, add `test` script | MUST | S |
| Create GitHub Actions CI: `lint → typecheck → test → build` | MUST | S |
| Enable GitHub branch protection on `main` (require PR + CI pass) | MUST | XS |
| Replace `README.md` with project-specific documentation | MUST | S |
| Add `app/error.tsx` and `app/global-error.tsx` error boundaries | SHOULD | S |
| Add ARIA labels to icon-only buttons (Send, Close Drawer, Menu) | SHOULD | XS |
| Add `:focus-visible` global CSS rule | SHOULD | XS |
| Add `aria-live="polite"` on message stream container | SHOULD | XS |
| Add `motion-reduce:animate-none` on `animate-ping` element | SHOULD | XS |
| Add `aria-label` to textarea | SHOULD | XS |
| Create a separate `tanair-dev` Supabase project for local dev | COULD | M |

### Dependencies
- None (Phase 1 can start immediately after Phase 0C approval)

### Risks
- `@supabase/ssr` migration requires removing client-only `@supabase/supabase-js` or ensuring both coexist
- Rate limiting requires an Upstash Redis account or alternative (Vercel KV, in-memory per-instance fallback)
- GitHub branch protection must not block the founder's solo workflow

### Exit Criteria
- ✅ `middleware.ts` exists with Supabase session validation
- ✅ `/api/chat` returns 401 for unauthenticated requests
- ✅ Rate limiting active and tested
- ✅ `npm run lint` passes with zero violations
- ✅ `npm run typecheck` passes with zero errors
- ✅ `npm run test` runs (passes even with minimal tests)
- ✅ `npm run build` passes
- ✅ GitHub CI workflow runs on every PR
- ✅ No raw VPS IP in `.env.example`

---

## Phase 2: Design System + App Shell Decomposition

**Objective:** Decompose `page.tsx` (God Component) into modular architecture. Establish shared design system. Migrate from single route to App Router route groups.

**Duration Estimate:** 2–3 weeks

### Scope
- Create App Router route groups: `(public)`, `(app)`, `(admin)`
- Create `app/(app)/layout.tsx` — AppShell with sidebar + auth guard
- Create `app/(app)/chat/page.tsx` — thin page using `features/chat/`
- Extract `features/auth/` — AuthGate, useAuth hook
- Extract `features/chat/` — ChatShell, MessageList, MessageBubble, ChatInput, EmptyState
- Extract `features/agents/` — AgentSelector, AgentCard, agents.config.ts
- Extract `components/ui/` — Button, Input, Textarea, Badge, Toast (replaces `alert()`)
- Extract `components/layout/` — AppShell, Sidebar, Header, MobileDrawer
- Add focus trap to mobile sidebar drawer (MobileDrawer)
- Implement Zustand for global auth + quota state
- Add `app/loading.tsx` Suspense fallback

### Dependencies
- Phase 1 must be complete (`middleware.ts`, Supabase SSR, types)

### Risks
- Decomposition introduces regressions in existing chat functionality
- React 19 + RSC + streaming requires careful "use client" boundary management

### Exit Criteria
- ✅ `app/page.tsx` is < 50 lines (thin delegation only)
- ✅ All existing functionality (auth, chat, session management, agent selector) works identically
- ✅ No `page.tsx` imports vendor SDKs directly
- ✅ Shared components exist in `components/`
- ✅ Feature slice in `features/`
- ✅ All component tests pass

---

## Phase 3: Landing Page + Onboarding

**Objective:** Build the public-facing landing page and guided onboarding flow for new users.

**Duration Estimate:** 2–3 weeks

### Scope
- `app/(public)/page.tsx` — Landing page: Hero, Features, Agents showcase, Pricing, CTA
- Aura Core 3D neural element (Three.js with static fallback — DEC-009)
- `app/(public)/onboarding/page.tsx` — 3-step onboarding: name/profession, goals, first agent pick
- Privacy Policy + Terms of Service pages (required for PDPA compliance — SEC-012)
- Cookie Policy + consent banner
- SEO metadata (`app/layout.tsx` enhancements)
- Open Graph image

### Dependencies
- Phase 2 complete (AppShell, auth, design system components)
- Founder provides: brand identity (logo, colors), feature copy in BM, pricing (final numbers)

### Risks
- Three.js animation performance on mobile — fallback is critical
- `01_PROJECT_INPUT.md` pricing fields still `[ISI]` — must be resolved before this phase

### Exit Criteria
- ✅ Public landing page renders without auth
- ✅ Google OAuth login button on landing page works
- ✅ New user is directed to onboarding before chat
- ✅ Privacy Policy and ToS pages exist

---

## Phase 4: Chat + Hermes Production Integration

**Objective:** Connect chat UI fully to Hermes gateway with proper auth, agent routing, streaming abort, and fallback. Implement Repository Pattern for sessions and messages (in-memory implementations).

**Duration Estimate:** 3–4 weeks

### Scope
- Create `adapters/hermes/IHermesAdapter.ts` interface
- Create `adapters/hermes/HermesGatewayAdapter.ts` — HTTPS, shared secret, agent forwarding
- Create `adapters/hermes/MockHermesAdapter.ts` — for local dev and testing
- Create `adapters/storage/IMessageRepository.ts`, `ISessionRepository.ts`
- Create `adapters/storage/memory/MemoryMessageRepository.ts` (localStorage-backed)
- Create `services/chat.service.ts` — orchestrates HermesAdapter + Quota + Audit
- Refactor `app/api/chat/route.ts` — thin (parse → validate → delegate to ChatService → stream)
- Forward `agent_id` to Hermes gateway (fix RR-ARC-003)
- Forward authenticated user JWT to Hermes (SEC-006)
- Implement `AbortController` for stream cancellation (PERF-008)
- Add `useChatStream` hook with proper cleanup on unmount
- Implement message persistence via MemoryMessageRepository (survives session switch)
- Per-session message state (`Record<sessionId, Message[]>`)
- VPS HTTPS setup: Cloudflare proxy or Nginx + Let's Encrypt on port 9119

### Dependencies
- Phase 2 complete (feature slice structure exists)
- VPS SSL certificate obtained (external)
- Hermes inbound auth token agreed with founder

### Risks
- Hermes streaming protocol may not match expected SSE format exactly
- Agent routing API contract with Hermes engine needs confirmation
- HTTPS transition on VPS requires coordination with VPS operator

### Exit Criteria
- ✅ All chat messages go over HTTPS
- ✅ `/api/chat` validates Supabase session before forwarding to Hermes
- ✅ Selected agent is forwarded to Hermes as `agent_id` or `capability_hint`
- ✅ Session switch correctly shows per-session message history
- ✅ Stream can be aborted mid-response
- ✅ MockHermesAdapter used in all tests

---

## Phase 5: Profile + AI Memory

**Objective:** User profile editing and the AI Memory system (user-controlled, explicitly approved).

**Duration Estimate:** 2–3 weeks

### Scope
- `app/(app)/profile/page.tsx` — profile view and edit
- `features/profile/` — ProfileEditor, ProfileCard, useProfile hook
- `adapters/storage/IProfileRepository.ts` + `MemoryProfileRepository.ts`
- `adapters/storage/IMemoryRepository.ts` + `MemoryMemoryRepository.ts` (in-memory)
- `services/memory.service.ts` — CRUD for memories
- `features/memory/` — MemoryPanel, MemoryChip, useMemory hook
- Memory injection into Hermes chat payload (as system context prefix)
- Memory suggestion UI after chat (user approves/rejects)
- Avatar upload — Supabase Storage bucket (`avatars`)

### Dependencies
- Phase 4 complete (ChatService with Hermes adapter wired)
- Supabase Storage bucket for avatars

### Risks
- Memory injection increases token consumption — must account for in quota calculation
- Sensitive categories (medical, financial) must never be auto-extracted

### Exit Criteria
- ✅ User can set display name, avatar, bio, profession, goals
- ✅ Memories can be added, viewed, and deleted
- ✅ Active memories are injected into every Hermes request
- ✅ User is shown memory suggestion UI at end of conversation (not auto-saved)

---

## Phase 6: Trial Pro + Token Quota Engine

**Objective:** Implement real server-side quota enforcement. Activate Trial Pro system.

**Duration Estimate:** 3–4 weeks

### Scope
- `services/quota.service.ts` — check and deduct token balance
- `services/entitlement.service.ts` — evaluate user tier and capability permissions
- `services/trial.service.ts` — Trial Pro activation and expiry
- `adapters/storage/ICreditRepository.ts` + `MemoryCreditRepository.ts`
- Quota check middleware (before forwarding to Hermes)
- Quota deduction on stream completion (with token count from Hermes response)
- `features/quota/` — CreditsChip (real balance), QuotaWarning, top-up CTA
- `features/trial/` — TrialBanner, TrialCountdown
- Trial Pro activation flow (on first agent click if eligible)
- Payment gateway integration: Billplz or Stripe (top-up only initially)
- API route `/api/quota` for balance query

### Dependencies
- Phase 5 complete (user profile / entitlement basis)
- Payment gateway account credentials
- Hermes returns token usage count in stream completion event

### Risks
- Token count from Hermes may not be accurately reported — fallback estimation needed
- Payment integration requires compliance with payment gateway T&C and banking regulations

### Exit Criteria
- ✅ Token balance is real (from server), not simulated
- ✅ Chat is blocked with clear UI message when quota exhausted
- ✅ Trial Pro timer visible and accurate
- ✅ Trial correctly reverts to Free on expiry
- ✅ Top-up flow operational (even if manual/bank transfer initially)

---

## Phase 7: Bot Studio

**Objective:** Bot Builder wizard allowing users to create custom AI bots with personas, skills, and channels.

**Duration Estimate:** 4–6 weeks

### Scope
- `app/(app)/bots/page.tsx` — Bot list
- `app/(app)/bots/[botId]/page.tsx` — Bot detail / edit
- `features/bots/` — BotList, BotWizard (3-step), BotCard, BotPreviewChat
- `adapters/storage/IBotRepository.ts` + `MemoryBotRepository.ts`
- `services/bot.service.ts` — CRUD for bots, bot execution via HermesAdapter
- Tier limit enforcement (Free=0, Pro=3, Empire=10 bots)
- Bot channel: Telegram integration via Supabase Edge Function webhook
- Bot schedule: pg_cron or Supabase scheduled functions

### Dependencies
- Phase 6 complete (entitlement system for tier-based bot limits)
- Supabase Edge Functions available

### Risks
- Telegram Bot API rate limits and webhook reliability
- Bot schedule execution requires backend infra (pg_cron, not just frontend)
- Complex wizard UI (3 steps) — detailed UX specification needed from founder

### Exit Criteria
- ✅ User can create, edit, and delete bots (within tier limit)
- ✅ Bot system prompt is correctly prepended in Hermes requests
- ✅ At least one channel (Telegram) operational
- ✅ Bot preview chat works in-browser before deployment

---

## Phase 8: Admin Dashboard

**Objective:** Internal admin dashboard for founder/operator to monitor platform health and users.

**Duration Estimate:** 3–4 weeks

### Scope
- `app/(admin)/admin/page.tsx` — Admin overview
- `app/(admin)/admin/users/page.tsx` — User list, tier management
- `app/(admin)/admin/revenue/page.tsx` — Revenue from transactions
- `features/admin/` — UserTable, RevenueChart, SystemHealth panel
- Admin access: `is_admin=true` in profiles, enforced in middleware + RLS
- Admin uses Supabase service-role client (server components only)
- Audit log viewer

### Dependencies
- Phase 10 complete (Supabase schema, real data)
- Supabase service-role key secured on server only

### Risks
- Admin accidentally uses client-side Supabase with service-role key — NEVER allowed
- Revenue data privacy — must be properly scoped

### Exit Criteria
- ✅ Admin route returns 403 for non-admin users at middleware level
- ✅ Founder can view all users and their tiers
- ✅ Audit log viewable
- ✅ No service-role key ever reaches browser

---

## Phase 9: Connector Layer

**Objective:** Connect bots to external platforms and services via webhooks and scheduled triggers.

**Duration Estimate:** 4–6 weeks

### Scope
- Supabase Edge Functions for Telegram, Email, Airtable, Google Sheets, Facebook connectors
- Connector secrets stored in Supabase Vault
- Connector health dashboard in Bot Studio
- Connector API: `/api/connectors/[type]/webhook`
- Tier-gated: Pro=Telegram only, Empire=all

### Dependencies
- Phase 7 complete (Bot Studio)
- Supabase Vault configured
- Third-party API developer accounts (Telegram, Airtable, etc.)

### Risks
- Connector reliability depends on third-party availability
- Supabase Edge Function cold start latency for webhooks

### Exit Criteria
- ✅ Telegram webhook operational
- ✅ Connector failure is isolated (does not affect chat)
- ✅ Secrets stored in Vault, never in DB plaintext

---

## Phase 10: Supabase Production Readiness

**Objective:** Swap all in-memory repository implementations with production Supabase implementations. Run migrations. Verify RLS.

**Duration Estimate:** 3–4 weeks

### Scope
- Run all 7 SQL migrations on production Supabase
- Implement all `Supabase*Repository` classes
- Swap DI container to use Supabase implementations
- Full RLS audit and penetration test (attempt cross-user data access)
- Supabase backup configuration
- Database indexes review and optimization
- Staging environment smoke test before production migration
- Data migration from localStorage/in-memory to Supabase for existing users

### Dependencies
- All previous phases complete
- Migration scripts validated on staging environment
- Supabase Pro plan (or Dedicated Compute for production traffic)

### Risks
- RLS misconfiguration could expose user data across tenants
- Migration of existing user sessions/credits requires careful data transfer

### Exit Criteria
- ✅ All data persists across page refreshes (zero in-memory dependencies)
- ✅ Cross-user RLS penetration test passes
- ✅ Supabase automated backups configured
- ✅ All queries have appropriate indexes

---

*End of Implementation Roadmap — Phase 0C*

