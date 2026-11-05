-- ============================================================
-- TU NEGOCIO: perfil, documentos (con búsqueda) y apps conectadas
-- ============================================================
-- Qué agrega:
-- 1. perfil_negocio: lo que la IA sabe del negocio (una fila por persona).
-- 2. documentos y fragmentos_doc: los documentos que sube la persona
--    (PDF, Word, TXT, MD, links, Drive, Notion), partidos en fragmentos con
--    búsqueda de texto completo en español.
-- 3. conexiones: las apps conectadas (Google, Microsoft, Notion) con sus
--    tokens CIFRADOS (AES-256-GCM con la llave ATENDEL_LLAVE_CIFRADO, que
--    vive solo en Vercel). La base de datos nunca ve el token en claro.
-- 4. apps_interes: las apps "en camino" para las que la persona pidió "Avísame".
-- 5. El bucket privado "documentos" de Storage, con una carpeta por persona.
-- 6. buscar_fragmentos(): la búsqueda que usan los agentes en el chat.
--
-- Seguridad (RLS): en TODAS las tablas cada quien solo ve y toca lo suyo
-- (owner_id = auth.uid()). Los visitantes sin sesión (anon) no tienen
-- ningún permiso. Los límites de largo los revisa la base de datos aunque
-- alguien se salte la app.
--
-- Se puede correr dos veces sin romper nada: todo usa "if not exists",
-- "create or replace" o "drop ... if exists" antes de crear.
-- ============================================================


-- ------------------------------------------------------------
-- 1. PERFIL DEL NEGOCIO
-- Los campos son los de CAMPOS_PERFIL (src/lib/nucleo-tipos.ts),
-- cada uno de máximo 2000 caracteres (MAX_CAMPO_PERFIL).
-- ------------------------------------------------------------
create table if not exists public.perfil_negocio (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  a_que_se_dedica text not null default '' check (char_length(a_que_se_dedica) <= 2000),
  servicios_y_precios text not null default '' check (char_length(servicios_y_precios) <= 2000),
  horarios text not null default '' check (char_length(horarios) <= 2000),
  ubicacion text not null default '' check (char_length(ubicacion) <= 2000),
  formas_de_pago text not null default '' check (char_length(formas_de_pago) <= 2000),
  politicas text not null default '' check (char_length(politicas) <= 2000),
  tono text not null default '' check (char_length(tono) <= 2000),
  preguntas_frecuentes text not null default '' check (char_length(preguntas_frecuentes) <= 2000),
  algo_mas text not null default '' check (char_length(algo_mas) <= 2000),
  actualizado_en timestamptz not null default now()
);
alter table public.perfil_negocio enable row level security;

revoke all on table public.perfil_negocio from anon;
grant select, insert, update, delete on table public.perfil_negocio to authenticated;

drop policy if exists "perfil_negocio: el dueño lee el suyo" on public.perfil_negocio;
create policy "perfil_negocio: el dueño lee el suyo"
  on public.perfil_negocio for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "perfil_negocio: el dueño crea el suyo" on public.perfil_negocio;
create policy "perfil_negocio: el dueño crea el suyo"
  on public.perfil_negocio for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "perfil_negocio: el dueño edita el suyo" on public.perfil_negocio;
create policy "perfil_negocio: el dueño edita el suyo"
  on public.perfil_negocio for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "perfil_negocio: el dueño borra el suyo" on public.perfil_negocio;
create policy "perfil_negocio: el dueño borra el suyo"
  on public.perfil_negocio for delete to authenticated
  using ((select auth.uid()) = owner_id);


-- ------------------------------------------------------------
-- 2. DOCUMENTOS
-- tipo: los valores de TipoDocumento; estado: procesando → listo | error.
-- ruta: dónde está el archivo en Storage ("{owner_id}/{id}.{ext}"), solo
-- para archivos subidos. url: el link original (links, Drive, Notion).
-- ------------------------------------------------------------
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 200),
  tipo text not null check (tipo in ('pdf', 'docx', 'txt', 'md', 'link', 'drive', 'notion')),
  estado text not null default 'procesando' check (estado in ('procesando', 'listo', 'error')),
  error text check (error is null or char_length(error) <= 500),
  caracteres integer not null default 0 check (caracteres between 0 and 300000),
  ruta text check (ruta is null or (char_length(ruta) <= 300 and ruta like owner_id::text || '/%')),
  url text check (url is null or (char_length(url) <= 2000 and url ~* '^https?://')),
  creado_en timestamptz not null default now()
);
create index if not exists documentos_owner_fecha on public.documentos (owner_id, creado_en desc);
alter table public.documentos enable row level security;

