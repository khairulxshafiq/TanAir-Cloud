# Phase 1A Implementation Plan: Security Containment

**Author:** Lead Senior DevOps Engineer, Security Engineer, Software Architect  
**Status:** In Progress  
**Branch:** `phase/1a-security-containment`  
**Target Release:** Phase 1A Quality Gate  

---

## 1. Executive Summary

Phase 1A executes **Security Containment** for TanAir Cloud. Its sole objective is to address the highest-priority security and operational risks identified in Phase 0A/0B audits without introducing new product features or executing a broad architectural rewrite.

The primary security exposures being contained are:
1. Unauthenticated access to `POST /api/chat` (Finding `SEC-001`).
2. Plaintext HTTP transmission of user conversations to the Hermes VPS gateway (Finding `SEC-002`).
3. Public exposure of the raw VPS origin IP in client bundles and `.env.example` (Finding `SEC-004`, `SEC-005`).
4. Absence of request validation (message count, length, schema, allowlisted agents) (Finding `SEC-010`).
5. Absence of server-side rate limiting and concurrency throttling (Finding `SEC-003`).
6. Absence of request cancellation, timeouts, and correlation IDs (`x-request-id`).
7. Failure to forward the selected agent persona to the Hermes ReAct engine (Finding `RR-ARC-003`).

---

## 2. Current Behaviour vs. Target Behaviour

| Area | Current Behaviour (Phase 0) | Target Behaviour (Phase 1A) |
|---|---|---|
| **`/api/chat` Auth** | No check. Anyone can `curl POST /api/chat` anonymously. | Server validates Supabase session via cookie/header. Rejects with 401 if missing/invalid. |
| **Request Validation** | Only checks `if (!message)`. Accepts arbitrary payloads and strings. | Validates message array/single message, max length (4000 chars), total size (64KB), allowlisted agents. Returns 400/413. |
| **Agent Selection** | `agent` param is parsed but dropped before calling Hermes. | `agent` is validated against allowlist (`Aura`, `Aura-Trade`, etc.) and forwarded to Hermes as `agent_id`. |
| **Hermes Gateway Config** | Reads client-exposed `NEXT_PUBLIC_GATEWAY_URL` with fallback to hardcoded VPS IP. | Uses server-only `HERMES_GATEWAY_URL`. Rejects plain HTTP in production. Sanitizes `.env.example`. |
| **Rate Limiting** | None. Unlimited requests allowed. | `IRateLimiter` interface with `MemoryRateLimiter` (20 req/min per user). Returns 429 with `Retry-After`. |
| **Timeout & Abort** | Fixed 3500ms timeout on start; no cancellation on client disconnect. | Configurable timeout (`HERMES_TIMEOUT_MS`), `AbortController` hooked to client request abort, clean stream termination. |
| **Error Handling** | Leaks raw error messages; UI uses blocking browser `alert()`. | Consistent error responses (400, 401, 403, 413, 429, 502, 504) with safe Bahasa Melayu text. No leaked IPs or stack traces. |
| **Telemetry** | Unstructured `console.error`. No request correlation. | `x-request-id` generated/propagated, returned in headers, included in structured server logs. No prompt logging. |
| **Automated Tests** | Zero automated tests in repository. | Vitest test suite verifying auth, validation, rate limiting, agent forwarding, and error mapping without real VPS calls. |

---

## 3. Files Expected to Change

### A. New Implementation Files
- `lib/supabase-server.ts`: Server-side Supabase client factory for cookies and route handlers using `@supabase/ssr`.
- `lib/security/validation.ts`: Request validation schema and allowlisted agent mapping.
- `lib/security/rate-limiter.ts`: `IRateLimiter` contract and `MemoryRateLimiter` implementation.
- `lib/security/correlation.ts`: `x-request-id` generator, validator, and header injector.
- `lib/security/errors.ts`: Standard safe application error classes and response formatter.
- `adapters/hermes/IHermesAdapter.ts`: Contract for Hermes communication per ADR-0005.
- `adapters/hermes/HermesGatewayAdapter.ts`: Production HTTPS adapter implementation with timeout and abort.
- `adapters/hermes/MockHermesAdapter.ts`: Deterministic fake adapter for automated test suites.
- `lib/logger.ts`: Structured JSON logger with sensitive data redaction.

