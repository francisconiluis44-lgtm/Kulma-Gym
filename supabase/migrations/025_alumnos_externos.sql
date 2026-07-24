-- ============================================================
-- 025: Alumnos externos (Opción B)
-- Personas del gimnasio sin cuenta en la app.
-- No toca tablas existentes.
-- ============================================================

-- 1. Tabla principal
CREATE TABLE IF NOT EXISTS public.alumnos_externos (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id       UUID          NOT NULL REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  nombre_completo   TEXT          NOT NULL,
  dni               TEXT,
  whatsapp          TEXT,
  email             TEXT,
  fecha_nacimiento  DATE,
  fecha_alta        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  fecha_vencimiento DATE,
  alumno_id         UUID          REFERENCES public.alumnos(id) ON DELETE SET NULL
);

ALTER TABLE public.alumnos_externos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alumnos_externos_service_role"
  ON public.alumnos_externos FOR ALL TO service_role USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS alumnos_externos_dni_gimnasio_uq
  ON public.alumnos_externos (gimnasio_id, dni)
  WHERE dni IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_alumnos_externos_gimnasio
  ON public.alumnos_externos (gimnasio_id);

CREATE INDEX IF NOT EXISTS idx_alumnos_externos_alumno_id
  ON public.alumnos_externos (alumno_id)
  WHERE alumno_id IS NOT NULL;

-- 2. Asistencias externas
CREATE TABLE IF NOT EXISTS public.asistencias_externas (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_externo_id UUID          NOT NULL REFERENCES public.alumnos_externos(id) ON DELETE CASCADE,
  gimnasio_id       UUID          NOT NULL REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  fecha             DATE          NOT NULL,
  checked_in_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT asistencias_externas_alumno_fecha_uq UNIQUE (alumno_externo_id, fecha)
);

ALTER TABLE public.asistencias_externas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "asistencias_externas_service_role"
  ON public.asistencias_externas FOR ALL TO service_role USING (true);

CREATE INDEX IF NOT EXISTS idx_asistencias_externas_gimnasio_fecha
  ON public.asistencias_externas (gimnasio_id, fecha);

-- 3. Cobros externos
CREATE TABLE IF NOT EXISTS public.cobros_externos (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_externo_id UUID          NOT NULL REFERENCES public.alumnos_externos(id) ON DELETE CASCADE,
  gimnasio_id       UUID          NOT NULL REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  monto             NUMERIC(10,2) NOT NULL,
  fecha             DATE          NOT NULL DEFAULT (current_date AT TIME ZONE 'America/Argentina/Buenos_Aires'),
  metodo            TEXT          NOT NULL DEFAULT 'efectivo'
                    CHECK (metodo IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  notas             TEXT,
  estado            TEXT          NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('activo', 'anulado')),
  motivo_anulacion  TEXT,
  created_at        TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.cobros_externos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cobros_externos_service_role"
  ON public.cobros_externos FOR ALL TO service_role USING (true);

CREATE INDEX IF NOT EXISTS idx_cobros_externos_gimnasio
  ON public.cobros_externos (gimnasio_id, estado);

-- 4. Alias para aparejamiento en importaciones
CREATE TABLE IF NOT EXISTS public.alias_alumnos_externos (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id       UUID          NOT NULL REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  alumno_externo_id UUID          NOT NULL REFERENCES public.alumnos_externos(id) ON DELETE CASCADE,
  alias             TEXT          NOT NULL,
  origen            TEXT          NOT NULL DEFAULT 'manual',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (gimnasio_id, alias)
);

ALTER TABLE public.alias_alumnos_externos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alias_alumnos_externos_service_role"
  ON public.alias_alumnos_externos FOR ALL TO service_role USING (true);

-- 5. Vista unificada: todas las personas del gimnasio
CREATE OR REPLACE VIEW public.personas_gimnasio AS
SELECT
  id,
  gimnasio_id,
  nombre_completo,
  dni,
  whatsapp,
  email,
  fecha_nacimiento,
  fecha_alta,
  fecha_vencimiento,
  'registrado'::text AS tipo_persona,
  NULL::uuid         AS alumno_externo_id
FROM public.alumnos
UNION ALL
SELECT
  id,
  gimnasio_id,
  nombre_completo,
  dni,
  whatsapp,
  email,
  fecha_nacimiento,
  fecha_alta,
  fecha_vencimiento,
  'externo'::text    AS tipo_persona,
  id                 AS alumno_externo_id
FROM public.alumnos_externos
WHERE alumno_id IS NULL;
