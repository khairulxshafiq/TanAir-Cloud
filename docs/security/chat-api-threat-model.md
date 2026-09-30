# Chat API Threat Model & Security Posture
## Phase 1A: Security Containment — TanAir Cloud

**Generated:** 2026-09-20  
**Author:** Lead Senior Security Architect & DevOps Engineer  
**System Component:** `POST /api/chat`, `HermesGatewayAdapter`, `lib/security/*`  
**Classification:** Internal Technical Architecture  

---

## 1. Asset Inventory

| Asset ID | Asset Name | Description & Business Impact | Sensitivity |
|---|---|---|---|
| **A-01** | **Hermes Capacity & LLM Cost** | Python ReAct inference cycles, upstream LLM provider tokens (OpenAI / Anthropic / DeepSeek) consumed per request. Financial liability. | High |
| **A-02** | **User Conversations & Prompts** | Solopreneur business strategies, marketing drafts (Sakluma), trading inquiries, personal commercial ideas. | High (PDPA) |
| **A-03** | **Agent Configuration & Prompts** | Specialized system instructions for Aura-Series personas (Aura-Trade, Aura-Pen, Aura-Art, etc.). Proprietary IP. | Medium |
| **A-04** | **Supabase Sessions & User Identity** | Authenticated user credentials, JWT session cookies, user IDs, and profile tiers. | High |
| **A-05** | **Infrastructure Origin (Hermes VPS)** | Physical Tencent Cloud VPS IP (`43.134.124.127:9119`), OpenD container port (`:11111`), Tailscale console (`:8787`). | Critical |
| **A-06** | **Operational Server Logs** | Request metadata, error logs, and execution traces stored in Vercel and VPS logging sinks. | Medium |

---

## 2. Threat Actor Profiles

| Actor ID | Actor Type | Motivation | Capabilities |
|---|---|---|---|
| **T-01** | **Anonymous Internet Caller** | Free AI compute, resource abuse, opportunistic scanning. | HTTP scripting (`curl`, Postman), automated vulnerability crawlers. |
| **T-02** | **Authenticated Abusive User** | Circumventing quota, spamming expensive models, concurrent batch scraping. | Valid Google OAuth account, browser automation, scriptable API calls. |
| **T-03** | **Automated Bot / Scraping Tool** | Content scraping, Denial-of-Service, credential stuffing. | High-frequency distributed requests, headless browsers. |
| **T-04** | **Compromised Browser Session** | Intercepting conversation state via XSS or browser extensions. | Access to DOM and browser-accessible localStorage. |
| **T-05** | **Misconfigured Internal Service** | Staging / dev environments accidentally flooding production gateway. | Direct network access to server endpoints. |

---

## 3. Threat Scenarios & Containment Matrix

---

### Scenario 1: Unauthenticated Hermes Proxy Abuse
* **Target Asset:** A-01 (Hermes Capacity), A-05 (VPS Origin)
* **Threat Actor:** T-01, T-03
* **Description:** An anonymous attacker sends repeated HTTP POST requests to `/api/chat`, exploiting TanAir as an open, unmetered AI proxy to burn tokens.
* **Existing Control (Phase 0):** None. Endpoint was completely open.
* **New Control (Phase 1A):** Server-side session verification via `authenticateChatRequest(req)` using `@supabase/ssr`. Requests lacking a valid verified Supabase session are rejected with HTTP 401 before any parsing or upstream dispatch.
* **Residual Risk:** A user can register a free Google account to make requests (contained by rate limiting and quota).
* **Test Evidence:** `tests/security/auth-and-chat-route.test.ts` ("rejects unauthenticated requests with HTTP 401").

---

