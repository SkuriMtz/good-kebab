-- ============================================================
-- 0015 · Revisión diaria: tus agentes revisan solos, todos los días
--
-- Cada hora, la base de datos (pg_cron) busca las cuentas a las que ya les
-- toca su revisión del día (la hora que eligieron en Ajustes, en su zona
-- horaria; por omisión las 8:00) y que todavía no la tienen. Para cada una,
-- cada agente revisa su parte con los datos reales de la cuenta y deja lo
-- que falta, con un enlace para resolverlo:
--   - Lola:   WhatsApp y calendario conectados; mensajes por aprobar o que fallaron.
--   - Clara:  el correo conectado; correos que esperan respuesta.
--   - Víctor: Google Business conectado; mensajes por aprobar.
--   - Iris:   archivos por revisar en la Oficina, documentos que no se leyeron,
--             si faltan documentos o datos del negocio.
-- No usa IA ni llaves: solo lee tablas. Sale una revisión por día y por
-- cuenta (si se repite, se actualiza). "Revisar ahora" la hace al momento.
--
-- Seguridad: las funciones que revisan cuentas son SECURITY DEFINER y nadie
-- de fuera las puede llamar (solo pg_cron). La persona solo lee sus
-- revisiones (RLS), solo puede marcarlas como leídas y solo puede pedir la
-- suya con revisar_ahora().
-- ============================================================

create extension if not exists pg_cron;

create table if not exists public.revisiones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  -- El día de la revisión, en la zona horaria de la cuenta
  fecha date not null,
  creado_en timestamptz not null default now(),
  -- [{ agente, faltan: [{ texto, href }] }]
  partes jsonb not null check (jsonb_typeof(partes) = 'array'),
  faltan integer not null default 0 check (faltan >= 0),
  leido_en timestamptz,
  unique (owner_id, fecha)
);
create index if not exists revisiones_dueno on public.revisiones (owner_id, fecha desc);
alter table public.revisiones enable row level security;

drop policy if exists "revisiones: el dueño lee las suyas" on public.revisiones;
create policy "revisiones: el dueño lee las suyas" on public.revisiones
  for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "revisiones: el dueño la marca leída" on public.revisiones;
create policy "revisiones: el dueño la marca leída" on public.revisiones
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

revoke all on public.revisiones from anon, authenticated;
grant select on public.revisiones to authenticated;
grant update (leido_en) on public.revisiones to authenticated;

