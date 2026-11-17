-- ============================================================
-- 0034 · Acceso sin contraseñas: alta de cuenta y consentimientos
-- Lo usan /api/acceso/codigo, /api/acceso/verificar, /api/acceso/acepto y
-- /auth/callback (src/lib/acceso-servidor.ts).
--
-- 1. altas_pendientes: los datos del alta mientras llega el código al correo.
--    Clave = hash del correo (nunca el correo) + hash del secreto de la cookie
--    atendel_alta: cada navegador tiene su propia fila y nadie pisa la de otro.
--    Solo el servidor. Vence a las 24 h.
-- 2. consentimientos: qué versión de los Términos y del Aviso de privacidad
--    aceptó cada quien y cuándo. El dueño lee los suyos; solo el servidor escribe.
-- 3. perfil_dueno: nombre, fecha de nacimiento y teléfono de quien abre la
--    cuenta. El dueño lee y cambia lo suyo; solo el servidor crea la fila.
-- 4. perfil_negocio.tipo: el tipo de negocio (id de src/lib/tipos-negocio.ts).
-- 5. Limpieza diaria: también borra las altas pendientes de más de 24 h.
--
-- Todo lo que apunta a auth.users lleva ON DELETE CASCADE: borrar la cuenta
-- borra todo esto. Se puede correr dos veces sin romper nada.
-- ============================================================

-- 1. Altas pendientes (solo servidor) ---------------------------
create table if not exists public.altas_pendientes (
  correo_hash text not null check (correo_hash ~ '^[0-9a-f]{64}$'),
  datos jsonb not null default '{}'::jsonb check (jsonb_typeof(datos) = 'object' and pg_column_size(datos) <= 4096),
  acepta_version text not null check (acepta_version ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  secreto_hash text not null check (secreto_hash ~ '^[0-9a-f]{64}$'),
  ip_hash text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{16,64}$'),
  creado_en timestamptz not null default now(),
  primary key (correo_hash, secreto_hash)
);
create index if not exists altas_pendientes_fecha on public.altas_pendientes (creado_en);
alter table public.altas_pendientes enable row level security;
revoke all on table public.altas_pendientes from anon, authenticated;
grant select, insert, update, delete on table public.altas_pendientes to service_role;

-- 2. Consentimientos ---------------------------------------------
create table if not exists public.consentimientos (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  documento text not null check (documento in ('terminos', 'privacidad')),
  version text not null check (version ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  aceptado_en timestamptz not null default now(),
  ip_hash text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{16,64}$'),
  unique (owner_id, documento, version)
);
alter table public.consentimientos enable row level security;
revoke all on table public.consentimientos from anon, authenticated;
-- Con sesión solo se lee (y solo lo suyo); nadie con sesión inserta, cambia ni borra
grant select on table public.consentimientos to authenticated;
grant select, insert, update, delete on table public.consentimientos to service_role;

drop policy if exists "consentimientos: el dueño lee los suyos" on public.consentimientos;
create policy "consentimientos: el dueño lee los suyos"
  on public.consentimientos for select to authenticated
  using ((select auth.uid()) = owner_id);

-- 3. Perfil del dueño --------------------------------------------
create table if not exists public.perfil_dueno (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  nombre text check (nombre is null or char_length(nombre) between 1 and 120),
  -- No futura, desde 1900 y mayor de edad (la app revisa lo mismo con la fecha de México)
  nacimiento date check (
    nacimiento is null
    or (nacimiento >= date '1900-01-01' and nacimiento <= current_date and nacimiento <= (current_date - interval '18 years'))
  ),
  telefono text check (telefono is null or (char_length(telefono) <= 30 and telefono ~ '^\+?[0-9 ()-]+$')),
  actualizado_en timestamptz not null default now()
);
alter table public.perfil_dueno enable row level security;
revoke all on table public.perfil_dueno from anon, authenticated;
-- El dueño lee lo suyo y cambia sus datos (nunca owner_id); crear la fila: solo el servidor
grant select on table public.perfil_dueno to authenticated;
grant update (nombre, nacimiento, telefono, actualizado_en) on table public.perfil_dueno to authenticated;
grant select, insert, update, delete on table public.perfil_dueno to service_role;

drop policy if exists "perfil_dueno: el dueño lee el suyo" on public.perfil_dueno;
create policy "perfil_dueno: el dueño lee el suyo"
  on public.perfil_dueno for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "perfil_dueno: el dueño edita el suyo" on public.perfil_dueno;
create policy "perfil_dueno: el dueño edita el suyo"
  on public.perfil_dueno for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- 4. Tipo de negocio ---------------------------------------------
alter table public.perfil_negocio
  add column if not exists tipo text check (tipo is null or (char_length(tipo) <= 40 and tipo ~ '^[a-z0-9_]+$'));

-- 5. Limpieza diaria (4:17 UTC): la misma de 0030 + altas pendientes vencidas.
--    cron.schedule con el mismo nombre reemplaza la tarea que ya existía.
select cron.schedule(
  'atendel-limpieza-seguridad',
  '17 4 * * *',
  $$delete from public.eventos_seguridad where creado_en < now() - interval '90 days'; delete from public.limites where vence < now() - interval '1 day'; delete from public.altas_pendientes where creado_en < now() - interval '24 hours';$$
);
