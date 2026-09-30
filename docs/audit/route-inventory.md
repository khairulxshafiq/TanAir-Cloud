# Route Inventory
## Phase 0A — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity  
**Status:** READ-ONLY

---

## 1. Next.js App Router — All Routes

### Page Routes

| Route | File | Type | Auth Required | Status |
|---|---|---|---|---|
| `/` | `app/page.tsx` | Client Component (`"use client"`) | No (but UI gates features) | ✅ Working |

### API Routes

| Route | File | Method | Runtime | Auth | Status |
|---|---|---|---|---|---|
| `/api/chat` | `app/api/chat/route.ts` | `POST` | `nodejs` | ❌ None | ✅ Working |

---

## 2. Route Details

### `GET /` (page route)

**File:** `app/page.tsx`  
**Component name:** `CloudCockpit`  
**Type:** `"use client"` — fully client-rendered (no RSC streaming)

#### Behaviour Flow
1. On mount: calls `supabase.auth.getSession()` to check auth state
2. Subscribes to `supabase.auth.onAuthStateChange` for session updates
3. If `authLoading === true`: renders full-screen loading spinner
4. If `user === null`: renders login gate (Google OAuth button)
5. If `user !== null`: renders full chat cockpit UI

#### UI Sections (when authenticated)
- **Sidebar** (left, responsive drawer on mobile)
  - Brand header (TanAir Cloud logo text)
  - "Sesi Perbualan Baru" button (creates new in-memory session)
  - Agent selector (6 agents: Aura, Aura-Trade, Aura-Pen, Aura-Art, Aura-Scout, Aura-Vision)
  - Session history list (in-memory only)
  - Bottom: PAYG credits chip + logout button
- **Main content** (right)
  - Header: active agent info, mobile menu button, "Multi-Tenant Sandbox Safe" badge, user email
  - Message stream (empty state with 4 suggestion buttons, or message bubbles)
  - Footer: textarea input + send button + keyboard hint

#### State Variables
| State | Type | Initial Value | Notes |
|---|---|---|---|
| `user` | `User \| null` | `null` | Supabase auth user |
| `authLoading` | `boolean` | `true` | Shows spinner while checking |
| `activeAgent` | `string` | `"Aura"` | Selected agent ID |
| `sessions` | `ChatSession[]` | `[]` | In-memory session list |
| `activeSessionId` | `string` | `"session-1"` | Active session ID |
| `messages` | `Message[]` | `[]` | Current session messages |
| `input` | `string` | `""` | Textarea content |
| `isStreaming` | `boolean` | `false` | Streaming lock |
| `credits` | `string` | `"10.00"` | Simulated PAYG balance |
| `mobileMenuOpen` | `boolean` | `false` | Mobile sidebar state |

---

### `POST /api/chat`

**File:** `app/api/chat/route.ts`  
**Runtime:** `nodejs` (NOT edge runtime)  
**Content-Type expected:** `application/json`  
**Response:** `text/event-stream` (SSE)

#### Request Body
```json
{
  "message": "string (required)",
  "sessionId": "string (optional, default: 'default')",
  "agent": "string (optional, default: 'Aura')"
}
```

#### Processing Logic
```
1. Parse request body
2. Validate: message must be present (400 if missing)
3. Read env: HERMES_GATEWAY_URL || NEXT_PUBLIC_GATEWAY_URL
4. If gatewayUrl exists:
   a. POST to ${gatewayUrl}/api/chat/start (3500ms timeout)
   b. If ok and stream_id returned:
      GET ${gatewayUrl}/api/chat/stream?stream_id={id}
      Pipe body to response stream
      Set forwarded = true
5. If NOT forwarded (gateway down or no gatewayUrl):
   a. Determine reply based on message keyword matching (BM)
   b. Split reply into words, stream each with 25ms delay
   c. Send data: [DONE]
6. Return ReadableStream response with SSE headers
```

#### SSE Token Format (from gateway)
```
data: {"text": "...chunk..."}\n\n
data: [DONE]\n\n
```

#### Authentication
- ❌ **No auth check on API route** — any HTTP client can POST to `/api/chat` without a Supabase session token
- The Hermes gateway also receives no user authentication token

#### Known Issues
| Issue | Severity | Notes |
|---|---|---|
| No auth validation | HIGH | Unauthenticated clients can use the API and proxy to Hermes |
| `agent` parameter is passed to fallback only, NOT to Hermes gateway | MEDIUM | Gateway receives `message` and `session_id` but NOT `agent` |
| `sessionId` sent to Hermes as `session_id` | INFO | Confirm Hermes expects this field name |
| No request size limit | MEDIUM | Large `message` strings could abuse the route |
| No rate limiting | HIGH | No protection against abuse |
| Error swallowed silently from gateway | LOW | `catch { forwarded = false }` hides gateway errors |

---

## 3. Missing Routes (vs. Phase Plan)

| Required Route | Phase | Status |
|---|---|---|
| `GET /onboarding` | Phase 3 | ❌ Not implemented |
| `GET /chat` | Phase 4 | ❌ Not implemented (merged into `/`) |
| `GET /profile` | Phase 5 | ❌ Not implemented |
| `GET /bots` | Phase 7 | ❌ Not implemented |
| `GET /admin` | Phase 8 | ❌ Not implemented |
| `GET /pricing` | Phase 3 | ❌ Not implemented |
| `POST /api/topup` | Phase 6 | ❌ Not implemented |
| `POST /api/memory` | Phase 5 | ❌ Not implemented |
| `POST /api/bots` | Phase 7 | ❌ Not implemented |
| `GET /api/admin/*` | Phase 8 | ❌ Not implemented |
| Auth callback route | Phase 3 | Handled by Supabase redirect (external) |

---

## 4. Middleware

| File | Status | Notes |
|---|---|---|
| `middleware.ts` | ❌ Missing | No route-level auth middleware exists. Auth is handled client-side in `page.tsx` only. |

> [!WARNING]
> Without `middleware.ts`, the `/api/chat` route is publicly accessible without authentication. Anyone who discovers the endpoint can send arbitrary messages to the Hermes gateway. This is a security gap that must be addressed in Phase 4.

---

## 5. Next.js Config Assessment

**File:** `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

> [!NOTE]
> The Next.js config is completely empty/default. No custom headers, rewrites, redirects, or experimental flags are set. This is fine for the current prototype stage but will need configuration for:
> - Security headers (CSP, X-Frame-Options, etc.)
> - API route body size limits
> - Image domains (when avatar/logo upload is added)

---

*End of Route Inventory — Phase 0A*

