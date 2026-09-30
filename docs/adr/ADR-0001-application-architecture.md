# ADR-0001: Application Architecture

**Date:** 2026-09-20  
**Status:** Proposed  
**Deciders:** Founder, Lead Software Architect  
**Context Tags:** architecture, clean-architecture, layering, dec-010, nextjs-app-router

---

## Problem Statement
The current TanAir Cloud codebase is structured around a monolithic 657-line "God Component" in `app/page.tsx` (Finding: `ARC-001`). This component violates the Single Responsibility Principle by simultaneously managing React UI rendering, Supabase client authentication calls, API streaming readers, browser session arrays, and simulated PAYG credit deductions. Additionally, direct vendor calls to `supabase.auth.*` and `fetch('/api/chat')` violate `DEC-010`, creating tight vendor coupling and blocking isolated automated testing.

## Context & Constraints
- **Audit Findings:** `ARC-001` (God Component), `ARC-002` (Direct vendor coupling), `ARC-004` (No domain type boundaries).
- **Core Principles:** `DEC-010` mandates: `UI → Application Service → Domain → Repository/Adapter Interface → Implementation`.
- **Framework:** Next.js 16.3.5 App Router with React 19.
- **Goal:** Enable rapid feature development (Chat, Bots, Admin, Memory) without regressions, while allowing a seamless transition from prototype in-memory state to persistent Supabase storage in Phase 10.

## Options Considered

### Option A: Traditional Next.js Monolith (Page-centric)
Keep logic within `app/` routes, using custom hooks inside page folders.
- **Pros:** Fast initial setup; standard Next.js tutorial approach.
- **Cons:** High coupling; poor testability; difficult to swap storage backends; violates `DEC-010`.

### Option B: Full Domain-Driven Design (DDD) with Micro-packages / Monorepo
Split the application into separate Turborepo packages (`@tanair/core`, `@tanair/ui`, `@tanair/adapters`).
- **Pros:** Extreme modularity and boundary enforcement.
- **Cons:** Heavy operational overhead, slow build loops, over-engineering for an early-stage startup.

### Option C: Feature-Slice + Layered Architecture Hybrid (Recommended)
Organize the codebase into vertical product slices under `features/` (e.g., `features/chat`, `features/bots`), supported by horizontal domain and infrastructure layers (`domain/`, `services/`, `adapters/`, `components/`).
- **Pros:**
  - Respects `DEC-010` dependency inversion.
  - Keeps related UI, hooks, and subcomponents co-located.
  - Allows swapping implementations (e.g., mock vs real Hermes, memory vs Supabase) by changing dependency injection in services.
  - Zero package manager/monorepo overhead.
- **Cons:** Requires discipline to avoid cross-feature imports.

## Decision
We decide to adopt **Option C: Feature-Slice + Layered Architecture Hybrid**.

1. The UI layer (`app/` and `features/`) communicates only with Application Services (`services/`).
2. Application Services orchestrate pure business rules, domain entities (`domain/`), and abstract contracts (`adapters/storage/`, `adapters/hermes/`).
3. Adapters implement technical protocols (Supabase PostgreSQL calls, HTTP SSE streaming to Hermes VPS).
4. Shared UI primitives reside in `components/ui/` without business logic.

## Consequences

### Positive
- Direct vendor dependencies are eliminated from UI components.
- Unit testing can mock adapters without mounting React trees or spawning HTTP servers.
- Eliminates the 657-line `page.tsx` God Component.
- Clear onboarding paths for developers and autonomous agents.

### Negative / Trade-offs
- Slight initial boilerplate compared to quick-and-dirty inline `useState` and `fetch`.
- Requires ESLint boundary enforcement to prevent cross-feature imports.

## Implementation Guidance

### Dependency Direction
```
app/ (Route Handlers & Pages)
  │
  ▼
features/ (UI Presentation & Local Hooks)
  │
  ▼
services/ (Business Logic & Orchestration)
  │
  ├──► domain/ (Pure Types & Constants)
  ▼
adapters/ (External System Implementations)
  ├── Storage (Supabase, In-Memory)
  └── AI Gateway (Hermes VPS, Mock)
```

### Code Example: Inversion of Control
```typescript
// services/chat.service.ts
export class ChatService {
  constructor(
    private readonly hermesAdapter: IHermesAdapter,
    private readonly sessionRepo: ISessionRepository,
    private readonly quotaService: QuotaService
  ) {}

  async sendUserMessage(params: SendMessageParams): Promise<ReadableStream> {
    await this.quotaService.assertSufficientBalance(params.userId);
    await this.sessionRepo.appendMessage(params.sessionId, params.userMessage);
    return this.hermesAdapter.streamChat(params);
  }
}
```

## Related ADRs
- ADR-0003: Feature Module Structure
- ADR-0004: Repository Pattern
- ADR-0005: Hermes Adapter Layer
