# 00 — Read Me First

# TanAir Cloud Documentation Pack

Version: 1.0  
Status: Active — executed via phases  
Document owner: Khairul Shafiq (Founder), TanAir by Norliv Labs  
Last updated: 2026-09-20

---

## Tujuan Folder Ini

Folder ini ialah sumber rujukan utama bagi pembangunan TanAir Cloud.

Dokumen ini disediakan supaya:

- Founder boleh menetapkan hala tuju produk dengan jelas.
- Antigravity boleh mengaudit sistem sebelum menulis kod.
- AI agent baharu boleh memahami projek tanpa meneka.
- Developer dan DevOps boleh mengubah sistem dengan selamat.
- Keputusan seni bina mempunyai justifikasi.
- Pembangunan boleh dilakukan secara berfasa.
- Audit keselamatan dan teknikal menjadi lebih mudah.
- Migrasi daripada prototaip kepada Supabase boleh dirancang.
- Scope creep dan refactor yang tidak perlu dapat dielakkan.

Dokumen ini tidak menggantikan source code, migrations, tests atau runbook operasi.

---

## Urutan Bacaan Wajib

Semua AI agent, developer, DevOps engineer dan auditor mesti membaca fail dalam urutan berikut:

1. `00_READ_ME_FIRST.md`
2. `01_TANAIR_PROJECT_INPUT.md`
3. `02_TANAIR_ENDSTATE_VISION.md`
4. `03_TANAIR_BRAND_VOICE.md`
5. `04_TANAIR_MASTER_BLUEPRINT.md`
6. `05_TANAIR_PHASE_PLAN.md`
7. `06_TANAIR_DECISIONS_LOG.md`
8. `08_TANAIR_DEFINITION_OF_DONE.md` (redirect stub -> baca 02)

Selepas itu, baca:

1. `README.md` repository
2. `CONTRIBUTING.md`
3. Dokumen architecture
4. Architecture Decision Records
5. Risk register
6. Feature README yang berkaitan
7. Deployment dan operations runbook

---

## Dokumen Yang Perlu Diisi Founder

Founder perlu melengkapkan:

`01_TANAIR_PROJECT_INPUT.md`

Jangan membuat andaian terhadap maklumat yang masih ditandakan:

`[ISI]`

Sekiranya sesuatu keputusan belum dibuat, gunakan:

`[BELUM DIPUTUSKAN]`

Sekiranya sesuatu perkara tidak berkaitan, gunakan:

`[TIDAK BERKENAAN]`

Jangan mengisi maklumat sensitif seperti:

- Kata laluan
- Production API key
- Supabase service-role key
- Telegram bot token
- Billplz secret
- Payment credential
- Private signing key
- Database password
- Recovery code

Gunakan nama environment variable atau lokasi secret manager sahaja.

Contoh:

```text
Telegram Token:
Disimpan sebagai TELEGRAM_BOT_TOKEN dalam secret manager.
```

---

## Status Autoriti Dokumen

Jika berlaku percanggahan, gunakan keutamaan berikut:

1. Keputusan terbaharu yang berstatus `Accepted` dalam Decisions Log
2. Project Input yang disahkan founder
3. End-State Vision
4. Master Blueprint
5. Phase Plan
6. Implementasi semasa

Jika source code bercanggah dengan keputusan produk, jangan ubah secara senyap.

Buka finding atau Architecture Decision Record dahulu.

---

## Peraturan Perubahan

Setiap perubahan penting mesti menyatakan:

- Apa yang berubah
- Mengapa ia berubah
- Fail yang terjejas
- Risiko
- Impak migrasi
- Impak keselamatan
- Impak UX
- Cara menguji
- Cara rollback
- Keputusan founder jika diperlukan

---

## Prinsip Pelaksanaan

TanAir mesti dibangunkan dengan aliran:

```text
Discover
↓
Audit
↓
Decide
↓
Design
↓
Implement
↓
Test
↓
Document
↓
Review
↓
Release
```

Jangan gunakan aliran:

```text
Terus bina semua feature
↓
Baiki architecture kemudian
```

---

## Arahan Permulaan Kepada Antigravity

Gunakan arahan berikut:

```text
Baca semua dokumen di dalam /docs/project mengikut urutan yang
ditetapkan dalam 00_READ_ME_FIRST.md.

Status semasa: Phase 0A/0B/0C + Phase 1A SIAP (PR #1 merged ke main).
Phase 1B preflight dah siap, tunggu founder approval untuk bermula.

Arahan semasa:
- Jalankan Phase 1B: DevOps & Quality Foundation (ikut
  docs/implementation/phase-1b-preflight.md).
- MUST-DO items dalam Phase 1B: CI workflow (npm run check),
  .nvmrc Node 22, prettier + coverage scripts, tanaman remediation
  P17 (Supabase hardcoded fallback URL) and P20 (staging vs
  production Supabase environment separation).
- Numbering rule: gunakan roadmap dari 01_TANAIR_PROJECT_INPUT.md
  (Phase 2 = Private Alpha). Design System phase dalam 05 phase plan
  dirujuk sebagai "Phase 1C" supaya tiada konflik nombor.
- One phase at a time. Berhenti dan tunggu arahan founder selepas
  setiap phase gate.
```

---

## Hasil Akhir Yang Dikehendaki

Developer atau AI agent baharu sepatutnya dapat memahami perkara berikut tanpa meneka:

- Apa itu TanAir
- Siapa pengguna sasaran
- Bagaimana pengalaman pengguna perlu dirasakan
- Apakah identiti visual TanAir
- Bagaimana Aura bercakap
- Apakah capability Hermes
- Apakah perbezaan Free, Trial Pro, Pro dan Empire
- Bagaimana codebase distrukturkan
- Bagaimana keselamatan dikendalikan
- Bagaimana module diuji
- Bagaimana perubahan dibuat
- Bagaimana sistem dimigrasikan
- Bagaimana deployment dan rollback dijalankan

