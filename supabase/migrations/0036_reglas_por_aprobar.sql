-- 0036: Reglas por aprobar (Cosecha). Cuando el chat guarda una Regla en una
-- plática que trae correos o documentos, queda por_aprobar = true: no entra a
-- las instrucciones de la IA hasta que el dueño la aprueba en Tu negocio → Reglas.
alter table public.reglas add column if not exists por_aprobar boolean not null default false;
