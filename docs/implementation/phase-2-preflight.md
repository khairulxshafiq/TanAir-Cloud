# Phase 2 Pre-flight Report

## Read-Only Design System & Application Shell Discovery

**Generated:** 2026-09-20  
**Lead Roles:** Lead Product Designer, Design Systems Architect, Senior Frontend Architect, Accessibility Engineer, Senior DevOps Engineer  
**Scope:** Strict Read-Only Discovery — Zero source code modifications  
**Target Next Phase:** Phase 2 (Design System & Application Shell)

---

## 1. Git Safety & Repository State

| Inspection Item         | Value / Status                                                      | Verification Notes                                 |
| ----------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| **Current Branch**      | `main`                                                              | Baseline branch checked out                        |
| **Current Commit**      | `de79dc0`                                                           | Phase 0C baseline commit                           |
| **Working Tree Status** | Clean (`nothing to commit, working tree clean`)                     | Zero uncommitted modifications                     |
| **Phase 1A Branch**     | `phase/1a-security-containment`                                     | Completed with 27 passing tests (commit `4a7d05c`) |
| **PR #1 Status**        | **OPEN** (`https://github.com/khairulxshafiq/TanAir-Cloud/pull/1`) | Unmerged; awaiting founder merge                   |
| **Phase 1B Status**     | Pending                                                             | DevOps & CI workflow not yet applied to `main`     |

> [!IMPORTANT]
> **Strict Read-Only Enforcement:** In compliance with project governance (`DEC-011`, `DEC-012`), no application source code, components, styles, or configuration files have been created, modified, or deleted during this discovery step. Only this documentation report is produced.

---

## 2. Phase 1B Dependency Assessment

Phase 2 introduces a component library, design tokens, and modular application shells. For Phase 2 to be executed safely and maintainably, the following engineering tooling must be verified:

| Tooling / Dependency           |                  Status                  | Impact on Phase 2                                              | Phase 2 Readiness |
| ------------------------------ | :--------------------------------------: | -------------------------------------------------------------- | :---------------: |
| **Canonical Node Runtime**     |       Pending Phase 1B (`.nvmrc`)        | Node version drift risks component build discrepancies         | ⚠️ Blocked on 1B  |
| **`npm ci` Reproducibility**   |    Ready (`package-lock.json` clean)     | Essential for consistent CSS & component builds                |     ✅ Ready      |
| **Prettier & Code Formatting** | Missing (`.prettierrc`, `.editorconfig`) | Unformatted PRs create noisy diffs across extracted components | ⚠️ Blocked on 1B  |
| **ESLint Static Analysis**     |   Ready (`eslint-config-next` active)    | Catches React hook errors during component extraction          |     ✅ Ready      |
| **TypeScript Strict Checking** |   Ready (`tsconfig.json` strict: true)   | Ensures strict prop contracts on new UI primitives             |     ✅ Ready      |
| **Test Runner (Vitest)**       |     Ready (Vitest 5.0.1 in devDeps)      | Required for unit testing design system primitives             |     ✅ Ready      |
| **Test Coverage Reporting**    |             Pending Phase 1B             | Tracks component and shell test coverage                       | ⚠️ Blocked on 1B  |
| **GitHub Actions CI Pipeline** |   Missing (`.github/workflows/ci.yml`)   | Automated gatekeeper to ensure components compile on PR        | ⚠️ Blocked on 1B  |
| **PR Governance Template**     |   Missing (`pull_request_template.md`)   | Required to enforce accessibility & security checklists        | ⚠️ Blocked on 1B  |

**Pre-flight Conclusion on Dependencies:**  
Phase 2 **must not begin code implementation** until PR #1 (Phase 1A) and Phase 1B (DevOps, Prettier, and CI workflow) are merged into `main`. Executing Phase 2 without CI and formatting gates risks introducing unreviewed component regressions into the core product.

---

## 3. Current UI Inventory (`app/page.tsx`)

The existing prototype is a single 658-line monolithic React component in `app/page.tsx`. Below is an exhaustive audit of all user interface elements currently rendered:

