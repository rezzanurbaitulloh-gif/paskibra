# PLAN — Perombakan Tema "Paskibra Indonesia" (Satria Cengkara)

> **STATUS: SELESAI** — 2026-08-17. Semua step tereksekusi; 14/14 test hijau; build EXIT=0; tsc 0; lint tidak bertambah (49 error pre-existing). Screenshot: /tmp/opencode/final-home-{light,dark,mobile}.png.

> Alur: **Plan → TDD → Implementasi**. Dokumen ini = fase PLAN (gate 1).
> Semua langkah memiliki verifikasi & kriteria keluar; setiap step berdiri sendiri (cold-start).
> Invariants lintas-step: TIDAK mengubah rute, nama komponen/prop, skema DB, API, atau auth.
> Rollback tiap step: `git checkout` file yang disentuh step tersebut (murni token/visual).

## 0. Temuan Riset (bukti dari repo)

### Warna logo (diekstrak programatik dari PNG)
| Aset | Warna dominan |
|---|---|
| `public/logo.png` (favicon, 500×500) | Putih 61%, hitam 3%, **biru indigo tua `#010281`** (saturasi tertinggi: `#010281`/`#010183`) |
| `public/logo-icon.png` + `school-logo.png` | Cyan `#2191d0` 24–25%, hijau `#6fbf44` — logo sekolah (SMKN 1 Kertosono) |
| `public/icons/icon-512x512.png` | Putih 59% + hitam + biru `#010281` (salinan logo) |

**Kesimpulan: warna utama brand = BIRU INDIGO `#010281`** (kontras dgn putih ≈ 16.4:1 — sangat kuat). Emas = aksen Paskibra Indonesia (identitas nasional merah-putih-emas). Cyan `#2191d0` = sekunder dari logo sekolah.

### Tema saat ini (globals.css)
- Primary MERAH `#dc2626`, secondary biru `#2563eb`, accent kuning `#d97706`, bg slate `#f8fafc`.
- Font: Plus Jakarta Sans (display & body sama). Layout memuat 6 font (PJS, Inter, Poppins, Montserrat, Lato, DM Sans) — boros.
- Radius 0.75rem, efek glass + glow-red + grid.
- `manifest.json`: theme_color `#dc2626`; `layout.tsx` metadata theme-color `#0f172a`.

### Infrastruktur
- Next.js 15 + Tailwind v4 (`@import "tailwindcss"`, `@theme inline` tokens di globals.css).
- Playwright terpasang (devDep) tapi BELUM ada config/tests/script `test` di package.json.
- 17 halaman (publik: /, /galeri, /layanan, /lomba, /pengurus, /saran, /login; admin: dashboard + CRUD + keuangan + users).
- Semua halaman sudah responsif (commit e2a9570, audit 6 lebar bersih) — regresi ini WAJIB dipertahankan.

## 0b. TEMUAN KRITIS (adversarial review, dari inspeksi repo)

1. **`ThemeColorSync` meng-override token dari DB**: `site_settings.colors` (KV) saat ini
   `{"primary":"#E53935","secondary":"#1E88E5","accent":"#FFD700","background":"#0A0A0C","foreground":"#0f172a"}`
   di-set via `root.style.setProperty("--primary", ...)` setiap render → **mengalahkan globals.css di sisi klien**.
   → Step 1 WAJIB juga meng-update row `colors` di Supabase (service role) ke palet baru, kalau tidak tema tetap merah.
2. `branding.fontDisplay` di DB = "plus-jakarta" (belum ditemukan konsumennya di tsx; `font-display` class memakai token CSS v4). Cek saat Step 1; jika ada konsumen, set "bebas-neue".
3. Warna merah/hijau SEMANTIS yang HARUS DIKECUALIKAN (jangan diubah): `finance-chart.tsx` `#22c55e`/`#ef4444` (pemasukan/pengeluaran), login error `text-red-400`, destructive. Green/red = makna semantik, bukan brand.
4. `font-display` class SUDAH dipakai luas (Hero, SectionHeader, navbar, timeline, bento, members, gallery) → ganti token `--font-display` saja sudah mengubah semua heading; komponen tidak perlu disentuh untuk font.
5. Belum ada `playwright.config.*` → Step 0 harus membuatnya (terverifikasi: tidak ada).
6. Recharts bar memakai `var(--color-inc)`/`var(--color-exp)` (hex di definisi chart config) — bukan CSS var tema → tetap hijau/merah semantik. `hsl(var(--muted))` untuk cursor sudah token-safe.

## 1. Design System Target (dari ui-ux-pro-max + logo)

