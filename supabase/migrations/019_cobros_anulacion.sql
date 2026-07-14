-- Audit trail para cobros: anulación en lugar de borrado (modelo bancario/contable)
ALTER TABLE public.cobros
  ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'anulado')),
  ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT,
  ADD COLUMN IF NOT EXISTS anulado_por TEXT,
  ADD COLUMN IF NOT EXISTS anulado_at TIMESTAMPTZ;

-- Index para filtrar cobros activos / anulados por gimnasio
CREATE INDEX IF NOT EXISTS idx_cobros_estado ON public.cobros(gimnasio_id, estado);
