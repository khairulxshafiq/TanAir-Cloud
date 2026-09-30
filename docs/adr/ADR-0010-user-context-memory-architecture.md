# ADR-0010: User Context + Memory Architecture

**Date:** 2026-09-20  
**Status:** Proposed  
**Deciders:** Founder, Lead Software Architect, Security Architect  
**Context Tags:** memory, privacy, user-context, pdpa, personalization

---

## Problem Statement
TanAir Cloud promises long-term personalization where agents remember business facts, user preferences, and strategic goals across sessions. However, automatic, unvetted background memory extraction creates severe privacy and hallucination risks—such as inadvertently capturing sensitive financial numbers, passwords, or personal medical details under Malaysia's Personal Data Protection Act (PDPA). Currently, no memory or user context storage exists (Finding: `existing-feature-matrix.md §8`).

## Context & Constraints
- **Product Requirement:** "User-approved AI memories" — Aura proposes what to remember, but the human user retains explicit review, edit, and deletion control.
- **Privacy & PDPA Compliance:** Explicit consent model; sensitive data categories must never be automatically stored without user confirmation.
- **Inference Optimization:** Injected memories must be concise to avoid overflowing LLM context windows or inflating token costs unnecessarily.

## Options Considered

### Option A: Implicit Vector Database Memory (Auto-extraction)
Silently chunk all conversation messages, embed them using OpenAI/Cohere embeddings, and store them in pgvector for RAG similarity matching on every prompt.
- **Pros:** Completely hands-off for the user.
- **Cons:** High risk of hallucinated or stale context retrieval; stores sensitive credentials or private details without consent; violates the "user-approved" product promise; adds vector compute costs.

### Option B: Ephemeral Session Summaries
Summarize conversations at the end of each session and store a single summary blob per user.
- **Pros:** Simple.
- **Cons:** Coarse-grained; cannot individually edit or delete specific facts; lacks categorization.

### Option C: Dual-Layer Architecture: User Context + Explicit Approved Memories (Recommended)
Split personalization into two distinct entities:
1. **User Profile Context:** Baseline static parameters (Display Name, Profession, Industry, Business Goals, Preferred BM Tone) stored directly in `profiles`.
2. **Approved Fact Memories:** Atomic facts (e.g. *"Syarikat menjual Daging Salai jenama Sakluma"*, *"Sasaran pasaran ialah suri rumah di Lembah Klang"*) stored in a dedicated `memories` table, requiring explicit user approval before activation.
- **Pros:**
  - 100% user control: memories appear as proposed chips in the UI that users can accept, edit, or reject.
  - Transparent: users can open the Memory Drawer at any time to delete obsolete facts.
  - Zero embedding/vector infrastructure needed for MVP; facts are injected directly into the Hermes system prompt prefix.
- **Cons:** Requires building a dedicated review UI in the chat cockpit.

## Decision
We decide to adopt **Option C: Dual-Layer Architecture: User Context + Explicit Approved Memories**.

1. **User Context** is managed in `features/profile/` and injected as the base persona preamble into every Hermes request.
2. **Memories** are stored in the Supabase `memories` table with columns `content`, `category` (preference, business_fact, goal), and `is_active`.
3. When Hermes detects a durable fact during a conversation, it streams a special structured tag `[PROPOSED_MEMORY: category | text]`. The UI catches this tag and renders an interactive prompt: *"Boleh saya simpan maklumat ini untuk perbualan akan datang?"*
4. Only upon clicking "Simpan", the fact is committed to the database.

## Consequences

### Positive
- Fully aligns with the core brand voice: respectful, collaborative, and trustworthy.
- Full compliance with PDPA privacy regulations: no automatic retention of private data.
- Keeps Hermes system prompts concise, deterministic, and highly relevant.

### Negative / Trade-offs
- Users must occasionally click to approve memories rather than enjoying purely passive learning.

## Implementation Guidance

### Supabase Table Schema (`memories`)
```sql
CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('preference', 'business_context', 'goal', 'personal_fact')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_memories" ON public.memories
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_memories_user_active ON public.memories (user_id) WHERE is_active = true;
```

### Memory Injection Format (Injected into Hermes Request)
```typescript
export function buildHermesContextPayload(userProfile: UserProfile, memories: Memory[]): string {
  const memoryBullets = memories
    .filter(m => m.isActive)
    .map(m => `- [${m.category}] ${m.content}`)
    .join('\n');

  return `
[KONTEKS PENGGUNA]
Nama: ${userProfile.displayName || 'Pengguna'}
Bidang/Perniagaan: ${userProfile.profession || 'Tidak dinyatakan'}
Gaya Bahasa: Bahasa Melayu Malaysia (Profesional & Mesra)

[MEMORI DISAHKAN]
${memoryBullets || 'Tiada memori disimpan.'}
`.trim();
}
```

## Related ADRs
- ADR-0004: Repository Pattern
- ADR-0005: Hermes Adapter Layer
- ADR-0013: Supabase Migration Strategy
