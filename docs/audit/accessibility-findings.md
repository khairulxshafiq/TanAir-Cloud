# Accessibility Findings
## Phase 0B — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity  
**Method:** Static code analysis of `app/page.tsx` (657 lines) and `app/globals.css`  
**Note:** No runtime axe-core scan performed (no test runner). Findings are based on code inspection against WCAG 2.1 AA standards.

---

## 1. Executive Summary

The prototype UI has functional keyboard interaction for the chat input and basic screen reader support via semantic HTML in some areas, but it has significant accessibility gaps. The most critical issues are: missing ARIA labels on icon-only buttons, no keyboard trap management for the mobile sidebar drawer, no visible focus indicators, and an animation that does not respect `prefers-reduced-motion`.

**Overall Accessibility Score: 3/10** (Partially accessible — significant gaps)

---

## 2. Findings

---

### A11Y-001 — Icon-Only Buttons Have No Accessible Names (Critical)

**Severity:** CRITICAL (WCAG 2.1 SC 4.1.2 — Name, Role, Value)  
**Evidence:** `app/page.tsx` lines 432–439, 441–449, 476–483 — icon-only buttons with no `aria-label`

**Description:**  
Multiple buttons contain only an SVG icon with no visible text and no `aria-label`. A screen reader user will hear "button" with no indication of what the button does.

Affected buttons:
| Button Purpose | Line | Has `aria-label`? |
|---|---|---|
| Close mobile sidebar (X icon) | ~305 | ❌ No |
| Logout (LogOut icon) | ~432–439 | Has `title="Log Keluar"` ✅ (but `title` is not reliable for SR) |
| Mobile menu (Menu icon) | ~476 | ❌ No |
| Send message (Send icon) | ~641–646 | ❌ No |

**Impact:** Screen reader users cannot determine button purpose. Keyboard-only users navigating by tab cannot identify the send button or menu toggle.

**Recommendation:**  
Add `aria-label` to all icon-only buttons:
```tsx
<button aria-label="Tutup menu">
  <X className="w-5 h-5" />
</button>

<button aria-label="Hantar mesej" disabled={!input.trim() || isStreaming}>
  <Send className="w-4 h-4" />
</button>

<button aria-label="Buka menu navigasi">
  <Menu className="w-5 h-5" />
</button>
```

**Effort:** Trivial  
**Phase:** Phase 1

---

### A11Y-002 — No Visible Focus Indicators (Critical)

**Severity:** CRITICAL (WCAG 2.1 SC 2.4.7 — Focus Visible)  
**Evidence:** `app/page.tsx` — no `focus-visible:ring-*` classes on any interactive element; `app/globals.css` — no `:focus-visible` styles

**Description:**  
All interactive elements (buttons, links, textarea) have default browser focus rings which are suppressed by Tailwind's CSS reset (Tailwind v4 includes `*:outline: none` / `*:outline: 0` via preflight). No replacement focus indicator is added.

**Impact:**  
A keyboard-only user navigating the app cannot see which element is focused. This makes the app effectively unusable for keyboard navigation — a WCAG AA failure.

**Recommendation:**  
1. Add global focus-visible styles to `globals.css`:
```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}
```
2. Or add `focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none` to each interactive element via Tailwind.

**Effort:** Small (global CSS rule)  
**Phase:** Phase 1

---

### A11Y-003 — Mobile Sidebar Has No Focus Trap (High)

**Severity:** HIGH (WCAG 2.1 SC 2.1.2 — No Keyboard Trap, inverted: focus must stay within modal)  
**Evidence:** `app/page.tsx` lines 303–469 — sidebar is `fixed` overlay when `mobileMenuOpen === true`

**Description:**  
On mobile, the sidebar is a fixed overlay (`fixed inset-y-0 left-0 z-40`). When it opens, keyboard focus is not trapped inside the sidebar. A keyboard user pressing Tab will navigate through the underlying page content (invisible behind the overlay), not through the sidebar.

