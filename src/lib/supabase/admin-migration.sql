-- =============================================
-- ADMIN ROLE SYSTEM - Satria Cengkara
-- Jalankan di Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Tabel admin_users (siapa yang berhak jadi admin)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Fungsi is_admin() - cek apakah user yang login adalah admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Policy: hanya admin yang bisa baca tabel admin_users
CREATE POLICY "admin_read_admin_users" ON admin_users
  FOR SELECT USING (is_admin());

-- =============================================
-- PERBARUI RLS: tulis = hanya admin, baca = publik
-- =============================================

ALTER POLICY "admin_full_access" ON site_settings
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "admin_full_access" ON social_links
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "admin_full_access" ON structure_members
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "admin_full_access" ON gallery
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "admin_full_access" ON rentals
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "admin_full_access" ON financial_records
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "admin_full_access" ON inventory
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "admin_full_access" ON feedbacks
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "admin_full_access" ON articles
  USING (is_admin()) WITH CHECK (is_admin());

-- feedbacks: publik boleh INSERT (kotak saran), hanya admin yang baca
DROP POLICY IF EXISTS "public_read_feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "admin_full_access" ON feedbacks;
CREATE POLICY "public_insert_feedbacks" ON feedbacks
  FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read_feedbacks" ON feedbacks
  FOR SELECT USING (is_admin());
CREATE POLICY "admin_write_feedbacks" ON feedbacks
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =============================================
-- DAFTARKAN AKUN ADMIN (GANTI USER_ID!)
-- =============================================
-- Jalankan query di bawah SETELAH akun sc2026@gmail.com dibuat.
-- Ganti <USER_ID_AKUN_SC2026> dengan UUID user dari Authentication > Users.

-- SELECT id FROM auth.users WHERE email = 'sc2026@gmail.com';
-- INSERT INTO admin_users (user_id, role)
-- SELECT id, 'superadmin' FROM auth.users WHERE email = 'sc2026@gmail.com'
-- ON CONFLICT (user_id) DO NOTHING;