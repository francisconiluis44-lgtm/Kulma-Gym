-- ============================================================
-- SaaS Phase 5: Multi-gym student registration
-- Updates the trigger so students of any gym (not just kulma-gym)
-- get an alumno record created automatically on signup.
-- Run in: Supabase → SQL Editor
-- ============================================================

-- Updated trigger: handles @kulmagym.app AND @*.simplegym.app
CREATE OR REPLACE FUNCTION public.handle_new_alumno()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gimnasio_id UUID;
BEGIN
  IF NEW.email LIKE '%@kulmagym.app' OR NEW.email LIKE '%.simplegym.app' THEN
    v_gimnasio_id := COALESCE(
      (NEW.raw_user_meta_data ->> 'gimnasio_id')::UUID,
      '00000000-0000-0000-0000-000000000001'
    );

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
    );
  END IF;
  RETURN NEW;
END;
$$;
