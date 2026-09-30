# TanAir Cloud — Dependency Rules
## Architecture Documentation

**Version:** 0C  
**Date:** 2026-09-20  
**Author:** Antigravity (Lead Software Architect)  
**Evidence:** ARC-002 (no adapter interfaces), ARC-004 (no type boundaries), DEC-010

---

## 1. The Fundamental Rule

> **Dependencies only point downward. Never upward. Never circular.**

```
┌─────────────────────────────────────────────────────────────────┐
│  DIRECTION OF ALLOWED IMPORTS                                    │
│                                                                  │
│  app/         → features/, components/, lib/, domain/           │
│  features/    → services/, components/, lib/, domain/           │
│  components/  → lib/, domain/                                   │
│  services/    → adapters/, lib/, domain/                        │
│  adapters/    → lib/, domain/                                   │
│  lib/         → domain/                                         │
│  domain/      → (nothing — pure types and constants only)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Dependency Matrix

| Importer \ Target | `app/` | `features/` | `components/` | `services/` | `adapters/` | `lib/` | `domain/` | External |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **`app/`** | — | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **`features/`** | ❌ | ❌* | ✅ | ✅ | ❌ | ✅ | ✅ | ❌** |
| **`components/`** | ❌ | ❌ | — | ❌ | ❌ | ✅ | ✅ | ✅*** |
| **`services/`** | ❌ | ❌ | ❌ | — | ✅ | ✅ | ✅ | ❌ |
| **`adapters/`** | ❌ | ❌ | ❌ | ❌ | ❌* | ✅ | ✅ | ✅**** |
| **`lib/`** | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ | ✅***** |
| **`domain/`** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ |

**Notes:**
- `*` Features cannot import from other features. Adapters cannot import from other adapters.
- `**` Features call services, never external SDKs directly (no direct `supabase.*` in features).
- `***` Components can import Lucide React, React, etc. — but no Supabase, no Hermes.
- `****` Adapters call external services (Supabase client, Hermes HTTP) — this is their only job.
- `*****` `lib/` can import `@supabase/ssr` for client factories, Zod for validation schemas.

---

## 3. Layer-by-Layer Enforcement Rules

### Layer 1: `domain/` — The Leaf (Pure Types)
```typescript
// ✅ ALLOWED — pure TypeScript types
export type UserTier = 'free' | 'trial_pro' | 'pro' | 'empire';
export interface User { id: string; email: string; tier: UserTier; }

// ❌ FORBIDDEN — no imports from anywhere except TypeScript builtins
import { supabase } from '../lib/supabase-browser'; // NEVER
import { ChatService } from '../services/chat.service'; // NEVER
```

**Enforcement:** ESLint rule `no-restricted-imports` on `domain/` prohibiting any non-TypeScript imports.

---

### Layer 2: `lib/` — Utilities & Factories
```typescript
// ✅ ALLOWED — Supabase client factories, config, logger
import { createBrowserClient } from '@supabase/ssr';
import { z } from 'zod';
export const HERMES_TIMEOUT_MS = 3500; // from lib/config.ts

// ❌ FORBIDDEN — no application logic, no feature imports
import { ChatService } from '../services/chat.service'; // NEVER
import { MessageList } from '../features/chat/components/MessageList'; // NEVER
```

---

### Layer 3: `adapters/` — Interface Contracts + Implementations

```typescript
// ✅ ALLOWED — interface definitions
// adapters/hermes/IHermesAdapter.ts
export interface IHermesAdapter {
  chat(params: ChatParams): Promise<ReadableStream>;
  healthCheck(): Promise<boolean>;
}

// ✅ ALLOWED — concrete implementation calling external service
// adapters/hermes/HermesGatewayAdapter.ts
export class HermesGatewayAdapter implements IHermesAdapter {
  async chat(params: ChatParams): Promise<ReadableStream> {
    const response = await fetch(`${GATEWAY_URL}/api/chat/start`, { ... });
    // Direct external HTTP call — this is adapter's ONLY job
  }
}

// ❌ FORBIDDEN — business logic in adapters
if (user.tier === 'free' && agent !== 'Aura') throw new Error(); // BELONGS IN EntitlementService
```

---

### Layer 4: `services/` — Business Logic Orchestration

```typescript
// ✅ ALLOWED — orchestrate adapters, apply business rules
// services/chat.service.ts
export class ChatService {
  constructor(
    private hermes: IHermesAdapter,
    private quota: QuotaService,
    private audit: AuditService,
  ) {}

  async sendMessage(params: SendMessageParams): Promise<ReadableStream> {
    await this.quota.check(params.userId); // Business rule: check before calling
    const stream = await this.hermes.chat(params);
    await this.audit.log({ event: 'chat.message', ...params });
    return stream;
  }
}

