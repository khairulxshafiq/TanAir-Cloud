---
branch: main
files:
  - docs/project/06_TANAIR_DECISIONS_LOG.md
  - docs/project/05_TANAIR_PHASE_PLAN.md
author: TanAir (PA)
date: 2026-09-26
---

# UPDATE STATUS — 26Sep2026 (terkini dari boss Matrol & TanAir)

## Keputusan baru (boss approve)
1. VPS engine: Tencent Lighthouse **4vCPU/8GB/180G SSD @ $86.4/tahun (~RM30/bln)** — BELI pada FASA F2 sahaja, selepas interface deploy & auth siap. JANGAN beli awal.
2. Architecture engine: **SHARED engine + namespace per-user** (BUKAN container-per-user — terlalu berat utk 60-100 user). Rujuk ADR-0010 & ADR-0009.
3. Workload split: chat/coding/Excel-repair = VPS engine (CPU). **genImage = offload ke Replicate pay-per-use** (jangan run di VPS).
4. LLM provider user = opencode gateway (sama macam TanAir guna sekarang). User TAK pegang API key asal — metering central.
5. Pricing draft: Basic RM15/bln ≈ 3000 credits; Premium RM45/bln ≈ 12,000 credits. Kadar: chat 1K tok=1cr, genImage=20cr, Excel fail=5cr, AURA-Trade sesi=10cr. Monthly reset, tiada carry-forward.
6. Payment: candidate **ToyyibPay / Chip In** (FPX+QR, MY, fee rendah) — boss pilih sebelum F4.
7. Roll-out order WAJIB: credit metering + hard cutoff SIAP SEBELUM tester masuk. Beta = boss QA (TanAir gatekeeper F5) → 2-3 tester → kemudian public.

## Roadmap F0–F7 (perincian)
- F0: Deploy current repo skeleton ke Vercel (UI shell sahaja)
- F1: Auth + register/login via Supabase bind ke UI
- F2: Beli VPS $86.4 → deploy Hermes engine + multi-user namespace (TanAir + Luma)
- F3: Credit metering per-request + kuota tier + auto-cutoff + alert (WAJIB sebelum F6)
- F4: Payment FPX/QR (ToyyibPay atau Chip)
- F5: QA penuh oleh TanAir: UI/UX, topup flow, token habis cutoff, latency, spam-test
- F6: Beta 2-3 tester
- F7: Review kos LLM real usage → ikat pricing

## End-state disasarkan bila F5 siap
Boss boleh: login → topup FPX/QR → dapat token → chat/coding/Excel/genImage → auto-cutoff bila credit habis.
Kemudian capabiliti (AURA-Trade, scraping, dll) di-deploy sebagai manifest ke engine (refer: deploy script versioned, bukan "paste" manual).

## Keutamaan sekarang (untuk Antigravity)
1. F0 deploy Vercel — boleh mula TERUS, repo CI hijau.
2. F1 auth Supabase — sambung selepas F0.
3. Abaikan untuk sekarang: bot studio & tier features advance (Phase-3, select selepas billing siap).

— dihantar oleh TanAir, edit fail lain seperti biasa mengikut ADR & governance sedia ada.
