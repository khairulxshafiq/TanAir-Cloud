# Dasar Keselamatan (Security Policy) — TanAir Cloud

Keselamatan dan privasi data pengguna adalah keutamaan mutlak dalam pembinaan platform AI SaaS TanAir Cloud. Dokumen ini menggariskan versi yang disokong, prosedur pelaporan kerentanan, dan kawalan keselamatan sedia ada.

---

## 1. Versi yang Disokong (Supported Versions)

Hanya versi terkini pada cabang `main` menerima kemas kini keselamatan dan tampalan (_security patches_):

| Versi / Cabang               | Disokong (_Supported_) |
| :--------------------------- | :--------------------- |
| `main` (Pengeluaran Terkini) | :white_check_mark: Ya  |
| Fasa Pembangunan (`phase/*`) | :white_check_mark: Ya  |
| Versi Arkib / Lama           | :x: Tidak              |

---

## 2. Melaporkan Kerentanan Keselamatan (Reporting a Vulnerability)

Sekiranya anda menemui sebarang isu keselamatan atau kerentanan, kami memohon anda mengamalkan **Pendedahan Bertanggungjawab (Responsible Disclosure)**:

1. **JANGAN** membuka isu awam (_public GitHub issue_) atau mendedahkan kelemahan di media sosial/forum awam.
2. Sila hantar laporan terperinci secara peribadi kepada pasukan sekuriti melalui emel:  
   **security@tanair.my** (atau terus kepada Pengasas).
3. Sertakan butiran berikut dalam laporan anda:
   - Deskripsi ringkas kerentanan dan impaknya.
   - Langkah demi langkah untuk menghasilkan semula isu (_step-by-step reproduction steps_).
   - Bukti konsep (_Proof of Concept / PoC_), cth: payload HTTP atau skrip ujian.
   - Cadangan mitigasi atau pembaikan (jika ada).

### Garis Masa Respons:

- **Pengesahan Awal:** Dalam masa 24 jam selepas laporan diterima.
- **Penilaian Impak & Triaj:** Dalam masa 48 jam.
- **Tampalan Keselamatan (_Hotfix_):** Bergantung kepada keterukan (Kritikal: < 24-48 jam).

---

## 3. Kawalan Keselamatan Utama (Key Security Controls)

TanAir Cloud telah mengintegrasikan pelbagai lapisan pertahanan mendalam (_defense-in-depth_):

1. **Autentikasi Pelayan Tegar (_Server-Side Auth Gate_):**
   - Semua panggilan ke endpoint sensitif seperti `/api/chat` diwajibkan memiliki sesi pengguna sah yang disahkan oleh Supabase Auth pada peringkat pelayan.
   - Identiti pengguna daripada klien (_client-supplied user IDs_) ditolak sepenuhnya.

2. **Pengesahan Input Pertahanan (_Defensive Input Validation_):**
   - Pengehadan saiz payload (maksimum 32KB).
   - Senarai putih (_allowlist_) ejen yang ketat (`Aura`, `Aura-Trade`, `Aura-Pen`, dsb.).
   - Penolakan format JSON tidak sah dan teks kosong dengan kod status HTTP 400.

3. **Kadar Pengehadan (_Rate Limiting_):**
   - Perlindungan anti-serangan DoS berasaskan tingkap gelongsor (_sliding-window rate limiting_) 20 permintaan setiap minit bagi setiap pengguna berautentikasi (HTTP 429).

4. **Pengasingan Sempadan Hermes (_Hermes Gateway Isolation_):**
   - Pelayan Hermes VPS terlindung di sebalik proksi Vercel. Pelayar klien tidak berhubung secara terus dengan IP pelayan VPS Hermes.
   - Protokol HTTP biasa ditolak dalam persekitaran pengeluaran; hanya sambungan TLS disulitkan dibenarkan.

5. **Sanitasi Log & Privasi (PDPA Compliance):**
   - Log pelayan menapis (_redact_) secara automatik sebarang kandungan mesej pengguna, kata laluan, token sesi, dan kunci API.
   - Setiap transaksi disertakan `x-request-id` unik bagi tujuan audit tanpa menjejaskan privasi data peribadi.

6. **Pembersihan Mesej Ralat (_Safe Error Disclosure_):**
   - Ralat sistem dalaman disanitasi sebelum dihantar kepada pengguna dalam Bahasa Melayu yang sopan, menghalang kebocoran _stack trace_ atau topologi pelayan.
