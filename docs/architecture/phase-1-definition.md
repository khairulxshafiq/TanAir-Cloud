# TanAir Cloud — Phase 1 Definition
## Engineering Foundation — Exact Scope

**Version:** 0C  
**Date:** 2026-09-20  
**Author:** Antigravity (Lead Software Architect, Security Architect, Platform Engineer)  
**Evidence:** SEC-001 through SEC-012, RR-SEC-001 through RR-CICD-001, remediation-plan.md P1–P14

> **Important:** This document defines Phase 1 scope precisely. It does NOT implement anything.  
> No features. No architecture refactors. No Supabase schema changes. Security hardening + tooling only.

---

## 1. What Phase 1 Is

Phase 1 is **Engineering Foundation** — the set of changes that transform the prototype from "demo quality" to "safe to show real users." It is not about building features. It is about:

1. Plugging security holes that could expose the system to abuse before any real user exists
2. Establishing the developer toolchain (formatter, linter, CI, tests) so every future change is validated
3. Creating the type infrastructure and utility scaffolding that later phases depend on
4. Making local development safe and independent from production

**Phase 1 touches existing files only minimally** — `next.config.ts`, `app/api/chat/route.ts`, `lib/supabase.ts`, and a handful of new files. `app/page.tsx` is changed only for the `alert()` replacement and ARIA quick-fixes.

---

## 2. MUST DO — Critical (Security)

These are blockers. TanAir must not accept real users without these in place.

---

### M-01: Add `middleware.ts` — Server-Side Auth Guard

**Files:**
- `middleware.ts` (NEW)
- Install `@supabase/ssr` package

**What it does:**
Intercepts all requests to `/api/*` and `/(app)/*` routes. Reads the Supabase session cookie. If no valid session exists, returns 401 for API routes and redirects to login for page routes.

**Implementation note:**
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create supabase server client with cookie access
  // Validate session
  // If API route + no session: return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // If page route + no session: redirect to /login
}
export const config = {
  matcher: ['/api/:path*', '/(app)/:path*', '/(admin)/:path*'],
};
```

**Evidence:** SEC-001, RR-SEC-001 (Critical), P1 in remediation plan

---

### M-02: Rate Limiting on `/api/chat`

**Files:**
- `app/api/chat/route.ts` (MODIFY — add rate limit check)
- Requires: Upstash Redis account OR Vercel KV

**What it does:**
Per-authenticated-user rate limit of 20 requests/minute on the chat endpoint. Returns 429 Too Many Requests when exceeded.

**Evidence:** SEC-003, RR-SEC-004 (Critical), P4 in remediation plan

---

### M-03: HTTPS + Domain for Hermes Gateway

**Files:**
- `.env.example` (MODIFY — redact IP, use domain placeholder)
- `.env.local` (MODIFY — update to HTTPS URL)
- `app/api/chat/route.ts` (MODIFY — minor: no code change needed if env var updated)
- VPS: Nginx SSL config OR Cloudflare proxy (external — not in code repo)

**What it does:**
Ensures all traffic between Vercel and Hermes gateway is encrypted over TLS.

**Code change (minimal):**
```env
# .env.example BEFORE:
NEXT_PUBLIC_GATEWAY_URL=http://43.134.124.127:9119

# .env.example AFTER:
HERMES_GATEWAY_URL=https://gateway.tanair.my
# (NEXT_PUBLIC_GATEWAY_URL removed — IP redacted from public repo)
```

**Evidence:** SEC-002, SEC-004, RR-SEC-002, RR-SEC-003 (Critical), P2, P3

---

### M-04: Remove `NEXT_PUBLIC_GATEWAY_URL` from Route

**Files:**
- `app/api/chat/route.ts` (MODIFY — remove `NEXT_PUBLIC_GATEWAY_URL` fallback)
- `lib/config.ts` (NEW — add `HERMES_GATEWAY_URL` with startup validation)

**What it does:**
Ensures gateway URL is server-only and never bundled into client JavaScript.

**Evidence:** SEC-005, RR-SEC-005 (High), P12

---

### M-05: Input Validation with Zod on `/api/chat`

**Files:**
- `app/api/chat/route.ts` (MODIFY — add Zod schema validation)
- Install `zod` package

**What it does:**
Validates request body before processing. Rejects malformed or oversized requests.

```typescript
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().max(100).optional().default('default'),
  agent: z.enum(['Aura','Aura-Trade','Aura-Pen','Aura-Art','Aura-Scout','Aura-Vision']).optional().default('Aura'),
});
```

**Evidence:** SEC-010, P4

---

### M-06: Add HTTP Security Headers

**Files:**
- `next.config.ts` (MODIFY — add `headers()` async function)

**What it does:**
Adds X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy headers to all responses.

**Evidence:** SEC-009, P1

---

### M-07: Fix Supabase Client — Remove Hardcoded URL

**Files:**
- `lib/supabase.ts` → rename to `lib/supabase-browser.ts` (MODIFY)
- `lib/supabase-server.ts` (NEW — uses `@supabase/ssr` `createServerClient`)

**What it does:**
Throws startup errors if env vars missing. Uses `@supabase/ssr` for server-side cookie-based sessions.

**Evidence:** SEC-008, RR-SEC-006 (Medium), P17

---

## 3. MUST DO — Critical (DevOps & Tooling)

These are required to make the project maintainable and ensure every future change is validated.

---

### M-08: GitHub Actions CI Pipeline

**Files:**
- `.github/workflows/ci.yml` (NEW)

**What it does:**
Runs on every push and PR to `main`. Steps: checkout → Node 22 setup → `npm ci` → lint → typecheck → test → build.

```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
      - run: npm test
