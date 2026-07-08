-- ============================================================
-- SaaS Phase 1: Multi-tenant foundation
-- Run in: Supabase → SQL Editor
-- ============================================================
-- Creates:
--   gimnasios       → one row per gym
--   gym_admins      → links admin users to their gym
-- Adds gimnasio_id to: alumnos, comunicados, mensajes, mensajes_admin
-- Backfills all existing data to Kulma Gym (fixed UUID below)
-- Updates trigger so new alumnos inherit gimnasio_id from metadata
-- ============================================================

-- 1. gimnasios table
CREATE TABLE IF NOT EXISTS public.gimnasios (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT         NOT NULL,
  slug        TEXT         NOT NULL UNIQUE,
  plan        TEXT         NOT NULL DEFAULT 'basico', -- 'basico' | 'pro'
  activo      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gimnasios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gimnasios_select_authenticated"
  ON public.gimnasios FOR SELECT TO authenticated USING (true);

CREATE POLICY "gimnasios_all_service_role"
  ON public.gimnasios FOR ALL TO service_role USING (true);

-- 2. Insert Kulma Gym as first tenant (fixed UUID for stable backfill)
INSERT INTO public.gimnasios (id, nombre, slug, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Kulma Gym', 'kulma-gym', 'pro')
ON CONFLICT (id) DO NOTHING;

-- 3. gym_admins table: links users to gyms as admins
CREATE TABLE IF NOT EXISTS public.gym_admins (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gimnasio_id  UUID         NOT NULL REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, gimnasio_id)
);

ALTER TABLE public.gym_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_admins_select_own"
  ON public.gym_admins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "gym_admins_all_service_role"
  ON public.gym_admins FOR ALL TO service_role USING (true);

-- 4. Register existing admins (anyone without @kulmagym.app email) as Kulma Gym admin
INSERT INTO public.gym_admins (user_id, gimnasio_id)
SELECT id, '00000000-0000-0000-0000-000000000001'
FROM auth.users
WHERE email NOT LIKE '%@kulmagym.app'
  AND email IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. Add gimnasio_id to alumnos
ALTER TABLE public.alumnos
  ADD COLUMN IF NOT EXISTS gimnasio_id UUID REFERENCES public.gimnasios(id);

UPDATE public.alumnos
SET gimnasio_id = '00000000-0000-0000-0000-000000000001'
WHERE gimnasio_id IS NULL;

-- 6. Add gimnasio_id to comunicados
ALTER TABLE public.comunicados
  ADD COLUMN IF NOT EXISTS gimnasio_id UUID REFERENCES public.gimnasios(id);

UPDATE public.comunicados
SET gimnasio_id = '00000000-0000-0000-0000-000000000001'
WHERE gimnasio_id IS NULL;

-- 7. Add gimnasio_id to mensajes
ALTER TABLE public.mensajes
  ADD COLUMN IF NOT EXISTS gimnasio_id UUID REFERENCES public.gimnasios(id);

UPDATE public.mensajes
SET gimnasio_id = '00000000-0000-0000-0000-000000000001'
WHERE gimnasio_id IS NULL;

-- 8. Add gimnasio_id to mensajes_admin
ALTER TABLE public.mensajes_admin
  ADD COLUMN IF NOT EXISTS gimnasio_id UUID REFERENCES public.gimnasios(id);

UPDATE public.mensajes_admin
SET gimnasio_id = '00000000-0000-0000-0000-000000000001'
WHERE gimnasio_id IS NULL;

-- 9. Update trigger: new alumnos inherit gimnasio_id from registration metadata
CREATE OR REPLACE FUNCTION public.handle_new_alumno()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gimnasio_id UUID;
BEGIN
  IF NEW.email LIKE '%@kulmagym.app' THEN
    v_gimnasio_id := COALESCE(
      (NEW.raw_user_meta_data ->> 'gimnasio_id')::UUID,
      '00000000-0000-0000-0000-000000000001'
    );

    INSERT INTO public.alumnos (
      id, nombre_completo, dni, whatsapp, email, fecha_nacimiento, gimnasio_id
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data ->> 'nombre_completo',
      NEW.raw_user_meta_data ->> 'dni',
      NEW.raw_user_meta_data ->> 'whatsapp',
      NULLIF(NEW.raw_user_meta_data ->> 'email', ''),
      CASE
        WHEN COALESCE(NEW.raw_user_meta_data ->> 'fecha_nacimiento', '') = ''
          THEN NULL
        ELSE (NEW.raw_user_meta_data ->> 'fecha_nacimiento')::DATE
      END,
      v_gimnasio_id
    );
  END IF;
  RETURN NEW;
END;
$$;
