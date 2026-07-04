-- ============================================================
-- Kulma Gym – Fase 1: Schema inicial
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- 1. Tabla alumnos
CREATE TABLE IF NOT EXISTS public.alumnos (
  id               UUID         PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  nombre_completo  TEXT         NOT NULL,
  dni              TEXT         NOT NULL UNIQUE,
  whatsapp         TEXT         NOT NULL,
  email            TEXT,
  fecha_nacimiento DATE,
  fecha_alta       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Row Level Security
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alumnos_select_own"
  ON public.alumnos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. Función + Trigger: crea la fila en alumnos automáticamente
--    cuando se registra un nuevo usuario con email @kulmagym.app
CREATE OR REPLACE FUNCTION public.handle_new_alumno()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email LIKE '%@kulmagym.app' THEN
    INSERT INTO public.alumnos (
      id, nombre_completo, dni, whatsapp, email, fecha_nacimiento
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
        ELSE (NEW.raw_user_meta_data ->> 'fecha_nacimiento') :: DATE
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_alumno();
