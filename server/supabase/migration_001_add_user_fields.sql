-- ============================================================
-- Migration 001 — Add preferred_language + avatar_url to users
-- Run this in Supabase SQL Editor if you already ran schema.sql
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS avatar_url         text;

-- Update the new-user trigger to also capture these fields from OAuth / signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url, life_stage, preferred_language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    NEW.raw_user_meta_data->>'avatar_url',     -- populated for Google OAuth
    NEW.raw_user_meta_data->>'life_stage',
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'English')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_usage (user_id, subscription_tier, period_start)
  VALUES (NEW.id, 'explorer', date_trunc('month', now()))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
