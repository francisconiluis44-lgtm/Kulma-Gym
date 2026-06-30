-- Phase 2: Rutinas, Vencimiento, Comunicados, Comentarios, Mensajes

-- Add new columns to alumnos
ALTER TABLE public.alumnos
  ADD COLUMN IF NOT EXISTS rutina_url TEXT,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

-- Admin policy: allow admins (service role) to update alumnos
-- (service role bypasses RLS, no extra policy needed)

-- Comunicados (admin posts)
CREATE TABLE IF NOT EXISTS public.comunicados (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      TEXT NOT NULL,
  cuerpo      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comunicados_select_authenticated"
  ON public.comunicados FOR SELECT TO authenticated USING (true);

CREATE POLICY "comunicados_all_service_role"
  ON public.comunicados FOR ALL TO service_role USING (true);

-- Comentarios (student comments on comunicados)
CREATE TABLE IF NOT EXISTS public.comentarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id   UUID NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  alumno_id       UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  cuerpo          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comentarios_select_authenticated"
  ON public.comentarios FOR SELECT TO authenticated USING (true);

CREATE POLICY "comentarios_insert_own"
  ON public.comentarios FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = alumno_id);

CREATE POLICY "comentarios_delete_own"
  ON public.comentarios FOR DELETE TO authenticated
  USING (auth.uid() = alumno_id);

CREATE POLICY "comentarios_all_service_role"
  ON public.comentarios FOR ALL TO service_role USING (true);

-- Mensajes (student → admin private messages)
CREATE TABLE IF NOT EXISTS public.mensajes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id   UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  cuerpo      TEXT NOT NULL,
  leido       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mensajes_insert_own"
  ON public.mensajes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = alumno_id);

CREATE POLICY "mensajes_select_own"
  ON public.mensajes FOR SELECT TO authenticated
  USING (auth.uid() = alumno_id);

CREATE POLICY "mensajes_all_service_role"
  ON public.mensajes FOR ALL TO service_role USING (true);
