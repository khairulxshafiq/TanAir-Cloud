# 05 — TanAir Phase Plan

# TanAir Cloud Phase Plan

Version: 1.0  
Execution model: One phase at a time

---

# Phase 0A: Read-Only Discovery

## Objective

Understand the existing TanAir ecosystem without changing source code.

## Activities

- Repository inventory
- Git status and branch review
- Dependency inventory
- Route inventory
- Existing feature inventory
- Hermes integration mapping
- Environment inventory
- Deployment inventory
- Test inventory
- Documentation inventory
- Secret exposure review
- Data-flow mapping

## Outputs

```text
docs/audit/repository-inventory.md
docs/audit/dependency-map.md
docs/audit/route-inventory.md
docs/audit/hermes-integration-map.md
docs/audit/data-flow-map.md
docs/audit/existing-feature-matrix.md
```

## Gate

- No source file changed
- Existing capabilities documented
- Unknown items disclosed
- Assumptions clearly labelled
- Stop after report

---

# Phase 0B: Audit and Risk Register

## Objective

Assess architecture, security, accessibility, performance and operations.

## Activities

- Architecture audit
- Security audit
- Accessibility audit
- Performance audit
- Storage audit
- Dependency audit
- Operational readiness review
- Risk classification
- Remediation planning

## Outputs

```text
docs/audit/architecture-findings.md
docs/audit/security-findings.md
docs/audit/accessibility-findings.md
docs/audit/performance-findings.md
docs/audit/risk-register.md
docs/audit/remediation-plan.md
```

## Gate

- All critical findings have actions
- All high findings have owners or proposals
- Evidence references source location
- No feature implementation
- Stop after report

---

# Phase 0C: Architecture Baseline

## Objective

Approve architecture before refactoring or feature work.

## Activities

Create ADRs for:

- Application architecture
- Routing
- State management
- Repository pattern
- Hermes adapter
- localStorage to Supabase migration
- Entitlement model
- Audit logging
- Admin authorisation
- Connector secrets

## Gate

- Dependency direction confirmed
- Data ownership confirmed
- Client and server boundaries confirmed
- Migration strategy confirmed
- Stop for approval

---

# Phase 1: Engineering Foundation

## Objective

Create a reliable and repeatable development baseline.

## Checklist

- TypeScript strict mode
- Linting
- Formatting
- EditorConfig
- Runtime version pinning
- Dependency lockfile
- Environment validation
- Test runner
- Build command
- Secret scanning
- Dependency scanning
- CI workflow
- Pull request template
- CODEOWNERS
- README
- CONTRIBUTING
- SECURITY
- CHANGELOG

## Gate

The following must pass:

```text
lint
format check
typecheck
test
production build
secret scan
dependency audit
```

---

# Phase 1C: Design System and Application Shell

**NOTE NUMBERING:** Dokumen 01_TANAIR_PROJECT_INPUT.md guna fasa
produk (Phase 2 = Private Alpha). Untuk elak konflik nombor, fasa
Design System & Shell ini dirujuk sebagai **Phase 1C** dalam semua
arahan operasi. Numbering di bawah kekal 2 kerana ini urutan build
DALAM foundation, bukan fasa produk.

## Objective

Build reusable foundations before feature pages.

## Components

- Tokens
- Theme engine
- Buttons
- Inputs
- Cards
- Badges
- Tooltips
- Modal
- Drawer
- Toast
- Skeleton
- Empty state
- Progress
- Accessible icon button

## Gate

- Dark and light theme coherent
- Keyboard access
- Focus management
- Reduced motion
- Mobile 320px support
- No duplicate modal or toast systems

---

# Phase 3: Landing, Onboarding and Demo

## Objective

Allow a first-time visitor to understand and try TanAir.

## Scope

- Landing navbar
- Aura Core hero
- CTA
- Demo chat
- Pricing
- Trust strip
- Footer
- Three-step onboarding
- Trial Pro activation

## Gate

- No dead ends
- Demo limited to three user messages
- Demo clearly simulated
- Trial includes Chat, Trade and Image only
- Video remains locked
- Three.js has fallback

---

