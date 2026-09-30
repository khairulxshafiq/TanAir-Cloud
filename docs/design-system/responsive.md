# Responsive Design Strategy

## 1. Breakpoints
The TanAir layout system utilizes modern responsive breakpoints aligned with mobile-first paradigms:
- `sm`: `640px` (Compact smartphones)
- `md`: `768px` (Tablets / Mobile-to-desktop boundary)
- `lg`: `1024px` (Laptops and compact desktop displays)
- `xl`: `1280px` (Desktop workstations)
- `2xl`: `1536px` (Ultra-wide displays)

## 2. Layout Shell Behavior

### Desktop (`>= 1024px`)
- `AppShell` renders persistent `AppSidebar` on the left.
- Top `AppHeader` displays current workspace branding, theme toggles, and user profile.
- Central work area occupies remaining viewport with clean gutters (`--spacing-6`).

### Tablet (`768px - 1023px`)
- `AppSidebar` collapses into icon-only mode or converts to drawer trigger depending on workspace context.
- Grid density shifts from multi-column to single/dual-column containers.

### Mobile (`< 768px`)
- `AppSidebar` is completely hidden.
- Header renders a hamburger menu button toggling `MobileDrawer`.
- Chat interface input floats fixed at bottom with viewport compensation for mobile virtual keyboards.
- Touch target minimum: `44px x 44px` for all interactive elements (WCAG 2.5.5).

