-- Create criteria_policy table for storing detailed policy manual content
CREATE TABLE IF NOT EXISTS criteria_policy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  criteria_id TEXT NOT NULL UNIQUE,
  policy_details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE criteria_policy ENABLE ROW LEVEL SECURITY;

-- Everyone can read policy details (public data)
CREATE POLICY "Anyone can read criteria policy"
  ON criteria_policy FOR SELECT
  USING (true);

-- Only authenticated users can update (for admin purposes)
CREATE POLICY "Authenticated users can update criteria policy"
  ON criteria_policy FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Insert default entries for all criteria
INSERT INTO criteria_policy (criteria_id, policy_details) VALUES
  ('awards', ''),
  ('membership', ''),
  ('press', ''),
  ('judging', ''),
  ('original_contribution', ''),
  ('scholarly_articles', ''),
  ('exhibitions', ''),
  ('leading_role', ''),
  ('high_salary', ''),
  ('commercial_success', '')
ON CONFLICT (criteria_id) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_criteria_policy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER criteria_policy_updated_at
  BEFORE UPDATE ON criteria_policy
  FOR EACH ROW
  EXECUTE FUNCTION update_criteria_policy_updated_at();
