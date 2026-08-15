-- Create tables for Satria Cengkara Paskibra

-- site_settings: Store dynamic site configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- social_links: Store social media links
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- structure_members: Store BPH and division members
CREATE TABLE IF NOT EXISTS structure_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  division TEXT NOT NULL,
  generation TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE structure_members ADD COLUMN IF NOT EXISTS kelas TEXT;

-- gallery: Store images for achievements and events
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gallery ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS embed_code TEXT;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

-- rentals: Store rental items and services
CREATE TABLE IF NOT EXISTS rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- financial_records: Store income and expense records
CREATE TABLE IF NOT EXISTS financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- inventory: Store inventory items
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- feedbacks: Store user feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  message TEXT NOT NULL,
  likes INT NOT NULL DEFAULT 0,
  dislikes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- articles: Store articles and blog posts
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE structure_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (read-only)
CREATE POLICY "public_read_site_settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "public_read_social_links" ON social_links
  FOR SELECT USING (true);

CREATE POLICY "public_read_structure_members" ON structure_members
  FOR SELECT USING (true);

CREATE POLICY "public_read_gallery" ON gallery
  FOR SELECT USING (true);

CREATE POLICY "public_read_rentals" ON rentals
  FOR SELECT USING (true);

CREATE POLICY "public_read_feedbacks" ON feedbacks
  FOR SELECT USING (true);

CREATE POLICY "public_read_inventory" ON inventory
  FOR SELECT USING (true);

-- Public like/dislike voting (safe: only increments counters)
CREATE OR REPLACE FUNCTION public.vote_feedback(p_id uuid, p_vote text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_vote = 'like' THEN
    UPDATE feedbacks SET likes = likes + 1, updated_at = now() WHERE id = p_id;
  ELSIF p_vote = 'dislike' THEN
    UPDATE feedbacks SET dislikes = dislikes + 1, updated_at = now() WHERE id = p_id;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.vote_feedback(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vote_feedback(uuid, text) TO anon, authenticated;

CREATE POLICY "public_read_articles" ON articles
  FOR SELECT USING (true);

-- Create policies for authenticated users (admin)
CREATE POLICY "admin_full_access" ON site_settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_full_access" ON social_links
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_full_access" ON structure_members
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_full_access" ON gallery
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_full_access" ON rentals
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_full_access" ON financial_records
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_full_access" ON inventory
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_full_access" ON feedbacks
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_full_access" ON articles
  FOR ALL USING (auth.role() = 'authenticated');

-- lkbb_participants: Peserta pendaftaran lomba/LKBB
CREATE TABLE IF NOT EXISTS lkbb_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL,
  contact TEXT DEFAULT '',
  category TEXT DEFAULT '',
  payment_status TEXT NOT NULL DEFAULT 'belum',
  amount NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE lkbb_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_lkbb" ON lkbb_participants
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- lkbb_updates: Pembaruan/berita perkembangan lomba
CREATE TABLE IF NOT EXISTS lkbb_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE lkbb_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_lkbb_updates" ON lkbb_updates
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- lkbb_documents: Dokumen lomba (juknis, formulir, dll.)
CREATE TABLE IF NOT EXISTS lkbb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE lkbb_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_lkbb_documents" ON lkbb_documents
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;