**Style:** Accessible & Ethical (gov/education/public) + Bold Statement (Bebas Neue display).
**Warna (light):**
- `--primary: #010281` (exact dari logo) — tombol, aktif, ring. Putih di atasnya kontras 16.4:1.
- `--primary-hover: #1b2a99` (turunan logo).
- `--secondary: #2191d0` (cyan dari logo sekolah) — link, info.
- `--accent: #b8860b`→ disetel `#a16207` (emas "Satria") — highlight, gradasi, badge.
- Background `#fafafa` (hangat), foreground `#0f172a`, card putih, muted `#f1f5f9`, border `#e2e8f0`.
- `--glow`, `--text-grad-a/b`, `--grid-color`, `--glass-*` → semua pindah ke biru/indigo.
**Warna (dark):** background navy-hitam `#0a0e1f`, card `#121a33`, primary `#6b7bff` (terang utk kontras), secondary cyan `#4db8e8`, accent emas `#e8b93a`, border `#23304f`.
**Tipografi:** Display **Bebas Neue** (all-caps, ceremonial/militer, utk hero & heading besar) + Body tetap **Plus Jakarta Sans**. Hapus pemuatan Inter/Poppins/Montserrat/Lato/DM_Sans dari layout (hemat ~5 font).
- `--font-display: "Bebas Neue", ...` → dipakai `font-display` di hero, section headers, navbar brand, angka statistik.
- Heading sedang (`text-3xl`+) → `font-display uppercase tracking-wide`; teks kecil/body tetap PJS.
**Aset visual:** logo.png (navbar/footer/admin sidebar/metadata), watermark-paskibra.jpg di hero; strip gradasi emas/biru; pola grid indigo halus.
**Radius:** pertahankan 0.75rem (sudah konsisten).
**manifest.json:** theme_color → `#010281`; `layout.tsx` theme-color → `#010281`.

## 2. Grafik Dependensi Step

```
Step 0 (harness TDD) ──► Step 1 (tokens) ──► Step 2 (publik) ──► Step 3 (admin) ──► Step 4 (regresi) ──► Step 5 (commit)
```

Serial (semua menyentuh token yang sama). Step 4 hanya fix, tidak menambah fitur.

---

## STEP 0 — Harness TDD + Test Merah (Gate: tsc OK)

**Context:** Proyek belum punya test suite. Playwright (devDep) tersedia. Strict TDD: tulis test DULU yang gagal pada tema lama (merah), lalu step 1–3 membuatnya hijau (biru).

**Task:**
1. Buat `playwright.config.ts` (baseURL `http://localhost:3000`, 1 worker, chromium only).
2. Buat `tests/` dengan spec:
   - `theme.spec.ts` — asersi CSS: `:root` `--primary` == `#010281` (gagal di tema merah); `--font-display` memuat "Bebas Neue" (gagal); manifest theme_color `#010281` (gagal).
   - `layout.spec.ts` — 17 halaman × lebar [320,360,390,768,1024,1440]: tidak ada horizontal overflow (`scrollWidth <= clientWidth`), tidak ada 4xx/5xx resource, tidak ada `pageerror`. (Harus LULUS sejak awal — baseline responsif.)
   - `functions.spec.ts` — smoke fungsional TANPA merombak: login diagadmin@test.local → buka /admin/dashboard, /admin/keuangan (chart ada `<svg>` recharts), CRUD galeri tampil, /galeri render kartu, /saran submit form valid. (LULUS sejak awal — bukti "tanpa memicu error fungsi".)
   - `contrast.spec.ts` — primary+white ≥ 4.5:1 (compute rel luminance via page.evaluate).
3. Tambah script `"test:e2e": "playwright test"` di package.json.
4. Jalankan → **MERAH di theme.spec + contrast.spec**, HIJAU di layout.spec + functions.spec (baseline sehat).

**Verifikasi:** `npx playwright test` → theme.spec FAIL, layout.spec PASS, functions.spec PASS.
**Exit:** harness jalan, tes merah-terbukti-merah.

## STEP 1 — Token Desain Inti (globals.css + layout.tsx + manifest)

**Context:** Semua komponen memakai token CSS var via `@theme inline`. Ganti nilai token = seluruh app ikut berubah tanpa menyentuh komponen.

**Task:**
1. `globals.css`: timpa blok `:root` & `.dark` dgn palet Step-1 (primary `#010281`, hover, secondary cyan, accent emas, glow/grid/grad biru; dark navy). Sesuaikan `::selection`, `--ring`, `--glow-*`, `--text-grad-*`, scrollbar thumb.
2. `layout.tsx`: tambah `Bebas_Neue` (weight 400, subsets latin, variable `--font-bebas`); HAPUS pemuatan Inter, Poppins, Montserrat, Lato, DM_Sans + variable class; metadata theme-color → `#010281`.
3. `globals.css` `@theme inline`: `--font-display: "Bebas Neue", var(--font-bebas), sans-serif`.
4. `public/manifest.json`: theme_color `#010281`, background_color `#fafafa`.
5. `src/components/theme-color-sync.tsx`: pastikan sync memakai `--primary`/tema baru (cek file).
6. **Supabase (service role)**: UPDATE `site_settings` KV `colors` →
   `{"primary":"#010281","secondary":"#2191d0","accent":"#a16207","background":"#fafafa","foreground":"#0f172a"}`
   (dark mode dikontrol `.dark` di CSS; `background` di DB hanya dipakai light). Cek konsumen `branding.fontDisplay`; set "bebas-neue" jika ada.

