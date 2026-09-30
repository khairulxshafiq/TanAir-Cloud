# Developer Experience Findings
## Phase 0B — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity (Platform Engineer)  
**Phase:** 0B — Audit & Risk Register

---

## 1. Executive Summary

The developer experience baseline is minimal but not broken. TypeScript strict mode and ESLint are configured correctly. The critical gaps are: no code formatter, no test infrastructure, no runtime pinning, no CI/CD pipeline, no environment separation, and a missing project-specific README. A new developer (or AI agent) joining the project cannot onboard without reading undocumented tribal knowledge.

**Overall DevEx Score: 3/10** (Minimal baseline; significant onboarding friction)

---

## 2. Findings

---

### DEV-001 — No Code Formatter (Prettier)

**Severity:** HIGH  
**Evidence:** No `prettier.config.*`, `.prettierrc`, or `.prettierignore` in repository  
**Affected Files:** Repository root

**Description:**  
No code formatter is configured. This means:
- Different developers (or AI agents) produce inconsistently formatted code
- PRs contain formatting noise that obscures actual logic changes
- ESLint's `--fix` only handles some formatting issues, not all
- `npm run lint` will not catch formatting violations

Without Prettier, every code review is polluted with whitespace/quote/semicolon debates.

**Recommendation:**  
Add `prettier` and `prettier-plugin-tailwindcss`:
```bash
# Add to devDependencies:
prettier, prettier-plugin-tailwindcss
```
Create `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```
Add `format` and `format:check` scripts to `package.json`.

**Effort:** Small  
**Phase:** Phase 1

---

### DEV-002 — No `.editorconfig`

**Severity:** MEDIUM  
**Evidence:** No `.editorconfig` in repository

**Description:**  
Without `.editorconfig`, different editors (VS Code, Cursor, Vim, JetBrains) will use different default settings for:
- Indent style (tabs vs spaces)
- Indent size
- Line ending (LF vs CRLF — critical for Mac/Windows interop)
- Trailing whitespace
- Final newline

This causes noisy git diffs and merge conflicts when collaborators use different editors.

**Recommendation:**  
Create `.editorconfig`:
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

**Effort:** Trivial  
**Phase:** Phase 1

---

### DEV-003 — No Node.js Runtime Version Pinning

**Severity:** MEDIUM  
**Evidence:** No `.nvmrc`, `.node-version`, or `engines` field in `package.json`  
**Affected Files:** `package.json`

**Description:**  
No minimum or target Node.js version is specified. This means:
- A developer could run the project with Node.js 18 while Vercel uses Node.js 22
- Vercel defaults to its own LTS selection which may change
- `npm` version mismatches can cause `package-lock.json` conflicts
- Next.js 16 and React 19 have specific Node.js minimum requirements (Node 18.18+ required)

**Recommendation:**  
1. Create `.nvmrc`: `22` (current LTS)
2. Add to `package.json`: `"engines": { "node": ">=22.0.0", "npm": ">=10.0.0" }`
3. Configure Vercel to use Node.js 22 in project settings

**Effort:** Trivial  
**Phase:** Phase 1

---

### DEV-004 — `npm test` Script Missing

**Severity:** HIGH  
**Evidence:** `package.json` scripts: `{ "dev", "build", "start", "lint" }` — no `test`  
**Affected Files:** `package.json`

**Description:**  
There is no test runner configured and no `test` script in `package.json`. Running `npm test` fails with `missing script: test`. CI/CD pipelines that call `npm test` will fail immediately.

**Recommendation:**  
Add Vitest as the test runner (lightweight, native ESM, TypeScript support, compatible with Next.js App Router):
```json
"scripts": {
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:coverage": "vitest --coverage"
}
```

**Effort:** Small (setup only — Phase 1; actual tests — Phase 11)  
**Phase:** Phase 1

---

### DEV-005 — No GitHub CI Workflow

**Severity:** CRITICAL  
**Evidence:** No `.github/workflows/` directory  
**Affected Files:** Repository root

**Description:**  
No automated CI runs on any commit or pull request. The only automated validation is Vercel's build check, which runs AFTER deployment begins. This means:
- TypeScript errors can reach the repository undetected
- ESLint violations are not enforced server-side
- There is no gate between writing code and deploying to production
- A broken commit triggers a failed production deployment visible to users

**Recommended minimum CI workflow (for Phase 1):**
```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck   # needs "typecheck": "tsc --noEmit" script
      - run: npm run build
      - run: npm test
```

**Effort:** Small  
**Phase:** Phase 1

---

### DEV-006 — No `typecheck` Script

**Severity:** MEDIUM  
**Evidence:** `package.json` — no `typecheck` script; `tsconfig.json` has `"noEmit": true`  
**Affected Files:** `package.json`

**Description:**  
TypeScript strict mode is configured correctly (`"strict": true`, `"noEmit": true`) but there is no `typecheck` script to run it explicitly. `npm run build` includes TypeScript checking but it also builds the entire Next.js output, which is slow. A fast `typecheck` script enables quicker feedback loops.

