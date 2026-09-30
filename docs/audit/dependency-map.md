# Dependency Map
## Phase 0A — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity  
**Status:** READ-ONLY

---

## 1. Runtime Dependencies

| Package | Version (locked) | Purpose | Risk |
|---|---|---|---|
| `next` | `16.3.5` | Framework — App Router, SSE streaming, serverless API routes | STABLE |
| `react` | `19.2.8` | UI rendering | STABLE |
| `react-dom` | `19.2.8` | DOM rendering | STABLE |
| `@supabase/supabase-js` | `^2.116.0` (latest: check) | Auth, future DB client | STABLE |
| `lucide-react` | `^1.47.0` | SVG icon set | STABLE |

---

## 2. Development Dependencies

| Package | Version (locked) | Purpose |
|---|---|---|
| `typescript` | `^5` → `5.9.3` | Type checking |
| `tailwindcss` | `^4` → `4.3.3` | Utility CSS |
| `@tailwindcss/postcss` | `^4` | PostCSS integration for Tailwind v4 |
| `eslint` | `^9` → `9.39.5` | Linting |
| `eslint-config-next` | `16.3.5` | Next.js lint rules |
| `@types/node` | `^20` | Node.js type definitions |
| `@types/react` | `^19` | React type definitions |
| `@types/react-dom` | `^19` | ReactDOM type definitions |

---

## 3. Indirect Notable Dependencies (Resolved via package-lock)

| Package | Version | Notes |
|---|---|---|
| `lightningcss` | `1.32.0` | Tailwind v4 CSS transform engine |
| `sharp` | `0.35.4` | Next.js image optimisation |
| `zod` | `4.6.5` | Schema validation (indirect — likely from supabase-js or eslint) |
| `zod-validation-error` | `4.0.2` | Zod companion |
| `hermes-parser` / `hermes-estree` | `0.25.1` | Meta's Hermes JS parser (via ESLint — **NOT related to TanAir Hermes**) |
| `iceberg-js` | `0.8.1` | Uncertain source — check if needed |
| `postcss` | `8.5.28` | CSS processing |
| `styled-jsx` | `5.1.6` | Next.js internal (legacy CSS-in-JS) |

> [!NOTE]
> `hermes-parser` in `node_modules` refers to Meta's JavaScript parser used by ESLint — it has **no relation** to the TanAir Hermes VPS agent engine.

> [!WARNING]
> `iceberg-js 0.8.1` appears in the lockfile as an indirect dependency. Its origin is unclear — it is not listed in `package.json` directly. If it persists after `npm ci`, its origin should be traced. Apache Iceberg is a data lakehouse format with no obvious relevance to this project.

---

## 4. Dependency Analysis

### What Is NOT Present (Audit Findings)

| Missing Package | Purpose | Phase Required |
|---|---|---|
| No test runner (`jest`, `vitest`) | Unit / integration testing | Phase 11 |
| No E2E (`playwright`, `cypress`) | Critical journey testing | Phase 11 |
| No `zod` (direct) | Request/response validation in API routes | Phase 4 |
| No rate-limiting library | API route protection | Phase 4 / 11 |
| No `@supabase/ssr` | Server-side auth cookie handling (required for RSC + middleware auth) | Phase 10 |
| No state management (`zustand`, `jotai`) | Cross-component state once decomposed | Phase 2 / 4 |
| No `@tanstack/react-query` | Server state / cache management | Phase 4 |
| No logging library (`pino`) | Structured server-side logging | Phase 11 |
| No Sentry SDK | Error tracking | Phase 11 |
| No analytics (`posthog-js`, `plausible`) | Event tracking | Phase 11 |
| No `three` / `@react-three/fiber` | Aura Core 3D hero (DEC-009) | Phase 3 |

---

## 5. Version Pinning Assessment

| Item | Status | Risk |
|---|---|---|
| `package.json` uses `^` ranges for all deps | ⚠ Partially locked by lockfile | LOW (lockfile present) |
| Node.js version | ❌ Not pinned (no `.nvmrc`, `.node-version`) | MEDIUM — different devs may use different runtimes |
| npm version | ❌ Not pinned | LOW |
| `engines` field in `package.json` | ❌ Missing | LOW |

---

## 6. Security Surface

| Item | Assessment |
|---|---|
| `@supabase/supabase-js` uses anon key only in client | ✅ Correct — service role key is VPS-only |
| No server-side Supabase client (`@supabase/ssr`) | ⚠ API routes use no Supabase auth validation today |
| No auth token validation in `api/chat/route.ts` | ⚠ Any unauthenticated client can POST to `/api/chat` |
| No input sanitisation/validation in API route | ⚠ `message` field is passed to Hermes unvalidated |
| All deps are widely-used packages from npm registry | ✅ No unknown/suspicious packages |

---

## 7. Dependency Upgrade Notes

| Package | Current | Note |
|---|---|---|
| `next` | 16.3.5 | Confirm this is intended (Next.js 16 is very new) |
| `react` | 19.2.8 | React 19 — confirm compatibility with all future deps |
| `tailwindcss` | 4.3.3 | Tailwind v4 — breaking changes from v3; confirm ecosystem compatibility |
| `eslint` | 9.39.5 | ESLint 9 flat config — breaking change from v8 |
| `lucide-react` | 1.47.0 | v1.x — check if major version change altered icon names |

---

*End of Dependency Map — Phase 0A*

