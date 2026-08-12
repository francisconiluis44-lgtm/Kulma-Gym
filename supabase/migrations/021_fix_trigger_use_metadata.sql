-- Fix trigger: use gimnasio_id in metadata instead of email domain pattern.
-- The old check (email LIKE '%@kulmagym.app' OR ...) missed emails like
-- @kulmagym.fit, leaving some students without an alumnos record.
-- Any user created by the registration API will always have gimnasio_id in metadata.
CREATE OR REPLACE FUNCTION public.handle_new_alumno()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gimnasio_id UUID;
BEGIN
  -- Only act on student registrations (always carry gimnasio_id in metadata)
  IF (NEW.raw_user_meta_data ->> 'gimnasio_id') IS NULL THEN
    RETURN NEW;
  END IF;

  v_gimnasio_id := (NEW.raw_user_meta_data ->> 'gimnasio_id')::UUID;

  INSERT INTO public.alumnos (
    id, nombre_completo, dni, whatsapp, email, fecha_nacimiento, gimnasio_id
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
      ELSE (NEW.raw_user_meta_data ->> 'fecha_nacimiento')::DATE
    END,
    v_gimnasio_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Heal: create missing alumnos records for users registered during the
-- broken-domain period (they have gimnasio_id in metadata but no alumnos row).
INSERT INTO public.alumnos (
  id, nombre_completo, dni, whatsapp, email, fecha_nacimiento, gimnasio_id
)
SELECT
  u.id,
  u.raw_user_meta_data ->> 'nombre_completo',
  u.raw_user_meta_data ->> 'dni',
  u.raw_user_meta_data ->> 'whatsapp',
  NULLIF(u.raw_user_meta_data ->> 'email', ''),
  CASE
    WHEN COALESCE(u.raw_user_meta_data ->> 'fecha_nacimiento', '') = ''
      THEN NULL
    ELSE (u.raw_user_meta_data ->> 'fecha_nacimiento')::DATE
  END,
  (u.raw_user_meta_data ->> 'gimnasio_id')::UUID
FROM auth.users u
WHERE (u.raw_user_meta_data ->> 'gimnasio_id') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.alumnos a WHERE a.id = u.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.alumnos a
    WHERE a.dni = u.raw_user_meta_data ->> 'dni'
      AND a.gimnasio_id = (u.raw_user_meta_data ->> 'gimnasio_id')::UUID
  )
ON CONFLICT DO NOTHING;
