# Risk Register
## Phase 0B — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity (Lead Architect & Security Engineer)  
**Phase:** 0B — Audit & Risk Register  
**Framework:** Standard Risk Matrix (Severity × Likelihood = Risk Rating)

---

## 1. Summary of Identified Risks

| Severity | Count | Primary Areas |
|---|:---:|---|
| **Critical** | 6 | Security (Unauth API, Plain HTTP, Rate Limits, Exposed IP), CI/CD, Testing |
| **High** | 9 | Architecture (God Component, DEC-010), Scalability (SPOF), Accessibility, DevEx |
| **Medium** | 12 | State Management, Supabase Readiness, Input Validation, Client-side Env |
| **Low** | 8 | Code styling, error boundaries, font subsetting, doc gaps |
| **Total** | **35** | |

---

## 2. Risk Register Entries

---

### RR-SEC-001: Unauthenticated `/api/chat` Route
* **ID:** `RR-SEC-001`
* **Category:** Security
* **Severity:** Critical
* **Evidence:** `app/api/chat/route.ts` lines 1–121: No auth headers or session inspection before processing requests.
* **Affected Files:** `app/api/chat/route.ts`, `middleware.ts` (missing)
* **Impact:** Any external actor can spam or hijack Hermes agent capabilities, causing severe LLM cost burn and denial of service.
* **Likelihood:** High
* **Recommendation:** Implement Next.js `middleware.ts` with Supabase session validation and verify JWT before processing chat payloads.
* **Effort:** Small
* **Priority:** P1
* **Owner Suggestion:** Security Engineer / Backend Lead
* **Target Phase:** Phase 1

---

### RR-SEC-002: Plaintext HTTP Transport to Hermes VPS Gateway
* **ID:** `RR-SEC-002`
* **Category:** Security / Privacy
* **Severity:** Critical
* **Evidence:** `.env.example` line 6 (`NEXT_PUBLIC_GATEWAY_URL=http://43.134.124.127:9119`); HTTP fetch in `route.ts`.
* **Affected Files:** `.env.example`, `.env.local`, `app/api/chat/route.ts`
* **Impact:** Eavesdropping and Man-In-The-Middle (MITM) attacks; personal prompts and trading analysis exposed in cleartext across the public internet.
* **Likelihood:** High
* **Recommendation:** Put Hermes behind Cloudflare reverse proxy or Let's Encrypt TLS reverse proxy (Nginx/Caddy) terminating with HTTPS.
* **Effort:** Small
* **Priority:** P2
* **Owner Suggestion:** DevOps Engineer / Sysadmin
* **Target Phase:** Phase 1

---

### RR-SEC-003: Public Exposure of VPS IP Address in Git Repository
* **ID:** `RR-SEC-003`
* **Category:** Security
* **Severity:** Critical
* **Evidence:** `43.134.124.127:9119` committed directly in `.env.example` on GitHub `main` branch.
* **Affected Files:** `.env.example`
* **Impact:** Exposes VPS infrastructure to port scanning, brute-force attacks, and direct gateway bypass.
* **Likelihood:** High
* **Recommendation:** Redact IP in `.env.example` with generic placeholder and set up DNS domain with firewall rules allowing only Vercel egress IPs.
* **Effort:** Small
* **Priority:** P3
* **Owner Suggestion:** DevOps Engineer / SecOps
* **Target Phase:** Immediate / Phase 1

---

### RR-SEC-004: Lack of Rate Limiting & Abuse Prevention
* **ID:** `RR-SEC-004`
* **Category:** Security / Reliability
* **Severity:** Critical
* **Evidence:** Zero request throttling or concurrency limiting in `app/api/chat/route.ts`.
* **Affected Files:** `app/api/chat/route.ts`
* **Impact:** Denial of Service (DoS) of Hermes VPS and exhaustion of Vercel serverless function quotas.
* **Likelihood:** High
* **Recommendation:** Integrate `@upstash/ratelimit` or Vercel Edge Middleware IP rate limiter (e.g., 20 req/min per user).
* **Effort:** Medium
* **Priority:** P4
* **Owner Suggestion:** Backend Engineer
* **Target Phase:** Phase 1