**Recommendation:**  
Add to `package.json`:
```json
"typecheck": "tsc --noEmit"
```

**Effort:** Trivial  
**Phase:** Phase 1

---

### DEV-007 — `README.md` is Default Next.js Template

**Severity:** HIGH  
**Evidence:** `README.md` — contains only `npx create-next-app` documentation  
**Affected Files:** `README.md`

**Description:**  
The repository's README is the auto-generated Next.js template README. It contains no information about TanAir: what it is, how to set it up, what env vars are required, or how to run the project.

A new developer or AI agent reading this README will have no context about the project.

**Recommendation:**  
Replace with a project-specific README covering:
- What TanAir Cloud is (1–2 sentences)
- Prerequisites (Node.js version, npm)
- Setup steps (`npm install`, `.env.local` setup, Supabase config)
- Development (`npm run dev`)
- Build & lint (`npm run build`, `npm run lint`)
- Environment variables (reference to `.env.example`)
- Architecture overview (link to `docs/`)
- Contributing (link to `CONTRIBUTING.md`)

**Effort:** Small  
**Phase:** Phase 1

---

### DEV-008 — No `CONTRIBUTING.md` or `SECURITY.md`

**Severity:** MEDIUM  
**Evidence:** No `CONTRIBUTING.md`, `SECURITY.md`, or `CHANGELOG.md` in repository

**Description:**  
Without these files:
- Contributors (AI agents, future developers) have no established process for making changes
- Security researchers cannot responsibly disclose vulnerabilities
- Change history is only in `git log` (2 commits, no changelog)

GitHub displays these files prominently and uses `SECURITY.md` for its security advisory feature.

**Recommendation:**  
Create minimal versions in Phase 1:
- `CONTRIBUTING.md`: branch strategy, PR process, Definition of Done checklist (link to `08_DEFINITION_OF_DONE.md`)
- `SECURITY.md`: vulnerability disclosure contact (founder email/GitHub issues)
- `CHANGELOG.md`: start from Phase 1 release

**Effort:** Small  
**Phase:** Phase 1

---

### DEV-009 — No Local Development Seed Data or Mock Hermes

**Severity:** MEDIUM  
**Evidence:** No mock adapter, no fixture data  
**Affected Files:** `app/api/chat/route.ts` (fallback is the only mock)

**Description:**  
Local development uses the real Supabase production project and the real Hermes VPS. The BM fallback in `route.ts` serves as an implicit mock when Hermes is offline, but:
- It is not togglable — there is no `MOCK_HERMES=true` env var
- It is not configurable — mock responses are hardcoded
- There is no way to test different Hermes response scenarios locally
- Local auth writes to the production `auth.users` table

**Recommendation:**  
1. Create a `MOCK_CHAT=true` env var that forces the fallback regardless of gateway status
2. Document in `.env.example` that local dev should use a separate Supabase project (once staging exists)

**Effort:** Trivial (toggle), Medium (staging Supabase)  
**Phase:** Phase 1 (toggle), Phase 1+ (staging)

---

### DEV-010 — No GitHub Branch Protection or PR Requirements

**Severity:** HIGH  
**Evidence:** `git branch -a` — only `main` exists, direct push to `main` is possible

**Description:**  
The `main` branch has no protection rules. Any collaborator (or AI agent with push access) can push directly to `main` without review:
- No required PR review
- No required CI status checks before merge
- No branch protection (force push possible)
- No CODEOWNERS file

This combined with no CI means broken code can be deployed to production immediately.

**Recommendation:**  
Enable branch protection on GitHub:
- Require PR before merging
- Require CI checks to pass (once configured)
- Require at least 1 reviewer (or sole founder review for solo work)
- Prevent force push on `main`

**Effort:** Trivial (GitHub settings)  
**Phase:** Phase 1

---

## 3. DevEx Findings Summary

| ID | Finding | Severity | Phase |
|---|---|---|---|
| DEV-001 | No Prettier formatter | HIGH | Phase 1 |
| DEV-002 | No `.editorconfig` | MEDIUM | Phase 1 |
| DEV-003 | No Node.js version pinning | MEDIUM | Phase 1 |
| DEV-004 | No `npm test` script or test runner | HIGH | Phase 1 |
| DEV-005 | No CI/CD workflow | CRITICAL | Phase 1 |
| DEV-006 | No `typecheck` script | MEDIUM | Phase 1 |
| DEV-007 | `README.md` is template (not project-specific) | HIGH | Phase 1 |
| DEV-008 | No `CONTRIBUTING.md` or `SECURITY.md` | MEDIUM | Phase 1 |
| DEV-009 | No mock Hermes / local dev isolation | MEDIUM | Phase 1 |
| DEV-010 | No branch protection on `main` | HIGH | Phase 1 |

---

*End of Developer Experience Findings — Phase 0B*

