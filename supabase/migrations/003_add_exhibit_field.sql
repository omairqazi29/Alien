-- Add exhibit field to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS exhibit TEXT;

-- Add comment
COMMENT ON COLUMN tasks.exhibit IS 'Exhibit reference for petition (e.g., A-1, B-2)';
