# Environment Inventory
## Phase 0A — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity  
**Status:** READ-ONLY — secrets masked

---

## 1. Environment Variables

### Confirmed Variables (from `.env.example` and code inspection)

| Variable | Visibility | Purpose | Source | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (client) | Supabase project endpoint | `.env.example`, `lib/supabase.ts` | Safe to be public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (client) | Supabase anonymous read key | `.env.example`, `lib/supabase.ts` | Protected by RLS — safe to be public |
| `NEXT_PUBLIC_GATEWAY_URL` | Public (client) | Hermes VPS gateway fallback URL | `.env.example`, `route.ts` | ⚠ Exposes VPS IP in client bundle |
| `HERMES_GATEWAY_URL` | Server-only | Hermes VPS gateway primary URL | `route.ts` only | ✅ Preferred — not in `.env.example` yet |

### Variables Documented in Delivery Notes (VPS-side only, not in frontend)

| Variable | Location | Purpose | Exposure |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | VPS: `AuraSecret/acloud_oauth.env` | Google OAuth app ID | Partially public (in PHASE_0A_DELIVERY.md) |
| `GOOGLE_CLIENT_SECRET` | VPS: `AuraSecret/acloud_oauth.env` | Google OAuth secret | ✅ Private (VPS only) |
| `SUPABASE_SERVICE_ROLE_KEY` | VPS: `AuraSecret/acloud_oauth.env` | Supabase admin access | ✅ Private (VPS only) |
| `SUPABASE_ACCESS_TOKEN` | VPS: `AuraSecret/acloud_oauth.env` | Supabase management API | ✅ Private (VPS only) |

---

## 2. Environments

### Local Development

| Item | Value |
|---|---|
| URL | `http://localhost:3000` |
| Data source | Supabase production (⚠ same project as production) |
| Mock services | None — live Hermes gateway used if `.env.local` configured |
| Env file | `.env.local` (gitignored ✅) |

> [!WARNING]
> Local development uses the **same Supabase project as production**. There is no dev/staging Supabase project. This means any test users or data created locally exist in the production database.

### Staging

| Item | Value |
|---|---|
| URL | ❌ Not configured |
| Supabase project | ❌ Not configured — no separate staging project |
| Hermes gateway | ❌ Not configured |
| Status | ❌ Does not exist |

### Production (Planned / Vercel)

| Item | Value |
|---|---|
| Hosting | Vercel (free tier) |
| URL | Not confirmed — deployment instructions in `PHASE_0A_DELIVERY.md` |
| Branch | `main` → auto-deploys on push |
| Env vars configured on Vercel | Unknown — to be verified by founder |
| Custom domain | ❌ Not confirmed |

> [!IMPORTANT]
> It is **not confirmed** whether the Vercel project is deployed and live. The delivery notes describe the deployment steps but do not confirm a live URL exists. The founder should verify this.

### Preview (Vercel)

| Item | Value |
|---|---|
| URL pattern | `tanair-cloud-git-{branch}-{org}.vercel.app` (default Vercel pattern) |
| Created from | Every PR or branch push to Vercel |
| Status | Possible automatically if Vercel Git integration is configured |
| Env vars in preview | May inherit production env vars — confirm in Vercel dashboard |

---

## 3. Infrastructure Overview

| Component | Provider | Status | Notes |
|---|---|---|---|
| Frontend hosting | Vercel (free tier) | Planned / Unconfirmed | |
| Auth | Supabase (`AuraAgentic` project) | ✅ Configured | Google OAuth working |
| Database | Supabase PostgreSQL | ⚠ No TanAir tables yet | Auth schema only |
| File storage | Supabase Storage | ❌ Not configured | No bucket created |
| CDN | Vercel Edge Network | Auto (part of Vercel hosting) | |
| DNS / Domain | Unknown | ❌ Not confirmed | |
| Email provider | Unknown | ❌ Not configured | |
| AI Gateway | VPS Hermes (Tencent Cloud, `43.134.x.x`) | ✅ Running | Port `:9119` |
| Secret management | VPS `AuraSecret/` dir + Vercel env vars | ⚠ Partial | No formal secret manager (e.g. Vault, AWS SM) |
| Monitoring | None | ❌ Not configured | |
| Error tracking | None | ❌ Not configured | |
| Analytics | None | ❌ Not configured | |
| Logging destination | Console only | ❌ No structured logging | |
| Backup strategy | Vercel instant rollback + git | ⚠ Partial | No DB backup strategy documented |

---

## 4. Runtime Versions

| Item | Configured | Pinned | Notes |
|---|---|---|---|
| Node.js | Unknown (no `.nvmrc`) | ❌ Not pinned | Vercel default Node.js version will be used |
| npm | Unknown | ❌ Not pinned | |
| Next.js | `16.3.5` (exact in `package.json`) | ✅ Pinned | |
| TypeScript | `^5` (range) | ⚠ Resolved to 5.9.3 in lockfile | |

> [!NOTE]
> Vercel will auto-detect the Node.js version. Since `engines.node` is not specified in `package.json`, Vercel may use its default LTS version. This could differ from the local development version and cause subtle incompatibilities. This should be pinned in Phase 1.

---

## 5. `.env.example` vs `.env.local` Comparison

| Variable | In `.env.example` | In `.env.local` | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Both present |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ (placeholder) | ✅ (real value) | Example has `your_supabase_anon_key` |
| `NEXT_PUBLIC_GATEWAY_URL` | ✅ (raw VPS IP) | ✅ (real URL) | VPS IP in example — consider masking |
| `HERMES_GATEWAY_URL` | ❌ Not in example | Unknown | Should be added to `.env.example` |

---

## 6. Findings

> [!CAUTION]
> **No environment separation** between local, staging, and production. All development works against the live Supabase production project. This risks polluting production data during development and testing.

> [!WARNING]
> **VPS IP address (`43.134.124.127`) is committed to `.env.example`** which is tracked in the public GitHub repository. This exposes the Hermes gateway address. Consider using a custom domain or Cloudflare proxy.

> [!WARNING]
> **`HERMES_GATEWAY_URL`** (the more secure server-only env var) is not documented in `.env.example`. Only `NEXT_PUBLIC_GATEWAY_URL` (client-exposed) is shown. This should be updated so operators know to use the server-only variable.

> [!NOTE]
> **Vercel deployment status is unconfirmed**. Delivery notes describe deployment steps but no live URL has been observed. Founder should confirm whether the Vercel project is connected and deployed.

---

*End of Environment Inventory — Phase 0A*

