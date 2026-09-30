# Phase 1A Test Plan & Verification Report
## Security Containment — TanAir Cloud

**Generated:** 2026-09-20  
**Author:** Lead Senior QA & Platform Engineer  
**Classification:** Quality Assurance & Test Verification  
**Test Framework:** Vitest 5.0.1 (Node.js Environment)  

---

## 1. Overview & Objectives

Phase 1A establishes the **first automated testing foundation** in the TanAir Cloud repository. Previously, test coverage was 0% with no test runner installed (Finding: `RR-TST-001`).

The Phase 1A test suite strictly verifies all security controls implemented in `/api/chat`, the request validation pipeline, the rate limiter, and the Hermes adapter boundary without invoking live production VPS endpoints.

---

## 2. Test Execution Matrix

| Test Suite File | Test Category | Scenarios Covered | Tests Count | Status |
|---|---|---|:---:|:---:|
| `tests/security/auth-and-chat-route.test.ts` | Authentication & Route Security | Unauthenticated rejection (401), invalid session, malformed JSON (400), empty messages, agent injection, valid auth with SSE response, rate-limit 429 response. | 6 | ✅ PASS |
| `tests/security/validation.test.ts` | Request Schema & Agent Allowlist | Valid message, allowlisted agent mapping, invalid agent rejection (400), empty/whitespace checks, message length (>4000 chars) 413 rejection, total body size (>64KB) 413 rejection, multi-turn history validation, invalid role rejection, message count limits. | 11 | ✅ PASS |
| `tests/security/rate-limiter.test.ts` | Rate Limiting & User Throttling | Request allowance within window, threshold rejection with `resetSeconds`, user-level key isolation (Alice blocked != Bob blocked). | 3 | ✅ PASS |
| `tests/security/hermes-adapter.test.ts` | Adapter Boundary & Transport Security | Missing URL error, invalid URL format error, plain HTTP rejection in production mode, HTTPS allowance in production, development insecure override, MockAdapter SSE token streaming with DONE marker, timeout simulation, upstream error simulation. | 7 | ✅ PASS |
| **Total** | | | **27** | **100% PASS** |

---

## 3. How to Execute Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode during development
npx vitest

# Run tests with coverage analysis
npx vitest run --coverage

# Run TypeScript type verification
npm run typecheck

# Run ESLint validation
npm run lint

# Run production build verification
npm run build
```

---

## 4. Test Isolation & Mocking Strategy

1. **Zero Real Network Calls:** Tests do not invoke `http://43.134.124.127:9119` or external Supabase endpoints.
2. **Supabase Auth Spies:** `authenticateChatRequest` is mocked via `vi.spyOn` in `auth-and-chat-route.test.ts` to simulate authenticated vs unauthenticated caller states.
3. **Mock Hermes Adapter:** `MockHermesAdapter` verifies that streaming readers consume chunked tokens and terminate cleanly upon `data: [DONE]`.
4. **Environment Isolation:** Tests that mutate `process.env.NODE_ENV` restore original environment variables in `afterEach()` hooks.

---

*End of Phase 1A Test Plan & Verification Report*
