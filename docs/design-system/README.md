# TanAir Design System

## Overview
The TanAir Design System is an accessible, token-driven, BM-first design system tailored for solopreneurs in Malaysia and Southeast Asia. It blends modern enterprise minimalism with subtle Malaysian heritage cues—specifically Royal Malay Purple and Songket Gold accents.

## Core Pillars
1. **Semantic Token Hierarchy**: Complete decoupling of design decisions from CSS markup using `--color-*`, `--spacing-*`, `--radius-*`, `--font-*`, and `--motion-*` tokens.
2. **Three-Tier Theme Architecture**: Native Light, Dark, and System theme resolution with zero flash-of-unauthenticated/unstyled-content (FOUC) using a synchronous inline script.
3. **WCAG 2.1 AA Compliance**: Contrast ratios >= 4.5:1 for normal text and >= 3:1 for large text/interactive borders. Native keyboard navigability, focus trapping, ESC listeners, and ARIA primitives.
4. **Resilient Shell System**: Responsive layout shells (`PublicShell`, `AppShell`, `MobileDrawer`, `AppSidebar`, `AppHeader`, `SkipLink`) supporting desktop, tablet, and mobile workflows.
5. **Standardized Primitives & Feedback**: Consistent button, form, overlay, and feedback states (`Button`, `Input`, `Badge`, `Avatar`, `Modal`, `Drawer`, `Toast`, `Skeleton`, `EmptyState`).

## Architecture & Documents
- [Tokens Specification](./tokens.md)
- [Theme Engine & Switching](./themes.md)
- [Component Architecture](./components.md)
- [Accessibility Compliance & Remediation](./accessibility.md)
- [Responsive Design Strategy](./responsive.md)
- [Chat Migration Guide](./migration.md)

