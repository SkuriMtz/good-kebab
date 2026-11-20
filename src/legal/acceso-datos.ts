/**
 * Política de Acceso a Cuentas y Servicios de Terceros (en Markdown), con el texto del dueño:
 * cómo entra Atendel a las cuentas que conectas y cómo mantiene privada la información. Se pinta
 * en /acceso-a-tus-datos con src/components/legal/DocumentoMd.tsx. Vale el español; los demás
 * idiomas son traducciones.
 */
export const ACCESO_DATOS = `# POLÍTICA DE ACCESO A CUENTAS Y SERVICIOS DE TERCEROS
## ATENDEL

**Última actualización: noviembre de 2026**

### 1. Objeto y alcance

La presente Política de Acceso a Cuentas y Servicios de Terceros (en adelante, la «Política») tiene por objeto informar a los usuarios sobre las condiciones bajo las cuales Atendel accede, consulta, procesa y, cuando corresponda, realiza determinadas acciones en las cuentas y plataformas externas que el usuario decide vincular a sus servicios.

Para proporcionar sus funcionalidades, Atendel puede requerir acceso autorizado a servicios de terceros, tales como cuentas de correo electrónico, calendarios digitales, WhatsApp Business y otras aplicaciones compatibles.

Esta Política describe el alcance de dichos accesos, el tratamiento de la información obtenida, las medidas de seguridad implementadas y los derechos que asisten al usuario.

La presente Política complementa el Aviso de Privacidad Integral, los Términos y Condiciones y la Política de Inteligencia Artificial de Atendel. En caso de contradicción entre estos documentos, prevalecerá lo establecido en el Aviso de Privacidad Integral, sin perjuicio de las disposiciones legales aplicables.

### 2. Autorización y vinculación de cuentas

El acceso de Atendel a cuentas y servicios de terceros se encuentra sujeto a la autorización expresa del usuario y se rige por los siguientes principios:

- **Vinculación voluntaria:** Atendel únicamente accede a las cuentas que el propio usuario decide conectar mediante los mecanismos oficiales de autenticación de cada proveedor, como Google o Microsoft.
- **Protección de credenciales:** Atendel no solicita, recopila ni almacena las contraseñas de las cuentas externas del usuario. La autenticación se realiza mediante mecanismos de autorización proporcionados por los respectivos servicios.
- **Permisos específicos:** El acceso se limita a los permisos que el usuario autoriza durante el proceso de vinculación y a aquellos estrictamente necesarios para proporcionar las funcionalidades que haya activado.
- **Transparencia:** Antes de conceder acceso, el proveedor correspondiente informa al usuario sobre los permisos solicitados, de acuerdo con sus propias condiciones y políticas.
- **Revocación del acceso:** El usuario puede desconectar sus cuentas en cualquier momento desde el panel de Atendel o mediante la configuración del servicio correspondiente. Una vez realizada la desconexión, Atendel dejará de utilizar las autorizaciones asociadas y, cuando el proveedor lo permita, revocará los permisos concedidos y eliminará las credenciales de autorización almacenadas.

La disponibilidad y el alcance de los mecanismos de autorización y revocación pueden depender de las características técnicas de cada proveedor externo.

### 3. Uso y tratamiento de la información

La información obtenida mediante las cuentas vinculadas será utilizada exclusivamente para proporcionar las funcionalidades solicitadas o configuradas por el usuario.

Entre las operaciones que Atendel puede realizar se encuentran:

- Consultar y organizar correos electrónicos relacionados con las funciones activadas.
- Consultar eventos, disponibilidad y compromisos registrados en calendarios.
- Preparar respuestas, comunicaciones y borradores.
- Crear, modificar o reprogramar eventos y citas.
- Ejecutar otras operaciones compatibles con los permisos autorizados por el usuario.

La ejecución de estas operaciones estará sujeta a los permisos concedidos, las instrucciones del usuario y las reglas de automatización que este haya configurado en la sección «Qué hace solo».

**Autorización de acciones:** Atendel respetará los niveles de autonomía establecidos por el usuario. Las operaciones que impliquen movimientos de dinero, compromisos económicos o cualquier acción que no esté expresamente contemplada en las reglas de automatización configuradas requerirán la aprobación previa del usuario.

Atendel no utilizará la información obtenida mediante cuentas vinculadas para fines publicitarios, no la comercializará ni la compartirá con terceros para que estos realicen actividades de prospección comercial o contacten al usuario o a sus clientes.

### 4. Seguridad y confidencialidad de la información

Atendel implementa medidas técnicas y organizativas orientadas a proteger la confidencialidad, integridad y disponibilidad de la información obtenida mediante las cuentas vinculadas.

Entre las medidas de seguridad implementadas se encuentran las siguientes:

**4.1. Separación y aislamiento de datos**

La información de cada usuario y negocio se mantiene separada mediante mecanismos de control de acceso a nivel de base de datos. Estos mecanismos están diseñados para impedir que usuarios no autorizados puedan consultar o acceder a información perteneciente a otras cuentas.

**4.2. Cifrado de credenciales de autorización**

Los tokens y credenciales de autorización utilizados para conectar servicios externos se almacenan cifrados mediante el algoritmo AES-256-GCM. Su utilización está restringida a los componentes autorizados de la infraestructura de Atendel.

**4.3. Protección de las comunicaciones**

Las comunicaciones entre el dispositivo del usuario, los sistemas de Atendel y los proveedores externos se protegen mediante protocolos de cifrado en tránsito, incluyendo HTTPS.

**4.4. Acceso interno restringido**

El acceso del personal de Atendel a la información de las cuentas vinculadas se encuentra restringido. Dicho acceso únicamente podrá realizarse cuando resulte necesario y esté debidamente justificado, por ejemplo:

- Cuando el usuario otorgue autorización para la prestación de soporte técnico.
- Cuando sea necesario investigar o atender incidentes de seguridad.
- Cuando exista una obligación legal o un requerimiento válido de autoridad competente.

En todos los casos, el acceso deberá limitarse a la información estrictamente necesaria para atender la finalidad correspondiente.

**4.5. Minimización de datos técnicos**

Atendel aplica criterios de minimización en el tratamiento de datos técnicos. En relación con la conexión de las cuentas, conserva únicamente una representación hash de la dirección IP, cuando resulte necesario para sus operaciones de seguridad, sin almacenar la dirección IP original como parte de ese registro.

### 5. Tratamiento mediante inteligencia artificial

Para proporcionar determinadas funcionalidades, Atendel utiliza servicios de inteligencia artificial de terceros, incluyendo los proporcionados por Anthropic.

Cuando una tarea requiere procesamiento mediante inteligencia artificial, Atendel transmite únicamente el contenido y la información que resulten necesarios para ejecutar dicha tarea.

El tratamiento de esta información por parte del proveedor externo se encuentra sujeto a sus condiciones contractuales y políticas de privacidad aplicables. En particular, Atendel utiliza las condiciones empresariales correspondientes de Anthropic, bajo las cuales los datos enviados mediante dichos servicios no se utilizan para entrenar sus modelos generales, conforme a los términos aplicables.

Asimismo, Atendel no utiliza el contenido de las cuentas vinculadas para entrenar modelos generales de inteligencia artificial propios.

### 6. Uso de datos de los servicios de Google

Cuando Atendel accede a información mediante las API de Google, su recopilación, utilización, almacenamiento y transferencia se realizan de conformidad con la Política de Datos del Usuario de los Servicios de API de Google, incluidos sus requisitos de Uso Limitado (Limited Use).

Puedes consultar dicha política en el siguiente enlace: [Política de Datos del Usuario de los Servicios de API de Google](https://developers.google.com/terms/api-services-user-data-policy).

Atendel limita el uso de los datos obtenidos mediante las API de Google a las finalidades necesarias para proporcionar y mejorar las funcionalidades solicitadas por el usuario, de conformidad con los permisos concedidos y las condiciones establecidas por Google.

### 7. Conservación y eliminación de la información

La información obtenida mediante las cuentas vinculadas se conservará durante los periodos establecidos en el Aviso de Privacidad Integral de Atendel y únicamente mientras resulte necesaria para cumplir las finalidades para las que fue recopilada, salvo que exista una obligación legal que requiera un periodo de conservación distinto.

En caso de que el usuario desconecte una cuenta:

- Atendel dejará de utilizar las autorizaciones asociadas a dicha cuenta.
- Los tokens y credenciales de autorización almacenados serán eliminados conforme al procedimiento técnico correspondiente.
- La información previamente obtenida se conservará o eliminará de acuerdo con los plazos y criterios establecidos en el Aviso de Privacidad Integral.

En caso de eliminación de la cuenta del usuario en Atendel, los datos personales y demás información asociada serán eliminados conforme a los procedimientos y plazos previstos en dicho Aviso, sin perjuicio de las obligaciones legales de conservación aplicables.

### 8. Derechos y solicitudes del usuario

El usuario podrá ejercer los derechos de acceso, rectificación, cancelación y oposición respecto de sus datos personales, así como los demás derechos que le reconozca la legislación aplicable, conforme al procedimiento establecido en el Aviso de Privacidad Integral de Atendel.

Asimismo, podrá solicitar información relacionada con las cuentas vinculadas, el alcance de los permisos concedidos y los procedimientos para revocar dichos accesos.

Para presentar consultas, solicitudes o aclaraciones relacionadas con esta Política, el usuario podrá comunicarse a través del siguiente correo electrónico: infoatendel@gmail.com

### 9. Modificaciones y actualizaciones

Atendel se reserva el derecho de modificar o actualizar la presente Política cuando resulte necesario para reflejar cambios en sus funcionalidades, procesos operativos, medidas de seguridad, proveedores tecnológicos o disposiciones legales aplicables.

Cualquier modificación será publicada en el sitio web o en el centro de privacidad de Atendel, indicando la fecha de su última actualización.

Cuando las modificaciones sean sustanciales y afecten de manera relevante las condiciones de acceso o tratamiento de la información, Atendel notificará a los usuarios mediante los canales de comunicación disponibles, incluyendo el panel de usuario o el correo electrónico registrado, antes de su entrada en vigor cuando corresponda.

El uso continuado de los servicios de Atendel estará sujeto a las condiciones de la Política vigente, sin perjuicio de los derechos que correspondan al usuario conforme a la legislación aplicable.
`;
