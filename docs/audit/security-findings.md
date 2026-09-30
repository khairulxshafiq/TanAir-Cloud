# Security Findings
## Phase 0B — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity (Security Engineer)  
**Phase:** 0B — Audit & Risk Register  
**npm audit result:** 0 known CVEs in direct/indirect dependencies ✅

---

## 1. Executive Summary

The prototype has **4 critical and 3 high severity security findings** that must be resolved before any real users are onboarded. The most urgent are the unauthenticated API route and plain-HTTP Hermes transport. The app correctly protects secrets in `.gitignore` and uses Supabase's battle-tested auth, but the server-side enforcement layer is entirely missing.

**Overall Security Score: 2/10** (Pre-hardened prototype)

---

## 2. Findings

---

### SEC-001 — Unauthenticated API Route (Critical)

**Severity:** CRITICAL  
**Evidence:** `app/api/chat/route.ts` line 1–121 — no auth check anywhere  
**Affected Files:** `app/api/chat/route.ts`

**Description:**  
`POST /api/chat` accepts requests from any HTTP client without validating any session token, API key, or credential. The route reads `message`, `sessionId`, and `agent` from the request body and immediately proxies them to the Hermes VPS gateway.

**Attack Scenario:**  
```bash
# Anyone can send unlimited messages to Hermes from any machine:
curl -X POST https://[your-vercel-app].vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

**Business Impact:**  
- Hermes VPS is abused by anonymous actors — API costs, compute load, potential content abuse
- No user attribution for messages sent to Hermes
- Bot/scraper attacks can consume Hermes capacity without limit
- No rate control means a single attacker can DoS the Hermes gateway

**Recommendation:**  
1. Add `middleware.ts` to validate Supabase session cookie on all `/api/*` routes
2. In `route.ts`, extract the Supabase user from the validated session and attach to Hermes request
3. Install `@supabase/ssr` for server-side session validation

**Effort:** Small (middleware ~30 lines)  
**Target Phase:** Phase 1 (before any real user)

---

### SEC-002 — Plain HTTP Transport to Hermes (Critical)

**Severity:** CRITICAL  
**Evidence:** `.env.example` line 6: `NEXT_PUBLIC_GATEWAY_URL=http://43.134.124.127:9119`  
**Affected Files:** `.env.example`, `.env.local`, `app/api/chat/route.ts`

**Description:**  
All communication between the Vercel serverless function and the Hermes VPS gateway is over plain HTTP on port 9119. This means:
- All chat messages (user input and AI responses) are transmitted unencrypted
- Any network observer (ISP, CDN, transit nodes) can read the full conversation
- Man-in-the-Middle attack is trivially possible if VPS IP is known
- The VPS IP is known — it's in the public `.env.example`

**Attack Scenario:**  
A network observer between Vercel Singapore and Tencent Cloud Hong Kong/Singapore sees every message in plaintext:
```
POST http://43.134.124.127:9119/api/chat/start
{"message": "Tolong analisa saham TENAGA hari ini", "session_id": "session-1"}
```

**Business Impact:**  
- User privacy violation — chat content visible to third parties
- Regulatory risk (PDPA Malaysia) if personal data is transmitted
- Trade/financial queries exposed (Bursa analysis, investment context)
- Memory content (when implemented) would be exposed

**Recommendation:**  
1. Configure Cloudflare (free tier) in front of the VPS gateway as a reverse proxy with HTTPS termination
2. Or: point a subdomain (e.g. `gateway.tanair.my`) to the VPS with TLS via Let's Encrypt/Nginx
3. Update all env vars to use `https://`

**Effort:** Small (DNS + Nginx SSL config on VPS)  
**Target Phase:** Phase 1

---

### SEC-003 — No Rate Limiting on API Route (Critical)

**Severity:** CRITICAL  
**Evidence:** `app/api/chat/route.ts` — no rate limiting logic  
**Affected Files:** `app/api/chat/route.ts`

**Description:**  
There is no rate limiting on the `/api/chat` endpoint. Combined with SEC-001 (no auth), any anonymous actor can flood the endpoint with requests, causing:
- Hermes VPS overload (CPU, memory)
- Vercel function execution costs (serverless billing)
- Hermes gateway timeout exhaustion (3500ms × infinite requests)
- Potential disruption to authenticated users

**Attack Scenario:**  
```bash
while true; do
  curl -X POST https://[vercel-url]/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "attack"}' &
done
```

**Recommendation:**  
1. Short-term: Vercel Edge Config rate limiting or Upstash Redis + `@upstash/ratelimit`
2. After middleware: rate limit per authenticated user (e.g. 60 requests/minute)
3. Add Vercel Firewall rules (WAF) for anomaly detection

**Effort:** Small–Medium  
**Target Phase:** Phase 1

---

### SEC-004 — VPS IP Address Exposed in Public Repository (Critical)

**Severity:** CRITICAL  
**Evidence:** `.env.example` committed to GitHub: `NEXT_PUBLIC_GATEWAY_URL=http://43.134.124.127:9119`  
**Affected Files:** `.env.example`

**Description:**  
The raw VPS IP address (`43.134.124.127`) and port (`:9119`) are committed to the public GitHub repository in `.env.example`. This means:
- The IP is indexed by GitHub search engines
- Any actor can directly probe `43.134.124.127:9119`
- If Hermes gateway has no auth (unknown — SEC-006), direct calls to Hermes bypass TanAir entirely
- VPS attack surface is publicly known

**Attack Scenario:**  
```bash
# Direct Hermes bypass — no TanAir involved:
curl -X POST http://43.134.124.127:9119/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{"message": "any message"}'
```

**Recommendation:**  
1. Replace IP with a domain name (even a non-public one) in `.env.example`
2. Use `[REDACTED]` as placeholder: `NEXT_PUBLIC_GATEWAY_URL=https://gateway.your-domain.com`
3. Immediately verify whether port 9119 accepts requests from arbitrary IPs
4. If yes: add IP allowlist on VPS firewall (allow only Vercel egress IPs)

**Effort:** Small (env change) + Small (firewall rule on VPS)  
**Target Phase:** Immediate / Phase 1

---

### SEC-005 — `NEXT_PUBLIC_GATEWAY_URL` Client-Exposed Variable (High)

**Severity:** HIGH  
**Evidence:** `app/api/chat/route.ts` line 18: `process.env.HERMES_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL`  
**Affected Files:** `.env.example`, `app/api/chat/route.ts`

**Description:**  
`NEXT_PUBLIC_*` prefixed variables in Next.js are inlined into the client-side JavaScript bundle at build time. This means the gateway URL is embedded in the JS that browsers download. Even though the gateway call is made server-side (in the API route), the URL itself is visible to anyone who inspects the browser bundle.

**Correct Approach:**  
Use `HERMES_GATEWAY_URL` (no `NEXT_PUBLIC_` prefix). This env var is server-only and never reaches the browser. The route.ts already checks `HERMES_GATEWAY_URL` first — it is the correct variable.

**Recommendation:**  
1. Remove `NEXT_PUBLIC_GATEWAY_URL` from `.env.example` (or document it as deprecated)
2. Document that only `HERMES_GATEWAY_URL` should be set in production Vercel config
3. Remove the `NEXT_PUBLIC_GATEWAY_URL` fallback from `route.ts` once confirmed

**Effort:** Trivial  
**Target Phase:** Phase 1

---

### SEC-006 — Hermes Gateway Has No Inbound Auth (High)

**Severity:** HIGH  
**Evidence:** `app/api/chat/route.ts` lines 33–45 — no `Authorization` header sent to gateway  
**Affected Files:** `app/api/chat/route.ts`

**Description:**  
The Next.js API route sends `message` and `session_id` to the Hermes gateway with no authentication header. It is currently **unknown** whether the Hermes gateway validates callers.

If Hermes accepts any request from any caller:
- Direct API abuse is possible (SEC-004)
- Competitor scraping of Hermes capabilities is possible
- Injection of arbitrary sessions into Hermes is possible

**Recommendation:**  
1. Confirm whether Hermes has inbound auth (API key, IP allowlist, or mutual TLS)
2. If not: add a shared secret header between Vercel and Hermes
3. Document the auth mechanism in `DEVOPS_AND_SECRETS.md`

**Effort:** Small–Medium (depends on Hermes implementation)  
**Target Phase:** Phase 1

---

### SEC-007 — `alert()` Used for Auth Error Display (High)

**Severity:** HIGH (UX + Security)  
**Evidence:** `app/page.tsx` line 158: `alert("Ralat log masuk Google: " + error.message)`  
**Affected Files:** `app/page.tsx`

**Description:**  
`alert()` is a blocking browser API that exposes the raw Supabase error message string directly to the user. Issues:
1. Raw error messages may leak internal information (e.g. Supabase error codes, provider details)
2. `alert()` blocks the JavaScript thread — if an error occurs during auth, the entire page is frozen
3. Poor UX — browser's native alert dialog breaks the app's visual language

**Attack Scenario:**  
A targeted user could trigger auth errors to observe what internal error messages say about the system.

**Recommendation:**  
Replace with an inline error state (`useState<string | null>(null)`) rendered as a styled UI toast or error banner.

**Effort:** Trivial  
**Target Phase:** Phase 1/2

---

### SEC-008 — Supabase URL Hardcoded in Client File (Medium)

**Severity:** MEDIUM  
**Evidence:** `lib/supabase.ts` line 3: `'https://goqqtdgilnxffjyqjflv.supabase.co'`  
**Affected Files:** `lib/supabase.ts`

**Description:**  
The Supabase project URL is hardcoded as a fallback in `lib/supabase.ts`. While the Supabase URL is semi-public (it's in the anon key JWT and visible in network requests), having it hardcoded creates brittleness — if the Supabase project is migrated, this hardcoded value will point to the old project.

Additionally, the project ID (`goqqtdgilnxffjyqjflv`) is now committed to multiple documentation files.

**Recommendation:**  
Remove the hardcoded fallback. Fail loudly if `NEXT_PUBLIC_SUPABASE_URL` is absent:
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
```

**Effort:** Trivial  
**Target Phase:** Phase 1

---

### SEC-009 — No Content Security Policy Headers (Medium)

**Severity:** MEDIUM  
**Evidence:** `next.config.ts` — empty config, no custom headers  
**Affected Files:** `next.config.ts`

**Description:**  
The app sends no security HTTP headers:
- No `Content-Security-Policy` — XSS attacks not mitigated
- No `X-Frame-Options` — clickjacking possible
- No `X-Content-Type-Options` — MIME sniffing possible
- No `Referrer-Policy` — referrer leakage possible
- No `Permissions-Policy` — unnecessary browser APIs accessible

**Recommendation:**  
Add security headers to `next.config.ts`:
```typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]
  }];
}
```
Note: CSP requires careful configuration once inline styles/scripts are enumerated.

**Effort:** Small  
**Target Phase:** Phase 1

---

### SEC-010 — No Input Validation or Sanitisation on API Route (Medium)

**Severity:** MEDIUM  
**Evidence:** `app/api/chat/route.ts` — `message` field passed to Hermes unvalidated  
**Affected Files:** `app/api/chat/route.ts`

**Description:**  
The `message` field from the request body:
1. Has no maximum length validation — oversized messages could be sent
2. Has no content sanitisation — special characters, script tags, etc. are passed through
3. `sessionId` is not validated against any allowed format
4. `agent` is not validated against the known AGENTS list

**Recommendation:**  
Add Zod validation:
```typescript
const schema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid().optional(),
  agent: z.enum(['Aura','Aura-Trade','Aura-Pen','Aura-Art','Aura-Scout','Aura-Vision']).optional(),
});
```

**Effort:** Small  
**Target Phase:** Phase 1

---

### SEC-011 — Supabase Service Role Key Proximity to VPS (Medium)

**Severity:** MEDIUM  
**Evidence:** `DEVOPS_AND_SECRETS.md` — service role key stored at `/home/ubuntu/AuraSecret/acloud_oauth.env`  
**Affected Files:** VPS filesystem (not codebase)

**Description:**  
The Supabase service role key gives unrestricted database access — bypassing all RLS policies. It is stored on the VPS at `/home/ubuntu/AuraSecret/` with `chmod 600`. This is adequate for an individual operator but has risks:
- VPS compromise = service role key compromise = full database access
- The VPS also runs public-facing services (port 9119)
- Service role key rotation process is not documented

**Recommendation:**  
1. Document rotation procedure for the service role key
2. Consider whether the VPS actually needs the service role key (if not, remove it)
3. Move service role key to Supabase Vault when available

**Effort:** Small (documentation), Medium (rotation)  
**Target Phase:** Phase 1

---

### SEC-012 — No PDPA/Privacy Compliance Framework (Low — Pre-Launch)

**Severity:** LOW (not yet critical — no real users)  
**Evidence:** `01_TANAIR_PROJECT_INPUT.md §20` — all compliance fields `[ISI]`  
**Affected Files:** `docs/project/01_TANAIR_PROJECT_INPUT.md`

**Description:**  
TanAir processes user chat data (potentially including personal data per Malaysia's PDPA). The app currently has:
- No Privacy Policy
- No Terms of Service
- No Cookie Policy
- No data retention policy
- No data deletion mechanism
- No explicit user consent for AI processing of chat content

**Recommendation:**  
Prepare Privacy Policy, Terms, and Cookie Policy before public beta launch. Consult on PDPA obligations.

**Effort:** Large (legal)  
**Target Phase:** Phase 3 (before public beta)

---

## 3. Security Findings Summary

| ID | Finding | Severity | Phase |
|---|---|---|---|
| SEC-001 | Unauthenticated `/api/chat` | CRITICAL | Phase 1 |
| SEC-002 | Plain HTTP to Hermes | CRITICAL | Phase 1 |
| SEC-003 | No rate limiting | CRITICAL | Phase 1 |
| SEC-004 | VPS IP in public repo | CRITICAL | Immediate |
| SEC-005 | `NEXT_PUBLIC_GATEWAY_URL` client-exposed | HIGH | Phase 1 |
| SEC-006 | No inbound auth to Hermes | HIGH | Phase 1 |
| SEC-007 | `alert()` exposes error messages | HIGH | Phase 1/2 |
| SEC-008 | Supabase URL hardcoded | MEDIUM | Phase 1 |
| SEC-009 | No HTTP security headers | MEDIUM | Phase 1 |
| SEC-010 | No input validation | MEDIUM | Phase 1 |
| SEC-011 | Service role key on public-facing VPS | MEDIUM | Phase 1 |
| SEC-012 | No PDPA compliance framework | LOW | Phase 3 |

---

*End of Security Findings — Phase 0B*

