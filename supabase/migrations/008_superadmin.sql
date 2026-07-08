-- ============================================================
-- SaaS Phase 3: Superadmin table
-- Run in: Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.superadmins (
  user_id    UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmins_select_own"
  ON public.superadmins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "superadmins_all_service_role"
  ON public.superadmins FOR ALL TO service_role USING (true);

-- Insert current owner (anyone not @kulmagym.app)
INSERT INTO public.superadmins (user_id)
SELECT id FROM auth.users
WHERE email NOT LIKE '%@kulmagym.app'
  AND email IS NOT NULL
ON CONFLICT DO NOTHING;
