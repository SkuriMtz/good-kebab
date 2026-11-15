-- ============================================================
-- 0019 · El cerebro de Atendel: Reglas, Procesos y Memoria
--
-- - reglas:   lo que NUNCA se equivoca (precios, políticas, datos, lo que
--             nunca se hace). El chat y el trabajo por su cuenta solo dan
--             precios y datos que estén aquí o en el perfil; un verificador
--             revisa los borradores contra estas reglas.
-- - procesos: cómo se hace cada cosa (cuándo aplica y los pasos).
-- - memoria:  lo que Atendel aprende de ti (lo guarda solo cuando le dices
--             algo que vale la pena recordar, o lo agregas tú).
-- Cada quien solo ve y cambia lo suyo (RLS). Topes por cuenta en la app.
-- ============================================================

create table if not exists public.reglas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('precio', 'politica', 'dato', 'nunca')),
  texto text not null check (char_length(texto) between 1 and 500),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists reglas_dueno on public.reglas (owner_id, creado_en);

create table if not exists public.procesos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 120),
  cuando text not null check (char_length(cuando) between 1 and 300),
  pasos text not null check (char_length(pasos) between 1 and 3000),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists procesos_dueno on public.procesos (owner_id, creado_en);

create table if not exists public.memoria (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 400),
  fuente text not null default 'dueño' check (fuente in ('dueño', 'chat', 'trabajo')),
  creado_en timestamptz not null default now()
);
create index if not exists memoria_dueno on public.memoria (owner_id, creado_en desc);

do $$
declare
  t text;
begin
  foreach t in array array['reglas', 'procesos', 'memoria'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s: el dueño lee" on public.%I', t, t);
    execute format('create policy "%s: el dueño lee" on public.%I for select to authenticated using ((select auth.uid()) = owner_id)', t, t);
    execute format('drop policy if exists "%s: el dueño crea" on public.%I', t, t);
    execute format('create policy "%s: el dueño crea" on public.%I for insert to authenticated with check ((select auth.uid()) = owner_id)', t, t);
    execute format('drop policy if exists "%s: el dueño cambia" on public.%I', t, t);
    execute format('create policy "%s: el dueño cambia" on public.%I for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)', t, t);
    execute format('drop policy if exists "%s: el dueño borra" on public.%I', t, t);
    execute format('create policy "%s: el dueño borra" on public.%I for delete to authenticated using ((select auth.uid()) = owner_id)', t, t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Topes por cuenta (para que nadie llene la base de datos)
create or replace function public.tope_cerebro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
  tope integer := case tg_table_name when 'reglas' then 300 when 'procesos' then 100 else 500 end;
begin
  execute format('select count(*) from public.%I where owner_id = $1', tg_table_name) into n using new.owner_id;
  if n >= tope then
    -- La memoria se recorre: se borra lo más viejo para hacer lugar
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

drop trigger if exists reglas_tope on public.reglas;
create trigger reglas_tope before insert on public.reglas for each row execute function public.tope_cerebro();
drop trigger if exists procesos_tope on public.procesos;
create trigger procesos_tope before insert on public.procesos for each row execute function public.tope_cerebro();
drop trigger if exists memoria_tope on public.memoria;
create trigger memoria_tope before insert on public.memoria for each row execute function public.tope_cerebro();
