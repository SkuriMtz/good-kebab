-- ============================================================
-- 0024 · Atendel reacciona a tus correos al momento (src/lib/vigilar-correos.ts)
--
-- Cada 10 minutos, si tienes Gmail u Outlook conectado (y «Que trabajen por
-- su cuenta» prendido), Atendel revisa los correos nuevos sin leer, te avisa
-- en el chat de lo importante y te deja la respuesta lista para un clic.
-- - correos_vistos: qué correos ya revisó (para no avisarte dos veces). Solo
--   la usa el servidor (cliente de servicio): nadie más la lee ni la escribe.
-- - pedir_trabajo(): además pide /api/trabajo?que=correos cuando hay alguna
--   cuenta con Gmail u Outlook conectado.
-- ============================================================

create table if not exists public.correos_vistos (
  owner_id uuid not null references auth.users(id) on delete cascade,
  proveedor text not null check (proveedor in ('google', 'microsoft')),
  mensaje_id text not null check (char_length(mensaje_id) between 1 and 400),
  visto_en timestamptz not null default now(),
  primary key (owner_id, proveedor, mensaje_id)
);
create index if not exists correos_vistos_fecha on public.correos_vistos (visto_en);
alter table public.correos_vistos enable row level security;
revoke all on public.correos_vistos from anon, authenticated;

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
begin
  if not hay_revisiones and not hay_tareas and not hay_correos then
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
end;
$$;
revoke execute on function public.pedir_trabajo() from public, anon, authenticated;
