# Apps de pagos, ventas y facturación: cómo dejarlas listas

Esta guía es para el dueño de Atendel. Explica qué hacer en cada app para que la
IA pueda **leer** (nunca cobrar, contestar, timbrar ni cancelar) los pagos,
ventas y facturas de cada negocio, con la cuenta de ese negocio.

Son seis apps:

| App | Cómo se conecta | Qué pones en Vercel | Quién la usa |
| --- | --- | --- | --- |
| Stripe | La persona pega una **llave restringida** | Nada | Iris (pagos) y Víctor (clientes) |
| Mercado Pago | Botón **Conectar** | `MERCADOPAGO_CLIENT_ID`, `MERCADOPAGO_CLIENT_SECRET` | Iris |
| Mercado Libre | Botón **Conectar** | `MERCADOLIBRE_CLIENT_ID`, `MERCADOLIBRE_CLIENT_SECRET` | Iris y Víctor |
| Shopify | Botón **Conectar** y la persona escribe su tienda | `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET` | Iris y Víctor |
| Tiendanube | Botón **Conectar** | `TIENDANUBE_CLIENT_ID`, `TIENDANUBE_CLIENT_SECRET` | Iris y Víctor |
| Facturapi (CFDI) | La persona pega la **llave de su organización** | Nada | Iris |

Todas necesitan además `ATENDEL_LLAVE_CIFRADO` en Vercel, la misma llave de las
demás apps, porque los tokens y las llaves se guardan cifrados.

## Antes de empezar

- **Tu dominio.** En esta guía, `<dominio>` es el dominio de producción de
  Atendel, sin `https://` y sin `/` al final. Por ejemplo, si tu sitio es
  `https://atendel.mx`, entonces `<dominio>` es `atendel.mx`.
- **La URI de redirección** de cada app que usa el botón Conectar es:

  ```
  https://<dominio>/api/conexiones/<proveedor>/callback
  ```

  Escríbela **exacta**: con `https`, sin espacios y sin `/` al final.

  | App | URI de redirección |
  | --- | --- |
  | Mercado Pago | `https://<dominio>/api/conexiones/mercadopago/callback` |
  | Mercado Libre | `https://<dominio>/api/conexiones/mercadolibre/callback` |
  | Shopify | `https://<dominio>/api/conexiones/shopify/callback` |
  | Tiendanube | `https://<dominio>/api/conexiones/tiendanube/callback` |

- **Las variables en Vercel.** Ve a tu proyecto, luego a *Settings*, luego a
  *Environment Variables*. Agrega cada nombre con su valor, marca
  *Production* (y *Preview* si también quieres probar en las vistas previas)
  y vuelve a desplegar. Nunca pegues estos valores en el chat ni en el código.
- **Si falta algo**, la tarjeta de la app dice exactamente qué variable falta.

---

## Stripe (por llave, nada en Vercel)

Cada negocio crea **su propia** llave en su cuenta de Stripe. Atendel solo
acepta llaves **restringidas**: empiezan con `rk_live_` (o con `rk_test_` en
modo de prueba). Si alguien pega una llave secreta (`sk_live_…`), Atendel la
rechaza con el mensaje "usa una llave restringida de solo lectura", porque esa
llave puede hacer de todo.

Lo que hace la persona:

1. Entra a su panel de Stripe y abre *Desarrolladores*, luego *Llaves de API*.
2. Toca **Crear llave restringida** y ponle un nombre, por ejemplo "Atendel".
3. Elige **Lectura** en estos permisos y deja **Ninguno** en todo lo demás:
   - *Balance* (saldo);
   - *Charges* (cobros);
   - *PaymentIntents* (pagos);
   - *Customers* (clientes).

   Si quiere que en la tarjeta salga el nombre de su negocio, puede dar también
   lectura a los datos de la cuenta. Si no, la tarjeta dice "Stripe".
4. Copia la llave (`rk_live_…`) y la pega en Atendel, en *Tu negocio*, luego
   *Apps*, en la tarjeta de Stripe.

**Qué puede ver la IA:** los pagos recientes (cobrados, rechazados, reembolsados
y los que siguen sin completarse), el saldo disponible y pendiente, y los
clientes que más han pagado.

**Para desconectar:** se toca *Desconectar* en la tarjeta. Para quitar el
permiso del todo, la persona borra la llave en Stripe (*Llaves de API*).