// ❌ FORBIDDEN — direct Supabase calls in services
const { data } = await supabase.from('messages').select('*'); // USE REPOSITORY
// ❌ FORBIDDEN — React in services
import { useState } from 'react'; // NEVER IN SERVICES
```

---

### Layer 5: `features/` — React Feature Slices

```typescript
// ✅ ALLOWED — hooks that call services
// features/chat/hooks/useChatStream.ts
export function useChatStream() {
  const sendMessage = async (text: string) => {
    const stream = await chatService.sendMessage({ message: text, ... }); // ✅ calls service
    // ... handle stream
  };
}

// ❌ FORBIDDEN — feature importing another feature
import { useTrial } from '../trial/hooks/useTrial'; // FORBIDDEN in features/chat/
// If chat needs trial info: pass it as a prop from app/, or use shared context

// ❌ FORBIDDEN — direct supabase calls in feature hooks
const { data } = await supabase.from('sessions').select(); // USE REPOSITORY VIA SERVICE
```

---

### Layer 6: `components/` — Shared Design System

```typescript
// ✅ ALLOWED — pure UI, domain types as props
// components/ui/Button.tsx
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'ghost' | 'danger';
  onClick?: () => void;
}

// ❌ FORBIDDEN — feature logic or supabase in components
import { supabase } from '../../lib/supabase-browser'; // NEVER IN COMPONENTS
import { useChatStream } from '../../features/chat/hooks/useChatStream'; // NEVER
```

---

### Layer 7: `app/` — Routes and Layouts

```typescript
// ✅ ALLOWED — thin route pages delegating to features
// app/(app)/chat/page.tsx
import { ChatShell } from '@/features/chat/components/ChatShell';
export default function ChatPage() {
  return <ChatShell />;
}

// ✅ ALLOWED — server-side data fetching at page level
const profile = await profileService.getProfile(userId);

// ❌ FORBIDDEN — business logic in pages
if (user.credits < 0.02) { return; } // BELONGS IN QuotaService
```

---

## 4. Cross-Feature Communication Rules

Features **must not import from each other**. When cross-feature data sharing is needed:

| Pattern | When to Use |
|---|---|
| **Prop drilling from `app/` page** | Page passes data down to multiple features as props |
| **Shared Zustand store** (Phase 2) | Global state: `useAuthStore`, `useQuotaStore` |
| **React Context** | Scoped sharing within `AppShell` layout |
| **Server-side data** | Page fetches at RSC level and passes to client features |

**Never:** `import { useQuota } from '../quota'` inside `features/chat/`.

---

## 5. External Package Rules

| Package | Allowed In | Forbidden In |
|---|---|---|
| `@supabase/ssr` | `lib/` (factories), `adapters/storage/` | `features/`, `components/`, `services/`, `domain/` |
| `@supabase/supabase-js` | `adapters/storage/` (via `lib/` factory) | Anywhere else |
| `react` / `react-dom` | `app/`, `features/`, `components/` | `services/`, `adapters/`, `domain/`, `lib/` |
| `lucide-react` | `features/*/components/`, `components/` | `services/`, `adapters/`, `domain/` |
| `zod` | `lib/`, `app/api/*/route.ts` | `domain/` |
| `zustand` | `features/*/hooks/`, global stores | `services/`, `adapters/`, `domain/` |
| `next/navigation` | `app/`, `features/*/components/` | `services/`, `adapters/`, `domain/` |

---

## 6. ESLint Enforcement Configuration

```javascript
// eslint.config.mjs — Dependency boundary enforcement
rules: {
  'no-restricted-imports': ['error', {
    patterns: [
      // domain cannot import anything
      { group: ['../services/*', '../adapters/*', '../lib/*', '../features/*'], 
        message: 'domain/ must have zero dependencies' },
      // features cannot import from other features
      { group: ['../features/chat/*', '../features/bots/*', '../features/admin/*'],
        message: 'Features must not import from each other. Use services or context.' },
    ]
  }]
}
```

---

## 7. Violation Consequences

| Violation | Risk | Enforcement |
|---|---|---|
| Feature imports feature | Cross-cutting coupling; change in one breaks another | ESLint error (CI fails) |
| Service imports Supabase directly | Bypass of repository abstraction; untestable | Code review + ESLint |
| Adapter contains business logic | Logic tested only with real external services | Code review |
| Domain imports anything | Circular dependency risk; domain is no longer pure | ESLint error (CI fails) |
| Page contains business logic | God component recurrence; violates DEC-010 | Code review |

---

*End of Dependency Rules — Phase 0C*

