-- Add GitHub integration fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_repos JSONB DEFAULT '[]';

-- Add comments
COMMENT ON COLUMN profiles.github_username IS 'Connected GitHub username';
COMMENT ON COLUMN profiles.github_repos IS 'Array of connected repos with tracking config';