-- La persona puede leer, crear y borrar sus documentos; de lo ya creado solo
-- se puede cambiar el nombre y el resultado del proceso (no la ruta, el
-- tipo, el link ni el dueño).
revoke all on table public.documentos from anon, authenticated;
grant select, insert, delete on table public.documentos to authenticated;
grant update (nombre, estado, error, caracteres) on table public.documentos to authenticated;

drop policy if exists "documentos: el dueño lee los suyos" on public.documentos;
create policy "documentos: el dueño lee los suyos"
  on public.documentos for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "documentos: el dueño crea los suyos" on public.documentos;
create policy "documentos: el dueño crea los suyos"
  on public.documentos for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "documentos: el dueño edita los suyos" on public.documentos;
create policy "documentos: el dueño edita los suyos"
  on public.documentos for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "documentos: el dueño borra los suyos" on public.documentos;
create policy "documentos: el dueño borra los suyos"
  on public.documentos for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- Límite de documentos por plan, revisado en la base de datos (por si alguien
-- se salta la app). Mismos números que MAX_DOCUMENTOS_POR_PLAN en
-- src/lib/nucleo-tipos.ts: free 3, one 20, max 100. Sin fila de plan = free.
-- Corre con los permisos de quien inserta (RLS: solo cuenta lo suyo) y un
-- candado por persona para que dos subidas al mismo tiempo no se pasen.
create or replace function public.revisar_limite_documentos()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  plan_actual text;
  maximo integer;
  actuales integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('documentos:' || new.owner_id::text, 0));
  select s.plan into plan_actual from public.suscripciones s where s.owner_id = new.owner_id;
  maximo := case coalesce(plan_actual, 'free') when 'max' then 100 when 'one' then 20 else 3 end;
  select count(*) into actuales from public.documentos d where d.owner_id = new.owner_id;
  if actuales >= maximo then
    raise exception 'Llegaste al límite de % documentos de tu plan. Borra alguno para agregar otro.', maximo
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.revisar_limite_documentos() from public, anon, authenticated;

drop trigger if exists documentos_limite_plan on public.documentos;
create trigger documentos_limite_plan
  before insert on public.documentos
  for each row execute function public.revisar_limite_documentos();


-- ------------------------------------------------------------
-- 3. FRAGMENTOS DE LOS DOCUMENTOS (para la búsqueda)
-- Cada documento se parte en fragmentos de ~1200 caracteres
-- (src/lib/documentos/trocear.ts). tsv se calcula solo, en español.
-- Máximo 500 fragmentos por documento (orden 0..499, sin repetir).
-- ------------------------------------------------------------
create table if not exists public.fragmentos_doc (
  id bigserial primary key,
  documento_id uuid not null references public.documentos(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  orden integer not null check (orden between 0 and 499),
  texto text not null check (char_length(texto) between 1 and 4000),
  tsv tsvector generated always as (to_tsvector('spanish'::regconfig, texto)) stored
);
create index if not exists fragmentos_doc_tsv on public.fragmentos_doc using gin (tsv);
create index if not exists fragmentos_doc_owner_documento on public.fragmentos_doc (owner_id, documento_id);
create unique index if not exists fragmentos_doc_documento_orden on public.fragmentos_doc (documento_id, orden);
alter table public.fragmentos_doc enable row level security;

revoke all on table public.fragmentos_doc from anon, authenticated;
grant select, insert, delete on table public.fragmentos_doc to authenticated;
grant usage, select on sequence public.fragmentos_doc_id_seq to authenticated;

drop policy if exists "fragmentos_doc: el dueño lee los suyos" on public.fragmentos_doc;
create policy "fragmentos_doc: el dueño lee los suyos"
  on public.fragmentos_doc for select to authenticated
  using ((select auth.uid()) = owner_id);

-- Solo en documentos propios (no en un documento_id ajeno que alguien invente)
drop policy if exists "fragmentos_doc: el dueño agrega en sus documentos" on public.fragmentos_doc;
create policy "fragmentos_doc: el dueño agrega en sus documentos"
  on public.fragmentos_doc for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and documento_id in (select d.id from public.documentos d where d.owner_id = (select auth.uid()))
  );

drop policy if exists "fragmentos_doc: el dueño borra los suyos" on public.fragmentos_doc;
create policy "fragmentos_doc: el dueño borra los suyos"
  on public.fragmentos_doc for delete to authenticated
  using ((select auth.uid()) = owner_id);