| #      | UI Element                     | Current Location           |       Accessibility State        |     Responsive State     |      Theme Compatibility       | Recommended Future Component                    | Phase 2 Action                            |
| ------ | ------------------------------ | -------------------------- | :------------------------------: | :----------------------: | :----------------------------: | ----------------------------------------------- | ----------------------------------------- |
| **1**  | **Brand Header**               | `page.tsx:300-325`         | Moderate (missing aria-current)  |   Collapses on mobile    |           Dark-only            | `components/layout/BrandLogo.tsx`               | Extract to layout                         |
| **2**  | **New Chat Action**            | `page.tsx:330-337`         |    Good (visible text + icon)    |  Full width in sidebar   |  Dark-only (`bg-purple-600`)   | `components/ui/Button.tsx`                      | Extract as Button variant                 |
| **3**  | **Agent Persona Selector**     | `page.tsx:340-376`         | Poor (no radio group semantics)  |       Stacked list       |           Dark-only            | `features/agents/components/AgentSelector.tsx`  | Extract & add ARIA `radiogroup`           |
| **4**  | **Chat Sessions List**         | `page.tsx:378-403`         |     Fair (clickable buttons)     | Vertical scrollable list |           Dark-only            | `features/chat/components/SessionList.tsx`      | Extract with virtual scroll               |
| **5**  | **PAYG Credits Badge**         | `page.tsx:406-416`         |       Missing live-region        | Fixed in sidebar footer  |           Dark-only            | `features/quota/components/CreditChip.tsx`      | Extract & label as simulation (`DEC-015`) |
| **6**  | **User Account / Auth Button** | `page.tsx:418-466`         |    Fair (Google SVG present)     | Truncated text on narrow |           Dark-only            | `features/auth/components/UserAccountNav.tsx`   | Extract with Avatar primitive             |
| **7**  | **Top Header Cockpit**         | `page.tsx:473-505`         |        Fair (h2 present)         | Hides role on xs screens | Dark-only (`backdrop-blur-md`) | `components/layout/AppHeader.tsx`               | Extract as shell header                   |
| **8**  | **Mobile Drawer Trigger**      | `page.tsx:477-481`         |   Poor (missing `aria-label`)    |  Visible on `<md` only   |           Dark-only            | `components/ui/IconButton.tsx`                  | Add accessible name & focus trap          |
| **9**  | **Empty State / Suggestions**  | `page.tsx:509-571`         |      Fair (button elements)      |    1 col xs, 2 col sm    |     Dark-only (`#161D2E`)      | `features/chat/components/ChatEmptyState.tsx`   | Extract with Bento Card styling           |
| **10** | **Message Bubble (User)**      | `page.tsx:573-600`         |     Fair (role text present)     | Max-w-3xl, flex-reverse  |  Dark-only (`bg-purple-600`)   | `features/chat/components/MessageBubble.tsx`    | Extract as variant `user`                 |
| **11** | **Message Bubble (Assistant)** | `page.tsx:600-620`         | Missing `aria-live` announcement | Max-w-3xl, left-aligned  |   Dark-only (`bg-[#161D2E]`)   | `features/chat/components/MessageBubble.tsx`    | Extract as variant `assistant`            |
| **12** | **Typing Stream Indicator**    | `page.tsx:613-617`         |     Missing `motion-reduce`      |  Inline text + ping dot  |           Dark-only            | `features/chat/components/TypingIndicator.tsx`  | Add accessible reduced motion             |
| **13** | **Composer Textarea**          | `page.tsx:627-640`         |  Missing explicit `aria-label`   |   Auto-resize to 160px   |   Dark-only (`bg-[#111827]`)   | `features/chat/components/ChatComposer.tsx`     | Extract with dynamic height               |
| **14** | **Send Message Button**        | `page.tsx:641-647`         |  Missing `aria-label="Hantar"`   |   40x40px touch target   | Dark-only (`from-purple-600`)  | `components/ui/IconButton.tsx`                  | Add ARIA label & disabled styles          |
| **15** | **Composer Footer Helper**     | `page.tsx:648-652`         |        Fair (small text)         |   Flex justify-between   |           Dark-only            | `features/chat/components/ComposerFooter.tsx`   | Standardize copy                          |
| **16** | **Modal / Dialog**             | _Missing_                  |               N/A                |           N/A            |              N/A               | `components/ui/Modal.tsx`                       | Build in Phase 2                          |
| **17** | **Toast Notifications**        | _Missing_ (uses `alert()`) |  Severe (`alert()` blocks main)  |           N/A            |              N/A               | `components/ui/Toast.tsx`                       | Build in Phase 2                          |
| **18** | **Theme Switcher**             | _Missing_                  |               N/A                |           N/A            |              N/A               | `components/layout/ThemeToggle.tsx`             | Build in Phase 2                          |
| **19** | **Profile Drawer**             | _Missing_                  |               N/A                |           N/A            |              N/A               | `features/profile/components/ProfileDrawer.tsx` | Deferred to Phase 5                       |
| **20** | **Bot Studio Shell**           | _Missing_                  |               N/A                |           N/A            |              N/A               | `features/bots/components/BotStudioShell.tsx`   | Shell placeholder in Phase 2              |
| **21** | **Admin Dashboard Shell**      | _Missing_                  |               N/A                |           N/A            |              N/A               | `features/admin/components/AdminShell.tsx`      | Shell placeholder in Phase 2              |