---

### RR-TST-001: Absolute Zero Test Coverage
* **ID:** `RR-TST-001`
* **Category:** Testing
* **Severity:** Critical
* **Evidence:** Zero test runners, zero test files (`__tests__` absent), no `npm test` script in `package.json`.
* **Affected Files:** `package.json`, entire repository
* **Impact:** Every change risks breaking chat streaming, auth, or persona selection without warning. Violates Definition of Done.
* **Likelihood:** High
* **Recommendation:** Set up Vitest with React Testing Library, configure `npm test`, and write unit tests for chat and auth services.
* **Effort:** Medium
* **Priority:** P5
* **Owner Suggestion:** QA / Lead Frontend Engineer
* **Target Phase:** Phase 1

---

### RR-CICD-001: Absence of CI/CD Automated Validation Pipeline
* **ID:** `RR-CICD-001`
* **Category:** CI/CD / DevOps
* **Severity:** Critical
* **Evidence:** No `.github/workflows/` directory. Direct pushes to `main` go to Vercel production without quality gates.
* **Affected Files:** `.github/workflows/ci.yml` (missing)
* **Impact:** Broken builds, syntax errors, and lint regressions are deployed directly to production.
* **Likelihood:** High
* **Recommendation:** Create GitHub Actions CI workflow executing `lint`, `typecheck`, `test`, and `build` on pull requests.
* **Effort:** Small
* **Priority:** P6
* **Owner Suggestion:** DevOps Engineer
* **Target Phase:** Phase 1

---

### RR-ARC-001: Monolithic Single Component Architecture (God Component)
* **ID:** `RR-ARC-001`
* **Category:** Architecture
* **Severity:** High
* **Evidence:** `app/page.tsx` is 657 lines containing all UI layout, auth hooks, chat loops, and payment simulations.
* **Affected Files:** `app/page.tsx`
* **Impact:** Severe merge conflicts, brittle code changes, unmaintainable state, and blocker for onboarding/bot builder features.
* **Likelihood:** High
* **Recommendation:** Decompose into modular components under `components/sidebar/`, `components/chat/`, and `components/layout/`.
* **Effort:** Medium
* **Priority:** P7
* **Owner Suggestion:** Senior Frontend Engineer
* **Target Phase:** Phase 2

---

### RR-ARC-002: Direct Vendor Coupling Violating DEC-010
* **ID:** `RR-ARC-002`
* **Category:** Architecture
* **Severity:** High
* **Evidence:** Direct `supabase.auth.*` and `fetch('/api/chat')` calls inside `app/page.tsx` without interface abstractions.
* **Affected Files:** `app/page.tsx`, `lib/supabase.ts`
* **Impact:** Makes testing impossible without global network mocks; blocks future database migrations and vendor transitions.
* **Likelihood:** High
* **Recommendation:** Establish formal adapter interfaces (`IChatAdapter`, `IAuthAdapter`) and dependency inversion services.
* **Effort:** Medium
* **Priority:** P8
* **Owner Suggestion:** Software Architect
* **Target Phase:** Phase 4

---

### RR-SCA-001: Single-Node Hermes Instance Single Point of Failure (SPOF)
* **ID:** `RR-SCA-001`
* **Category:** Scalability / Infrastructure
* **Severity:** High
* **Evidence:** Single VPS IP hosting Master, Gateway, OpenD, and ReAct runtime simultaneously.
* **Affected Files:** Infrastructure / VPS deployment
* **Impact:** Total platform downtime if the VPS process crashes, reboots, or runs out of RAM.
* **Likelihood:** Medium
* **Recommendation:** Containerize the Hermes Gateway service with systemd auto-restart watchdog, and plan multi-worker backend deployment.
* **Effort:** Medium
* **Priority:** P9
* **Owner Suggestion:** DevOps Engineer
* **Target Phase:** Phase 4 / Phase 11

---

