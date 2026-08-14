-- ============================================================
-- PRD MIGRATION v2 - Satria Cengkara
-- Kotak saran + balasan admin, inventaris/katalog sewa, multi-role
-- ============================================================

-- 1. FEEDBACKS: kolom balasan admin + sender_name
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS sender_name TEXT DEFAULT 'Anonim';
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS admin_reply TEXT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS replied_by UUID;
UPDATE feedbacks SET sender_name = COALESCE(name, 'Anonim') WHERE sender_name IS NULL;

-- 2. INVENTORY: kolom katalog layanan/sewa
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS image_url TEXT;
UPDATE inventory SET slug = 'item-' || id WHERE slug IS NULL;

-- 3. ADMIN_USERS: multi-role (super_admin / pembina / bendahara / humas / sarpras)
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('super_admin', 'pembina', 'bendahara', 'humas', 'sarpras'));
UPDATE admin_users SET role = CASE WHEN role = 'superadmin' THEN 'super_admin' ELSE 'super_admin' END WHERE role IN ('admin', 'superadmin');
ALTER TABLE admin_users ALTER COLUMN role SET DEFAULT 'super_admin';
UPDATE admin_users SET role = 'super_admin' WHERE role NOT IN ('super_admin', 'pembina', 'bendahara', 'humas', 'sarpras');

-- 4. Fungsi role helper
CREATE OR REPLACE FUNCTION user_role()
RETURNS TEXT AS $$
  SELECT role FROM admin_users WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Galeri: dukung video embed
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video_embed'));
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS embed_code TEXT;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS video_url TEXT;
