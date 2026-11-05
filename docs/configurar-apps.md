# Configurar "Tu negocio" y las apps conectadas

Esta guía dice qué hay que poner en Vercel para que funcione la sección
**Tu negocio** (perfil, documentos y apps conectadas). Todo se pone en
Vercel; **nunca pegues una llave en el chat** ni en el código.

Dónde se ponen las variables en Vercel:
**tu proyecto → Settings → Environment Variables → Add New**. Después de
agregar o cambiar una variable hay que volver a publicar el sitio
(**Deployments → los tres puntos del último → Redeploy**) para que la use.

---

## 1. La llave de cifrado: `ATENDEL_LLAVE_CIFRADO`

**Qué es.** Cuando conectas una app (Gmail, Drive, Notion…), esa app le da
a Atendel un permiso (un "token"). Atendel lo guarda **cifrado** en la base
de datos con esta llave. Así, aunque alguien viera la base de datos, no
podría usar esos permisos sin la llave, y la llave solo vive en Vercel.

**Sin esta llave no se puede conectar ninguna app.** El perfil y los
documentos sí funcionan sin ella.

### Cómo generarla

Es un texto al azar de 32 bytes. Genera uno nuevo en tu computadora (no
copies uno de internet ni de otra persona):

- **Mac o Linux:** abre la app **Terminal**, pega esto y presiona Enter:

  ```
  openssl rand -base64 32
  ```

- **Windows:** abre **PowerShell**, pega esto y presiona Enter:

  ```
  $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
  ```

Sale algo como `q3Jx…=` (44 caracteres). Ese texto es la llave.

### Dónde ponerla

En Vercel, **Settings → Environment Variables → Add New**:

| Campo | Qué poner |
|---|---|
| Key | `ATENDEL_LLAVE_CIFRADO` |
| Value | el texto que salió (completo, con el `=` del final) |
| Environments | **Production** (y **Preview** si usas vistas previas) |
| Sensitive | actívalo, para que Vercel no la vuelva a mostrar |

Guarda y haz **Redeploy**.

### Cuidados

- **No la cambies una vez que haya apps conectadas.** Si cambia, los
  permisos guardados ya no se pueden leer y cada persona tendría que volver
  a conectar sus apps. (No se pierde nada más: perfil y documentos siguen.)
- **No la compartas** ni la pegues en el chat, en correos o en el código.
- Si crees que alguien la vio: genera una nueva, ponla en Vercel, haz
  Redeploy y pide que se vuelvan a conectar las apps.
- Si la llave falta o está mal copiada, la app lo dice con un mensaje claro
  ("Falta la llave de cifrado…" o "La llave … no es válida").

---

## 2. La base de datos: la migración `0006_tu_negocio.sql`

El archivo `supabase/migrations/0006_tu_negocio.sql` prepara la base de
datos de Supabase para Tu negocio. **La aplica el equipo** con el conector
de Supabase; tú no tienes que correr nada. Se puede correr dos veces sin
romper nada.

### Qué agrega

| Qué | Para qué sirve |
|---|---|
| Tabla `perfil_negocio` | Lo que escribes en Tu negocio > Perfil (a qué te dedicas, servicios y precios, horarios, ubicación, formas de pago, políticas, tono, preguntas frecuentes y algo más). Máximo 2000 caracteres por campo. Lo leen todos los agentes. |
| Tabla `documentos` | La lista de tus documentos (PDF, Word, TXT, MD, links, Drive y Notion) con su estado: procesando, listo o con error. |
| Tabla `fragmentos_doc` | El texto de cada documento partido en pedazos de ~1200 caracteres, con búsqueda en español. Es lo que los agentes consultan para contestar. |
| Tabla `conexiones` | Las apps que conectas, con sus permisos **cifrados** (ver la llave de arriba). |
| Tabla `apps_interes` | Las apps que todavía no están listas y para las que pediste "Avísame". |
| Carpeta `documentos` en Storage | Donde se guardan los archivos que subes. Es **privada**: cada persona tiene su propia carpeta y nadie más la puede abrir. Máximo 10 MB por archivo. |
| Función `buscar_fragmentos` | La búsqueda que usan los agentes en el chat para encontrar en tus documentos lo que te preguntan. |

### Seguridad

- **Cada quien solo ve lo suyo.** Todas las tablas y la carpeta de archivos
  tienen reglas en la propia base de datos (Row Level Security): aunque
  alguien intentara saltarse la app, no podría ver ni tocar los datos de
  otro negocio. Los visitantes sin sesión no tienen acceso a nada.
- **Límites que revisa la base de datos:** el largo de cada campo y el
  número de documentos por plan (Free 3, One 20, Max 100). Si alguien se
  salta la app, la base de datos igual dice que no.
- **No se usa la "service role key"** (la llave que se salta las reglas):
  todo funciona con la sesión de cada persona.

### Cómo revisar que quedó

En Supabase: **Table Editor** muestra las tablas de arriba y **Storage**
muestra el bucket `documentos` marcado como privado.

---

## 3. Lo que conviene saber de los documentos

- Se pueden subir **PDF, Word (.docx), TXT y MD** de hasta **10 MB**, o
  agregar un **link** público (página web, texto o PDF de hasta 2 MB).
- Se guardan hasta **300 mil caracteres** de texto por documento (un manual
  de unas 100 páginas). Lo demás no se usa.
- Un **PDF escaneado** (una foto de papel) por ahora no se puede leer: hace
  falta la versión con texto, un Word o un TXT.
- Los links tienen que ser **públicos**: una página que pide iniciar sesión
  o una dirección interna de una red privada no se pueden agregar.
- Los agentes usan lo que dicen tus documentos y tu perfil; si algo no está
  ahí, lo dicen en lugar de inventarlo, y no obedecen instrucciones que
  vengan escritas dentro de un documento.
