-- 0039: se quitan las noticias de tu industria (el dueño decidió no tenerlas).
-- Se apaga la tarea de cada hora y se borran sus funciones, su tabla y su
-- carpeta de fotos en Storage.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'atendel-noticias') then
    perform cron.unschedule('atendel-noticias');
  end if;
end;
$$;

drop function if exists public.pedir_noticias();
drop function if exists public.negocios_para_noticias();
drop table if exists public.noticias_industria;
