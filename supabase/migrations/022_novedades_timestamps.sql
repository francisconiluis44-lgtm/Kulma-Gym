-- Timestamps para el sistema de novedades en el dashboard del alumno.
-- ultimo_acceso: se actualiza cada vez que el alumno abre el dashboard.
-- Los demás se actualizan cuando el admin cambia el campo correspondiente.
ALTER TABLE alumnos
  ADD COLUMN IF NOT EXISTS ultimo_acceso     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rutina_url_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rutina_venc_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membresia_at      TIMESTAMPTZ;
