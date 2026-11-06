# Configurar apps: Meta, Telegram, Calendly, Zoom, Dropbox, Slack, Trello, Airtable, HubSpot, reservas y CRM

Estas secciones se suman a `docs/configurar-apps.md`. En todas:

- **`<dominio>`** es el dominio donde vive Atendel (por ejemplo `atendel.mx`, o el `*.vercel.app` del proyecto).
- **La URI de redirección** siempre es `https://<dominio>/api/conexiones/<proveedor>/callback` y se pega tal cual en la app del proveedor. Si usas más de un dominio (producción y vista previa), agrega una por cada uno.
- **Las variables van en Vercel** (Settings → Environment Variables) y nunca en el código ni en el chat. Después de agregarlas, vuelve a desplegar.
- Todas necesitan además `ATENDEL_LLAVE_CIFRADO` (la que cifra los tokens; ver la guía principal).
- **Todo es de solo lectura.** Ningún agente manda, cambia ni borra nada en estas apps.
- Mientras falte una variable, la tarjeta de la app dice exactamente cuál falta.

Las apps "por llave" (Telegram, Trello, Airtable, Acuity y SimplyBook.me) no necesitan nada en Vercel: cada persona pega **su** llave en la tarjeta y se guarda cifrada.

---

## Meta: WhatsApp Business, Instagram y Messenger

**Qué hace la IA:** Lola (y Víctor) leen las conversaciones recientes de Messenger y los mensajes directos de Instagram. De WhatsApp Business ve tus números y tus plantillas de mensajes.

> La API de WhatsApp Cloud **no deja leer el historial de chats**. Los mensajes que te mandan llegan por un webhook, y eso es de otra fase.

