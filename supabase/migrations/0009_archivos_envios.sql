-- 0009 · Archivos que hace tu equipo, tu equipo del negocio y los envíos
--
-- Para "haz la presentación y mándasela al equipo por WhatsApp":
--  1. archivos: lo que tus agentes arman (por ahora presentaciones .pptx),
--     guardado en el bucket privado "archivos" (una carpeta por persona).
--  2. equipo_contactos: las personas de tu negocio y su WhatsApp (no entran
--     al panel; a ellas se les puede mandar algo).
--  3. envios: lo que un agente propone mandar. Nace "por_aprobar" y solo la
--     ruta /api/envios/[id] (con tu sesión, al aprobarlo) lo manda.
-- RLS en todo: cada quien ve y cambia solo lo suyo.

-- ------------------------------------------------------------
-- 1. EQUIPO
-- ------------------------------------------------------------
create table if not exists public.equipo_contactos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  rol text not null default '' check (char_length(rol) <= 60),
  whatsapp text not null check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  creado_en timestamptz not null default now()
);
create index if not exists equipo_contactos_dueno on public.equipo_contactos (owner_id, creado_en);
alter table public.equipo_contactos enable row level security;

drop policy if exists "equipo_contactos: el dueño lee los suyos" on public.equipo_contactos;
create policy "equipo_contactos: el dueño lee los suyos" on public.equipo_contactos for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "equipo_contactos: el dueño agrega" on public.equipo_contactos;
create policy "equipo_contactos: el dueño agrega" on public.equipo_contactos for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists "equipo_contactos: el dueño edita" on public.equipo_contactos;
create policy "equipo_contactos: el dueño edita" on public.equipo_contactos for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "equipo_contactos: el dueño borra" on public.equipo_contactos;
create policy "equipo_contactos: el dueño borra" on public.equipo_contactos for delete to authenticated using ((select auth.uid()) = owner_id);

-- ------------------------------------------------------------
-- 2. ARCHIVOS
-- ------------------------------------------------------------
create table if not exists public.archivos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  conversacion_id uuid references public.conversaciones(id) on delete set null,
  agente text check (agente is null or agente in ('lola', 'clara', 'victor', 'iris')),
  nombre text not null check (char_length(nombre) between 1 and 120),
  tipo text not null check (tipo in ('pptx')),
  ruta text not null check (char_length(ruta) between 1 and 300),
  bytes integer not null default 0 check (bytes >= 0),
  creado_en timestamptz not null default now()
);
create index if not exists archivos_dueno on public.archivos (owner_id, creado_en desc);
alter table public.archivos enable row level security;

drop policy if exists "archivos: el dueño lee los suyos" on public.archivos;
create policy "archivos: el dueño lee los suyos" on public.archivos for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "archivos: el dueño crea" on public.archivos;
create policy "archivos: el dueño crea" on public.archivos for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists "archivos: el dueño borra" on public.archivos;
create policy "archivos: el dueño borra" on public.archivos for delete to authenticated using ((select auth.uid()) = owner_id);

-- ------------------------------------------------------------
-- 3. ENVÍOS (siempre con tu visto bueno)
-- ------------------------------------------------------------
create table if not exists public.envios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  canal text not null default 'whatsapp' check (canal in ('whatsapp')),
  archivo_id uuid references public.archivos(id) on delete set null,
  conversacion_id uuid references public.conversaciones(id) on delete set null,
  agente text check (agente is null or agente in ('lola', 'clara', 'victor', 'iris')),
  -- [{ "nombre": "Luis", "whatsapp": "+52…" }]: una copia, por si luego cambia el contacto
  destinatarios jsonb not null check (jsonb_typeof(destinatarios) = 'array' and jsonb_array_length(destinatarios) between 1 and 50),
  mensaje text not null check (char_length(mensaje) between 1 and 1000),
  estado text not null default 'por_aprobar' check (estado in ('por_aprobar', 'aprobado', 'enviado', 'descartado', 'error')),
  error text check (error is null or char_length(error) <= 500),
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz
);
create index if not exists envios_dueno_estado on public.envios (owner_id, estado, creado_en desc);
alter table public.envios enable row level security;

drop policy if exists "envios: el dueño lee los suyos" on public.envios;
create policy "envios: el dueño lee los suyos" on public.envios for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "envios: el dueño crea" on public.envios;
create policy "envios: el dueño crea" on public.envios for insert to authenticated with check ((select auth.uid()) = owner_id and estado = 'por_aprobar');
drop policy if exists "envios: el dueño resuelve" on public.envios;
create policy "envios: el dueño resuelve" on public.envios for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- ------------------------------------------------------------
-- 4. STORAGE: bucket privado "archivos" (máximo 10 MB por archivo)
-- Cada persona solo lee, sube y borra en su carpeta "{su id}/...".
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('archivos', 'archivos', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "archivos (storage): el dueño lee su carpeta" on storage.objects;
create policy "archivos (storage): el dueño lee su carpeta"
  on storage.objects for select to authenticated
  using (bucket_id = 'archivos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "archivos (storage): el dueño sube a su carpeta" on storage.objects;
create policy "archivos (storage): el dueño sube a su carpeta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'archivos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "archivos (storage): el dueño borra en su carpeta" on storage.objects;
create policy "archivos (storage): el dueño borra en su carpeta"
  on storage.objects for delete to authenticated
  using (bucket_id = 'archivos' and (storage.foldername(name))[1] = (select auth.uid())::text);
