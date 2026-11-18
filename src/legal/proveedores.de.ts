/**
 * Lista de Proveedores y Subencargados: traducción al alemán (vale la versión en español).
 */
export const TEXTO = `# Liste der Dienstleister und Unterauftragsverarbeiter
## ATENDEL

**Zuletzt aktualisiert: 18. November 2026**

**Version:** 1.0

### 1. Gegenstand

Dieses Dokument benennt die technologischen Dienstleister und externen Dienste, die am Betrieb von Atendel beteiligt sein können, sowie die allgemeinen Funktionen, die sie wahrnehmen, und die Kategorien von Informationen, die sie verarbeiten könnten.

Sein Zweck ist es, den Nutzern Transparenz zu verschaffen und das Verständnis der Datenverarbeitungsvorgänge zu erleichtern, die zur Erbringung der Dienste von Atendel durchgeführt werden können.

Dieses Dokument ergänzt die Ausführliche Datenschutzerklärung, die Vereinbarung zur Verarbeitung personenbezogener Daten und die Allgemeinen Geschäftsbedingungen.

### 2. Anwendungsbereich

Die Liste umfasst Dienstleister, die beteiligt sein können an:

- Hosting und Bereitstellung der Plattform.
- Datenbanken und Speicherung.
- Authentifizierung und Kontoverwaltung.
- Verarbeitung durch künstliche Intelligenz.
- Anbindung an externe Anwendungen.
- Messaging und Kommunikation.
- Benachrichtigungen.
- Sicherheit und technischem Betrieb.

Die Beteiligung der einzelnen Dienstleister hängt von den aktivierten Funktionen, der Konfiguration des Nutzers und der geltenden technischen Architektur ab.

Die Aufnahme eines Dienstleisters in diese Liste bedeutet nicht zwingend, dass sämtliche Daten von Atendel an diesen Dienstleister übermittelt werden.

### 3. Identifizierte Dienstleister

**3.1. Supabase**

**Kategorie:** Infrastruktur, Datenbank, Speicherung und Authentifizierung.

**Funktion innerhalb von Atendel:**

Supabase stellt die Infrastrukturdienste bereit, die erforderlich sind, um Informationen zu speichern, Datensätze zu verwalten, Dateien zu handhaben und die Authentifizierungsprozesse zu erleichtern, einschließlich des Versands der Zugangscodes per E-Mail.

**Kategorien von Informationen, die verarbeitet werden könnten:**

- Kontodaten.
- Informationen des Unternehmens.
- Präferenzen und Einstellungen.
- Unterhaltungen mit Atendel.
- Dokumente und Dateien.
- Technische und Sicherheitsprotokolle.
- Informationen, die zur Aufrechterhaltung der Funktionen der Plattform erforderlich sind.

**Ort der Verarbeitung:** Vereinigte Staaten (Region Osten, Virginia), gemäß dem von Atendel abgeschlossenen Projekt.

**Anwendbare Bedingungen:** Vertrag, Sicherheitsdokumentation und Richtlinien des Dienstleisters.

**3.2. Vercel**

**Kategorie:** Hosting und Bereitstellung von Anwendungen.

**Funktion innerhalb von Atendel:**

Vercel stellt die Infrastruktur bereit, um die Website und das Bedienfeld von Atendel zu veröffentlichen, zu verteilen und auszuliefern sowie um dessen Server auszuführen.

**Kategorien von Informationen, die verarbeitet werden könnten:**

- Technische Anfragen.
- Verbindungsdaten.
- Betriebsprotokolle.
- Informationen, die zur Auslieferung von Seiten und Ressourcen der Plattform erforderlich sind.

**Ort der Verarbeitung:** Vereinigte Staaten (Region Washington, D.C.) für den Server von Atendel, mit einem globalen Verteilnetzwerk zur Auslieferung der Seiten.

**Anwendbare Bedingungen:** Vertrag und Richtlinien des Dienstleisters.

**3.3. Anthropic**

**Kategorie:** Künstliche Intelligenz.

**Funktion innerhalb von Atendel:**

Anthropic stellt die Modelle künstlicher Intelligenz bereit, die eingesetzt werden, um Anweisungen zu interpretieren, Informationen zu verarbeiten und die von den Nutzern angeforderten Ergebnisse zu erzeugen, einschließlich der Modi «Rápido» («Schnell») und «Avanzado» («Erweitert»), die der Nutzer im Chat wählen kann.

**Kategorien von Informationen, die verarbeitet werden könnten:**

- Anweisungen des Nutzers.
- Nachrichten und autorisierte Inhalte.
- Geschäftliche Informationen, die für eine Aufgabe erforderlich sind.
- Auszüge aus Dokumenten oder Dateien, die an das Modell gesendet werden.
- Kontext, der zur Erzeugung von Antworten oder zur Ausführung von Prozessen erforderlich ist.

**Ort der Verarbeitung:** Vereinigte Staaten, nach der Dokumentation des Dienstleisters; Atendel wird die für den abgeschlossenen Dienst geltende Region bestätigen.

**Anwendbare Bedingungen:** Geschäftsvereinbarungen, Bedingungen zur Datenverarbeitung und Dokumentation des Dienstleisters.

Atendel muss die besonderen Bedingungen für Aufbewahrung, Datenverwendung, Modelltraining und Sicherheitskontrollen prüfen, die für den abgeschlossenen Dienst gelten. Eine allgemeine kommerzielle Beschreibung gilt nicht als ausreichend, um zu behaupten, dass bestimmte Informationen niemals aufbewahrt oder niemals zum Training verwendet werden.

**3.4. Meta / WhatsApp**

**Kategorie:** Messaging und Kommunikation.

**Funktion innerhalb von Atendel:**

Meta und die Dienste von WhatsApp wirken bei der Anbindung, beim Empfang und bei der Übermittlung von Nachrichten mit, wenn der Nutzer das WhatsApp seines Unternehmens verbindet, sowie bei den Benachrichtigungen, die Atendel dem Nutzer per WhatsApp sendet, wenn er diese selbst aktiviert.

**Kategorien von Informationen, die verarbeitet werden könnten:**

- Kontokennungen.
- Telefonnummern.
- Nachrichten.
- Kommunikationsmetadaten.
- Informationen, die zur Zustellung von Nachrichten und zur Aufrechterhaltung der Integration erforderlich sind.

**Ort der Verarbeitung:** Nach der globalen Infrastruktur des Dienstleisters.

**Anwendbare Bedingungen:** Geltende Bedingungen, Richtlinien und Dokumentation von Meta und WhatsApp.

**3.5. Google**

**Kategorie:** Authentifizierung, Benachrichtigungsdienste und Integrationen.

**Funktion innerhalb von Atendel:**

Google wirkt bei der Anmeldung mit einem Google-Konto mit, wenn der Nutzer diese Methode wählt; bei der Zustellung von Benachrichtigungen in Chrome und Android; und bei den Google-Integrationen, die der Nutzer verbindet.

**Kategorien von Informationen, die verarbeitet werden könnten:**

- Technische Kennungen.
- Für Benachrichtigungen erforderliche Daten.
- Über Google-Integrationen autorisierte Informationen.
- Authentifizierungs- oder Autorisierungsdaten, soweit einschlägig.

**Ort der Verarbeitung:** Nach der globalen Infrastruktur des Dienstleisters.

**Anwendbare Bedingungen:** Bedingungen und Richtlinien von Google sowie Bedingungen der genutzten Integrationen.

**3.6. Apple**

**Kategorie:** Benachrichtigungen und Gerätedienste.

**Funktion innerhalb von Atendel:**

Apple wirkt bei der Zustellung von Benachrichtigungen in Safari, auf dem iPhone und auf dem Mac mit, wenn der Nutzer die Benachrichtigungen auf diesen Geräten aktiviert.

**Kategorien von Informationen, die verarbeitet werden könnten:**

- Technische Gerätekennungen.
- Benachrichtigungs-Token.
- Daten, die zur Zustellung von Hinweisen erforderlich sind.

**Ort der Verarbeitung:** Nach der globalen Infrastruktur des Dienstleisters.

**Anwendbare Bedingungen:** Bedingungen und Richtlinien von Apple.

**3.7. Mozilla**

**Kategorie:** Benachrichtigungsdienste des Browsers.

**Funktion innerhalb von Atendel:**

Mozilla wirkt bei der Zustellung von Web-Benachrichtigungen mit, wenn der Nutzer sie in Firefox aktiviert.

**Kategorien von Informationen, die verarbeitet werden könnten:**

- Abonnementkennungen.
- Technische Informationen des Browsers.
- Daten, die zur Zustellung von Benachrichtigungen erforderlich sind.

**Ort der Verarbeitung:** Nach der globalen Infrastruktur des Dienstleisters.

**Anwendbare Bedingungen:** Bedingungen und Richtlinien von Mozilla.

**3.8. Microsoft**

**Kategorie:** Benachrichtigungsdienste und Integrationen.

**Funktion innerhalb von Atendel:**

Microsoft wirkt bei der Zustellung von Benachrichtigungen in Edge und Windows sowie bei den Microsoft-Integrationen mit, die der Nutzer verbindet.

**Kategorien von Informationen, die verarbeitet werden könnten:**

- Technische Kennungen.
- Für Benachrichtigungen erforderliche Informationen.
- Über Microsoft-Integrationen autorisierte Daten.

**Ort der Verarbeitung:** Nach der globalen Infrastruktur des Dienstleisters.

**Anwendbare Bedingungen:** Bedingungen und Richtlinien von Microsoft.

**3.9. Cloudflare**

**Kategorie:** Sicherheit.

**Funktion innerhalb von Atendel:**

Cloudflare Turnstile überprüft, dass es sich bei der Person, die ein Konto erstellt oder sich anmeldet, um einen Menschen handelt, wenn dieser Schutz aktiviert ist.

**Kategorien von Informationen, die verarbeitet werden könnten:**

- Technische Informationen des Browsers.
- Für die Überprüfung erforderliche Daten.

**Ort der Verarbeitung:** Nach der globalen Infrastruktur des Dienstleisters.

**Anwendbare Bedingungen:** Bedingungen und Richtlinien von Cloudflare.

**3.10. ElevenLabs**

**Kategorie:** Sprache.

**Funktion innerhalb von Atendel:**

ElevenLabs wandelt das, was der Nutzer im Gesprächsmodus sagt, in Text um und wandelt die Antworten von Atendel in Sprache um, nur wenn der Nutzer den Gesprächsmodus öffnet. Atendel speichert das Audio nicht; das Gespräch bleibt schriftlich im Chat.

**Kategorien von Informationen, die verarbeitet werden können:**

- Sprachaufnahmen des Nutzers während des Gesprächsmodus.
- Der Text der Antworten, die laut gesprochen werden.

**Ort der Verarbeitung:** Gemäß der Infrastruktur des Anbieters; Atendel bestätigt die für den vertraglich vereinbarten Dienst geltende Region.

**Geltende Bedingungen:** Bedingungen, Datenschutzrichtlinie und Datenverarbeitungsbedingungen von ElevenLabs.

### 4. Vom Nutzer verbundene Anwendungen

Atendel ermöglicht die freiwillige Verbindung externer Anwendungen, einschließlich:

- **Google:** Gmail, Google Calendar, Google Aufgaben, Google Drive, Google Sheets, Google Kontakte, Google Unternehmensprofil und Google Forms.
- **Microsoft:** Outlook, Outlook-Kalender, Microsoft To Do, OneDrive, Excel und Outlook-Kontakte.
- **Meta:** WhatsApp Business, Instagram, Messenger und Facebook-Bewertungen.
- **Messaging und Teamarbeit:** Telegram, Slack, Zoom, Notion, Dropbox, Airtable, Trello und Todoist.
- **Kunden und Marketing:** HubSpot, Zoho CRM, Pipedrive, Kommo, Mailchimp und Typeform.
- **Kalender und Termine:** Calendly, Acuity Scheduling, SimplyBook.me, Setmore, AgendaPro, Fresha, Booksy und Doctoralia.
- **Zahlungen und Verkäufe:** Stripe, Mercado Pago, Mercado Libre, Shopify, Tiendanube, Clip, PayPal, Conekta, Openpay und Square.
- **Buchhaltung und Rechnungsstellung:** Zoho Books, Facturama, Alegra, Holded, QuickBooks und CFDI-Rechnungsstellung.
- Weitere Anwendungen, die in die Plattform aufgenommen werden.

Die Verfügbarkeit der einzelnen Anwendungen kann je nach Entwicklungsstand der Plattform und den von den einzelnen Dienstleistern verlangten Freigaben variieren.

Diese Anwendungen können Informationen unmittelbar nach ihren eigenen Bedingungen verarbeiten.

Greift Atendel über eine Integration auf Informationen zu, hängt der Umfang des Zugriffs ab von:

1. Der vom Nutzer erteilten Autorisierung.
2. Den verfügbaren technischen Berechtigungen.
3. Der Konfiguration der Integration.
4. Den aktivierten Anweisungen und Automatisierungen.
5. Den Bedingungen des externen Dienstleisters.

Die Berechtigungen und Zugangsdaten dieser Verbindungen werden mittels AES-256-GCM verschlüsselt gespeichert.

Der Nutzer kann Verbindungen im Bereich «Tu negocio → Apps conectadas» («Dein Unternehmen → Verbundene Apps») verwalten oder widerrufen.

Die Trennung einer Anwendung verhindert neue Zugriffe über die Integration, löscht aber nicht zwingend Informationen, die bereits verarbeitet oder nach den geltenden Aufbewahrungsregeln aufbewahrt wurden.

### 5. Unterauftragsverarbeiter und Verantwortung

Beauftragt Atendel einen Dienstleister mit der Verarbeitung personenbezogener Daten im Auftrag eines Unternehmens, wird es sich bemühen, vertragliche Bedingungen festzulegen, die Folgendes regeln:

- Zweck der Verarbeitung.
- Umfang der Dienste.
- Vertraulichkeit.
- Sicherheitsmaßnahmen.
- Verwendungsbeschränkungen.
- Unterstützung bei Vorfällen.
- Aufbewahrung und Löschung.
- Beteiligung weiterer Unterauftragsverarbeiter.
- Internationale Übermittlungen, soweit einschlägig.

Die rechtliche Einordnung der einzelnen Dienstleister hängt von den Tätigkeiten ab, die sie tatsächlich ausüben. Einige können als Auftragsverarbeiter oder Unterauftragsverarbeiter handeln, andere hinsichtlich ihrer eigenen Dienste als eigenständige Verantwortliche.

Atendel setzt keine Werbedienstleister, Werbenetzwerke oder Tracking-Werkzeuge Dritter zu Werbezwecken ein. Die Schriftarten der Website werden von der eigenen Domain von Atendel ausgeliefert.

### 6. Standort und internationale Übermittlungen

Einige Dienstleister können Informationen außerhalb Mexikos speichern oder verarbeiten.

Der konkrete Standort kann von der gewählten Region, der Architektur des Dienstes, der abgeschlossenen Konfiguration und den eingesetzten Verteilmechanismen abhängen.

Atendel muss den tatsächlichen Standort und die geltenden Übermittlungsbedingungen prüfen, bevor es eine konkrete Aussage über das Land trifft, in dem bestimmte Informationen gespeichert oder verarbeitet werden.

Soweit angezeigt, erfolgen die Übermittlungen gemäß der Datenschutzerklärung und dem anwendbaren Recht.

### 7. Aktualisierungen der Liste

Atendel kann Dienstleister aus technischen, betrieblichen, sicherheitsbezogenen oder geschäftlichen Gründen aufnehmen, ersetzen oder nicht mehr einsetzen.

Die Liste wird aktualisiert, wenn sich bei den an der Verarbeitung von Informationen beteiligten Dienstleistern wesentliche Änderungen ergeben.

Soweit angezeigt, teilt Atendel die Änderungen über das Panel oder per E-Mail mit.

### 8. Anfragen

Die Nutzer können zusätzliche Informationen über die Dienstleister und die Datenverarbeitung anfordern über:

**E-Mail:** infoatendel@gmail.com

**Anschrift:** Monterrey, Nuevo León, México

**Benannter Verantwortlicher:** Santiago Kuri Martinez

**Offizielle Domain:** good-kebab.vercel.app
`;
