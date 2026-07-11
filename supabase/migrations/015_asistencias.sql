create table if not exists public.asistencias (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  gimnasio_id uuid not null references public.gimnasios(id) on delete cascade,
  fecha date not null default (current_date at time zone 'America/Argentina/Buenos_Aires'),
  checked_in_at timestamptz not null default now(),
  tipo text not null check (tipo in ('alumno', 'admin')) default 'alumno',
  constraint asistencias_alumno_fecha_unique unique (alumno_id, fecha)
);
