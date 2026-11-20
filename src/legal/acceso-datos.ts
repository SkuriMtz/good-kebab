/**
 * Política de Acceso a Cuentas y Datos (en Markdown): cómo entra Atendel a las cuentas que
 * conectas y cómo mantiene privada la información. Se pinta en /acceso-a-tus-datos con
 * src/components/legal/DocumentoMd.tsx. Vale el español; los demás idiomas son traducciones.
 */
export const ACCESO_DATOS = `# Política de Acceso a Cuentas y Datos
## ATENDEL

**Última actualización: 20 de noviembre de 2026**

### 1. Para qué es este documento

Para trabajar por el usuario, Atendel necesita entrar a algunas de sus cuentas, como su correo, su calendario, su WhatsApp Business u otras aplicaciones. Esta Política explica, en lenguaje claro, cómo se da ese acceso, qué hace Atendel con la información y cómo la mantiene privada.

Esta Política complementa el Aviso de Privacidad Integral, los Términos y Condiciones y la Política de Inteligencia Artificial de Atendel. Si hubiera alguna diferencia, prevalece el Aviso de Privacidad Integral.

### 2. El usuario decide qué conecta

- Atendel solo entra a las cuentas que el usuario conecta él mismo, iniciando sesión en cada servicio (por ejemplo, Google o Microsoft).
- Atendel nunca pide ni guarda las contraseñas de esas cuentas. El servicio le entrega un permiso limitado a lo que el usuario aceptó.
- Antes de aceptar, cada servicio muestra qué permisos se piden. Atendel pide solo los necesarios para las funciones que el usuario activa.
- El usuario puede desconectar cualquier cuenta en cualquier momento desde el panel o desde la configuración del propio servicio. Al desconectarla, Atendel deja de acceder a ella, retira el permiso en el servicio cuando este lo permite y borra el permiso guardado.

### 3. Qué hace Atendel con lo que ve

- Lee únicamente la información necesaria para lo que el usuario le encarga o activó, por ejemplo: revisar correos nuevos, ver citas, preparar respuestas o mover una cita.
- Puede actuar dentro de esas cuentas, como mandar un correo o crear y mover una cita, solo con los permisos concedidos y según lo que el usuario configuró en «Qué hace solo».
- Las acciones que involucran dinero, y las que las Reglas del usuario no cubren, siempre requieren la aprobación del usuario antes de realizarse.
- No usa la información para publicidad, no la vende y no la comparte para que terceros contacten al usuario o a sus clientes.

### 4. Cómo se mantiene privada

- **Solo la cuenta del usuario la ve.** La información de cada negocio está separada en la base de datos con reglas de acceso por cuenta. Ningún otro usuario puede verla.
- **Permisos cifrados.** Los permisos de las cuentas conectadas se guardan cifrados con el algoritmo AES-256-GCM y solo los usan los servidores de Atendel.
- **Todo viaja cifrado.** La información viaja cifrada (HTTPS) entre el dispositivo del usuario, Atendel y los servicios conectados.
- **Nadie la lee.** Ninguna persona del equipo de Atendel lee los correos, mensajes o archivos del usuario, salvo con su autorización para darle soporte, por motivos de seguridad o cuando la ley lo exija.
- **Mínimo indispensable.** De la conexión del usuario se guarda solo un resumen cifrado de la IP (un hash), nunca la IP.

### 5. Inteligencia artificial

Para entender y responder, Atendel envía a su proveedor de inteligencia artificial (Anthropic) solo el texto necesario para cada tarea. Según sus términos para empresas, ese proveedor no usa esos datos para entrenar sus modelos. Atendel tampoco los usa para entrenar modelos generales de inteligencia artificial.

### 6. Datos de Google

El uso que hace Atendel de la información recibida de las API de Google, y su transferencia a cualquier otra aplicación, se apega a la [Política de datos del usuario de los servicios de API de Google](https://developers.google.com/terms/api-services-user-data-policy), incluidos los requisitos de Uso Limitado (Limited Use).

### 7. Cuánto tiempo se guarda

La información de las cuentas conectadas se conserva según los plazos del Aviso de Privacidad Integral. Al desconectar una cuenta se borra su permiso guardado, y al eliminar la cuenta de Atendel los datos se borran conforme a ese Aviso.

### 8. Derechos del usuario

El usuario puede acceder a sus datos, corregirlos, cancelarlos u oponerse a su uso, como se explica en el Aviso de Privacidad Integral. Para cualquier duda o solicitud: **infoatendel@gmail.com**.

### 9. Cambios a esta Política

Si esta Política cambia, se publicará aquí con su nueva fecha. Cuando el cambio sea sustancial, Atendel avisará a los usuarios mediante el panel o por correo electrónico antes de que aplique.
`;