### Scenario 2: Session & Identity Spoofing
* **Target Asset:** A-04 (Supabase Sessions), A-02 (User Conversations)
* **Threat Actor:** T-02, T-04
* **Description:** An attacker submits a custom `user_id` or `email` field in the request JSON to impersonate another user or access their session.
* **Existing Control (Phase 0):** User identity was completely ignored in API route.
* **New Control (Phase 1A):** User identity is strictly extracted from the cryptographic JWT verified by Supabase Auth (`user.id`). User ID values submitted in request bodies are ignored.
* **Residual Risk:** Stolen valid JWT session cookie via client machine malware.
* **Test Evidence:** `tests/security/auth-and-chat-route.test.ts` ("allows authenticated users and returns SSE streaming response").

---

### Scenario 3: Oversized Request & Memory Abuse
* **Target Asset:** A-01 (Hermes Capacity), A-06 (Vercel Serverless Memory)
* **Threat Actor:** T-01, T-02
* **Description:** Attacker submits a multi-megabyte JSON payload or millions of characters to cause buffer allocation spikes and Node.js out-of-memory crashes.
* **Existing Control (Phase 0):** Unbounded `await req.json()`.
* **New Control (Phase 1A):** Explicit 64 KB total request body byte check and strict 4,000 character cap per message in `validateChatPayload()`. Rejects with HTTP 413 Payload Too Large.
* **Residual Risk:** High concurrency of legitimate 4,000-character messages (contained by rate limiting).
* **Test Evidence:** `tests/security/validation.test.ts` ("rejects an oversized message with 413", "rejects total request body exceeding 64KB with 413").

---

### Scenario 4: Rate Limit Bypass & Denial of Service (DoS)
* **Target Asset:** A-01 (Hermes Capacity), A-05 (VPS Origin)
* **Threat Actor:** T-02, T-03
* **Description:** An authenticated script sends hundreds of concurrent chat requests per second, exhausting VPS worker threads and OpenD socket connections.
* **Existing Control (Phase 0):** Zero rate limiting.
* **New Control (Phase 1A):** `IRateLimiter` enforcement (`MemoryRateLimiter` sliding window) capping users to 20 requests/minute. Returns HTTP 429 with `Retry-After` header.
* **Residual Risk:** In-memory limiter is process-local; distributed Vercel serverless instances require Upstash Redis for global synchronization at high scale (Phase 1B).
* **Test Evidence:** `tests/security/auth-and-chat-route.test.ts` ("enforces rate limiting and returns HTTP 429 when threshold exceeded").

---

### Scenario 5: Agent Injection & Capability Bypass
* **Target Asset:** A-03 (Agent Configuration), A-01 (Model Costs)
* **Threat Actor:** T-02
* **Description:** Attacker passes arbitrary agent names, internal file paths, or private prompt names (e.g. `agent: "../system/admin"`) in the JSON payload.
* **Existing Control (Phase 0):** Blindly accepted `agent` parameter into string interpolation.
* **New Control (Phase 1A):** Strict allowlist check (`ALLOWED_AGENTS`: `Aura`, `Aura-Trade`, `Aura-Pen`, `Aura-Art`, `Aura-Scout`, `Aura-Vision`). Any unauthorized agent name is rejected with HTTP 400.
* **Residual Risk:** None. Only explicitly allowlisted agent names are forwarded to the internal mapping.
* **Test Evidence:** `tests/security/validation.test.ts` ("rejects an unlisted or malicious agent identifier with 400").

---

### Scenario 6: Plaintext Network Interception (MITM)
* **Target Asset:** A-02 (User Conversations), A-05 (VPS Origin)
* **Threat Actor:** External network eavesdropper on public transit.
* **Description:** Cleartext HTTP traffic over port 9119 allows intermediate network hops to inspect prompts, trading inquiries, and financial analysis.
* **Existing Control (Phase 0):** Raw HTTP `http://43.134.124.127:9119`.
* **New Control (Phase 1A):** Next.js `HermesGatewayAdapter` enforces HTTPS in production mode and rejects insecure `http://` protocols by default. Raw IP removed from `.env.example`.
* **Residual Risk:** Remote Tencent Cloud VPS requires TLS reverse proxy (Nginx or Cloudflare Tunnel) to terminate HTTPS. External infrastructure change documented in `docs/operations/hermes-transport-hardening.md`.
* **Test Evidence:** `tests/security/hermes-adapter.test.ts` ("rejects plain HTTP in production mode by default", "allows HTTPS in production mode").

