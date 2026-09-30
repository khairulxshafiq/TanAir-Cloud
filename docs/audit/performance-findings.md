# Performance Findings
## Phase 0B — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity  
**Method:** Static code analysis — no Lighthouse run performed (prototype, no confirmed live URL)

---

## 1. Executive Summary

The current prototype has acceptable performance characteristics for a dark-UI chat app with minimal assets. The main risks are the monolithic 657-line client component (no code splitting), the potential for SSE stream memory leaks, and the complete absence of image optimisation infrastructure. No performance measurements exist.

**Overall Performance Score: 5/10** (Adequate for prototype; gaps emerge at scale)

---

## 2. Findings

---

### PERF-001 — Entire App Is One Client Component (No RSC, No Code Splitting)

**Severity:** MEDIUM  
**Evidence:** `app/page.tsx` line 1: `"use client"` — entire 657-line component is client-side  
**Affected Files:** `app/page.tsx`

**Description:**  
The entire application is a single `"use client"` component. This means:
1. **Zero React Server Components (RSC)** — all rendering happens in the browser
2. **No automatic code splitting** — the entire UI bundle loads before the user sees anything
3. **No streaming HTML** — the page cannot render progressively
4. **Increased First Contentful Paint (FCP)** — user sees blank screen until JS downloads and executes

The full dependency tree (React 19, Lucide React ~1.4MB uncompressed, Supabase client) downloads before anything is shown.

**Impact:** Slower initial page load, especially on mobile/slow connections. Poor Core Web Vitals (LCP, FCP).

**Recommendation:**  
- Move static UI sections (sidebar structure, header) to Server Components
- Use `"use client"` only on interactive leaf components (textarea, button groups)
- Next.js App Router enables this with `layout.tsx` as RSC by default

**Effort:** Medium (part of Phase 2 decomposition)  
**Phase:** Phase 2

---

### PERF-002 — Lucide React Full Import

**Severity:** LOW  
**Evidence:** `app/page.tsx` lines 7–22 — 17 named imports from `lucide-react`  
**Affected Files:** `app/page.tsx`

**Description:**  
17 icons are imported from `lucide-react`. Lucide React 1.47.0 supports tree-shaking via named exports, so unused icons should not be included. However, the import pattern is already optimal (named imports, not `import * as`).

At build time, Next.js with webpack/turbopack should tree-shake unused icons correctly. **This is LOW risk** and likely already handled by the bundler.

**Recommendation:**  
Verify bundle analysis with `@next/bundle-analyzer` in Phase 1.

**Effort:** Trivial  
**Phase:** Phase 1 (verify only)

---

### PERF-003 — Textarea Auto-Resize on Every Keystroke

**Severity:** LOW  
**Evidence:** `app/page.tsx` lines 292–296 — `handleInput` reads `scrollHeight` and sets style on every `onChange`

**Description:**  
```typescript
const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setInput(e.target.value);
  e.target.style.height = "auto";
  e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
};
```

This forces a layout reflow on every single keystroke (reading `scrollHeight` triggers synchronous layout). For fast typists this causes frame drops.

**Recommendation:**  
Use `useCallback` and debounce the height calculation, or use CSS `field-sizing: content` (new CSS property with growing browser support).

**Effort:** Trivial  
**Phase:** Phase 2

---

### PERF-004 — `messagesEndRef.scrollIntoView` on Every Render

**Severity:** LOW  
**Evidence:** `app/page.tsx` lines 145–147 — `useEffect` with `[messages, isStreaming]` dependency

**Description:**  
```typescript
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, isStreaming]);
```

This triggers a scroll animation on **every messages state update**. During streaming, `setMessages` is called for every SSE token received. This means `scrollIntoView` fires dozens of times per second during active streaming.

`behavior: "smooth"` causes each call to start a new animation, creating a perpetual scroll animation during streaming.

**Recommendation:**  
Debounce scroll-to-bottom or use `behavior: "instant"` during streaming and `"smooth"` only on new message arrival.

**Effort:** Trivial  
**Phase:** Phase 2

---

### PERF-005 — No Bundle Analysis Tooling

**Severity:** LOW  
**Evidence:** `package.json` — no `@next/bundle-analyzer` or equivalent  
**Affected Files:** `package.json`

**Description:**  
There is no bundle analysis tooling. Bundle size, code splitting boundaries, and chunk composition are unknown. Without this, it is impossible to identify large dependencies or unused code in the production bundle.

