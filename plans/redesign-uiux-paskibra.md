# Blueprint Redesign UI/UX — Situs Paskibra SMK (satriacengkara.vercel.app)

Tanggal: 2026-08-22 · Mode: direct (tanpa branch) · Basis bukti: audit terprogram Playwright @390px/1440px + bedah kode token desain.

## Temuan (berperingkat)

| # | Severitas | Temuan | Bukti |
|---|-----------|--------|-------|
| F1 | CRITICAL | Tabel admin overflow di mobile | @390px: anggota→657px, keuangan→657px, inventaris→720px, galeri→703px (viewport 390px) |
| F2 | HIGH | Identitas warna generik + token berantakan | Navy #010281+emas = template-an; var bernama `--glow-red`, `.text-gradient-red`, `.shadow-glow-red` isi BIRU; hex hardcode di `.gradient-primary` bypass token |
| F3 | HIGH | Tap target di bawah standar | CTA home h=32px, chip filter h=34px, **quick-link dashboard h=16px** (standar ≥44px) |
| F4 | MEDIUM | Tipografi mikro | 33 elemen <11px di home, 36 di admin-dash; `text-xs` 21× dalam 1 halaman |
| F5 | MEDIUM | Overload dekorasi hero | `min-h-screen` + 9 pemakaian gradient/glow/blur; anti-pattern "decorative blobs" |
| F6 | LOW | Dashboard admin tanpa hierarki | 11 Card identik setara; radius nested tidak konsentris |

Sudah baik (pertahankan): `focus-visible` ring, `prefers-reduced-motion`, `tabular-nums`, dark mode penuh, scrollbar styling.

## Arah desain (frontend-design-direction)

- **Purpose**: situs organisasi prestasi + tool internal harian.
- **Tone**: disiplin-formal khas pasukan, hangat nasionalis.
- **Memorable detail**: identitas **Merah Putih** — merah bendera (`#B91C1C`) sebagai aksi/aksen, putih-kertas sebagai kanvas, navy gelap hanya untuk teks/kontras. Emas dipertahankan sebagai penghargaan/prestasi saja.
- **Anti**: ungu/biru template, blob dekoratif, kartu-dalam-kartu.

## Langkah konstruksi

### Step 1 — Refresh token warna & bersih-bersih token (fondasi)
**Brief konteks**: semua warna lewat CSS vars di `src/app/globals.css`; Tailwind v4 `@theme inline`. Jangan sentuh komponen.
- [ ] Tambah token merah: `--brand-red: #b91c1c` (light) / `#ef4444` (dark), map ke `--accent`.
- [ ] Ganti nama variabel menyesatkan: `--glow-red`→`--glow-brand`, hapus `.text-gradient-red`/`.shadow-glow-red` lama atau isi ulang sesuai nama.
- [ ] Pindahkan hex hardcode `.gradient-primary` & gradient utilitas ke var.
**Verifikasi**: `npx tsc --noEmit && npm run build`; grep tak ada lagi hex liar di utilities.
**Exit**: token tunggal sumber kebenaran; visual tak rusak.
**Commit**: `design: refresh token warna + akar merah putih`

### Step 2 — Mobile-first tabel admin (F1)
**Brief**: pola render ganda — `<div className="hidden md:block">tabel</div>` + `<div className="md:hidden">card list</div>`. Data sudah tersedia di state masing-masing halaman.
- [ ] `admin/pengurus`: card list (nama+avatar inisial, posisi/divisi chip, aksi ikon ≥44px).
- [ ] `admin/keuangan`: card list (deskripsi, nominal tabular, badge income/expense, tanggal).
- [ ] `admin/inventaris` & `admin/galeri`: card list serupa.
- [ ] `import-modal` preview: biarkan scroll-x tapi tambahkan hint "geser →".
**Verifikasi**: audit Playwright 390px → `table` rect.right ≤ 402 di semua halaman tsb.
**Exit**: nol overflow tabel @360/390/430px.
**Commit**: `fix(mobile): card list menggantikan tabel di layar sempit`

### Step 3 — Tap target ≥44px (F3)
**Brief**: utilitas `ui/button` size sm/default dinaikkan tinggi minimumnya di breakpoint mobile; chip filter `h-9`→`h-11 md:h-9`; quick-link dashboard dari `text-xs h-4` jadi baris penuh `min-h-[48px]`.
**Verifikasi**: audit `smallTaps` kosong untuk semua halaman.
**Exit**: semua elemen interaktif ≥44px @<768px.
**Commit**: `a11y: tap target minimal 44px di mobile`

### Step 4 — Skala tipografi (F4)
**Brief**: `text-xs` hanya untuk label/meta sungguhan (eyebrow, timestamp); body informasi naik `text-sm`. Angka penting (saldo, jumlah) pakai `text-base`+ `tabular-nums`.
**Verifikasi**: audit `tinyText` turun >70%.
**Commit**: `ui: skala tipografi mobile-readable`

### Step 5 — Dekorasi hero & hierarki dashboard (F5+F6)
**Brief**: hero — pangkas ≥5 layer dekoratif, sisakan 1 motif bermakna (pita diagonal merah-putih tipis / grid halus); jaga kontras. Dashboard — 2 kartu hero besar (Saldo Kas, Total Anggota) dengan angka raksasa display-font, sisanya grid 2 kolom ringkas.
**Verifikasi**: build lolos; review visual user (screenshot sebelum/sesudah).
**Commit**: `design: hero fokus + hierarki dashboard`

### Step 6 — QA akhir & rilis
- [ ] Audit Playwright lengkap 360/390/1440px: hscroll=false, taps ok, tinyText rendah.
- [ ] `npx tsc --noEmit && npm run build` hijau; push → deploy Vercel sukses.
- [ ] Hard-refresh check oleh user (service worker).

## Invarian lintas langkah
1. Tak ada fitur yang hilang — hanya presentasi.
2. Setiap step 1 commit atomik → revert aman.
3. Kontras teks ≥4.5:1 di kedua tema setelah pergantian warna.
4. `npx tsc --noEmit` hijau di akhir tiap step.
