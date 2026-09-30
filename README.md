# Agente de Correo — MVP

Este es el primer agente de tu app: lee el correo sin leer de Gmail y genera
un resumen + acción sugerida con IA. Construido con seguridad desde la base:

- **Row Level Security (RLS)** en la base de datos — cada negocio solo ve sus
  propios datos, garantizado por la base de datos misma, no solo por el código.
- **Security headers** (CSP, HSTS, X-Frame-Options, etc.) en todas las respuestas.
- **CORS restringido** — solo los dominios que tú apruebes pueden llamar a la API.

## Qué necesitas antes de empezar

1. **Node.js** instalado (versión 18 o más nueva) — https://nodejs.org
2. **Claude Code** instalado en tu computadora (ya lo descargaste antes)
3. Una cuenta en **Supabase** (gratis) — https://supabase.com
4. Una cuenta en **Anthropic Console** para la clave de la IA — https://console.anthropic.com
5. Un proyecto en **Google Cloud Console** con el permiso de Gmail activado
   (para que puedas iniciar sesión con Google y leer el correo)

## Pasos para correrlo

### 1. Instalar las dependencias

Abre Claude Code en la carpeta de este proyecto y dile:

```
Instala las dependencias del proyecto con npm install
```

O, si prefieres hacerlo tú mismo en la terminal:

```bash
npm install
```

### 2. Crear tu proyecto en Supabase

1. Ve a https://supabase.com, crea un proyecto nuevo (gratis).
2. En "Project Settings" → "API", copia la **URL** y la **anon key**.
3. En "Authentication" → "Providers", activa **Google** y sigue sus
   instrucciones para conectar tu proyecto de Google Cloud (necesitas pedir
   el scope `https://www.googleapis.com/auth/gmail.readonly`).
4. En "SQL Editor", pega el contenido del archivo
   `supabase/migrations/0001_init.sql` y ejecútalo — esto crea las tablas
   con Row Level Security ya activado.

### 3. Configurar tus variables de entorno

Copia `.env.example` a un archivo nuevo llamado `.env.local` y llena los
valores reales (Supabase, Anthropic).

### 4. Correrlo localmente

```bash
npm run dev
```

Abre http://localhost:3000, conecta tu cuenta de Google, y dale a
"Revisar correo nuevo".

### Modo de prueba (sin Google Cloud)

Si todavía no configuras Google Cloud, puedes probar la app igual:

1. Solo necesitas los pasos 2.1, 2.2, 2.4 (Supabase) y el paso 3.
2. En la pantalla de inicio escribe tu correo y dale a "Enviarme link de
   acceso". Abre el link **en el mismo navegador**.
3. Pega un correo (o usa uno de los ejemplos) y dale a "Resumir con IA".
   El resultado se guarda y aparece en "Historial guardado".

Nota: el servicio de correo gratuito de Supabase manda pocos emails por
hora. Si el link no llega, espera unos minutos antes de pedir otro.

## Qué sigue después de que esto funcione

Una vez que pruebes esto tú mismo (o con 2-3 negocios reales) y confirmes
que no falla, el siguiente paso es agregar el agente de WhatsApp sobre esta
misma base — no se construye desde cero, se agrega al mismo proyecto.