**Recommendation:**  
Add `@next/bundle-analyzer` as a dev dependency and include a `npm run analyze` script.

**Effort:** Trivial  
**Phase:** Phase 1

---

### PERF-006 — Google Fonts Loaded Without `display: swap` Explicit Control

**Severity:** LOW  
**Evidence:** `app/layout.tsx` lines 4–16 — `Inter` and `JetBrains_Mono` via `next/font/google`

**Description:**  
`next/font/google` automatically optimises font loading (preload, self-hosting, `display: swap`). This is correct and Next.js handles this well.

However, `JetBrains_Mono` is loaded for the mono font family but the application primarily uses it for small UI labels. The full font weight range is not restricted.

**Recommendation:**  
Restrict font subsets and weights:
```typescript
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"], // Only weights actually used
});
```

**Effort:** Trivial  
**Phase:** Phase 2

---

### PERF-007 — No Image Optimisation Infrastructure

**Severity:** LOW (currently — will become HIGH when avatars/assets added)  
**Evidence:** `public/` — only default SVG placeholders; no `<Image>` component used  
**Affected Files:** `public/`, `app/page.tsx`

**Description:**  
Currently no images are loaded in the app. When user avatars, bot thumbnails, and brand assets are added (Phase 2+), they will need proper optimisation.

Next.js `<Image>` component handles this automatically, but it requires configuration of allowed domains in `next.config.ts`.

**Recommendation:**  
Establish image optimisation policy before Phase 2:
- Use Next.js `<Image>` for all images
- Configure Supabase Storage domain in `next.config.ts` `images.remotePatterns`
- Establish lazy loading as default

**Effort:** Small (config)  
**Phase:** Phase 2

---

### PERF-008 — SSE Stream Not Abortable from Browser

**Severity:** MEDIUM  
**Evidence:** `app/page.tsx` lines 216–280 — `fetch('/api/chat')` has no `AbortController`  
**Affected Files:** `app/page.tsx`

**Description:**  
The SSE streaming fetch in the browser has no `AbortController`. This means:
1. If the user navigates away mid-stream, the fetch continues in the background consuming memory
2. If the user sends a new message, the previous stream cannot be cancelled
3. Memory from the previous stream's ReadableStream reader is held until the stream ends

This is a potential memory leak in a long-running chat session.

**Recommendation:**  
```typescript
const abortControllerRef = useRef<AbortController | null>(null);

// In handleSendMessage:
abortControllerRef.current?.abort();
abortControllerRef.current = new AbortController();
const res = await fetch('/api/chat', { 
  signal: abortControllerRef.current.signal,
  ...
});

// In useEffect cleanup:
return () => abortControllerRef.current?.abort();
```

**Effort:** Small  
**Phase:** Phase 4

---

## 3. Performance Findings Summary

| ID | Finding | Severity | Phase |
|---|---|---|---|
| PERF-001 | All-client component, no RSC, no code splitting | MEDIUM | Phase 2 |
| PERF-002 | Lucide React import (likely tree-shaken) | LOW | Phase 1 (verify) |
| PERF-003 | Textarea reflow on every keystroke | LOW | Phase 2 |
| PERF-004 | `scrollIntoView` fires on every SSE token | LOW | Phase 2 |
| PERF-005 | No bundle analysis tooling | LOW | Phase 1 |
| PERF-006 | Font weights not restricted | LOW | Phase 2 |
| PERF-007 | No image optimisation infrastructure | LOW→HIGH | Phase 2 |
| PERF-008 | SSE stream not abortable (memory leak risk) | MEDIUM | Phase 4 |

---

## 4. Core Web Vitals Assessment (Estimated)

| Metric | Current Estimate | Notes |
|---|---|---|
| LCP (Largest Contentful Paint) | Unknown — unconfirmed Vercel URL | Will be slow if entire bundle loads before render |
| FCP (First Contentful Paint) | Unknown | No RSC → no server HTML → longer blank time |
| CLS (Cumulative Layout Shift) | Low (likely good) | Dark full-screen layout is stable |
| INP (Interaction to Next Paint) | Unknown | Streaming SSE updates many times/sec — test needed |
| TTFB (Time to First Byte) | Likely fast | Vercel edge infra |

**Recommendation:** Measure with Lighthouse after Vercel deployment is confirmed. Target LCP < 2.5s, INP < 200ms.

---

*End of Performance Findings — Phase 0B*

