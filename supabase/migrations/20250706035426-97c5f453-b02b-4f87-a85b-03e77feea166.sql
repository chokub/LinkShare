
-- Add channel information columns to bookmarks table
ALTER TABLE public.bookmarks 
ADD COLUMN channel_name text,
ADD COLUMN channel_avatar text;
