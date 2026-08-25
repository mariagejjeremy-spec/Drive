-- migrations/20260825_add_images_table.sql
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  url TEXT,
  mime TEXT,
  size INTEGER,
  upload_group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_images_owner ON images(owner_id);
CREATE INDEX IF NOT EXISTS idx_images_group ON images(upload_group_id);
