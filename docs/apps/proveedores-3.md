# Configurar apps: PayPal, Conekta, Openpay, Square, Facturama, Alegra, Holded y QuickBooks

Estas secciones se suman a `docs/configurar-apps.md`. En todas:

- **`<dominio>`** es el dominio donde vive Atendel (por ejemplo `atendel.mx`, o el `*.vercel.app` del proyecto).
- **La URI de redirección** (solo Square y QuickBooks) es `https://<dominio>/api/conexiones/<proveedor>/callback` y se pega tal cual en la app del proveedor.
- **Las variables van en Vercel** (Settings → Environment Variables), nunca en el código ni en el chat. Después de agregarlas, vuelve a desplegar.
- Todas necesitan además `ATENDEL_LLAVE_CIFRADO` (la que cifra los tokens y las llaves; ver la guía principal).
- **Todo es de solo lectura.** Ningún agente cobra, factura, timbra, cancela, cambia ni borra nada.
- Los montos salen con su moneda (`$1,234.50 MXN`) y las fechas en hora del centro de México.

| App | Cómo se conecta | Qué pega la persona / qué va en Vercel | Lo usan |
| --- | --- | --- | --- |
| PayPal | Llave | `clientId:secret` de su app REST | Iris |
| Conekta | Llave | su llave privada `key_…` | Iris |
| Openpay | Llave | `merchantId:llavePrivada` | Iris (clientes también Víctor) |
| Square | OAuth | `SQUARE_CLIENT_ID`, `SQUARE_CLIENT_SECRET` | Iris, Víctor (clientes) y Lola (citas) |
| Facturama | Llave | `usuario:contraseña` de su cuenta | Iris y Víctor |
| Alegra | Llave | `correo:token` | Iris y Víctor |
| Holded | Llave | su clave de la API | Iris y Víctor |
| QuickBooks | OAuth | `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET` | Iris y Víctor |

Las apps **por llave** no necesitan nada en Vercel (solo `ATENDEL_LLAVE_CIFRADO`): cada negocio pega **su** llave en la tarjeta de la app (Tu negocio → Apps) y se guarda cifrada. La llave nunca se muestra de vuelta ni se escribe en los registros. Las llaves de dos partes se pegan **juntas, separadas por dos puntos y sin espacios**, por ejemplo `AbC123…:XyZ789…`.

Para desconectar, el botón **Desconectar** borra la llave de Atendel. Si además quieres que deje de servir, bórrala o cámbiala en el panel de la app (abajo dice dónde).

---

## Pagos en México

### PayPal (por llave)

**Qué hace la IA:** Iris ve tus movimientos de los últimos 31 días (cobros, reembolsos y comisiones, con quién pagó y el concepto) y el saldo de tu cuenta. PayPal tarda hasta 3 horas en mostrar un movimiento nuevo.

**Cómo sacar la llave:**

