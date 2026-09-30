# Design Token Architecture

## 1. Token Structure
TanAir tokens are partitioned into logical CSS files located in `styles/tokens/`:
- `styles/tokens/primitives.css`: Raw color palettes (Royal Malay Purple, Songket Gold, slate neutrals, semantic feedback scales), base radii, shadows, z-indices.
- `styles/tokens/themes.css`: Semantic mappings for light and dark modes (`--bg-primary`, `--bg-elevated`, `--text-primary`, `--border-subtle`, `--accent-primary`, etc.).
- `styles/tokens/spacing.css`: 8px-based spatial system (`--spacing-1` = 4px, `--spacing-2` = 8px ... `--spacing-16` = 64px).
- `styles/tokens/typography.css`: Type scale (`--font-size-xs` to `--font-size-4xl`), font families (`--aura-font-sans`, `--aura-font-mono`), font weights, and line heights.
- `styles/tokens/motion.css`: Durations (`--aura-duration-fast`, `--aura-duration-normal`, `--aura-duration-slow`) and easings (`--aura-ease-default`, `--aura-ease-in-out`).

## 2. Color Palette & Cues
- **Primary Brand**: Royal Malay Purple (`--aura-purple-600` / `#7c3aed`, `--accent-primary`)
- **Accent**: Songket Gold (`--aura-gold-500` / `#f59e0b`, `--accent-premium`)
- **Success**: Emerald Green (`--aura-success-500` / `#10b981`)
- **Warning**: Amber (`--aura-warning-500` / `#f59e0b`)
- **Danger**: Ruby Crimson / Rose (`--aura-danger-500` / `#f43f5e`)
- **Info**: Sapphire / Cyan (`--aura-info-500` / `#06b6d4`)

## 3. Contrast Ratios & WCAG 2.1 AA Compliance
| Semantic Token | Light Mode Value | Dark Mode Value | Context / Contrast |
| :--- | :--- | :--- | :--- |
| `--bg-primary` | `#f8fafc` (Slate 50) | `#0b0f19` (Neutral 900) | Root page background |
| `--bg-elevated` | `#ffffff` (Pure White) | `#111827` (Neutral 850) | Card & container surface |
| `--text-primary` | `#0f172a` (Slate 900) | `#f1f5f9` (Neutral 100) | Primary body text (>= 12:1 ratio) |
| `--text-secondary` | `#475569` (Slate 600) | `#94a3b8` (Neutral 400) | Secondary text (>= 4.5:1 ratio) |
| `--border-subtle` | `rgba(15, 23, 42, 0.08)` | `rgba(255, 255, 255, 0.08)` | Subtle container borders |
| `--border-strong` | `rgba(15, 23, 42, 0.16)` | `rgba(255, 255, 255, 0.16)` | Interactive element borders (>= 3:1) |
| `--accent-primary` | `#7c3aed` (Purple 600) | `#8b5cf6` (Purple 500) | Brand CTA, focus rings |

## 4. Usage Guidelines
Direct hex codes and arbitrary Tailwind numbers (e.g. `bg-zinc-900`, `text-gray-100`) are deprecated in favor of semantic CSS variable classes or token properties.
Example:
```css
.card {
  background-color: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--aura-radius-lg);
  padding: var(--spacing-4);
}
```

