-- Galería de contenido: carpetas + archivos para organizar fotos/videos
-- (herramienta standalone, no atada a un gimnasio en particular)

CREATE TABLE IF NOT EXISTS public.galeria_carpetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.galeria_archivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carpeta_id UUID NOT NULL REFERENCES public.galeria_carpetas(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('imagen', 'video')),
  nombre_original TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS galeria_archivos_carpeta_id_idx
  ON public.galeria_archivos (carpeta_id);

ALTER TABLE public.galeria_carpetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria_archivos ENABLE ROW LEVEL SECURITY;

-- Herramienta interna: cualquier usuario autenticado (admin) puede administrar
CREATE POLICY "galeria_carpetas_all_authenticated"
  ON public.galeria_carpetas FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "galeria_archivos_all_authenticated"
  ON public.galeria_archivos FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Storage bucket para fotos/videos de la galería
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('galeria', 'galeria', true, 209715200) -- 200MB por archivo
ON CONFLICT DO NOTHING;

CREATE POLICY "galeria_files_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'galeria');

CREATE POLICY "galeria_files_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'galeria' AND auth.role() = 'authenticated');

CREATE POLICY "galeria_files_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'galeria' AND auth.role() = 'authenticated');
