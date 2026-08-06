-- ============================================================
-- 028_clases_recurrentes.sql  (v3 – definitiva)
-- Sistema de clases con programación semanal recurrente
--
-- Tablas anteriores (migración 026): clases y reservas
-- se conservan intactas hasta que este módulo esté probado.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS cancelar_reserva_gimnasio;
--   DROP FUNCTION IF EXISTS cambio_permanente_version;
--   DROP FUNCTION IF EXISTS modificar_cupo_version;
--   DROP FUNCTION IF EXISTS cancelar_reserva_especial;
--   DROP FUNCTION IF EXISTS reservar_clase_especial;
--   DROP FUNCTION IF EXISTS cancelar_reserva_ocurrencia;
--   DROP FUNCTION IF EXISTS reservar_ocurrencia;
--   DROP TABLE IF EXISTS clases_cambios CASCADE;
--   DROP TABLE IF EXISTS clases_reservas_eventos CASCADE;
--   DROP TABLE IF EXISTS clases_reservas CASCADE;
--   DROP TABLE IF EXISTS clases_excepciones CASCADE;
--   DROP TABLE IF EXISTS clases_versiones CASCADE;
--   DROP TABLE IF EXISTS clases_series CASCADE;
-- ============================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;


-- ════════════════════════════════════════════════════════════
-- 1. SERIE — Identidad permanente de una clase recurrente
--    Ejemplo: "Funcional de los lunes"
-- ════════════════════════════════════════════════════════════
CREATE TABLE clases_series (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id  uuid        NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  nombre       text        NOT NULL,
  activa       boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clases_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alumno_read_series" ON clases_series
  FOR SELECT TO authenticated
  USING (gimnasio_id = (SELECT gimnasio_id FROM alumnos WHERE id = auth.uid()));

CREATE INDEX idx_series_gimnasio ON clases_series(gimnasio_id);


-- ════════════════════════════════════════════════════════════
-- 2. VERSIÓN — Configuración de la serie en un rango de fechas
--
--    Corrección: btrim(instructor) <> '' impide cadenas de espacios.
-- ════════════════════════════════════════════════════════════
CREATE TABLE clases_versiones (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  serie_id          uuid        NOT NULL REFERENCES clases_series(id) ON DELETE CASCADE,
  dia_semana        smallint    NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  hora_inicio       time        NOT NULL,
  duracion_minutos  int         NOT NULL CHECK (duracion_minutos > 0),
  cupo_maximo       int         NOT NULL CHECK (cupo_maximo > 0),
  instructor        text        NOT NULL CHECK (btrim(instructor) <> ''),
  descripcion       text,
  fecha_desde       date        NOT NULL,
  fecha_hasta       date,

  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT versiones_rango CHECK (fecha_hasta IS NULL OR fecha_hasta >= fecha_desde),

  EXCLUDE USING gist (
    serie_id    WITH =,
    dia_semana  WITH =,
    daterange(fecha_desde, COALESCE(fecha_hasta, '9999-12-31'), '[]') WITH &&
  )
);

-- Solo una versión abierta (sin fecha_hasta) por (serie, día)
CREATE UNIQUE INDEX versiones_una_vigente
  ON clases_versiones (serie_id, dia_semana)
  WHERE fecha_hasta IS NULL;

ALTER TABLE clases_versiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alumno_read_versiones" ON clases_versiones
  FOR SELECT TO authenticated
  USING (
    serie_id IN (
      SELECT id FROM clases_series
      WHERE gimnasio_id = (SELECT gimnasio_id FROM alumnos WHERE id = auth.uid())
    )
  );

CREATE INDEX idx_versiones_serie_dia    ON clases_versiones(serie_id, dia_semana);
CREATE INDEX idx_versiones_serie_fechas ON clases_versiones(serie_id, fecha_desde, fecha_hasta);


-- ════════════════════════════════════════════════════════════
-- 3. EXCEPCIÓN — Modificaciones, cancelaciones y clases especiales
--
--    Restricciones por tipo:
--    - 'modificacion':   serie_id requerido; al menos un campo
--                        override no nulo; instructor no puede ser
--                        cadena de espacios si se provee.
--    - 'cancelacion':    serie_id requerido; todos los campos
--                        override DEBEN ser NULL (cancelación pura).
--    - 'clase_especial': serie_id NULL; todos los campos requeridos;
--                        instructor no puede ser cadena de espacios.
-- ════════════════════════════════════════════════════════════
CREATE TABLE clases_excepciones (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id       uuid        NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  serie_id          uuid        REFERENCES clases_series(id) ON DELETE CASCADE,
  fecha             date        NOT NULL,
  tipo              text        NOT NULL CHECK (tipo IN ('modificacion', 'cancelacion', 'clase_especial')),

  nombre            text,
  hora_inicio       time,
  duracion_minutos  int         CHECK (duracion_minutos IS NULL OR duracion_minutos > 0),
  cupo_maximo       int         CHECK (cupo_maximo IS NULL OR cupo_maximo > 0),
  instructor        text        CHECK (instructor IS NULL OR btrim(instructor) <> ''),
  descripcion       text,

  created_by        uuid        REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT excepcion_tipo_check CHECK (
    -- Modificación: serie requerida; al menos un campo override presente
    (tipo = 'modificacion'
      AND serie_id IS NOT NULL
      AND (
        nombre IS NOT NULL OR hora_inicio IS NOT NULL
        OR duracion_minutos IS NOT NULL OR cupo_maximo IS NOT NULL
        OR instructor IS NOT NULL OR descripcion IS NOT NULL
      )
    )
    OR
    -- Cancelación: serie requerida; NINGÚN campo de override
    (tipo = 'cancelacion'
      AND serie_id IS NOT NULL
      AND nombre IS NULL AND hora_inicio IS NULL AND duracion_minutos IS NULL
      AND cupo_maximo IS NULL AND instructor IS NULL AND descripcion IS NULL
    )
    OR
    -- Clase especial: sin serie; todos los campos obligatorios
    (tipo = 'clase_especial'
      AND serie_id IS NULL
      AND nombre IS NOT NULL
      AND hora_inicio IS NOT NULL
      AND duracion_minutos IS NOT NULL
      AND cupo_maximo IS NOT NULL
      AND instructor IS NOT NULL
    )
  ),

  -- Una sola excepción por (serie, fecha)
  UNIQUE (serie_id, fecha)
);

ALTER TABLE clases_excepciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alumno_read_excepciones" ON clases_excepciones
  FOR SELECT TO authenticated
  USING (gimnasio_id = (SELECT gimnasio_id FROM alumnos WHERE id = auth.uid()));

CREATE INDEX idx_excepciones_gimnasio_fecha ON clases_excepciones(gimnasio_id, fecha);
CREATE INDEX idx_excepciones_serie_fecha    ON clases_excepciones(serie_id, fecha);


-- ════════════════════════════════════════════════════════════
-- 4. RESERVAS
--
--    Los alumnos SOLO pueden leer sus propias reservas.
--    Todas las mutaciones (reservar, cancelar) van por funciones
--    SECURITY DEFINER; no hay política directa de escritura.
-- ════════════════════════════════════════════════════════════
CREATE TABLE clases_reservas (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id       uuid        NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  alumno_id         uuid        NOT NULL REFERENCES alumnos(id)   ON DELETE CASCADE,

  -- Apunta a UNA de las dos cosas, nunca ambas
  serie_id          uuid        REFERENCES clases_series(id),
  fecha_ocurrencia  date,
  excepcion_id      uuid        REFERENCES clases_excepciones(id),

  estado            text        NOT NULL DEFAULT 'confirmada'
    CHECK (estado IN ('confirmada', 'cancelada_alumno', 'cancelada_gimnasio', 'asistida', 'ausente')),

  created_at        timestamptz NOT NULL DEFAULT now(),
  cancelled_at      timestamptz,

  CONSTRAINT reserva_tipo CHECK (
    (serie_id IS NOT NULL AND fecha_ocurrencia IS NOT NULL AND excepcion_id IS NULL)
    OR
    (serie_id IS NULL AND fecha_ocurrencia IS NULL AND excepcion_id IS NOT NULL)
  )
);

-- Una sola fila por (serie, fecha, alumno)
CREATE UNIQUE INDEX reservas_serie_unica
  ON clases_reservas (serie_id, fecha_ocurrencia, alumno_id)
  WHERE serie_id IS NOT NULL;

-- Una sola fila por (clase especial, alumno)
CREATE UNIQUE INDEX reservas_especial_unica
  ON clases_reservas (excepcion_id, alumno_id)
  WHERE excepcion_id IS NOT NULL;

ALTER TABLE clases_reservas ENABLE ROW LEVEL SECURITY;

-- Alumnos solo leen sus propias reservas; sin acceso directo de escritura
CREATE POLICY "alumno_select_own_reservas" ON clases_reservas
  FOR SELECT TO authenticated
  USING (alumno_id = auth.uid());

CREATE INDEX idx_clases_reservas_alumno      ON clases_reservas(alumno_id, estado);
CREATE INDEX idx_clases_reservas_serie_fecha ON clases_reservas(serie_id, fecha_ocurrencia) WHERE estado = 'confirmada';
CREATE INDEX idx_clases_reservas_excepcion   ON clases_reservas(excepcion_id) WHERE estado = 'confirmada';


-- ════════════════════════════════════════════════════════════
-- 5. EVENTOS DE RESERVAS — auditoría por reserva
--
--    Registra cada transición de estado de una reserva individual,
--    con el user_id de quien la ejecutó. Permite reconstruir
--    exactamente qué pasó con cada reserva y quién lo hizo.
--
--    Tipos:
--      creada             → INSERT inicial confirmada
--      cancelada_alumno   → alumno canceló
--      reactivada         → alumno re-reservó tras cancelar
--      cancelada_gimnasio → admin canceló por el gimnasio
-- ════════════════════════════════════════════════════════════
CREATE TABLE clases_reservas_eventos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id  uuid        NOT NULL REFERENCES clases_reservas(id)  ON DELETE CASCADE,
  gimnasio_id uuid        NOT NULL REFERENCES gimnasios(id)         ON DELETE CASCADE,
  tipo        text        NOT NULL
    CHECK (tipo IN ('creada', 'cancelada_alumno', 'reactivada', 'cancelada_gimnasio')),
  user_id     uuid        NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clases_reservas_eventos ENABLE ROW LEVEL SECURITY;

-- Gym admins leen el historial completo de su gimnasio
CREATE POLICY "admin_read_reservas_eventos" ON clases_reservas_eventos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gym_admins
      WHERE user_id = auth.uid()
        AND gimnasio_id = clases_reservas_eventos.gimnasio_id
    )
  );

