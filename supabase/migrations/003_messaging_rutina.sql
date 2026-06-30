-- Rutina: fecha de vencimiento propia
ALTER TABLE public.alumnos
  ADD COLUMN IF NOT EXISTS rutina_fecha_vencimiento DATE;

-- Mensajes: admin puede responder
ALTER TABLE public.mensajes
  ADD COLUMN IF NOT EXISTS respuesta TEXT,
  ADD COLUMN IF NOT EXISTS respondido_at TIMESTAMPTZ;

-- Mensajes admin → alumno (iniciados por el profe)
CREATE TABLE IF NOT EXISTS public.mensajes_admin (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id  UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  cuerpo     TEXT NOT NULL,
  leido      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mensajes_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mensajes_admin_select_own"
  ON public.mensajes_admin FOR SELECT TO authenticated
  USING (auth.uid() = alumno_id);

CREATE POLICY "mensajes_admin_update_own"
  ON public.mensajes_admin FOR UPDATE TO authenticated
  USING (auth.uid() = alumno_id);

CREATE POLICY "mensajes_admin_all_service_role"
  ON public.mensajes_admin FOR ALL TO service_role USING (true);
