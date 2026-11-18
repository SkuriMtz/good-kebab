/**
 * Lista de Proveedores y Subencargados, versión 1.0: traducción al inglés (vale la versión en español).
 */
export const TEXTO = `# List of Providers and Subprocessors
## ATENDEL

**Last updated: November 17, 2026**

**Version:** 1.0

### 1. Purpose

This document identifies the technology providers and external services that may take part in the operation of Atendel, as well as the general functions they perform and the categories of information they could process.

Its purpose is to provide transparency to users and to make it easier to understand the data processing operations that may be carried out to provide Atendel's services.

This document supplements the Comprehensive Privacy Notice, the Personal Data Processing Agreement and the Terms and Conditions.

### 2. Scope

The list covers providers that may take part in:

- Hosting and distribution of the platform.
- Databases and storage.
- Authentication and account management.
- Artificial intelligence processing.
- Connection with external apps.
- Messaging and communications.
- Notifications.
- Security and technical operation.

The participation of each provider will depend on the enabled functions, the user's configuration and the technical architecture in force.

The inclusion of a provider in this list does not necessarily mean that all of Atendel's data is transmitted to that provider.

### 3. Identified providers

**3.1. Supabase**

**Category:** Infrastructure, database, storage and authentication.

**Function within Atendel:**

Supabase provides the infrastructure services needed to store information, manage records, handle files and facilitate authentication processes, including sending access codes by email.

**Categories of information that could be processed:**

- Account data.
- Business information.
- Preferences and settings.
- Conversations with Atendel.
- Documents and files.
- Technical and security logs.
- Information necessary to maintain the platform's functions.

**Processing location:** United States (eastern region, Virginia), according to the project contracted by Atendel.

**Applicable terms:** Contract, security documentation and provider policies.

**3.2. Vercel**

**Category:** Application hosting and distribution.

**Function within Atendel:**

Vercel provides the infrastructure to publish, distribute and deliver Atendel's website and dashboard, and to run its server.

**Categories of information that could be processed:**

- Technical requests.
- Connection data.
- Operating logs.
- Information necessary to deliver the platform's pages and resources.

**Processing location:** United States (Washington, D.C. region) for Atendel's server, with a global distribution network to deliver the pages.

**Applicable terms:** Contract and provider policies.

**3.3. Anthropic**

**Category:** Artificial intelligence.

**Function within Atendel:**

Anthropic provides the artificial intelligence models used to interpret instructions, process information and generate the results requested by users, including the «Rápido» (Fast) and «Avanzado» (Advanced) modes that the user can choose in the chat.

**Categories of information that could be processed:**

- User instructions.
- Authorized messages and content.
- Business information needed for a task.
- Fragments of documents or files sent to the model.
- Context necessary to generate responses or run processes.

**Processing location:** United States, according to the provider's documentation; Atendel will confirm the region applicable to the contracted service.

**Applicable terms:** Commercial agreements, data processing terms and provider documentation.

Atendel must verify the specific conditions on retention, data use, model training and security controls applicable to the contracted service. A general commercial description will not be considered sufficient to state that certain information is never retained or never used for training.

**3.4. Meta / WhatsApp**

**Category:** Messaging and communication.

**Function within Atendel:**

Meta and the WhatsApp services take part in the connection, receipt and transmission of messages when the user connects their business's WhatsApp, and in the notices that Atendel sends to the user through WhatsApp when the user has turned them on.

**Categories of information that could be processed:**

- Account identifiers.
- Phone numbers.
- Messages.
- Communication metadata.
- Information necessary to deliver messages and maintain the integration.

**Processing location:** According to the provider's global infrastructure.

**Applicable terms:** Applicable terms, policies and documentation of Meta and WhatsApp.

**3.5. Google**

**Category:** Authentication, notification services and integrations.

**Function within Atendel:**

Google takes part in signing in with a Google account, when the user chooses that method; in the delivery of notifications in Chrome and Android; and in the Google integrations that the user connects.

**Categories of information that could be processed:**

- Technical identifiers.
- Data necessary for notifications.
- Information authorized through Google integrations.
- Authentication or authorization data where applicable.

**Processing location:** According to the provider's global infrastructure.

**Applicable terms:** Google's terms and policies and the terms of the integrations used.

**3.6. Apple**

**Category:** Notifications and device services.

**Function within Atendel:**

Apple takes part in the delivery of notifications in Safari, iPhone and Mac when the user turns on notifications on those devices.

**Categories of information that could be processed:**

- Technical device identifiers.
- Notification tokens.
- Data necessary to deliver notices.

**Processing location:** According to the provider's global infrastructure.

**Applicable terms:** Apple's terms and policies.

**3.7. Mozilla**

**Category:** Browser notification services.

**Function within Atendel:**

Mozilla takes part in the delivery of web notifications when the user turns them on in Firefox.

**Categories of information that could be processed:**

- Subscription identifiers.
- Technical browser information.
- Data necessary to deliver notifications.

**Processing location:** According to the provider's global infrastructure.

**Applicable terms:** Mozilla's terms and policies.

**3.8. Microsoft**

**Category:** Notification services and integrations.

**Function within Atendel:**

Microsoft takes part in the delivery of notifications in Edge and Windows and in the Microsoft integrations that the user connects.

**Categories of information that could be processed:**

- Technical identifiers.
- Information necessary for notifications.
- Data authorized through Microsoft integrations.

**Processing location:** According to the provider's global infrastructure.

**Applicable terms:** Microsoft's terms and policies.

**3.9. Cloudflare**

**Category:** Security.

**Function within Atendel:**

Cloudflare Turnstile verifies that the person creating an account or signing in is a human, when this protection is enabled.

**Categories of information that could be processed:**

- Technical browser information.
- Data necessary for the verification.

**Processing location:** According to the provider's global infrastructure.

**Applicable terms:** Cloudflare's terms and policies.

### 4. Apps connected by the user

Atendel allows the voluntary connection of external apps, including:

- **Google:** Gmail, Google Calendar, Google Tasks, Google Drive, Google Sheets, Google Contacts, Google Business Profile and Google Forms.
- **Microsoft:** Outlook, Outlook Calendar, Microsoft To Do, OneDrive, Excel and Outlook Contacts.
- **Meta:** WhatsApp Business, Instagram, Messenger and Facebook Reviews.
- **Messaging and teamwork:** Telegram, Slack, Zoom, Notion, Dropbox, Airtable, Trello and Todoist.
- **Customers and marketing:** HubSpot, Zoho CRM, Pipedrive, Kommo, Mailchimp and Typeform.
- **Scheduling and appointments:** Calendly, Acuity Scheduling, SimplyBook.me, Setmore, AgendaPro, Fresha, Booksy and Doctoralia.
- **Payments and sales:** Stripe, Mercado Pago, Mercado Libre, Shopify, Tiendanube, Clip, PayPal, Conekta, Openpay and Square.
- **Accounting and invoicing:** Zoho Books, Facturama, Alegra, Holded, QuickBooks and CFDI (Comprobante Fiscal Digital por Internet, Mexico's electronic tax invoice) invoicing.
- Other apps that are added to the platform.

The availability of each app may vary depending on the stage of the platform and the approvals required by each provider.

These apps may process information directly under their own terms and conditions.

When Atendel accesses information through an integration, the scope of access will depend on:

1. The authorization granted by the user.
2. The technical permissions available.
3. The configuration of the integration.
4. The instructions and automations enabled.
5. The terms of the external provider.

The permissions and credentials of these connections are stored encrypted using AES-256-GCM.

The user may manage or revoke connections from the «Tu negocio → Apps conectadas» (Your business → Connected apps) section.

Disconnecting an app will prevent new access through the integration, but will not necessarily delete information that has already been processed or retained in accordance with the applicable retention rules.

### 5. Subprocessors and responsibility

When Atendel engages a provider to process personal data on behalf of a business, it will endeavor to establish contractual terms governing:

- Purpose of the processing.
- Scope of the services.
- Confidentiality.
- Security measures.
- Use restrictions.
- Assistance in the event of incidents.
- Retention and deletion.
- Involvement of other subprocessors.
- International transfers, where applicable.

The legal classification of each provider will depend on the activities it actually carries out. Some may act as processors or subprocessors and others as independent controllers with respect to their own services.

Atendel does not use advertising providers, ad networks or third-party tracking tools for advertising purposes. The site's typefaces are served from Atendel's own domain.

### 6. Location and international transfers

Some providers may store or process information outside Mexico.

The specific location may depend on the selected region, the architecture of the service, the contracted configuration and the distribution mechanisms used.

Atendel must verify the effective location and the applicable transfer conditions before making a specific statement about the country where certain information is stored or processed.

Where applicable, transfers will be made in accordance with the Privacy Notice and applicable law.

### 7. Updates to the list

Atendel may add, replace or stop using providers for technical, operational, security or commercial reasons.

The list will be updated when there are significant changes in the providers involved in the processing of information.

Where applicable, Atendel will communicate the changes through the dashboard or by email.

### 8. Inquiries

Users may request additional information about the providers and the processing of data through:

**Email:** infoatendel@gmail.com

**Address:** Monterrey, Nuevo León, México

**Designated controller:** Santiago Kuri Martinez

**Official domain:** good-kebab.vercel.app
`;
