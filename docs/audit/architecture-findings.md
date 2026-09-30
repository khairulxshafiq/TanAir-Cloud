# Architecture Findings
## Phase 0B — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity (Software Architect)  
**Phase:** 0B — Audit & Risk Register  
**Evidence Source:** `app/page.tsx` (657 lines), `app/api/chat/route.ts` (121 lines), `lib/supabase.ts` (6 lines)

---

## 1. Executive Summary

TanAir Cloud's current architecture is a **functional prototype** that intentionally accepts technical debt to ship quickly. The core concern is that all application logic — auth, chat streaming, UI rendering, session management, state, and business rules — lives inside a single 657-line component (`page.tsx`). This is acceptable at prototype stage but is a **migration blocker** for every phase from Phase 2 onwards.

**Overall Architecture Score: 3/10** (Prototype — not production-grade)

---

## 2. Current Architecture Map

```
app/
├── page.tsx          ← ALL OF: UI, state, auth, chat, business logic (657 lines)
├── layout.tsx        ← Root layout (thin, correct)
├── globals.css       ← Design tokens (thin, acceptable)
└── api/
    └── chat/
        └── route.ts  ← Gateway proxy + fallback AI (121 lines)

lib/
└── supabase.ts       ← Single shared browser client (6 lines)
```

**What is missing:**
- No `components/` directory
- No `services/` or `lib/chat.ts`, `lib/auth.ts` adapters
- No `types/` directory
- No `hooks/` directory
- No `stores/` or state management layer
- No `middleware.ts`
- No domain boundary

---

## 3. Findings

---

### ARC-001 — Monolithic God Component

**Severity:** HIGH  
**Evidence:** `app/page.tsx` — 657 lines, single component, single export `CloudCockpit`

**Description:**  
The entire application is a single React component. It contains:
- Auth session management (Supabase subscriptions)
- Business logic (handleSendMessage, handleNewChat, handleLogout)
- Chat streaming (fetch + ReadableStream + SSE parser)
- Session list management
- Credit balance management
- UI rendering for 5+ distinct sections (sidebar, header, messages, footer, auth gate)
- Mobile layout state

**Impact:**  
Every future change risks breaking something unrelated. Adding a new feature requires modifying this one file. Testing is impossible without mounting the entire application. Violates Single Responsibility Principle.

**Affected Files:** `app/page.tsx`

**DEC-010 Violation:** Yes — UI directly accesses `supabase.*` and `fetch('/api/chat')` without adapter interfaces.

**Recommendation:**  
Decompose into:
```
components/
  sidebar/
    AgentSelector.tsx
    SessionList.tsx
    CreditsChip.tsx
  chat/
    MessageList.tsx
    MessageBubble.tsx
    ChatInput.tsx
    EmptyState.tsx
  layout/
    AppShell.tsx
    AuthGate.tsx

hooks/
  useAuth.ts
  useChatStream.ts
  useSessions.ts

services/
  chat.service.ts       ← wraps fetch('/api/chat')
  auth.service.ts       ← wraps supabase.auth.*
```

**Phase:** Phase 2 (decompose), Phase 4 (adapters)

---

### ARC-002 — No Adapter/Repository Interface (DEC-010 Violation)

**Severity:** HIGH  
**Evidence:** `page.tsx` lines 108, 119, 152, 167, 217 — direct calls to `supabase.*` and `fetch`

**Description:**  
As per DEC-010, the dependency direction must be:
```
UI → Application Service → Domain → Repository/Adapter Interface → Implementation
```

Current state:
```
UI (page.tsx) → supabase.auth.getSession()     [direct vendor call]
UI (page.tsx) → supabase.auth.signInWithOAuth() [direct vendor call]
UI (page.tsx) → fetch('/api/chat')              [direct transport call]
```

There is zero abstraction between the UI and its vendors (Supabase, HTTP). Migrating to a different auth provider or changing the chat API shape would require modifying the UI component directly.

**Impact:**  
- Migration from prototype to Supabase database (Phase 10) requires rewriting the UI
- Testing requires mocking `supabase` and `fetch` globally
- Swapping Hermes gateway requires touching UI code

**Affected Files:** `app/page.tsx`, `lib/supabase.ts`

