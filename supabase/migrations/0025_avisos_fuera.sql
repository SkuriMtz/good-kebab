-- ============================================================
-- 0025 · Avisos fuera del panel: notificaciones de la app (src/lib/notificar.ts)
--
-- Atendel te avisa también con notificaciones en tu celular o tu compu,
-- aunque no tengas el panel abierto.
-- - suscripciones_push: un renglón por aparato donde activaste los avisos.
--   El dueño ve y quita los suyos; solo el servidor los guarda (la ruta
--   /api/avisos/push revisa que la dirección sea de un servicio de push real).
-- - avisos_salida: cada aviso que sale (o espera para salir): sirve para no
--   repetir, juntar, respetar las horas de silencio y los topes. Solo servidor.
-- - Llaves VAPID (las que firman las notificaciones): el servidor las crea
--   la primera vez y se guardan en la bóveda (Vault). Solo el servidor
--   (service_role) las puede leer; nadie las ve ni las pega.
-- - pedir_trabajo(): también pide /api/trabajo?que=avisos cuando hay avisos
--   esperando su hora (horas de silencio o avisos que se juntan).
-- ============================================================

create table if not exists public.suscripciones_push (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 20 and 1000 and endpoint ~ '^https://'),
  p256dh text not null check (p256dh ~ '^[A-Za-z0-9_=-]{80,100}$'),
  auth text not null check (auth ~ '^[A-Za-z0-9_=-]{16,40}$'),
  aparato text not null default 'Aparato' check (char_length(aparato) between 1 and 60),
  creado_en timestamptz not null default now(),
  usado_en timestamptz
);
create index if not exists suscripciones_push_dueno on public.suscripciones_push (owner_id);
alter table public.suscripciones_push enable row level security;
revoke all on public.suscripciones_push from anon, authenticated;
grant select, delete on public.suscripciones_push to authenticated;

drop policy if exists "suscripciones_push: el dueño ve las suyas" on public.suscripciones_push;
create policy "suscripciones_push: el dueño ve las suyas"
  on public.suscripciones_push for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "suscripciones_push: el dueño quita las suyas" on public.suscripciones_push;
create policy "suscripciones_push: el dueño quita las suyas"
  on public.suscripciones_push for delete to authenticated
  using ((select auth.uid()) = owner_id);

create table if not exists public.avisos_salida (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo ~ '^[a-z0-9_]{3,40}$'),
  nivel text not null check (nivel in ('urgente', 'importante', 'info')),
  titulo text not null check (char_length(titulo) between 1 and 120),
  texto text not null check (char_length(texto) between 1 and 400),
  -- Solo enlaces del panel: nunca a otro sitio
  enlace text not null default '/panel' check (char_length(enlace) <= 300 and enlace ~ '^/panel(\?[A-Za-z0-9=&_.:%-]*)?$'),
  clave text check (clave is null or char_length(clave) between 1 and 200),
  grupo text check (grupo is null or grupo ~ '^[a-z0-9_]{2,30}$'),
  -- Cómo le fue en cada lugar: pendiente (espera su hora), enviado, junto (salió junto con otro), omitido o fallo
  app text not null default 'omitido' check (app in ('pendiente', 'enviado', 'junto', 'omitido', 'fallo')),
  whatsapp text not null default 'omitido' check (whatsapp in ('pendiente', 'enviado', 'junto', 'omitido', 'fallo')),
  -- Lo de seguridad pasa aunque sean horas de silencio
  siempre boolean not null default false,
  enviar_desde timestamptz not null default now(),
  enviado_en timestamptz,
  creado_en timestamptz not null default now(),
  unique (owner_id, clave)
);
create index if not exists avisos_salida_dueno on public.avisos_salida (owner_id, creado_en desc);
create index if not exists avisos_salida_esperando on public.avisos_salida (enviar_desde) where app = 'pendiente' or whatsapp = 'pendiente';
alter table public.avisos_salida enable row level security;
revoke all on public.avisos_salida from anon, authenticated;

