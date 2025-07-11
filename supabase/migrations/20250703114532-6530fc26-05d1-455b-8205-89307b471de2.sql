
-- Create bookmarks table to store user's saved links
CREATE TABLE public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  platform TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  textColor TEXT DEFAULT '#ffffff',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create policies for bookmarks
CREATE POLICY "Users can view their own bookmarks" 
  ON public.bookmarks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" 
  ON public.bookmarks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks" 
  ON public.bookmarks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
  ON public.bookmarks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for tags
CREATE POLICY "Users can view their own tags" 
  ON public.tags 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" 
  ON public.tags 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" 
  ON public.tags 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" 
  ON public.tags 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for bookmarks table
CREATE TRIGGER update_bookmarks_updated_at 
  BEFORE UPDATE ON public.bookmarks 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for tags table
CREATE TRIGGER update_tags_updated_at 
  BEFORE UPDATE ON public.tags 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