1. Entra a [developer.paypal.com](https://developer.paypal.com) con la cuenta PayPal de tu negocio.
2. Ve a **Apps & Credentials**, elige **Live** (producción) y toca **Create App**. Ponle de nombre "Atendel".
3. Copia el **Client ID** y el **Secret**.
4. En la misma app, en sus funciones (**Features**), activa **Transaction search** y guarda. Sin eso PayPal no deja ver los movimientos.
5. En Atendel, pega `ClientID:Secret` en la tarjeta de PayPal.

Atendel cambia esa llave por un permiso que dura unas 9 horas y lo renueva solo. Si pegas una llave de **Sandbox** (pruebas), también funciona, con datos de prueba.

**Para quitarle el acceso:** borra la app o cambia su Secret en developer.paypal.com.

### Conekta (por llave)

**Qué hace la IA:** Iris ve tus órdenes y tus cargos recientes (tarjeta, efectivo en OXXO y SPEI), con monto, estado, cliente y productos. Puede buscar por correo o referencia.

**Cómo sacar la llave:**

1. Entra a tu panel de Conekta → **Desarrolladores** → **API Keys**.
2. Copia tu **llave privada** (empieza con `key_`). No uses la pública.
3. Pégala en la tarjeta de Conekta. Si es la llave del modo de pruebas, verás datos de prueba.

**Para quitarle el acceso:** borra o rota esa llave en el mismo lugar.

### Openpay (por llave)

**Qué hace la IA:** Iris ve tus cargos recientes (tarjeta, efectivo en tienda o SPEI), con monto, estado y el motivo si falló. Iris y Víctor pueden buscar a tus clientes guardados en Openpay.

**Cómo sacar la llave:**

1. Entra a tu panel de Openpay México → **Configuración**. Ahí ves tu **ID de comercio** (empieza con `m`) y tu **llave privada** (empieza con `sk_`).
2. Pega `IDdeComercio:LlavePrivada` en la tarjeta de Openpay.

Si la llave es del ambiente de pruebas (Sandbox), Atendel lo detecta solo.

**Para quitarle el acceso:** regenera la llave privada en el panel de Openpay.

### Square (OAuth)

**Qué hace la IA:** Iris ve tus pagos recientes; Iris y Víctor buscan a tus clientes del directorio de Square; Lola e Iris ven las citas de **Square Appointments** (hasta 31 días a la vez), con el nombre de quien reservó.

> Square opera en pocos países (por ejemplo Estados Unidos, Canadá y España). Si la cuenta es de otro país, los montos salen en su moneda.

1. Entra a [developer.squareup.com](https://developer.squareup.com) → **Developer Console** → **Create application** (ponle "Atendel").
2. Arriba elige **Production**. En **OAuth**, en **Redirect URL**, pega `https://<dominio>/api/conexiones/square/callback`. Square guarda una sola dirección de regreso por app: usa la del dominio de producción.
3. En **Credentials** copia el **Application ID** (empieza con `sq0idp-`) y en **OAuth** el **Application secret**.
4. En Vercel:
   - `SQUARE_CLIENT_ID` = el Application ID;
   - `SQUARE_CLIENT_SECRET` = el Application secret.

**Permisos que pide Atendel:** `MERCHANT_PROFILE_READ`, `PAYMENTS_READ`, `CUSTOMERS_READ`, `APPOINTMENTS_READ` y `APPOINTMENTS_ALL_READ`. Todos son de lectura.

Para **probar** con datos de prueba, usa el Application ID y el secret de **Sandbox** (el ID empieza con `sandbox-`): Atendel lo detecta y va al servidor de pruebas de Square.

El permiso dura 30 días y Atendel lo renueva solo. **Desconectar** también revoca el permiso en Square.

---

## Contabilidad y facturas

> **Zoho Books** se conecta con el mismo botón de Zoho que Zoho CRM; su guía está con la de Zoho.

### Facturama (por llave)

**Qué hace la IA:** Iris y Víctor ven tus facturas (CFDI) emitidas: fecha, serie y folio, cliente con su RFC, total, si está vigente o cancelada y su UUID. Pueden buscarlas por **RFC** o nombre del cliente, por estado y por fechas, y buscar a tus clientes guardados. **Solo lectura: Atendel nunca timbra, cancela ni envía facturas.**

**Cómo sacar la llave:**

1. Necesitas una cuenta de la **API de Facturama** (API Web o Multiemisor).
2. La llave es el **usuario y la contraseña** con los que entras a esa cuenta.
3. Pega `usuario:contraseña` en la tarjeta de Facturama (si tu contraseña tiene dos puntos, no pasa nada).

Si la cuenta es de pruebas (Sandbox), Atendel lo detecta solo.

**Para quitarle el acceso:** cambia la contraseña de tu cuenta de Facturama. Si quieres separar el acceso de Atendel, crea un usuario aparte para la API.

### Alegra (por llave)

**Qué hace la IA:** Iris y Víctor ven tus facturas de venta (con lo que falta por cobrar y cuándo vencen) y buscan tus contactos; Iris ve los cobros que registras.

**Cómo sacar la llave:**

1. En Alegra, entra a **Configuración** → **Integraciones con otros sistemas** → **API**.
2. Copia tu **token**.
3. Pega `tucorreo@ejemplo.com:token` (el correo con el que entras a Alegra) en la tarjeta de Alegra.

**Para quitarle el acceso:** genera un token nuevo en el mismo lugar.

### Holded (por llave)

**Qué hace la IA:** Iris y Víctor ven tus facturas (con lo pendiente por cobrar) y buscan tus contactos; Iris ve también presupuestos, pedidos de venta, proformas, tickets de venta y albaranes.

Atendel usa la **API v2** de Holded (la v1 ya es obsoleta).

**Cómo sacar la llave:**

1. En Holded, entra a **Ajustes** → **API** → **Generar nueva clave**.
2. Dale permisos **de lectura** (facturas, contactos y los documentos de venta que quieras; si le das el de información de la cuenta, la tarjeta muestra el nombre de tu empresa).
3. Copia la clave (Holded solo la muestra una vez) y pégala en la tarjeta de Holded.

**Para quitarle el acceso:** borra la clave en Ajustes → API.

### QuickBooks (OAuth)

**Qué hace la IA:** Iris y Víctor ven tus facturas (con saldo y vencimiento) y buscan a tus clientes; Iris ve los pagos que recibes.

1. Entra a [developer.intuit.com](https://developer.intuit.com) → **Dashboard** → **Create an app** → **QuickBooks Online and Payments**, ponle "Atendel" y elige el permiso **Accounting** (`com.intuit.quickbooks.accounting`).
2. En **Keys & credentials**, en **Redirect URIs**, agrega `https://<dominio>/api/conexiones/quickbooks/callback` (una por cada dominio que uses).
3. Copia el **Client ID** y el **Client Secret**.
4. En Vercel:
   - `QUICKBOOKS_CLIENT_ID` = el Client ID;
   - `QUICKBOOKS_CLIENT_SECRET` = el Client Secret.

**Aprobación de Intuit:** las llaves de **producción** se dan después de llenar el perfil y el cuestionario de la app en developer.intuit.com. Mientras, con las llaves de **desarrollo**, solo funciona con empresas de prueba (sandbox). Para probar así, agrega también en Vercel `QUICKBOOKS_AMBIENTE` = `sandbox` (es opcional; quítala cuando uses las de producción).

Al conectar, QuickBooks dice qué empresa se eligió y Atendel la recuerda. El permiso dura una hora y Atendel lo renueva solo. **Desconectar** también revoca el permiso en Intuit.
