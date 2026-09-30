# Project Input Review
## Phase 0A — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity (Lead Senior DevOps / Architect / Security / Frontend)  
**Source:** `docs/project/01_TANAIR_PROJECT_INPUT.md` vs actual repository state  
**Status:** READ-ONLY — no source files modified

---

## 1. What This Document Does

This document compares the founder-facing project input template (`01_TANAIR_PROJECT_INPUT.md`) against the actual observable state of the codebase and existing delivery notes. It identifies:
- Fields that are already confirmed by code or delivery notes
- Fields that remain `[ISI]` (unfilled)
- Discrepancies between stated intent and current implementation

---

## 2. Confirmed Facts (Derived from Code and Delivery Notes)

| Section | Field | Confirmed Value | Source |
|---|---|---|---|
| Tech Stack | Framework | Next.js 16.3.5 (App Router) | `package.json` |
| Tech Stack | Runtime | Node.js (server) | `route.ts`: `export const runtime = "nodejs"` |
| Tech Stack | UI Library | React 19.2.8 | `package.json` |
| Tech Stack | Styling | Tailwind CSS v4 + LightningCSS | `package.json`, `postcss.config.mjs` |
| Tech Stack | Icons | Lucide React 1.47.0 | `package.json` |
| Tech Stack | Auth | Supabase (`@supabase/supabase-js ^2.116.0`) | `package.json` |
| Tech Stack | Fonts | Inter + JetBrains Mono (Google Fonts) | `app/layout.tsx` |
| Auth | Provider | Google OAuth via Supabase | `page.tsx: supabase.auth.signInWithOAuth({provider:"google"})` |
| Auth | Supabase Project | `AuraAgentic` — URL masked, project ID in env | `lib/supabase.ts`, `.env.example` |
| Agents | Active Agents | Aura, Aura-Trade, Aura-Pen, Aura-Art, Aura-Scout, Aura-Vision (6 total) | `page.tsx: AGENTS array` |
| Hermes | Gateway URL env var | `HERMES_GATEWAY_URL` or `NEXT_PUBLIC_GATEWAY_URL` | `app/api/chat/route.ts` line 18 |
| Hermes | Gateway endpoint | `/api/chat/start` (POST) + `/api/chat/stream` (GET SSE) | `route.ts` lines 34, 40 |
| Hermes | Timeout | 3500ms | `route.ts` line 32 |
| Hermes | Fallback | BM-first intelligent fallback (simulated streaming, 25ms word delay) | `route.ts` lines 55–100 |
| Credits | Starting credits | RM 10.00 (beta) | `page.tsx: useState("10.00")` |
| Credits | Deduction per message | RM 0.02 (simulated, not real) | `page.tsx` credits setCredits |
| UI | Language | BM-first (`lang="ms"`) | `app/layout.tsx` |
| UI | Theme | Dark only (hardcoded dark bg colors) | `app/globals.css`, `page.tsx` |
| UI | Design token base | `#0B0F19` (bg-base), `#111827` (bg-surface), `#8B5CF6` (accent purple) | `globals.css` |
| Sessions | Storage | In-memory React state only (no persistence) | `page.tsx: useState<ChatSession[]>([])` |
| Sessions | Chat threads | In-memory only — lost on refresh | `page.tsx` state management |
| Deployment | Hosting | Vercel (planned), not confirmed live URL | `PHASE_0A_DELIVERY.md` |
| Deployment | Branch | `main` (single branch) | `git branch -a` |
| Repository | Commits | 2 commits total | `git log --oneline` |
| Secrets | `.env.local` present | Yes — 3 env vars | confirmed file exists |
| Secrets | `.env*` in `.gitignore` | Yes (`.env*` ignored, `.env.example` excepted) | `.gitignore` |

---

## 3. Fields Remaining Unfilled in Project Input (`[ISI]`)

The following critical sections are still `[ISI]` in `01_TANAIR_PROJECT_INPUT.md`. These are **blockers** for Phase 0C (Architecture Baseline) and Phase 1 (Engineering Foundation).

### HIGH PRIORITY — Required Before Architecture Baseline

