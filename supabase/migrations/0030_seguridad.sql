-- ============================================================
-- 0030 · Seguridad (auditoría del 16 nov)
-- - sumar_uso_demo(): ya no la puede llamar cualquiera con la llave
--   pública (anon) ni un usuario con sesión; solo el servidor. Antes, con
--   la llave pública alguien podía gastar el tope diario de la demo.
-- - limites + pasar_limite(): un límite de intentos compartido entre todos
--   los servidores (el de antes vivía en la memoria de cada uno y se
--   reiniciaba). Solo el servidor.
-- - eventos_seguridad: la bitácora de lo sospechoso (llaves o firmas
--   inválidas, límites alcanzados, peticiones de otros sitios). Sin datos
--   personales: la IP va con hash. Solo el servidor.
-- - Limpieza diaria: eventos de más de 90 días y límites vencidos.
-- ============================================================

-- Demo: solo el servidor
revoke execute on function public.sumar_uso_demo(text) from public, anon, authenticated;
grant execute on function public.sumar_uso_demo(text) to service_role;

-- Límite de intentos compartido
create table if not exists public.limites (
  clave text primary key check (char_length(clave) between 3 and 200),
  cuenta integer not null default 0 check (cuenta >= 0),
  vence timestamptz not null
);
create index if not exists limites_vence on public.limites (vence);
alter table public.limites enable row level security;
revoke all on public.limites from anon, authenticated;

-- true si todavía puede pasar (y lo cuenta); false si ya llegó al tope en esta ventana
create or replace function public.pasar_limite(p_clave text, p_max integer, p_segundos integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if p_clave is null or char_length(p_clave) not between 3 and 200 or p_max < 1 or p_segundos < 1 or p_segundos > 31 * 86400 then
    return false;
  end if;
  insert into public.limites as l (clave, cuenta, vence)
  values (p_clave, 1, now() + make_interval(secs => p_segundos))
  on conflict (clave) do update
    set cuenta = case when l.vence <= now() then 1 else l.cuenta + 1 end,
        vence = case when l.vence <= now() then now() + make_interval(secs => p_segundos) else l.vence end
  returning cuenta into n;
  return n <= p_max;
end;
$$;
revoke execute on function public.pasar_limite(text, integer, integer) from public, anon, authenticated;
grant execute on function public.pasar_limite(text, integer, integer) to service_role;

-- Bitácora de seguridad
create table if not exists public.eventos_seguridad (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo ~ '^[a-z0-9_]{3,40}$'),
  ruta text check (ruta is null or char_length(ruta) <= 200),
  ip_hash text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{16,64}$'),
  detalle text check (detalle is null or char_length(detalle) <= 300),
  creado_en timestamptz not null default now()
);
create index if not exists eventos_seguridad_fecha on public.eventos_seguridad (creado_en);
create index if not exists eventos_seguridad_tipo on public.eventos_seguridad (tipo, creado_en);
alter table public.eventos_seguridad enable row level security;
revoke all on public.eventos_seguridad from anon, authenticated;

-- Limpieza diaria (4:17 UTC)
select cron.schedule(
  'atendel-limpieza-seguridad',
  '17 4 * * *',
  $$delete from public.eventos_seguridad where creado_en < now() - interval '90 days'; delete from public.limites where vence < now() - interval '1 day';$$
);