**Verifikasi:** `npx playwright test theme.spec` → HIJAU. `npm run build` OK. Screenshot `/` light+dark. Konfirmasi runtime: `getComputedStyle(root).getPropertyValue('--primary')` == `#010281` SETELAH ThemeColorSync jalan (ini yang tadinya di-override DB merah).
**Exit:** tokens hijau, build OK, halaman lain belum disentuh (auto ikut token).

## STEP 2 — Permukaan Publik (navbar, hero, footer, sections)

**Context:** Komponen publik memakai token lama secara literal (`bg-primary`, `text-accent`, kelas `font-display` belum ada). Ganti literal → token baru + font display.

**Task (per file, pola sama: ganti warna literal, aplikasikan `font-display` ke heading besar, pastikan `min-w-0` & responsivitas TIDAK berubah):**
1. `navbar.tsx` — brand (logo.png + nama), link aktif `bg-primary/10 text-primary`, glass navbar, tombol CTA primary.
2. `sections/HeroSection.tsx` — heading `font-display uppercase`, gradasi teks `text-grad-a/b`, badge emas, CTA primary, watermark-paskibra.jpg tetap.
3. `sections/SectionHeader.tsx` — judul `font-display`, aksen garis emas.
4. `sections/SchoolBentoGrid.tsx`, `HistoryTimeline.tsx`, `AchievementsGallery.tsx`, `StructureMembers.tsx`, `SaranTicker.tsx`, `FeedbackForm.tsx`, `RentalCatalog.tsx`, `Footer.tsx` — token + font display heading; konten/CRUD TIDAK berubah.
5. `animated-background.tsx` — glow merah → indigo/emas; grid tetap.

**Verifikasi:** `functions.spec` tetap HIJAU (fungsi utuh); `layout.spec` HIJAU (responsif utuh); `npx tsc --noEmit` 0 error; screenshot / di 390 & 1440.
**Exit:** semua spec hijau, tsc 0.

## STEP 3 — Permukaan Admin (sidebar, topbar, login, dashboard)

**Task:**
1. `components/dashboard/AdminSidebar.tsx` — logo.png, item aktif `bg-primary text-primary-foreground`, ikon lucide tetap.
2. `components/dashboard/AdminTopBar.tsx` — cari input (hidden lg:block PERTAHANKAN), avatar menu, tema token baru.
3. `app/login/page.tsx` — panel kiri/kartu login, CTA primary indigo.
4. `app/admin/dashboard/page.tsx` — kartu statistik, badge, chart colors (ambil dari CSS vars via getComputedStyle — cek `finance-chart.tsx`; pastikan warna batang/area mengikuti `--primary`/`--secondary`/`--accent`).
5. `components/ui/*` — hanya bila ada warna literal (verifikasi: grep `#dc2626|#2563eb|#d97706|red-|blue-|amber-` di components/ui; ganti dgn token).

**Verifikasi:** login smoke HIJAU (functions.spec), dashboard render chart, `layout.spec` admin halaman HIJAU, tsc 0, screenshot /admin/dashboard 390 & 768.
**Exit:** semua spec hijau.

## STEP 4 — Regresi Penuh & Poles (Gate: semua hijau)

**Task:**
1. `npx playwright test` FULL → semua hijau. Fix item menyimpang (hanya warna/typo).
2. `npm run build` (→ webpack, EXIT 0) + `npx tsc --noEmit` + `npm run lint`.
3. Sweep 17 halaman × 6 lebar ulang (layout.spec sudah mencakup) + tangkap screenshot light & dark: `/`, `/admin/dashboard`, `/galeri`, `/login`.
4. Cek `prefers-reduced-motion` & dark-mode toggle manual via Playwright (contrast.spec).
5. Hapus akun test diagadmin@test.local dari Supabase (service role).

**Verifikasi:** semua spec HIJAU, build EXIT 0, tsc 0, lint 0, 6 lebar bersih, dark mode kontras ≥4.5:1.
**Exit:** regresi bersih.

## STEP 5 — Commit & Push

**Task:** `git add -A && git commit` (pesan gaya repo: `style(paskibra): ...`) + push via token URL (origin tracking basi; pakai URL token seperti biasa). Update `plans/` dengan status SELESAI + ringkasan hasil.
**Verifikasi:** `git log --oneline -1` di GitHub API == HEAD lokal.
**Exit:** terdorong, Vercel (jika terhubung nanti) akan ambil.

---

## Anti-Pattern yang Dihindari
- Mengubah prop/struktur komponen demi estetika (risiko error fungsi) → dilarang; hanya token & class.
- Memuat semua 6 font → buang 5, sisakan PJS + Bebas Neue.
- Primary merah tetap di destructive (tombol hapus tetap merah = semantik).
- Menyentuh rute/API/skema DB → dilarang (invariant).
- Memakai emoji sebagai ikon → tetap lucide.