**Recommendation:**  
Create `AuthAdapter` and `ChatAdapter` interfaces. Inject implementations. UI only calls adapter methods.

**Phase:** Phase 4

---

### ARC-003 — No Middleware (Auth Gap)

**Severity:** CRITICAL  
**Evidence:** No `middleware.ts` file exists. `app/api/chat/route.ts` has no auth check.

**Description:**  
Next.js App Router supports `middleware.ts` at the project root to intercept requests before they reach routes. Without it:
- `/api/chat` is completely open to unauthenticated HTTP callers
- Any future routes added (e.g. `/api/memory`, `/api/bots`) will also be open by default
- There is no server-side enforcement that a valid Supabase session exists

The current auth is purely cosmetic — it shows/hides UI elements in the browser but does not protect the server.

**Affected Files:** `app/api/chat/route.ts` (missing auth), `middleware.ts` (missing)

**Recommendation:**  
Add `middleware.ts` that validates the Supabase session cookie for all `/api/*` routes. Requires `@supabase/ssr` package.

**Phase:** Phase 1 (security hardening before first real user)

---

### ARC-004 — No TypeScript Type Boundaries

**Severity:** MEDIUM  
**Evidence:** Interfaces `Message` and `ChatSession` defined inline in `page.tsx` lines 22–34

**Description:**  
Domain types (`Message`, `ChatSession`) are defined inside the component file. When components are decomposed, these types will need to be moved and re-imported. There is no `types/` directory or centrally managed type layer.

Additionally:
- The API request/response shape for `/api/chat` is not typed with a shared schema
- No `zod` schema validates the request body in `route.ts`

**Affected Files:** `app/page.tsx`, `app/api/chat/route.ts`

**Recommendation:**  
Create `types/` directory with shared domain types. Add Zod schema for API route validation.

**Phase:** Phase 1

---

### ARC-005 — State Management is Flat and Unscalable

**Severity:** MEDIUM  
**Evidence:** 9 `useState` calls at lines 90–99 in `page.tsx`

**Description:**  
All application state is managed via flat `useState` hooks in the root component. As the app grows, this pattern leads to:
- Prop drilling (passing state through many component layers)
- Stale closure bugs in async handlers
- Re-renders of the entire component tree on any state change
- No state persistence strategy (everything resets on unmount)

The `credits` state is a `string` type (`useState("10.00")`) rather than a `number`, creating implicit parsing overhead.

**Affected Files:** `app/page.tsx`

**Recommendation:**  
Introduce a lightweight state manager (`zustand` or React Context) for cross-component concerns (auth, credits, active agent). Local state (input, streaming) can remain local.

**Phase:** Phase 2

---

### ARC-006 — Session and Message State Not Isolated Per Session

**Severity:** MEDIUM  
**Evidence:** `page.tsx` — single `messages` array shared across all sessions

**Description:**  
`sessions` is an array, but `messages` is a single state. When the user switches sessions, messages are not loaded for that session. All messages belong to the current session only, and switching sessions silently discards them. This is undisclosed to the user.

Additionally, `activeSessionId` is stored as a bare string initialised to `"session-1"` — if the sessions array is ever empty, this will be stale.

**Affected Files:** `app/page.tsx`

**Recommendation:**  
Store messages as `Record<sessionId, Message[]>` map, or migrate to Supabase-backed sessions in Phase 10.

**Phase:** Phase 4/10

---

### ARC-007 — API Route Embeds Business Logic and AI Persona

**Severity:** MEDIUM  
**Evidence:** `app/api/chat/route.ts` lines 60–100 — hardcoded BM keyword matching and fallback responses

**Description:**  
The API route contains:
- Brand-specific fallback copy (Sakluma brand references, Hermes agent names, PAYG credit copy)
- Business logic (keyword matching to determine which response to give)
- Transport logic (gateway proxy, stream piping)

A route handler should only handle HTTP transport concerns. Business logic and AI persona copy should live in a service layer.

**Affected Files:** `app/api/chat/route.ts`

**Recommendation:**  
Extract fallback responses to a `services/fallback-chat.service.ts`. Route handler should be thin — parse, validate, delegate, respond.

**Phase:** Phase 4

---

### ARC-008 — No Error Boundary

