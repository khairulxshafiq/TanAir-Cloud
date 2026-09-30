# ADR-0008: Entitlement & Trial Model

**Date:** 2026-09-20  
**Status:** Proposed  
**Deciders:** Founder, Lead Software Architect, Product Strategist  
**Context Tags:** trial-pro, subscriptions, monetization, user-profile, entitlements

---

## Problem Statement
TanAir Cloud promises a frictionless "Three-Day Pro Trial" (72 hours, no credit card required) that grants access to advanced capabilities including Aura-Trade market analytics and image generation. Currently, this logic is non-existent in the codebase (Finding: `existing-feature-matrix.md §7`). There is no mechanism to track trial activation, compute expiration, degrade privileges back to the Free tier, or guard against multi-account trial abuse.

## Context & Constraints
- **Product Vision:** 72-hour trial unlocks Chat, Trade, and Image generation.
- **Expiry Behavior:** Once the 72 hours elapse, the account automatically reverts to Free (Aura chat only, 10,000 monthly tokens) without locking out the user.
- **Storage Target:** Supabase `profiles` table stores the user tier and timestamp metadata.
- **Abuse Vector:** Users creating disposable Gmail accounts to perpetually cycle 72-hour trials.

## Options Considered

### Option A: Immediate Auto-Start on Registration
Start the 72-hour countdown the moment the Google OAuth callback completes.
- **Pros:** Zero user action needed.
- **Cons:** If a user registers on Friday evening but does not use the app until Monday, their trial is wasted before they experience its value.

### Option B: Delayed On-Demand Trial Activation (Recommended)
Account starts in a clean `free` state. The 72-hour Trial Pro begins only when the user explicitly triggers a Pro capability (e.g. clicks `Aura-Trade`, initiates image generation, or clicks "Mulakan Trial Pro Percuma").
- **Pros:**
  - Maximizes user activation and "aha" moments.
  - Clear user consent and awareness of the countdown timer.
  - Transparent transition to the 72-hour countdown window.
- **Cons:** Requires a database mutation upon first activation.

## Decision
We decide to adopt **Option B: Delayed On-Demand Trial Activation**.

1. The Supabase `profiles` table tracks trial state using three columns:
   - `tier`: `free` | `trial_pro` | `pro` | `empire` (default: `free`)
   - `trial_started_at`: `TIMESTAMPTZ` (nullable)
   - `trial_expires_at`: `TIMESTAMPTZ` (nullable)
2. When the user initiates Trial Pro, `trial_started_at` is stamped to `now()` and `trial_expires_at` is stamped to `now() + INTERVAL '72 HOURS'`, with `tier` set to `trial_pro`.
3. An evaluation helper `TrialService.getEffectiveTier(profile)` dynamically computes whether `now() < trial_expires_at`. If the trial has expired, it immediately evaluates as `free`.
4. A reactive banner `TrialCountdown.tsx` renders in the AppShell header displaying remaining hours and minutes.

## Consequences

### Positive
- Users receive the full 72 hours of interactive engagement when they are actively at their desks.
- Clean, self-healing expiration: no background cron job is strictly required to degrade expired users, as `getEffectiveTier()` evaluates timestamps on every incoming request.
- Transparent UX: countdown timer creates healthy conversion urgency to subscribe to Pro.

### Negative / Trade-offs
- Does not fully prevent determined bad actors using multiple Gmail accounts (phone verification or IP rate limiting considered for future phases).

## Implementation Guidance

### Profile Database Schema (PostgreSQL snippet)
```sql
ALTER TABLE public.profiles 
  ADD COLUMN tier TEXT NOT NULL DEFAULT 'free' 
    CHECK (tier IN ('free', 'trial_pro', 'pro', 'empire')),
  ADD COLUMN trial_started_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN trial_expires_at TIMESTAMPTZ DEFAULT NULL;
```

### Trial Evaluation Service (`services/trial.service.ts`)
```typescript
import { UserTier } from '@/domain/constants/tiers';

export interface UserProfileTrialData {
  tier: UserTier;
  trialStartedAt: string | null;
  trialExpiresAt: string | null;
}

export class TrialService {
  getEffectiveTier(profile: UserProfileTrialData): UserTier {
    if (profile.tier === 'trial_pro') {
      if (!profile.trialExpiresAt) return 'free';
      const isExpired = new Date(profile.trialExpiresAt).getTime() <= Date.now();
      return isExpired ? 'free' : 'trial_pro';
    }
    return profile.tier;
  }

  getRemainingTrialMs(profile: UserProfileTrialData): number {
    if (profile.tier !== 'trial_pro' || !profile.trialExpiresAt) return 0;
    const remaining = new Date(profile.trialExpiresAt).getTime() - Date.now();
    return Math.max(0, remaining);
  }

  canActivateTrial(profile: UserProfileTrialData): boolean {
    return profile.tier === 'free' && profile.trialStartedAt === null;
  }
}
```

## Related ADRs
- ADR-0006: Authentication Boundary
- ADR-0007: Authorization Boundary
- ADR-0009: Quota Architecture
- ADR-0013: Supabase Migration Strategy