-- Alumnos leen sus propios eventos
CREATE POLICY "alumno_read_own_eventos" ON clases_reservas_eventos
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_eventos_reserva   ON clases_reservas_eventos(reserva_id, created_at);
CREATE INDEX idx_eventos_gimnasio  ON clases_reservas_eventos(gimnasio_id, created_at DESC);


-- ════════════════════════════════════════════════════════════
-- 6. CAMBIOS DE AGENDA — auditoría de cambios estructurales
--
--    Solo para cambios de schedule (cupo, versión, etc.).
--    Accesible via gym_admins o service role.
-- ════════════════════════════════════════════════════════════
CREATE TABLE clases_cambios (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id          uuid        NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  serie_id             uuid        REFERENCES clases_series(id),
  user_id              uuid        NOT NULL REFERENCES auth.users(id),
  alcance              text        NOT NULL
    CHECK (alcance IN ('una_clase', 'todas_futuras', 'serie')),
  tipo_cambio          text        NOT NULL,
  fecha_desde_afectada date,
  reservas_afectadas   int,
  datos_anteriores     jsonb,
  datos_nuevos         jsonb,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clases_cambios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_cambios" ON clases_cambios
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gym_admins
      WHERE user_id = auth.uid()
        AND gimnasio_id = clases_cambios.gimnasio_id
    )
  );

