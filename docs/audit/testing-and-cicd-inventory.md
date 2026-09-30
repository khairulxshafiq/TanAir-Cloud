# Testing and CI/CD Inventory
## Phase 0A — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity  
**Status:** READ-ONLY

---

## 1. Testing Infrastructure

| Item | Status | Notes |
|---|---|---|
| Test runner | ❌ Not configured | No Jest, Vitest, or Mocha |
| Unit tests | ❌ None | No `__tests__/` or `*.test.ts` files |
| Integration tests | ❌ None | |
| E2E tests | ❌ None | No Playwright or Cypress config |
| Accessibility tests | ❌ None | No axe-core or pa11y integration |
| Visual regression tests | ❌ None | No Storybook, Chromatic, or Percy |
| API tests | ❌ None | No REST API test suite |
| Component tests | ❌ None | No React Testing Library |
| Test coverage report | ❌ None | |
| `npm test` script | ❌ Not defined | `scripts` in `package.json` has no `test` key |

---

## 2. Static Analysis / Linting

| Tool | Status | Config File | Notes |
|---|---|---|---|
| ESLint | ✅ Configured | `eslint.config.mjs` | ESLint 9 flat config |
| ESLint ruleset | ✅ next/core-web-vitals + typescript | — | Includes react, react-hooks, jsx-a11y |
| TypeScript strict mode | ✅ Enabled | `tsconfig.json: "strict": true` | All strict checks active |
| `npm run lint` | ✅ Defined | `package.json: "lint": "eslint"` | Runs ESLint |
| Prettier | ❌ Not configured | — | No `.prettierrc` or `prettier.config.*` |
| `.editorconfig` | ❌ Not configured | — | No editor normalisation |

> [!NOTE]
> `eslint-plugin-jsx-a11y` is included via `eslint-config-next`. Basic accessibility lint rules are active, but this is not a substitute for manual accessibility testing.

---

## 3. Build System

| Item | Status | Notes |
|---|---|---|
| `npm run build` | ✅ Confirmed working | Delivery notes: "0 errors, Turbopack" |
| `npm run dev` | ✅ Assumed working | Standard Next.js dev server |
| `npm run start` | ✅ Available | `next start` for production mode |
| Turbopack | ✅ Active (default in Next.js 16) | Dev bundler |
| Production bundler | Standard Next.js webpack/swc | |

---

## 4. CI/CD Pipeline

| Item | Status | Notes |
|---|---|---|
| GitHub Actions | ❌ Not configured | No `.github/workflows/` directory |
| Vercel Git integration | ⚠ Assumed | Implied by deployment instructions; not confirmed |
| Auto-deploy on push to `main` | ⚠ Assumed | Vercel default behaviour if integrated |
| PR preview deployments | ⚠ Assumed | Vercel default behaviour if integrated |
| Secret scanning | ❌ Not configured | No GitHub secret scanning rules |
| Dependency vulnerability scanning | ❌ Not configured | No Dependabot, Snyk, or `npm audit` in CI |
| Lint in CI | ❌ Not configured | |
| Typecheck in CI | ❌ Not configured | |
| Build in CI | ❌ Not configured | |
| Test in CI | ❌ Not configured | |

> [!IMPORTANT]
> **There is no CI pipeline.** The only automated pipeline is Vercel's auto-deploy on `git push`. There are no lint, type-check, build, or test gates before code merges to `main`. A broken commit can go directly to production.

---

## 5. Code Quality Gates (Current vs. Required)

### Current State
```
Developer writes code
    │
    ▼
git push to main
    │
    ▼
Vercel picks up push (assumed)
    │
    ▼
Vercel runs: npm run build
    │
    ▼ (if build passes)
Deploy to production
```

### Required State (Phase 1 Target)
```
Developer creates branch + PR
    │
    ▼
GitHub Actions CI:
  ├─ npm run lint       → PASS required
  ├─ npm run typecheck  → PASS required
  ├─ npm test          → PASS required
  ├─ npm run build     → PASS required
  ├─ secret scan       → no secrets found
  └─ dependency audit  → no critical CVEs
    │
    ▼ (PR approved + CI green)
Merge to main
    │
    ▼
Vercel deploys to production
```

---

## 6. Findings

> [!CAUTION]
> **No tests exist at all.** The codebase has zero test coverage. Per `08_TANAIR_DEFINITION_OF_DONE.md`, unit tests, integration tests, permission tests, and E2E tests are all required before any feature ships. The current state fails the Definition of Done for every feature.

> [!WARNING]
> **No CI pipeline guards production.** Any push to `main` triggers a Vercel deploy (assumed). There is no automated gate checking lint, type safety, or tests before deployment.

> [!WARNING]
> **No Prettier or `.editorconfig`.** Different developers or AI agents may format code differently, leading to noisy diffs and style inconsistencies. Phase 1 must add formatting.

> [!NOTE]
> **TypeScript strict mode IS enabled** — this is a positive baseline. The codebase will reject unsafe types at compile time.

> [!NOTE]
> **ESLint is configured** with `next/core-web-vitals` and TypeScript rules. This is also a positive baseline. The `lint` script exists in `package.json`.

---

## 7. Phase 1 Requirements (Engineering Foundation)

Per `05_TANAIR_PHASE_PLAN.md` Phase 1, the following must be added:

| Item | Priority |
|---|---|
| Prettier configuration | HIGH |
| `.editorconfig` | HIGH |
| Runtime version pinning (`.nvmrc`) | HIGH |
| `npm test` script + test runner | HIGH |
| GitHub Actions: lint workflow | HIGH |
| GitHub Actions: typecheck workflow | HIGH |
| GitHub Actions: build workflow | HIGH |
| GitHub Actions: test workflow | HIGH |
| Secret scanning (GitHub native or trufflehog) | HIGH |
| Dependabot / `npm audit` in CI | MEDIUM |
| Pull request template | MEDIUM |
| CODEOWNERS | MEDIUM |
| `CONTRIBUTING.md` | MEDIUM |
| `SECURITY.md` | MEDIUM |
| `CHANGELOG.md` | LOW |

---

*End of Testing and CI/CD Inventory — Phase 0A*

