# Theme Architecture & Implementation

## 1. Objectives
- Zero Flash of Unstyled / Unauthenticated Content (FOUC) during initial load.
- Seamless synchronization with OS system preferences (`prefers-color-scheme: dark`).
- Manual override capability (`light`, `dark`, `system`) persisted in `localStorage`.
- Server-side rendering (SSR) compatibility with React 19 hydration safety.

## 2. Architecture
```
[HTML Head: theme-script.ts]
      │
      ├─ Reads localStorage('tanair-theme')
      ├─ Evaluates window.matchMedia('(prefers-color-scheme: dark)')
      └─ Mutates document.documentElement.dataset.theme ('light' | 'dark')
               │
               ▼
   [React Mount: ThemeProvider]
               │
               ├─ Initializes state lazily: useState(() => getStoredTheme())
               ├─ Subscribes to window.matchMedia changes (if system)
               └─ Provides ThemeContext: { theme, resolvedTheme, setTheme }
```

## 3. FOUC Elimination
The core anti-FOUC mechanism is defined in `lib/theme/theme-script.ts` and rendered synchronously in `app/layout.tsx`:
```tsx
<head>
  <script
    dangerouslySetInnerHTML={{
      __html: themeInitScript,
    }}
  />
</head>
```
Because this script executes synchronously before body rendering, the root `<html data-theme="...">` attribute is applied before first layout paint.

## 4. `useTheme` Hook API
```typescript
import { useTheme } from '@/lib/theme/useTheme';

export function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // theme: 'light' | 'dark' | 'system'
  // resolvedTheme: 'light' | 'dark'
  // setTheme: (theme: Theme) => void
}
```

## 5. UI Control (`ThemeToggle`)
The `ThemeToggle` component (`components/layout/ThemeToggle.tsx`) offers a 3-way toggle (Terang, Gelap, Sistem) with full ARIA attributes, keyboard support, and Malaysian Bahasa labels.

