-- Imagen opcional en comunicados
ALTER TABLE public.comunicados
  ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Storage bucket para imágenes de comunicados
INSERT INTO storage.buckets (id, name, public)
VALUES ('comunicados', 'comunicados', true)
ON CONFLICT DO NOTHING;

-- Política: cualquier autenticado puede leer
CREATE POLICY "comunicados_images_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comunicados');

-- Política: service role puede escribir/borrar
CREATE POLICY "comunicados_images_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'comunicados');

CREATE POLICY "comunicados_images_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'comunicados');
