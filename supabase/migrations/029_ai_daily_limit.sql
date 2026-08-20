-- Per-gym AI daily limit override (nullable = use global default)
ALTER TABLE gimnasios
  ADD COLUMN IF NOT EXISTS ai_daily_limit integer DEFAULT NULL;
