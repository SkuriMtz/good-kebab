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

---

## 4. Conectar apps: Google, Microsoft y Notion

Para que el botón **Conectar** de una app funcione, hay que dar de alta a
Atendel con cada proveedor (una sola vez) y poner en Vercel lo que te dan.
Mientras falte algo, la tarjeta de la app dice exactamente qué variable
falta. Las apps solo se **leen**: ningún agente escribe, manda ni borra.

**Antes de empezar.** En los pasos dice `<dominio>`: es la dirección de tu
sitio en producción, por ejemplo `atendel.mx` o `tu-proyecto.vercel.app`.
- Tiene que estar en la variable `ALLOWED_ORIGINS` (con `https://`) o ser
  el dominio de producción de Vercel; si no, Atendel no deja conectar desde
  ahí (protege contra sitios falsos).
- Las direcciones de regreso ("redirect URI") se escriben **exactas**: con
  `https://`, sin `/` al final y sin espacios.
- Para probar en tu computadora, agrega también la versión con
  `http://localhost:3000` (solo funciona en modo desarrollo).

### 4.1 Google (Gmail, Calendar, Drive, Sheets, Contactos y Perfil de Negocio)

Un solo "cliente" de Google sirve para las seis apps.

1. **Crea el proyecto.** Entra a https://console.cloud.google.com, arriba
   en el selector de proyectos elige **Proyecto nuevo** y ponle "Atendel".
2. **Activa las APIs.** Menú → **APIs y servicios → Biblioteca**. Busca y
   activa (botón **Habilitar**) cada una:
   - Gmail API
   - Google Calendar API
   - Google Drive API
   - Google Sheets API
   - Google Picker API (para elegir archivos de Drive)
   - People API (Contactos)
   - Solo si vas a usar reseñas: My Business Account Management API,
     My Business Business Information API y Google My Business API. Estas
     tres no se activan solas: Google pide llenar un **formulario de acceso
     a la API de Perfil de Negocio** y aprobarlo (tarda días).
3. **Pantalla de consentimiento** (lo que ve la persona al conectar). Menú →
   **APIs y servicios → Pantalla de consentimiento de OAuth** (en la versión
   nueva se llama **Google Auth Platform**):
   - Tipo de usuario: **Externo**.
   - Nombre de la app ("Atendel"), correo de soporte, logo opcional y, en
     **Dominios autorizados**, tu `<dominio>`.
   - En **Permisos** (o **Acceso a datos → Agregar o quitar permisos**)
     agrega exactamente estos, todos de solo lectura:

     | Permiso | Para qué app |
     |---|---|
     | `openid` y `.../auth/userinfo.email` | saber qué cuenta se conectó |
     | `https://www.googleapis.com/auth/gmail.readonly` | Gmail |
     | `https://www.googleapis.com/auth/calendar.readonly` | Google Calendar |
     | `https://www.googleapis.com/auth/drive.file` | Google Drive (solo los archivos que la persona elige) |
     | `https://www.googleapis.com/auth/spreadsheets.readonly` | Google Sheets |
     | `https://www.googleapis.com/auth/contacts.readonly` | Contactos |
     | `https://www.googleapis.com/auth/business.manage` | Perfil de Negocio (solo si Google ya aprobó el acceso) |

4. **Usuarios de prueba.** Mientras la app no esté verificada por Google,
   queda en modo **Prueba**: en **Público → Usuarios de prueba** agrega los
   correos de Gmail que van a conectar (hasta 100). Cualquier otra cuenta
   ve "Acceso bloqueado". En modo Prueba, Google además vence el permiso a
   los **7 días**: la tarjeta lo marca con error y basta con volver a
   conectar.
5. **El cliente OAuth.** Menú → **APIs y servicios → Credenciales → Crear
   credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - **Orígenes de JavaScript autorizados:** `https://<dominio>`
   - **URI de redireccionamiento autorizados:**
     `https://<dominio>/api/conexiones/google/callback`
     (y para pruebas: `http://localhost:3000/api/conexiones/google/callback`)
   - Al crear, Google muestra el **ID de cliente** y el **Secreto del
     cliente**.
6. **El Picker de Drive.** En **Credenciales → Crear credenciales → Clave
   de API**. Ábrela y restríngela (importante, porque esta clave se ve en
   el navegador):
   - **Restricciones de aplicaciones:** Sitios web → `https://<dominio>/*`
   - **Restricciones de API:** solo **Google Picker API**.
   El **App ID** es el **número del proyecto**: menú → **Configuración de
   IAM y administración → Configuración** (o el panel del proyecto),
   "Número del proyecto" (solo dígitos).
7. **Para abrirlo a todos** (más de 100 cuentas, sin "usuarios de prueba"):
   en la pantalla de consentimiento toca **Publicar app** y pide la
   verificación. Gmail es un permiso **restringido**: Google pide además una
   revisión de seguridad hecha por un tercero, cada año. Calendar, Sheets,
   Contactos y Perfil de Negocio son **sensibles** (piden verificación sin
   esa revisión); `drive.file` no es sensible.

