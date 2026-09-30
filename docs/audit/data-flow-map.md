# Data Flow Map
## Phase 0A — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity  
**Status:** READ-ONLY

---

## 1. Authentication Flow

```
User clicks "Log masuk dengan Google"
    │
    ▼
supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })
    │
    ▼
Browser redirects to → Supabase Auth Endpoint
    │                   https://[REDACTED].supabase.co/auth/v1/oauth/authorize
    ▼
Google OAuth Consent Screen
    │
    ▼
Google redirects back → Supabase callback
    │                    https://[REDACTED].supabase.co/auth/v1/callback
    ▼
Supabase creates session, redirects to → window.location.origin (/)
    │
    ▼
supabase.auth.onAuthStateChange fires with session
    │
    ▼
setUser(session.user) — user object contains: id, email, avatar_url (from Google)
    │
    ▼
UI re-renders: shows ChatCockpit
```

**Data stored on login:**
- Supabase session token stored in browser (localStorage or cookie — default Supabase behaviour)
- `user.email` rendered in header
- No user data written to any Supabase DB table by TanAir code (no custom `users` table write)

---

## 2. Chat Message Flow (End-to-End)

```
User types message + presses Enter
    │
    ▼
handleSendMessage(text)
    │
    ├─ Creates userMessage object { id, role: "user", content, timestamp }
    ├─ Creates assistantPlaceholder { id, role: "assistant", content: "" }
    ├─ setMessages([...prev, userMessage, placeholder])
    ├─ setIsStreaming(true)
    │
    ▼
fetch("POST /api/chat", { message, sessionId, agent })
    │
    ▼
[SERVER: app/api/chat/route.ts]
    │
    ├─ Parse body
    ├─ Check HERMES_GATEWAY_URL || NEXT_PUBLIC_GATEWAY_URL
    │
    ├─ [If gateway URL exists]
    │       POST ${gatewayUrl}/api/chat/start
    │           body: { message, session_id: sessionId }
    │           timeout: 3500ms
    │       ── If ok and stream_id returned ──►
    │           GET ${gatewayUrl}/api/chat/stream?stream_id={id}
    │           Pipe raw SSE body to browser response
    │
    └─ [If gateway unreachable / timeout / no URL]
            Generate BM keyword-matched reply
            Stream words with 25ms delay
            Send data: [DONE]
    │
    ▼
[CLIENT: page.tsx streaming reader]
    │
    ReadableStream reader loop:
        chunk → split("\n\n") → filter "data: "
        JSON.parse → extract .text
        setMessages: update assistantPlaceholder.content += chunk
    │
    ▼
Message rendered in UI (whitespace-preserved text)
    │
    ▼
setCredits: subtract RM 0.02 (simulated, in-memory)
setIsStreaming(false)
```

---

## 3. Session Management Flow

```
Page loads
    │
    ▼
sessions === [] → create initial session { id: "session-1", title: "Perbualan Awal" }
    │
    ▼
User clicks "Sesi Perbualan Baru"
    │
    ▼
createNewSession { id: `session-${Date.now()}`, title: "Sesi Baru N" }
    │
    ▼
setMessages([]) — previous messages cleared in memory
    │
    ▼
User switches sessions by clicking session in history list
    │
    ▼
setActiveSessionId(id) — UI switches active highlight
DOES NOT restore messages (messages are not stored per session)
```

> [!WARNING]
> **Session switching does not restore messages.** Clicking a previous session in the sidebar sets `activeSessionId` but does NOT load its messages because messages are all in a single shared `messages` state array. All messages are lost on session switch or page refresh.

---

## 4. Logout Flow

```
User clicks logout button
    │
    ▼
supabase.auth.signOut()
    │
    ▼
setUser(null)
setMessages([])
    │
    ▼
UI shows login gate
```

---

## 5. Data Storage Map

### Current State (Prototype)