```

**Evidence:** RR-CICD-001 (Critical), DEV-005, P6

---

### M-09: Add Vitest + React Testing Library

**Files:**
- `package.json` (MODIFY — add test, test:watch, test:coverage scripts)
- `vitest.config.ts` (NEW)
- Install: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`

**What it does:**
Establishes test runner. Phase 1 only needs configuration — tests themselves will be written incrementally.

**Evidence:** RR-TST-001 (Critical), DEV-004, P5

---

### M-10: Prettier + EditorConfig + Node Pinning

**Files:**
- `.prettierrc` (NEW)
- `.prettierignore` (NEW)
- `.editorconfig` (NEW)
- `.nvmrc` (NEW — content: `22`)
- `package.json` (MODIFY — add `format`, `format:check` scripts; add `engines` field)
- Install: `prettier`, `prettier-plugin-tailwindcss`

**Evidence:** DEV-001, DEV-002, DEV-003, P13, P14

---

### M-11: Add `typecheck` Script

**Files:**
- `package.json` (MODIFY — add `"typecheck": "tsc --noEmit"`)

**Evidence:** DEV-006

---

### M-12: Enable GitHub Branch Protection

**Action:** GitHub repository settings (not code)  
- Require PR before merging to `main`
- Require CI status checks to pass
- Prevent force push

**Evidence:** DEV-010, P6 (part of)

---

### M-13: Replace `README.md`

**Files:**
- `README.md` (OVERWRITE — full project-specific README)
- `CONTRIBUTING.md` (NEW)
- `SECURITY.md` (NEW)

**Evidence:** DEV-007, DEV-008, P19

---

## 4. MUST DO — Architecture Scaffolding

These create the foundations that Phase 2 and beyond will build upon.

---

### M-14: Create `domain/types/` Directory

**Files (all NEW):**
- `domain/types/message.ts`
- `domain/types/session.ts`
- `domain/types/agent.ts`
- `domain/types/user.ts`

**What it does:**
Moves inline interfaces `Message` and `ChatSession` from `page.tsx` into proper domain layer. Defines `UserTier` enum, `AgentId` type, etc.

**Evidence:** ARC-004, P1

---

### M-15: Create `lib/config.ts`

**Files:**
- `lib/config.ts` (NEW)

**What it does:**
Centralizes all magic values:
```typescript
export const HERMES_TIMEOUT_MS = 3500;
export const FALLBACK_STREAM_DELAY_MS = 25;
export const MAX_MESSAGE_LENGTH = 2000;
export const INITIAL_CREDITS = 10.00;
export const CREDIT_DEDUCTION_PER_MESSAGE = 0.02;
export const GATEWAY_URL = process.env.HERMES_GATEWAY_URL ?? (() => { throw new Error('HERMES_GATEWAY_URL required'); })();
```

**Evidence:** ARC-010, P1

---

### M-16: Create `lib/errors.ts`

**Files:**
- `lib/errors.ts` (NEW)

**What it does:**
Typed error classes for consistent error handling:
```typescript
export class AuthError extends Error { constructor(msg: string) { super(msg); this.name = 'AuthError'; } }
export class QuotaExceededError extends Error { ... }
export class HermesError extends Error { ... }
```

---

### M-17: Create `app/error.tsx` + `app/global-error.tsx`

**Files:**
- `app/error.tsx` (NEW)
- `app/global-error.tsx` (NEW)

**What it does:**
React error boundaries that show branded error screens instead of blank pages.

**Evidence:** ARC-008, RR-ARC-004

---

## 5. SHOULD DO — Accessibility Quick-Fixes

These are trivially small changes to `page.tsx` with zero risk. Deliver in Phase 1 alongside security work.

---