---

## 4. Current Style Inventory & Flaws

### A. Root Variables (`app/globals.css`)

Currently defines 14 CSS variables exclusively for a dark theme:

```css
:root {
  --bg-base: #0b0f19;
  --bg-surface: #111827;
  --bg-card: #161d2e;
  --bg-card-hover: #1c2538;
  --bg-input: #0f1623;
  --border: rgba(255, 255, 255, 0.08);
  --border-accent: rgba(139, 92, 246, 0.35);
  --accent: #8b5cf6;
  --accent-glow: rgba(139, 92, 246, 0.25);
  --accent-2: #06b6d4;
  --green: #22d3a5;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
}
```

### B. Identified Style Architecture Flaws

1. **Zero Light Theme Support (`DEC-007` Violation):** All variables assume a near-black background (`#0B0F19`). If a user has their OS set to Light Mode, the app remains dark, and no light tokens exist.
2. **Hardcoded Literal Hex Values Scattered in JSX:**
   - Backgrounds: `bg-[#0B0F19]`, `bg-[#111827]`, `bg-[#161D2E]`, `bg-[#1C2538]`, `bg-[#0F1623]/80`
   - Borders: `border-white/10`, `border-white/5`, `border-white/15`, `border-purple-500/20`
   - Text: `text-zinc-100`, `text-zinc-200`, `text-zinc-400`, `text-zinc-500`
     _Impact:_ Cannot switch themes cleanly because half the colors are hardcoded Tailwind utility classes rather than semantic CSS variables.
3. **Missing Gold Accent Tokens (`DEC-008` Gap):** While purple (`#8B5CF6`) is prevalent, the warm gold accent representing Malaysian premium value is missing from the CSS variables (only an ad-hoc `text-amber-400` appears on the coin icon).
4. **Missing Focus Ring Tokens:** Buttons lack `:focus-visible` outlines, making keyboard navigation invisible.
5. **Arbitrary Spacing:** Uses mixed padding (`p-1.5`, `p-2`, `p-2.5`, `p-3`, `p-4`, `p-6`) without consistent alignment to an 8px grid.

---

## 5. Proposed Design Token Architecture

Following `DEC-007` (Dark, Light, System) and `DEC-008` (Restrained Purple-Gold, Calm, Bento Aesthetics), the proposed token architecture defines semantic tokens mapped to distinct theme palettes:

### A. Color Token System

```
Primitive Palette:
  Purple (Intelligence):  50: #FAF5FF | 500: #8B5CF6 | 600: #7C3AED | 900: #3B0764
  Gold (Premium Value):   50: #FFFBEB | 500: #F59E0B | 600: #D97706 | 900: #78350F
  Neutral (Slate/Zinc):   50: #F8FAFC | 100: #F1F5F9 | 800: #1E293B | 900: #0F172A | 950: #0B0F19
  Status Emerald:        500: #10B981 | 600: #059669
  Status Crimson:        500: #EF4444 | 600: #DC2626
```

### B. Semantic Mapping (Dark vs. Light)

