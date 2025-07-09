
-- Add new columns to bookmarks table for AI features
ALTER TABLE public.bookmarks 
ADD COLUMN ai_summary TEXT,
ADD COLUMN suggested_tags TEXT[] DEFAULT '{}',
ADD COLUMN user_description TEXT;

-- Update existing description to user_description for existing records
UPDATE public.bookmarks 
SET user_description = description 
WHERE user_description IS NULL;
