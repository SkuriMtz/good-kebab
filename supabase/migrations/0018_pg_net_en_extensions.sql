-- ============================================================
-- 0018 · pg_net fuera del esquema public
--
-- El asesor de seguridad de Supabase avisó que pg_net quedó instalado en
-- "public" (0016). Se reinstala en "extensions". Sus funciones siguen en el
-- esquema "net" (net.http_post), así que pedir_trabajo() no cambia.
-- ============================================================

drop extension if exists pg_net;
create extension if not exists pg_net with schema extensions;
