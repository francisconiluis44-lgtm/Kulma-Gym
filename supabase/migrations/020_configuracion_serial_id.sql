-- configuracion.id was INT DEFAULT 1 CHECK (id = 1) — single-tenant design.
-- With multi-tenant, every new gym needs its own row, so id must be a proper serial.
ALTER TABLE configuracion DROP CONSTRAINT IF EXISTS configuracion_id_check;

CREATE SEQUENCE IF NOT EXISTS configuracion_id_seq;
SELECT setval('configuracion_id_seq', COALESCE((SELECT MAX(id) FROM configuracion), 0));
ALTER TABLE configuracion ALTER COLUMN id SET DEFAULT nextval('configuracion_id_seq');
