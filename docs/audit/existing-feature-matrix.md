# Existing Feature Matrix
## Phase 0A — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity  
**Status:** READ-ONLY

---

## 1. Feature Status Legend

| Status | Meaning |
|---|---|
| ✅ Working | Implemented and functional |
| ⚠ Partial | Exists but incomplete or simulated |
| ❌ Not Implemented | Defined in Phase Plan but not in code |
| 🔒 Locked (external) | Exists on VPS but not surfaced in frontend |

---

## 2. Authentication & Identity

| Feature | Status | Notes |
|---|---|---|
| Google OAuth login | ✅ Working | Via Supabase `signInWithOAuth` |
| Logout | ✅ Working | `supabase.auth.signOut()` + clears messages |
| Auth state persistence | ✅ Working | Supabase stores JWT session in browser |
| Loading state during auth check | ✅ Working | `authLoading` spinner |
| Protected UI (chat requires login) | ⚠ Partial | Client-side gate only — no middleware, no API auth |
| Email/password login | ❌ Not implemented | Google only for now |
| Email link login | ❌ Not implemented | |
| User profile page | ❌ Not implemented | |
| Profile editing (nickname, avatar, bio) | ❌ Not implemented | |
| Onboarding flow | ❌ Not implemented | |

---

## 3. Chat Interface

| Feature | Status | Notes |
|---|---|---|
| Send text message | ✅ Working | `handleSendMessage` |
| Receive streaming response | ✅ Working | SSE via `/api/chat` |
| Message bubbles (user vs assistant) | ✅ Working | Styled separately |
| Timestamp on messages | ✅ Working | `toLocaleTimeString` |
| Empty state with suggestions | ✅ Working | 4 quick prompt buttons |
| Loading animation (typing indicator) | ✅ Working | Ping animation while `content === ""` |
| Auto-scroll to bottom | ✅ Working | `messagesEndRef.scrollIntoView` |
| Textarea auto-resize | ✅ Working | Dynamic height via scrollHeight |
| Send on Enter, newline on Shift+Enter | ✅ Working | `handleKeyDown` |
| Disable input while streaming | ✅ Working | `disabled={isStreaming}` |
| Mobile responsive layout | ✅ Working | Drawer sidebar, responsive grid |
| Copy message | ❌ Not implemented | |
| Retry message | ❌ Not implemented | |
| Delete message | ❌ Not implemented | |
| Stream abort (cancel generation) | ❌ Not implemented | |
| Markdown rendering | ❌ Not implemented | `whitespace-pre-wrap` only — bold/lists not rendered |
| Code block rendering | ❌ Not implemented | |
| Message search | ❌ Not implemented | |

---

## 4. Session Management

| Feature | Status | Notes |
|---|---|---|
| Create new chat session | ✅ Working | Adds to in-memory session list |
| Session list in sidebar | ✅ Working | Displayed with timestamp |
| Switch between sessions | ⚠ Partial | Changes `activeSessionId` but does NOT load session messages |
| Session title | ⚠ Partial | Auto-named "Perbualan Awal" / "Sesi Baru N" — not from first message |
| Persist sessions across refresh | ❌ Not implemented | Memory-only |
| Delete session | ❌ Not implemented | |
| Rename session | ❌ Not implemented | |

---

## 5. Agent System

| Feature | Status | Notes |
|---|---|---|
| Agent selector in sidebar | ✅ Working | 6 agents displayed with icon + role |
| Active agent indicator | ✅ Working | Green dot + purple highlight |
| Agent name in chat header | ✅ Working | Shows `activeAgent` |
| Agent name in message attribution | ✅ Working | `${activeAgent} · TanAir` |
| Agent name in textarea placeholder | ✅ Working | `Tanya ${activeAgent}...` |
| Agent routing to Hermes | ❌ Not implemented | `agent` NOT forwarded to gateway |
| Tier-based agent access lock | ❌ Not implemented | All agents accessible to all users |
| Agent capability descriptions | ⚠ Partial | In sidebar only (static text) |

---

## 6. Credits / PAYG System

