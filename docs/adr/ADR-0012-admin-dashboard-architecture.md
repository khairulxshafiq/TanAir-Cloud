# ADR-0012: Admin Dashboard Architecture

**Date:** 2026-09-20  
**Status:** Proposed  
**Deciders:** Founder, Lead Software Architect, Security Architect  
**Context Tags:** admin, security, audit-log, role-based-access, service-role

---

## Problem Statement
TanAir Cloud lacks operational visibility for the founder and management team (Finding: `existing-feature-matrix.md §10`). There is no interface to view registered users, track conversion rates from Trial Pro to paid plans, audit credit ledger transactions, inspect Hermes health, or manage dispute adjustments. Exposing administrative controls inside the main user application risks privilege escalation or catastrophic token leaks if not strictly isolated.

## Context & Constraints
- **Security Rule:** The Supabase `service_role` key must **NEVER** reach the client browser bundle. It must remain strictly encapsulated within server-side environments.
- **Admin Scope:** User inspection, manual tier modifications, financial ledger audit, system status monitors.
- **Access Gate:** Restricted to founder/super-admin emails marked with `is_admin = true` on their Supabase `profiles` record.

## Options Considered

### Option A: External Third-Party Admin Portal (Retool / Forest Admin)
Connect Supabase directly to Retool or Forest Admin.
- **Pros:** Fast setup with prebuilt data tables.
- **Cons:** Additional monthly subscription costs; third-party vendor risk with sensitive Malaysian user data; disconnected design language.

### Option B: Unified Route within App (`/admin`) using Route Groups (Recommended)
Build a native Next.js App Router sub-tree under `app/(admin)/admin/` with an isolated `AdminLayout`. Guard all paths using edge middleware and execute privileged queries exclusively via Server Components using the `service_role` key.
- **Pros:**
  - Zero external SaaS costs.
  - Native BM-first design consistent with TanAir’s purple-gold Bento design language.
  - Hard security isolation: `service_role` is only invoked inside Next.js Server Components, never exported to client JavaScript.
  - Full audit logging: every administrative override writes an immutable entry to `audit_log`.
- **Cons:** Requires building customized data tables and charts in Phase 8.

## Decision
We decide to adopt **Option B: Unified Route within App (`/admin`) using Route Groups**.

1. Create `app/(admin)/layout.tsx` which enforces that the authenticated user possesses `is_admin === true`. Unauthorized users are immediately redirected to `/chat` with zero administrative HTML payload rendered.
2. In `lib/supabase-admin.ts`, instantiate a server-only Supabase client utilizing `SUPABASE_SERVICE_ROLE_KEY`. This file is restricted from being imported by any client-side component (`"use client"`).
3. All admin actions (such as manually adding credit tokens or modifying user tiers) must record an immutable audit event in the `audit_log` table detailing the admin's user ID, target user ID, reason, and IP hash.

## Consequences

### Positive
- Zero risk of leaking the `service_role` key to browser devtools.
- The founder gains complete visibility over user conversion funnels and platform token burn.
- Sensitive user context and message bodies remain masked in admin lists to safeguard end-user privacy.

### Negative / Trade-offs
- Dedicated admin UI components must be created and maintained in Phase 8.

## Implementation Guidance

### Server-Only Admin Client (`lib/supabase-admin.ts`)
```typescript
import 'server-only';
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is missing.');
}

export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

### Admin Middleware Gate (`middleware.ts` addition)
```typescript
if (request.nextUrl.pathname.startsWith('/admin')) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }
}
```

## Related ADRs
- ADR-0002: Routing Strategy
- ADR-0006: Authentication Boundary
- ADR-0007: Authorization Boundary
- ADR-0015: Observability & Audit Logging