-- ------------------------------------------------------------
-- 4. APPS CONECTADAS (la usan las integraciones)
-- token_cifrado: los Tokens (access token, refresh token, expiración y
-- datos extra), ya cifrados en el servidor (src/lib/cifrado.ts); también
-- las llaves que pega la persona. Una conexión por proveedor.
-- ------------------------------------------------------------
create table if not exists public.conexiones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- Los proveedores son los de Proveedor (src/lib/nucleo-tipos.ts); vendrán más
  proveedor text not null check (proveedor ~ '^[a-z]{2,30}$'),
  -- Las apps son las de IdApp: palabras en minúscula con guion bajo
  apps text[] not null default '{}'
    check (cardinality(apps) <= 50 and array_to_string(apps, ',') ~ '^([a-z0-9_]{2,40}(,|$))*$'),
  cuenta text check (cuenta is null or char_length(cuenta) <= 320),
  scopes text[] not null default '{}' check (cardinality(scopes) <= 100),
  token_cifrado text not null check (char_length(token_cifrado) between 1 and 20000),
  estado text not null default 'activa' check (estado in ('activa', 'error')),
  error text check (error is null or char_length(error) <= 500),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (owner_id, proveedor)
);
alter table public.conexiones enable row level security;

revoke all on table public.conexiones from anon;
grant select, insert, update, delete on table public.conexiones to authenticated;

drop policy if exists "conexiones: el dueño lee las suyas" on public.conexiones;
create policy "conexiones: el dueño lee las suyas"
  on public.conexiones for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "conexiones: el dueño crea las suyas" on public.conexiones;
create policy "conexiones: el dueño crea las suyas"
  on public.conexiones for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "conexiones: el dueño edita las suyas" on public.conexiones;
create policy "conexiones: el dueño edita las suyas"
  on public.conexiones for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "conexiones: el dueño borra las suyas" on public.conexiones;
create policy "conexiones: el dueño borra las suyas"
  on public.conexiones for delete to authenticated
  using ((select auth.uid()) = owner_id);


-- ------------------------------------------------------------
-- 5. "AVÍSAME" DE LAS APPS EN CAMINO
-- app: los valores de IdApp (src/lib/nucleo-tipos.ts).
-- ------------------------------------------------------------
create table if not exists public.apps_interes (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  app text not null check (app ~ '^[a-z0-9_]{2,40}$'),
  creado_en timestamptz not null default now(),
  primary key (owner_id, app)
);
alter table public.apps_interes enable row level security;

revoke all on table public.apps_interes from anon, authenticated;
grant select, insert, delete on table public.apps_interes to authenticated;

drop policy if exists "apps_interes: el dueño lee las suyas" on public.apps_interes;
create policy "apps_interes: el dueño lee las suyas"
  on public.apps_interes for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "apps_interes: el dueño agrega las suyas" on public.apps_interes;
create policy "apps_interes: el dueño agrega las suyas"
  on public.apps_interes for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "apps_interes: el dueño quita las suyas" on public.apps_interes;
create policy "apps_interes: el dueño quita las suyas"
  on public.apps_interes for delete to authenticated
  using ((select auth.uid()) = owner_id);


-- ------------------------------------------------------------
-- 6. STORAGE: bucket privado "documentos" (máximo 10 MB por archivo)
-- Cada persona solo lee, sube y borra en su carpeta "{su id}/...".
-- No hay política de update: un archivo subido no se puede reemplazar.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "documentos (storage): el dueño lee su carpeta" on storage.objects;
create policy "documentos (storage): el dueño lee su carpeta"
  on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "documentos (storage): el dueño sube a su carpeta" on storage.objects;
create policy "documentos (storage): el dueño sube a su carpeta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "documentos (storage): el dueño borra en su carpeta" on storage.objects;
create policy "documentos (storage): el dueño borra en su carpeta"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);


-- ------------------------------------------------------------
-- 7. BÚSQUEDA EN LOS DOCUMENTOS
-- buscar_fragmentos('¿cuánto cuesta la limpieza?', 6) regresa los
-- fragmentos que mejor responden, del más al menos parecido.
-- SECURITY INVOKER: corre con los permisos de quien la llama, así que RLS
-- solo deja ver los fragmentos propios. Usa la sintaxis de
-- websearch_to_tsquery: "a b" pide las dos palabras, "a or b" cualquiera.
-- ------------------------------------------------------------
create or replace function public.buscar_fragmentos(consulta text, limite integer default 6)
returns table (documento_id uuid, nombre text, orden integer, texto text, rango real)
language sql
stable
security invoker
set search_path = ''
as $$
  select f.documento_id, d.nombre, f.orden, f.texto, pg_catalog.ts_rank(f.tsv, q.consulta) as rango
  from (select pg_catalog.websearch_to_tsquery('spanish'::regconfig, coalesce(consulta, '')) as consulta) as q
  join public.fragmentos_doc f on f.tsv @@ q.consulta
  join public.documentos d on d.id = f.documento_id and d.estado = 'listo'
  where f.owner_id = (select auth.uid())
  order by rango desc, f.documento_id, f.orden
  limit least(greatest(coalesce(limite, 6), 1), 20);
$$;

revoke execute on function public.buscar_fragmentos(text, integer) from public, anon;
grant execute on function public.buscar_fragmentos(text, integer) to authenticated;