| Semantic Token           | Dark Theme (`.dark` or default) | Light Theme (`.light`)          | Usage                           |
| ------------------------ | ------------------------------- | ------------------------------- | ------------------------------- |
| `--color-bg-canvas`      | `#0B0F19` (Deep Obsidian)       | `#F8FAFC` (Soft Cool Off-White) | Page viewport backdrop          |
| `--color-bg-surface`     | `#111827` (Card Charcoal)       | `#FFFFFF` (Pure White)          | Sidebar, Header, Modals         |
| `--color-bg-subtle`      | `#161D2E` (Deep Navy)           | `#F1F5F9` (Subtle Slate Tint)   | Assistant bubbles, Input fields |
| `--color-bg-elevated`    | `#1C2538` (Hover Tint)          | `#E2E8F0` (Hover Tint)          | Card hover, dropdown menus      |
| `--color-border-subtle`  | `rgba(255, 255, 255, 0.08)`     | `rgba(15, 23, 42, 0.08)`        | Dividers, subtle borders        |
| `--color-border-strong`  | `rgba(255, 255, 255, 0.16)`     | `rgba(15, 23, 42, 0.16)`        | Active borders, input focus     |
| `--color-border-accent`  | `rgba(139, 92, 246, 0.35)`      | `rgba(124, 58, 237, 0.35)`      | Highlighted agent card border   |
| `--color-text-primary`   | `#F1F5F9` (95% White)           | `#0F172A` (95% Slate Black)     | Headings, user text, inputs     |
| `--color-text-secondary` | `#94A3B8` (Slate 400)           | `#475569` (Slate 600)           | Subtitles, agent role           |
| `--color-text-muted`     | `#64748B` (Slate 500)           | `#94A3B8` (Slate 400)           | Timestamps, helper tips         |
| `--color-accent-purple`  | `#8B5CF6` (Aura Purple)         | `#7C3AED` (Deeper Purple)       | Primary action, active persona  |
| `--color-accent-gold`    | `#F59E0B` (Aura Gold)           | `#D97706` (Rich Warm Amber)     | Pro badges, credit balances     |
| `--color-focus-ring`     | `rgba(139, 92, 246, 0.6)`       | `rgba(124, 58, 237, 0.6)`       | Global 2px `:focus-visible`     |

### C. Spacing, Radius, and Elevation Tokens

