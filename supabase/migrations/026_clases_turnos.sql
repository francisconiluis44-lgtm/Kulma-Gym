-- ============================================================
-- 026: Clases y turnos
-- Autocontenido. Para revertir:
--   DROP TABLE IF EXISTS public.reservas CASCADE;
--   DROP TABLE IF EXISTS public.clases CASCADE;
--   DROP FUNCTION IF EXISTS public.reservar_clase;
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clases (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id   UUID          NOT NULL REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  titulo        TEXT          NOT NULL DEFAULT 'Clase',
  descripcion   TEXT,
  instructor    TEXT,
  fecha_hora    TIMESTAMPTZ   NOT NULL,
  duracion_min  INTEGER       NOT NULL DEFAULT 60,
  capacidad_max INTEGER       NOT NULL DEFAULT 20,
  cancelada     BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clases_service_role"
  ON public.clases FOR ALL TO service_role USING (true);

CREATE INDEX IF NOT EXISTS idx_clases_gimnasio_fecha
  ON public.clases (gimnasio_id, fecha_hora);

CREATE TABLE IF NOT EXISTS public.reservas (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  clase_id    UUID          NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  gimnasio_id UUID          NOT NULL REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  alumno_id   UUID          NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  estado      TEXT          NOT NULL DEFAULT 'confirmada'
              CHECK (estado IN ('confirmada', 'cancelada')),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT reservas_clase_alumno_uq UNIQUE (clase_id, alumno_id)
);

ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservas_service_role"
  ON public.reservas FOR ALL TO service_role USING (true);

CREATE INDEX IF NOT EXISTS idx_reservas_clase
  ON public.reservas (clase_id, estado);
CREATE INDEX IF NOT EXISTS idx_reservas_alumno
  ON public.reservas (alumno_id);

-- Reserva segura: bloquea la fila de la clase para evitar overbooking concurrente
CREATE OR REPLACE FUNCTION public.reservar_clase(
  p_clase_id    UUID,
  p_alumno_id   UUID,
  p_gimnasio_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clase    RECORD;
  v_ocupados INTEGER;
BEGIN
  SELECT * INTO v_clase
    FROM public.clases
   WHERE id = p_clase_id AND gimnasio_id = p_gimnasio_id
     FOR UPDATE;

  IF NOT FOUND          THEN RETURN 'clase_no_encontrada'; END IF;
  IF v_clase.cancelada  THEN RETURN 'clase_cancelada';     END IF;

  SELECT COUNT(*) INTO v_ocupados
    FROM public.reservas
   WHERE clase_id = p_clase_id AND estado = 'confirmada';

  IF v_ocupados >= v_clase.capacidad_max THEN RETURN 'sin_cupo'; END IF;

  INSERT INTO public.reservas (clase_id, gimnasio_id, alumno_id)
    VALUES (p_clase_id, p_gimnasio_id, p_alumno_id)
    ON CONFLICT (clase_id, alumno_id) DO UPDATE SET estado = 'confirmada';

  RETURN 'ok';
END;
$$;
