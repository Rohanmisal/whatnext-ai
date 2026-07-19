-- ============================================================
-- WhatNext — Supabase PostgreSQL Schema
-- Run this entire file in Supabase > SQL Editor
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

-- Public user profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id                 uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email              text NOT NULL,
  display_name       text,
  avatar_url         text,
  location           text,
  life_stage         text,
  preferred_language text DEFAULT 'English',
  created_at         timestamptz DEFAULT now() NOT NULL,
  updated_at         timestamptz DEFAULT now() NOT NULL
);

-- Per-user usage counters + subscription tier
CREATE TABLE IF NOT EXISTS public.user_usage (
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  subscription_tier     text DEFAULT 'explorer' NOT NULL
                          CHECK (subscription_tier IN ('explorer', 'navigator', 'guide')),
  analyses_this_month   int  DEFAULT 0 NOT NULL,
  chat_msgs_this_month  int  DEFAULT 0 NOT NULL,
  period_start          timestamptz DEFAULT date_trunc('month', now()) NOT NULL
);

-- Analysis sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category    text NOT NULL,
  situation   text NOT NULL,
  blockage    text NOT NULL,
  summary     text NOT NULL DEFAULT '',
  status      text DEFAULT 'in-progress' NOT NULL
                CHECK (status IN ('in-progress', 'completed', 'abandoned')),
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- AI-generated paths (3 per session: Easy / Medium / Advanced)
CREATE TABLE IF NOT EXISTS public.paths (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id      uuid REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  path_order      int  NOT NULL,  -- 1 = Easy, 2 = Medium, 3 = Advanced
  title           text NOT NULL,
  description     text NOT NULL DEFAULT '',
  difficulty      text NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Advanced')),
  time_estimate   text NOT NULL DEFAULT '',
  steps           jsonb NOT NULL DEFAULT '[]',
  why_it_works    text NOT NULL DEFAULT '',
  common_mistake  text NOT NULL DEFAULT '',
  tools           jsonb NOT NULL DEFAULT '[]',
  has_download    boolean DEFAULT false NOT NULL,
  recommended     boolean DEFAULT false NOT NULL
);

-- Step-level completion tracking
CREATE TABLE IF NOT EXISTS public.path_step_progress (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id       uuid REFERENCES public.paths(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step_index    int  NOT NULL,
  completed     boolean DEFAULT false NOT NULL,
  completed_at  timestamptz,
  UNIQUE (path_id, user_id, step_index)
);

-- Chat messages (one thread per session)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  uuid REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  path_id     uuid REFERENCES public.paths(id) ON DELETE SET NULL,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- Waitlist signups
CREATE TABLE IF NOT EXISTS public.waitlist (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email       text NOT NULL UNIQUE,
  plan        text NOT NULL DEFAULT 'navigator',
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- UPDATED_AT TRIGGER (reusable)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- NEW USER TRIGGER
-- Auto-creates users + user_usage rows when someone signs up
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url, life_stage, preferred_language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- MONTHLY USAGE RESET TRIGGER
-- Resets counters automatically when a new month starts
-- (fires on any update to user_usage row)
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_usage_if_new_month()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF date_trunc('month', now()) > NEW.period_start THEN
    NEW.analyses_this_month  := 0;
    NEW.chat_msgs_this_month := 0;
    NEW.period_start         := date_trunc('month', now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER check_usage_period
  BEFORE UPDATE ON public.user_usage
  FOR EACH ROW EXECUTE FUNCTION public.reset_usage_if_new_month();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paths              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_step_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist           ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_own"  ON public.users FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "users_update_own"  ON public.users FOR UPDATE  USING (auth.uid() = id);

-- user_usage
CREATE POLICY "usage_select_own"  ON public.user_usage FOR SELECT USING (auth.uid() = user_id);

-- sessions
CREATE POLICY "sessions_select_own" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);

-- paths (readable if the parent session belongs to the user)
CREATE POLICY "paths_select_own" ON public.paths FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = paths.session_id
        AND sessions.user_id = auth.uid()
    )
  );

-- path_step_progress
CREATE POLICY "steps_all_own" ON public.path_step_progress FOR ALL
  USING (auth.uid() = user_id);

-- chat_messages
CREATE POLICY "chat_select_own" ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = chat_messages.session_id
        AND sessions.user_id = auth.uid()
    )
  );

-- waitlist (insert-only, no read)
CREATE POLICY "waitlist_insert_anyone" ON public.waitlist FOR INSERT WITH CHECK (true);

-- ============================================================
-- HELPFUL INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sessions_user_id     ON public.sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paths_session_id      ON public.paths (session_id, path_order);
CREATE INDEX IF NOT EXISTS idx_chat_session_id       ON public.chat_messages (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_steps_path_user       ON public.path_step_progress (path_id, user_id);
