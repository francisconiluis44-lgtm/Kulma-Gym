-- ============================================================
-- Plan enforcement: add 'premium' tier
-- Plan values: 'basico' (Starter) | 'pro' | 'premium'
-- ============================================================

-- Update comment on column (informational)
COMMENT ON COLUMN public.gimnasios.plan IS '''basico'' | ''pro'' | ''premium''';

-- Set pilot gyms to premium so they can access all features
UPDATE public.gimnasios
SET plan = 'premium'
WHERE slug IN ('kulma-gym', 'fantasmin');
