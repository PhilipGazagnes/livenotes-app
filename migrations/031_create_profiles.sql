-- Create profiles table extending auth.users with app-specific metadata

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  active_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent API-level changes to is_super_admin.
-- Allows changes from migrations (auth.uid() is NULL) and from existing super admins.
CREATE OR REPLACE FUNCTION public.prevent_super_admin_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_super_admin != OLD.is_super_admin THEN
    IF auth.uid() IS NOT NULL THEN
      IF NOT (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Only super admins can change the is_super_admin flag';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_super_admin_escalation
  BEFORE UPDATE OF is_super_admin ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_super_admin_escalation();

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Backfill existing users
INSERT INTO public.profiles (id, display_name)
SELECT id, split_part(email, '@', 1)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Set active_project_id to the user's earliest project (preserves existing state)
UPDATE public.profiles p
SET active_project_id = (
  SELECT id FROM public.projects
  WHERE owner_id = p.id
  ORDER BY created_at ASC
  LIMIT 1
);
