-- ============================================================
-- 0014 · Oficina: lo que tu equipo te dejó, para revisarlo
--
-- Cada archivo que arma tu equipo (una presentación, un Excel, un informe)
-- llega a la Oficina "por revisar". Ahí lo abres y lo apruebas o pides
-- cambios. Solo se guarda tu revisión: el archivo no cambia.
--
-- - revision: 'revisar' (recién llegado), 'aprobado' o 'cambios' (pediste cambios).
-- - El dueño solo puede cambiar esas dos columnas (revision y revisado_en);
--   el nombre, la ruta y lo demás siguen sin poder tocarse desde el navegador.
-- ============================================================

alter table public.archivos
  add column if not exists revision text not null default 'revisar',
  add column if not exists revisado_en timestamptz;

alter table public.archivos drop constraint if exists archivos_revision_valida;
alter table public.archivos
  add constraint archivos_revision_valida check (revision in ('revisar', 'aprobado', 'cambios'));

create index if not exists archivos_por_revisar on public.archivos (owner_id, revision, creado_en desc);

-- Actualizar: solo el dueño, y solo la revisión
revoke update on public.archivos from authenticated, anon;
grant update (revision, revisado_en) on public.archivos to authenticated;

drop policy if exists "archivos: el dueño revisa" on public.archivos;
create policy "archivos: el dueño revisa" on public.archivos
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
