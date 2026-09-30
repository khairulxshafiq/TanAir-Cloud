# Phase 2 Implementation Plan
## Design System and Application Shell — TanAir Cloud

**Dokumen:** `docs/implementation/phase-2-plan.md`  
**Fasa:** Phase 2 (Design System and Application Shell)  
**Cabang:** `phase/2-design-system-app-shell`  
**Commit Pangkalan (Base Commit):** `17bad65` (`main` — selepas merge PR #2)  
**Pengarang:** Lead Design Systems Architect, Senior Frontend Engineer, Accessibility Engineer  
**Tarikh:** 2026-09-20  

---

## 1. Ringkasan & Skop (Scope)

Misi Fasa 2 adalah untuk membina asas visual dan interaksi yang boleh diguna semula (**reusable visual & interaction foundation**) bagi TanAir Cloud berlandaskan identiti jenama BM-first, kebolehcapaian (accessibility WCAG 2.1 AA), dan reka bentuk responsif (mobile-first 320px - 1440px).

### A. Skop Dilaksanakan (In-Scope):
1. **Sistem Token Reka Bentuk Semantik (Semantic Design Tokens):**
   - Warna primitif & semantik: Ungu Melayu Diraja (`#7C3AED` - `#4C1D95`), Emas Songket Premium (`#F59E0B` - `#D97706`), Neutral Gelap & Neutral Cerah, Maklum Balas (Success, Warning, Danger, Info).
   - Skala tipografi (Inter + JetBrains Mono fallback).
   - Grid susun atur 8px, jejari (*radius*), bayang-bayang (*elevation shadows*), dan pemalar pergerakan (*motion constants*).
2. **Sistem Pengurusan Tema Asli (Native Theme Controller):**
   - Mod Gelap (`dark`), Mod Cerah (`light`), dan Mod Sistem (`system`).
   - Pencegahan kelipan tema (*Flash of Unstyled Content / FOUC*) melalui skrip *inline blocking* pada `app/layout.tsx`.
   - Penyimpanan pilihan selamat dalam `localStorage` (`aura_theme`).
   - Komponen suis tema (`ThemeToggle`) dengan sokongan papan kekunci & label aksesibiliti.
3. **Komponen Primitif UI Boleh Diakses (`components/ui/`):**
   - `Button`, `IconButton`, `Input`, `Textarea`, `Badge`, `Avatar`, `Progress`, `Divider`.
4. **Komponen Maklum Balas (`components/feedback/`):**
   - `Toast` (pemberitahuan langsung ARIA `role="status"` / `role="alert"`), `Alert`, `Skeleton`, `EmptyState`.
5. **Komponen Lapisan Atas (`components/overlays/`):**
   - `Modal`, `Drawer` (dengan *focus trapping*, kekunci Escape, dan kunci skrol latar belakang), `Tooltip`.
6. **Kerangka Antaramuka (`components/layout/`):**
   - `PublicShell` (Header awam, pautan langkau kandungan *SkipLink*, slot tema).
   - `AppShell` (Sidebar desktop, AppHeader padat, laci navigasi mudah alih *MobileDrawer*, kawasan sembang responsif).
7. **Migrasi Berperingkat Visual Sembang Semasa:**
   - Memelihara 100% logik perniagaan, autentikasi Supabase, dan adapter Hermes Fasa 1A.
   - Menggantikan kelas CSS tegar (*hardcoded*) kepada token semantik secara bersih.

---

## 2. Skop Dikecualikan Secara Tegar (Strict Out-of-Scope)

Fasa 2 **TIDAK** melaksanakan:
- Teras Aura 3D (*Three.js / crystal neural core*) — ditangguhkan ke Fasa 3 dengan pemuatan malas (*lazy load*).
- Halaman pendaratan penuh (*Landing Page*) & sembang demo awam.
- Aliran *Onboarding*, pengurusan profil penuh, dan logik konteks pengguna.
- Enjin ingatan AI (*User Context Memory*).
- Sistem percubaan Pro 3-hari (*Trial Engine*) dan pengiraan baki kuota (*Quota Top-up*).
- Bot Studio / Pembina Bot Kustom.
- Papan Pemuka Pentadbir (*SaaS Admin Dashboard*).
- Penyambung luaran (*Telegram/WhatsApp Connectors*).
- Migrasi skema pangkalan data Supabase.
- Penulisan semula keseluruhan `app/page.tsx` secara mendadak.

---

## 3. Rujukan Inventori UI Semasa (`app/page.tsx`)

Berdasarkan audit pre-flight (`docs/implementation/phase-2-preflight.md`), terdapat 21 elemen visual monolitik yang akan dipindahkan kepada komponen modular:
1. Shell Header & Jenama TanAir
2. Butang Log Masuk / Profil Pengguna
3. Pemilih Ejen AI (6 ejen: Aura, Aura-Trade, Aura-Pen, Aura-Image, Aura-Video, Aura-CFO)
4. Lencana Status Ejen (Badge)
5. Kotak Mesej Perbualan (Chat Bubble Pengguna vs Pembantu)
6. Penunjuk Taip / Penstriman (Streaming Indicator)
7. Komposer Input Mesej & Butang Hantar
8. Panel Muat Naik Lampiran & Butang Tindakan
9. Bar Navigasi Sisi Mudah Alih

---

## 4. Arkitektur Sasaran & Struktur Direktori Baharu

```text
tanair-cloud/
├── app/
│   ├── globals.css                ← Import token semantik & gaya asas
│   └── layout.tsx                 ← Skrip tema inline blocking & pembekal tema
├── components/
│   ├── ui/                        ← Komponen Primitif Bebas-Konteks
│   │   ├── Button.tsx
│   │   ├── IconButton.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Progress.tsx
│   │   └── Divider.tsx
│   ├── feedback/                  ← Maklum Balas Pengguna
│   │   ├── Toast.tsx
│   │   ├── Alert.tsx
│   │   ├── Skeleton.tsx
│   │   └── EmptyState.tsx
│   ├── overlays/                  ← Dialog, Laci & Petua Alat
│   │   ├── Modal.tsx
│   │   ├── Drawer.tsx
│   │   └── Tooltip.tsx
│   └── layout/                    ← Kerangka Shell Aplikasi
│       ├── SkipLink.tsx
│       ├── ThemeToggle.tsx
│       ├── AppHeader.tsx
│       ├── AppSidebar.tsx
│       ├── MobileDrawer.tsx
│       ├── AppShell.tsx
│       └── PublicShell.tsx
├── lib/
│   └── theme/                     ← Pengawal Tema (Hook & Utiliti)
│       ├── ThemeProvider.tsx
│       └── useTheme.ts
├── styles/
│   └── tokens/                    ← Skema Token Reka Bentuk CSS
│       ├── primitives.css
│       ├── semantics.css
│       ├── typography.css
│       ├── spacing.css
│       └── motion.css
└── tests/
    └── ui/                        ← Suite Ujian Komponen & Kebolehcapaian
        ├── theme.test.ts
        ├── primitives.test.ts
        └── overlays.test.ts
```

---

## 5. Pelan Kawalan Dependensi (Zero Heavy Frameworks)

- **Keputusan:** Tiada pustaka UI pihak ketiga berat (seperti MUI, Chakra, AntD, Radix Suite penuh).
- **Alasan:** Mengekalkan saiz bundle ringan, masa muat pantas, serta memastikan kawalan penuh terhadap kebolehcapaian dwibahasa dan estetika BM-first.
- **Ikonografi:** Mengekalkan pustaka `lucide-react` sedia ada (`^1.47.0`).
- **Styling:** CSS Variables semantik + Tailwind CSS v4 sedia ada.

---

## 6. Urutan Komit & Pelaksanaan Berperingkat

1. `docs(phase-2): add implementation plan`
2. `feat(tokens): add semantic design tokens for light, dark, and typography`
3. `feat(theme): add native theme controller and ThemeToggle`
4. `feat(ui): add accessible primitive components (Button, Input, Badge, etc.)`
5. `feat(feedback): add Toast, Alert, Skeleton, and EmptyState`
6. `feat(overlays): add Modal, Drawer, and Tooltip with focus trap`
7. `feat(layout): add PublicShell, AppShell, AppHeader, and MobileDrawer`
8. `refactor(chat): migrate visual structure of app/page.tsx to design system tokens`
9. `test(ui): add component and theme unit tests`
10. `docs(design-system): add design system guide and completion report`

---

## 7. Strategi Pengesahan & Quality Gate Fasa 2

Setiap fasa komit mesti disahkan melalui:
```bash
npm run check
```
Memastikan:
- Prettier: 100% bersih tanpa amaran.
- ESLint: Sifar ralat dan sifar amaran.
- TypeScript: Sifar ralat kompilasi.
- Vitest: Kesemua 32 ujian keselamatan Fasa 1A melepasi + ujian baharu komponen.
- Next.js Build: Berjaya dikompilasi ke pengeluaran.
- Responsif: Melepasi paparan 320px, 375px, 768px, dan 1440px.

---

## 8. Pelan Pengunduran (Rollback Strategy)

Sekiranya berlaku sebarang kegagalan integrasi:
- Kembalikan cabang ke commit pangkalan `17bad65`.
- Tiada perubahan skema pangkalan data atau API luaran yang terlibat dalam fasa ini, menjadikan proses pengunduran 100% bebas risiko terhadap data pengeluaran.

