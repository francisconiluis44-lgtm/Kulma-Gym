-- Índices sobre gimnasio_id para todas las tablas multi-tenant
-- Sin estos, las queries hacen full table scan a medida que crecen los datos

CREATE INDEX IF NOT EXISTS idx_alumnos_gimnasio        ON public.alumnos(gimnasio_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_gimnasio    ON public.asistencias(gimnasio_id);
CREATE INDEX IF NOT EXISTS idx_cobros_gimnasio         ON public.cobros(gimnasio_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_gimnasio       ON public.mensajes(gimnasio_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_admin_gimnasio ON public.mensajes_admin(gimnasio_id);
CREATE INDEX IF NOT EXISTS idx_comunicados_gimnasio    ON public.comunicados(gimnasio_id);
CREATE INDEX IF NOT EXISTS idx_configuracion_gimnasio  ON public.configuracion(gimnasio_id);

-- Índices auxiliares para queries frecuentes dentro de cada gym
CREATE INDEX IF NOT EXISTS idx_alumnos_fecha_vencimiento ON public.alumnos(gimnasio_id, fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha         ON public.asistencias(gimnasio_id, fecha);
CREATE INDEX IF NOT EXISTS idx_cobros_fecha              ON public.cobros(gimnasio_id, fecha);
CREATE INDEX IF NOT EXISTS idx_alumnos_fecha_alta        ON public.alumnos(gimnasio_id, fecha_alta);
