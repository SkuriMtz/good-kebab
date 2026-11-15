-- ============================================================
-- 0020 · Tareas: lo que Atendel hace solo, cuando el dueño le dijo
--
-- "Cada martes a las 3 pm pregúntale a Chuchito si llegó el pedido",
-- "cada fin de mes revisa mis ventas y hazme el reporte". El dueño las pide
-- en el chat (o las crea en Tareas) y Atendel las hace a esa hora, solo,
-- con sus Reglas, Procesos, Memoria y las apps conectadas; el resultado
-- llega a la Oficina. Lo que gasta va a su límite del trabajo por su cuenta.
--
-- - proxima: cuándo toca (UTC). La calcula la app en la zona del dueño.
-- - La base de datos llama a /api/trabajo cada 10 minutos (0017) si hay
--   revisiones sin trabajar O tareas que ya tocan.
-- - Cada quien solo ve y cambia las suyas (RLS). Máximo 30 por cuenta.
-- ============================================================

create table if not exists public.tareas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 120),
  instruccion text not null check (char_length(instruccion) between 1 and 2000),
  tipo text not null check (tipo in ('una_vez', 'diaria', 'semanal', 'mensual')),
  dias smallint[] not null default '{}' check (dias <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  dia_mes smallint check (dia_mes is null or (dia_mes between -1 and 31 and dia_mes <> 0)),
  fecha date,
  hora text not null check (hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  zona text not null default 'America/Mexico_City' check (char_length(zona) between 1 and 64),
  proxima timestamptz,
  ultima timestamptz,
  ultimo_resultado text check (ultimo_resultado is null or char_length(ultimo_resultado) <= 300),
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);
create index if not exists tareas_dueno on public.tareas (owner_id, creado_en);
create index if not exists tareas_tocan on public.tareas (proxima) where activa;
alter table public.tareas enable row level security;

drop policy if exists "tareas: el dueño lee" on public.tareas;
create policy "tareas: el dueño lee" on public.tareas for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "tareas: el dueño crea" on public.tareas;
create policy "tareas: el dueño crea" on public.tareas for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists "tareas: el dueño cambia" on public.tareas;
create policy "tareas: el dueño cambia" on public.tareas for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "tareas: el dueño borra" on public.tareas;
create policy "tareas: el dueño borra" on public.tareas for delete to authenticated using ((select auth.uid()) = owner_id);
revoke all on public.tareas from anon;

-- Tope: 30 tareas por cuenta (la misma función de topes del cerebro)
create or replace function public.tope_cerebro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
  tope integer := case tg_table_name when 'reglas' then 300 when 'procesos' then 100 when 'tareas' then 30 else 500 end;
begin
  execute format('select count(*) from public.%I where owner_id = $1', tg_table_name) into n using new.owner_id;
  if n >= tope then
    if tg_table_name = 'memoria' then
      delete from public.memoria where id in (select id from public.memoria where owner_id = new.owner_id order by creado_en asc limit (n - tope + 1));
    else
      raise exception 'Llegaste al máximo de %', tg_table_name using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.tope_cerebro() from public, anon, authenticated;
drop trigger if exists tareas_tope on public.tareas;
create trigger tareas_tope before insert on public.tareas for each row execute function public.tope_cerebro();

-- La base de datos también llama al servidor cuando hay tareas que ya tocan
create or replace function public.pedir_trabajo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  llave text;
begin
  if not exists (select 1 from public.revisiones r where r.trabajo_en is null and r.creado_en > now() - interval '36 hours')
     and not exists (select 1 from public.tareas t where t.activa and t.proxima <= now()) then
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
