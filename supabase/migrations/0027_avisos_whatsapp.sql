-- ============================================================
-- 0027 · Avisos por WhatsApp al dueño (src/lib/whatsapp/aviso-plantilla.ts
-- y src/lib/whatsapp/avisos-dueno.ts)
--
-- - avisos_whatsapp: el WhatsApp de cada dueño para recibir avisos desde el
--   número de Atendel. Se conecta sin escribir el número: el dueño manda un
--   mensaje con un código de un solo uso (guardado con hash, vence en 15
--   minutos) y el número sale de ese mensaje. PARAR lo pausa. Solo servidor.
-- - avisos_salida.wa_desde / wa_enviado_en: el WhatsApp tiene su propia hora
--   (horas de silencio, tope por día) aparte de la notificación de la app.
-- - pedir_trabajo(): lo de 0026, mirando la hora de cada canal.
-- ============================================================

create table if not exists public.avisos_whatsapp (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  numero text check (numero is null or numero ~ '^[1-9][0-9]{7,14}$'),
  confirmado_en timestamptz,
  pausado boolean not null default false,
  motivo text check (motivo is null or char_length(motivo) <= 300),
  codigo_hash text check (codigo_hash is null or codigo_hash ~ '^[0-9a-f]{64}$'),
  codigo_vence timestamptz,
  respondido_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create unique index if not exists avisos_whatsapp_codigo on public.avisos_whatsapp (codigo_hash) where codigo_hash is not null;
create index if not exists avisos_whatsapp_numero on public.avisos_whatsapp (numero) where numero is not null;
alter table public.avisos_whatsapp enable row level security;
revoke all on public.avisos_whatsapp from anon, authenticated;

alter table public.avisos_salida
  add column if not exists wa_desde timestamptz,
  add column if not exists wa_enviado_en timestamptz;

drop index if exists public.avisos_salida_esperando;
create index if not exists avisos_salida_esperando_app on public.avisos_salida (enviar_desde) where app = 'pendiente';
create index if not exists avisos_salida_esperando_wa on public.avisos_salida (wa_desde) where whatsapp = 'pendiente';

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
  hay_avisos boolean := exists (select 1 from public.avisos_salida a where a.app = 'pendiente' and a.enviar_desde <= now())
    or exists (select 1 from public.avisos_salida a where a.whatsapp = 'pendiente' and coalesce(a.wa_desde, a.enviar_desde) <= now())
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
