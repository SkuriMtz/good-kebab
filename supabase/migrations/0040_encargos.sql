-- ============================================================
-- 0040 · Tu equipo trabajando: los encargos de Atendel a sus empleados
--
-- Le escribes a Atendel; él le encarga cada parte al empleado que le toca
-- (Aura, Altair, Rigel o Mira), que la hace con sus herramientas. Cada
-- encargo es una fila: se ve como tarjetita en el chat (trabajando → listo)
-- y en «Tu equipo» (qué está haciendo cada uno y qué hizo hoy).
-- - posicion: en qué parte del texto de la respuesta van las tarjetitas.
-- Solo el servidor escribe filas; el dueño solo las lee (RLS).
-- ============================================================

create table if not exists public.encargos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  conversacion_id uuid references public.conversaciones(id) on delete cascade,
  mensaje_id uuid references public.mensajes(id) on delete set null,
  agente text not null check (agente in ('lola', 'clara', 'victor', 'iris')),
  titulo text not null check (char_length(titulo) between 1 and 120),
  estado text not null default 'trabajando' check (estado in ('trabajando', 'listo', 'error')),
  resultado text check (resultado is null or char_length(resultado) <= 4000),
  posicion integer not null default 0 check (posicion >= 0),
  origen text not null default 'chat' check (origen in ('chat', 'tarea', 'trabajo', 'whatsapp')),
  creado_en timestamptz not null default now(),
  terminado_en timestamptz
);
create index if not exists encargos_dueno_creado on public.encargos (owner_id, creado_en desc);
create index if not exists encargos_conversacion on public.encargos (conversacion_id, creado_en);
create index if not exists encargos_mensaje on public.encargos (mensaje_id);
alter table public.encargos enable row level security;
drop policy if exists "encargos: el dueño lee" on public.encargos;
create policy "encargos: el dueño lee" on public.encargos for select to authenticated using ((select auth.uid()) = owner_id);
revoke all on public.encargos from anon, authenticated;
grant select on public.encargos to authenticated;