---

## Mercado Pago (botón Conectar)

Una sola vez, el dueño de Atendel crea la aplicación:

1. Entra a <https://www.mercadopago.com.mx/developers/panel/app> con la cuenta
   de Mercado Pago de Atendel y toca **Crear aplicación**.
2. Ponle nombre (por ejemplo "Atendel") y elige que es para pagos en línea.
3. En la configuración de la aplicación, en **URL de redireccionamiento**,
   pon `https://<dominio>/api/conexiones/mercadopago/callback`.
4. Si aparece la opción de **PKCE**, actívala: Atendel lo manda siempre y así es
   más seguro.
5. En **Credenciales de producción**, copia el **Client ID** y el
   **Client Secret**.
6. En Vercel:
   - `MERCADOPAGO_CLIENT_ID` = el Client ID;
   - `MERCADOPAGO_CLIENT_SECRET` = el Client Secret.

Luego cada negocio toca *Conectar* en la tarjeta de Mercado Pago y acepta.

**Qué puede ver la IA:** los pagos recibidos de hasta 12 meses atrás, con su
estado (aprobado, pendiente, rechazado o devuelto), el monto, el medio de pago,
quién pagó y lo que queda después de comisiones.

**Para desconectar:** se toca *Desconectar* en la tarjeta. Mercado Pago no
permite quitar el permiso desde otra app, así que, para quitarlo del todo, la
persona entra a su cuenta de Mercado Pago, a la parte de seguridad, donde
salen las aplicaciones conectadas, y quita Atendel. El permiso dura 180 días y
Atendel lo renueva solo.

---

## Mercado Libre (botón Conectar)

Una sola vez, el dueño de Atendel crea la aplicación:

1. Entra a <https://developers.mercadolibre.com.mx/devcenter> con la cuenta de
   Mercado Libre de Atendel y toca **Crear una aplicación**.
2. Llena el nombre y la descripción. En **URI de redirect**, pon
   `https://<dominio>/api/conexiones/mercadolibre/callback`.
3. Activa **PKCE** si aparece la opción.
4. En los permisos, marca la lectura de ventas (órdenes) y de preguntas y
   respuestas, y el permiso para trabajar sin que la persona esté conectada
   (**offline access**, que da el refresh token).
5. Guarda y copia el **App ID** y la **Secret Key**.
6. En Vercel:
   - `MERCADOLIBRE_CLIENT_ID` = el App ID;
   - `MERCADOLIBRE_CLIENT_SECRET` = la Secret Key.

Luego cada negocio toca *Conectar* en la tarjeta de Mercado Libre y acepta.

**Qué puede ver la IA:** las ventas recientes (número de orden, estado, total,
artículos y comprador) y las preguntas de compradores sin contestar, para
proponer respuestas. **No contesta nada.**

**Para desconectar:** con *Desconectar*, Atendel quita su permiso en Mercado
Libre. El acceso dura 6 horas y se renueva solo.

---

## Shopify (botón Conectar, por tienda)

Una sola vez, el dueño de Atendel crea la app:

