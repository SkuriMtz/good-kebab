-- ============================================================
-- ESQUEMA INICIAL + ROW LEVEL SECURITY (RLS)
-- ============================================================
-- RLS es la regla que dice: "cada fila de esta tabla solo la puede
-- ver/tocar su dueño". Sin esto, cualquier usuario autenticado podría
-- leer o modificar los datos de OTRO negocio con solo cambiar un ID
-- en la petición. Con RLS, eso es imposible incluso si alguien
-- intenta manipular la app: la base de datos misma lo bloquea.
-- ============================================================

-- Tabla de negocios (cada usuario que se registra crea/pertenece a uno)
create table if not exists public.negocios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  creado_en timestamptz not null default now()
);

-- Tabla de resúmenes de correo generados por el agente de IA
create table if not exists public.resumenes_correo (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  remitente text,
  asunto text,
  resumen text not null,
  accion_sugerida text,
  correo_original_id text, -- id del mensaje en Gmail, para no procesarlo dos veces
  creado_en timestamptz not null default now()
);

-- Índice para no reprocesar el mismo correo dos veces
create unique index if not exists resumenes_correo_unico
  on public.resumenes_correo (negocio_id, correo_original_id);

-- ------------------------------------------------------------
-- ACTIVAR ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.negocios enable row level security;
alter table public.resumenes_correo enable row level security;

-- Política: un usuario solo puede ver/editar SU PROPIO negocio
create policy "negocios: dueño ve y edita el suyo"
  on public.negocios
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Política: un usuario solo puede ver/editar los resúmenes de correo
-- que pertenecen a SU PROPIO negocio (no a cualquier negocio_id que
-- alguien intente inventar en la petición)
create policy "resumenes_correo: solo del propio negocio"
  on public.resumenes_correo
  for all
  using (
    negocio_id in (
      select id from public.negocios where owner_id = auth.uid()
    )
  )
  with check (
    negocio_id in (
      select id from public.negocios where owner_id = auth.uid()
    )
  );
