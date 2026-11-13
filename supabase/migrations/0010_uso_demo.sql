-- 0010 · Límite de la IA en la demostración pública (/pruebalo)
--
-- La demostración contesta con la IA de verdad. Para no gastar de más:
-- cada visitante (una huella: hash de su IP y su navegador, nunca la IP
-- sola) tiene 20 mensajes al día, y entre todos hay un tope de 1,000 al día.
-- Los límites están fijos aquí (nadie los cambia desde afuera). La tabla no
-- tiene políticas: nadie la lee directo; solo esta función suma.

create table if not exists public.uso_demo (
  clave text primary key check (char_length(clave) between 8 and 140),
  dia date not null,
  mensajes integer not null default 0 check (mensajes >= 0)
);
create index if not exists uso_demo_dia on public.uso_demo (dia);
alter table public.uso_demo enable row level security;

-- Regresa cuántos mensajes le quedan hoy a esa huella (0 o más), -1 si ya
-- llegó a su límite o -2 si se llegó al tope del día entre todos.
create or replace function public.sumar_uso_demo(p_huella text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dia date := (now() at time zone 'America/Mexico_City')::date;
  v_limite constant integer := 20;
  v_tope constant integer := 1000;
  v_total integer;
  v_usados integer;
begin
  if p_huella is null or p_huella !~ '^[0-9a-f]{32}$' then
    return -1;
  end if;
  select coalesce(sum(u.mensajes), 0) into v_total from public.uso_demo u where u.dia = v_dia;
  if v_total >= v_tope then
    return -2;
  end if;
  insert into public.uso_demo as u (clave, dia, mensajes)
  values (p_huella || ':' || v_dia::text, v_dia, 1)
  on conflict (clave) do update set mensajes = u.mensajes + 1
  returning u.mensajes into v_usados;
  if v_usados > v_limite then
    return -1;
  end if;
  return v_limite - v_usados;
end;
$$;

revoke all on function public.sumar_uso_demo(text) from public;
grant execute on function public.sumar_uso_demo(text) to anon, authenticated;
