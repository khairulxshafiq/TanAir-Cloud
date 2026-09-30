# 04 — TanAir Master Blueprint

# TanAir Cloud Master Product and Engineering Blueprint

Version: 1.1  
Status: Approved Direction  
Note: Struktur folder (apps/web/src/...) adalah RECOMMENDED — repositori
semasa guna flat Next.js (app/, lib/, tests/). Tukar ke monorepo jika
ada logic sebenar utk multi-package, jangan refactor untuk estetika.

---

# 1. Product Vision

TanAir ialah platform AI Bahasa Melayu-first yang menyatukan:

- AI Chat
- Trade mode
- Image mode
- Video mode untuk Empire
- Kewangan
- User profile context
- User-approved memories
- Custom Bot Builder
- Schedules
- Connectors
- Subscription and quota
- SaaS administration

---

# 2. Product Layers

## TanAir Chat

Pengalaman pengguna paling mudah.

Includes:

- Conversations
- Modes
- Context
- Memory
- Trial
- Quota

## TanAir Studio

Pengalaman advanced.

Includes:

- Profile
- Bots Saya
- Bot Builder
- Skills
- Schedules
- Connections

## TanAir Admin

Pengalaman operasi SaaS.

Includes:

- Overview
- Users
- Consumption
- Revenue
- Connectors
- Audit Log
- Settings

---

# 3. Core Product Rules

- BM-first
- Mobile-first
- Progressive disclosure
- No unnecessary complexity
- User-controlled memory
- Transparent trial
- Transparent quota
- Clear simulated-feature labels
- No unverified privacy claims
- No browser-stored production secrets
- No direct vendor coupling in UI

---

# 4. Subscription Model

## Free

- Chat
- 10,000 monthly chat tokens
- Basic user profile
- Basic bot access as configured

## Trial Pro

Duration:

72 hours

Capabilities:

- Chat
- Trade
- Image

Not included:

- Video
- Empire-only connectors or skills

After expiry:

- Return to Free
- Preserve user data
- Lock unavailable modes
- Show upgrade option

## Pro

- Chat
- Trade
- Image
- 150,000 monthly chat and trade tokens
- Pro bot skills

## Empire

- All Pro features
- Video
- Advanced bot skills
- Advanced connectors
- 400,000 monthly chat and trade tokens

---

# 5. Usage Model

Token-based:

- Chat input
- Chat output
- Trade input
- Trade output

Counter-based:

- Search requests
- Image generations
- Video jobs or video seconds

Do not combine all capability usage under one token counter.

---

# 6. Top-up Model

Packages:

- 50,000 tokens for RM5.90
- 150,000 tokens for RM14.90

Applies to:

- Chat
- Trade

Payment remains simulated until a production billing integration is approved.

All money is stored in minor units.

---

# 7. Onboarding

Three screens:

1. Name
2. Primary goal
3. Ready

Full profile remains optional.

Completing onboarding:

- Creates minimal profile
- Starts Trial Pro
- Generates initial context
- Navigates to chat

---

# 8. Chat

Features:

- Conversation sidebar
- New chat
- Search chats
- Message streaming
- Copy reply
- Retry failed message
- Compact composer
- Mode icons
- Context chip
- Memory chip
- Quota indicator
- Trial countdown

Keyboard shortcuts:

- Ctrl or Cmd + K: search
- Ctrl or Cmd + Shift + N: new chat
- Enter: send
- Shift + Enter: new line
- Escape: close modal or drawer

---

# 9. Profile Context

Profile context is explicit user information.

Sources:

- Name
- Bio
- Goals
- Language
- Profession
- Primary onboarding goal

Users can:

- Edit context
- Override generated context
- Disable context globally
- Disable context per conversation
- Clear local profile data

---

# 10. Memory

Memory is separate from profile context.

Only approved memories enter the agent payload.

Memory candidates:

- Suggested
- Editable
- Acceptable
- Dismissible

Never automatically store sensitive information.

---

# 11. Bot Builder

Three steps:

## Identiti

- Name
- Avatar
- Personality
- Language style

