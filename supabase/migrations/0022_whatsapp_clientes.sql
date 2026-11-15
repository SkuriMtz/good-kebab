-- ============================================================
-- 0022 · WhatsApp de verdad: los mensajes de tus clientes
--
-- Un cliente le escribe al WhatsApp del negocio → Meta avisa a
-- /api/whatsapp/webhook → se guarda aquí → la base de datos le pide al
-- servidor (/api/whatsapp/responder) que Lola conteste. Si es algo que hace
-- sola (según "Qué hace solo" y si cuadra con las Reglas) contesta al
-- momento; si no (dinero, algo nuevo, no cuadra con las Reglas), deja la
-- respuesta "esperando tu OK" en la Oficina.
--
-- - whatsapp_numeros: qué número es de qué cuenta. Solo lo escribe el
--   servidor al conectar Meta (nadie puede reclamar el número de otro).
--   El dueño puede quitarlo (deja de recibir ahí).
-- - whatsapp_mensajes: lo que entra y lo que sale. El dueño los lee y solo
--   puede cambiar el estado (lo de mandar lo hace el servidor).
--
-- Estados de un mensaje del cliente (entrante):
--   recibido → pensando → respondido | esperando_ok | sin_respuesta | error
--                       → agrupado (llegó otro suyo atrás; se contestan juntos)
--   esperando_ok | sin_respuesta | error → mandando → respondido | error
--   esperando_ok | sin_respuesta | error → descartado (decidiste no contestar)
-- De lo que sale (saliente): enviado | error (Meta avisó que no llegó).
-- ============================================================

create table if not exists public.whatsapp_numeros (
  phone_number_id text primary key check (phone_number_id ~ '^[0-9]{5,30}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  waba_id text check (waba_id is null or waba_id ~ '^[0-9]{5,30}$'),
  creado_en timestamptz not null default now()
);
create index if not exists whatsapp_numeros_dueno on public.whatsapp_numeros (owner_id);
alter table public.whatsapp_numeros enable row level security;
drop policy if exists "whatsapp_numeros: el dueño lee" on public.whatsapp_numeros;
create policy "whatsapp_numeros: el dueño lee" on public.whatsapp_numeros for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "whatsapp_numeros: el dueño lo quita" on public.whatsapp_numeros;
create policy "whatsapp_numeros: el dueño lo quita" on public.whatsapp_numeros for delete to authenticated using ((select auth.uid()) = owner_id);
revoke all on public.whatsapp_numeros from anon, authenticated;
grant select, delete on public.whatsapp_numeros to authenticated;

create table if not exists public.whatsapp_mensajes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  telefono text not null check (telefono ~ '^[0-9]{6,20}$'),
  nombre text check (nombre is null or char_length(nombre) <= 120),
  direccion text not null check (direccion in ('entrante', 'saliente')),
  texto text not null check (char_length(texto) between 1 and 4096),
  -- El id del mensaje en Meta: si Meta avisa dos veces, no se guarda dos veces
  wa_id text unique check (wa_id is null or char_length(wa_id) <= 200),
  estado text not null default 'recibido' check (estado in (
    'recibido', 'pensando', 'agrupado', 'respondido', 'esperando_ok', 'sin_respuesta', 'mandando', 'descartado', 'error', 'enviado'
  )),
  -- Quién mandó lo que sale: Lola sola o tú (al aprobar)
  autor text check (autor is null or autor in ('lola', 'dueno')),
  -- Lo que Lola propone contestar cuando espera tu OK, y por qué
  borrador text check (borrador is null or char_length(borrador) <= 4096),
  motivo text check (motivo is null or char_length(motivo) <= 300),
  creado_en timestamptz not null default now()
);
create index if not exists whatsapp_mensajes_chat on public.whatsapp_mensajes (owner_id, telefono, creado_en desc);
create index if not exists whatsapp_mensajes_estado on public.whatsapp_mensajes (owner_id, estado, creado_en desc);
alter table public.whatsapp_mensajes enable row level security;
drop policy if exists "whatsapp_mensajes: el dueño lee" on public.whatsapp_mensajes;
create policy "whatsapp_mensajes: el dueño lee" on public.whatsapp_mensajes for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "whatsapp_mensajes: el dueño decide" on public.whatsapp_mensajes;
create policy "whatsapp_mensajes: el dueño decide" on public.whatsapp_mensajes for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
revoke all on public.whatsapp_mensajes from anon, authenticated;
grant select on public.whatsapp_mensajes to authenticated;
grant update (estado) on public.whatsapp_mensajes to authenticated;

-- Al llegar un mensaje de un cliente: que Lola conteste (en el servidor, con la llave del Vault)
create or replace function public.whatsapp_avisar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  llave text;
begin
  if new.direccion <> 'entrante' then
    return new;
  end if;
  select s.decrypted_secret into llave from vault.decrypted_secrets s where s.name = 'atendel_llave_trabajo';
  if llave is null then
    return new;
  end if;
  perform net.http_post(
    url := 'https://good-kebab.vercel.app/api/whatsapp/responder',
    body := jsonb_build_object('id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-atendel-llave', llave),
    timeout_milliseconds := 60000
  );
  return new;
end;
$$;
revoke execute on function public.whatsapp_avisar() from public, anon, authenticated;
drop trigger if exists whatsapp_avisar on public.whatsapp_mensajes;
create trigger whatsapp_avisar after insert on public.whatsapp_mensajes for each row execute function public.whatsapp_avisar();
