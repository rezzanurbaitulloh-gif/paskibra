-- ============================================================
-- SEED DATA DEMO - Satria Cengkara SMKN 1 Kertosono
-- Data sesuai konteks paskibra (bukan data random)
-- ============================================================

-- PENGURUS (struktur_members)
INSERT INTO structure_members (name, position, division, generation, photo_url) VALUES
  ('Kapten Rizky Aditya Pratama', 'Ketua Umum', 'BPH', 'Angkatan 24', NULL),
  ('Salsabila Nur Aini', 'Wakil Ketua', 'BPH', 'Angkatan 24', NULL),
  ('Dimas Arya Wicaksono', 'Sekretaris Umum', 'BPH', 'Angkatan 24', NULL),
  ('Nabila Zahra Ramadhani', 'Bendahara Umum', 'BPH', 'Angkatan 24', NULL),
  ('M. Fikri Al Hakim', 'Komandan Pleton (Danton)', 'Kedisiplinan', 'Angkatan 23', NULL),
  ('Ayu Lestari Puspita', 'Wakil Danton', 'Kedisiplinan', 'Angkatan 23', NULL),
  ('Bagas Wira Samudra', 'Koordinator LKBB', 'LKBB', 'Angkatan 23', NULL),
  ('Fitri Handayani', 'Koordinator Upacara', 'Protokoler', 'Angkatan 24', NULL),
  ('Rendy Saputra', 'Koordinator Humas', 'Humas', 'Angkatan 24', NULL),
  ('Putri Ayu Anggraini', 'Koordinator Konsumsi', 'Konsumsi', 'Angkatan 24', NULL),
  ('Aldi Firmansyah', 'Koordinator Perlengkapan', 'Perlengkapan', 'Angkatan 23', NULL),
  ('Vina Oktaviani', 'Anggota Aktif', 'Anggota', 'Angkatan 25', NULL)
ON CONFLICT DO NOTHING;

-- GALERI (foto demo lokal bertema paskibra)
INSERT INTO gallery (title, description, image_url, category, media_type, images) VALUES
  ('Upacara Hari Senin', 'Pengibaran bendera oleh pasukan Paskibra SMKN 1 Kertosono', '/images/upacara.svg', 'Kegiatan Lain', 'image', ARRAY['/images/pelantikan.svg','/images/pengukuhan.svg','/images/kegiatan.svg']),
  ('Latihan LKBB Intensif', 'Persiapan lomba LKBB tingkat kabupaten Nganjuk', '/images/lkbb.svg', 'LKBB', 'image', ARRAY['/images/latihan.svg','/images/kegiatan.svg']),
  ('Latihan Rutin Sabtu', 'Latihan baris-berbaris rutin di halaman sekolah', '/images/latihan.svg', 'Latihan Rutin', 'image', '{}'),
  ('Pelantikan Pengurus Baru', 'Pelantikan pengurus periode baru Satria Cengkara', '/images/pelantikan.svg', 'Pelantikan', 'image', ARRAY['/images/upacara.svg','/images/lkbb.svg']),
  ('Pengukuhan Anggota Baru', 'Pengukuhan anggota angkatan 25 Satria Cengkara', '/images/pengukuhan.svg', 'Pengukuhan', 'image', '{}'),
  ('Kegiatan Organisasi', 'Kegiatan kebersamaan dan pembinaan karakter anggota', '/images/kegiatan.svg', 'Kegiatan Lain', 'image', ARRAY['/images/latihan.svg'])
ON CONFLICT DO NOTHING;

-- KATALOG LAYANAN SEWA (inventory)
INSERT INTO inventory (name, description, price, stock, is_available, category, image_url) VALUES
  ('Baju PDL Paskibra', 'Pakaian Dinas Lapangan Paskibra lengkap dengan atribut, ukuran S-XXL. Cocok untuk upacara dan latihan.', 50000, 20, TRUE, 'Seragam', '/images/baju-pdl.svg'),
  ('Peci Paskibra', 'Peci hitam khas Paskibra dengan aksen merah, bahan nyaman untuk pemakaian lama.', 10000, 30, TRUE, 'Aksesoris', '/images/peci.svg'),
  ('Rompi Pelatih', 'Rompi khusus instruktur LKBB dengan kantong depan, warna merah Paskibra.', 15000, 10, TRUE, 'Perlengkapan', '/images/rompi.svg'),
  ('Sepatu PDH', 'Sepatu pakaian dinas harian warna hitam, ukuran 38-44, kondisi terawat.', 20000, 15, TRUE, 'Perlengkapan', '/images/sepatu.svg'),
  ('Topi Baret Merah', 'Baret merah khas Paskibra dengan emblem lencana emas.', 12000, 12, FALSE, 'Aksesoris', '/images/topi-baret.svg'),
  ('Bendera Merah Putih', 'Bendera upacara ukuran standar 200x300 cm, bahan berkualitas.', 25000, 8, TRUE, 'Perlengkapan', '/images/bendera.svg'),
  ('Ikat Pinggang PDL', 'Sabuk pengaman PDL warna hitam dengan gesper emas.', 5000, 25, TRUE, 'Aksesoris', '/images/ikat-pinggang.svg')
ON CONFLICT DO NOTHING;

-- KOTAK SARAN (3 sampel, 1 sudah dibalas admin)
INSERT INTO feedbacks (sender_name, message, admin_reply, replied_at) VALUES
  ('Andi Saputra', 'Latihan LKBBnya keren banget! Semoga bisa menang di lomba kabupaten.', 'Terima kasih atas dukungannya! Kami terus berlatih maksimal untuk mengharumkan SMKN 1 Kertosono.', NOW(), 'Pelatih'),
  ('Anonim', 'Tolong waktu latihan rutin bisa ditambah, biar anggota baru makin cepat bisa baris-berbaris.', NULL, NULL),
  ('Rina Wulandari', 'Jadwal penyewaan baju PDL sering bentrok. Mohon bisa dibooking lebih awal lewat website.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- KEUANGAN (contoh riwayat kas)
INSERT INTO financial_records (description, amount, type, category, date) VALUES
  ('Iuran anggota bulanan', 450000, 'income', 'Kas Rutin', '2026-07-05'),
  ('Pembelian konsumsi latihan', 120000, 'expense', 'Konsumsi', '2026-07-12'),
  ('Sewa baju PDL (5 set)', 250000, 'income', 'Lainnya', '2026-07-18'),
  ('Transportasi lomba LKBB Nganjuk', 350000, 'expense', 'Transportasi Lomba', '2026-07-25'),
  ('Pembelian sepatu PDH 2 pasang', 400000, 'expense', 'Pembelian Perlengkapan', '2026-07-30'),
  ('Donasi dari alumni', 300000, 'income', 'Donasi', '2026-08-02'),
  ('Print proposal kegiatan', 80000, 'expense', 'Proposal', '2026-08-08')
ON CONFLICT DO NOTHING;

SELECT 'seed selesai' AS status;
SQLEOF