-- 0008 · Ajustes de la cuenta
--
-- Lo que la persona elige en la ventana de Ajustes y no tiene otra tabla:
-- cómo hablan sus agentes (trato, estilo, firma, reglas por agente), la zona
-- horaria, la apariencia, los avisos y los datos para su CFDI. Una fila por
-- cuenta, en un jsonb que la API valida campo por campo (src/lib/ajustes.ts).
-- (El perfil del negocio vive en perfil_negocio y el equipo en
-- agentes_elegidos; aquí no se repiten.)
--
-- Se llama 0008 porque 0007 está apartada para el endurecimiento de
-- conexiones.

create table if not exists public.ajustes_cuenta (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  datos jsonb not null default '{}'::jsonb
    check (jsonb_typeof(datos) = 'object' and pg_column_size(datos) <= 16384),
  actualizado_en timestamptz not null default now()
);
alter table public.ajustes_cuenta enable row level security;

drop policy if exists "ajustes_cuenta: el dueño lee los suyos" on public.ajustes_cuenta;
create policy "ajustes_cuenta: el dueño lee los suyos"
  on public.ajustes_cuenta for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "ajustes_cuenta: el dueño crea los suyos" on public.ajustes_cuenta;
create policy "ajustes_cuenta: el dueño crea los suyos"
  on public.ajustes_cuenta for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "ajustes_cuenta: el dueño edita los suyos" on public.ajustes_cuenta;
create policy "ajustes_cuenta: el dueño edita los suyos"
  on public.ajustes_cuenta for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "ajustes_cuenta: el dueño borra los suyos" on public.ajustes_cuenta;
create policy "ajustes_cuenta: el dueño borra los suyos"
  on public.ajustes_cuenta for delete to authenticated
  using ((select auth.uid()) = owner_id);
