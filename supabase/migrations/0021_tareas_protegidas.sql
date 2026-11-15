-- ============================================================
-- 0021 · Tareas protegidas (avisos del revisor de seguridad)
--
-- 1. Desde el navegador nadie puede poner sus tareas a correr sin parar:
--    - "ultima" y "ultimo_resultado" solo los escribe el servidor;
--    - "proxima" no puede quedar en el pasado ni a menos de 30 minutos de
--      la última vez que corrió (se recorre sola, no da error).
--    El servidor (rol de servicio) no pasa por estas reglas.
-- 2. La base de datos pide por separado las tareas y las revisiones
--    (?que=tareas y ?que=revisiones): cada una con su propio tiempo, así
--    unas no frenan a las otras.
-- ============================================================

create or replace function public.tareas_protege()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  minimo timestamptz;
begin
  if coalesce((select auth.role()), '') = 'service_role' or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.owner_id := old.owner_id;
    new.ultima := old.ultima;
    new.ultimo_resultado := old.ultimo_resultado;
  else
    new.ultima := null;
    new.ultimo_resultado := null;
  end if;
  if new.proxima is not null then
    minimo := greatest(now() + interval '1 minute', coalesce(new.ultima + interval '30 minutes', now()));
    if new.proxima < minimo then
      new.proxima := minimo;
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.tareas_protege() from public, anon, authenticated;

drop trigger if exists tareas_protege on public.tareas;
create trigger tareas_protege before insert or update on public.tareas for each row execute function public.tareas_protege();

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
begin
  if not hay_revisiones and not hay_tareas then
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
end;
$$;
revoke execute on function public.pedir_trabajo() from public, anon, authenticated;
