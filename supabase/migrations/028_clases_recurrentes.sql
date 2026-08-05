-- ============================================================
-- 028_clases_recurrentes.sql  (v2 – correcciones de seguridad)
-- Sistema de clases con programación semanal recurrente
--
-- Tablas anteriores (migración 026): clases y reservas
-- se conservan intactas hasta que este módulo esté probado.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS cambio_permanente_version;
--   DROP FUNCTION IF EXISTS modificar_cupo_version;
--   DROP FUNCTION IF EXISTS cancelar_reserva_especial;
--   DROP FUNCTION IF EXISTS reservar_clase_especial;
--   DROP FUNCTION IF EXISTS cancelar_reserva_ocurrencia;
--   DROP FUNCTION IF EXISTS reservar_ocurrencia;
--   DROP TABLE IF EXISTS clases_cambios CASCADE;
--   DROP TABLE IF EXISTS clases_reservas CASCADE;
--   DROP TABLE IF EXISTS clases_excepciones CASCADE;
--   DROP TABLE IF EXISTS clases_versiones CASCADE;
--   DROP TABLE IF EXISTS clases_series CASCADE;
-- ============================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;


-- ════════════════════════════════════════════════════════════
-- 1. SERIE — Identidad permanente de una clase recurrente
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
-- ════════════════════════════════════════════════════════════
CREATE TABLE clases_versiones (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  serie_id          uuid        NOT NULL REFERENCES clases_series(id) ON DELETE CASCADE,
  dia_semana        smallint    NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  hora_inicio       time        NOT NULL,
  duracion_minutos  int         NOT NULL CHECK (duracion_minutos > 0),
  cupo_maximo       int         NOT NULL CHECK (cupo_maximo > 0),
  -- instructor: NOT NULL y no puede ser cadena vacía (corrección punto 5)
  instructor        text        NOT NULL CHECK (instructor <> ''),
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
--    Correcciones punto 10:
--    - 'modificacion': al menos un campo override debe ser no nulo;
--      serie_id requerido; sin restricción de campos vacíos extra.
--    - 'cancelacion': todos los campos override DEBEN ser NULL;
--      serie_id requerido.
--    - 'clase_especial': serie_id NULL; todos los campos requeridos.
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
  instructor        text        CHECK (instructor IS NULL OR instructor <> ''),
  descripcion       text,

  created_by        uuid        REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT excepcion_tipo_check CHECK (
    -- Modificación: serie requerida, al menos un campo de override no nulo
    (tipo = 'modificacion'
      AND serie_id IS NOT NULL
      AND (
        nombre IS NOT NULL OR hora_inicio IS NOT NULL OR duracion_minutos IS NOT NULL
        OR cupo_maximo IS NOT NULL OR instructor IS NOT NULL OR descripcion IS NOT NULL
      )
    )
    OR
    -- Cancelación: serie requerida, NINGÚN campo de override (cancelación pura)
    (tipo = 'cancelacion'
      AND serie_id IS NOT NULL
      AND nombre IS NULL AND hora_inicio IS NULL AND duracion_minutos IS NULL
      AND cupo_maximo IS NULL AND instructor IS NULL AND descripcion IS NULL
    )
    OR
    -- Clase especial: sin serie, todos los campos requeridos
    (tipo = 'clase_especial'
      AND serie_id IS NULL
      AND nombre IS NOT NULL
      AND hora_inicio IS NOT NULL
      AND duracion_minutos IS NOT NULL
      AND cupo_maximo IS NOT NULL
      AND instructor IS NOT NULL
    )
  ),

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
--    Correcciones punto 9:
--    - Los alumnos SOLO pueden leer sus propias reservas.
--    - No hay política de INSERT/UPDATE/DELETE directa para alumnos.
--    - Todas las mutaciones van por funciones SECURITY DEFINER.
-- ════════════════════════════════════════════════════════════
CREATE TABLE clases_reservas (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id       uuid        NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  alumno_id         uuid        NOT NULL REFERENCES alumnos(id)   ON DELETE CASCADE,

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

CREATE UNIQUE INDEX reservas_serie_unica
  ON clases_reservas (serie_id, fecha_ocurrencia, alumno_id)
  WHERE serie_id IS NOT NULL;

CREATE UNIQUE INDEX reservas_especial_unica
  ON clases_reservas (excepcion_id, alumno_id)
  WHERE excepcion_id IS NOT NULL;

ALTER TABLE clases_reservas ENABLE ROW LEVEL SECURITY;

-- Alumnos solo leen sus propias reservas; mutaciones solo por funciones
CREATE POLICY "alumno_select_own_reservas" ON clases_reservas
  FOR SELECT TO authenticated
  USING (alumno_id = auth.uid());

CREATE INDEX idx_reservas_alumno      ON clases_reservas(alumno_id, estado);
CREATE INDEX idx_reservas_serie_fecha ON clases_reservas(serie_id, fecha_ocurrencia) WHERE estado = 'confirmada';
CREATE INDEX idx_reservas_excepcion   ON clases_reservas(excepcion_id) WHERE estado = 'confirmada';


-- ════════════════════════════════════════════════════════════
-- 5. AUDITORÍA DE CAMBIOS
--    Solo accesible vía service role o gym_admins.
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

-- Gym admins pueden leer el historial de cambios de su gimnasio
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
-- 6. FUNCIÓN: reservar_ocurrencia  (v2 – corregida)
--
--    Correcciones aplicadas:
--    - Sin p_alumno_id/p_gimnasio_id: se derivan de auth.uid() (punto 1)
--    - Versión resuelta PRIMERO, excepción como override (punto 2)
--    - Solo reactiva 'cancelada_alumno' (punto 3)
--    - Bloquea reservas en fechas pasadas (Argentina) (punto 4)
--    - Escribe en clases_cambios (punto 8)
--    - REVOKE EXECUTE FROM PUBLIC al final del archivo (punto 1)
--
--    Retorna:
--      'ok'                   → reserva creada o reactivada
--      'ya_reservado'         → el alumno ya tiene reserva confirmada
--      'sin_cupo'             → cupo agotado
--      'clase_cancelada'      → existe excepción tipo cancelacion
--      'clase_no_encontrada'  → no hay versión activa para esa fecha
--      'serie_no_encontrada'  → serie inexistente o de otro gimnasio
--      'fecha_pasada'         → la fecha ya ocurrió (hora Argentina)
--      'reserva_no_reactivable' → la fila existe en estado no reactivable
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
  v_user_id         uuid;
  v_alumno_id       uuid;
  v_gimnasio_id     uuid;
  v_dia_semana      smallint;
  v_version         clases_versiones%ROWTYPE;
  v_excepcion       clases_excepciones%ROWTYPE;
  v_cupo_maximo     int;
  v_hora_inicio     time;
  v_confirmadas     int;
  v_estado_actual   text;
  v_hoy_ar          date;
BEGIN
  -- Identidad del llamador
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 'no_autenticado';
  END IF;

  SELECT id, gimnasio_id INTO v_alumno_id, v_gimnasio_id
  FROM alumnos WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN 'alumno_no_encontrado';
  END IF;

  -- Validar fecha no pasada (timezone Argentina)
  v_hoy_ar := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  IF p_fecha < v_hoy_ar THEN
    RETURN 'fecha_pasada';
  END IF;

  -- Bloqueo exclusivo por (serie, fecha) para evitar race conditions
  PERFORM pg_advisory_xact_lock(
    hashtext(p_serie_id::text),
    hashtext(p_fecha::text)
  );

  -- Verificar que la serie pertenece al gimnasio del alumno
  IF NOT EXISTS (
    SELECT 1 FROM clases_series
    WHERE id = p_serie_id AND gimnasio_id = v_gimnasio_id AND activa
  ) THEN
    RETURN 'serie_no_encontrada';
  END IF;

  -- PUNTO 2: Resolver versión PRIMERO
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

  -- Si hay excepción, aplicar overrides (COALESCE: excepción tiene prioridad)
  SELECT * INTO v_excepcion
  FROM clases_excepciones
  WHERE serie_id = p_serie_id AND fecha = p_fecha;

  IF FOUND THEN
    IF v_excepcion.tipo = 'cancelacion' THEN
      RETURN 'clase_cancelada';
    END IF;
    IF v_excepcion.tipo = 'modificacion' THEN
      v_cupo_maximo := COALESCE(v_excepcion.cupo_maximo, v_version.cupo_maximo);
      v_hora_inicio := COALESCE(v_excepcion.hora_inicio, v_version.hora_inicio);
    END IF;
  END IF;

  -- Validar que la clase aún no comenzó si es hoy
  IF p_fecha = v_hoy_ar THEN
    IF (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::time >= v_hora_inicio THEN
      RETURN 'fecha_pasada';
    END IF;
  END IF;

  -- Contar confirmadas para verificar cupo
  SELECT COUNT(*) INTO v_confirmadas
  FROM clases_reservas
  WHERE serie_id = p_serie_id
    AND fecha_ocurrencia = p_fecha
    AND estado = 'confirmada';

  IF v_confirmadas >= v_cupo_maximo THEN
    RETURN 'sin_cupo';
  END IF;

  -- ¿Ya existe una fila para este alumno?
  SELECT estado INTO v_estado_actual
  FROM clases_reservas
  WHERE serie_id = p_serie_id
    AND fecha_ocurrencia = p_fecha
    AND alumno_id = v_alumno_id;

  IF FOUND THEN
    IF v_estado_actual = 'confirmada' THEN
      RETURN 'ya_reservado';
    END IF;
    -- PUNTO 3: solo reactivar si fue cancelada por el alumno
    IF v_estado_actual <> 'cancelada_alumno' THEN
      RETURN 'reserva_no_reactivable';
    END IF;
    UPDATE clases_reservas
    SET estado = 'confirmada', cancelled_at = NULL
    WHERE serie_id = p_serie_id
      AND fecha_ocurrencia = p_fecha
      AND alumno_id = v_alumno_id;

    -- Auditoría de reactivación (punto 8)
    INSERT INTO clases_cambios
      (gimnasio_id, serie_id, user_id, alcance, tipo_cambio, fecha_desde_afectada)
    VALUES
      (v_gimnasio_id, p_serie_id, v_user_id, 'una_clase', 'reserva_reactivada', p_fecha);

    RETURN 'ok';
  END IF;

  INSERT INTO clases_reservas
    (gimnasio_id, alumno_id, serie_id, fecha_ocurrencia, estado)
  VALUES
    (v_gimnasio_id, v_alumno_id, p_serie_id, p_fecha, 'confirmada');

  -- Auditoría de nueva reserva (punto 8)
  INSERT INTO clases_cambios
    (gimnasio_id, serie_id, user_id, alcance, tipo_cambio, fecha_desde_afectada)
  VALUES
    (v_gimnasio_id, p_serie_id, v_user_id, 'una_clase', 'reserva_creada', p_fecha);

  RETURN 'ok';
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 7. FUNCIÓN: cancelar_reserva_ocurrencia
--    Cancela la reserva confirmada del alumno autenticado.
--    Escribe auditoría en clases_cambios (punto 8).
--
--    Retorna:
--      'ok'                  → cancelada correctamente
--      'reserva_no_encontrada'
--      'no_confirmada'       → la reserva no estaba confirmada
--      'no_autenticado'
--      'alumno_no_encontrado'
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

  SELECT estado INTO v_estado
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
  WHERE serie_id = p_serie_id
    AND fecha_ocurrencia = p_fecha
    AND alumno_id = v_alumno_id;

  INSERT INTO clases_cambios
    (gimnasio_id, serie_id, user_id, alcance, tipo_cambio, fecha_desde_afectada)
  VALUES
    (v_gimnasio_id, p_serie_id, v_user_id, 'una_clase', 'reserva_cancelada_alumno', p_fecha);

  RETURN 'ok';
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 8. FUNCIÓN: reservar_clase_especial  (v2 – corregida)
--    Punto 11: usa auth.uid(), valida membresía y fecha/hora.
--
--    Retorna:
--      'ok'
--      'ya_reservado'
--      'sin_cupo'
--      'clase_no_encontrada'
--      'fecha_pasada'
--      'reserva_no_reactivable'
--      'no_autenticado'
--      'alumno_no_encontrado'
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
  v_estado_actual text;
  v_hoy_ar        date;
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

  -- Validar fecha/hora (punto 11)
  v_hoy_ar := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  IF v_excepcion.fecha < v_hoy_ar THEN
    RETURN 'fecha_pasada';
  END IF;
  IF v_excepcion.fecha = v_hoy_ar THEN
    IF (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::time >= v_excepcion.hora_inicio THEN
      RETURN 'fecha_pasada';
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_confirmadas
  FROM clases_reservas
  WHERE excepcion_id = p_excepcion_id AND estado = 'confirmada';

  IF v_confirmadas >= v_excepcion.cupo_maximo THEN
    RETURN 'sin_cupo';
  END IF;

  SELECT estado INTO v_estado_actual
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
    WHERE excepcion_id = p_excepcion_id AND alumno_id = v_alumno_id;

    INSERT INTO clases_cambios
      (gimnasio_id, serie_id, user_id, alcance, tipo_cambio, fecha_desde_afectada)
    VALUES
      (v_gimnasio_id, NULL, v_user_id, 'una_clase', 'reserva_especial_reactivada', v_excepcion.fecha);

    RETURN 'ok';
  END IF;

  INSERT INTO clases_reservas
    (gimnasio_id, alumno_id, excepcion_id, estado)
  VALUES
    (v_gimnasio_id, v_alumno_id, p_excepcion_id, 'confirmada');

  INSERT INTO clases_cambios
    (gimnasio_id, serie_id, user_id, alcance, tipo_cambio, fecha_desde_afectada)
  VALUES
    (v_gimnasio_id, NULL, v_user_id, 'una_clase', 'reserva_especial_creada', v_excepcion.fecha);

  RETURN 'ok';
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 9. FUNCIÓN: cancelar_reserva_especial
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
  v_excepcion   clases_excepciones%ROWTYPE;
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

  SELECT * INTO v_excepcion
  FROM clases_excepciones
  WHERE id = p_excepcion_id AND gimnasio_id = v_gimnasio_id;

  IF NOT FOUND THEN
    RETURN 'clase_no_encontrada';
  END IF;

  SELECT estado INTO v_estado
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
  WHERE excepcion_id = p_excepcion_id AND alumno_id = v_alumno_id;

  INSERT INTO clases_cambios
    (gimnasio_id, serie_id, user_id, alcance, tipo_cambio, fecha_desde_afectada)
  VALUES
    (v_gimnasio_id, NULL, v_user_id, 'una_clase', 'reserva_especial_cancelada', v_excepcion.fecha);

  RETURN 'ok';
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 10. FUNCIÓN: modificar_cupo_version  (punto 6)
--     Cambia el cupo de una versión. Si el nuevo cupo es menor
--     que las reservas confirmadas existentes, rechaza el cambio.
--     Solo pueden llamarla gym_admins del gimnasio correspondiente.
--
--     Retorna:
--       'ok'
--       'cupo_insuficiente'  → nuevo cupo < confirmadas actuales
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
  v_confirmadas   int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 'no_autenticado';
  END IF;

  IF p_nuevo_cupo IS NULL OR p_nuevo_cupo <= 0 THEN
    RETURN 'cupo_invalido';
  END IF;

  -- Recuperar la versión y su gimnasio a través de la serie
  SELECT cs.gimnasio_id, cv.serie_id, cv.cupo_maximo
  INTO v_gimnasio_id, v_serie_id, v_cupo_anterior
  FROM clases_versiones cv
  JOIN clases_series cs ON cs.id = cv.serie_id
  WHERE cv.id = p_version_id;

  IF NOT FOUND THEN
    RETURN 'version_no_encontrada';
  END IF;

  -- Verificar que el llamador es admin del gimnasio
  IF NOT EXISTS (
    SELECT 1 FROM gym_admins
    WHERE user_id = v_user_id AND gimnasio_id = v_gimnasio_id
  ) THEN
    RETURN 'sin_permiso';
  END IF;

  -- Si se reduce el cupo, verificar que no hay más confirmadas que el nuevo cupo
  IF p_nuevo_cupo < v_cupo_anterior THEN
    SELECT COUNT(*) INTO v_confirmadas
    FROM clases_reservas r
    JOIN clases_versiones cv ON cv.serie_id = r.serie_id
    WHERE cv.id = p_version_id
      AND r.estado = 'confirmada'
      AND r.fecha_ocurrencia >= cv.fecha_desde
      AND (cv.fecha_hasta IS NULL OR r.fecha_ocurrencia <= cv.fecha_hasta);

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
-- 11. FUNCIÓN: cambio_permanente_version  (punto 7)
--     Cierra la versión vigente y abre una nueva a partir de
--     p_nueva_fecha_desde. Todo ocurre en una sola transacción.
--
--     Validaciones:
--     - El llamador debe ser admin del gimnasio de la serie.
--     - p_nueva_fecha_desde debe ser posterior a hoy (AR).
--     - Debe existir una versión abierta (sin fecha_hasta) para
--       (serie_id, dia_semana). Si no existe, se crea directamente.
--     - Los campos de la nueva versión deben ser válidos.
--
--     Retorna jsonb con:
--       { "resultado": "ok", "reservas_afectadas": N }
--       { "resultado": "error", "detalle": "..." }
--
--     Posibles detalles de error:
--       'no_autenticado', 'sin_permiso', 'serie_no_encontrada',
--       'fecha_invalida', 'instructor_invalido', 'cupo_invalido',
--       'duracion_invalida', 'version_activa_no_encontrada'
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
  v_user_id           uuid;
  v_gimnasio_id       uuid;
  v_version_activa    clases_versiones%ROWTYPE;
  v_hoy_ar            date;
  v_reservas_afectadas int;
  v_nueva_version_id  uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'no_autenticado');
  END IF;

  -- Recuperar gimnasio de la serie
  SELECT gimnasio_id INTO v_gimnasio_id
  FROM clases_series
  WHERE id = p_serie_id AND activa;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'serie_no_encontrada');
  END IF;

  -- Verificar admin del gimnasio
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
  IF p_instructor IS NULL OR p_instructor = '' THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'instructor_invalido');
  END IF;
  IF p_cupo_maximo IS NULL OR p_cupo_maximo <= 0 THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'cupo_invalido');
  END IF;
  IF p_duracion_minutos IS NULL OR p_duracion_minutos <= 0 THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'duracion_invalida');
  END IF;

  -- Buscar versión vigente (sin fecha_hasta) para (serie, día)
  SELECT * INTO v_version_activa
  FROM clases_versiones
  WHERE serie_id = p_serie_id
    AND dia_semana = p_dia_semana
    AND fecha_hasta IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('resultado', 'error', 'detalle', 'version_activa_no_encontrada');
  END IF;

  -- Contar reservas confirmadas afectadas (desde p_nueva_fecha_desde en adelante)
  SELECT COUNT(*) INTO v_reservas_afectadas
  FROM clases_reservas
  WHERE serie_id = p_serie_id
    AND fecha_ocurrencia >= p_nueva_fecha_desde
    AND estado = 'confirmada';

  -- Cerrar la versión actual: fecha_hasta = p_nueva_fecha_desde - 1
  UPDATE clases_versiones
  SET fecha_hasta = p_nueva_fecha_desde - 1
  WHERE id = v_version_activa.id;

  -- Crear la nueva versión
  INSERT INTO clases_versiones
    (serie_id, dia_semana, hora_inicio, duracion_minutos, cupo_maximo,
     instructor, descripcion, fecha_desde, fecha_hasta)
  VALUES
    (p_serie_id, p_dia_semana, p_hora_inicio, p_duracion_minutos, p_cupo_maximo,
     p_instructor, p_descripcion, p_nueva_fecha_desde, NULL)
  RETURNING id INTO v_nueva_version_id;

  -- Auditoría (punto 7 + punto 8)
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
      'version_id',        v_version_activa.id,
      'hora_inicio',       v_version_activa.hora_inicio,
      'duracion_minutos',  v_version_activa.duracion_minutos,
      'cupo_maximo',       v_version_activa.cupo_maximo,
      'instructor',        v_version_activa.instructor,
      'descripcion',       v_version_activa.descripcion,
      'fecha_desde',       v_version_activa.fecha_desde
    ),
    jsonb_build_object(
      'version_id',        v_nueva_version_id,
      'hora_inicio',       p_hora_inicio,
      'duracion_minutos',  p_duracion_minutos,
      'cupo_maximo',       p_cupo_maximo,
      'instructor',        p_instructor,
      'descripcion',       p_descripcion,
      'fecha_desde',       p_nueva_fecha_desde
    )
  );

  RETURN jsonb_build_object('resultado', 'ok', 'reservas_afectadas', v_reservas_afectadas);
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 12. PERMISOS  (punto 1 y punto 11)
--     Quitar acceso público a todas las funciones.
--     Solo usuarios autenticados pueden ejecutarlas.
-- ════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION reservar_ocurrencia(uuid, date)            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cancelar_reserva_ocurrencia(uuid, date)    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION reservar_clase_especial(uuid)              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cancelar_reserva_especial(uuid)            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION modificar_cupo_version(uuid, int)          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cambio_permanente_version(uuid, smallint, date, time, int, int, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION reservar_ocurrencia(uuid, date)             TO authenticated;
GRANT EXECUTE ON FUNCTION cancelar_reserva_ocurrencia(uuid, date)     TO authenticated;
GRANT EXECUTE ON FUNCTION reservar_clase_especial(uuid)               TO authenticated;
GRANT EXECUTE ON FUNCTION cancelar_reserva_especial(uuid)             TO authenticated;
-- modificar_cupo_version y cambio_permanente_version: accesibles desde
-- authenticated (la función verifica internamente si es gym_admin)
GRANT EXECUTE ON FUNCTION modificar_cupo_version(uuid, int)           TO authenticated;
GRANT EXECUTE ON FUNCTION cambio_permanente_version(uuid, smallint, date, time, int, int, text, text) TO authenticated;