### S-01: Add ARIA Labels to Icon-Only Buttons
```tsx
<button aria-label="Hantar mesej" ...>
<button aria-label="Buka menu navigasi" ...>
<button aria-label="Tutup menu" ...>
```
**Evidence:** A11Y-001

### S-02: Add `:focus-visible` Global CSS
```css
/* app/globals.css */
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
```
**Evidence:** A11Y-002

### S-03: Add `aria-live="polite"` on Message Stream Container
```tsx
<div aria-live="polite" aria-label="Perbualan">
```
**Evidence:** A11Y-004

### S-04: Add `motion-reduce:animate-none` on Ping Animation
```tsx
<span className="... animate-ping motion-reduce:animate-none" />
```
**Evidence:** A11Y-005

### S-05: Add `aria-label` to Textarea
```tsx
<textarea aria-label={`Mesej kepada ${activeAgent}`} ...>
```
**Evidence:** A11Y-006

### S-06: Replace `alert()` with Inline Error State
Replace `alert("Ralat log masuk Google: " + error.message)` with an inline `errorMessage` useState that renders a styled error banner.

**Evidence:** SEC-007

---

## 6. COULD DO — Nice-to-Have (Phase 1 if time allows)

| Item | Evidence | Effort |
|---|---|---|
| Create separate `tanair-dev` Supabase project for local dev | RR-DAT-001, env-inventory | M |
| Add `CONTRIBUTING.md` with PR checklist | DEV-008 | S |
| Add `SECURITY.md` with vulnerability disclosure contact | DEV-008 | S |
| Add `lib/logger.ts` structured JSON logger | ADR-0015 | S |
| Add `jest-dom` matchers and first smoke test for `/api/chat` | RR-TST-001 | S |

---

## 7. Phase 1 — What Is Explicitly OUT OF SCOPE

| Item | Reason |
|---|---|
| Decompose `page.tsx` into feature slices | Phase 2 |
| Supabase database migrations | Phase 10 |
| Real quota/credits system | Phase 6 |
| Trial Pro activation flow | Phase 6 |
| Bot Studio | Phase 7 |
| Admin Dashboard | Phase 8 |
| Connector Layer | Phase 9 |
| Landing page / marketing site | Phase 3 |
| Onboarding flow | Phase 3 |
| Agent routing to Hermes (`agent_id`) | Phase 4 |
| Memory system | Phase 5 |
| HermesGatewayAdapter class | Phase 4 |
| Repository Pattern implementation | Phase 4 |
| Zustand state management | Phase 2 |
| Three.js neural core | Phase 3 |
| Dark/light theme toggle | Phase 2 |
| Chat message persistence | Phase 4/10 |

---

## 8. Phase 1 Acceptance Checklist

Before Phase 1 is considered complete and Phase 2 can begin, **all of the following must be true**:

```
Security:
[ ] middleware.ts exists and returns 401 for unauthenticated /api/* requests
[ ] POST /api/chat with no auth cookie returns 401
[ ] Rate limiting returns 429 after 20 req/min per user
[ ] Hermes gateway URL is HTTPS (not HTTP)
[ ] No raw VPS IP in .env.example
[ ] NEXT_PUBLIC_GATEWAY_URL removed from route.ts
[ ] Security headers present on all responses (X-Frame-Options, etc.)
[ ] Zod validates /api/chat request body (rejects >2000 char messages)
[ ] Supabase URL is not hardcoded in lib/supabase-browser.ts

DevOps:
[ ] npm run lint passes with 0 violations
[ ] npm run typecheck passes with 0 errors
[ ] npm run build passes
[ ] npm run test passes (even with minimal tests)
[ ] GitHub Actions CI workflow exists and runs on every PR
[ ] Branch protection enabled on main (requires PR + CI green)

Tooling:
[ ] .nvmrc exists with "22"
[ ] .prettierrc exists
[ ] .editorconfig exists
[ ] package.json has "engines": { "node": ">=22.0.0" }
[ ] package.json has "typecheck", "test", "format", "format:check" scripts

Architecture:
[ ] domain/types/ directory exists with message.ts, session.ts, agent.ts, user.ts
[ ] lib/config.ts exists with all magic values
[ ] lib/supabase-browser.ts + lib/supabase-server.ts exist
[ ] app/error.tsx + app/global-error.tsx exist

Accessibility:
[ ] Icon-only buttons have aria-label
[ ] :focus-visible style applied globally
[ ] aria-live on message stream container
[ ] animate-ping has motion-reduce variant
[ ] textarea has aria-label
[ ] No alert() calls in production code

Documentation:
[ ] README.md is project-specific (not Next.js template)
```

---

*End of Phase 1 Definition — Phase 0C*

