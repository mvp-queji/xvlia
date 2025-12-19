
-- Create enum for photo status
CREATE TYPE public.photo_status AS ENUM ('pending', 'uploaded', 'failed');

-- Create table for event photos
CREATE TABLE public.event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumb_path TEXT,
  original_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  width INT,
  height INT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_event_photos_event_slug ON public.event_photos(event_slug);
CREATE INDEX idx_event_photos_created_at ON public.event_photos(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- Public can insert photos for lia-xv event (no auth required)
CREATE POLICY "Public can insert photos for lia-xv event"
ON public.event_photos
FOR INSERT
WITH CHECK (event_slug = 'lia-xv');

-- Public can view photos for lia-xv event
CREATE POLICY "Public can view photos for lia-xv event"
ON public.event_photos
FOR SELECT
USING (event_slug = 'lia-xv');

-- Create storage bucket for event photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-photos', 'event-photos', true);

-- Storage policies: public can upload to lia-xv folder
CREATE POLICY "Public can upload to lia-xv folder"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'event-photos' AND (storage.foldername(name))[1] = 'lia-xv');

-- Public can view event photos
CREATE POLICY "Public can view event photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-photos');

-- Enable realtime for event_photos
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_photos;

-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can insert their profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND is_admin = true
  )
$$;

-- Admin can select all photos
CREATE POLICY "Admins can select all photos"
ON public.event_photos
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admin can delete photos
CREATE POLICY "Admins can delete photos"
ON public.event_photos
FOR DELETE
USING (public.is_admin(auth.uid()));