## Cerapan and Skills

- Task description
- Skills
- Tier locks

## Sambungan and Jadual

- TanAir
- Telegram prototype
- Email coming soon
- One or more schedules

Each bot:

- Has its own thread
- Has status
- Has skills
- Has schedules
- Can be active or sleeping

---

# 12. Admin Dashboard

## Overview

- MRR
- Active users
- Usage
- Bots created
- 30-day chart
- Recent signups

## Users

- Search
- Filters
- User detail drawer
- Profile
- Tier
- Trial
- Billing
- Consumption
- Bot list

## Connectors

- Airtable
- Telegram
- Facebook Page
- Billplz

## Audit Log

- Filterable
- Expandable
- Sanitised
- Append-only through repository interface

## Revenue

- Subscription revenue
- Top-up revenue
- Completed transactions only

---

# 13. Architecture Direction

```text
Pages and UI
    ↓
Application Services
    ↓
Domain Rules
    ↓
Repository Interfaces
    ↓
Adapters
    ↓
localStorage / Supabase / Hermes / Connectors
```

Rules:

- UI cannot access localStorage directly
- UI cannot access Supabase directly
- UI cannot call Hermes directly
- Domain cannot depend on DOM
- Repository contracts must be vendor-neutral
- Production secrets cannot enter browser code
- Admin UI does not define production authorisation

---

# 14. Recommended Repository Structure

```text
tanair-cloud/
├── apps/
│   └── web/
│       ├── public/
│       └── src/
│           ├── app/
│           ├── pages/
│           ├── features/
│           ├── components/
│           ├── domain/
│           ├── services/
│           ├── repositories/
│           ├── lib/
│           ├── styles/
│           └── tests/
├── packages/
│   ├── contracts/
│   ├── design-tokens/
│   └── test-utils/
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── tests/
│   └── seed.sql
├── docs/
│   ├── project/
│   ├── adr/
│   ├── architecture/
│   ├── audit/
│   ├── operations/
│   ├── runbooks/
│   └── testing/
├── scripts/
├── .github/
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
└── package.json
```

Final structure may be adjusted after Phase 0 audit.

Do not reorganise the repository before understanding existing constraints.

---

# 15. Security Requirements

- No secrets in repository
- No production secrets in localStorage
- No service-role key in browser
- Sanitise audit payloads
- Validate file uploads
- Encode user-generated output
- Avoid unsafe `innerHTML`
- Protect admin operations server-side in production
- Use RLS for exposed Supabase tables
- Test cross-user denial
- Do not expose system prompts
- Do not log full personal context by default
- Do not log raw credentials
- Use confirmation for destructive actions

---

# 16. Accessibility Requirements

- Keyboard navigation
- Visible focus
- Semantic headings
- Labels for all fields
- Accessible icon buttons
- Focus-trapped modals
- Drawer focus management
- `aria-live` for feedback
- Reduced-motion support
- Status not communicated through colour alone
- Accessible chart alternative
- Mobile support from 320px

---

# 17. Performance Requirements

- Lazy-load Three.js
- Static hero fallback
- Lazy-load Bot Builder
- Avoid heavy chart libraries
- Avoid unnecessary animation loops
- Pause visual work in hidden tabs
- Clean up listeners
- Debounce search
- Keep dependencies minimal
- Track bundle size
- Paginate or virtualise large datasets when required

---

# 18. Documentation Requirements

Every feature should document:

- Purpose
- Public API
- Data ownership
- Dependencies
- Events
- Permissions
- Security considerations
- Tests
- Migration notes
- Known limitations

Every significant architectural decision requires an ADR.

---

# 19. Testing Requirements

Minimum checks:

- Lint
- Format
- Type check
- Unit tests
- Repository contract tests
- Integration tests
- Accessibility tests
- Critical end-to-end journeys
- Production build
- Dependency audit
- Secret scan

---

# 20. Release Principle

No phase proceeds automatically.

Each phase ends with:

- Completion report
- Quality gate
- Founder review
- Explicit instruction for the next phase