### RR-A11Y-001: Icon-Only Buttons Missing Accessible ARIA Names
* **ID:** `RR-A11Y-001`
* **Category:** Accessibility
* **Severity:** High
* **Evidence:** Multiple icon buttons (Send, Close Drawer, Menu) lack `aria-label` in `app/page.tsx`.
* **Affected Files:** `app/page.tsx`
* **Impact:** Screen reader users cannot identify or activate core actions (cannot submit messages or toggle navigation).
* **Likelihood:** High
* **Recommendation:** Add explicit `aria-label` attributes to all icon-only button elements.
* **Effort:** Trivial
* **Priority:** P10
* **Owner Suggestion:** Frontend Engineer
* **Target Phase:** Phase 1

---

### RR-A11Y-002: Missing Focus Rings and Focus Trap in Mobile Overlay
* **ID:** `RR-A11Y-002`
* **Category:** Accessibility
* **Severity:** High
* **Evidence:** Tailwind v4 reset suppresses default outline; no `focus-visible` ring on buttons; no focus trap in mobile sidebar.
* **Affected Files:** `app/globals.css`, `app/page.tsx`
* **Impact:** Fails WCAG 2.1 AA (SC 2.4.7 Focus Visible & SC 2.1.2 No Keyboard Trap); keyboard navigation severely hindered.
* **Likelihood:** High
* **Recommendation:** Add `:focus-visible` styles to `globals.css` and implement focus lock on mobile navigation drawer.
* **Effort:** Small
* **Priority:** P11
* **Owner Suggestion:** Frontend Engineer
* **Target Phase:** Phase 1 / Phase 2

---

### RR-DAT-001: Ephemeral In-Memory Chat & Session Persistence
* **ID:** `RR-DAT-001`
* **Category:** Data Model / UX
* **Severity:** High
* **Evidence:** `messages` and `sessions` stored purely in React `useState`; lost on page reload.
* **Affected Files:** `app/page.tsx`
* **Impact:** Severe user frustration and perceived unreliability as conversation context vanishes upon browser refresh.
* **Likelihood:** High
* **Recommendation:** Phase 4 local storage adapter with fallback, moving to Supabase PostgreSQL schema (`sessions`, `messages`) in Phase 10.
* **Effort:** Medium
* **Priority:** P12
* **Owner Suggestion:** Full Stack Engineer
* **Target Phase:** Phase 4 / Phase 10

---

### RR-DEV-001: No Code Formatting & Lint Automation (Prettier Missing)
* **ID:** `RR-DEV-001`
* **Category:** Developer Experience
* **Severity:** Medium
* **Evidence:** No `.prettierrc`, no `.editorconfig`, no formatting check scripts in `package.json`.
* **Affected Files:** Repository root, `package.json`
* **Impact:** Inconsistent styling, noisy pull request diffs, and formatting friction between engineers and AI agents.
* **Likelihood:** High
* **Recommendation:** Install Prettier + Tailwind plugin, create `.editorconfig`, and add `npm run format:check`.
* **Effort:** Trivial
* **Priority:** P13
* **Owner Suggestion:** Platform Engineer
* **Target Phase:** Phase 1

---

### RR-SEC-005: Exposed Client-Side Environment Variable `NEXT_PUBLIC_GATEWAY_URL`
* **ID:** `RR-SEC-005`
* **Category:** Security
* **Severity:** Medium
* **Evidence:** `route.ts` reads `NEXT_PUBLIC_GATEWAY_URL`, which leaks into browser JS bundle.
* **Affected Files:** `.env.example`, `app/api/chat/route.ts`
* **Impact:** Exposes internal backend gateway address to all site visitors inspecting client source.
* **Likelihood:** High
* **Recommendation:** Standardize exclusively on server-only `HERMES_GATEWAY_URL` and deprecate `NEXT_PUBLIC_` prefix for gateways.
* **Effort:** Trivial
* **Priority:** P14
* **Owner Suggestion:** Backend / Security
* **Target Phase:** Phase 1

---

### RR-ARC-003: Agent Selection Not Forwarded to Hermes Engine
* **ID:** `RR-ARC-003`
* **Category:** Architecture / Functional
* **Severity:** Medium
* **Evidence:** `route.ts` sends `{ message, session_id }` to Hermes; selected agent persona (`Aura-Trade`, `Aura-Pen`, etc.) is omitted.
* **Affected Files:** `app/api/chat/route.ts`
* **Impact:** Selected persona has no effect on real Hermes backend; user receives generic responses despite choosing specialized agents.
* **Likelihood:** High
* **Recommendation:** Update gateway payload schema to forward `agent_id` or `capability_hint` to Hermes ReAct engine.
* **Effort:** Small
* **Priority:** P15
* **Owner Suggestion:** Backend / AI Engineer
* **Target Phase:** Phase 4