1. Entra a [developers.facebook.com](https://developers.facebook.com) → **Mis apps** → **Crear app** y elige el tipo **Empresa** (Business). Ligala a tu portafolio comercial (Business Manager).
2. Agrégale los productos **Inicio de sesión con Facebook para empresas** (Facebook Login for Business), **WhatsApp**, **Messenger** e **Instagram** (la API de Instagram con inicio de sesión de Facebook).
3. En **Inicio de sesión con Facebook → Configuración**, en **URI de redireccionamiento de OAuth válidos**, pega `https://<dominio>/api/conexiones/meta/callback`.
4. En **Configuración de la app → Básica**, copia el **Identificador de la app** y la **Clave secreta**. Ahí mismo conviene activar **Requerir clave secreta de la app**: Atendel firma cada consulta con ella.
5. En Vercel:
   - `META_APP_ID` = el identificador de la app;
   - `META_APP_SECRET` = la clave secreta.

**Permisos que pide Atendel** (según las apps que conecte la persona):

| App | Permisos |
| --- | --- |
| WhatsApp Business | `whatsapp_business_management`, `whatsapp_business_messaging`, `business_management` |
| Messenger | `pages_show_list`, `pages_messaging`, `pages_manage_metadata`, `pages_read_engagement`, `business_management` |
| Instagram | `instagram_basic`, `instagram_manage_messages`, `pages_show_list`, `pages_manage_metadata`, `business_management` |

`pages_manage_metadata` y `pages_read_engagement` los pide la documentación de Meta para leer conversaciones.

**Aprobación de Meta:** mientras la app esté "en desarrollo", solo funciona con las cuentas que tengan un rol en la app (administrador, desarrollador o probador). Para que cualquier negocio la conecte:

1. Verifica tu negocio en Meta.
2. Pide **acceso avanzado** de cada permiso en **Revisión de la app**.
3. Para Instagram, la app tiene que ser de un negocio verificado.

Para Instagram, la cuenta tiene que ser **profesional** y estar **ligada a una página de Facebook**.

El permiso de Meta dura unos 60 días. Cuando vence, la tarjeta pide volver a conectar (Meta no da forma de renovarlo solo).

---

## Telegram (por llave)

**Qué hace la IA:** Lola lee los mensajes recientes que le escriben al bot de tu negocio. No marca nada como leído.

**Cómo sacar la llave:**

1. En Telegram, abre **@BotFather** y manda `/newbot`.
2. Ponle nombre y usuario (tiene que terminar en `bot`).
3. BotFather te da un **token** como `123456789:AAH…`. Ese token es la llave: cópialo y pégalo en la tarjeta de Telegram.

**A saber:**

- Telegram guarda los mensajes sin leer **hasta 24 horas**.
- Si el bot ya tiene un **webhook** puesto, Telegram no deja leerlos de esta forma; la IA te lo dice.
- Si alguien más tiene el token, puede usar tu bot. Si se filtra, en BotFather usa `/revoke` y pega el nuevo.

En Vercel no se pone nada.

---

## Calendly

**Qué hace la IA:** Lola ve tus próximas citas (quién agendó, cuándo y dónde) y tus tipos de cita con su enlace.

1. Entra a [developer.calendly.com](https://developer.calendly.com), inicia sesión y abre **My apps** → **Create new app**.
2. Tipo **Web**, ambiente **Production** (usa Sandbox solo para pruebas).
3. **Redirect URI:** `https://<dominio>/api/conexiones/calendly/callback`.
4. **Scopes:** `users:read`, `scheduled_events:read` y `event_types:read`.
5. Copia el **Client ID** y el **Client secret**. El secreto se muestra una sola vez: guárdalo antes de cerrar.
6. En Vercel:
   - `CALENDLY_CLIENT_ID`;
   - `CALENDLY_CLIENT_SECRET`.

Calendly pide PKCE y Atendel ya lo hace solo. Su permiso dura 2 horas y se renueva solo.

---

## Zoom

**Qué hace la IA:** Lola ve tus próximas reuniones (fecha, hora, duración, tema y enlace).

1. Entra a [marketplace.zoom.us](https://marketplace.zoom.us) → **Develop** → **Build App** y elige **General App**, administrada por el usuario (*User-managed*).
2. En **Basic Information → OAuth Information**:
   - **OAuth Redirect URL:** `https://<dominio>/api/conexiones/zoom/callback`;
   - agrega la misma dirección en **OAuth Allow List**.
3. En **Scopes**, agrega `meeting:read:list_meetings` y `user:read:user`.
4. Copia el **Client ID** y el **Client Secret** de la app (los de producción).
5. En Vercel:
   - `ZOOM_CLIENT_ID`;
   - `ZOOM_CLIENT_SECRET`.

**A saber:** mientras la app no esté publicada en el Marketplace de Zoom, solo la pueden conectar los usuarios de tu misma cuenta de Zoom. Para cualquier negocio, hay que mandarla a revisión.

---

## Dropbox

**Qué hace la IA:** Iris busca tus archivos y lee su texto: TXT, MD, CSV, PDF y Word (.docx), hasta 10 MB.

1. Entra a [dropbox.com/developers/apps](https://www.dropbox.com/developers/apps) → **Create app**.
2. Elige **Scoped access**. Luego **Full Dropbox** (o **App folder**, si solo quieres que vea una carpeta) y ponle nombre.
3. En la pestaña **Permissions**, marca `account_info.read`, `files.metadata.read` y `files.content.read`, y da **Submit**.
4. En **Settings → OAuth 2 → Redirect URIs**, agrega `https://<dominio>/api/conexiones/dropbox/callback`.
5. Copia el **App key** y el **App secret**.
6. En Vercel:
   - `DROPBOX_APP_KEY`;
   - `DROPBOX_APP_SECRET`.

**A saber:** en estado "Development", Dropbox deja conectar hasta 500 cuentas. Para más, usa **Apply for production** en la misma página. Atendel pide acceso "offline", así que la conexión se renueva sola.

---

## Slack

**Qué hace la IA:** Iris busca mensajes y lee los últimos mensajes de un canal público. Ve lo mismo que puede ver la persona que conectó.

1. Entra a [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**, con nombre y tu espacio de trabajo.
2. En **OAuth & Permissions**:
   - en **Redirect URLs**, agrega `https://<dominio>/api/conexiones/slack/callback`;
   - en **User Token Scopes** (no en Bot), agrega `channels:history`, `channels:read` y `search:read`.
3. En **Basic Information → App Credentials**, copia el **Client ID** y el **Client Secret**.
4. Para que otros negocios la conecten: **Manage Distribution** → activa la distribución pública.
5. En Vercel:
   - `SLACK_CLIENT_ID`;
   - `SLACK_CLIENT_SECRET`.

**A saber:** desde 2025, a las apps que no están en el Slack Marketplace, Slack les da como máximo 15 mensajes por consulta y una consulta por minuto al leer un canal. Si activas **Token Rotation**, Atendel renueva el permiso solo.

---

## Trello (por llave)

**Qué hace la IA:** Iris ve tus tableros y las tarjetas de cada lista (vencimientos, etiquetas y descripción), o busca tarjetas.

**Cómo sacar la llave** (la hace cada persona con su cuenta):

1. Entra a [trello.com/power-ups/admin](https://trello.com/power-ups/admin) → **New** y crea un Power-Up en tu espacio de trabajo (el nombre que quieras).
2. En la pestaña **API key**, da **Generate a new API key** y copia la **API key**.
3. Junto a la key está el enlace para generar un **Token**: ábrelo, revisa que pida solo **lectura** y da **Allow**. Copia el token.
4. En la tarjeta de Trello pega las dos partes juntas, separadas por dos puntos: `API key:token`.

Al desconectar, Atendel borra ese token en Trello. En Vercel no se pone nada.

---

## Airtable (por llave)

**Qué hace la IA:** Iris ve tus bases, sus tablas y los registros de una tabla, y puede filtrarlos por texto.

**Cómo sacar la llave:**

1. Entra a [airtable.com/create/tokens](https://airtable.com/create/tokens) → **Create new token** y ponle un nombre (por ejemplo "Atendel").
2. **Scopes:** `data.records:read` y `schema.bases:read`. Opcional: `user.email:read`, para que la tarjeta muestre tu correo.
3. **Access:** agrega las bases que quieres que vea la IA. Solo esas.
4. Da **Create token** y copia el token: empieza con `pat`. Pégalo en la tarjeta de Airtable.

Airtable no deja borrar el token desde otra app: si ya no lo quieres, bórralo en esa misma página. En Vercel no se pone nada.

---

## HubSpot

**Qué hace la IA:** Víctor busca contactos (nombre, correo, teléfono, empresa y etapa) y negocios (monto, etapa y fecha de cierre) en tu CRM.

1. Crea una cuenta de desarrollador en [developers.hubspot.com](https://developers.hubspot.com) y crea una app con autenticación **OAuth**.
2. En la autenticación de la app:
   - **Redirect URL:** `https://<dominio>/api/conexiones/hubspot/callback`;
   - **Scopes requeridos:** `oauth`, `crm.objects.contacts.read` y `crm.objects.deals.read`.

   Si HubSpot te pide crearla con su herramienta de línea de comandos (proyectos), el archivo de configuración de la app lleva los mismos datos: la redirect URL y esos scopes.
3. Copia el **Client ID** y el **Client secret**.
4. En Vercel:
   - `HUBSPOT_CLIENT_ID`;
   - `HUBSPOT_CLIENT_SECRET`.

Atendel usa la versión nueva de la API de OAuth de HubSpot (la v1 se retira en febrero de 2027). El permiso dura 30 minutos y se renueva solo.

---

## Reseñas de Facebook (va con la misma app de Meta)

**Qué hace la IA:** Víctor lee las recomendaciones y reseñas recientes de tu página de Facebook y su calificación general, para proponerte cómo contestarlas.

No hay que crear otra app ni poner otra variable: se usa la misma app de Meta (`META_APP_ID` y `META_APP_SECRET`).

- **Permisos:** `pages_show_list`, `pages_read_user_content`, `pages_read_engagement` y `business_management`.
- **Aprobación:** igual que las demás de Meta, `pages_read_user_content` necesita acceso avanzado en **Revisión de la app** para usarse con cualquier página.

---

## Google Forms (va con el cliente de Google)

**Qué hace la IA:** Víctor lee las respuestas de un formulario de Google que le indiques (con el link de edición del formulario).

1. En Google Cloud, en el mismo proyecto de Gmail y Drive, activa la **Google Forms API** (APIs y servicios → Biblioteca).
2. En la **pantalla de consentimiento** → **Permisos**, agrega:
   - `https://www.googleapis.com/auth/forms.responses.readonly`;
   - `https://www.googleapis.com/auth/forms.body.readonly`.
3. No hay variables nuevas: usa `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

**A saber:** la IA necesita el link de **edición** del formulario, el que termina en `/edit`. El link para responder (`/forms/d/e/…`) no sirve.

---

## Acuity Scheduling (por llave)

**Qué hace la IA:** Lola ve tus próximas citas, las citas de un cliente (por correo, teléfono o nombre) y tus servicios.

**Cómo sacar la llave:**

1. En Acuity entra a **Integraciones** → **API** y da **Ver credenciales**. Según Acuity, la API está en sus planes de pago más altos.
2. Copia tu **User ID** (un número) y tu **API Key**.
3. En la tarjeta de Acuity pega las dos partes juntas, separadas por dos puntos: `User ID:API key`.

En Vercel no se pone nada.

---

## SimplyBook.me (por llave)

**Qué hace la IA:** Lola ve tus próximas reservas, las reservas de un cliente y tus servicios.

**Cómo sacar la llave:**

1. En SimplyBook.me entra a **Settings** → **API User Keys** y crea una llave para tu usuario. Empieza con `api_user_key_`.
2. En la tarjeta pega tres datos separados por dos puntos: `empresa:usuario:api_user_key_…`.
   - **empresa:** el nombre de tu cuenta, el que va antes de `.simplybook.me` en tu dirección.
   - **usuario:** tu usuario de administración.

Nunca se pega tu contraseña. La API User Key no pide verificación en dos pasos. En Vercel no se pone nada.

---

## Zoho CRM y Zoho Books (un solo cliente de Zoho)

**Qué hace la IA:**

- Víctor busca tus contactos y tratos de **Zoho CRM**.
- Clara e Iris ven tus facturas y contactos de **Zoho Books**.

1. Entra a [api-console.zoho.com](https://api-console.zoho.com) → **Add Client** → **Server-based Applications**.
2. **Authorized Redirect URIs:** `https://<dominio>/api/conexiones/zoho/callback`.
3. En **Settings** del cliente activa **Multi-DC**, para que funcione con cuentas de cualquier región (EE. UU., Europa, India…).
4. Copia el **Client ID** y el **Client Secret**.
5. En Vercel:
   - `ZOHO_CLIENT_ID`;
   - `ZOHO_CLIENT_SECRET`.

**Permisos que pide Atendel:**

- Cuenta: `AaaServer.profile.READ`.
- Zoho CRM: `ZohoCRM.modules.contacts.READ` y `ZohoCRM.modules.deals.READ`.
- Zoho Books: `ZohoBooks.invoices.READ`, `ZohoBooks.contacts.READ` y `ZohoBooks.settings.READ`.

La autorización empieza siempre en accounts.zoho.com y Zoho manda a la región de cada cuenta. El permiso dura una hora y se renueva solo.

---

## Pipedrive

**Qué hace la IA:** Víctor busca tus personas (contactos) y tratos.

1. Entra al [Developer Hub de Pipedrive](https://developers.pipedrive.com) con una cuenta de desarrollador y crea una app privada o pública.
2. **Callback URL:** `https://<dominio>/api/conexiones/pipedrive/callback`.
3. En **OAuth & access scopes**, marca solo lectura en **Contacts** y en **Deals**.
4. Copia el **Client ID** y el **Client secret**.
5. En Vercel:
   - `PIPEDRIVE_CLIENT_ID`;
   - `PIPEDRIVE_CLIENT_SECRET`.

---

## Kommo

**Qué hace la IA:** Víctor busca tus leads (con su embudo y etapa) y tus contactos.

1. En tu cuenta de Kommo entra a **Ajustes** → **Integraciones** → **Crear integración** (externa).
2. **Redirect URL:** `https://<dominio>/api/conexiones/kommo/callback`.
3. En los permisos deja solo lo necesario para leer.
4. En la pestaña **Llaves y alcances**, copia el **ID de integración** y la **Clave secreta**.
5. En Vercel:
   - `KOMMO_CLIENT_ID` = el ID de integración;
   - `KOMMO_CLIENT_SECRET` = la clave secreta.

**Al conectar:** la tarjeta pide la dirección de la cuenta (`miempresa.kommo.com`). El permiso dura 24 horas y se renueva solo; si no se usa en 3 meses, hay que volver a conectar.

---

## Typeform

**Qué hace la IA:** Víctor ve tus formularios y lee sus respuestas (cada pregunta con lo que contestaron).

1. En Typeform entra a tu cuenta → **Developer apps** → **Register a new app**.
2. **Redirect URI(s):** `https://<dominio>/api/conexiones/typeform/callback`.
3. Copia el **Client ID** y el **Client secret**.
4. En Vercel:
   - `TYPEFORM_CLIENT_ID`;
   - `TYPEFORM_CLIENT_SECRET`.

Atendel pide `accounts:read`, `forms:read`, `responses:read` y `offline` (para renovar solo). Las cuentas de Typeform en el centro de datos de la Unión Europea todavía no están cubiertas.

---

## Mailchimp

**Qué hace la IA:** Víctor ve tus audiencias (cuántos suscritos y sus tasas) y cómo les fue a tus últimas campañas enviadas.

1. En Mailchimp entra a tu perfil → **Extras** → **Registered apps** → **Register an app**.
2. **Redirect URI:** `https://<dominio>/api/conexiones/mailchimp/callback`.
3. Copia el **Client ID** y el **Client Secret**.
4. En Vercel:
   - `MAILCHIMP_CLIENT_ID`;
   - `MAILCHIMP_CLIENT_SECRET`.

El permiso de Mailchimp no vence. Atendel guarda el centro de datos de la cuenta (por ejemplo `us21`) para saber a dónde preguntar.

---

## En camino (sin conexión pública)

Estas apps salen en el catálogo como "En camino" con "Avísame". No se conectan porque hoy no tienen una forma pública de conectarse:

| App | Por qué |
| --- | --- |
| Setmore | Da su API solo a cuentas Pro que aprueba por correo (api@setmore.com), y su documentación técnica no está publicada para revisarla. |
| AgendaPro | Anuncia una API en su sitio, pero no publica su documentación técnica. |
| Fresha | No ofrece una API para conectar tu cuenta (solo integraciones de socios). |
| Booksy | Su API es solo para socios aprobados. |
| Doctoralia | Su API (Docplanner) es solo para empresas de software médico. |

---

## Resumen para Vercel

| Proveedor | Variables | Cómo se conecta |
| --- | --- | --- |
| Meta | `META_APP_ID`, `META_APP_SECRET` | Botón "Conectar" (pide aprobación de Meta) |
| Calendly | `CALENDLY_CLIENT_ID`, `CALENDLY_CLIENT_SECRET` | Botón "Conectar" |
| Zoom | `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` | Botón "Conectar" |
| Dropbox | `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET` | Botón "Conectar" |
| Slack | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` | Botón "Conectar" |
| HubSpot | `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET` | Botón "Conectar" |
| Telegram | (ninguna) | La persona pega el token de su bot |
| Trello | (ninguna) | La persona pega `API key:token` |
| Airtable | (ninguna) | La persona pega su token `pat…` |
| Zoho (CRM y Books) | `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET` | Botón "Conectar" |
| Pipedrive | `PIPEDRIVE_CLIENT_ID`, `PIPEDRIVE_CLIENT_SECRET` | Botón "Conectar" |
| Kommo | `KOMMO_CLIENT_ID`, `KOMMO_CLIENT_SECRET` | Botón "Conectar" (pide la dirección de la cuenta) |
| Typeform | `TYPEFORM_CLIENT_ID`, `TYPEFORM_CLIENT_SECRET` | Botón "Conectar" |
| Mailchimp | `MAILCHIMP_CLIENT_ID`, `MAILCHIMP_CLIENT_SECRET` | Botón "Conectar" |
| Google Forms | (las de Google) | Botón "Conectar" de Google |
| Reseñas de Facebook | (las de Meta) | Botón "Conectar" de Meta |
| Acuity | (ninguna) | La persona pega `User ID:API key` |
| SimplyBook.me | (ninguna) | La persona pega `empresa:usuario:api_user_key_…` |
