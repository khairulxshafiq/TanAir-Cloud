# ADR-0013: Supabase Migration Strategy

**Date:** 2026-09-20  
**Status:** Proposed  
**Deciders:** Founder, Lead Software Architect, Platform Engineer  
**Context Tags:** supabase, migrations, database, postgresql, rls, phase-10

---

## Problem Statement
The existing TanAir Cloud application uses Supabase strictly for Google OAuth client authentication (`@supabase/supabase-js`). The database holds zero application tables for TanAir (Finding: `repository-inventory.md`, `data-flow-map.md §5`). In Phase 10, the platform will migrate from prototype in-memory state to persistent Supabase PostgreSQL tables (`profiles`, `sessions`, `messages`, `credit_ledger`, `memories`, `bots`, `audit_log`). Without a version-controlled database migration strategy, applying schema changes across local, staging, and production will cause schema drift, downtime, and data corruption.

## Context & Constraints
- **Audit Findings:** `repository-inventory.md` (no `supabase/` directory), `environment-inventory.md` (single production Supabase instance used for dev).
- **Security Rule:** Every multi-tenant table MUST enable PostgreSQL Row Level Security (RLS) policies ensuring users cannot query or mutate records belonging to other accounts.
- **Migration Execution:** Managed declaratively via the Supabase CLI (`supabase/migrations/*.sql`).

## Options Considered

### Option A: Manual SQL Queries via Supabase Web Dashboard
Create tables and modify columns by clicking in the Supabase Table Editor UI.
- **Pros:** Fast for initial exploration.
- **Cons:** Zero change history; non-reproducible; impossible to synchronize between staging and production; high risk of human error in production.

### Option B: Prisma or Drizzle ORM Migrations
Introduce an ORM (Prisma/Drizzle) to handle migrations and client generation.
- **Pros:** TypeScript schema-first modeling.
- **Cons:** Adds heavy build-time steps and client dependencies; abstracts away PostgreSQL-native RLS policies and SQL security triggers, which are critical for Supabase security.

### Option C: Declarative Version-Controlled SQL via Supabase CLI (Recommended)
Store plain SQL migration files in `supabase/migrations/` using standard timestamp prefixes. Apply migrations automatically in CI/CD using `supabase db push`.
- **Pros:**
  - Native Supabase workflow: 100% compatible with Supabase branching and local Docker development.
  - Full control over raw SQL: explicit RLS policies, indexing, composite unique constraints, and triggers.
  - Zero application runtime dependencies.
- **Cons:** Developers must understand standard SQL syntax and RLS expressions.

## Decision
We decide to adopt **Option C: Declarative Version-Controlled SQL via Supabase CLI**.

1. Create a `supabase/migrations/` directory tracked in Git.
2. Migrations are executed in 7 strict sequence files:
   - `001_profiles.sql` (Base user metadata and subscription tier)
   - `002_sessions.sql` (Chat threads)
   - `003_messages.sql` (Conversation bubbles)
   - `004_credit_ledger.sql` (Append-only financial token ledger)
   - `005_memories.sql` (User-approved memory facts)
   - `006_bots.sql` (Custom Bot Studio definitions)
   - `007_audit_log.sql` (Platform observability and security audit)
3. Every table must execute `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;` before any data insertion.
4. Separate `tanair-dev`, `tanair-staging`, and `tanair-prod` Supabase projects to eliminate environment pollution.

## Consequences

### Positive
- Predictable, automated deployments: CI/CD runs migrations automatically against staging and production.
- Auditable schema history in Git: every column addition, index, or policy change is reviewed via Pull Requests.
- Unbreakable tenant isolation through native PostgreSQL RLS.

### Negative / Trade-offs
- Developers must run `supabase start` or connect to a development database to test migration files locally.

## Implementation Guidance

### Migration Execution Order & File Structure
```
supabase/
├── config.toml
├── migrations/
│   ├── 20260920000001_create_profiles.sql
│   ├── 20260920000002_create_sessions.sql
│   ├── 20260920000003_create_messages.sql
│   ├── 20260920000004_create_credit_ledger.sql
│   ├── 20260920000005_create_memories.sql
│   ├── 20260920000006_create_bots.sql
│   └── 20260920000007_create_audit_log.sql
└── seed.sql
```

### Auto-Profile Creation Trigger (`20260920000001_create_profiles.sql`)
```sql
-- Automatically create profile when a new user signs in with Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, tier)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Related ADRs
- ADR-0004: Repository Pattern
- ADR-0006: Authentication Boundary
- ADR-0009: Quota Architecture
