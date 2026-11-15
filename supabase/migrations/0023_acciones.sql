-- ============================================================
-- 0023 · Lo que Atendel HACE en tus apps (src/lib/acciones.ts)
--
-- Crear, mover o cancelar citas, mandar correos, crear tareas…:
-- - lo que espera tu OK (estado 'esperando'): se hace con un clic en
--   «Necesita tu OK» (/api/acciones/[id]);
-- - lo que ya hizo (estado 'hecha'), como historial.
-- Solo el servidor escribe filas. El dueño las lee y solo puede cambiar el
-- estado (tomarla para hacerla o descartarla).
-- ============================================================

create table if not exists public.acciones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  herramienta text not null check (herramienta ~ '^[a-z0-9_]{3,80}$'),
  app text not null check (app ~ '^[a-z0-9_]{2,40}$'),
  categoria text not null check (categoria in ('preguntas', 'citas', 'seguimiento', 'precios', 'dinero', 'nuevo', 'correos', 'apps')),
  args jsonb not null default '{}'::jsonb check (jsonb_typeof(args) = 'object' and pg_column_size(args) <= 40000),
  resumen text not null check (char_length(resumen) between 1 and 500),
  motivo text check (motivo is null or char_length(motivo) <= 300),
  origen text not null check (origen in ('chat', 'tarea', 'trabajo', 'whatsapp')),
  estado text not null default 'esperando' check (estado in ('esperando', 'haciendo', 'hecha', 'descartada', 'error')),
  resultado text check (resultado is null or char_length(resultado) <= 2000),
  conversacion_id uuid references public.conversaciones(id) on delete set null,
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz
);
create index if not exists acciones_dueno_estado on public.acciones (owner_id, estado, creado_en desc);
alter table public.acciones enable row level security;
drop policy if exists "acciones: el dueño lee" on public.acciones;
create policy "acciones: el dueño lee" on public.acciones for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "acciones: el dueño decide" on public.acciones;
create policy "acciones: el dueño decide" on public.acciones for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
revoke all on public.acciones from anon, authenticated;
grant select on public.acciones to authenticated;
grant update (estado) on public.acciones to authenticated;
