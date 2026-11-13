-- ============================================================
-- 0012. MÁS DOCUMENTOS POR PLAN, CON TOPE DE ESPACIO
--
-- Antes: free 3, one 20, max 100 documentos. Ahora: free 10, one 100,
-- max 500, y además un tope de espacio por cuenta (free 25 MB, one
-- 500 MB, max 2 GB), porque lo que pesa en la base y en Storage es el
-- tamaño, no el número. Mismos números que MAX_DOCUMENTOS_POR_PLAN y
-- MAX_MB_DOCUMENTOS_POR_PLAN en src/lib/nucleo-tipos.ts.
--
-- El espacio de un documento es lo más grande entre su archivo (bytes,
-- 0 si no hay archivo: links, Drive) y su texto (caracteres). Solo
-- agrega una columna y reemplaza la función del trigger: no borra nada.
-- ============================================================

alter table public.documentos
  add column if not exists bytes bigint not null default 0;

alter table public.documentos drop constraint if exists documentos_bytes_valido;
alter table public.documentos
  add constraint documentos_bytes_valido check (bytes >= 0 and bytes <= 10485760);

create or replace function public.revisar_limite_documentos()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  plan_actual text;
  maximo integer;
  maximo_mb integer;
  actuales integer;
  usado bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('documentos:' || new.owner_id::text, 0));
  select s.plan into plan_actual from public.suscripciones s where s.owner_id = new.owner_id;
  maximo := case coalesce(plan_actual, 'free') when 'max' then 500 when 'one' then 100 else 10 end;
  maximo_mb := case coalesce(plan_actual, 'free') when 'max' then 2048 when 'one' then 500 else 25 end;
  select count(*), coalesce(sum(greatest(d.bytes, d.caracteres::bigint)), 0)
    into actuales, usado
    from public.documentos d where d.owner_id = new.owner_id;
  if actuales >= maximo then
    raise exception 'Llegaste al límite de % documentos de tu plan. Borra alguno para agregar otro.', maximo
      using errcode = 'P0001';
  end if;
  if usado + coalesce(new.bytes, 0) > maximo_mb::bigint * 1048576 then
    raise exception 'Llegaste al límite de espacio de tu plan (% MB). Borra algún documento para agregar otro.', maximo_mb
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.revisar_limite_documentos() from public, anon, authenticated;
