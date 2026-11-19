-- 0038: las noticias de tu industria se preparan solas en la madrugada.
-- - Son un costo de Atendel (no del límite de nadie), con topes: solo para
--   tipos de negocio con gente activa (sesión usada en los últimos 14 días),
--   una búsqueda al día por tipo y un tope total al día (en el servidor).
-- - costo: lo que costó la última búsqueda de ese tipo (millonésimas de
--   dólar), para poder revisarlo.
-- - Cada hora (minuto 23), la base de datos pide /api/trabajo?que=noticias:
--   así, poco después de la medianoche de cada zona, ya están las de hoy.

alter table public.noticias_industria add column if not exists costo integer not null default 0 check (costo >= 0);

-- Los tipos de negocio (con su idioma y zona) de las cuentas activas. Solo el servidor.
create or replace function public.negocios_para_noticias()
returns table (tipo text, idioma text, zona text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct coalesce(p.tipo, ''), coalesce(a.datos->>'idioma', ''), coalesce(a.datos->>'zonaHoraria', '')
  from public.perfil_negocio p
  left join public.ajustes_cuenta a on a.owner_id = p.owner_id
  where exists (
    select 1 from auth.sessions s
    where s.user_id = p.owner_id
      and greatest(s.updated_at, s.created_at, (s.refreshed_at at time zone 'UTC')) > now() - interval '14 days'
  )
  limit 500;
$$;
revoke all on function public.negocios_para_noticias() from public, anon, authenticated;
grant execute on function public.negocios_para_noticias() to service_role;

-- Pide al servidor que prepare las que falten (con la llave de trabajo de la bóveda)
create or replace function public.pedir_noticias()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  llave text;
begin
  select s.decrypted_secret into llave from vault.decrypted_secrets s where s.name = 'atendel_llave_trabajo';
  if llave is null then
    return;
  end if;
  perform net.http_post(
    url := 'https://good-kebab.vercel.app/api/trabajo?que=noticias',
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-atendel-llave', llave),
    timeout_milliseconds := 60000
  );
end;
$$;
revoke all on function public.pedir_noticias() from public, anon, authenticated;

select cron.schedule('atendel-noticias', '23 * * * *', 'select public.pedir_noticias()');
