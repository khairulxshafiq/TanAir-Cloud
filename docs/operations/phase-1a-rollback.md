# Phase 1A Rollback Guide
## Security Containment — TanAir Cloud

**Generated:** 2026-09-20  
**Author:** Lead Senior DevOps Engineer  
**Classification:** Operational Recovery Runbook  
**Branch:** `phase/1a-security-containment`  

---

## 1. Rollback Scenarios

This runbook provides precise procedures to revert Phase 1A changes in the event of unforeseen regressions.

| Scenario ID | Trigger Condition | Severity | Recommended Action |
|---|---|---|---|
| **RB-01** | Legitimate users blocked by authentication check in `/api/chat` | Critical | Verify cookie / auth token propagation; revert route if broken |
| **RB-02** | Rate limiter prematurely blocks legitimate user conversations | High | Increase threshold in `lib/security/rate-limiter.ts` or bypass limiter |
| **RB-03** | Hermes Gateway rejects requests due to protocol mismatch | High | Set `ALLOW_INSECURE_HERMES_HTTP=true` in Vercel env |
| **RB-04** | Catastrophic build or runtime failure after deployment | Critical | Full Git branch revert to `main` at `de79dc0` |

---

## 2. Fast Rollback via Git (Full Revert)

Because all Phase 1A work is strictly contained on the dedicated branch `phase/1a-security-containment` and has **not** been merged to `main`, rollback is instantaneous:

```bash
# 1. Ensure you are on main
git checkout main

# 2. Verify main commit matches Phase 0C baseline (de79dc0)
git log -n 1 --oneline
# Expected output: de79dc0 docs(phase-0c): complete architecture baseline, 15 ADRs & implementation strategy

# 3. If a production Vercel deployment was triggered from the branch, redeploy main:
git push origin main --force-with-lease
```

---

## 3. Surgical Hotfix / Bypass Procedures

If only a specific security control needs temporary adjustment without reverting the entire branch:

### A. Temporarily Relax Rate Limiting
If 20 requests/minute is too restrictive for intensive testing:
Edit `lib/security/rate-limiter.ts`:
```typescript
// Change from (20, 60) to (60, 60)
export const defaultChatRateLimiter = new MemoryRateLimiter(60, 60);
```

### B. Temporarily Allow Insecure Hermes HTTP in Production
If the VPS TLS reverse proxy is not yet ready:
In Vercel Environment Variables:
- `ALLOW_INSECURE_HERMES_HTTP=true`
- `HERMES_GATEWAY_URL=http://43.134.124.127:9119`

### C. Verify Fallback Stream
If the Hermes VPS is completely down, `/api/chat` automatically falls back to `lib/fallback-chat.ts` without crashing the application. Verify this by setting `HERMES_GATEWAY_URL=""` or a non-existent URL; the client will smoothly receive simulated Bahasa Melayu responses.

---

## 4. Post-Rollback Verification Checklist

After executing a rollback:
- [ ] Run `npm run typecheck` (must exit 0).
- [ ] Run `npm run lint` (must exit 0).
- [ ] Run `npm run test` (all tests pass).
- [ ] Run `npm run build` (build succeeds).
- [ ] Verify chat UI in browser loads and responds.
- [ ] File an incident report documenting root cause.

---

*End of Phase 1A Rollback Guide*