**En Vercel:**

| Variable | Valor |
|---|---|
| `GOOGLE_CLIENT_ID` | el ID de cliente (termina en `.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | el secreto del cliente (márcalo **Sensitive**) |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | la clave de API restringida del paso 6 |
| `NEXT_PUBLIC_GOOGLE_APP_ID` | el número del proyecto |

### 4.2 Microsoft (Outlook, Calendario de Outlook, OneDrive, Excel y Contactos)

1. Entra a https://portal.azure.com (con cualquier cuenta de Microsoft) →
   busca **Microsoft Entra ID** → **Registros de aplicaciones → Nuevo
   registro**.
   - Nombre: "Atendel".
   - **Tipos de cuenta compatibles:** "Cuentas en cualquier directorio
     organizativo y cuentas personales de Microsoft" (así sirve para
     Outlook.com, Hotmail y cuentas de trabajo).
   - **URI de redirección:** tipo **Web** →
     `https://<dominio>/api/conexiones/microsoft/callback`
     (para pruebas agrega después, en **Autenticación**,
     `http://localhost:3000/api/conexiones/microsoft/callback`).
2. En **Información general** copia el **Id. de aplicación (cliente)**.
3. **Certificados y secretos → Nuevo secreto de cliente.** Copia el
   **Valor** (no el "Id. del secreto"); solo se muestra una vez. El secreto
   vence (máximo 24 meses): apunta la fecha para crear otro antes.
4. **Permisos de API → Agregar un permiso → Microsoft Graph → Permisos
   delegados**, y marca: `offline_access`, `User.Read`, `Mail.Read`,
   `Calendars.Read`, `Files.Read` y `Contacts.Read`. No agregues "permisos
   de aplicación".
5. Con cuentas de **trabajo o escuela**, Microsoft puede pedir que un
   administrador de esa empresa apruebe la app, o que verifiques a Atendel
   como editor ("Publisher verification", con una cuenta de Microsoft
   Partner). Las cuentas personales no lo piden.
6. **Desconectar:** Microsoft no deja que Atendel quite el permiso por su
   cuenta. Atendel borra la conexión, y si la persona quiere quitar también
   el permiso: https://account.live.com/consent/Manage (cuenta personal) o
   https://myapps.microsoft.com (cuenta de trabajo).

**En Vercel:**

| Variable | Valor |
|---|---|
| `MICROSOFT_CLIENT_ID` | el Id. de aplicación (cliente) |
| `MICROSOFT_CLIENT_SECRET` | el **Valor** del secreto (márcalo **Sensitive**) |

### 4.3 Notion

1. Entra a https://www.notion.so/profile/integrations → **Nueva
   integración**.
   - Tipo: **Pública** (para que cada negocio conecte su propio Notion).
   - Notion pide el nombre, el sitio web, la política de privacidad y los
     términos de uso (direcciones de tu sitio).
   - **URI de redirección:** `https://<dominio>/api/conexiones/notion/callback`
   - **Capacidades:** solo **Leer contenido**, sin insertar ni actualizar;
     y **Leer información de usuarios, con correo**, para mostrar con qué
     cuenta se conectó.
2. Guarda y copia el **OAuth client ID** y el **OAuth client secret**.
3. Al conectar, Notion le pregunta a la persona **qué páginas comparte**
   con Atendel: los agentes solo ven esas. Para agregar otra después: en la
   página de Notion, menú **•••  → Conexiones → Atendel**.

**En Vercel:**

| Variable | Valor |
|---|---|
| `NOTION_CLIENT_ID` | el OAuth client ID |
| `NOTION_CLIENT_SECRET` | el OAuth client secret (márcalo **Sensitive**) |

### 4.4 Resumen: lo que va en Vercel para las apps

| Variable | Para qué | ¿Obligatoria? |
|---|---|---|
| `ATENDEL_LLAVE_CIFRADO` | cifrar los permisos (sección 1) | sí, para cualquier app |
| `ALLOWED_ORIGINS` | tu `https://<dominio>` (ya existe; revisa que esté) | sí |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | las apps de Google | para Google |
| `NEXT_PUBLIC_GOOGLE_API_KEY`, `NEXT_PUBLIC_GOOGLE_APP_ID` | elegir archivos de Drive | para Drive |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | las apps de Microsoft | para Microsoft |
| `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET` | Notion | para Notion |

Después de agregarlas: **Redeploy**. Las que se conectan con una llave de
la persona (Telegram, Stripe, Trello, Airtable, Facturapi) no necesitan
nada en Vercel además de `ATENDEL_LLAVE_CIFRADO`: cada negocio pega su llave
en la tarjeta y se guarda cifrada.
