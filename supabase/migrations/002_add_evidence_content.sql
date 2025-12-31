-- Add markdown evidence content field to criteria tracking
-- This stores the full narrative evidence for each criterion (for AI grading)

-- Add evidence_content column to store markdown for each criteria
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS criteria_evidence JSONB DEFAULT '{}';

-- Structure: { "criterion_id": "markdown content", ... }
-- Example: { "original_contribution": "## Open Source Projects\n\n### Sentinel\n- 300 GitHub stars...", "press": "## TechBullion Article\n\n..." }

COMMENT ON COLUMN profiles.criteria_evidence IS 'Markdown evidence content per criterion for AI grading. Keys are criterion IDs, values are markdown strings.';
