-- ============================================================
-- 0029 · Vigilar más cosas (fase 4 de los avisos)
-- - correos_vistos: recuerda los correos importantes (su hilo y quién lo
--   mandó) para avisar si en un día nadie les contestó (aviso 14).
-- - fallos_apps + contar_fallo_app(): cuántas veces falló hoy cada app de
--   su lado (aviso 34). Solo el servidor.
-- - agenda_vista + agenda_cuentas: la foto de los próximos 14 días de tu
--   agenda, para avisar citas nuevas, movidas, canceladas, que chocan, la
--   próxima y la de mañana (avisos 6 a 10). Solo el servidor.
-- - pedir_trabajo(): además pide /api/trabajo?que=agenda cuando hay alguna
--   cuenta con Google Calendar o el calendario de Outlook conectado.
-- ============================================================

-- Correos importantes que hay que vigilar
alter table public.correos_vistos
  add column if not exists importante boolean not null default false,
  add column if not exists hilo text check (hilo is null or char_length(hilo) between 1 and 400),
  add column if not exists recibido_en timestamptz,
  add column if not exists revisado_en timestamptz,
  add column if not exists de text check (de is null or char_length(de) <= 160),
  add column if not exists asunto text check (asunto is null or char_length(asunto) <= 200);
create index if not exists correos_vistos_sin_respuesta on public.correos_vistos (owner_id, visto_en) where importante and revisado_en is null;

-- Fallas de cada app, por día
create table if not exists public.fallos_apps (
  owner_id uuid not null references auth.users(id) on delete cascade,
  app text not null check (app ~ '^[a-z0-9_]{2,40}$'),
  dia date not null default current_date,
  veces integer not null default 0 check (veces >= 0),
  primary key (owner_id, app, dia)
);
alter table public.fallos_apps enable row level security;
revoke all on public.fallos_apps from anon, authenticated;

create or replace function public.contar_fallo_app(p_owner uuid, p_app text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  insert into public.fallos_apps (owner_id, app, dia, veces)
  values (p_owner, p_app, current_date, 1)
  on conflict (owner_id, app, dia) do update set veces = public.fallos_apps.veces + 1
  returning veces into n;
  -- La primera del día limpia lo de hace más de una semana
  if n = 1 then
    delete from public.fallos_apps f where f.owner_id = p_owner and f.dia < current_date - 7;
  end if;
  return n;
end;
$$;
revoke execute on function public.contar_fallo_app(uuid, text) from public, anon, authenticated;
grant execute on function public.contar_fallo_app(uuid, text) to service_role;

-- La foto de tu agenda
create table if not exists public.agenda_vista (
  owner_id uuid not null references auth.users(id) on delete cascade,
  proveedor text not null check (proveedor in ('google', 'microsoft')),
  evento_id text not null check (char_length(evento_id) between 1 and 400),
  inicio timestamptz not null,
  fin timestamptz not null,
  todo_el_dia boolean not null default false,
  titulo text check (titulo is null or char_length(titulo) <= 200),
  visto_en timestamptz not null default now(),
  primary key (owner_id, proveedor, evento_id)
);
create index if not exists agenda_vista_fin on public.agenda_vista (owner_id, fin);
alter table public.agenda_vista enable row level security;
revoke all on public.agenda_vista from anon, authenticated;

create table if not exists public.agenda_cuentas (
  owner_id uuid not null references auth.users(id) on delete cascade,
  proveedor text not null check (proveedor in ('google', 'microsoft')),
  revisado_en timestamptz not null default now(),
  primary key (owner_id, proveedor)
);
alter table public.agenda_cuentas enable row level security;
revoke all on public.agenda_cuentas from anon, authenticated;

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
  hay_agenda boolean := exists (select 1 from public.conexiones c where c.estado = 'activa' and c.apps && array['google_calendar', 'outlook_calendar']::text[]);
  hay_avisos boolean := exists (select 1 from public.avisos_salida a where a.app = 'pendiente' and a.enviar_desde <= now())
    or exists (select 1 from public.avisos_salida a where a.whatsapp = 'pendiente' and coalesce(a.wa_desde, a.enviar_desde) <= now())
    or exists (select 1 from public.informes_que_tocan());
begin
  if not hay_revisiones and not hay_tareas and not hay_correos and not hay_agenda and not hay_avisos then
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
  if hay_agenda then
    perform net.http_post(
      url := 'https://good-kebab.vercel.app/api/trabajo?que=agenda',
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
