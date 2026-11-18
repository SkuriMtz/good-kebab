-- 0035: tareas que investigan en internet (por ejemplo, «cada lunes investiga 5
-- proveedores y mándales un correo»).
-- - internet: la tarea busca y abre páginas cuando corre (modelo Avanzado).
-- - contactados: a quién ya le escribió (o le dejó listo el correo) esa tarea,
--   para no repetir proveedor. Lo escribe el servidor; tope de 500.

alter table public.tareas add column if not exists internet boolean not null default false;
alter table public.tareas add column if not exists contactados text[] not null default '{}';

alter table public.tareas drop constraint if exists tareas_contactados_tope;
alter table public.tareas add constraint tareas_contactados_tope check (cardinality(contactados) <= 500);
