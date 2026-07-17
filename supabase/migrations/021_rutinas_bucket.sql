-- Bucket público para PDFs de rutinas.
-- El upload lo hace siempre el admin vía service role (Server Action),
-- por lo que no necesita políticas RLS adicionales.
INSERT INTO storage.buckets (id, name, public)
VALUES ('rutinas', 'rutinas', true)
ON CONFLICT DO NOTHING;
