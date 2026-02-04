# Arxon Mining App - Self-Hosting Guide

This app is built for self-hosting with your own Supabase backend.

## Environment Variables

Set these in your hosting platform (Vercel, Netlify, etc.):

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Supabase Setup

### 1. Create Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User points table
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points NUMERIC DEFAULT 0,
  mining_points NUMERIC DEFAULT 0,
  task_points NUMERIC DEFAULT 0,
  social_points NUMERIC DEFAULT 0,
  referral_points NUMERIC DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mining sessions table
CREATE TABLE IF NOT EXISTS public.mining_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  arx_mined NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  credited_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_points
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own points" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for mining_sessions
CREATE POLICY "Users can view their own sessions" ON public.mining_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON public.mining_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.mining_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Function to increment points
CREATE OR REPLACE FUNCTION public.increment_user_points(p_user_id UUID, p_amount NUMERIC, p_type TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_points (user_id, total_points, mining_points)
  VALUES (p_user_id, p_amount, CASE WHEN p_type = 'mining' THEN p_amount ELSE 0 END)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_points.total_points + p_amount,
    mining_points = CASE WHEN p_type = 'mining' THEN user_points.mining_points + p_amount ELSE user_points.mining_points END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  INSERT INTO public.user_points (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Configure Auth

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: 
  - `https://your-domain.com/auth/confirm`
  - `https://your-domain.com/reset-password`

### 3. Deploy

1. Push to GitHub
2. Connect to Vercel/Netlify
3. Set environment variables
4. Deploy!

## Local Development

```bash
npm install
npm run dev
```

Create a `.env.local` file:
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
