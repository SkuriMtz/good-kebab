/**
 * Acuerdo de Nivel de Servicio (SLA), versión 1.0: traducción al italiano (vale la versión en español).
 */
export const TEXTO = `# Accordo sul Livello di Servizio
## ATENDEL

**Ultimo aggiornamento: 17 novembre 2026**

*Service Level Agreement (SLA)*

**Versione:** 1.0

### 1. Oggetto

Il presente Accordo sul Livello di Servizio (di seguito, lo «SLA») stabilisce le condizioni generali in base alle quali Atendel fornisce, mantiene e assiste la propria piattaforma di assistenza aziendale.

Il presente documento descrive i criteri di disponibilità, manutenzione, gestione degli incidenti, comunicazione delle interruzioni e le responsabilità relative alla continuità del servizio.

Il suo scopo è stabilire aspettative chiare e trasparenti per gli utenti, senza creare impegni di disponibilità o tempi di risposta che non siano stati espressamente definiti e sostenuti da Atendel.

### 2. Ambito

Il presente SLA si applica ai servizi di Atendel disponibili tramite:

- Sito web e pannello di controllo.
- Sistema di autenticazione.
- Funzioni di intelligenza artificiale.
- Gestione delle informazioni dell'attività.
- Automazioni abilitate.
- Collegamenti con applicazioni esterne.
- Funzioni di notifica.
- Altre funzionalità che Atendel incorpori nella piattaforma.

Le condizioni specifiche potranno variare in base al piano sottoscritto, alle funzionalità abilitate e agli accordi particolari conclusi con determinati clienti.

### 3. Definizioni

**Disponibilità:** capacità di accedere a una funzione di Atendel e di utilizzarla conformemente alle sue caratteristiche essenziali.

**Incidente:** evento tecnico od operativo che pregiudica, limita o impedisce il normale funzionamento di una funzione.

**Manutenzione programmata:** intervento tecnico previamente pianificato per aggiornare, correggere, ottimizzare o proteggere la piattaforma.

**Manutenzione di emergenza:** intervento necessario per correggere un guasto critico, far fronte a un rischio di sicurezza o evitare danni maggiori.

**Fornitore esterno:** terzo la cui infrastruttura o il cui servizio sia necessario per il funzionamento di una parte di Atendel.

**Tempo di prima risposta:** periodo tra la ricezione di una segnalazione valida e la prima comunicazione di supporto relativa a tale segnalazione. Non equivale necessariamente al tempo di risoluzione.

**Ripristino:** recupero della funzionalità interessata, anche se la causa principale è ancora in fase di indagine.

### 4. Principi di erogazione del servizio

Atendel si adopererà per gestire la propria piattaforma secondo criteri di continuità, sicurezza, manutenzione e miglioramento progressivo.

A tal fine potrà svolgere attività quali:

- Supervisione tecnica dei servizi.
- Correzione di errori.
- Aggiornamento di componenti.
- Manutenzione dell'infrastruttura.
- Gestione degli incidenti.
- Verifica delle integrazioni.
- Applicazione di misure di sicurezza.
- Ottimizzazione dei processi interni.

Atendel compirà sforzi ragionevoli per ridurre le interruzioni e ripristinare le funzioni interessate quando si verifichino guasti.

### 5. Disponibilità

Atendel non stabilisce attualmente una percentuale contrattuale garantita di disponibilità.

La piattaforma può subire interruzioni, degrado delle prestazioni o indisponibilità temporanea per cause proprie o esterne.

Tra tali cause rientrano:

1. Guasti dell'infrastruttura.
2. Errori del software.
3. Aggiornamenti e manutenzione.
4. Problemi di connettività.
5. Interruzioni dei fornitori.
6. Restrizioni delle applicazioni collegate.
7. Incidenti di sicurezza.
8. Eventi di forza maggiore.
9. Cambiamenti tecnici o normativi.
10. Altre circostanze al di fuori del ragionevole controllo di Atendel.

L'assenza di una percentuale garantita non elimina gli obblighi legali o contrattuali che spettino ad Atendel.

**5.1. Misurazione della disponibilità**

Se Atendel implementa un impegno formale di disponibilità, dovrà previamente stabilire:

- Il periodo di misurazione.
- Le funzioni incluse.
- Il metodo di calcolo.
- Le fonti di monitoraggio.
- Le esclusioni giustificate.
- La procedura per verificare le interruzioni.
- Le conseguenze dell'inadempimento.

Fino alla pubblicazione di tali criteri, qualsiasi indicatore interno avrà carattere operativo e non costituirà una garanzia contrattuale.

### 6. Manutenzione

Atendel potrà eseguire manutenzione preventiva, correttiva, evolutiva e di sicurezza.

**6.1. Manutenzione programmata**

Quando sia possibile, Atendel comunicherà con anticipo gli interventi che possano incidere in modo rilevante sull'accesso o sul funzionamento del servizio.

La comunicazione potrà includere:

- Data prevista.
- Orario stimato.
- Funzioni interessate.
- Durata approssimativa.
- Raccomandazioni per gli utenti.

**6.2. Manutenzione di emergenza**

Atendel potrà eseguire interventi immediati senza preavviso quando siano necessari per:

- Proteggere le informazioni.
- Correggere vulnerabilità.
- Evitare danni alla piattaforma.
- Ripristinare funzioni critiche.
- Rispondere a incidenti di sicurezza.
- Far fronte a gravi guasti dell'infrastruttura.

In tali casi, Atendel si adopererà per informare gli utenti non appena ciò risulti ragionevolmente possibile.

### 7. Classificazione degli incidenti

Atendel potrà classificare le segnalazioni in base al loro impatto e alla loro portata.

**7.1. Priorità critica**

Incidenti che producano un'interruzione generale o un rischio significativo per la sicurezza, l'integrità o la riservatezza delle informazioni.

Esempi:

- Indisponibilità generale della piattaforma.
- Incidente di sicurezza con impatto ampio.
- Perdita di accesso a funzioni essenziali per una parte sostanziale degli utenti.

**7.2. Priorità alta**

Incidenti che impediscano di utilizzare una funzione essenziale per un gruppo di utenti o incidano in modo significativo sull'operatività di un'attività.

Esempi:

- Guasto generale di un'integrazione essenziale.
- Impossibilità persistente di accedere a una funzione principale.
- Errore che impedisca di eseguire un'automazione critica.

**7.3. Priorità media**

Incidenti che interessino una funzione specifica, ma consentano di continuare a utilizzare altre parti della piattaforma.

Esempi:

- Guasti intermittenti in un'integrazione.
- Errori in una funzione secondaria.
- Problemi di visualizzazione che ostacolino parzialmente l'uso.

**7.4. Priorità bassa**

Richieste, errori minori o istanze che non impediscano l'uso principale del servizio.

Esempi:

- Dubbi sulla configurazione.
- Richieste di orientamento.
- Errori visivi minori.
- Suggerimenti di miglioramento.

La classificazione definitiva sarà determinata da Atendel sulla base delle informazioni disponibili.

### 8. Canali di supporto

Gli utenti potranno contattare Atendel tramite:

**E-mail:** infoatendel@gmail.com

**Pannello di controllo:** canale di supporto, quando sia abilitato.

**Altri canali:** quelli che Atendel pubblichi ufficialmente.

L'utente dovrà utilizzare i canali indicati e fornire informazioni sufficienti a individuare il problema.

Non dovrà inviare password, codici di autenticazione, credenziali complete né informazioni sensibili non necessarie.

### 9. Tempi di risposta e di risoluzione

Atendel non stabilisce attualmente tempi contrattuali garantiti di prima risposta o di risoluzione.

Quando Atendel pubblichi tempi di risposta, questi dovranno distinguere tra:

- Conferma di ricezione.
- Prima risposta.
- Diagnosi iniziale.
- Ripristino temporaneo.
- Soluzione definitiva.

Una stima di risoluzione non costituisce una garanzia quando l'incidente dipenda da terzi o da circostanze che Atendel non controlla.

### 10. Procedura di gestione

Una volta ricevuta una segnalazione, Atendel potrà seguire le seguenti fasi:

**Fase 1. Ricezione:** registrazione della richiesta e delle informazioni fornite.

**Fase 2. Classificazione:** valutazione preliminare dell'impatto e assegnazione della priorità.

**Fase 3. Diagnosi:** individuazione della funzione interessata, della portata e delle possibili cause.

**Fase 4. Contenimento:** applicazione di misure temporanee per limitare l'impatto, ove opportuno.

**Fase 5. Correzione:** implementazione di una soluzione o di un'alternativa ragionevole.

**Fase 6. Verifica:** controllo che la funzione interessata sia stata ripristinata.

**Fase 7. Chiusura:** comunicazione dell'esito e chiusura della segnalazione, fatte salve successive verifiche.

### 11. Responsabilità dell'utente

L'utente dovrà:

- Mantenere aggiornati i propri dati di contatto.
- Proteggere le proprie credenziali e i propri metodi di autenticazione.
- Utilizzare browser e dispositivi compatibili.
- Mantenere attive le autorizzazioni necessarie per le proprie applicazioni collegate.
- Segnalare tempestivamente i guasti.
- Fornire dati sufficienti per indagare i problemi.
- Non modificare né interferire con i meccanismi tecnici di sicurezza.
- Mantenere backup propri delle informazioni che consideri essenziali per la propria operatività.

L'utente riconosce che Atendel non sostituisce le proprie procedure di continuità operativa né i propri obblighi di backup.

### 12. Dipendenza da fornitori esterni

Determinate funzioni dipendono da servizi esterni, tra cui fornitori di hosting, database, autenticazione, intelligenza artificiale, messaggistica e notifiche.

Un'interruzione di tali servizi può incidere sulle funzioni di Atendel anche se la piattaforma principale continua a essere operativa.

Atendel si adopererà per:

- Individuare il fornitore coinvolto.
- Valutare l'impatto.
- Comunicare le interruzioni rilevanti quando possibile.
- Applicare alternative tecniche ragionevoli.
- Ripristinare l'integrazione quando il fornitore lo consenta.

Atendel non controlla i tempi di recupero dei fornitori indipendenti.

### 13. Limiti dello SLA

Il presente SLA non garantisce che:

- La piattaforma sia disponibile in ogni momento.
- Tutti gli incidenti possano essere risolti immediatamente.
- Le applicazioni esterne mantengano i propri servizi senza interruzioni.
- I risultati dell'intelligenza artificiale siano sempre corretti.
- Le integrazioni restino disponibili se un fornitore modifica le proprie condizioni.
- Tutti i dispositivi, browser o reti siano compatibili.

Le limitazioni del presente documento non intendono escludere responsabilità che per legge non possano essere limitate.

### 14. Crediti e compensazioni

Attualmente Atendel non stabilisce crediti di servizio automatici né compensazioni basate su percentuali di disponibilità.

Se vengono offerti piani aziendali con impegni specifici, questi dovranno essere stabiliti in un allegato contrattuale o nelle condizioni particolari del piano.

Qualsiasi meccanismo di compensazione dovrà indicare chiaramente la propria portata, i requisiti e la procedura di richiesta, senza pregiudicare i diritti legali dell'utente.

### 15. Modifiche al servizio

Atendel potrà modificare le proprie funzioni, l'infrastruttura, i fornitori e le procedure di supporto per motivi tecnici, operativi, commerciali, di sicurezza o legali.

Quando una modifica incida in modo sostanziale sul servizio sottoscritto, Atendel potrà comunicarla tramite il pannello o via e-mail in conformità ai Termini e Condizioni.

### 16. Durata e contatti

Il presente SLA rimarrà in vigore finché sia pubblicato e non sia sostituito da una versione successiva.

Per richieste o segnalazioni:

**E-mail:** infoatendel@gmail.com

**Sede:** Monterrey, Nuevo León, México

**Responsabile informato:** Santiago Kuri Martinez

**Dominio ufficiale:** good-kebab.vercel.app
`;
