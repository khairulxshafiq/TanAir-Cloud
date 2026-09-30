# Pelan Perlindungan Cabang (Branch Protection Plan) — TanAir Cloud

**Dokumen:** `docs/operations/branch-protection-plan.md`  
**Fasa:** Phase 1B (DevOps and Quality Foundation)  
**Sasaran:** Repositori GitHub `khairulxshafiq/TanAir-Cloud`  
**Tarikh:** 2026-09-20  
**Pengarang:** Lead Senior DevOps Engineer & Platform Architect  

---

## 1. Pengenalan & Matlamat

Bagi melindungi kestabilan, keselamatan, dan integriti kod pengeluaran TanAir Cloud, cabang `main` mesti dilindungi dengan peraturan perlindungan cabang (**GitHub Branch Protection Rules**) yang ketat. Ini memastikan tiada perubahan yang tidak diuji atau tidak disahkan boleh dimasukkan secara langsung ke dalam pengeluaran.

---

## 2. Peraturan Perlindungan untuk Cabang `main` (Recommended Ruleset)

Sila konfigurasikan tetapan berikut dalam GitHub:  
**Repository Settings → Branches → Add branch ruleset / Branch protection rule**  
**Branch name pattern:** `main`

### A. Keperluan Pull Request (Pull Request Requirements)
* [x] **Require a pull request before merging**
  * Memastikan tiada `git push origin main` secara langsung dibenarkan oleh mana-mana pembangun, termasuk pentadbir (*administrators*).
* [x] **Require approvals:** Minimum `1` approval (Pengasas / Lead Architect).
* [x] **Dismiss stale pull request approvals when new commits are pushed:** Memastikan sebarang commit baharu pada PR memerlukan semakan semula.
* [x] **Require review from Code Owners:** Pilihan (jika fail `CODEOWNERS` diaktifkan kelak).

### B. Keperluan Status Checks CI (Required Status Checks)
* [x] **Require status checks to pass before merging**
  * Status check wajib melepasi: **`Quality Gate & Security Checks`** (daripada `.github/workflows/ci.yml`).
  * Check ini merangkumi:
    1. Prettier Formatting (`npm run format:check`)
    2. ESLint Static Analysis (`npm run lint`)
    3. TypeScript Compilation (`npm run typecheck`)
    4. Vitest Security Tests & Coverage (`npm run test:coverage`)
    5. Next.js Production Build (`npm run build`)
* [x] **Require branches to be up to date before merging**
  * Memastikan kod PR diuji terhadap commit terkini `main` sebelum di-merge bagi mengelakkan regresi senyap (*silent regressions*).

### C. Integriti & Sejarah Git (History & Integrity Controls)
* [x] **Require linear history** (atau pilih Merge Commit standard): Memastikan graf git bersih dan mudah diaudit.
* [x] **Do not allow bypassing the above settings:** Pentadbir repositori juga tertakluk kepada peraturan ini bagi menjamin integriti tatakelola (Governance Enforcement).
* [x] **Block force pushes:** Menghalang sebarang `git push --force` ke atas `main` yang berpotensi memadam sejarah commit.
* [x] **Block deletions:** Menghalang pemadaman cabang `main` secara tidak sengaja.

---

## 3. Konvensyen Penamaan Cabang (Branch Naming Conventions)

Semua pembangun dan ejen AI dikehendaki mematuhi format penamaan cabang berikut:

| Corak Cabang | Tujuan | Contoh |
| :--- | :--- | :--- |
| `main` | Kod pengeluaran stabil (hanya dikemas kini melalui PR) | `main` |
| `phase/<nombor>-<nama>` | Cabang pelaksanaan fasa utama | `phase/1b-devops-quality-foundation`, `phase/2-design-system-app-shell` |
| `feature/<nama-fitur>` | Cabang ciri spesifik yang disasarkan ke fasa | `feature/auth-modal`, `feature/gold-tokens` |
| `fix/<nama-isu>` | Pembaikan pepijat standard | `fix/chat-stream-timeout` |
| `hotfix/<nama-isu>` | Pembaikan kecemasan terus ke pengeluaran | `hotfix/tls-certificate-expiry` |

---

## 4. Prosedur Penggabungan (Merge Procedure)

1. Pastikan semua semakan CI hijau (:white_check_mark:).
2. Dapatkan ulasan dan kelulusan rasmi daripada Pengasas.
3. Gunakan kaedah **Merge Pull Request** (Create a merge commit) atau **Squash and merge** bergantung kepada skop fasa:
   - Fasa besar (`phase/*`): **Create a merge commit** (mengekalkan sejarah atomik fasa).
   - Fitur kecil (`feature/*`): **Squash and merge** (sejarah kemas satu commit).
4. Padamkan cabang sumber (*delete branch*) selepas berjaya di-merge untuk mengekalkan kebersihan repositori.

