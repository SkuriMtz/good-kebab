-- 0037: noticias de tu industria (Tablero).
-- Una fila por tipo de negocio + idioma (la clave, p. ej. «dentista|es-MX»),
-- compartida entre todos los negocios de ese tipo: solo lleva noticias
-- públicas, nada de nadie. Se renueva una vez al día.
-- - Leer: cualquier persona con sesión (son noticias públicas).
-- - Escribir: solo el servidor (service_role), que valida cada enlace.

create table if not exists public.noticias_industria (
  clave text primary key check (char_length(clave) between 3 and 80),
  dia text not null check (dia ~ '^\d{4}-\d{2}-\d{2}$'),
  noticias jsonb not null default '[]'::jsonb check (jsonb_typeof(noticias) = 'array' and jsonb_array_length(noticias) <= 6),
  actualizado_en timestamptz not null default now()
);

alter table public.noticias_industria enable row level security;

revoke all on table public.noticias_industria from anon, authenticated;
grant select on table public.noticias_industria to authenticated;

drop policy if exists "noticias: leer" on public.noticias_industria;
create policy "noticias: leer" on public.noticias_industria
  for select to authenticated using (true);