Additionally, when the sidebar closes, focus is not returned to the triggering element (the menu button).

**Impact:** Keyboard users cannot navigate the mobile sidebar. Screen reader users will navigate through hidden content.

**Recommendation:**  
Implement focus trap using either:
1. A focus trap hook (`useFocusTrap`) that applies `inert` attribute to the main content when sidebar is open
2. Or the HTML `dialog` element which provides native focus management

**Effort:** Medium  
**Phase:** Phase 2

---

### A11Y-004 — No `aria-live` Region for Streaming Messages (High)

**Severity:** HIGH (WCAG 2.1 SC 4.1.3 — Status Messages)  
**Evidence:** `app/page.tsx` — message list div has no `aria-live` attribute

**Description:**  
When a new message arrives (either from the user or from the AI stream), screen readers are not notified. The message list is updated via React state changes but the container div has no `aria-live="polite"` attribute.

Screen reader users will not know that a response has been received or is still streaming.

**Recommendation:**  
Add `aria-live="polite"` to the message stream container:
```tsx
<div 
  className="flex-1 overflow-y-auto..." 
  aria-live="polite" 
  aria-label="Perbualan"
>
```

**Effort:** Trivial  
**Phase:** Phase 1

---

### A11Y-005 — Streaming Typing Indicator Uses `animate-ping` Without Reduced Motion (Medium)

**Severity:** MEDIUM (WCAG 2.1 SC 2.3.3 — Animation from Interactions, AAA; SC 1.4.3 at AA)  
**Evidence:** `app/page.tsx` line 614: `<span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />`

**Description:**  
The "Aura sedang menaip..." indicator uses `animate-ping` — a CSS animation. There is no `prefers-reduced-motion` check. For users with vestibular disorders or motion sensitivity, continuous pulsing animations can cause nausea or distraction.

**Recommendation:**  
Add reduced motion variant:
```tsx
<span className="w-2 h-2 rounded-full bg-purple-400 animate-ping motion-reduce:animate-none" />
```

Tailwind v4 supports `motion-reduce:` modifier natively.

**Effort:** Trivial  
**Phase:** Phase 1

---

### A11Y-006 — Textarea Has No `aria-label` (Medium)

**Severity:** MEDIUM (WCAG 2.1 SC 1.3.1, 4.1.2)  
**Evidence:** `app/page.tsx` lines 630–639 — `<textarea>` with `placeholder` only

**Description:**  
The chat textarea uses only `placeholder` for labelling. `placeholder` text is not a substitute for a proper `<label>` or `aria-label`. Placeholder text:
- Disappears when user starts typing (users cannot see the label while typing)
- Has low contrast in most browsers
- Is not reliably announced by all screen readers

**Recommendation:**  
Add `aria-label`:
```tsx
<textarea
  aria-label={`Mesej kepada ${activeAgent}`}
  placeholder={`Tanya ${activeAgent}...`}
  ...
/>
```

**Effort:** Trivial  
**Phase:** Phase 1

---

### A11Y-007 — Agent Selector Buttons Have No Role Context (Medium)

**Severity:** MEDIUM (WCAG 2.1 SC 1.3.1)  
**Evidence:** `app/page.tsx` lines 349–372 — agent selector buttons

**Description:**  
The agent selector is a group of buttons that behave like a radio group (only one can be active). However, they are marked up as plain `<button>` elements with no group role or selected-state indication beyond visual styling.

A screen reader will announce them individually as "Aura button", "Aura-Trade button" etc. but will not communicate that these are mutually exclusive selections or which one is currently active.

**Recommendation:**  
Use `role="group"` on the container and `aria-pressed={isActive}` on each button, or restructure as a `radiogroup` with `role="radio"`:
```tsx
<div role="group" aria-label="Pilih ejen">
  {AGENTS.map(agent => (
    <button
      role="radio"
      aria-checked={activeAgent === agent.id}
      ...
    >
```

**Effort:** Small  
**Phase:** Phase 2

---

