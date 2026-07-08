-- ============================================================
-- SaaS Phase 4: Theming + Admin solicitudes
-- Run in: Supabase → SQL Editor
-- ============================================================

-- 1. Add theming columns to gimnasios
ALTER TABLE public.gimnasios
  ADD COLUMN IF NOT EXISTS color_primario TEXT DEFAULT '#0D1B3E',
  ADD COLUMN IF NOT EXISTS color_acento   TEXT DEFAULT '#F26419',
  ADD COLUMN IF NOT EXISTS logo_url       TEXT;

-- Backfill Kulma Gym with current brand colors
UPDATE public.gimnasios
SET color_primario = '#0D1B3E', color_acento = '#F26419'
WHERE slug = 'kulma-gym';

-- 2. solicitudes_admin: anyone can request admin access for a gym
CREATE TABLE IF NOT EXISTS public.solicitudes_admin (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT         NOT NULL,
  email        TEXT         NOT NULL,
  gimnasio_id  UUID         NOT NULL REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  estado       TEXT         NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'aprobado' | 'rechazado'
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.solicitudes_admin ENABLE ROW LEVEL SECURITY;

-- Public can insert (anyone can request access)
CREATE POLICY "solicitudes_insert_public"
  ON public.solicitudes_admin FOR INSERT
  WITH CHECK (true);

-- Only service role can read / update
CREATE POLICY "solicitudes_all_service_role"
  ON public.solicitudes_admin FOR ALL TO service_role USING (true);
