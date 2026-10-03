-- De 6 a 4 agentes: Lola (Atención), Clara (Correo), Víctor (Clientes), Iris (Oficina).
-- Lo de Lucía (clientes) pasa a Víctor y lo de Óscar (operación) a Iris.

update public.conversaciones set agente = 'victor' where agente = 'lucia';
update public.conversaciones set agente = 'iris' where agente = 'oscar';

update public.agentes_elegidos
set agentes = coalesce(
  (
    select array_agg(distinct x)
    from unnest(array_replace(array_replace(agentes, 'lucia', 'victor'), 'oscar', 'iris')) as x
  ),
  array['clara']::text[]
)
where agentes && array['lucia', 'oscar']::text[];

alter table public.agentes_elegidos drop constraint agentes_elegidos_agentes_check;
alter table public.agentes_elegidos
  add constraint agentes_elegidos_agentes_check
  check (agentes <@ array['lola', 'clara', 'victor', 'iris']::text[]);

alter table public.conversaciones drop constraint conversaciones_agente_check;
alter table public.conversaciones
  add constraint conversaciones_agente_check
  check (agente in ('lola', 'clara', 'victor', 'iris'));
