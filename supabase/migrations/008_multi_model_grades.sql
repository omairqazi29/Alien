-- Migration: Update ai_grades to support multiple model grades
-- The new format stores an array of model grades in JSONB

-- Add the new grades column (JSONB array)
ALTER TABLE ai_grades ADD COLUMN IF NOT EXISTS grades JSONB DEFAULT '[]';

-- Migrate existing data: convert old single grade to new format
UPDATE ai_grades
SET grades = jsonb_build_array(
  jsonb_build_object(
    'model', 'legacy',
    'modelName', 'Legacy Grade',
    'grade', grade,
    'score', score,
    'feedback', COALESCE(feedback, ''),
    'suggestions', COALESCE(suggestions, ARRAY[]::TEXT[])
  )
)
WHERE grades = '[]' AND grade IS NOT NULL;

-- Drop the old columns (keeping them for now as backup, can be removed later)
-- ALTER TABLE ai_grades DROP COLUMN grade;
-- ALTER TABLE ai_grades DROP COLUMN score;
-- ALTER TABLE ai_grades DROP COLUMN feedback;
-- ALTER TABLE ai_grades DROP COLUMN suggestions;
