/**
 * Lista de Proveedores y Subencargados (la armé con lo que la app usa de verdad:
 * src/lib/supabase, Vercel, src/lib/planes.ts, src/lib/conexiones/catalogo.ts,
 * notificaciones push y Turnstile). Mantenerla al día cuando cambie un proveedor.
 * Todavía no se publica: va en el Centro legal (pendiente).
 */
export const PROVEEDORES = `# Lista de Proveedores y Subencargados
## ATENDEL

**Última actualización: 17 de noviembre de 2026**

### 1. Objeto

Esta lista identifica a los proveedores tecnológicos que intervienen en el funcionamiento de Atendel y que pueden tratar información de los usuarios o de sus clientes.

Complementa el Aviso de Privacidad Integral, el Acuerdo de Tratamiento de Datos Personales y la Política de Inteligencia Artificial de Atendel.

Para cada proveedor se indica para qué se utiliza, qué tipo de información puede tratar y dónde se procesa, de acuerdo con la configuración actual de la plataforma.

### 2. Proveedores principales (subencargados)

Estos proveedores tratan información por cuenta de Atendel para que la plataforma funcione:

| Proveedor | Para qué se utiliza | Información que puede tratar | Ubicación |
|---|---|---|---|
| Supabase | Base de datos, almacenamiento de archivos, autenticación y envío de los códigos de acceso por correo | Datos de la cuenta y del negocio, conversaciones, archivos, registros técnicos y de seguridad | Estados Unidos |
| Vercel | Alojamiento del sitio web y del panel, y ejecución del servidor de Atendel | Información que pasa por la plataforma mientras se usa | Estados Unidos, con red global para entregar las páginas |
| Anthropic | Modelos de inteligencia artificial que interpretan instrucciones y generan respuestas | El contenido necesario para cada tarea solicitada | Estados Unidos |

### 3. Servicios de notificaciones

Cuando el usuario activa las notificaciones de la app en un dispositivo, el aviso se entrega a través del servicio de notificaciones de su navegador o sistema:

- Google (Chrome y Android).
- Apple (Safari, iPhone y Mac).
- Mozilla (Firefox).
- Microsoft (Edge y Windows).

Atendel solo envía a estos servicios un título, un texto corto y un enlace interno; el detalle completo permanece en el panel.

### 4. Servicios que se usan en casos concretos

- **Google:** inicio de sesión con una cuenta de Google, cuando el usuario elige ese método.
- **Meta (WhatsApp Business):** recepción y envío de mensajes cuando el negocio conecta su número de WhatsApp, y avisos al usuario por WhatsApp cuando él mismo los activa.
- **Cloudflare (Turnstile):** verificación de que quien crea una cuenta o entra es una persona, cuando esta protección esté activada.

### 5. Aplicaciones que el usuario conecta

Además de los proveedores anteriores, el usuario puede conectar voluntariamente sus propias cuentas de otras aplicaciones. En esos casos, Atendel se comunica con la aplicación únicamente con los permisos que el usuario concede, y cada aplicación trata la información conforme a sus propios términos y avisos de privacidad, como responsable independiente.

Las aplicaciones que pueden conectarse incluyen:

- **Google:** Gmail, Google Calendar, Tareas de Google, Google Drive, Google Sheets, Contactos de Google, Perfil de Negocio de Google y Google Forms.
- **Microsoft:** Outlook, Calendario de Outlook, Microsoft To Do, OneDrive, Excel y Contactos de Outlook.
- **Meta:** WhatsApp Business, Instagram, Messenger y Reseñas de Facebook.
- **Mensajería y trabajo en equipo:** Telegram, Slack, Zoom, Notion, Dropbox, Airtable, Trello y Todoist.
- **Clientes y marketing:** HubSpot, Zoho CRM, Pipedrive, Kommo, Mailchimp y Typeform.
- **Agenda y citas:** Calendly, Acuity Scheduling, SimplyBook.me, Setmore, AgendaPro, Fresha, Booksy y Doctoralia.
- **Pagos y ventas:** Stripe, Mercado Pago, Mercado Libre, Shopify, Tiendanube, Clip, PayPal, Conekta, Openpay y Square.
- **Contabilidad y facturación:** Zoho Books, Facturama, Alegra, Holded, QuickBooks y facturación CFDI.

La disponibilidad de cada aplicación puede variar según la etapa de la plataforma y las aprobaciones que cada proveedor exija. Los permisos y credenciales de estas conexiones se guardan cifrados (AES-256-GCM) y el usuario puede desconectarlas en cualquier momento desde Tu negocio → Apps conectadas.

### 6. Lo que no se utiliza

Atendel no utiliza proveedores de publicidad, redes de anuncios ni herramientas de rastreo de terceros con fines publicitarios. Las fuentes tipográficas se sirven desde el propio dominio de Atendel.

### 7. Cambios a esta lista

Atendel actualizará esta lista cuando incorpore, sustituya o deje de utilizar un proveedor que trate información de los usuarios. Cuando un cambio sea relevante, podrá comunicarlo mediante el panel o correo electrónico.

### 8. Contacto

Para consultas relacionadas con esta lista:

**Correo:** infoatendel@gmail.com

**Domicilio:** Monterrey, Nuevo León, México

**Responsable informado:** Santiago Kuri Martinez

**Dominio oficial:** good-kebab.vercel.app
`;
