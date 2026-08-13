-- ============================================================
-- SATRIA CENGKARA - SETUP ADMIN LENGKAP (JALANKAN SEKALI)
-- 1) Buat sistem admin (admin_users + is_admin)
-- 2) Buat akun admin sc2026@gmail.com
-- 3) Daftarkan akun tsb sebagai SUPERADMIN
-- ============================================================

-- ---------- 1. SISTEM ADMIN ----------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE POLICY "admin_read_admin_users" ON public.admin_users
  FOR SELECT USING (public.is_admin());

-- ---------- 2. BUAT AKUN ADMIN ----------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'sc2026@gmail.com',
  crypt('Saceng1!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(), NOW(),
  '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'sc2026@gmail.com'
);

-- ---------- 3. DAFTARKAN SEBAGAI SUPERADMIN ----------
INSERT INTO public.admin_users (user_id, role)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'sc2026@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ---------- 4. PERBARUI RLS SEMUA TABEL (tulis = admin saja) ----------
ALTER POLICY "admin_full_access" ON public.site_settings USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "admin_full_access" ON public.social_links USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "admin_full_access" ON public.structure_members USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "admin_full_access" ON public.gallery USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "admin_full_access" ON public.rentals USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "admin_full_access" ON public.financial_records USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "admin_full_access" ON public.inventory USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "admin_full_access" ON public.articles USING (public.is_admin()) WITH CHECK (public.is_admin());

-- feedbacks: publik boleh kirim saran, hanya admin yang bisa baca
DROP POLICY IF EXISTS "public_read_feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "admin_full_access" ON public.feedbacks;
CREATE POLICY "public_insert_feedbacks" ON public.feedbacks FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read_feedbacks" ON public.feedbacks FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_write_feedbacks" ON public.feedbacks FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- VERIFIKASI ----------
SELECT u.email, au.role, au.created_at
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id;