### B. Modified Files
- `app/api/chat/route.ts`: Refactored to enforce authentication, input validation, rate limiting, correlation ID, and adapter delegation.
- `.env.example`: Redact raw VPS IP; document `HERMES_GATEWAY_URL` with non-routable placeholder.
- `package.json`: Add `@supabase/ssr`, `vitest` (dev), and test/typecheck scripts.

### C. Documentation & Operations Files
- `docs/implementation/phase-1a-plan.md` (this file)
- `docs/security/chat-api-threat-model.md`
- `docs/operations/hermes-transport-hardening.md`
- `docs/operations/phase-1a-rollback.md`
- `docs/testing/phase-1a-test-plan.md`
- `docs/audit/phase-1a-completion-report.md`

---

## 4. Security Controls & Defensive Limits

1. **Authentication:** Only authenticated Supabase users may invoke `/api/chat`. User identity is derived strictly from server-verified JWT session cookies, never from request bodies.
2. **Defensive Request Limits:**
   - Maximum content length per message: 4,000 characters.
   - Maximum total request body size: 64 KB.
   - Maximum messages in conversation history: 30 messages.
   - Allowed roles: `user`, `assistant`, `system`.
   - Allowed agents: `Aura`, `Aura-Trade`, `Aura-Pen`, `Aura-Art`, `Aura-Scout`, `Aura-Vision`.
3. **Rate Limiting:** Sliding window per `user_id` (20 requests per minute). Returns HTTP 429 with retry delay hint.
4. **Transport Security:** If `NODE_ENV === 'production'`, `HERMES_GATEWAY_URL` must use `https://` unless `ALLOW_INSECURE_HERMES_HTTP=true` is explicitly set with logged warnings.
5. **Data Leakage Prevention:** Server logs redact message content, prompts, tokens, cookies, and authorization headers. Upstream error bodies are never mirrored to the client.

---

## 5. Test Plan

The automated test suite (`tests/security/*`) will execute with Vitest:
- `auth.test.ts`:
  - Valid session passes.
  - Missing session returns 401.
  - Invalid session returns 401.
  - Hermes is not invoked on authentication failure.
- `validation.test.ts`:
  - Malformed JSON returns 400.
  - Empty message returns 400.
  - Oversized message (>4,000 chars) returns 400 or 413.
  - Disallowed agent returns 400.
  - Allowlisted agent succeeds and resolves correct backend identifier.
- `rate-limiter.test.ts`:
  - Consecutive requests within limit return allowed.
  - Requests exceeding limit return rejected (429).
- `hermes-adapter.test.ts`:
  - Forwards `agent_id` and `x-request-id`.
  - Abort signal terminates stream cleanly.
  - Timeout triggers 504 Gateway Timeout.
  - Upstream 500 error returns safe 502/503 response.
- `config.test.ts`:
  - Insecure HTTP rejected in production mode.
  - Missing gateway URL handles failure safely.

---

## 6. Infrastructure Dependencies

- **Hermes VPS TLS Hardening:** The remote Tencent Cloud VPS (`43.134.124.127:9119`) requires an external TLS reverse proxy (Nginx or Cloudflare Tunnel) terminating HTTPS. Because direct DNS/cert modifications to the external VPS origin are outside the local Git repository, this external infrastructure step will be documented in `docs/operations/hermes-transport-hardening.md` and marked accordingly in the Quality Gate.
- **Supabase Session Cookies:** Requires `@supabase/ssr` to extract authenticated cookies from Next.js server requests.

---

## 7. Rollback Strategy

If Phase 1A changes cause regressions:
1. **Branch Isolation:** All changes live on `phase/1a-security-containment`. The `main` branch remains unaffected until explicitly reviewed and merged.
2. **Revert Procedure:** A step-by-step rollback runbook is documented in `docs/operations/phase-1a-rollback.md`.
3. **Graceful Fallback:** If the live Hermes gateway is unreachable, the intelligent Bahasa Melayu fallback continues to function safely.

---

## 8. Out-of-Scope Items (Strictly Excluded)

- Implementing landing page, pricing page, or onboarding flow.
- Modifying user profile or implementing persistent memory tables.
- Building Bot Studio or Admin Dashboard.
- Altering PAYG credit UI or payment gateways.
- Refactoring `page.tsx` into multiple UI feature components (deferred to Phase 2).
- Rewriting Git history.

---