### A11Y-008 — Empty State Suggestion Buttons Not Labelled Sufficiently (Low)

**Severity:** LOW  
**Evidence:** `app/page.tsx` lines 523–569 — 4 quick prompt buttons

**Description:**  
The suggestion buttons have emoji + bold title + description text. This is generally adequate for sighted users but the emoji at the start may be announced verbosely by screen readers (e.g. "chart increasing emoji Analisis Pasaran Semak sentimen..."). The button text hierarchy is also inconsistent — some content is inside `<p>` tags inside buttons.

**Recommendation:**  
- Move emoji inside `aria-hidden="true"` span
- Provide a concise `aria-label` that includes the action: `aria-label="Analisis Pasaran — Semak sentimen Bursa dan teknikal bersama Aura-Trade"`

**Effort:** Trivial  
**Phase:** Phase 2

---

### A11Y-009 — No Skip Navigation Link (Low)

**Severity:** LOW (WCAG 2.1 SC 2.4.1 — Bypass Blocks)  
**Evidence:** No skip link in `app/layout.tsx` or `app/page.tsx`

**Description:**  
Without a skip navigation link, keyboard users must tab through the entire sidebar (6 agents + session list + footer) to reach the chat input on every page load. This is a significant navigation burden.

**Recommendation:**  
Add a visually hidden skip link at the top of the layout:
```tsx
<a href="#chat-input" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 ...">
  Skip to chat
</a>
```

**Effort:** Trivial  
**Phase:** Phase 2

---

### A11Y-010 — Colour Contrast of Muted Text (Low — Requires Verification)

**Severity:** LOW (WCAG 2.1 SC 1.4.3 — Contrast Minimum 4.5:1)  
**Evidence:** `app/globals.css` — `--text-muted: #64748B` on `--bg-base: #0B0F19`

**Description:**  
The design uses three text levels:
- `--text-primary: #F1F5F9` on `--bg-base: #0B0F19` → estimated contrast ratio ~13:1 ✅
- `--text-secondary: #94A3B8` on `--bg-base: #0B0F19` → estimated contrast ratio ~7.5:1 ✅
- `--text-muted: #64748B` on `--bg-base: #0B0F19` → estimated contrast ratio ~4.2:1 ⚠ (below WCAG AA 4.5:1 for normal text)
- `text-zinc-500` (#71717a) on `#0B0F19` → estimated ~4.0:1 ⚠ (used for secondary labels)

**Note:** This requires verification with a contrast checker tool. The values above are estimates based on luminance calculations.

**Recommendation:**  
Run all text color combinations through a contrast checker. Adjust `--text-muted` to pass WCAG AA.

**Effort:** Small  
**Phase:** Phase 2

---

## 3. Accessibility Findings Summary

| ID | Finding | WCAG | Severity | Phase |
|---|---|---|---|---|
| A11Y-001 | Icon-only buttons no accessible names | SC 4.1.2 | CRITICAL | Phase 1 |
| A11Y-002 | No visible focus indicators | SC 2.4.7 | CRITICAL | Phase 1 |
| A11Y-003 | Mobile sidebar no focus trap | SC 2.1.2 | HIGH | Phase 2 |
| A11Y-004 | No `aria-live` on message stream | SC 4.1.3 | HIGH | Phase 1 |
| A11Y-005 | `animate-ping` no reduced motion | SC 2.3.3 | MEDIUM | Phase 1 |
| A11Y-006 | Textarea no `aria-label` | SC 4.1.2 | MEDIUM | Phase 1 |
| A11Y-007 | Agent selector missing role context | SC 1.3.1 | MEDIUM | Phase 2 |
| A11Y-008 | Suggestion buttons emoji/label | SC 4.1.2 | LOW | Phase 2 |
| A11Y-009 | No skip navigation link | SC 2.4.1 | LOW | Phase 2 |
| A11Y-010 | Muted text contrast verification needed | SC 1.4.3 | LOW | Phase 2 |

---

*End of Accessibility Findings — Phase 0B*