1. Entra al **Dev Dashboard** de Shopify (<https://dev.shopify.com>) y crea una
   app nueva llamada "Atendel".
2. En la configuración de la versión de la app:
   - **App URL:** `https://<dominio>`;
   - **Redirect URLs:** `https://<dominio>/api/conexiones/shopify/callback`;
   - **Access scopes** (solo lectura): `read_orders`, `read_products`,
     `read_inventory` y `read_customers`.

   Publica (*release*) esa versión.
3. Copia el **Client ID** y el **Client secret** de la app.
4. En Vercel:
   - `SHOPIFY_CLIENT_ID` = el Client ID;
   - `SHOPIFY_CLIENT_SECRET` = el Client secret.
5. **Datos de clientes.** Para ver nombres y correos de clientes en cualquier
   tienda, pide en el Dev Dashboard el acceso a **datos protegidos de clientes**
   (*Protected customer data*) para nombre y correo, y explica que es para que
   el asistente del negocio le diga quién compró. Mientras Shopify no lo
   apruebe, esos datos solo se ven en tiendas de desarrollo. En las demás, la IA
   dice con un mensaje amable que Shopify los oculta, y lo demás (montos,
   estados y productos) sí se ve.
6. **Para que cualquier tienda la instale**, la app tiene que ser pública (con
   su revisión en la App Store) o tener distribución personalizada para cada
   tienda. Para la App Store, Shopify pide además tres webhooks de privacidad
   (datos de clientes, borrar clientes y borrar tienda) que **todavía no están
   en Atendel**.

Luego cada negocio toca *Conectar* en la tarjeta de Shopify y escribe el
dominio de su tienda, como `mitienda.myshopify.com` (también sirve solo
`mitienda`). Atendel revisa que sea un dominio de Shopify y, al volver, revisa
la firma (HMAC) de Shopify antes de guardar nada.

**Qué puede ver la IA:** los pedidos recientes, los productos con poco
inventario y los clientes (cuánto han comprado y su último pedido). Shopify
solo deja ver los pedidos de los **últimos 60 días**, y la IA lo dice.

**Para desconectar:** con *Desconectar*, Atendel se quita de la tienda. El
acceso dura una hora y se renueva solo; si pasan 90 días sin usarse, hay que
volver a conectar.

---

## Tiendanube (botón Conectar)

Una sola vez, el dueño de Atendel crea la aplicación:

1. Entra al **Portal de Socios** de Tiendanube (<https://partners.tiendanube.com>)
   y crea una aplicación nueva llamada "Atendel".
2. En **URL de redirección después de instalar**, pon
   `https://<dominio>/api/conexiones/tiendanube/callback`.
3. En los permisos, marca solo **lectura** de pedidos (*Orders*) y de productos
   (*Products*).
4. Copia el **ID de la aplicación**, que es un número, y el **Client Secret**.
5. En Vercel:
   - `TIENDANUBE_CLIENT_ID` = el ID de la aplicación (solo el número);
   - `TIENDANUBE_CLIENT_SECRET` = el Client Secret.

Luego cada negocio toca *Conectar* en la tarjeta de Tiendanube y acepta.

**Qué puede ver la IA:** los pedidos recientes (número, total, estado de pago y
de envío, cliente y productos) y los productos con su precio e inventario,
incluidos los que tienen poco.

**Ten en cuenta:**

- Tiendanube acepta **una sola** URL de redirección, así que el botón Conectar
  solo funciona en el dominio de producción, no en las vistas previas.
- Tiendanube también pide webhooks de privacidad para publicar la app en su
  tienda de apps, y **todavía no están en Atendel**.

**Para desconectar:** se toca *Desconectar* en la tarjeta. Para quitar el
permiso del todo, la persona desinstala Atendel en el administrador de su
tienda, en la parte de aplicaciones. El acceso no vence.

---

## Facturapi para facturas CFDI (por llave, nada en Vercel)

Cada negocio usa **su** organización de Facturapi, la que timbra sus facturas.

Lo que hace la persona:

1. Entra a <https://dashboard.facturapi.io> y abre su organización, la de su
   RFC.
2. Abre **Llaves de API** y copia la **llave secreta de producción**, que
   empieza con `sk_live_`. La llave de usuario (`sk_user_…`) no sirve.
3. La pega en Atendel, en *Tu negocio*, luego *Apps*, en la tarjeta de
   Facturas CFDI.

Facturapi no tiene llaves de solo lectura: esa llave también podría timbrar.
Atendel la guarda cifrada y **solo la usa para leer**: nunca timbra, cancela ni
manda facturas.

**Qué puede ver la IA:** las facturas recientes, con su folio, fecha, tipo,
cliente y RFC, total y estado (vigente, cancelada, pendiente o borrador; si es
PPD, si ya se pagó). También puede buscar por cliente, RFC, folio o UUID.

**Para desconectar:** se toca *Desconectar* en la tarjeta. Para quitar el
permiso del todo, la persona renueva la llave en Facturapi, y la anterior deja
de servir.

---

## Resumen para Vercel

```
ATENDEL_LLAVE_CIFRADO      (la misma de las demás apps)
MERCADOPAGO_CLIENT_ID
MERCADOPAGO_CLIENT_SECRET
MERCADOLIBRE_CLIENT_ID
MERCADOLIBRE_CLIENT_SECRET
SHOPIFY_CLIENT_ID
SHOPIFY_CLIENT_SECRET
TIENDANUBE_CLIENT_ID
TIENDANUBE_CLIENT_SECRET
```

Stripe y Facturapi no llevan variables: cada negocio pega su propia llave en
su tarjeta.
