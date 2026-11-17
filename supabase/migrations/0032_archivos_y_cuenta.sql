-- ============================================================
-- 0032 · Tipos de archivo permitidos en Storage
-- ============================================================
-- Cada bucket privado solo acepta los tipos que Atendel sube de verdad.
-- Si alguien intenta subir otra cosa (un .exe, un .html...) Storage la
-- rechaza aunque se salte la revisión de la app. No toca file_size_limit
-- (sigue en 10 MB) ni las políticas.
--
-- Los tipos van exactos y sin parámetros (sin "; charset=utf-8"): el código
-- manda estos mismos valores (src/lib/documentos/extraer.ts y
-- src/components/panel/negocio/fuente.ts).

-- "documentos": lo que sube el dueño (PDF, Word, TXT y Markdown)
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown'
]
where id = 'documentos';

-- "archivos": lo que genera Atendel (hoy, presentaciones PowerPoint)
update storage.buckets
set allowed_mime_types = array[
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]
where id = 'archivos';