CREATE INDEX idx_cambios_serie    ON clases_cambios(serie_id);
CREATE INDEX idx_cambios_gimnasio ON clases_cambios(gimnasio_id, created_at DESC);


-- ════════════════════════════════════════════════════════════
-- 7. FUNCIÓN: reservar_ocurrencia
--
--    - auth.uid() resuelve alumno_id y gimnasio_id internamente.
--    - Versión resuelta PRIMERO; excepción aplica overrides con COALESCE.
--    - La hora efectiva usada en el check de "hoy" es la ya sobreescrita
--      por la excepción (punto 1 confirmado).
--    - Solo reactiva estado 'cancelada_alumno'.
--    - Escribe en clases_reservas_eventos.
--
--    Retorna:
--      'ok'                   → reserva creada o reactivada
--      'ya_reservado'         → reserva confirmada preexistente
--      'sin_cupo'             → cupo agotado
--      'clase_cancelada'      → excepción tipo cancelacion
--      'clase_no_encontrada'  → sin versión activa en esa fecha/día
--      'serie_no_encontrada'  → serie inactiva o de otro gimnasio
--      'fecha_pasada'         → fecha o hora ya transcurrió (AR)
--      'reserva_no_reactivable' → fila en estado no reactivable
--      'no_autenticado'       → auth.uid() es NULL
--      'alumno_no_encontrado' → usuario no es alumno
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION reservar_ocurrencia(
  p_serie_id  uuid,
  p_fecha     date
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       uuid;
  v_alumno_id     uuid;
  v_gimnasio_id   uuid;
  v_dia_semana    smallint;
  v_version       clases_versiones%ROWTYPE;
  v_excepcion     clases_excepciones%ROWTYPE;
  v_cupo_maximo   int;
  v_hora_inicio   time;
  v_confirmadas   int;
  v_reserva_id    uuid;
  v_estado_actual text;
  v_hoy_ar        date;
  v_ahora_ar      time;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 'no_autenticado';
  END IF;

  SELECT id, gimnasio_id INTO v_alumno_id, v_gimnasio_id
  FROM alumnos WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN 'alumno_no_encontrado';
  END IF;

  v_hoy_ar   := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  v_ahora_ar := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::time;

  IF p_fecha < v_hoy_ar THEN
    RETURN 'fecha_pasada';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext(p_serie_id::text),
    hashtext(p_fecha::text)
  );

  IF NOT EXISTS (
    SELECT 1 FROM clases_series
    WHERE id = p_serie_id AND gimnasio_id = v_gimnasio_id AND activa
  ) THEN
    RETURN 'serie_no_encontrada';
  END IF;

  -- Resolver versión PRIMERO
  v_dia_semana := EXTRACT(ISODOW FROM p_fecha)::smallint;
  SELECT * INTO v_version
  FROM clases_versiones
  WHERE serie_id   = p_serie_id
    AND dia_semana = v_dia_semana
    AND fecha_desde <= p_fecha
    AND (fecha_hasta IS NULL OR fecha_hasta >= p_fecha);

  IF NOT FOUND THEN
    RETURN 'clase_no_encontrada';
  END IF;

  -- Valores base de la versión
  v_cupo_maximo := v_version.cupo_maximo;
  v_hora_inicio := v_version.hora_inicio;

  -- Excepción sobreescribe con COALESCE (prioridad a excepción)
  SELECT * INTO v_excepcion
  FROM clases_excepciones
  WHERE serie_id = p_serie_id AND fecha = p_fecha;

  IF FOUND THEN
    IF v_excepcion.tipo = 'cancelacion' THEN
      RETURN 'clase_cancelada';
    END IF;
    IF v_excepcion.tipo = 'modificacion' THEN
      v_cupo_maximo := COALESCE(v_excepcion.cupo_maximo, v_version.cupo_maximo);
      -- hora efectiva incluye el override de la excepción (punto 1)
      v_hora_inicio := COALESCE(v_excepcion.hora_inicio, v_version.hora_inicio);
    END IF;
  END IF;

  -- Check de hora usando la hora efectiva (ya post-override)
  IF p_fecha = v_hoy_ar AND v_ahora_ar >= v_hora_inicio THEN
    RETURN 'fecha_pasada';
  END IF;

  SELECT COUNT(*) INTO v_confirmadas
  FROM clases_reservas
  WHERE serie_id = p_serie_id
    AND fecha_ocurrencia = p_fecha
    AND estado = 'confirmada';

  IF v_confirmadas >= v_cupo_maximo THEN
    RETURN 'sin_cupo';
  END IF;

  SELECT id, estado INTO v_reserva_id, v_estado_actual
  FROM clases_reservas
  WHERE serie_id = p_serie_id
    AND fecha_ocurrencia = p_fecha
    AND alumno_id = v_alumno_id;

  IF FOUND THEN
    IF v_estado_actual = 'confirmada' THEN
      RETURN 'ya_reservado';
    END IF;
    -- Solo reactiva si fue cancelada por el alumno
    IF v_estado_actual <> 'cancelada_alumno' THEN
      RETURN 'reserva_no_reactivable';
    END IF;

    UPDATE clases_reservas
    SET estado = 'confirmada', cancelled_at = NULL
    WHERE id = v_reserva_id;

    INSERT INTO clases_reservas_eventos (reserva_id, gimnasio_id, tipo, user_id)
    VALUES (v_reserva_id, v_gimnasio_id, 'reactivada', v_user_id);

    RETURN 'ok';
  END IF;

  INSERT INTO clases_reservas (gimnasio_id, alumno_id, serie_id, fecha_ocurrencia, estado)
  VALUES (v_gimnasio_id, v_alumno_id, p_serie_id, p_fecha, 'confirmada')
  RETURNING id INTO v_reserva_id;

  INSERT INTO clases_reservas_eventos (reserva_id, gimnasio_id, tipo, user_id)
  VALUES (v_reserva_id, v_gimnasio_id, 'creada', v_user_id);

  RETURN 'ok';
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 8. FUNCIÓN: cancelar_reserva_ocurrencia
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION cancelar_reserva_ocurrencia(
  p_serie_id  uuid,
  p_fecha     date
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid;
  v_alumno_id   uuid;
  v_gimnasio_id uuid;
  v_reserva_id  uuid;
  v_estado      text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 'no_autenticado';
  END IF;

  SELECT id, gimnasio_id INTO v_alumno_id, v_gimnasio_id
  FROM alumnos WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN 'alumno_no_encontrado';
  END IF;

  SELECT id, estado INTO v_reserva_id, v_estado
  FROM clases_reservas
  WHERE serie_id = p_serie_id
    AND fecha_ocurrencia = p_fecha
    AND alumno_id = v_alumno_id;

  IF NOT FOUND THEN
    RETURN 'reserva_no_encontrada';
  END IF;

  IF v_estado <> 'confirmada' THEN
    RETURN 'no_confirmada';
  END IF;

  UPDATE clases_reservas
  SET estado = 'cancelada_alumno', cancelled_at = now()
  WHERE id = v_reserva_id;

  INSERT INTO clases_reservas_eventos (reserva_id, gimnasio_id, tipo, user_id)
  VALUES (v_reserva_id, v_gimnasio_id, 'cancelada_alumno', v_user_id);

  RETURN 'ok';
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 9. FUNCIÓN: reservar_clase_especial
--    Valida membresía al gimnasio y fecha/hora efectiva (AR).
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION reservar_clase_especial(
  p_excepcion_id uuid
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       uuid;
  v_alumno_id     uuid;
  v_gimnasio_id   uuid;
  v_excepcion     clases_excepciones%ROWTYPE;
  v_confirmadas   int;
  v_reserva_id    uuid;
  v_estado_actual text;
  v_hoy_ar        date;
  v_ahora_ar      time;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 'no_autenticado';
  END IF;

  SELECT id, gimnasio_id INTO v_alumno_id, v_gimnasio_id
  FROM alumnos WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN 'alumno_no_encontrado';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_excepcion_id::text), 0);

  SELECT * INTO v_excepcion
  FROM clases_excepciones
  WHERE id = p_excepcion_id
    AND gimnasio_id = v_gimnasio_id
    AND tipo = 'clase_especial';

  IF NOT FOUND THEN
    RETURN 'clase_no_encontrada';
  END IF;

  v_hoy_ar   := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  v_ahora_ar := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::time;

  IF v_excepcion.fecha < v_hoy_ar THEN
    RETURN 'fecha_pasada';
  END IF;
  IF v_excepcion.fecha = v_hoy_ar AND v_ahora_ar >= v_excepcion.hora_inicio THEN
    RETURN 'fecha_pasada';
  END IF;

  SELECT COUNT(*) INTO v_confirmadas
  FROM clases_reservas
  WHERE excepcion_id = p_excepcion_id AND estado = 'confirmada';

  IF v_confirmadas >= v_excepcion.cupo_maximo THEN
    RETURN 'sin_cupo';
  END IF;

  SELECT id, estado INTO v_reserva_id, v_estado_actual
  FROM clases_reservas
  WHERE excepcion_id = p_excepcion_id AND alumno_id = v_alumno_id;

  IF FOUND THEN
    IF v_estado_actual = 'confirmada' THEN
      RETURN 'ya_reservado';
    END IF;
    IF v_estado_actual <> 'cancelada_alumno' THEN
      RETURN 'reserva_no_reactivable';
    END IF;

    UPDATE clases_reservas
    SET estado = 'confirmada', cancelled_at = NULL
    WHERE id = v_reserva_id;

    INSERT INTO clases_reservas_eventos (reserva_id, gimnasio_id, tipo, user_id)
    VALUES (v_reserva_id, v_gimnasio_id, 'reactivada', v_user_id);

    RETURN 'ok';
  END IF;

  INSERT INTO clases_reservas (gimnasio_id, alumno_id, excepcion_id, estado)
  VALUES (v_gimnasio_id, v_alumno_id, p_excepcion_id, 'confirmada')
  RETURNING id INTO v_reserva_id;

  INSERT INTO clases_reservas_eventos (reserva_id, gimnasio_id, tipo, user_id)
  VALUES (v_reserva_id, v_gimnasio_id, 'creada', v_user_id);

  RETURN 'ok';
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 10. FUNCIÓN: cancelar_reserva_especial
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION cancelar_reserva_especial(
  p_excepcion_id uuid
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid;
  v_alumno_id   uuid;
  v_gimnasio_id uuid;
  v_reserva_id  uuid;
  v_estado      text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 'no_autenticado';
  END IF;

  SELECT id, gimnasio_id INTO v_alumno_id, v_gimnasio_id
  FROM alumnos WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN 'alumno_no_encontrado';
  END IF;

  -- Verificar que la clase especial pertenece al gimnasio del alumno
  IF NOT EXISTS (
    SELECT 1 FROM clases_excepciones
    WHERE id = p_excepcion_id AND gimnasio_id = v_gimnasio_id
  ) THEN
    RETURN 'clase_no_encontrada';
  END IF;

  SELECT id, estado INTO v_reserva_id, v_estado
  FROM clases_reservas
  WHERE excepcion_id = p_excepcion_id AND alumno_id = v_alumno_id;

  IF NOT FOUND THEN
    RETURN 'reserva_no_encontrada';
  END IF;

  IF v_estado <> 'confirmada' THEN
    RETURN 'no_confirmada';
  END IF;

  UPDATE clases_reservas
  SET estado = 'cancelada_alumno', cancelled_at = now()
  WHERE id = v_reserva_id;

  INSERT INTO clases_reservas_eventos (reserva_id, gimnasio_id, tipo, user_id)
  VALUES (v_reserva_id, v_gimnasio_id, 'cancelada_alumno', v_user_id);

  RETURN 'ok';
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 11. FUNCIÓN: cancelar_reserva_gimnasio
--     Permite a un gym_admin cancelar la reserva de un alumno.
--     Registra el evento 'cancelada_gimnasio'.
--
--     Retorna:
--       'ok'
--       'reserva_no_encontrada'
--       'no_confirmada'
--       'sin_permiso'
--       'no_autenticado'
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION cancelar_reserva_gimnasio(
  p_reserva_id uuid
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid;
  v_gimnasio_id uuid;
  v_estado      text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 'no_autenticado';
  END IF;

  SELECT gimnasio_id, estado INTO v_gimnasio_id, v_estado
  FROM clases_reservas
  WHERE id = p_reserva_id;

  IF NOT FOUND THEN
    RETURN 'reserva_no_encontrada';
  END IF;

  -- Verificar que el llamador es admin del gimnasio de la reserva
  IF NOT EXISTS (
    SELECT 1 FROM gym_admins
    WHERE user_id = v_user_id AND gimnasio_id = v_gimnasio_id
  ) THEN
    RETURN 'sin_permiso';
  END IF;

  IF v_estado <> 'confirmada' THEN
    RETURN 'no_confirmada';
  END IF;

  UPDATE clases_reservas
  SET estado = 'cancelada_gimnasio', cancelled_at = now()
  WHERE id = p_reserva_id;

  INSERT INTO clases_reservas_eventos (reserva_id, gimnasio_id, tipo, user_id)
  VALUES (p_reserva_id, v_gimnasio_id, 'cancelada_gimnasio', v_user_id);

  RETURN 'ok';
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 12. FUNCIÓN: modificar_cupo_version
--     Cambia el cupo de una versión. Rechaza si nuevo cupo <
--     reservas confirmadas existentes en esa versión.
--     Solo gym_admins del gimnasio pueden llamarla.
--
--     Retorna:
--       'ok'
--       'cupo_invalido'
--       'cupo_insuficiente'
--       'version_no_encontrada'
--       'sin_permiso'
--       'no_autenticado'
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION modificar_cupo_version(
  p_version_id  uuid,
  p_nuevo_cupo  int
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       uuid;
  v_gimnasio_id   uuid;
  v_serie_id      uuid;
  v_cupo_anterior int;
  v_fecha_desde   date;
  v_fecha_hasta   date;
  v_confirmadas   int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 'no_autenticado';
  END IF;

  IF p_nuevo_cupo IS NULL OR p_nuevo_cupo <= 0 THEN
    RETURN 'cupo_invalido';
  END IF;

  SELECT cs.gimnasio_id, cv.serie_id, cv.cupo_maximo, cv.fecha_desde, cv.fecha_hasta
  INTO v_gimnasio_id, v_serie_id, v_cupo_anterior, v_fecha_desde, v_fecha_hasta
  FROM clases_versiones cv
  JOIN clases_series cs ON cs.id = cv.serie_id
  WHERE cv.id = p_version_id;

  IF NOT FOUND THEN
    RETURN 'version_no_encontrada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM gym_admins
    WHERE user_id = v_user_id AND gimnasio_id = v_gimnasio_id
  ) THEN
    RETURN 'sin_permiso';
  END IF;

  -- Si se reduce el cupo, validar que no haya más confirmadas que el nuevo límite
  IF p_nuevo_cupo < v_cupo_anterior THEN
    SELECT COUNT(*) INTO v_confirmadas
    FROM clases_reservas
    WHERE serie_id = v_serie_id
      AND estado = 'confirmada'
      AND fecha_ocurrencia >= v_fecha_desde
      AND (v_fecha_hasta IS NULL OR fecha_ocurrencia <= v_fecha_hasta);

    IF v_confirmadas > p_nuevo_cupo THEN
      RETURN 'cupo_insuficiente';
    END IF;
  END IF;

  UPDATE clases_versiones
  SET cupo_maximo = p_nuevo_cupo
  WHERE id = p_version_id;

  INSERT INTO clases_cambios
    (gimnasio_id, serie_id, user_id, alcance, tipo_cambio,
     datos_anteriores, datos_nuevos)
  VALUES
    (v_gimnasio_id, v_serie_id, v_user_id, 'serie', 'modificacion_cupo',
     jsonb_build_object('cupo_maximo', v_cupo_anterior),
     jsonb_build_object('cupo_maximo', p_nuevo_cupo));

  RETURN 'ok';
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 13. FUNCIÓN: cambio_permanente_version
--     Cierra la versión vigente y abre una nueva a partir de
--     p_nueva_fecha_desde (debe ser futura en AR).
--     Atómico: todo en una transacción.
--     Solo gym_admins del gimnasio pueden llamarla.
--
--     Retorna jsonb:
--       { "resultado": "ok", "reservas_afectadas": N }
--       { "resultado": "error", "detalle": "<codigo>" }
--
--     Códigos de error:
--       no_autenticado, sin_permiso, serie_no_encontrada,
--       fecha_invalida, instructor_invalido, cupo_invalido,
--       duracion_invalida, version_activa_no_encontrada
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION cambio_permanente_version(
  p_serie_id          uuid,
  p_dia_semana        smallint,
  p_nueva_fecha_desde date,
  p_hora_inicio       time,
  p_duracion_minutos  int,
  p_cupo_maximo       int,
  p_instructor        text,
  p_descripcion       text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id            uuid;
  v_gimnasio_id        uuid;
  v_version_activa     clases_versiones%ROWTYPE;
  v_hoy_ar             date;
  v_reservas_afectadas int;
  v_nueva_version_id   uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'no_autenticado');
  END IF;

  SELECT gimnasio_id INTO v_gimnasio_id
  FROM clases_series
  WHERE id = p_serie_id AND activa;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'serie_no_encontrada');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM gym_admins
    WHERE user_id = v_user_id AND gimnasio_id = v_gimnasio_id
  ) THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'sin_permiso');
  END IF;

  -- Validar parámetros de la nueva versión
  v_hoy_ar := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  IF p_nueva_fecha_desde <= v_hoy_ar THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'fecha_invalida');
  END IF;
  IF p_instructor IS NULL OR btrim(p_instructor) = '' THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'instructor_invalido');
  END IF;
  IF p_cupo_maximo IS NULL OR p_cupo_maximo <= 0 THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'cupo_invalido');
  END IF;
  IF p_duracion_minutos IS NULL OR p_duracion_minutos <= 0 THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'duracion_invalida');
  END IF;

  -- Buscar versión vigente abierta para (serie, día)
  SELECT * INTO v_version_activa
  FROM clases_versiones
  WHERE serie_id   = p_serie_id
    AND dia_semana = p_dia_semana
    AND fecha_hasta IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'version_activa_no_encontrada');
  END IF;

  -- Contar reservas confirmadas afectadas desde la nueva fecha en adelante
  SELECT COUNT(*) INTO v_reservas_afectadas
  FROM clases_reservas
  WHERE serie_id = p_serie_id
    AND fecha_ocurrencia >= p_nueva_fecha_desde
    AND estado = 'confirmada';

  -- Cerrar versión actual
  UPDATE clases_versiones
  SET fecha_hasta = p_nueva_fecha_desde - 1
  WHERE id = v_version_activa.id;

  -- Crear nueva versión
  INSERT INTO clases_versiones
    (serie_id, dia_semana, hora_inicio, duracion_minutos, cupo_maximo,
     instructor, descripcion, fecha_desde, fecha_hasta)
  VALUES
    (p_serie_id, p_dia_semana, p_hora_inicio, p_duracion_minutos, p_cupo_maximo,
     p_instructor, p_descripcion, p_nueva_fecha_desde, NULL)
  RETURNING id INTO v_nueva_version_id;

  -- Auditoría de cambio de schedule
  INSERT INTO clases_cambios
    (gimnasio_id, serie_id, user_id, alcance, tipo_cambio,
     fecha_desde_afectada, reservas_afectadas,
     datos_anteriores, datos_nuevos)
  VALUES (
    v_gimnasio_id,
    p_serie_id,
    v_user_id,
    'todas_futuras',
    'cambio_version',
    p_nueva_fecha_desde,
    v_reservas_afectadas,
    jsonb_build_object(
      'version_id',       v_version_activa.id,
      'hora_inicio',      v_version_activa.hora_inicio,
      'duracion_minutos', v_version_activa.duracion_minutos,
      'cupo_maximo',      v_version_activa.cupo_maximo,
      'instructor',       v_version_activa.instructor,
      'descripcion',      v_version_activa.descripcion,
      'fecha_desde',      v_version_activa.fecha_desde
    ),
    jsonb_build_object(
      'version_id',       v_nueva_version_id,
      'hora_inicio',      p_hora_inicio,
      'duracion_minutos', p_duracion_minutos,
      'cupo_maximo',      p_cupo_maximo,
      'instructor',       p_instructor,
      'descripcion',      p_descripcion,
      'fecha_desde',      p_nueva_fecha_desde
    )
  );

  RETURN jsonb_build_object('resultado', 'ok', 'reservas_afectadas', v_reservas_afectadas);
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 14. PERMISOS
--     Quitar acceso público; solo usuarios autenticados.
--     Las funciones de admin (modificar_cupo, cambio_permanente,
--     cancelar_gimnasio) verifican gym_admin internamente.
-- ════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION reservar_ocurrencia(uuid, date)               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cancelar_reserva_ocurrencia(uuid, date)       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION reservar_clase_especial(uuid)                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cancelar_reserva_especial(uuid)               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cancelar_reserva_gimnasio(uuid)               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION modificar_cupo_version(uuid, int)             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cambio_permanente_version(uuid, smallint, date, time, int, int, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION reservar_ocurrencia(uuid, date)                TO authenticated;
GRANT EXECUTE ON FUNCTION cancelar_reserva_ocurrencia(uuid, date)        TO authenticated;
GRANT EXECUTE ON FUNCTION reservar_clase_especial(uuid)                  TO authenticated;
GRANT EXECUTE ON FUNCTION cancelar_reserva_especial(uuid)                TO authenticated;
GRANT EXECUTE ON FUNCTION cancelar_reserva_gimnasio(uuid)                TO authenticated;
GRANT EXECUTE ON FUNCTION modificar_cupo_version(uuid, int)              TO authenticated;
GRANT EXECUTE ON FUNCTION cambio_permanente_version(uuid, smallint, date, time, int, int, text, text) TO authenticated;
