-- ============================================================
-- 0031 · La IA no obedece lo que viene de fuera y no pierde correos
--
-- - conversaciones.externo_en: cuándo entraron por primera vez datos de
--   fuera a esa conversación del chat (correos, apps, documentos, WhatsApp
--   de clientes). Esos datos siguen en el historial que se le manda a la IA
--   en cada mensaje (y en lo que ella misma contestó con ellos), así que
--   desde ese momento nada se hace solo en esa conversación: todo queda en
--   «Necesita tu OK». Para volver a que haga cosas sola, se abre una
--   conversación nueva. La pone el servidor (/api/chat) con la sesión del
--   dueño; la regla de RLS de conversaciones ya cubre la columna (cada quien
--   solo ve y cambia las suyas).
--   Las conversaciones que ya tienen respuestas de Atendel no se sabe si
--   leyeron algo de fuera: por seguridad, quedan marcadas.
-- - correos_vistos.intentos: cuántas vueltas apartaron ese correo sin
--   terminar de revisarlo (0 = ya se revisó, o ya se te avisó que no se
--   pudo). Si la IA falla, el correo se suelta y la siguiente vuelta lo
--   vuelve a intentar; a la segunda falla, te avisa que lo revises tú
--   (src/lib/vigilar-correos.ts). Los correos que ya estaban vistos quedan
--   en 0. Solo la usa el servidor, como el resto de la tabla.
-- ============================================================

alter table public.conversaciones
  add column if not exists externo_en timestamptz;

update public.conversaciones c
set externo_en = c.actualizado_en
where c.externo_en is null
  and exists (select 1 from public.mensajes m where m.conversacion_id = c.id and m.rol = 'assistant');

alter table public.correos_vistos
  add column if not exists intentos smallint not null default 0 check (intentos between 0 and 10);
