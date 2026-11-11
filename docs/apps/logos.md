# Logos de las apps conectables

Cada tarjeta de **Tu negocio → Apps conectadas** muestra el logo de su marca (archivo en `public/apps`,
mapa en `src/lib/conexiones/logos.ts`). Las marcas y logos son de sus dueños; aquí se usan solo para que
la persona reconozca la app que conecta con su propia cuenta. No se usan para decir que esas empresas
recomiendan Atendel ni son clientes.

## De dónde sale cada uno

| Origen | Licencia | Apps |
|---|---|---|
| [gilbarbara/logos](https://github.com/gilbarbara/logos) (paquete `@iconify-json/logos` 1.2.19) | CC0 1.0 | Gmail, Google Calendar, Google Drive, Google (Contactos y Perfil de Negocio), Microsoft (Outlook, Calendario de Outlook, Excel y Contactos de Outlook), OneDrive, WhatsApp, Instagram, Messenger, Telegram, Slack, Zoom, Notion, Dropbox, Airtable, Trello, Shopify, PayPal, Square, Typeform, Mailchimp, Facebook |
| [Simple Icons](https://simpleicons.org) (paquete `simple-icons` 16.37.0) | CC0 1.0 (la marca sigue siendo de su dueño) | Google Sheets, Google Forms, Calendly, HubSpot, Stripe, Mercado Pago, Zoho (Books y CRM), QuickBooks, Conekta |
| El ícono oficial que publica cada empresa en su propio sitio (favicon o apple-touch-icon), pasado a PNG de 64 px | Marca de su dueño | Mercado Libre, Tiendanube, Clip, Facturapi (Facturas CFDI), AgendaPro, Fresha, Booksy, Doctoralia, Acuity Scheduling, SimplyBook.me, Setmore, Openpay, Facturama, Alegra, Holded, Kommo, Pipedrive |

Notas:
- Outlook, Excel y los contactos y el calendario de Outlook llevan el logo de Microsoft (no hay versión libre del
  logo de cada producto); Contactos y Perfil de Negocio de Google llevan la "G" de Google.
- Los logos que vienen de los sitios se guardaron como PNG (no como SVG) para que no lleven código.
- Si una empresa pide quitar o cambiar su logo, basta con cambiar su archivo en `public/apps`.
