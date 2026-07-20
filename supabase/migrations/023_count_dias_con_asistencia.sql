create or replace function public.count_dias_con_asistencia(
  p_gimnasio_id uuid,
  p_desde       date
)
returns bigint
language sql
security definer
as $$
  select count(distinct fecha)
  from public.asistencias
  where gimnasio_id = p_gimnasio_id
    and fecha >= p_desde;
$$;