| Data Type | Storage Location | Persistence | User-Isolated |
|---|---|---|---|
| Auth session (Supabase JWT) | Browser localStorage / cookie (Supabase default) | ✅ Until logout | ✅ Yes |
| User profile | Supabase `auth.users` table (managed by Supabase) | ✅ Permanent | ✅ Yes |
| Chat messages | React state (`useState`) | ❌ Memory only — lost on refresh | ✅ By session |
| Chat sessions | React state | ❌ Memory only — lost on refresh | ✅ By session |
| PAYG credits balance | React state (`useState("10.00")`) | ❌ Memory only | N/A |
| Agent selection | React state | ❌ Memory only | N/A |
| Mobile menu state | React state | ❌ Memory only | N/A |

### Required State (Production — Phase 10)

| Data Type | Planned Storage | Supabase Table | RLS Required |
|---|---|---|---|
| Chat messages | Supabase PostgreSQL | `messages` | ✅ Yes |
| Chat sessions | Supabase PostgreSQL | `sessions` | ✅ Yes |
| PAYG credits balance | Supabase PostgreSQL | `credit_ledger` | ✅ Yes |
| Agent memories | Supabase PostgreSQL | `memories` | ✅ Yes |
| User profile (extended) | Supabase PostgreSQL | `profiles` | ✅ Yes |
| Bot definitions | Supabase PostgreSQL | `bots` | ✅ Yes |
| Bot connector secrets | Supabase Vault or VPS secret store | — | N/A |
| File/avatar uploads | Supabase Storage | `avatars` bucket | ✅ Yes |

---

## 6. Data Flow Diagram

```
                        ┌─────────────────────────────┐
                        │     BROWSER (React Client)   │
                        │  page.tsx – CloudCockpit     │
                        │                              │
                        │  State:                      │
                        │  • user (Supabase User)      │
                        │  • sessions (memory)         │
                        │  • messages (memory)         │
                        │  • credits (memory, RM10.00) │
                        │  • activeAgent               │
                        └──────────┬──────────────────┘
                                   │ fetch POST /api/chat
                                   │ (message, sessionId, agent)
                                   ▼
                        ┌─────────────────────────────┐
                        │    NEXT.JS SERVER (Vercel)   │
                        │  app/api/chat/route.ts       │
                        │  runtime: nodejs             │
                        │                              │
                        │  1. Reads gateway URL env    │
                        │  2. Attempts Hermes proxy    │
                        │  3. Falls back to BM AI      │
                        └──────────┬──────────────────┘
                                   │ POST /api/chat/start
                                   │ GET /api/chat/stream
                                   ▼
                        ┌─────────────────────────────┐
                        │   VPS HERMES (43.134.x.x)   │
                        │   Port :9119 (Gateway)      │
                        │                             │
                        │   • Hermes ReAct Engine     │
                        │   • Aura-Trade (systemd)    │
                        │   • OBC6 ProductGateway     │
                        │   • OpenD Docker (:11111)   │
                        └─────────────────────────────┘

                        ┌─────────────────────────────┐
                        │      SUPABASE               │
                        │  Project: AuraAgentic       │
                        │                             │
                        │  Auth: Google OAuth ✅      │
                        │  DB: No TanAir tables yet  │
                        │  Storage: Not configured    │
                        └─────────────────────────────┘
```

---

## 7. Sensitive Data Handling Assessment

| Data | How Handled | Risk |
|---|---|---|
| User email | Rendered in UI header (`user.email`) | LOW — user can see own email |
| Google OAuth tokens | Managed by Supabase, not handled by TanAir code | ✅ Safe |
| Supabase anon key | In `lib/supabase.ts` — falls back to empty string if env absent | LOW — anon key is designed to be public |
| Supabase URL | In `.env.example` and `lib/supabase.ts` — public safe | LOW |
| VPS IP address | In `.env.example` — committed to repo | MEDIUM — VPS IP exposed in public repo |
| Chat messages | Sent to Hermes gateway over plain HTTP | HIGH — unencrypted in transit |
| User session ID | `activeSessionId` sent to Hermes as `session_id` | MEDIUM — no validation |
| PAYG credits | Simulated in-memory — not real money | LOW (prototype) |

---

*End of Data Flow Map — Phase 0A*

