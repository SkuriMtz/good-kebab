-- ============================================================
-- 0017 · El trabajo por su cuenta, cada 10 minutos
--
-- Ahora el trabajo revisa TODAS las apps conectadas (puede tardar ~40 s por
-- cuenta), así que /api/trabajo atiende una cuenta por llamada para no pasar
-- del tiempo de Vercel. Para que nadie espere, la base de datos lo llama cada
-- 10 minutos en vez de cada hora. pedir_trabajo() solo llama si hay
-- revisiones sin trabajar, así que casi siempre no hace nada.
-- ============================================================

select cron.alter_job(jobid, schedule := '*/10 * * * *')
from cron.job
where jobname = 'atendel-trabajo-autonomo';
