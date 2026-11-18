/**
 * Lista de Proveedores y Subencargados, versión 1.0: traducción al italiano (vale la versión en español).
 */
export const TEXTO = `# Elenco dei Fornitori e Sub-responsabili
## ATENDEL

**Ultimo aggiornamento: 17 novembre 2026**

**Versione:** 1.0

### 1. Oggetto

Il presente documento individua i fornitori tecnologici e i servizi esterni che possono intervenire nel funzionamento di Atendel, nonché le funzioni generali che svolgono e le categorie di informazioni che potrebbero elaborare.

Il suo scopo è garantire trasparenza agli utenti e agevolare la comprensione delle operazioni di trattamento dei dati che possono essere svolte per fornire i servizi di Atendel.

Il presente documento integra l'Informativa Integrale sulla Privacy, l'Accordo sul Trattamento dei Dati Personali e i Termini e Condizioni.

### 2. Ambito

L'elenco comprende fornitori che possono intervenire in:

- Hosting e distribuzione della piattaforma.
- Database e archiviazione.
- Autenticazione e amministrazione degli account.
- Elaborazione di intelligenza artificiale.
- Collegamento con applicazioni esterne.
- Messaggistica e comunicazioni.
- Notifiche.
- Sicurezza e funzionamento tecnico.

La partecipazione di ciascun fornitore dipenderà dalle funzioni abilitate, dalla configurazione dell'utente e dall'architettura tecnica vigente.

L'inclusione di un fornitore nel presente elenco non significa necessariamente che tutti i dati di Atendel siano trasmessi a tale fornitore.

### 3. Fornitori individuati

**3.1. Supabase**

**Categoria:** Infrastruttura, database, archiviazione e autenticazione.

**Funzione all'interno di Atendel:**

Supabase fornisce i servizi infrastrutturali necessari per archiviare informazioni, amministrare registri, gestire file e agevolare i processi di autenticazione, compreso l'invio dei codici di accesso via e-mail.

**Categorie di informazioni che potrebbero essere elaborate:**

- Dati dell'account.
- Informazioni dell'attività.
- Preferenze e configurazioni.
- Conversazioni con Atendel.
- Documenti e file.
- Registri tecnici e di sicurezza.
- Informazioni necessarie per mantenere le funzioni della piattaforma.

**Ubicazione del trattamento:** Stati Uniti (regione orientale, Virginia), in base al progetto sottoscritto da Atendel.

**Condizioni applicabili:** Contratto, documentazione di sicurezza e politiche del fornitore.

**3.2. Vercel**

**Categoria:** Hosting e distribuzione di applicazioni.

**Funzione all'interno di Atendel:**

Vercel fornisce l'infrastruttura per pubblicare, distribuire e consegnare il sito web e il pannello di controllo di Atendel, e per eseguirne il server.

**Categorie di informazioni che potrebbero essere elaborate:**

- Richieste tecniche.
- Dati di connessione.
- Registri di funzionamento.
- Informazioni necessarie per consegnare le pagine e le risorse della piattaforma.

**Ubicazione del trattamento:** Stati Uniti (regione di Washington, D.C.) per il server di Atendel, con una rete globale di distribuzione per consegnare le pagine.

**Condizioni applicabili:** Contratto e politiche del fornitore.

**3.3. Anthropic**

**Categoria:** Intelligenza artificiale.

**Funzione all'interno di Atendel:**

Anthropic fornisce i modelli di intelligenza artificiale utilizzati per interpretare istruzioni, elaborare informazioni e generare i risultati richiesti dagli utenti, comprese le modalità «Rápido» («Rapido») e «Avanzado» («Avanzato») che l'utente può scegliere nella chat.

**Categorie di informazioni che potrebbero essere elaborate:**

- Istruzioni dell'utente.
- Messaggi e contenuti autorizzati.
- Informazioni aziendali necessarie per un'attività.
- Frammenti di documenti o file inviati al modello.
- Contesto necessario per generare risposte o eseguire processi.

**Ubicazione del trattamento:** Stati Uniti, secondo la documentazione del fornitore; Atendel confermerà la regione applicabile al servizio sottoscritto.

**Condizioni applicabili:** Accordi commerciali, condizioni di trattamento dei dati e documentazione del fornitore.

Atendel dovrà verificare le condizioni specifiche di conservazione, utilizzo dei dati, addestramento dei modelli e controlli di sicurezza applicabili al servizio sottoscritto. Una descrizione commerciale generica non sarà considerata sufficiente per affermare che determinate informazioni non vengano mai conservate o non siano mai utilizzate per l'addestramento.

**3.4. Meta / WhatsApp**

**Categoria:** Messaggistica e comunicazione.

**Funzione all'interno di Atendel:**

Meta e i servizi di WhatsApp intervengono nel collegamento, nella ricezione e nella trasmissione di messaggi quando l'utente collega il WhatsApp della propria attività, e negli avvisi che Atendel invia all'utente tramite WhatsApp quando questi stesso li attiva.

**Categorie di informazioni che potrebbero essere elaborate:**

- Identificativi di account.
- Numeri di telefono.
- Messaggi.
- Metadati di comunicazione.
- Informazioni necessarie per consegnare i messaggi e mantenere l'integrazione.

**Ubicazione del trattamento:** Secondo l'infrastruttura globale del fornitore.

**Condizioni applicabili:** Termini, politiche e documentazione applicabile di Meta e WhatsApp.

**3.5. Google**

**Categoria:** Autenticazione, servizi di notifica e integrazioni.

**Funzione all'interno di Atendel:**

Google interviene nell'accesso con un account Google, quando l'utente sceglie tale metodo; nella consegna delle notifiche su Chrome e Android; e nelle integrazioni di Google che l'utente colleghi.

**Categorie di informazioni che potrebbero essere elaborate:**

- Identificativi tecnici.
- Dati necessari per le notifiche.
- Informazioni autorizzate tramite integrazioni di Google.
- Dati di autenticazione o autorizzazione ove opportuno.

**Ubicazione del trattamento:** Secondo l'infrastruttura globale del fornitore.

**Condizioni applicabili:** Termini e politiche di Google e condizioni delle integrazioni utilizzate.

**3.6. Apple**

**Categoria:** Notifiche e servizi dei dispositivi.

**Funzione all'interno di Atendel:**

Apple interviene nella consegna delle notifiche su Safari, iPhone e Mac quando l'utente attiva le notifiche su tali dispositivi.

**Categorie di informazioni che potrebbero essere elaborate:**

- Identificativi tecnici del dispositivo.
- Token di notifica.
- Dati necessari per consegnare gli avvisi.

**Ubicazione del trattamento:** Secondo l'infrastruttura globale del fornitore.

**Condizioni applicabili:** Termini e politiche di Apple.

**3.7. Mozilla**

**Categoria:** Servizi di notifica del browser.

**Funzione all'interno di Atendel:**

Mozilla interviene nella consegna delle notifiche web quando l'utente le attiva su Firefox.

**Categorie di informazioni che potrebbero essere elaborate:**

- Identificativi di sottoscrizione.
- Informazioni tecniche del browser.
- Dati necessari per consegnare le notifiche.

**Ubicazione del trattamento:** Secondo l'infrastruttura globale del fornitore.

**Condizioni applicabili:** Termini e politiche di Mozilla.

**3.8. Microsoft**

**Categoria:** Servizi di notifica e integrazioni.

**Funzione all'interno di Atendel:**

Microsoft interviene nella consegna delle notifiche su Edge e Windows e nelle integrazioni di Microsoft che l'utente colleghi.

**Categorie di informazioni che potrebbero essere elaborate:**

- Identificativi tecnici.
- Informazioni necessarie per le notifiche.
- Dati autorizzati tramite integrazioni di Microsoft.

**Ubicazione del trattamento:** Secondo l'infrastruttura globale del fornitore.

**Condizioni applicabili:** Termini e politiche di Microsoft.

**3.9. Cloudflare**

**Categoria:** Sicurezza.

**Funzione all'interno di Atendel:**

Cloudflare Turnstile verifica che chi crea un account o effettua l'accesso sia una persona, quando tale protezione sia attivata.

**Categorie di informazioni che potrebbero essere elaborate:**

- Informazioni tecniche del browser.
- Dati necessari per la verifica.

**Ubicazione del trattamento:** Secondo l'infrastruttura globale del fornitore.

**Condizioni applicabili:** Termini e politiche di Cloudflare.

### 4. Applicazioni collegate dall'utente

Atendel consente il collegamento volontario di applicazioni esterne, tra cui:

- **Google:** Gmail, Google Calendar, Google Tasks, Google Drive, Google Sheets, Google Contacts, Google Business Profile e Google Forms.
- **Microsoft:** Outlook, Outlook Calendar, Microsoft To Do, OneDrive, Excel e Outlook Contacts.
- **Meta:** WhatsApp Business, Instagram, Messenger e Recensioni di Facebook.
- **Messaggistica e lavoro di squadra:** Telegram, Slack, Zoom, Notion, Dropbox, Airtable, Trello e Todoist.
- **Clienti e marketing:** HubSpot, Zoho CRM, Pipedrive, Kommo, Mailchimp e Typeform.
- **Agenda e appuntamenti:** Calendly, Acuity Scheduling, SimplyBook.me, Setmore, AgendaPro, Fresha, Booksy e Doctoralia.
- **Pagamenti e vendite:** Stripe, Mercado Pago, Mercado Libre, Shopify, Tiendanube, Clip, PayPal, Conekta, Openpay e Square.
- **Contabilità e fatturazione:** Zoho Books, Facturama, Alegra, Holded, QuickBooks e fatturazione CFDI.
- Altre applicazioni che vengano incorporate nella piattaforma.

La disponibilità di ciascuna applicazione può variare in base alla fase della piattaforma e alle approvazioni richieste da ciascun fornitore.

Tali applicazioni possono elaborare informazioni direttamente secondo i propri termini e condizioni.

Quando Atendel acceda a informazioni tramite un'integrazione, la portata dell'accesso dipenderà da:

1. L'autorizzazione concessa dall'utente.
2. I permessi tecnici disponibili.
3. La configurazione dell'integrazione.
4. Le istruzioni e le automazioni abilitate.
5. Le condizioni del fornitore esterno.

I permessi e le credenziali di tali collegamenti sono conservati cifrati mediante AES-256-GCM.

L'utente potrà amministrare o revocare i collegamenti dalla sezione «Tu negocio → Apps conectadas» («La tua attività → App collegate»).

Lo scollegamento di un'applicazione impedirà nuovi accessi tramite l'integrazione, ma non eliminerà necessariamente le informazioni già elaborate o conservate in conformità alle regole di conservazione applicabili.

### 5. Sub-responsabili e responsabilità

Quando Atendel incarichi un fornitore di elaborare dati personali per conto di un'attività, si adopererà per stabilire condizioni contrattuali che disciplinino:

- Finalità del trattamento.
- Portata dei servizi.
- Riservatezza.
- Misure di sicurezza.
- Restrizioni d'uso.
- Assistenza in caso di incidenti.
- Conservazione e cancellazione.
- Partecipazione di altri sub-responsabili.
- Trasferimenti internazionali, ove applicabili.

La qualificazione giuridica di ciascun fornitore dipenderà dalle attività che effettivamente svolga. Alcuni potranno agire come responsabili o sub-responsabili del trattamento e altri come titolari autonomi rispetto ai propri servizi.

Atendel non utilizza fornitori pubblicitari, reti pubblicitarie né strumenti di tracciamento di terzi a fini pubblicitari. I caratteri tipografici del sito sono serviti dal dominio stesso di Atendel.

### 6. Ubicazione e trasferimenti internazionali

Alcuni fornitori possono archiviare o elaborare informazioni al di fuori del Messico.

L'ubicazione concreta può dipendere dalla regione selezionata, dall'architettura del servizio, dalla configurazione sottoscritta e dai meccanismi di distribuzione utilizzati.

Atendel dovrà verificare l'ubicazione effettiva e le condizioni di trasferimento applicabili prima di presentare un'affermazione specifica sul paese in cui determinate informazioni sono archiviate o elaborate.

Ove opportuno, i trasferimenti saranno effettuati in conformità all'Informativa sulla Privacy e alla normativa applicabile.

### 7. Aggiornamenti dell'elenco

Atendel potrà incorporare, sostituire o cessare di utilizzare fornitori per motivi tecnici, operativi, di sicurezza o commerciali.

L'elenco sarà aggiornato quando si verifichino modifiche rilevanti nei fornitori che intervengono nel trattamento delle informazioni.

Ove opportuno, Atendel comunicherà le modifiche tramite il pannello o via e-mail.

### 8. Richieste

Gli utenti potranno richiedere informazioni aggiuntive sui fornitori e sul trattamento dei dati tramite:

**E-mail:** infoatendel@gmail.com

**Sede:** Monterrey, Nuevo León, México

**Responsabile informato:** Santiago Kuri Martinez

**Dominio ufficiale:** good-kebab.vercel.app
`;
