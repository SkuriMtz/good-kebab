-- ============================================================
-- 0028 · El aviso de «cambió tu plan» también puede salir por WhatsApp
-- (si el dueño conectó su WhatsApp para avisos; si no, se omite al salir).
-- ============================================================

create or replace function public.avisar_cambio_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.plan is distinct from old.plan then
    insert into public.avisos_salida (owner_id, tipo, nivel, titulo, texto, enlace, clave, app, whatsapp, wa_desde, agente, chat)
    values (
      new.owner_id,
      'plan_cambio',
      'importante',
      'Cambió tu plan',
      'Tu plan de Atendel cambió. Mira qué incluye en Ajustes → Plan y facturación.',
      '/panel?vista=ajustes&seccion=plan',
      'plan:' || left(coalesce(new.plan, ''), 40) || ':' || to_char(now(), 'YYYYMMDDHH24MISS'),
      'pendiente',
      'pendiente',
      now(),
      'iris',
      'Tu plan de Atendel cambió. Mira qué incluye en [Ajustes → Plan y facturación](/panel?vista=ajustes&seccion=plan).'
    )
    on conflict (owner_id, clave) do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function public.avisar_cambio_plan() from public, anon, authenticated;
