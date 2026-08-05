-- AI monetization: trial + paid tiers
-- Rollback: ALTER TABLE gimnasios DROP COLUMN ai_trial_start, DROP COLUMN ai_paid_until;

ALTER TABLE gimnasios
  ADD COLUMN IF NOT EXISTS ai_trial_start timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_paid_until date DEFAULT NULL;

-- All gyms get AI access by default (trial system handles the rest)
ALTER TABLE gimnasios ALTER COLUMN ai_enabled SET DEFAULT true;
UPDATE gimnasios SET ai_enabled = true;
