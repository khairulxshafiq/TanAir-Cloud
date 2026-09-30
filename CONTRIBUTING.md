# Panduan Menyumbang (Contributing Guide) — TanAir Cloud

Selamat datang ke repositori **TanAir Cloud**. Dokumen ini menggariskan piawaian kualiti, tatakelola git, dan proses pembangunan untuk mengekalkan kebolehpercayaan, keselamatan, dan prestasi platform AI SaaS BM-first ini.

---

## 1. Prasyarat Pembangunan (Prerequisites)

- **Node.js**: `v22.x` (LTS — rujuk `.nvmrc`)
- **npm**: `v10.x` atau lebih baru
- **Git**: Versi terkini

### Persediaan Pantas (Quick Start)

```bash
# Gunakan versi Node yang disyorkan
nvm use

# Pasang dependensi secara tepat
npm ci

# Salin konfigurasi persekitaran
cp .env.example .env.local

# Mulakan pelayan pembangunan tempatan
npm run dev
```

---

## 2. Strategi Cabang & Aliran Kerja Git (Git Workflow)

TanAir mengamalkan model pembangunan berasaskan cabang terancang (**Trunk-Based Development with Phased Isolation**):

1. **`main`**: Cabang pengeluaran stabil. _Strictly protected_ — tiada _direct commit/push_ dibenarkan.
2. **`phase/<fasa>-<nama>`**: Cabang pelaksanaan fasa (cth. `phase/1b-devops-quality-foundation`, `phase/2-design-system-app-shell`).
3. **`feature/<nama-fitur>`**: Cabang ciri mikro yang diterbitkan dari fasa berkaitan.
4. **`hotfix/<isu>`**: Pembaikan kecemasan sekuriti/bug kritikal.

### Aliran Kerja Standard:

1. Pastikan cabang `main` tempatan adalah terkini (`git checkout main && git pull origin main`).
2. Cipta cabang baharu daripada `main`:
   ```bash
   git checkout -b feature/nama-ciri
   ```
3. Laksanakan perubahan dengan mematuhi prinsip atomik dan format Conventional Commits.
4. Jalankan pengesahan penuh kualiti tempatan (`npm run check`).
5. Tolak cabang ke GitHub dan buka Pull Request (PR) ke `main`.
6. Tunggu semakan pengasas (_founder review_) dan kelulusan CI Quality Gate sebelum di-merge.

---

## 3. Konvensyen Mesej Commit (Commit Conventions)

Kami mengikut piawaian **Conventional Commits**:

| Jenis      | Kegunaan                                       | Contoh                                       |
| :--------- | :--------------------------------------------- | :------------------------------------------- |
| `feat`     | Ciri atau keupayaan baharu untuk pengguna      | `feat(auth): add session expiry banner`      |
| `fix`      | Pembaikan pepijat (_bug fix_)                  | `fix(chat): handle empty stream termination` |
| `docs`     | Perubahan atau penambahan dokumentasi          | `docs(adr): add ADR-0016 for memory schema`  |
| `refactor` | Pengubahsuaian kod tanpa mengubah tingkah laku | `refactor(ui): extract Modal primitive`      |
| `test`     | Penambahan atau pembaikan ujian unit/integrasi | `test(security): add payload boundary tests` |
| `chore`    | Penyelenggaraan konfigurasi, dependensi, CI/CD | `chore(ci): add coverage reporting step`     |

---

## 4. Perintah Kualiti Tempatan (Quality Verification Scripts)

Sebelum membuat commit atau membuka PR, pastikan semua semakan berikut lulus:

```bash
# Semak format kod (Prettier)
npm run format:check

# Format semula fail secara automatik
npm run format

# Semakan statik kod (ESLint)
npm run lint

# Semakan jenis TypeScript
npm run typecheck

# Ujian unit & sekuriti dengan liputan (Vitest)
npm run test:coverage

# Ujian binaan pengeluaran Next.js
npm run build

# PINTASAN: Menjalankan semua semakan di atas serentak
npm run check
```

---

## 5. Piawaian Keselamatan & Privasi (Security & Privacy Standards)

- **Sifar Rahsia:** Jangan sesekali commit token, kunci API, atau kata laluan. Pastikan `.env*` kekal dalam `.gitignore`.
- **Pengasingan Boundary:** Komponen pelayan (_server-only_) dilarang keras dibocorkan ke pelayar (_client_). Rujuk `lib/security/`.
- **Bahasa Melayu Pertama:** Semua ralat pengguna, teks antaramuka, dan interaksi luaran mestilah didahulukan dalam Bahasa Melayu asli yang mesra dan profesional.

---

## 6. Definisi Selesai (Definition of Done — DoD)

Sebuah PR hanya dianggap selesai apabila:

- [ ] Lulus semua ujian unit dan integrasi (`npm run test:coverage`).
- [ ] TypeScript typecheck sifar ralat (`npm run typecheck`).
- [ ] ESLint sifar ralat dan sifar amaran (`npm run lint`).
- [ ] Prettier formatting bersih (`npm run format:check`).
- [ ] Production build berjaya dikompilasi (`npm run build`).
- [ ] Lulus CI pipeline di GitHub Actions.
- [ ] Dilengkapi dokumentasi atau pengemaskinian ADR jika melibatkan perubahan arkitektur.
- [ ] Disemak dan diluluskan oleh Pengasas/Lead Architect.
