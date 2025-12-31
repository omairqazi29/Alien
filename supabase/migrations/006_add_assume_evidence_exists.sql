-- Add assume_evidence_exists column to profiles table
-- This stores a per-criteria toggle state for whether to assume evidence exists when grading

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS assume_evidence_exists jsonb DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN profiles.assume_evidence_exists IS 'JSON object mapping criteria_id to boolean - whether to assume evidence exists for AI grading';