| Feature | Status | Notes |
|---|---|---|
| Credits display in sidebar | ✅ Working | Shows RM balance chip |
| Credits deduction simulation | ⚠ Simulated | RM 0.02 subtracted per message — not real |
| Credits from Supabase ledger | ❌ Not implemented | No DB table |
| Credits enforcement (block at zero) | ❌ Not implemented | |
| Top-up flow | ❌ Not implemented | |
| Payment gateway integration | ❌ Not implemented | |
| Usage history | ❌ Not implemented | |
| Token-level billing | ❌ Not implemented | |

---

## 7. Subscription / Tiers

| Feature | Status | Notes |
|---|---|---|
| Tier detection | ❌ Not implemented | All users treated as identical |
| Free tier limits | ❌ Not implemented | |
| Trial Pro (72h) | ❌ Not implemented | |
| Pro tier | ❌ Not implemented | |
| Empire tier | ❌ Not implemented | |
| Trial countdown timer | ❌ Not implemented | |
| Upgrade modal | ❌ Not implemented | |
| Pricing page | ❌ Not implemented | |

---

## 8. Memory System

| Feature | Status | Notes |
|---|---|---|
| Memory panel | ❌ Not implemented | |
| Memory suggestions from AI | ❌ Not implemented | |
| User approval/reject memory | ❌ Not implemented | |
| Memory chip in chat | ❌ Not implemented | |
| Memory injected into AI context | ❌ Not implemented | |
| Delete memory | ❌ Not implemented | |

---

## 9. Bot Studio

| Feature | Status | Notes |
|---|---|---|
| Bot list (Bots Saya) | ❌ Not implemented | |
| Bot creation wizard | ❌ Not implemented | |
| Bot identity (name, persona) | ❌ Not implemented | |
| Bot skills/capabilities | ❌ Not implemented | |
| Bot channels (Telegram) | ❌ Not implemented | |
| Bot schedules | ❌ Not implemented | |
| Bot live preview | ❌ Not implemented | |
| Bot tier restrictions | ❌ Not implemented | |

---

## 10. Admin Dashboard

| Feature | Status | Notes |
|---|---|---|
| Admin route guard | ❌ Not implemented | |
| User management | ❌ Not implemented | |
| Usage analytics | ❌ Not implemented | |
| Revenue dashboard | ❌ Not implemented | |
| Audit log | ❌ Not implemented | |
| Connector management | ❌ Not implemented | |

---

## 11. Landing Page

| Feature | Status | Notes |
|---|---|---|
| Public landing page | ❌ Not implemented | `/` is the chat cockpit (auth-gated) |
| Hero section | ❌ Not implemented | |
| Aura Core 3D element (Three.js) | ❌ Not implemented | DEC-009 |
| Features section | ❌ Not implemented | |
| Pricing section | ❌ Not implemented | |
| Demo chat | ❌ Not implemented | |
| Trust strip | ❌ Not implemented | |
| Footer | ❌ Not implemented | |
| Navigation bar | ❌ Not implemented | |

---

## 12. Infrastructure & Observability

| Feature | Status | Notes |
|---|---|---|
| Vercel deployment | ✅ Ready (not confirmed live) | Code is deployable |
| Supabase project configured | ✅ Working | Auth works |
| Environment variables documented | ✅ Working | `.env.example` present |
| Error tracking | ❌ Not implemented | No Sentry or equivalent |
| Structured logging | ❌ Not implemented | Console.error only |
| Analytics | ❌ Not implemented | |
| CI/CD pipeline | ❌ Not implemented | No GitHub Actions |
| Health check route | ❌ Not implemented | |
| Rate limiting | ❌ Not implemented | |

---

## 13. Summary Count

| Status | Count |
|---|---|
| ✅ Working | 22 |
| ⚠ Partial / Simulated | 9 |
| ❌ Not Implemented | ~65 |

> [!NOTE]
> The current prototype covers approximately **25%** of the Phase 3–6 feature scope, primarily focused on the core chat UI and auth. Everything beyond basic chat (subscriptions, memory, bots, admin, landing) is at 0% implementation.

---

*End of Existing Feature Matrix — Phase 0A*

