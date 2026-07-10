alter table configuracion add column if not exists gimnasio_id uuid references gimnasios(id);

-- Vincular fila existente a Kulma Gym
update configuracion
set gimnasio_id = (select id from gimnasios where slug = 'kulma-gym')
where id = 1;

alter table configuracion
  add constraint if not exists configuracion_gimnasio_id_key unique (gimnasio_id);
