create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nombre_gimnasio text,
  email text not null,
  whatsapp text not null,
  plan_interes text,
  mensaje text,
  created_at timestamptz default now()
);