---

### Scenario 7: Origin Bypass & Port Scanning
* **Target Asset:** A-05 (VPS Origin)
* **Threat Actor:** T-01, T-03
* **Description:** Attackers scan the raw VPS IP discovered from Git history and send direct HTTP requests to port 9119, completely bypassing Next.js authentication.
* **Existing Control (Phase 0):** Raw IP committed in `.env.example`.
* **New Control (Phase 1A):** Sanitized `.env.example` with non-routable placeholder `https://gateway.tanair.my`. Added `HERMES_GATEWAY_SECRET` header verification (`X-Aura-Secret`).
* **Residual Risk:** Historical git commits still contain the IP; Tencent Cloud Security Group must restrict port 9119 to Vercel IP ranges or Cloudflare Tunnel.
* **Test Evidence:** Documented in transport hardening runbook.

---

### Scenario 8: SSE Connection Exhaustion & Zombie Sockets
* **Target Asset:** A-01 (Hermes Capacity), A-06 (Vercel Execution Minutes)
* **Threat Actor:** T-01, T-02
* **Description:** User or client closes the browser tab mid-stream; serverless function continues fetching and processing tokens from Hermes indefinitely.
* **Existing Control (Phase 0):** `while(true)` read loop with no `AbortSignal`.
* **New Control (Phase 1A):** `HermesGatewayAdapter` binds client `req.signal` and server-side timeout `AbortController`. Aborts upstream connection immediately upon client disconnect or timeout.
* **Residual Risk:** Upstream Hermes gateway must also support abort signal handling on socket disconnect.
* **Test Evidence:** `tests/security/hermes-adapter.test.ts` ("MockHermesAdapter abort handling").

---

### Scenario 9: Error Message & Information Leakage
* **Target Asset:** A-05 (VPS Origin), A-03 (System Instructions)
* **Threat Actor:** T-01, T-02
* **Description:** Upstream network exceptions expose internal VPS IP addresses, stack traces, or file paths in the JSON error response.
* **Existing Control (Phase 0):** `catch (err) { return res.json({ error: err.message }) }`.
* **New Control (Phase 1A):** Standardized `createSafeErrorResponse()` returns curated Bahasa Melayu messages with safe error codes (`AUTH_REQUIRED`, `INVALID_INPUT`, `RATE_LIMITED`, `UPSTREAM_TIMEOUT`, `INTERNAL_ERROR`). Internal errors are logged strictly to server logs with `requestId`.
* **Residual Risk:** None. Stack traces and upstream URLs are never serialized into HTTP response payloads.
* **Test Evidence:** `tests/security/auth-and-chat-route.test.ts` ("rejects unauthenticated requests", "rejects malformed JSON").

---

## 4. Summary of Verification Evidence

| Threat ID | Threat Name | Automated Test Suite | Result |
|---|---|---|---|
| **T-01** | Unauthenticated Access | `tests/security/auth-and-chat-route.test.ts` | ✅ PASS |
| **T-02** | Payload Oversizing | `tests/security/validation.test.ts` | ✅ PASS |
| **T-03** | Rate Limit Flooding | `tests/security/rate-limiter.test.ts` | ✅ PASS |
| **T-04** | Agent Tampering | `tests/security/validation.test.ts` | ✅ PASS |
| **T-05** | Plaintext HTTP in Prod | `tests/security/hermes-adapter.test.ts` | ✅ PASS |
| **T-06** | Upstream Timeout | `tests/security/hermes-adapter.test.ts` | ✅ PASS |

---

*End of Chat API Threat Model — Phase 1A*
