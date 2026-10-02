-- ============================================================
-- PLANES, AGENTES ELEGIDOS Y CHAT CON LOS AGENTES
-- ============================================================
-- Agentes: clara (Correo), lola (WhatsApp), victor (Ventas),
-- oscar (Operación), lucia (Clientes), iris (Investigación).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Plan de cada usuario (free / one / max)
-- El usuario solo puede LEER su plan. Nadie puede cambiárselo desde
-- la app: se cambia desde el panel de Supabase (o, más adelante, desde
-- el sistema de pagos con la service role). Sin fila = plan free.
-- ------------------------------------------------------------
create table if not exists public.suscripciones (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'one', 'max')),
  actualizado_en timestamptz not null default now()
);
alter table public.suscripciones enable row level security;

create policy "suscripciones: el dueño lee la suya"
  on public.suscripciones for select
  using (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- 2. Agentes que cada usuario tiene en su equipo
-- El usuario sí los cambia; el servidor revisa su plan antes de usarlos.
-- ------------------------------------------------------------
create table if not exists public.agentes_elegidos (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  agentes text[] not null default '{clara}'
    check (agentes <@ array['clara', 'lola', 'victor', 'oscar', 'lucia', 'iris']::text[]),
  actualizado_en timestamptz not null default now()
);
alter table public.agentes_elegidos enable row level security;

create policy "agentes_elegidos: el dueño ve y edita los suyos"
  on public.agentes_elegidos for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- 3. Conversaciones y mensajes del chat
-- ------------------------------------------------------------
create table if not exists public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  agente text not null check (agente in ('clara', 'lola', 'victor', 'oscar', 'lucia', 'iris')),
  titulo text not null default 'Nueva conversación' check (char_length(titulo) <= 120),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists conversaciones_owner_fecha
  on public.conversaciones (owner_id, actualizado_en desc);
alter table public.conversaciones enable row level security;

create policy "conversaciones: el dueño ve y edita las suyas"
  on public.conversaciones for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.conversaciones(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rol text not null check (rol in ('user', 'assistant')),
  contenido text not null check (char_length(contenido) <= 40000),
  creado_en timestamptz not null default now()
);
create index if not exists mensajes_conversacion_fecha
  on public.mensajes (conversacion_id, creado_en);
alter table public.mensajes enable row level security;

-- Se pueden leer y agregar mensajes propios, en conversaciones propias.
-- (Se borran solo junto con su conversación.)
create policy "mensajes: el dueño los lee"
  on public.mensajes for select
  using (auth.uid() = owner_id);

create policy "mensajes: el dueño agrega en sus conversaciones"
  on public.mensajes for insert
  with check (
    auth.uid() = owner_id
    and conversacion_id in (select id from public.conversaciones where owner_id = auth.uid())
  );

-- ------------------------------------------------------------
-- 4. Uso mensual (para los límites de cada plan)
-- Es un contador aparte: borrar conversaciones NO lo reinicia.
-- El usuario lo puede leer, pero solo sube con la función de abajo.
-- ------------------------------------------------------------
create table if not exists public.uso_mensual (
  owner_id uuid not null references auth.users(id) on delete cascade,
  mes date not null,
  mensajes integer not null default 0,
  primary key (owner_id, mes)
);
alter table public.uso_mensual enable row level security;

create policy "uso_mensual: el dueño lee el suyo"
  on public.uso_mensual for select
  using (auth.uid() = owner_id);

create or replace function public.sumar_mensaje()
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.uso_mensual (owner_id, mes, mensajes)
  values (auth.uid(), date_trunc('month', now())::date, 1)
  on conflict (owner_id, mes)
  do update set mensajes = public.uso_mensual.mensajes + 1
  returning mensajes;
$$;

revoke execute on function public.sumar_mensaje() from public, anon;
grant execute on function public.sumar_mensaje() to authenticated;
