-- ============================================================
-- 0013. EL USO COMO LÍMITE (el mismo concepto que Claude)
--
-- Ya no se cuentan mensajes: se guarda lo que de verdad costó cada
-- respuesta de la IA (tokens de entrada, de salida y de caché por el
-- precio de su modelo, en micro-dólares). Un mensaje corto gasta poco;
-- una conversación larga, documentos o apps consultadas gastan más.
--
-- Dos ventanas, como Claude:
--   - Sesión de 5 horas: empieza con el primer mensaje cuando no hay una
--     sesión abierta y se reinicia 5 horas después.
--   - Semana: se reinicia el lunes a las 12:00 a. m. (hora de la cuenta).
-- Los límites de cada plan están en src/lib/planes.ts.
--
-- uso_mensual y sumar_mensaje() se quedan: cuentan mensajes para las
-- estadísticas, ya no ponen el límite.
-- ------------------------------------------------------------

create table if not exists public.uso_ia (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now(),
  -- Cuándo empezó la sesión de 5 horas a la que pertenece (la pone la función)
  sesion_inicio timestamptz not null,
  -- Lo que costó, en micro-dólares (1 = 0.000001 USD)
  costo bigint not null check (costo > 0 and costo <= 5000000),
  entrada integer not null default 0 check (entrada >= 0),
  salida integer not null default 0 check (salida >= 0),
  modelo text not null default '' check (pg_catalog.length(modelo) <= 60),
  origen text not null default 'chat' check (origen in ('chat', 'pregunta'))
);
create index if not exists uso_ia_owner_fecha on public.uso_ia (owner_id, creado_en desc);

alter table public.uso_ia enable row level security;
revoke all on table public.uso_ia from anon, authenticated;
grant select on table public.uso_ia to authenticated;

drop policy if exists "uso_ia: el dueño lee el suyo" on public.uso_ia;
create policy "uso_ia: el dueño lee el suyo"
  on public.uso_ia for select to authenticated
  using ((select auth.uid()) = owner_id);

-- Solo se escribe con esta función (nadie inserta directo). Corre como
-- dueño de la tabla, siempre para auth.uid(), y decide la sesión: si la
-- última empezó hace menos de 5 horas, sigue en esa; si no, empieza otra.
create or replace function public.registrar_uso(costo bigint, entrada integer, salida integer, modelo text, origen text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  yo uuid := auth.uid();
  ultima timestamptz;
begin
  if yo is null then
    raise exception 'Sin sesión' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('uso:' || yo::text, 0));
  select u.sesion_inicio into ultima from public.uso_ia u where u.owner_id = yo order by u.creado_en desc limit 1;
  insert into public.uso_ia (owner_id, sesion_inicio, costo, entrada, salida, modelo, origen)
  values (
    yo,
    case when ultima is not null and ultima + interval '5 hours' > now() then ultima else now() end,
    least(greatest(costo, 1), 5000000),
    greatest(coalesce(entrada, 0), 0),
    greatest(coalesce(salida, 0), 0),
    pg_catalog.left(coalesce(modelo, ''), 60),
    case when origen = 'pregunta' then 'pregunta' else 'chat' end
  );
end;
$$;
revoke execute on function public.registrar_uso(bigint, integer, integer, text, text) from public, anon;
grant execute on function public.registrar_uso(bigint, integer, integer, text, text) to authenticated;

-- Lo usado en la sesión abierta (si hay) y en la semana, con RLS (solo lo propio).
-- `zona`: la zona horaria de la cuenta, para saber cuándo empieza el lunes.
create or replace function public.estado_uso(zona text default 'America/Mexico_City')
returns table (sesion_inicio timestamptz, sesion_costo bigint, semana_inicio timestamptz, semana_costo bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with ultima as (
    select u.sesion_inicio as inicio
    from public.uso_ia u
    where u.owner_id = (select auth.uid())
    order by u.creado_en desc
    limit 1
  ),
  abierta as (
    select inicio from ultima where inicio + interval '5 hours' > now()
  ),
  semana as (
    select (pg_catalog.date_trunc('week', now() at time zone zona) at time zone zona) as inicio
  )
  select
    (select inicio from abierta),
    coalesce((
      select sum(u.costo) from public.uso_ia u, abierta a
      where u.owner_id = (select auth.uid()) and u.sesion_inicio = a.inicio
    ), 0)::bigint,
    (select inicio from semana),
    coalesce((
      select sum(u.costo) from public.uso_ia u, semana s
      where u.owner_id = (select auth.uid()) and u.creado_en >= s.inicio
    ), 0)::bigint;
$$;
revoke execute on function public.estado_uso(text) from public, anon;
grant execute on function public.estado_uso(text) to authenticated;
