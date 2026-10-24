-- ============================================================
-- SOLICITUDES: lista de espera y mensajes de contacto
-- ============================================================
-- El sitio público guarda aquí los correos de "Únete a la lista" y los
-- mensajes del formulario de contacto (ruta /api/lista).
--
-- Seguridad (RLS):
-- - Cualquiera (anónimo o con sesión) puede INSERTAR una fila, y solo en
--   las columnas tipo, correo, nombre, negocio y mensaje.
-- - NADIE puede leer, cambiar ni borrar filas desde el sitio: no hay
--   políticas de select/update/delete y se quitan esos permisos. Las
--   solicitudes se revisan desde el panel de Supabase.
-- - Los límites de largo y la forma del correo los revisa la base de
--   datos, aunque alguien se salte el formulario.
-- ============================================================

create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  creada timestamptz not null default now(),
  tipo text not null default 'lista' check (tipo in ('lista', 'contacto')),
  correo text not null check (
    char_length(correo) between 6 and 254
    and correo = lower(btrim(correo))
    and correo ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
  ),
  nombre text check (nombre is null or char_length(nombre) between 1 and 120),
  negocio text check (negocio is null or char_length(negocio) between 1 and 160),
  mensaje text check (mensaje is null or char_length(mensaje) between 1 and 2000),
  -- Un mensaje de contacto siempre trae texto
  constraint solicitudes_contacto_con_mensaje check (tipo <> 'contacto' or mensaje is not null)
);

-- Un correo se anota una sola vez en la lista de espera (los contactos sí se repiten)
create unique index if not exists solicitudes_lista_correo_unico
  on public.solicitudes (correo)
  where tipo = 'lista';

create index if not exists solicitudes_creada_idx on public.solicitudes (creada desc);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY: solo insertar
-- ------------------------------------------------------------
alter table public.solicitudes enable row level security;

revoke all on table public.solicitudes from anon, authenticated;
grant insert (tipo, correo, nombre, negocio, mensaje) on table public.solicitudes to anon, authenticated;

drop policy if exists "solicitudes: cualquiera puede anotarse" on public.solicitudes;
create policy "solicitudes: cualquiera puede anotarse"
  on public.solicitudes
  for insert
  to anon, authenticated
  with check (tipo in ('lista', 'contacto'));

-- Sin políticas de select, update ni delete: desde el sitio nadie puede leerla.
