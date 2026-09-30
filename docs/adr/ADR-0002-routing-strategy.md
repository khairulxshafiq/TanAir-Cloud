# ADR-0002: Routing Strategy

**Date:** 2026-09-20  
**Status:** Proposed  
**Deciders:** Founder, Lead Software Architect  
**Context Tags:** routing, nextjs-app-router, route-groups, middleware, security

---

## Problem Statement
Currently, the entire TanAir Cloud user interface is rendered on the root path `/` inside `app/page.tsx` (Finding: `route-inventory.md`). Authentication is evaluated entirely in browser state, with no Next.js `middleware.ts` to guard routes or serverless endpoints (Finding: `ARC-003`, `SEC-001`). There is no segmentation between marketing visitors, authenticated SaaS users, and administrative personnel.

## Context & Constraints
- **Audit Findings:** `ARC-003` (No middleware), `SEC-001` (Unauthenticated API routes).
- **Target Experience:**
  - Public marketing landing page, pricing, and onboarding for prospective customers.
  - Full-screen multi-agent cockpit for authenticated users.
  - Dedicated administrative dashboard for operations and revenue telemetry.
- **Framework:** Next.js 16 App Router using nested layouts and Route Groups.

## Options Considered

### Option A: Flat Routing with Conditional Component Rendering
Render everything conditionally on `/` based on state variables (`isLanding`, `isLoggedIn`, `isAdmin`).
- **Pros:** Minimal routing changes from current state.
- **Cons:** Destroys browser history and deep-linking; prevents SEO on landing pages; insecure client-side protection.

### Option B: Separate Subdomains (`app.tanair.my`, `admin.tanair.my`)
Deploy distinct domains for marketing, app, and admin.
- **Pros:** Complete isolation of cookies and deployment lifecycles.
- **Cons:** High DNS/SSL management overhead; CORS complexities; excessive cost and maintenance for early SaaS stage.

### Option C: Next.js Route Groups with Edge Middleware (Recommended)
Use App Router Route Groups `(public)`, `(app)`, and `(admin)` with dedicated layouts and centralized `middleware.ts` protection.
- **Pros:**
  - Standard App Router idiomatic pattern.
  - Allows distinct layout wrappers (`PublicLayout`, `AppShellLayout`, `AdminLayout`) without affecting URL paths.
  - Server-side cookie validation via `@supabase/ssr` in `middleware.ts` before requests hit page or API renderers.
- **Cons:** Requires reorganizing `app/` folder during Phase 2.

## Decision
We decide to adopt **Option C: Next.js Route Groups with Edge Middleware**.

1. **`(public)`**: Contains `/`, `/pricing`, `/onboarding`. Uses a marketing header and footer layout. No authentication required.
2. **`(app)`**: Contains `/chat`, `/profile`, `/bots`, `/settings`. Enclosed by `AppShellLayout` (sidebar, active agent status, user menu). Guarded by `middleware.ts`.
3. **`(admin)`**: Contains `/admin`, `/admin/users`, `/admin/revenue`. Enclosed by `AdminLayout`. Guarded by `middleware.ts` requiring `is_admin = true`.
4. **`/api/*`**: Server-side endpoints guarded by middleware, returning 401 JSON responses for unauthenticated requests.

## Consequences

### Positive
- Direct URL bookmarking and browser back/forward navigation work seamlessly.
- Eliminates client-side auth flickering and blank screens.
- Server-side route interception blocks unauthorized visitors before components load.
- Allows landing page SEO and metadata optimization independent of the app cockpit.

### Negative / Trade-offs
- Requires migrating from the single `/` prototype to `/chat` for the authenticated cockpit in Phase 2.
- Session cookie synchronization requires `@supabase/ssr`.

## Implementation Guidance

### Route Layout Structure
```
app/
├── (public)/
│   ├── layout.tsx         # Minimal layout with Marketing Nav & Footer
│   ├── page.tsx           # Public landing page
│   ├── pricing/page.tsx   # Tier breakdown & comparison table
│   └── onboarding/page.tsx# New user profile setup
├── (app)/
│   ├── layout.tsx         # Authenticated AppShell (Sidebar, Agent Header)
│   ├── chat/page.tsx      # Main agent interaction cockpit
│   ├── profile/page.tsx   # User profile & AI memory manager
│   └── bots/page.tsx      # Custom bot studio list
├── (admin)/
│   ├── layout.tsx         # Dedicated administrative navigation
│   └── admin/page.tsx     # Operations, user ledger & system health
└── api/
    └── chat/route.ts      # Server-side streaming endpoint
```

### Middleware Guard Logic (`middleware.ts`)
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // API Guard
  if (request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/public/')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Valid session required' }, { status: 401 });
    }
  }

  // App Guard
  if (request.nextUrl.pathname.startsWith('/chat') || request.nextUrl.pathname.startsWith('/bots')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
```

## Related ADRs
- ADR-0001: Application Architecture
- ADR-0006: Authentication Boundary
- ADR-0007: Authorization Boundary