---

### RR-PERF-001: Non-Abortable SSE Streams Causing Resource & Memory Leaks
* **ID:** `RR-PERF-001`
* **Category:** Performance
* **Severity:** Medium
* **Evidence:** `fetch('/api/chat')` inside `page.tsx` lacks `AbortController` binding on component unmount or rapid re-submission.
* **Affected Files:** `app/page.tsx`
* **Impact:** Zombie streaming connections consume client memory and keep backend serverless instances active unnecessarily.
* **Likelihood:** Medium
* **Recommendation:** Hook `AbortController.signal` into chat hook lifecycle and abort prior active streams before opening new requests.
* **Effort:** Small
* **Priority:** P16
* **Owner Suggestion:** Frontend Engineer
* **Target Phase:** Phase 4

---

### RR-DEV-002: Unpinned Runtime Environment & Node Version Drift
* **ID:** `RR-DEV-002`
* **Category:** Developer Experience / DevOps
* **Severity:** Medium
* **Evidence:** Missing `.nvmrc` and missing `"engines"` field in `package.json`.
* **Affected Files:** `package.json`
* **Impact:** Local developer environment mismatch with Vercel serverless deployment runtime (e.g., Node 18 vs Node 22).
* **Likelihood:** Medium
* **Recommendation:** Add `.nvmrc` locking Node.js 22 LTS and declare `"engines": { "node": ">=22.0.0" }` in `package.json`.
* **Effort:** Trivial
* **Priority:** P17
* **Owner Suggestion:** DevOps Engineer
* **Target Phase:** Phase 1

---

### RR-SEC-006: Hardcoded Supabase Project URL & Fallbacks
* **ID:** `RR-SEC-006`
* **Category:** Security / Architecture
* **Severity:** Medium
* **Evidence:** `lib/supabase.ts` line 3 hardcodes fallback URL `'https://goqqtdgilnxffjyqjflv.supabase.co'`.
* **Affected Files:** `lib/supabase.ts`
* **Impact:** Silent configuration errors if env vars fail; couples codebase directly to a specific development project.
* **Likelihood:** Low
* **Recommendation:** Enforce strict validation throwing startup errors if `NEXT_PUBLIC_SUPABASE_URL` is undefined.
* **Effort:** Trivial
* **Priority:** P18
* **Owner Suggestion:** Frontend Engineer
* **Target Phase:** Phase 1

---

### RR-ARC-004: Missing Global Error and Loading Boundaries
* **ID:** `RR-ARC-004`
* **Category:** Architecture / Reliability
* **Severity:** Low
* **Evidence:** No `app/error.tsx`, `app/global-error.tsx`, or `app/loading.tsx`.
* **Affected Files:** `app/` root directory
* **Impact:** Uncaught runtime exceptions produce blank screens rather than graceful recovery or contextual error views.
* **Likelihood:** Medium
* **Recommendation:** Introduce standard Next.js App Router error and suspense boundaries with retry capability.
* **Effort:** Small
* **Priority:** P19
* **Owner Suggestion:** Frontend Engineer
* **Target Phase:** Phase 2

---

### RR-DEV-003: Default Next.js Template `README.md`
* **ID:** `RR-DEV-003`
* **Category:** Developer Experience
* **Severity:** Low
* **Evidence:** Root `README.md` is vanilla `create-next-app` boilerplate.
* **Affected Files:** `README.md`
* **Impact:** Poor onboarding for team members and collaborators; zero operational guidance on project setup.
* **Likelihood:** High
* **Recommendation:** Replace with production README documenting architecture, prerequisites, env setup, and commands.
* **Effort:** Small
* **Priority:** P20
* **Owner Suggestion:** Lead DevOps / Documentation
* **Target Phase:** Phase 1

---

*End of Risk Register — Phase 0B*