-- Las llaves VAPID (en la bóveda). Solo el servidor.
create or replace function public.llaves_push()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select s.decrypted_secret::jsonb from vault.decrypted_secrets s where s.name = 'atendel_llaves_push' limit 1;
$$;
revoke execute on function public.llaves_push() from public, anon, authenticated;
grant execute on function public.llaves_push() to service_role;

-- Guarda las llaves la primera vez; si ya había, devuelve las que había (nunca las cambia)
create or replace function public.guardar_llaves_push(llaves jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  hay text;
begin
  if jsonb_typeof(llaves) is distinct from 'object'
    or coalesce(llaves->>'publica', '') !~ '^[A-Za-z0-9_-]{87}$'
    or coalesce(llaves->>'privada', '') !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'Llaves inválidas';
  end if;
  -- Si dos llamadas llegan juntas, la segunda se queda con las de la primera
  perform pg_advisory_xact_lock(hashtext('atendel_llaves_push'));
  select s.decrypted_secret into hay from vault.decrypted_secrets s where s.name = 'atendel_llaves_push';
  if hay is not null then
    return hay::jsonb;
  end if;
  perform vault.create_secret(
    jsonb_build_object('publica', llaves->>'publica', 'privada', llaves->>'privada')::text,
    'atendel_llaves_push',
    'Llaves VAPID de las notificaciones de Atendel (0025)'
  );
  return jsonb_build_object('publica', llaves->>'publica', 'privada', llaves->>'privada');
end;
$$;
revoke execute on function public.guardar_llaves_push(jsonb) from public, anon, authenticated;
grant execute on function public.guardar_llaves_push(jsonb) to service_role;

-- pedir_trabajo(): lo de 0024, más los avisos que ya tocan
create or replace function public.pedir_trabajo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  llave text;
  hay_revisiones boolean := exists (select 1 from public.revisiones r where r.trabajo_en is null and r.creado_en > now() - interval '36 hours');
  hay_tareas boolean := exists (select 1 from public.tareas t where t.activa and t.proxima <= now());
  hay_correos boolean := exists (select 1 from public.conexiones c where c.estado = 'activa' and c.apps && array['gmail', 'outlook']::text[]);
  hay_avisos boolean := exists (select 1 from public.avisos_salida a where (a.app = 'pendiente' or a.whatsapp = 'pendiente') and a.enviar_desde <= now());
begin
  if not hay_revisiones and not hay_tareas and not hay_correos and not hay_avisos then
    return;
  end if;
  select s.decrypted_secret into llave from vault.decrypted_secrets s where s.name = 'atendel_llave_trabajo';
  if llave is null then
    return;
  end if;
  if hay_tareas then
    perform net.http_post(
      url := 'https://good-kebab.vercel.app/api/trabajo?que=tareas',
      body := '{}'::jsonb,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-atendel-llave', llave),
      timeout_milliseconds := 60000
    );
  end if;
  if hay_revisiones then
    perform net.http_post(
      url := 'https://good-kebab.vercel.app/api/trabajo?que=revisiones',
      body := '{}'::jsonb,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-atendel-llave', llave),
      timeout_milliseconds := 60000
    );
  end if;
  if hay_correos then
    perform net.http_post(
      url := 'https://good-kebab.vercel.app/api/trabajo?que=correos',
      body := '{}'::jsonb,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-atendel-llave', llave),
      timeout_milliseconds := 60000
    );
  end if;
  if hay_avisos then
    perform net.http_post(
      url := 'https://good-kebab.vercel.app/api/trabajo?que=avisos',
      body := '{}'::jsonb,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-atendel-llave', llave),
      timeout_milliseconds := 60000
    );
  end if;
end;
$$;
revoke execute on function public.pedir_trabajo() from public, anon, authenticated;