- **Grid:** 8px base grid (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
- **Radii:** `sm`: 6px | `md`: 10px | `lg`: 14px | `xl`: 20px | `full`: 9999px
- **Glassmorphism:** Restrained backdrop filter: `backdrop-blur-md bg-surface/80 border-subtle`
- **Motion Timing:** Default 200ms ease-out (`transition-all duration-200 ease-out`)
- **Reduced Motion:** Automatic fallback to `transition-none` when `prefers-reduced-motion: reduce`

---

## 6. Theme Architecture Plan

To prevent Flash of Unstyled Content (FOUC) and satisfy Next.js App Router SSR constraints:

1. **Storage & Evaluation:**
   - User preference stored in `localStorage.getItem('aura_theme')` (`'dark' | 'light' | 'system'`).
   - Inline blocking script `<script>` in `app/layout.tsx` `<head>` reads preference or `window.matchMedia('(prefers-color-scheme: dark)')` before the first paint, applying class `dark` or `light` directly to `document.documentElement`.
2. **Native Lightweight Controller (`useTheme` Hook):**
   - Zero heavyweight dependencies (e.g. `next-themes` not strictly required; a 40-line native hook handles hydration and class toggling cleanly).
3. **Theme Switcher Component (`components/layout/ThemeToggle.tsx`):**
   - 3-way toggle (Dark / Light / Sistem) rendered in the AppShell sidebar and settings.

---

## 7. Typography Plan

### Approved Font Choices

- **Interface Font:** `Inter` (via `next/font/google` variable `--font-inter`)
  - Subsets: Latin, Latin-ext
  - Display: `swap`
  - Weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Technical & Monospace Font:** `JetBrains Mono` (variable `--font-mono`)
  - Used strictly for timestamps, token counters, API keys, and code snippets
  - Weights: 400, 600

### Bahasa Melayu Readability Audit

- `Inter` provides outstanding glyph support for Bahasa Melayu.
- Line heights in chat bubbles must maintain `leading-relaxed` (1.625) to prevent ascender/descender collisions with diacritics and long compound words common in formal and conversational Malay.

---

## 8. Proposed Phase 2 Component Hierarchy

```
components/
├── ui/                              # Pure UI Primitives (Zero business logic)
│   ├── Button.tsx                  # Variants: primary, secondary, ghost, danger, gold
│   ├── IconButton.tsx              # Tooltip-ready accessible icon button
│   ├── Input.tsx                   # Text, password with clear focus states
│   ├── Textarea.tsx                # Auto-resizing multi-line input
│   ├── Badge.tsx                   # Variants: neutral, purple, gold, success, error
│   ├── Avatar.tsx                  # User avatar with fallback initial
│   ├── Modal.tsx                   # Accessible dialog with focus trap & Esc key
│   ├── Drawer.tsx                  # Mobile slide-out drawer with overlay
│   ├── Tooltip.tsx                 # Non-blocking hover/focus tooltip
│   ├── Toast.tsx                   # Accessible floating feedback (replaces alert())
│   ├── Skeleton.tsx                # Loading shimmer placeholder
│   └── EmptyState.tsx              # Bento-styled empty prompt canvas
├── layout/                          # Application Shell Foundations
│   ├── AppShell.tsx                # Two-column cockpit layout wrapper
│   ├── AppHeader.tsx               # Top bar with active agent and theme toggle
│   ├── AppSidebar.tsx              # Navigation, sessions, and account drawer
│   ├── MobileDrawer.tsx            # Sliding mobile navigation
│   └── ThemeToggle.tsx             # Dark / Light / System switcher
features/
├── chat/components/                # Extracted Chat Feature Slice
│   ├── ChatShell.tsx               # Main chat orchestrator
│   ├── MessageList.tsx             # Virtualized / scrollable message stream
│   ├── MessageBubble.tsx           # User & Assistant bubble variants
│   ├── ChatComposer.tsx            # Prompt input with send action
│   ├── TypingIndicator.tsx         # Reduced-motion compliant typing wave
│   └── PromptSuggestions.tsx       # Quick start prompts
├── agents/components/              # Agent Selector Feature Slice
│   ├── AgentSelector.tsx           # 6-Agent Armada radio list
│   └── AgentBadge.tsx              # Compact persona chip
└── quota/components/               # Quota & Simulation Display
    └── CreditChip.tsx              # Simulated PAYG balance indicator
```

---

## 9. Application Shell Plan

In accordance with `ADR-0002` (Routing Strategy), the application will be structured into three primary layout shells:

```
app/
├── (public)/                       # Marketing & Landing (Phase 3)
│   └── layout.tsx                  # Public Navbar + Minimal Footer Shell
├── (app)/                          # Authenticated Cockpit (Phase 2 Focus)
│   ├── layout.tsx                  # AppShell (Sidebar + Header + Active Agent)
│   ├── chat/page.tsx               # Main Chat Cockpit (migrated from page.tsx)
│   ├── profile/page.tsx            # Profile Shell (Placeholder)
│   └── bots/page.tsx               # Bot Studio Shell (Placeholder)
└── (admin)/                        # Operations & Revenue (Phase 8)
    └── layout.tsx                  # Dedicated Admin Shell (Placeholder)
```

**Phase 2 Scope:** Build the authenticated `AppShell` and decompose `app/page.tsx` into `app/(app)/chat/page.tsx`. Provide lightweight placeholder shells for `/profile` and `/bots` without implementing feature logic.

---

## 10. Aura Core Pre-flight (DEC-009)

- **Analysis:** The signature "crystal-like neural core" represents the central landing-page visual. Built with Three.js / WebGL, it carries significant bundle weight (~600KB uncompressed) and CPU/GPU execution overhead.
- **Recommendation:** **Explicitly defer Aura Core implementation to Phase 3 (Landing Page).**
- **Phase 2 Technical Preparation:** Phase 2 will only establish the lazy-loading boundary (`React.lazy` / `next/dynamic`) and CSS fallback container (`bg-gradient-radial` with static gold-purple SVG crystal) so that no heavy 3D rendering blocks core cockpit load times.

---

## 11. Accessibility Audit & Remediation Matrix

| Element / Flow       | Existing Flaw                                                     |       WCAG 2.1 Criteria        | Phase 2 Remediation Plan                                        |
| -------------------- | ----------------------------------------------------------------- | :----------------------------: | --------------------------------------------------------------- |
| **Icon Buttons**     | `Send`, `Menu`, `X`, `LogOut` lack `aria-label`                   |   4.1.2 (Name, Role, Value)    | Add mandatory `aria-label` props on all `IconButton` primitives |
| **Mobile Drawer**    | Focus is not trapped; background elements focusable               |      2.4.3 (Focus Order)       | Implement native `keydown` focus-trap in `MobileDrawer`         |
| **Drawer Escape**    | Pressing Esc does not close mobile sidebar                        |        2.1.1 (Keyboard)        | Bind `keydown` Escape handler to close drawer                   |
| **Chat Streaming**   | New assistant tokens not announced to screen readers              |    4.1.3 (Status Messages)     | Wrap message stream container in `aria-live="polite"`           |
| **Focus Rings**      | Global `:focus-visible` ring missing; links blend into background |     2.4.7 (Focus Visible)      | Add global `:focus-visible` 2px ring in `globals.css`           |
| **Typing Indicator** | `animate-ping` runs continuously without reduced-motion check     |   2.2.2 (Pause, Stop, Hide)    | Add `motion-reduce:animate-none` on all pulsing animations      |
| **Native `alert()`** | Auth failures trigger browser-blocking `alert()`                  |  3.3.1 (Error Identification)  | Replace with accessible non-blocking `Toast` component          |
| **Textarea**         | Missing explicit `<label>` or `aria-label`                        | 3.3.2 (Labels or Instructions) | Add `aria-label="Mesej kepada {agent}"`                         |

---

## 12. Responsive Design Strategy (320px to 4K)

- **Mobile-First Breakpoint Scheme (Tailwind):**
  - `< 640px` (`xs`): Single-column view; sidebar hidden in sliding drawer; touch targets >= 44x44px; input auto-docked at bottom above mobile keyboard.
  - `640px – 768px` (`sm`): 2-column suggestions grid; compact agent selector.
  - `768px – 1024px` (`md`): Sidebar pinned statically (280px); main chat area fluid.
  - `> 1024px` (`lg` / `xl`): Full multi-agent cockpit with optional inspector panel.
- **Mobile Keyboard Handling:** Use modern `100dvh` (dynamic viewport height) instead of `100vh` to eliminate mobile browser URL bar jumping when virtual keyboards open.

---

## 13. Brand Voice & Copy Migration List

In accordance with `03_TANAIR_BRAND_VOICE.md` and `DEC-015`:

| Current Prototype Copy                              | Approved BM-First Copy                             | Rationale                                                   |
| --------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| `"Armada Ejen (Select Agent)"`                      | `"Armada Ejen Aura"`                               | Remove unnecessary English parenthetical                    |
| `"Sejarah Sesi (Sessions)"`                         | `"Sejarah Perbualan"`                              | Natural Bahasa Melayu terminology                           |
| `"Baki PAYG: RM 10.00"`                             | `"Baki Kredit (Simulasi): RM 10.00"`               | Comply with `DEC-015` (Simulated features must be labelled) |
| `"Multi-Tenant Sandbox Safe"`                       | `"Mod Selamat Sandbox"`                            | Approachable BM for Malaysian business owners               |
| `alert("Ralat log masuk Google: " + error.message)` | Toast: `"Gagal log masuk. Sila cuba sekali lagi."` | Calm, helpful error tone without technical jargon           |

---

## 14. Phase 2 Scope Definition

### MUST DO (Critical Foundation)

1. Design Token architecture (CSS variables for Dark, Light, and System preference in `globals.css`).
2. Global `:focus-visible` styling and reduced-motion reset.
3. Native Theme Controller (`useTheme` hook + `ThemeToggle` component).
4. Core UI Primitives (`Button`, `IconButton`, `Input`, `Textarea`, `Badge`, `Avatar`, `Skeleton`).
5. Overlay Primitives (`Modal`, `Drawer`, `Toast` replacing `alert()`).
6. App Router Route Group re-organization: `(app)/layout.tsx` (AppShell) + `(app)/chat/page.tsx`.
7. Decompose `app/page.tsx` (658 lines) into dedicated feature slices (`features/chat/`, `features/agents/`, `components/layout/`).
8. Accessible focus trap and Escape handler on mobile navigation drawer.
9. Component tests for all new primitives using Vitest + React Testing Library.

### SHOULD DO (High Value)

1. `EmptyState` bento-card prompt suggestion component.
2. Tooltip primitive with keyboard focus trigger.
3. Replace raw inline SVG Google icon with standardized icon component.
4. Add `100dvh` mobile viewport styling.

### COULD DO (Nice to Have)

1. Add Storybook configuration for design system components (if time allows without blocking quality gate).
2. Add subtle gold border hover glow on active agent cards.

### WILL NOT DO (Strictly Out of Scope)

- No Three.js Aura Core implementation (Deferred to Phase 3).
- No Landing page or marketing copy implementation (Phase 3).
- No Onboarding flow (Phase 3).
- No Bot Builder wizard (Phase 7).
- No Admin Dashboard tables (Phase 8).
- No persistent Supabase database tables (Phase 10).
- No real payment or top-up integration (Phase 6).

---

## 15. Incremental Migration Sequence (Step-by-Step)

```
Step 1: Design Tokens & CSS Reset
  └── Update app/globals.css with semantic CSS variables for dark and light themes.

Step 2: Primitive Components (components/ui/)
  └── Build Button, IconButton, Badge, Avatar, Textarea with full test suites.

Step 3: Feedback & Overlay Primitives
  └── Build Toast, Modal, and Drawer with focus trapping.

Step 4: AppShell & Layout Extraction
  └── Build components/layout/ (AppHeader, AppSidebar, MobileDrawer, ThemeToggle).

Step 5: Chat Feature Extraction
  └── Extract features/chat/ (MessageList, MessageBubble, ChatComposer, TypingIndicator).

Step 6: Route Group Migration
  └── Create app/(app)/layout.tsx and app/(app)/chat/page.tsx; simplify root page.tsx to thin entry.

Step 7: Verification & Visual Regression Check
  └── Run lint, typecheck, tests, and build; verify 100% feature parity with prototype.
```

---

## 16. Dependency Assessment

| Proposed Capability   | Recommended Solution                           | Alternative Considered | Rationale                                                          |
| --------------------- | ---------------------------------------------- | ---------------------- | ------------------------------------------------------------------ |
| **Icons**             | `lucide-react` (Already installed ^1.47.0)     | `@heroicons/react`     | Consistent with existing prototype; tree-shakeable.                |
| **Focus Trap**        | Lightweight native React hook (`useFocusTrap`) | `focus-trap-react`     | 0 KB extra bundle; no external dependency risk.                    |
| **Theme Controller**  | Lightweight native hook (`useTheme`)           | `next-themes`          | Native approach avoids third-party version mismatch with React 19. |
| **Component Testing** | `@testing-library/react` + `jsdom`             | Cypress / Playwright   | Fast unit-level execution in Vitest without browser overhead.      |
| **Class Merging**     | Simple template literals or lightweight `clsx` | Full Tailwind Merge    | Keep bundle minimal unless class collisions occur.                 |

---

## 17. Pre-flight Sign-Off & Quality Gate

```
╔══════════════════════════════════════════════════════════════════╗
║              PHASE 2 PRE-FLIGHT DISCOVERY: COMPLETE              ║
║                                                                  ║
║  1. Strict read-only audit maintained: 0 source files modified.  ║
║  2. 21 UI elements catalogued with accessibility actions.        ║
║  3. Complete Dark/Light/System design token architecture mapped. ║
║  4. 7-step incremental migration plan defined (no big-bang).     ║
║  5. Aura Core deferred to Phase 3; 3D performance risks managed. ║
║  6. Phase 1B dependencies clearly identified.                    ║
║                                                                  ║
║  STATUS: AWAITING PR #1 MERGE & PHASE 1B COMPLETION              ║
╚══════════════════════════════════════════════════════════════════╝
```

---

_End of Phase 2 Pre-flight Report_
