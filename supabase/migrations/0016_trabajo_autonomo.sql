-- ============================================================
-- 0016 · Trabajo por su cuenta: la IA trabaja mientras no estás
--
-- Después de la revisión diaria (0015), la base de datos le pide al
-- servidor (/api/trabajo) que tus agentes trabajen con IA por su cuenta:
-- borradores para los correos que esperan respuesta y el plan del día.
-- Lo que hacen llega a la Oficina "por revisar": nada se envía solo.
--
-- - La llave entre la base de datos y el servidor la genera la base de
--   datos y vive en el Vault: nadie la ve ni la copia. El servidor la
--   valida con llave_trabajo_valida() (solo el servidor puede llamarla).
-- - Su propio límite, aparte del chat: trabajo_uso guarda lo que gasta y
--   cada plan tiene su tope semanal (src/lib/planes.ts, "trabajo").
-- - Una vez al día por cuenta: revisiones.trabajo_en marca la revisión ya
--   trabajada (o saltada, si no había nada útil o la apagaste).
-- - El servidor necesita SUPABASE_SERVICE_ROLE_KEY en Vercel (solo ahí,
--   nunca en el código); sin ella, contesta 503 y no se hace nada.
-- ============================================================

create extension if not exists pg_net;

-- La llave (aleatoria, ~244 bits), solo si no existe
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'atendel_llave_trabajo') then
    perform vault.create_secret(
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
      'atendel_llave_trabajo',
      'Para que la base de datos le pida al servidor el trabajo por su cuenta (0016)'
    );
  end if;
end $$;

create or replace function public.llave_trabajo_valida(llave text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(length(llave) >= 32, false) and exists (
    select 1 from vault.decrypted_secrets s
    where s.name = 'atendel_llave_trabajo' and s.decrypted_secret = llave
  );
$$;
revoke execute on function public.llave_trabajo_valida(text) from public, anon, authenticated;
grant execute on function public.llave_trabajo_valida(text) to service_role;

-- La revisión ya trabajada (o saltada)
alter table public.revisiones add column if not exists trabajo_en timestamptz;

-- Lo que hicieron por su cuenta (llega a la Oficina)
create table if not exists public.trabajos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision_id uuid references public.revisiones(id) on delete set null,
  agente text not null check (agente in ('lola', 'clara', 'victor', 'iris')),
  titulo text not null check (char_length(titulo) between 1 and 160),
  detalle text check (detalle is null or char_length(detalle) <= 300),
  -- [{ titulo, texto }]
  partes jsonb not null check (jsonb_typeof(partes) = 'array' and jsonb_array_length(partes) between 1 and 20),
  revision text not null default 'revisar' check (revision in ('revisar', 'aprobado', 'cambios')),
  revisado_en timestamptz,
  creado_en timestamptz not null default now()
);
create index if not exists trabajos_dueno on public.trabajos (owner_id, creado_en desc);
alter table public.trabajos enable row level security;

drop policy if exists "trabajos: el dueño lee los suyos" on public.trabajos;
create policy "trabajos: el dueño lee los suyos" on public.trabajos
  for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "trabajos: el dueño revisa" on public.trabajos;
create policy "trabajos: el dueño revisa" on public.trabajos
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
revoke all on public.trabajos from anon, authenticated;
grant select on public.trabajos to authenticated;
grant update (revision, revisado_en) on public.trabajos to authenticated;

-- Lo que gasta el trabajo por su cuenta (su propio límite, aparte del chat)
create table if not exists public.trabajo_uso (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  costo bigint not null check (costo > 0 and costo <= 5000000),
  entrada integer not null default 0 check (entrada >= 0),
  salida integer not null default 0 check (salida >= 0),
  modelo text not null check (length(modelo) <= 60),
  creado_en timestamptz not null default now()
);
create index if not exists trabajo_uso_dueno on public.trabajo_uso (owner_id, creado_en desc);
alter table public.trabajo_uso enable row level security;
drop policy if exists "trabajo_uso: el dueño lee el suyo" on public.trabajo_uso;
create policy "trabajo_uso: el dueño lee el suyo" on public.trabajo_uso
  for select to authenticated using ((select auth.uid()) = owner_id);
revoke all on public.trabajo_uso from anon, authenticated;
grant select on public.trabajo_uso to authenticated;

-- Cada hora (a los 10 minutos): si hay revisiones sin trabajar, le pide al servidor que trabaje
create or replace function public.pedir_trabajo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  llave text;
begin
  if not exists (select 1 from public.revisiones r where r.trabajo_en is null and r.creado_en > now() - interval '36 hours') then
    return;
  end if;
  select s.decrypted_secret into llave from vault.decrypted_secrets s where s.name = 'atendel_llave_trabajo';
  if llave is null then
    return;
  end if;
  perform net.http_post(
    url := 'https://good-kebab.vercel.app/api/trabajo',
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-atendel-llave', llave),
    timeout_milliseconds := 60000
  );
end;
$$;
revoke execute on function public.pedir_trabajo() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'atendel-trabajo-autonomo';
select cron.schedule('atendel-trabajo-autonomo', '10 * * * *', 'select public.pedir_trabajo()');
