/**
 * Lista de Proveedores y Subencargados, versión 1.0: texto del dueño completado
 * con lo que usa la app (regiones verificadas: Supabase us-east-1, Vercel iad1;
 * catálogo de apps de src/lib/conexiones/catalogo.ts; Turnstile).
 * Todavía no se publica: va en el Centro legal (pendiente).
 */
export const PROVEEDORES = `# Lista de Proveedores y Subencargados
## ATENDEL

**Última actualización: 18 de noviembre de 2026**

**Versión:** 1.0

### 1. Objeto

El presente documento identifica los proveedores tecnológicos y servicios externos que pueden intervenir en la operación de Atendel, así como las funciones generales que desempeñan y las categorías de información que podrían procesar.

Su finalidad es proporcionar transparencia a los usuarios y facilitar la comprensión de las operaciones de tratamiento de datos que pueden realizarse para prestar los servicios de Atendel.

Este documento complementa el Aviso de Privacidad Integral, el Acuerdo de Tratamiento de Datos Personales y los Términos y Condiciones.

### 2. Alcance

La lista comprende proveedores que pueden intervenir en:

- Alojamiento y distribución de la plataforma.
- Bases de datos y almacenamiento.
- Autenticación y administración de cuentas.
- Procesamiento de inteligencia artificial.
- Conexión con aplicaciones externas.
- Mensajería y comunicaciones.
- Notificaciones.
- Seguridad y funcionamiento técnico.

La participación de cada proveedor dependerá de las funciones habilitadas, la configuración del usuario y la arquitectura técnica vigente.

La inclusión de un proveedor en esta lista no significa necesariamente que todos los datos de Atendel se transmitan a dicho proveedor.

### 3. Proveedores identificados

**3.1. Supabase**

**Categoría:** Infraestructura, base de datos, almacenamiento y autenticación.

**Función dentro de Atendel:**

Supabase proporciona los servicios de infraestructura necesarios para almacenar información, administrar registros, gestionar archivos y facilitar los procesos de autenticación, incluido el envío de los códigos de acceso por correo electrónico.

**Categorías de información que podrían procesarse:**

- Datos de cuenta.
- Información del negocio.
- Preferencias y configuraciones.
- Conversaciones con Atendel.
- Documentos y archivos.
- Registros técnicos y de seguridad.
- Información necesaria para mantener las funciones de la plataforma.

**Ubicación del tratamiento:** Estados Unidos (región del este, Virginia), conforme al proyecto contratado por Atendel.

**Condiciones aplicables:** Contrato, documentación de seguridad y políticas del proveedor.

**3.2. Vercel**

**Categoría:** Alojamiento y distribución de aplicaciones.

**Función dentro de Atendel:**

Vercel proporciona la infraestructura para publicar, distribuir y entregar el sitio web y el panel de control de Atendel, y para ejecutar su servidor.

**Categorías de información que podrían procesarse:**

- Solicitudes técnicas.
- Datos de conexión.
- Registros de funcionamiento.
- Información necesaria para entregar páginas y recursos de la plataforma.

**Ubicación del tratamiento:** Estados Unidos (región de Washington, D.C.) para el servidor de Atendel, con una red global de distribución para entregar las páginas.

**Condiciones aplicables:** Contrato y políticas del proveedor.

**3.3. Anthropic**

**Categoría:** Inteligencia artificial.

**Función dentro de Atendel:**

Anthropic proporciona los modelos de inteligencia artificial utilizados para interpretar instrucciones, procesar información y generar los resultados solicitados por los usuarios, incluidos los modos «Rápido» y «Avanzado» que el usuario puede elegir en el chat.

**Categorías de información que podrían procesarse:**

- Instrucciones del usuario.
- Mensajes y contenido autorizado.
- Información empresarial necesaria para una tarea.
- Fragmentos de documentos o archivos que se envíen al modelo.
- Contexto necesario para generar respuestas o ejecutar procesos.

**Ubicación del tratamiento:** Estados Unidos, según la documentación del proveedor; Atendel confirmará la región aplicable al servicio contratado.

**Condiciones aplicables:** Acuerdos comerciales, condiciones de tratamiento de datos y documentación del proveedor.

Atendel deberá verificar las condiciones específicas de conservación, uso de datos, entrenamiento de modelos y controles de seguridad aplicables al servicio contratado. No se considerará suficiente una descripción comercial general para afirmar que determinada información nunca se conserva o nunca se utiliza para entrenamiento.

**3.4. Meta / WhatsApp**

**Categoría:** Mensajería y comunicación.

**Función dentro de Atendel:**

Meta y los servicios de WhatsApp intervienen en la conexión, recepción y transmisión de mensajes cuando el usuario conecta el WhatsApp de su negocio, y en los avisos que Atendel envía al usuario por WhatsApp cuando él mismo los activa.

**Categorías de información que podrían procesarse:**

- Identificadores de cuentas.
- Números telefónicos.
- Mensajes.
- Metadatos de comunicación.
- Información necesaria para entregar mensajes y mantener la integración.

**Ubicación del tratamiento:** Según la infraestructura global del proveedor.

**Condiciones aplicables:** Términos, políticas y documentación aplicable de Meta y WhatsApp.

**3.5. Google**

**Categoría:** Autenticación, servicios de notificación e integraciones.

**Función dentro de Atendel:**

Google interviene en el inicio de sesión con una cuenta de Google, cuando el usuario elige ese método; en la entrega de notificaciones en Chrome y Android; y en las integraciones de Google que el usuario conecte.

**Categorías de información que podrían procesarse:**

- Identificadores técnicos.
- Datos necesarios para notificaciones.
- Información autorizada mediante integraciones de Google.
- Datos de autenticación o autorización cuando corresponda.

**Ubicación del tratamiento:** Según la infraestructura global del proveedor.

**Condiciones aplicables:** Términos y políticas de Google y condiciones de las integraciones utilizadas.

**3.6. Apple**

**Categoría:** Notificaciones y servicios de dispositivos.

**Función dentro de Atendel:**

Apple interviene en la entrega de notificaciones en Safari, iPhone y Mac cuando el usuario activa las notificaciones en esos dispositivos.

**Categorías de información que podrían procesarse:**

- Identificadores técnicos del dispositivo.
- Tokens de notificación.
- Datos necesarios para entregar avisos.

**Ubicación del tratamiento:** Según la infraestructura global del proveedor.

**Condiciones aplicables:** Términos y políticas de Apple.

**3.7. Mozilla**

**Categoría:** Servicios de notificación del navegador.

**Función dentro de Atendel:**

Mozilla interviene en la entrega de notificaciones web cuando el usuario las activa en Firefox.

**Categorías de información que podrían procesarse:**

- Identificadores de suscripción.
- Información técnica del navegador.
- Datos necesarios para entregar notificaciones.

**Ubicación del tratamiento:** Según la infraestructura global del proveedor.

**Condiciones aplicables:** Términos y políticas de Mozilla.

**3.8. Microsoft**

**Categoría:** Servicios de notificación e integraciones.

**Función dentro de Atendel:**

Microsoft interviene en la entrega de notificaciones en Edge y Windows y en las integraciones de Microsoft que el usuario conecte.

**Categorías de información que podrían procesarse:**

- Identificadores técnicos.
- Información necesaria para notificaciones.
- Datos autorizados mediante integraciones de Microsoft.

**Ubicación del tratamiento:** Según la infraestructura global del proveedor.

**Condiciones aplicables:** Términos y políticas de Microsoft.

**3.9. Cloudflare**

**Categoría:** Seguridad.

**Función dentro de Atendel:**

Cloudflare Turnstile verifica que quien crea una cuenta o inicia sesión es una persona, cuando esta protección se encuentre activada.

**Categorías de información que podrían procesarse:**

- Información técnica del navegador.
- Datos necesarios para la verificación.

**Ubicación del tratamiento:** Según la infraestructura global del proveedor.

**Condiciones aplicables:** Términos y políticas de Cloudflare.

**3.10. ElevenLabs**

**Categoría:** Voz.

**Función dentro de Atendel:**

ElevenLabs pasa a texto lo que el usuario dice en el modo plática y convierte en voz las respuestas de Atendel, solo cuando el usuario abre el modo plática. Atendel no guarda el audio; la plática queda escrita en el chat.

**Categorías de información que podrían procesarse:**

- Grabaciones de voz del usuario durante el modo plática.
- El texto de las respuestas que se dicen en voz alta.

**Ubicación del tratamiento:** Según la infraestructura del proveedor; Atendel confirmará la región aplicable al servicio contratado.

**Condiciones aplicables:** Términos, política de privacidad y condiciones de tratamiento de datos de ElevenLabs.

### 4. Aplicaciones conectadas por el usuario

Atendel permite la conexión voluntaria de aplicaciones externas, incluyendo:

- **Google:** Gmail, Google Calendar, Tareas de Google, Google Drive, Google Sheets, Contactos de Google, Perfil de Negocio de Google y Google Forms.
- **Microsoft:** Outlook, Calendario de Outlook, Microsoft To Do, OneDrive, Excel y Contactos de Outlook.
- **Meta:** WhatsApp Business, Instagram, Messenger y Reseñas de Facebook.
- **Mensajería y trabajo en equipo:** Telegram, Slack, Zoom, Notion, Dropbox, Airtable, Trello y Todoist.
- **Clientes y marketing:** HubSpot, Zoho CRM, Pipedrive, Kommo, Mailchimp y Typeform.
- **Agenda y citas:** Calendly, Acuity Scheduling, SimplyBook.me, Setmore, AgendaPro, Fresha, Booksy y Doctoralia.
- **Pagos y ventas:** Stripe, Mercado Pago, Mercado Libre, Shopify, Tiendanube, Clip, PayPal, Conekta, Openpay y Square.
- **Contabilidad y facturación:** Zoho Books, Facturama, Alegra, Holded, QuickBooks y facturación CFDI.
- Otras aplicaciones que se incorporen a la plataforma.

La disponibilidad de cada aplicación puede variar según la etapa de la plataforma y las aprobaciones que exija cada proveedor.

Estas aplicaciones pueden procesar información directamente bajo sus propios términos y condiciones.

Cuando Atendel acceda a información mediante una integración, el alcance del acceso dependerá de:

1. La autorización concedida por el usuario.
2. Los permisos técnicos disponibles.
3. La configuración de la integración.
4. Las instrucciones y automatizaciones habilitadas.
5. Las condiciones del proveedor externo.

Los permisos y credenciales de estas conexiones se guardan cifrados mediante AES-256-GCM.

El usuario podrá administrar o revocar conexiones desde la sección «Tu negocio → Apps conectadas».

La desconexión de una aplicación impedirá nuevos accesos mediante la integración, pero no necesariamente eliminará información que ya haya sido procesada o conservada conforme a las reglas de retención aplicables.

### 5. Subencargados y responsabilidad

Cuando Atendel contrate un proveedor para procesar datos personales por cuenta de un negocio, procurará establecer condiciones contractuales que regulen:

- Finalidad del tratamiento.
- Alcance de los servicios.
- Confidencialidad.
- Medidas de seguridad.
- Restricciones de uso.
- Asistencia ante incidentes.
- Conservación y eliminación.
- Participación de otros subencargados.
- Transferencias internacionales, cuando correspondan.

La clasificación jurídica de cada proveedor dependerá de las actividades que efectivamente realice. Algunos podrán actuar como encargados o subencargados y otros como responsables independientes respecto de sus propios servicios.

Atendel no utiliza proveedores de publicidad, redes de anuncios ni herramientas de rastreo de terceros con fines publicitarios. Las fuentes tipográficas del sitio se sirven desde el propio dominio de Atendel.

### 6. Ubicación y transferencias internacionales

Algunos proveedores pueden almacenar o procesar información fuera de México.

La ubicación concreta puede depender de la región seleccionada, la arquitectura del servicio, la configuración contratada y los mecanismos de distribución utilizados.

Atendel deberá verificar la ubicación efectiva y las condiciones de transferencia aplicables antes de presentar una afirmación específica sobre el país donde se almacena o procesa determinada información.

Cuando corresponda, las transferencias se realizarán conforme al Aviso de Privacidad y a la legislación aplicable.

### 7. Actualizaciones de la lista

Atendel podrá incorporar, sustituir o dejar de utilizar proveedores por motivos técnicos, operativos, de seguridad o comerciales.

La lista se actualizará cuando existan cambios relevantes en los proveedores que intervienen en el tratamiento de información.

Cuando corresponda, Atendel comunicará los cambios mediante el panel o correo electrónico.

### 8. Consultas

Los usuarios podrán solicitar información adicional sobre los proveedores y el tratamiento de datos mediante:

**Correo:** infoatendel@gmail.com

**Domicilio:** Monterrey, Nuevo León, México

**Responsable informado:** Santiago Kuri Martinez

**Dominio oficial:** good-kebab.vercel.app
`;