**Severity:** LOW  
**Evidence:** No `error.tsx` or `global-error.tsx` in `app/`

**Description:**  
Next.js App Router supports `error.tsx` per route segment and `global-error.tsx` at the root for React error boundaries. Without them, unhandled render errors will crash the entire application with a blank screen.

Current error handling in `page.tsx` uses `alert()` for auth errors (line 158) — a deprecated UX pattern that blocks the thread.

**Affected Files:** Missing `app/error.tsx`, `app/global-error.tsx`

**Recommendation:**  
Add `app/error.tsx` and `app/global-error.tsx`. Replace `alert()` with inline error state rendering.

**Phase:** Phase 1/2

---

### ARC-009 — No Loading Boundary for Route Transitions

**Severity:** LOW  
**Evidence:** No `loading.tsx` in `app/`

**Description:**  
Next.js App Router supports `loading.tsx` as a Suspense fallback. Without it, route transitions that involve data fetching will show blank screens until the data loads.

**Recommendation:**  
Add `app/loading.tsx` with a brand-consistent skeleton/spinner.

**Phase:** Phase 2

---

### ARC-010 — Hardcoded Magic Values

**Severity:** LOW  
**Evidence:** Multiple locations in `page.tsx` and `route.ts`

**Examples:**
| Value | Location | Should Be |
|---|---|---|
| `"10.00"` (starting credits) | `page.tsx:98` | Config constant |
| `0.02` (deduction per message) | `page.tsx:261` | Config constant |
| `3500` (gateway timeout ms) | `route.ts:32` | Env var or config |
| `25` (fallback stream delay ms) | `route.ts:107` | Config constant |
| `"session-1"` (initial session ID) | `page.tsx:94` | Generated UUID |
| Hermes endpoint paths `/api/chat/start`, `/api/chat/stream` | `route.ts:34,40` | Config constants |

**Recommendation:**  
Create `lib/config.ts` for all configurable constants.

**Phase:** Phase 1

---

## 4. Architecture Debt Summary

| ID | Finding | Severity | Phase to Fix |
|---|---|---|---|
| ARC-001 | Monolithic God Component | HIGH | Phase 2 |
| ARC-002 | No adapter/repository interfaces (DEC-010 violation) | HIGH | Phase 4 |
| ARC-003 | No middleware — API routes unprotected | CRITICAL | Phase 1 |
| ARC-004 | No TypeScript type boundaries | MEDIUM | Phase 1 |
| ARC-005 | Flat unscalable state management | MEDIUM | Phase 2 |
| ARC-006 | Session/message state not isolated | MEDIUM | Phase 4/10 |
| ARC-007 | Business logic in API route handler | MEDIUM | Phase 4 |
| ARC-008 | No React error boundary | LOW | Phase 1/2 |
| ARC-009 | No loading boundary | LOW | Phase 2 |
| ARC-010 | Hardcoded magic values | LOW | Phase 1 |

---

## 5. Target Architecture (Phase 4 End State)

```
app/
├── (auth)/
│   └── page.tsx                ← Login page (isolated)
├── (app)/
│   ├── layout.tsx              ← App shell (sidebar + header)
│   ├── chat/
│   │   └── page.tsx            ← Chat view only
│   └── profile/
│       └── page.tsx
├── api/
│   └── chat/
│       └── route.ts            ← Thin: parse → validate → delegate
├── error.tsx
├── global-error.tsx
└── loading.tsx

components/
├── sidebar/
├── chat/
├── ui/                         ← Design system (Phase 2)
└── layout/

hooks/
├── useAuth.ts
├── useChatStream.ts
└── useSessions.ts

services/
├── chat.service.ts             ← Implements ChatAdapter interface
├── auth.service.ts             ← Implements AuthAdapter interface
└── fallback.service.ts

adapters/
├── IChatAdapter.ts             ← Interface
└── IAuthAdapter.ts             ← Interface

types/
├── message.ts
├── session.ts
├── agent.ts
└── user.ts

lib/
├── supabase-browser.ts         ← Browser client
├── supabase-server.ts          ← Server client (@supabase/ssr)
└── config.ts                   ← All constants
```

---

*End of Architecture Findings — Phase 0B*

