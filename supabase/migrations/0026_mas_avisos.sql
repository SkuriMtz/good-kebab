-- ============================================================
-- 0026 · Más avisos (src/lib/notificar.ts y src/lib/informe.ts)
--
-- - entradas: desde qué aparatos entraste a tu cuenta (una cookie del
--   aparato, guardada con hash). Si entras desde uno nuevo, te avisa en los
--   demás. Solo la usa el servidor.
-- - suscripciones_push.aparato_id: el aparato de cada suscripción, para no
--   avisarle al mismo aparato que hizo un cambio.
-- - avisos_salida.revisar: los recordatorios se revisan justo antes de
--   salir (si ya lo resolviste, no salen). avisos_salida.chat y .agente:
--   los avisos que nacen en la base (como un cambio de plan) se escriben en
--   el chat cuando salen.
-- - informes_que_tocan(): a quién le toca el informe de la semana o el
--   resumen del día (según su día, su hora y su zona). Solo service_role.
-- - Si cambia tu plan, un aviso (trigger en suscripciones).
-- - pedir_trabajo(): también pide /api/trabajo?que=avisos cuando toca un informe.
-- ============================================================

create table if not exists public.entradas (
  owner_id uuid not null references auth.users(id) on delete cascade,
  aparato text not null check (aparato ~ '^[0-9a-f]{64}$'),
  nombre text not null default 'Aparato' check (char_length(nombre) between 1 and 60),
  creado_en timestamptz not null default now(),
  visto_en timestamptz not null default now(),
  primary key (owner_id, aparato)
);
alter table public.entradas enable row level security;
revoke all on public.entradas from anon, authenticated;

alter table public.suscripciones_push
  add column if not exists aparato_id text check (aparato_id is null or aparato_id ~ '^[0-9a-f]{64}$');

alter table public.avisos_salida
  add column if not exists revisar text check (revisar is null or revisar ~ '^(whatsapp|accion|oficina):[0-9a-f-]{36}$'),
  add column if not exists chat text check (chat is null or char_length(chat) between 1 and 4000),
  add column if not exists agente text check (agente is null or agente in ('lola', 'clara', 'victor', 'iris'));

-- Una zona horaria que sí existe (si no, la de la Ciudad de México)
create or replace function public.zona_segura(z text)
returns text
language plpgsql
stable
set search_path = ''
as $$
begin
  if z is null or z = '' or char_length(z) > 64 then
    return 'America/Mexico_City';
  end if;
  perform now() at time zone z;
  return z;
exception when others then
  return 'America/Mexico_City';
end;
$$;
revoke execute on function public.zona_segura(text) from public, anon, authenticated;

-- A quién le toca hoy el informe de la semana o el resumen del día (una vez)
create or replace function public.informes_que_tocan()
returns table (owner_id uuid, tipo text)
language sql
stable
security definer
set search_path = ''
as $$
  with cuentas as (
    select
      u.id as owner_id,
      coalesce(a.datos -> 'avisos', '{}'::jsonb) as av,
      (now() at time zone public.zona_segura(a.datos ->> 'zonaHoraria')) as local
    from auth.users u
    left join public.ajustes_cuenta a on a.owner_id = u.id
    where u.deleted_at is null
      and coalesce(u.is_anonymous, false) = false
      and (u.banned_until is null or u.banned_until < now())
  )
  select c.owner_id, 'informe_semana'::text
  from cuentas c
  where coalesce(c.av ->> 'informe', 'true') <> 'false'
    and extract(isodow from c.local) = case when (c.av ->> 'diaInforme') ~ '^[1-7]$' then (c.av ->> 'diaInforme')::int else 1 end
    and c.local::time >= case when (c.av ->> 'horaInforme') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then (c.av ->> 'horaInforme')::time else time '09:00' end
    and not exists (select 1 from public.avisos_salida s where s.owner_id = c.owner_id and s.tipo = 'informe_semana' and s.creado_en > now() - interval '6 days')
  union all
  select c.owner_id, 'resumen_dia'::text
  from cuentas c
  where coalesce(c.av ->> 'resumen', 'false') = 'true'
    and c.local::time >= case when (c.av ->> 'horaResumen') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then (c.av ->> 'horaResumen')::time else time '19:00' end
    and not exists (select 1 from public.avisos_salida s where s.owner_id = c.owner_id and s.tipo = 'resumen_dia' and s.creado_en > now() - interval '20 hours');
$$;
revoke execute on function public.informes_que_tocan() from public, anon, authenticated;
grant execute on function public.informes_que_tocan() to service_role;

-- Cambió tu plan: un aviso (sale en la siguiente vuelta de pedir_trabajo)
create or replace function public.avisar_cambio_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.plan is distinct from old.plan then
    insert into public.avisos_salida (owner_id, tipo, nivel, titulo, texto, enlace, clave, app, agente, chat)
    values (
      new.owner_id,
      'plan_cambio',
      'importante',
      'Cambió tu plan',
      'Tu plan de Atendel cambió. Mira qué incluye en Ajustes → Plan y facturación.',
      '/panel?vista=ajustes&seccion=plan',
      'plan:' || left(coalesce(new.plan, ''), 40) || ':' || to_char(now(), 'YYYYMMDDHH24MISS'),
      'pendiente',
      'iris',
      'Tu plan de Atendel cambió. Mira qué incluye en [Ajustes → Plan y facturación](/panel?vista=ajustes&seccion=plan).'
    )
    on conflict (owner_id, clave) do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function public.avisar_cambio_plan() from public, anon, authenticated;
drop trigger if exists suscripciones_avisar_plan on public.suscripciones;
create trigger suscripciones_avisar_plan
  after update of plan on public.suscripciones
  for each row execute function public.avisar_cambio_plan();

-- pedir_trabajo(): lo de 0025, más los informes que tocan
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
  hay_avisos boolean := exists (select 1 from public.avisos_salida a where (a.app = 'pendiente' or a.whatsapp = 'pendiente') and a.enviar_desde <= now())
    or exists (select 1 from public.informes_que_tocan());
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
