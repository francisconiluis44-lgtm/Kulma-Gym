-- ============================================================
-- SimpleGym IA — Migración Fase 1
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- 1. Agregar campos de IA a gimnasios
ALTER TABLE gimnasios
  ADD COLUMN IF NOT EXISTS ai_enabled           boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_daily_limit       integer      NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS ai_questions_today   integer      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_questions_reset_at date;

-- 2. Tabla de uso de IA (auditoría y control de costos)
CREATE TABLE IF NOT EXISTS ai_usage (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id      uuid          NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  user_id          uuid,
  question         text          NOT NULL,
  tool_used        text,
  input_tokens     integer       NOT NULL DEFAULT 0,
  output_tokens    integer       NOT NULL DEFAULT 0,
  estimated_cost   numeric(10,6) NOT NULL DEFAULT 0,
  response_time_ms integer,
  success          boolean       NOT NULL DEFAULT true,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_gimnasio_created
  ON ai_usage (gimnasio_id, created_at DESC);

-- 3. Habilitar IA para Kulma Gym (desarrollo)
-- Descomentar para activar:
-- UPDATE gimnasios SET ai_enabled = true WHERE slug = 'kulma-gym';