-- ------------------------------------------------------------
-- Lo que revisa cada agente para una cuenta
-- ------------------------------------------------------------
create or replace function public.armar_revision(dueno uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  apps text[];
  con_google boolean;
  n integer;
  perfil record;
  faltan_datos text[] := '{}';
  lola jsonb := '[]';
  clara jsonb := '[]';
  victor jsonb := '[]';
  iris jsonb := '[]';
  item jsonb;
begin
  select coalesce(array_agg(distinct x), '{}') into apps
  from public.conexiones c, unnest(c.apps) x
  where c.owner_id = dueno and c.estado = 'activa';

  select coalesce((u.raw_app_meta_data -> 'providers') ? 'google', false) into con_google
  from auth.users u where u.id = dueno;

  -- Lola: atención por WhatsApp y citas
  if not ('whatsapp_business' = any(apps)) then
    lola := lola || jsonb_build_object('texto', 'Conecta WhatsApp para que conteste a tus clientes y lleve tus citas.', 'href', '/panel?vista=negocio&tab=apps&app=whatsapp_business');
  end if;
  if not ('google_calendar' = any(apps)) then
    lola := lola || jsonb_build_object('texto', 'Conecta tu calendario para que sepa qué horas tienes libres.', 'href', '/panel?vista=negocio&tab=apps&app=google_calendar');
  end if;

  -- Mensajes por aprobar y envíos que fallaron, de cada agente
  for item in
    select jsonb_build_object('agente', e.agente, 'por_aprobar', count(*) filter (where e.estado = 'por_aprobar'), 'fallaron', count(*) filter (where e.estado = 'error' and e.creado_en > now() - interval '7 days')) as x
    from public.envios e
    where e.owner_id = dueno and e.agente is not null
    group by e.agente
  loop
    declare
      a text := item ->> 'agente';
      pa integer := (item ->> 'por_aprobar')::int;
      fa integer := (item ->> 'fallaron')::int;
      lista jsonb := '[]';
    begin
      if pa > 0 then
        lista := lista || jsonb_build_object('texto', case when pa = 1 then '1 mensaje espera tu visto bueno para enviarse.' else pa || ' mensajes esperan tu visto bueno para enviarse.' end, 'href', '/panel?vista=pendientes');
      end if;
      if fa > 0 then
        lista := lista || jsonb_build_object('texto', case when fa = 1 then '1 envío no se pudo mandar esta semana.' else fa || ' envíos no se pudieron mandar esta semana.' end, 'href', '/panel?vista=pendientes');
      end if;
      if a = 'lola' then lola := lola || lista;
      elsif a = 'clara' then clara := clara || lista;
      elsif a = 'victor' then victor := victor || lista;
      elsif a = 'iris' then iris := iris || lista;
      end if;
    end;
  end loop;

  -- Clara: el correo
  if not con_google and not ('gmail' = any(apps)) and not ('outlook' = any(apps)) then
    clara := clara || jsonb_build_object('texto', 'Conecta tu correo para que lo lea y te diga qué es urgente.', 'href', '/panel?vista=correo#gmail');
  end if;
  select count(*) into n
  from public.resumenes_correo r
  join public.negocios g on g.id = r.negocio_id
  where g.owner_id = dueno
    and r.creado_en > now() - interval '3 days'
    and r.accion_sugerida is not null
    and lower(trim(r.accion_sugerida)) not in ('', 'ninguna', 'ninguno', 'nada');
  if n > 0 then
    clara := clara || jsonb_build_object('texto', case when n = 1 then '1 correo de estos días espera respuesta.' else n || ' correos de estos días esperan respuesta.' end, 'href', '/panel?vista=pendientes&tipo=correos');
  end if;

  -- Víctor: clientes y reseñas
  if not ('google_business' = any(apps)) then
    victor := victor || jsonb_build_object('texto', 'Conecta Google Business para que lea tus reseñas y te proponga respuestas.', 'href', '/panel?vista=negocio&tab=apps&app=google_business');
  end if;

  -- Iris: la oficina
  select count(*) into n from public.archivos a where a.owner_id = dueno and a.revision = 'revisar';
  if n > 0 then
    iris := iris || jsonb_build_object('texto', case when n = 1 then '1 archivo espera tu revisión en la Oficina.' else n || ' archivos esperan tu revisión en la Oficina.' end, 'href', '/panel?vista=oficina');
  end if;
  select count(*) into n from public.documentos d where d.owner_id = dueno and d.estado = 'error';
  if n > 0 then
    iris := iris || jsonb_build_object('texto', case when n = 1 then '1 documento no se pudo leer: vuelve a subirlo.' else n || ' documentos no se pudieron leer: vuelve a subirlos.' end, 'href', '/panel?vista=negocio&tab=documentos');
  end if;
  select count(*) into n from public.documentos d where d.owner_id = dueno;
  if n = 0 then
    iris := iris || jsonb_build_object('texto', 'Sube tus documentos (precios, políticas, preguntas frecuentes) para que todos contesten mejor.', 'href', '/panel?vista=negocio&tab=documentos');
  end if;
  select * into perfil from public.perfil_negocio p where p.owner_id = dueno;
  if coalesce(trim(perfil.a_que_se_dedica), '') = '' then faltan_datos := array_append(faltan_datos, 'a qué se dedica'); end if;
  if coalesce(trim(perfil.servicios_y_precios), '') = '' then faltan_datos := array_append(faltan_datos, 'servicios y precios'); end if;
  if coalesce(trim(perfil.horarios), '') = '' then faltan_datos := array_append(faltan_datos, 'horario'); end if;
  if coalesce(trim(perfil.ubicacion), '') = '' then faltan_datos := array_append(faltan_datos, 'ubicación'); end if;
  if coalesce(trim(perfil.formas_de_pago), '') = '' then faltan_datos := array_append(faltan_datos, 'formas de pago'); end if;
  if cardinality(faltan_datos) > 0 then
    iris := iris || jsonb_build_object('texto', 'Faltan datos de tu negocio: ' || array_to_string(faltan_datos, ', ') || '.', 'href', '/panel?vista=ajustes&seccion=negocio');
  end if;

  return jsonb_build_array(
    jsonb_build_object('agente', 'lola', 'faltan', lola),
    jsonb_build_object('agente', 'clara', 'faltan', clara),
    jsonb_build_object('agente', 'victor', 'faltan', victor),
    jsonb_build_object('agente', 'iris', 'faltan', iris)
  );
end;
$$;

-- Guarda (o actualiza) la revisión de ese día
create or replace function public.guardar_revision(dueno uuid, dia date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  p jsonb := public.armar_revision(dueno);
  total integer;
  nuevo uuid;
begin
  select coalesce(sum(jsonb_array_length(x -> 'faltan')), 0) into total from jsonb_array_elements(p) x;
  insert into public.revisiones (owner_id, fecha, partes, faltan)
  values (dueno, dia, p, total)
  on conflict (owner_id, fecha) do update
    set partes = excluded.partes, faltan = excluded.faltan, creado_en = now(), leido_en = null
  returning id into nuevo;
  return nuevo;
end;
$$;

-- La zona y la hora de una cuenta (lo que eligió en Ajustes, con valores seguros)
create or replace function public.agenda_revision(dueno uuid, out zona text, out hora integer, out activa boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d jsonb;
begin
  select a.datos into d from public.ajustes_cuenta a where a.owner_id = dueno;
  zona := coalesce(d ->> 'zonaHoraria', 'America/Mexico_City');
  if not exists (select 1 from pg_catalog.pg_timezone_names t where t.name = zona) then
    zona := 'America/Mexico_City';
  end if;
  hora := case when coalesce(d ->> 'horaRevision', '') ~ '^([01][0-9]|2[0-3]):00$' then split_part(d ->> 'horaRevision', ':', 1)::int else 8 end;
  activa := coalesce(d ->> 'revisionDiaria', 'activa') <> 'apagada';
end;
$$;

-- Cada hora (pg_cron): las cuentas a las que ya les toca y no la tienen hoy
create or replace function public.generar_revisiones()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  u record;
  ag record;
  ahora_local timestamp;
  hechas integer := 0;
begin
  for u in
    select au.id from auth.users au
    where au.last_sign_in_at > now() - interval '60 days'
  loop
    select * into ag from public.agenda_revision(u.id);
    if not ag.activa then continue; end if;
    ahora_local := now() at time zone ag.zona;
    if extract(hour from ahora_local) >= ag.hora
       and not exists (select 1 from public.revisiones r where r.owner_id = u.id and r.fecha = ahora_local::date) then
      perform public.guardar_revision(u.id, ahora_local::date);
      hechas := hechas + 1;
    end if;
  end loop;
  return hechas;
end;
$$;

-- "Revisar ahora": la persona pide la suya al momento
create or replace function public.revisar_ahora()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  yo uuid := auth.uid();
  ag record;
begin
  if yo is null then
    raise exception 'Necesitas iniciar sesión.';
  end if;
  select * into ag from public.agenda_revision(yo);
  return public.guardar_revision(yo, (now() at time zone ag.zona)::date);
end;
$$;

revoke execute on function public.armar_revision(uuid) from public, anon, authenticated;
revoke execute on function public.guardar_revision(uuid, date) from public, anon, authenticated;
revoke execute on function public.agenda_revision(uuid) from public, anon, authenticated;
revoke execute on function public.generar_revisiones() from public, anon, authenticated;
revoke execute on function public.revisar_ahora() from public, anon;
grant execute on function public.revisar_ahora() to authenticated;

-- Cada hora en punto
select cron.unschedule(jobid) from cron.job where jobname = 'atendel-revision-diaria';
select cron.schedule('atendel-revision-diaria', '0 * * * *', 'select public.generar_revisiones()');
