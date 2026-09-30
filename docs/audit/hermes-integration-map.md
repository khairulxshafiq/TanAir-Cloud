# Hermes Integration Map
## Phase 0A — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity  
**Status:** READ-ONLY

---

## 1. Overview

TanAir Cloud communicates with the Hermes VPS through a two-step gateway protocol proxied via a Next.js API route. A local intelligent fallback fires whenever the gateway is unreachable.

```
Browser
  └─ POST /api/chat  (Next.js serverless, nodejs runtime)
        ├─ [Gateway reachable]
        │    └─ POST {gatewayUrl}/api/chat/start  → receives stream_id
        │         └─ GET {gatewayUrl}/api/chat/stream?stream_id={id}
        │              └─ SSE stream piped back to browser
        └─ [Gateway unreachable / timeout / no gatewayUrl]
             └─ BM keyword-matched fallback response (simulated streaming)
```

---

## 2. Gateway Configuration

| Item | Value | Source |
|---|---|---|
| Env var (preferred) | `HERMES_GATEWAY_URL` | `route.ts` line 18 (server-side, not exposed to client) |
| Env var (fallback) | `NEXT_PUBLIC_GATEWAY_URL` | `route.ts` line 18 (client-exposed ⚠) |
| Configured value | `http://43.134.124.127:9119` | `.env.example`, `.env.local` |
| Gateway host | `43.134.124.127` (Tencent Cloud VPS Hermes) | Delivery notes |
| Gateway port | `:9119` | Confirmed from VPS architecture |
| Protocol | HTTP (plain, not HTTPS) | ⚠ Security concern |
| Connection timeout | 3,500ms | `route.ts` AbortController timeout |

---

## 3. Gateway Endpoints (As Observed from Frontend Code)

### `POST /api/chat/start`

**Called from:** `app/api/chat/route.ts` line 34  
**Purpose:** Initiates a new chat session on Hermes  
**Request body:**
```json
{
  "message": "user message text",
  "session_id": "session identifier string"
}
```

**Expected response:**
```json
{
  "stream_id": "some-stream-identifier"
}
```

**Notes:**
- If `gwRes.ok` is false or `gwData.stream_id` is absent, the call is considered failed and falls back
- No auth header is sent
- `agent` selection is NOT forwarded to Hermes — only `message` and `session_id`

### `GET /api/chat/stream?stream_id={id}`

**Called from:** `app/api/chat/route.ts` line 40  
**Purpose:** Retrieves the SSE stream for a previously initiated chat  
**Response:** Raw SSE body — piped directly to the browser without transformation

**Notes:**
- Stream format expected: `data: {"text": "...chunk..."}\n\n` then `data: [DONE]\n\n`
- The frontend client parses `JSON.parse(dataStr)` and reads `.text` field

---

## 4. Hermes VPS Architecture (from delivery notes and prior session context)

| Component | Location | Port | Access |
|---|---|---|---|
| Slim Gateway (public) | `/home/ubuntu/TanAir/` | `:9119` | Public HTTP |
| Master Console | `/home/ubuntu/TanAir/` | `:8787` | Tailscale-only |
| Hermes ReAct Engine | `/home/ubuntu/TanAir/` | Internal | Via gateway only |
| Docker OpenD (Moomoo) | Docker on VPS | `127.0.0.1:11111` | VPS-internal only |
| aura-trade-bot.service | systemd | — | Internal |
| OBC6 gateway module | `/home/ubuntu/TanAir/obc6/` | — | Internal |

---

## 5. Hermes Capability Map (What Exists vs. What Is Exposed)

| Capability | VPS Status | Exposed via Frontend | Notes |
|---|---|---|---|
| Chat (general) | ✅ Active (Hermes ReAct) | ✅ Via `/api/chat` | Core feature |
| Trade / Bursa analysis | ✅ Active (`aura-trade-bot.service`) | ⚠ Via agent selector only, no distinct route | `agent=Aura-Trade` sent to fallback only, not to Hermes |
| Image generation | Unknown | ❌ Not implemented in frontend | FLUX LoRA mentioned in fallback text |
| Video pipeline | Unknown | ❌ Not implemented | Aura-Vision mentioned as agent only |
| Search / Scout | Unknown | ❌ Not implemented | Aura-Scout mentioned as agent only |
| Bursa live data (OpenD) | ✅ Moomoo OpenD running | ❌ Not routable from frontend | Port `:11111` is VPS-internal |
| Memory system | Unknown | ❌ Not implemented | |
| Bot execution | Unknown | ❌ Not implemented | |

> [!IMPORTANT]
> The `agent` field selected in the UI (`Aura-Trade`, `Aura-Art`, etc.) is **NOT forwarded to the Hermes gateway**. Only `message` and `session_id` are sent. The gateway receives no signal about which agent should handle the request. This means agent-specific routing is not functional end-to-end today.

---

## 6. Fallback Behaviour (When Hermes Is Offline)

The fallback in `route.ts` handles 4 keyword patterns in BM:

| Keyword Match | Response Topic |
|---|---|
| `salam`, `hi`, `halo`, `hello` | Introduction to all 6 agents and capabilities |
| `kredit`, `credit`, `payg`, `harga` | PAYG credit system explanation |
| `sakluma`, `daging`, `salai` | Sakluma brand + Aura-Pen/Art context |
| (default / no match) | Echo message + generic BM assistant response |

**Streaming simulation:** Words split by space, each sent with 25ms delay, then `data: [DONE]`.

---

## 7. Security Observations on Integration

| Observation | Severity | Notes |
|---|---|---|
| Gateway URL in `.env.example` is the raw VPS IP | MEDIUM | Direct IP exposure; no domain/Cloudflare proxy |
| HTTP (not HTTPS) to gateway | HIGH | Messages transmitted unencrypted over the internet |
| No auth token between Next.js and Hermes | HIGH | Any entity that can reach `:9119` can send messages |
| `NEXT_PUBLIC_GATEWAY_URL` is client-exposed | MEDIUM | VPS IP visible in browser JS bundle/network tab |
| `agent` not forwarded to Hermes | MEDIUM | Agent-specific behaviour not enforced at engine level |
| No session token forwarded to Hermes | HIGH | Hermes cannot validate that the caller is an authenticated TanAir user |

---

## 8. Integration Gaps vs. Phase Plan

| Required Behaviour | Phase | Current State |
|---|---|---|
| Agent selection routing to Hermes | Phase 4 | ❌ `agent` not forwarded |
| Auth token forwarded to gateway | Phase 4 | ❌ No auth header |
| Hermes adapter interface (replaceable) | Phase 4 | ❌ Direct `fetch` in API route (violates DEC-010) |
| Per-mode capability enforcement | Phase 6 | ❌ No permission check before routing |
| Abort/cancel streaming | Phase 4 | ❌ No abort signal on browser side |
| Retry on failure | Phase 4 | ❌ Single attempt only |
| Hermes latency monitoring | Phase 11 | ❌ No observability |
| HTTPS to gateway | Phase 1/4 | ❌ Plain HTTP |

---

*End of Hermes Integration Map — Phase 0A*

