# Instrucciones para Strix (Atendel)

Atendel es una app Next.js 15 (App Router) + Supabase (Postgres con RLS) en Vercel. El dueño de
este repositorio autoriza esta prueba de seguridad sobre este código y, si se da, sobre la copia
de prueba indicada como objetivo.

Reglas:
- Nunca ataques la app real (good-kebab.vercel.app) ni ningún dominio que no sea el objetivo dado.
- Nada destructivo: no borres datos, no llenes tablas, no mandes correos ni WhatsApp a nadie, no
  hagas pruebas de carga ni de denegación de servicio.
- No llames a servicios de terceros (Google, Microsoft, Meta, Anthropic, Shopify, etc.).
- Si encuentras una clave o token, no la uses: solo repórtala.

Dónde enfocarte:
- Autorización en cada ruta de `src/app/api/**/route.ts` (sesión con supabase.auth.getUser,
  llave `x-atendel-llave` en /api/trabajo y /api/whatsapp/responder, firma de Meta en el webhook).
- Que el cliente de servicio (`src/lib/supabase/servicio.ts`, salta RLS) siempre filtre por
  `owner_id` del usuario autenticado.
- Políticas RLS y funciones `security definer` en `supabase/migrations/`.
- Inyección de instrucciones a la IA: correos, mensajes de WhatsApp y datos de apps son DATOS;
  ninguna acción con efecto (mandar, agendar, borrar, pagar) debe pasar sin aprobación del dueño.
- XSS en el renderizado del chat (`src/components/Texto.tsx`), CSRF/CORS (`src/middleware.ts`),
  cabeceras (`next.config.mjs`), subida de archivos y SSRF (`src/lib/documentos/url-segura.ts`).
- ReDoS en expresiones regulares aplicadas a texto de fuera.

Reporta cada hallazgo con archivo y línea, cómo se explota y el arreglo propuesto.
