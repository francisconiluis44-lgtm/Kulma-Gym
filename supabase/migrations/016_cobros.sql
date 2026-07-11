create table if not exists public.cobros (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  gimnasio_id uuid not null references public.gimnasios(id) on delete cascade,
  monto numeric(10,2) not null,
  fecha date not null default (current_date at time zone 'America/Argentina/Buenos_Aires'),
  metodo text not null check (metodo in ('efectivo', 'transferencia', 'tarjeta', 'otro')) default 'efectivo',
  notas text,
  created_at timestamptz default now()
);
