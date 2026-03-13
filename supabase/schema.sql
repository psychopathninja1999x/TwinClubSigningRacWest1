-- Run this SQL in your Supabase project (SQL Editor) to set up the tables.

-- Signing rooms: one per collaborative session
CREATE TABLE IF NOT EXISTS signing_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_url TEXT,
  document_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Per-page signature overlays (one row per page per room)
CREATE TABLE IF NOT EXISTS signing_page_overlays (
  room_id UUID NOT NULL REFERENCES signing_rooms(id) ON DELETE CASCADE,
  page_num INTEGER NOT NULL,
  data_url TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (room_id, page_num)
);

-- Enable Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE signing_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE signing_page_overlays;

-- RLS: Allow anonymous read/write for simplicity (use stricter RLS for production)
ALTER TABLE signing_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_page_overlays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on signing_rooms" ON signing_rooms
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on signing_page_overlays" ON signing_page_overlays
  FOR ALL USING (true) WITH CHECK (true);

-- Storage: Create bucket "documents" in Supabase Dashboard first:
--   Storage > New bucket > name "documents", make it Public
-- Then run these policies (drop first to avoid duplicates):

DROP POLICY IF EXISTS "Public read documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow update documents" ON storage.objects;

CREATE POLICY "Public read documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Allow upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow update documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents');