# Phase 4: Core Chat and Hermes Adapter

## Objective

Connect the UI to Hermes through a stable adapter.

## Scope

- Chat service
- Hermes adapter
- Mock and production adapters
- Streaming parser
- Abort handling
- Error mapping
- Retry behaviour
- Thread persistence
- Mode selection
- Permission checks
- Copy and retry controls

## Gate

- UI does not call Hermes directly
- Adapter can be replaced
- Network failures preserve messages
- System prompt not exposed
- Sensitive payloads not logged

---

# Phase 5: Profile, Context and Memory

## Objective

Make TanAir personal while preserving user control.

## Scope

- Full profile
- Context builder
- Context chip
- Thread-level context control
- Memory panel
- Memory candidates
- Approval workflow
- Delete and clear controls
- Payload injection tests

## Gate

- No memory saved without approval
- Deleted memory leaves future payloads
- Sensitive memory filtering
- Context usage visible to user

---

# Phase 6: Trial, Entitlements and Quota

## Objective

Centralise capability access and usage control.

## Scope

- Trial state
- Base and effective tier
- Permission matrix
- Countdown
- Trial expiry
- Usage allowance
- Quota thresholds
- Top-up packages
- Mock transactions
- Upgrade modal

## Gate

Permission matrix tests:

| Access | Chat | Trade | Image | Video |
|---|---:|---:|---:|---:|
| Free | Yes | No | No | No |
| Trial Pro | Yes | Yes | Yes | No |
| Pro | Yes | Yes | Yes | No |
| Empire | Yes | Yes | Yes | Yes |

---

# Phase 7: Bot Studio

## Objective

Allow users to create and operate personal bots.

## Scope

- Bots Saya
- Bot wizard
- Identity
- Skills
- Tier locks
- Live preview
- Channels
- Schedules
- Bot threads
- Bot status
- Edit and delete

## Gate

- Bots persist
- Bot threads remain isolated
- Tier restrictions enforced centrally
- Simulations clearly labelled
- No production credentials stored

---

# Phase 8: Admin SaaS Dashboard

## Objective

Provide operational visibility and controls.

## Scope

- Admin route guard
- Overview
- Users
- Trial filters
- Consumption
- Revenue breakdown
- Connectors
- Audit Log
- Settings

## Gate

- Normal users denied
- Sensitive values masked
- Audit payloads sanitised
- Revenue uses completed transactions only
- Admin actions create audit records

---

# Phase 9: Connector Architecture

## Objective

Prepare secure and replaceable integrations.

## Scope

- Connector interface
- Registry
- Mock adapters
- Health checks
- Enable and disable
- Failure isolation
- Retry and timeout policy
- Audit events
- Edge Function boundary

## Gate

New connectors can be added without changing core chat components.

---

# Phase 10: Supabase Readiness

## Objective

Move from local prototype storage to a secure database-ready structure.

## Scope

- SQL migrations
- Seed data
- Constraints
- Indexes
- Repository adapters
- RLS policies
- Storage policies
- Cross-user tests
- Admin policies
- Service-role boundaries

## Gate

- All exposed tables have access decisions
- Positive and negative RLS tests
- User A cannot access User B data
- Service-role key absent from browser
- Schema reproducible from migrations

---

# Phase 11: Security, Testing and Observability

## Objective

Verify critical journeys and production safety.

## Scope

- Unit tests
- Integration tests
- E2E tests
- Accessibility tests
- Security review
- Structured logging
- Correlation IDs
- Hermes latency
- Error tracking
- Performance measurement

## Gate

- No open critical security findings
- No open high accessibility findings
- Critical journeys pass
- Sensitive debug logging removed
- Failures traceable

---

# Phase 12: Release Readiness

## Objective

Confirm TanAir can be deployed, operated and rolled back.

## Scope

- Deployment guide
- Rollback guide
- Environment documentation
- Backup strategy
- Restore test
- Incident runbook
- Secret rotation
- Connector failure runbook
- Ownership matrix
- Release checklist

## Gate

- Reproducible build
- Green tests
- Documented rollback
- Monitoring enabled
- Known limitations disclosed
- Founder release approval

