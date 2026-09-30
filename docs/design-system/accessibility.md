# Accessibility Strategy & WCAG 2.1 AA Compliance

## 1. Compliance Target
TanAir Cloud targets strict **WCAG 2.1 Level AA** compliance across all user-facing interfaces.

## 2. Core Implementation Patterns

### 2.1 Bypass Blocks (WCAG 2.4.1)
- Implemented via `components/layout/SkipLink.tsx`.
- Hidden off-screen until focused via keyboard (`Tab` key).
- Directly focuses `#main-content`, bypassing header and navigation landmarks.

### 2.2 Focus Indicators & Trapping (WCAG 2.4.7 & 2.4.3)
- Global focus rings styled via token: `box-shadow: var(--focus-ring)`.
- Interactive elements do not use `outline: none` without providing an equivalent focus ring.
- Modals (`components/overlays/Modal.tsx`) and Drawers (`components/overlays/Drawer.tsx`) trap tab focus within the active dialog, preventing focus leakage into background elements.

### 2.3 Keyboard Dismissal (Escape Key)
- All overlays (`Modal`, `Drawer`, `Tooltip`) register `keydown` event listeners for the `Escape` key to immediately close active overlays.

### 2.4 Scroll Locking
- When overlays are open, the document body overflow is locked (`overflow: hidden`) to preserve scroll position and avoid background scrolling.

### 2.5 Contrast Standards (WCAG 1.4.3)
- Normal text: >= 4.5:1 contrast ratio against the background token.
- Large text (>= 18pt or bold >= 14pt): >= 3.0:1 contrast ratio.
- UI components and graphical objects: >= 3.0:1 contrast ratio.

### 2.6 Form Labels and Descriptions (WCAG 3.3.2)
- All inputs (`Input`, `Textarea`) mandate explicit `id`, `label`, and support `aria-describedby` for validation and error messages (`role="alert"`).

