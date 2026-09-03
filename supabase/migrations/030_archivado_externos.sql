ALTER TABLE public.alumnos_externos ADD COLUMN IF NOT EXISTS archivado boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_alumnos_externos_archivado ON public.alumnos_externos (gimnasio_id, archivado);
