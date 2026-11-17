-- ============================================================
-- 0033 · Conexiones solo por el servidor + revisión que no se atora
-- 1. public.conexiones: el dueño (authenticated) ya no inserta ni edita
--    filas, ni puede leer token_cifrado. Todo eso lo hace el servidor con
--    la llave de servicio (src/lib/conexiones/tokens.ts), filtrando por
--    owner_id. El dueño sí puede leer lo público (apps, estado, cuenta) y
--    borrar su fila (desconectar) con su sesión.
-- 2. public.revisiones.reintentos + pedir_trabajo(): si Vercel corta a la
--    mitad la revisión de la mañana, se libera UNA vez para reintentarla.
-- ============================================================

-- 1. Conexiones ------------------------------------------------
drop policy if exists "conexiones: el dueño crea las suyas" on public.conexiones;
drop policy if exists "conexiones: el dueño edita las suyas" on public.conexiones;

revoke insert, update on table public.conexiones from authenticated, anon;

-- Leer: todo menos token_cifrado (se quita el permiso de la tabla y se da por columna)
revoke select on table public.conexiones from authenticated, anon;
grant select (id, owner_id, proveedor, apps, cuenta, scopes, estado, error, creado_en, actualizado_en)
  on table public.conexiones to authenticated;

-- El DELETE del dueño (desconectar) se queda como estaba: grant delete + política "borra las suyas".
grant delete on table public.conexiones to authenticated;

-- 2. Revisión que no se atora ----------------------------------
alter table public.revisiones add column if not exists reintentos smallint not null default 0;

create or replace function public.pedir_trabajo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  llave text;
  hay_revisiones boolean;
  hay_tareas boolean := exists (select 1 from public.tareas t where t.activa and t.proxima <= now());
  hay_correos boolean := exists (select 1 from public.conexiones c where c.estado = 'activa' and c.apps && array['gmail', 'outlook']::text[]);
  hay_agenda boolean := exists (select 1 from public.conexiones c where c.estado = 'activa' and c.apps && array['google_calendar', 'outlook_calendar']::text[]);
  hay_avisos boolean := exists (select 1 from public.avisos_salida a where a.app = 'pendiente' and a.enviar_desde <= now())
    or exists (select 1 from public.avisos_salida a where a.whatsapp = 'pendiente' and coalesce(a.wa_desde, a.enviar_desde) <= now())
    or exists (select 1 from public.informes_que_tocan());
begin
  -- Revisiones atoradas (la función se cortó a la mitad): se liberan UNA vez para reintentarlas.
  -- Solo las de las últimas 30 horas, con más de 10 minutos en marcha y sin ningún trabajo guardado.
  update public.revisiones r
     set trabajo_en = null, reintentos = r.reintentos + 1
   where r.trabajo_en is not null
     and r.trabajo_en < now() - interval '10 minutes'
     and r.creado_en > now() - interval '30 hours'
     and r.reintentos < 1
     and not exists (select 1 from public.trabajos t where t.revision_id = r.id);

  hay_revisiones := exists (select 1 from public.revisiones r where r.trabajo_en is null and r.creado_en > now() - interval '36 hours');

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