| Section | Field | Impact |
|---|---|---|
| §5 Navigation | Nav items & order | Landing page cannot be built |
| §5 CTAs | Primary & secondary CTA text | Landing page cannot be built |
| §7 Branding | Logo paths, favicon | Build is missing brand assets |
| §7 Branding | Color palette (primary/secondary/gold) | CSS tokens cannot be finalised |
| §7 Branding | Theme choice | DEC-007 says dark+light+system, but code is dark-only |
| §8 Capability | Which Hermes capabilities are actually working | Hermes integration map cannot be validated |
| §8 Hermes | Base URL env var name | Ambiguity: two env vars (`HERMES_GATEWAY_URL` vs `NEXT_PUBLIC_GATEWAY_URL`) |
| §9 Subscription | Pro price, Empire price | Pricing page cannot be built |
| §9 Subscription | Free tier capabilities | Entitlement matrix cannot be implemented |
| §10 Trial | Trial token allowance | Quota system cannot be implemented |
| §11 Top-up | Payment provider confirmed | Billplz mentioned as candidate only |
| §12 Memory | Memory defaults | Memory feature cannot be specified |
| §13 Bot Builder | Bot limits per tier | Bot Studio (Phase 7) blocked |
| §14 Integrations | All connector statuses | Phase 9 connector architecture blocked |
| §15 Repository | Package manager, runtime pinning | Phase 1 Engineering Foundation blocked |
| §16 Infrastructure | All infra fields | DevOps runbook cannot be created |
| §17 Environments | All env URLs | Staging/preview cannot be configured |
| §19 Security | All security fields | Security audit (Phase 0B) incomplete |
| §20 Compliance | Privacy Policy, Terms, PDPA | Cannot launch publicly |
| §22 Operational Ownership | All roles | No incident response possible |
| §23 Constraints | Budget, timeline, team size | Planning impossible |
| §24 Success Criteria | MVP/Beta/Production definitions | Done criteria undefined |

### MEDIUM PRIORITY — Required Before Feature Build

| Section | Field | Impact |
|---|---|---|
| §6 Footer | Footer content and social links | Landing footer blocked |
| §9 Subscription | Yearly pricing, discount | Billing toggle blocked |
| §10 Trial | Image/search allowances | Trial entitlement incomplete |
| §11 Top-up | Token expiry | Top-up feature incomplete |
| §21 Analytics | Events, retention definition | Analytics cannot be implemented |

---

## 4. Discrepancies (Code vs. Documentation)

| Item | Documentation Says | Code Says | Severity |
|---|---|---|---|
| Theme | DEC-007: dark + light + system preference | `globals.css` is dark-only; no theme toggle exists | MEDIUM |
| Hermes env var | `NEXT_PUBLIC_GATEWAY_URL` in `.env.example` | `route.ts` checks `HERMES_GATEWAY_URL` first, then `NEXT_PUBLIC_GATEWAY_URL` | LOW |
| Hermes auth | `01_PROJECT_INPUT.md §8`: Authentication method `[ISI]` | `route.ts` sends no auth headers to gateway | MEDIUM |
| Streaming protocol | `01_PROJECT_INPUT.md §8`: Streaming protocol `[ISI]` | Two-step: POST `/api/chat/start` returns `stream_id`, then GET `/api/chat/stream?stream_id=` | LOW |
| Credits | Prototype shows RM 10.00 PAYG balance | No Supabase ledger table exists yet — pure in-memory simulation | LOW (known, prototype) |
| Session persistence | Architecture doc implies per-user isolation via Supabase RLS | Sessions are React state only — no Supabase reads/writes for chat data | LOW (known, prototype) |
| Agent capability enforcement | Phase plan implies tier-locked agents | No entitlement/permission check exists in code | MEDIUM |
| Announcement bar | `01_PROJECT_INPUT.md §5`: Yes/No unfilled | No announcement bar in current UI | INFO |

---

## 5. Key Assumptions Made by Existing Code

> [!NOTE]
> These are assumptions baked into the current prototype that must be formally decided before production.

1. **All authenticated users have full access to all 6 agents** — no tier gating exists.
2. **Credits are cosmetic** — `setCredits` subtracts RM 0.02 per message with no real ledger.
3. **Sessions are ephemeral** — chat history is lost on page refresh.
4. **Hermes fallback is always available** — if gateway is unreachable, simulated BM response fires.
5. **No memory system exists** — no memory save/approve/delete flow in UI.
6. **No bot builder exists** — only agent selector.
7. **No admin dashboard exists**.
8. **No quota enforcement** — users cannot be blocked by token limits.

---

## 6. Unresolved Questions (For Founder Decision)

> [!IMPORTANT]
> The following questions must be answered before Phase 0C can begin. They cannot be assumed by the engineering team.

1. **Which Hermes capabilities are actually working and stable in production?** (Chat confirmed, others unknown)
2. **What is the intended env var for the gateway URL?** `HERMES_GATEWAY_URL` (server-side only, more secure) or `NEXT_PUBLIC_GATEWAY_URL` (client-exposed, less secure)?
3. **Does Hermes gateway require an API key / bearer token?** Currently none is sent.
4. **Is dark-only theme acceptable for beta, or must light theme be implemented now?**
5. **What is the confirmed payment gateway?** Billplz or alternative?
6. **What are the exact Supabase table schemas expected?** (sessions, messages, credits, memories, bots)
7. **When is the beta user invite list being finalised?** (5 users mentioned)

---

*End of Project Input Review — Phase 0A*

