-- Create exhibits table to track uploaded files
CREATE TABLE IF NOT EXISTS exhibits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  criteria_id TEXT NOT NULL,
  label TEXT NOT NULL, -- e.g., "A-1", "B-2"
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- path in storage bucket
  file_type TEXT NOT NULL, -- MIME type
  file_size INTEGER NOT NULL,
  extracted_text TEXT, -- text content extracted from PDF/images
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE exhibits ENABLE ROW LEVEL SECURITY;

-- Policies for exhibits
CREATE POLICY "Users can view own exhibits" ON exhibits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exhibits" ON exhibits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exhibits" ON exhibits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exhibits" ON exhibits
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER exhibits_updated_at
  BEFORE UPDATE ON exhibits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for performance
CREATE INDEX IF NOT EXISTS exhibits_user_criteria_idx ON exhibits(user_id, criteria_id);

-- Storage bucket for exhibits (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exhibits', 'exhibits', false);

-- Storage policies (run in Supabase dashboard)
-- CREATE POLICY "Users can upload own exhibits" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exhibits' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can view own exhibits" ON storage.objects FOR SELECT USING (bucket_id = 'exhibits' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own exhibits" ON storage.objects FOR DELETE USING (bucket_id = 'exhibits' AND auth.uid()::text = (storage.foldername(name))[1]);
