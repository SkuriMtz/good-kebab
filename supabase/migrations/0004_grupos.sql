-- Chats en grupo: una conversación puede tener varios agentes y un tema.
-- En los grupos, `agente` guarda al primero (para no romper lo existente).

alter table public.conversaciones
  add column if not exists participantes text[]
  check (
    participantes is null
    or (participantes <@ array['lola', 'clara', 'victor', 'iris']::text[] and cardinality(participantes) between 2 and 4)
  );

alter table public.conversaciones
  add column if not exists tema text check (tema is null or char_length(tema) <= 120);

-- Quién de los agentes escribió cada respuesta (en grupos contestan varios)
alter table public.mensajes
  add column if not exists agente text check (agente is null or agente in ('lola', 'clara', 'victor', 'iris'));
