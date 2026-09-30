# TanAir Cloud — System Overview
## Architecture Documentation

**Version:** 0C  
**Date:** 2026-09-20  
**Author:** Antigravity (Lead Software Architect)  
**Status:** Approved for Phase 1 Implementation

---

## 1. What TanAir Cloud Is

TanAir Cloud is a **Bahasa Melayu-first, multi-agent AI SaaS platform** for Malaysian solopreneurs and enterprises. It provides a unified cockpit for communicating with specialized AI agents — each with distinct capabilities, personas, and billing modes — backed by the Hermes VPS ReAct Engine and exposed via a modern Next.js web application.

---

## 2. System Boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL ACTORS                                  │
│  User (Browser) ──── Google OAuth (via Supabase) ──── Payment GW    │
│  Telegram Bot ─────── Connectors Layer ────────────── Email         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   VERCEL EDGE + SERVERLESS                           │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Next.js App  │  │  API Routes  │  │   Edge Middleware         │  │
│  │ (RSC + SSR)  │  │  /api/chat   │  │   Auth + Rate Limit       │  │
│  │              │  │  /api/admin  │  │   middleware.ts           │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────┘  │
│         │                 │                                          │
└─────────┼─────────────────┼────────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (AuraAgentic project)                    │
│  Auth (Google OAuth)  │  PostgreSQL (RLS)  │  Storage  │  Vault     │
│  profiles, sessions, messages, memories, bots, credit_ledger        │
│  audit_log                                                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  HERMES VPS (43.134.x.x — Tencent Cloud)            │
│  Port :9119 Gateway  │  ReAct Engine  │  Aura-Trade Service         │
│  OpenD Docker (:11111) — Moomoo/Bursa Market Data                   │
│  Master Console (:8787, Tailscale)                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Agent Capability Matrix

| Agent | Role | Tier Minimum | Gateway Route | Status |
|---|---|---|---|---|
| **Aura** | Lead Orchestrator — general BM AI assistant | Free | Standard chat | ✅ Prototype |
| **Aura-Trade** | Market Analyst — Bursa, Klang Valley, trading | Pro | Trade-specific prompt | 🔒 Routing not wired |
| **Aura-Pen** | Content Director — BM copywriting | Pro | Standard with persona | 🔒 Routing not wired |
| **Aura-Art** | Visual Architect — Image generation | Pro | Image pipeline | 🔒 Not implemented |
| **Aura-Scout** | Radar & Intelligence — research, summarise | Empire | Search pipeline | 🔒 Not implemented |
| **Aura-Vision** | Video & Media Director — video pipeline | Empire | Video pipeline | 🔒 Not implemented |

---

## 4. Subscription & Entitlement Model

```
FREE
  10,000 tokens/month
  Chat (Aura only)
  No image, video, connectors
  No bot builder

TRIAL PRO (72 hours, no credit card)
  Same as Pro for 72h
  Chat + Trade + Image
  Auto-reverts to Free

PRO (RM19/month — pricing TBC)
  150,000 tokens/month
  Chat + Trade + Image
  3 bots
  Telegram connector

EMPIRE (pricing TBC)
  400,000 tokens/month
  All modes
  10 bots
  All connectors
  Priority response

TOP-UP (all tiers)
  +50,000 tokens = RM5.90
  +150,000 tokens = RM14.90
  Token pool non-expiring
```

---

## 5. Target Technology Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js App Router | 16.3.5 | RSC + SSR enabled |
| UI Runtime | React | 19.2.8 | Server + Client components |
| Language | TypeScript | 5.9.3 | Strict mode — never relax |
| Styling | Tailwind CSS | 4.3.3 | LightningCSS |
| Icons | Lucide React | 1.47.0 | Named imports only |
| Auth/DB | Supabase | `^2.116.0` | SSR via `@supabase/ssr` |
| State | Zustand (Phase 2) | `^5` | For cross-feature state |
| Validation | Zod | `^3` | API + form schema validation |
| Testing | Vitest | `^2` | Unit + integration |
| E2E | Playwright | `^1.47` | Full browser testing |
| Formatting | Prettier + Tailwind plugin | Latest | Enforced in CI |
| Hosting | Vercel | Pro | Node 22 runtime |
| Gateway | Hermes VPS | Bespoke | HTTPS via Cloudflare/Nginx |

---

## 6. Data Flow — Chat (Target State, Phase 4)

```
1. User submits message
2. ChatInput.tsx → useChatStream() hook
3. ChatService.sendMessage({ message, sessionId, agentId, userId })
4. IHermesAdapter.chat({ ... }) — checks auth, quota, entitlement
5. POST /api/chat (Next.js server route)
6. middleware.ts validates Supabase session cookie → extracts userId
7. QuotaService.check(userId) → abort if insufficient
8. HermesGatewayAdapter.send(message, sessionId, agentId, userId)
9. POST https://gateway.tanair.my/api/chat/start (HTTPS + shared secret)
10. GET https://gateway.tanair.my/api/chat/stream?stream_id=...
11. SSE stream piped to browser
12. On stream completion: QuotaService.deduct(userId, tokensUsed)
13. AuditLogService.log({ event: 'chat.message', userId, sessionId, agentId })
```

---

## 7. Security Posture (Target State)

| Layer | Control | Status |
|---|---|---|
| Browser → Vercel | HTTPS (Vercel default TLS) | ✅ Already enforced |
| Vercel middleware | Supabase JWT session validation | ❌ Phase 1 |
| API route auth | Server-side session check | ❌ Phase 1 |
| Rate limiting | IP + user-level throttle | ❌ Phase 1 |
| Vercel → Hermes | HTTPS + shared secret header | ❌ Phase 1 |
| Hermes IP exposure | Domain alias, IP firewall | ❌ Phase 1 |
| Supabase RLS | Per-table user isolation | ❌ Phase 10 |
| API input validation | Zod schema on all routes | ❌ Phase 1 |
| Admin isolation | Service-role only server-side | ❌ Phase 8 |
| Audit logging | Structured append-only log | ❌ Phase 11 |
| PDPA compliance | Privacy Policy + data handling | ❌ Phase 3 |

---

## 8. Platform Capability Roadmap

```
Phase 1   Engineering Foundation (Security, CI/CD, Tooling)
Phase 2   Design System + App Shell Decomposition  
Phase 3   Landing Page + Onboarding Flow
Phase 4   Chat + Hermes Production Integration
Phase 5   Profile + AI Memory
Phase 6   Trial Pro + Token Quota Engine
Phase 7   Bot Studio
Phase 8   Admin Dashboard
Phase 9   Connector Layer
Phase 10  Supabase Production Schema + Migrations
Phase 11  Observability, Analytics, Monitoring
Phase 12  Mobile Optimisation + PWA
```

---

*End of System Overview — Phase 0C*

