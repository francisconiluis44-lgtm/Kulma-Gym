-- Configuración global del gimnasio (fila única)
CREATE TABLE IF NOT EXISTS public.configuracion (
  id                           INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  facebook_url                 TEXT,
  instagram_url                TEXT,
  instagram_suplementos_url    TEXT
);

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "configuracion_select_authenticated"
  ON public.configuracion FOR SELECT TO authenticated USING (true);

CREATE POLICY "configuracion_all_service_role"
  ON public.configuracion FOR ALL TO service_role USING (true);

-- Insertar fila inicial vacía
INSERT INTO public.configuracion (id) VALUES (1) ON CONFLICT DO NOTHING;
