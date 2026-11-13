-- 0011 · La demostración usa Sonnet 5.5: el tope del día entre todos baja de 1,000 a 300 mensajes.
create or replace function public.sumar_uso_demo(p_huella text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dia date := (now() at time zone 'America/Mexico_City')::date;
  v_limite constant integer := 20;
  v_tope constant integer := 300;
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
