import type { IdAgente } from "@/lib/agentes";
import type { CategoriaApp, IdApp } from "@/lib/nucleo-tipos";

/**
 * Los textos cortos del inicio («/»). Tono: formal pero cercano, corto y fácil para cualquiera
 * (una idea por frase; nadie lee párrafos largos). Cada idea va en una sola sección. Son de
 * Atendel: ejemplos de cosas que sí hace (como los de /pruebalo), sin clientes, cifras ni
 * opiniones inventadas. En los 7 idiomas del sitio.
 */

export type Caso = { agente: IdAgente; corto: string; titulo: string; texto: string; pide: string; responde: string };

type Contenido = {
  /** La portada: qué es Atendel (etiqueta) y qué hace (texto). */
  portadaEtiqueta: string;
  portada: string;
  /** Las escenas de siempre, en corto. */
  decisionesTexto: string;
  caosTextos: string[];
  focoTextos: string[];
  globoTexto: string;
  equipoSub: string;
  planesTexto: string;
  cuandoTexto: string;
  garantias: { titulo: string; texto: string }[];
  casos: { probar: string; lista: Caso[] };
  privacidad: { permisosTitulo: string; permisos: { id: IdApp; que: string; activo: boolean }[]; mas: string };
  /** Las apps: qué es, cómo trabaja en ellas y un pedido de ejemplo por tipo de app. */
  apps: { etiqueta: string; titulo: string; texto: (n: number) => string; que: string; usa: string; ejemplos: Record<CategoriaApp, string> };
};

const ES: Contenido = {
  portadaEtiqueta: "Inteligencia artificial para negocios",
  portada: "Atendel es un asistente que responde WhatsApp, contesta correos y agenda citas.",
  decisionesTexto: "Está pendiente de tu negocio todo el día y te avisa cuando algo requiere tu atención.",
  caosTextos: ["Así es tu día hoy: mensajes, correos, citas y pendientes por todos lados.", "Respondes tarde, se pasa una cita y un cliente ya no regresa.", "Y el papeleo se acumula para la noche."],
  focoTextos: ["Pides todo en un mismo chat. Atendel reparte el trabajo entre su equipo y te confirma cuando está listo.", "Aprende cómo trabajas para resolver como tú lo harías."],
  globoTexto: "Entra con tu correo, sin contraseña, desde tu celular o computadora.",
  equipoSub: "Cuatro agentes, cada uno con su especialidad.",
  planesTexto: "Empieza gratis con todo el equipo.",
  cuandoTexto: "Free ya está disponible. One y Max se abrirán por etapas.",
  garantias: [
    { titulo: "Solo tu cuenta", texto: "Tu información solo la ve tu negocio." },
    { titulo: "Con tu permiso", texto: "Tú decides qué hace solo y qué te consulta antes. Los pagos siempre esperan tu aprobación." },
    { titulo: "Cifrado", texto: "Toda tu información viaja cifrada." },
  ],
  casos: {
    probar: "Pruébalo",
    lista: [
      { agente: "lola", corto: "Atención de noche", titulo: "Atiende aunque no estés", texto: "Aura responde tu WhatsApp con tus precios y agenda las citas.", pide: "Hola, ¿cuánto cuesta la limpieza facial? ¿Tienen lugar el jueves?", responde: "¡Hola! Cuesta $650. El jueves hay lugar a las 11:00 o a las 17:00. ¿Cuál prefieres?" },
      { agente: "clara", corto: "Correo urgente", titulo: "Lo urgente, primero", texto: "Altair revisa tu correo y te prepara las respuestas.", pide: "¿Qué es urgente en mi correo?", responde: "Dos cosas: una factura vence mañana y Andrea quiere cambiar su cita. Las respuestas están listas." },
      { agente: "victor", corto: "Reseñas", titulo: "Más recomendaciones", texto: "Rigel pide una reseña a tus clientes después de su visita.", pide: "Pide reseña a los clientes de hoy", responde: "Preparé un mensaje para cada uno. ¿Los envío?" },
      { agente: "iris", corto: "Reporte del mes", titulo: "Tus números, claros", texto: "Mira prepara tus reportes y documentos para que los revises.", pide: "Prepara el reporte de ventas del mes", responde: "Listo: ventas por semana y por servicio, comparadas con el mes pasado." },
      { agente: "lola", corto: "Citas encimadas", titulo: "Sin citas encimadas", texto: "Revisa tu agenda antes de agendar y propone otro horario si hace falta.", pide: "Tengo dos citas al mismo tiempo el viernes", responde: "Le propuse a Luis el viernes a las 18:00. Te aviso cuando confirme." },
      { agente: "victor", corto: "Recuperar clientes", titulo: "Que regresen", texto: "Encuentra a quien no ha vuelto y le escribe, con tu aprobación.", pide: "¿Quién no ha vuelto en 3 meses?", responde: "Encontré a quienes no han vuelto y preparé un mensaje para cada uno. ¿Los revisamos?" },
    ],
  },
  privacidad: {
    permisosTitulo: "Tus permisos",
    permisos: [
      { id: "whatsapp_business", que: "Responder a tus clientes", activo: true },
      { id: "gmail", que: "Leer y resumir correos", activo: true },
      { id: "google_calendar", que: "Crear y mover citas", activo: false },
    ],
    mas: "Cómo cuidamos tus datos",
  },
  apps: {
    etiqueta: "Tus apps",
    titulo: "Funciona con las apps que ya usas",
    texto: (n) => `${n} apps disponibles. Conecta tu cuenta y Atendel trabaja en ellas, siempre con tu permiso.`,
    que: "Qué hace",
    usa: "Quién la usa",
    ejemplos: {
      correo: "¿Qué correos necesitan respuesta hoy?",
      mensajes: "¿Qué mensajes tengo sin responder?",
      agenda: "¿Qué tengo mañana?",
      reservas: "¿Quién tiene cita hoy?",
      documentos: "Resume el archivo de precios",
      clientes: "¿Quién no ha vuelto en 3 meses?",
      resenas: "¿Qué reseñas nuevas tengo?",
      pagos: "¿Cuánto vendí esta semana?",
      contabilidad: "¿Qué facturas tengo por cobrar?",
      facturacion: "¿Qué facturas recibí este mes?",
    },
  },
};

const EN: Contenido = {
  portadaEtiqueta: "Artificial intelligence for businesses",
  portada: "Atendel is an assistant that answers WhatsApp, replies to emails and books appointments.",
  decisionesTexto: "It keeps an eye on your business all day and lets you know when something needs your attention.",
  caosTextos: ["This is your day today: messages, emails, appointments and to-dos everywhere.", "You reply late, an appointment slips and a client doesn't come back.", "And the paperwork piles up for the evening."],
  focoTextos: ["Ask for everything in one chat. Atendel splits the work among its team and confirms when it's done.", "It learns how you work, so it handles things the way you would."],
  globoTexto: "Sign in with your email, no password, from your phone or computer.",
  equipoSub: "Four agents, each with their own specialty.",
  planesTexto: "Start free with the whole team.",
  cuandoTexto: "Free is available now. One and Max will open in stages.",
  garantias: [
    { titulo: "Only your account", texto: "Only your business can see your information." },
    { titulo: "With your permission", texto: "You decide what it does on its own and what it checks with you first. Payments always wait for your approval." },
    { titulo: "Encrypted", texto: "All your information travels encrypted." },
  ],
  casos: {
    probar: "Try it",
    lista: [
      { agente: "lola", corto: "After hours", titulo: "Covers for you after hours", texto: "Aura answers your WhatsApp with your prices and books appointments.", pide: "Hi, how much is a facial? Do you have room on Thursday?", responde: "Hi! It's $650. On Thursday there's room at 11:00 or 17:00. Which do you prefer?" },
      { agente: "clara", corto: "Urgent email", titulo: "Urgent things first", texto: "Altair reviews your email and drafts the replies.", pide: "What's urgent in my email?", responde: "Two things: an invoice is due tomorrow and Andrea wants to move her appointment. Replies are ready." },
      { agente: "victor", corto: "Reviews", titulo: "More recommendations", texto: "Rigel asks your clients for a review after their visit.", pide: "Ask today's clients for a review", responde: "I drafted a message for each of them. Shall I send them?" },
      { agente: "iris", corto: "Monthly report", titulo: "Your numbers, clear", texto: "Mira prepares your reports and documents for you to review.", pide: "Prepare this month's sales report", responde: "Done: sales by week and by service, compared with last month." },
      { agente: "lola", corto: "Double bookings", titulo: "No double bookings", texto: "It checks your calendar before booking and suggests another time if needed.", pide: "I have two appointments at the same time on Friday", responde: "I offered Luis Friday at 18:00. I'll let you know when he confirms." },
      { agente: "victor", corto: "Win clients back", titulo: "Bring them back", texto: "It finds who hasn't come back and writes to them, with your approval.", pide: "Who hasn't come back in 3 months?", responde: "I found who hasn't come back and drafted a message for each one. Shall we review them?" },
    ],
  },
  privacidad: {
    permisosTitulo: "Your permissions",
    permisos: [
      { id: "whatsapp_business", que: "Reply to your clients", activo: true },
      { id: "gmail", que: "Read and summarize email", activo: true },
      { id: "google_calendar", que: "Create and move appointments", activo: false },
    ],
    mas: "How we protect your data",
  },
  apps: {
    etiqueta: "Your apps",
    titulo: "Works with the apps you already use",
    texto: (n) => `${n} apps available. Connect your account and Atendel works in them, always with your permission.`,
    que: "What it does",
    usa: "Who uses it",
    ejemplos: {
      correo: "Which emails need a reply today?",
      mensajes: "Which messages haven't I answered?",
      agenda: "What do I have tomorrow?",
      reservas: "Who has an appointment today?",
      documentos: "Summarize the price list file",
      clientes: "Who hasn't come back in 3 months?",
      resenas: "What new reviews do I have?",
      pagos: "How much did I sell this week?",
      contabilidad: "Which invoices are still unpaid?",
      facturacion: "Which invoices did I get this month?",
    },
  },
};

const PT: Contenido = {
  portadaEtiqueta: "Inteligência artificial para negócios",
  portada: "O Atendel é um assistente que responde no WhatsApp e por e-mail, e marca horários.",
  decisionesTexto: "Fica de olho no seu negócio o dia todo e avisa quando algo precisa da sua atenção.",
  caosTextos: ["Assim é o seu dia hoje: mensagens, e-mails, horários e pendências por todo lado.", "Você responde tarde, um horário escapa e um cliente não volta.", "E a papelada se acumula para a noite."],
  focoTextos: ["Peça tudo em um só chat. O Atendel divide o trabalho com a equipe e confirma quando está pronto.", "Aprende como você trabalha para resolver do jeito que você faria."],
  globoTexto: "Entre com o seu e-mail, sem senha, pelo celular ou pelo computador.",
  equipoSub: "Quatro agentes, cada um com a sua especialidade.",
  planesTexto: "Comece grátis com a equipe toda.",
  cuandoTexto: "O Free já está disponível. One e Max vão abrir por etapas.",
  garantias: [
    { titulo: "Só a sua conta", texto: "Suas informações, só o seu negócio vê." },
    { titulo: "Com a sua permissão", texto: "Você decide o que ele faz sozinho e o que consulta antes. Pagamentos sempre esperam a sua aprovação." },
    { titulo: "Criptografado", texto: "Todas as suas informações trafegam criptografadas." },
  ],
  casos: {
    probar: "Experimente",
    lista: [
      { agente: "lola", corto: "Atendimento à noite", titulo: "Atende mesmo sem você", texto: "Aura responde o seu WhatsApp com os seus preços e marca os horários.", pide: "Oi, quanto custa a limpeza de pele? Tem horário na quinta?", responde: "Oi! Custa $650. Na quinta tem horário às 11:00 ou às 17:00. Qual você prefere?" },
      { agente: "clara", corto: "E-mail urgente", titulo: "O urgente primeiro", texto: "Altair revisa o seu e-mail e prepara as respostas.", pide: "O que é urgente no meu e-mail?", responde: "Duas coisas: uma fatura vence amanhã e a Andrea quer mudar o horário dela. As respostas estão prontas." },
      { agente: "victor", corto: "Avaliações", titulo: "Mais recomendações", texto: "Rigel pede uma avaliação aos seus clientes depois da visita.", pide: "Peça avaliação aos clientes de hoje", responde: "Preparei uma mensagem para cada um. Posso enviar?" },
      { agente: "iris", corto: "Relatório do mês", titulo: "Seus números, claros", texto: "Mira prepara seus relatórios e documentos para você revisar.", pide: "Prepare o relatório de vendas do mês", responde: "Pronto: vendas por semana e por serviço, comparadas com o mês passado." },
      { agente: "lola", corto: "Horários duplicados", titulo: "Sem horários duplicados", texto: "Confere a sua agenda antes de marcar e propõe outro horário se precisar.", pide: "Tenho dois horários ao mesmo tempo na sexta", responde: "Propus ao Luis sexta às 18:00. Te aviso quando ele confirmar." },
      { agente: "victor", corto: "Recuperar clientes", titulo: "Que eles voltem", texto: "Encontra quem não voltou e escreve para essas pessoas, com a sua aprovação.", pide: "Quem não voltou em 3 meses?", responde: "Encontrei quem não voltou e preparei uma mensagem para cada um. Vamos revisar?" },
    ],
  },
  privacidad: {
    permisosTitulo: "Suas permissões",
    permisos: [
      { id: "whatsapp_business", que: "Responder aos seus clientes", activo: true },
      { id: "gmail", que: "Ler e resumir e-mails", activo: true },
      { id: "google_calendar", que: "Criar e mudar horários", activo: false },
    ],
    mas: "Como cuidamos dos seus dados",
  },
  apps: {
    etiqueta: "Seus apps",
    titulo: "Funciona com os apps que você já usa",
    texto: (n) => `${n} apps disponíveis. Conecte sua conta e o Atendel trabalha neles, sempre com a sua permissão.`,
    que: "O que faz",
    usa: "Quem usa",
    ejemplos: {
      correo: "Quais e-mails precisam de resposta hoje?",
      mensajes: "Quais mensagens estão sem resposta?",
      agenda: "O que eu tenho amanhã?",
      reservas: "Quem tem horário hoje?",
      documentos: "Resuma o arquivo de preços",
      clientes: "Quem não voltou em 3 meses?",
      resenas: "Quais avaliações novas eu tenho?",
      pagos: "Quanto vendi esta semana?",
      contabilidad: "Quais faturas tenho a receber?",
      facturacion: "Quais faturas eletrônicas recebi este mês?",
    },
  },
};

const FR: Contenido = {
  portadaEtiqueta: "Intelligence artificielle pour les entreprises",
  portada: "Atendel est un assistant qui répond sur WhatsApp et aux e-mails, et prend les rendez-vous.",
  decisionesTexto: "Il garde un œil sur votre activité toute la journée et vous prévient quand quelque chose demande votre attention.",
  caosTextos: ["Voici votre journée aujourd'hui : messages, e-mails, rendez-vous et tâches de tous les côtés.", "Vous répondez tard, un rendez-vous vous échappe et un client ne revient pas.", "Et la paperasse s'accumule pour le soir."],
  focoTextos: ["Demandez tout dans un seul chat. Atendel répartit le travail dans son équipe et vous confirme quand c'est prêt.", "Il apprend votre façon de travailler pour faire les choses comme vous."],
  globoTexto: "Connectez-vous avec votre e-mail, sans mot de passe, depuis votre téléphone ou votre ordinateur.",
  equipoSub: "Quatre agents, chacun avec sa spécialité.",
  planesTexto: "Commencez gratuitement avec toute l'équipe.",
  cuandoTexto: "Free est déjà disponible. One et Max ouvriront par étapes.",
  garantias: [
    { titulo: "Votre compte uniquement", texto: "Seule votre entreprise voit vos informations." },
    { titulo: "Avec votre accord", texto: "Vous décidez ce qu'il fait seul et ce qu'il vous demande avant. Les paiements attendent toujours votre accord." },
    { titulo: "Chiffré", texto: "Toutes vos informations circulent chiffrées." },
  ],
  casos: {
    probar: "Essayer",
    lista: [
      { agente: "lola", corto: "Le soir", titulo: "Répond même en votre absence", texto: "Aura répond sur votre WhatsApp avec vos prix et prend les rendez-vous.", pide: "Bonjour, combien coûte un soin du visage ? Vous avez de la place jeudi ?", responde: "Bonjour ! C'est 650 $. Jeudi, il y a de la place à 11:00 ou à 17:00. Lequel préférez-vous ?" },
      { agente: "clara", corto: "E-mail urgent", titulo: "L'urgent d'abord", texto: "Altair passe en revue vos e-mails et prépare les réponses.", pide: "Qu'est-ce qui est urgent dans mes e-mails ?", responde: "Deux choses : une facture arrive à échéance demain et Andrea veut déplacer son rendez-vous. Les réponses sont prêtes." },
      { agente: "victor", corto: "Avis", titulo: "Plus de recommandations", texto: "Rigel demande un avis à vos clients après leur visite.", pide: "Demande un avis aux clients d'aujourd'hui", responde: "J'ai préparé un message pour chacun. Je les envoie ?" },
      { agente: "iris", corto: "Rapport du mois", titulo: "Vos chiffres, clairs", texto: "Mira prépare vos rapports et documents pour que vous les relisiez.", pide: "Prépare le rapport des ventes du mois", responde: "C'est prêt : ventes par semaine et par service, comparées au mois dernier." },
      { agente: "lola", corto: "Rendez-vous en double", titulo: "Aucun rendez-vous en double", texto: "Il vérifie votre agenda avant de réserver et propose un autre horaire si besoin.", pide: "J'ai deux rendez-vous en même temps vendredi", responde: "J'ai proposé à Luis vendredi à 18:00. Je vous préviens dès qu'il confirme." },
      { agente: "victor", corto: "Faire revenir", titulo: "Qu'ils reviennent", texto: "Il retrouve ceux qui ne sont pas revenus et leur écrit, avec votre accord.", pide: "Qui n'est pas revenu depuis 3 mois ?", responde: "J'ai trouvé ceux qui ne sont pas revenus et préparé un message pour chacun. On les regarde ?" },
    ],
  },
  privacidad: {
    permisosTitulo: "Vos autorisations",
    permisos: [
      { id: "whatsapp_business", que: "Répondre à vos clients", activo: true },
      { id: "gmail", que: "Lire et résumer les e-mails", activo: true },
      { id: "google_calendar", que: "Créer et déplacer des rendez-vous", activo: false },
    ],
    mas: "Comment nous protégeons vos données",
  },
  apps: {
    etiqueta: "Vos apps",
    titulo: "Fonctionne avec les apps que vous utilisez déjà",
    texto: (n) => `${n} apps disponibles. Connectez votre compte et Atendel y travaille, toujours avec votre accord.`,
    que: "Ce qu'il fait",
    usa: "Qui l'utilise",
    ejemplos: {
      correo: "Quels e-mails attendent une réponse aujourd'hui ?",
      mensajes: "Quels messages sont restés sans réponse ?",
      agenda: "Qu'est-ce que j'ai demain ?",
      reservas: "Qui a rendez-vous aujourd'hui ?",
      documentos: "Résume le fichier des prix",
      clientes: "Qui n'est pas revenu depuis 3 mois ?",
      resenas: "Quels nouveaux avis ai-je reçus ?",
      pagos: "Combien ai-je vendu cette semaine ?",
      contabilidad: "Quelles factures restent à encaisser ?",
      facturacion: "Quelles factures électroniques ai-je reçues ce mois-ci ?",
    },
  },
};

const DE: Contenido = {
  portadaEtiqueta: "Künstliche Intelligenz für Unternehmen",
  portada: "Atendel ist ein Assistent, der auf WhatsApp antwortet, E-Mails beantwortet und Termine vereinbart.",
  decisionesTexto: "Es behält dein Geschäft den ganzen Tag im Blick und meldet sich, wenn etwas deine Aufmerksamkeit braucht.",
  caosTextos: ["So sieht dein Tag heute aus: Nachrichten, E-Mails, Termine und Aufgaben überall.", "Du antwortest spät, ein Termin geht unter und ein Kunde kommt nicht wieder.", "Und der Papierkram stapelt sich bis zum Abend."],
  focoTextos: ["Bitte um alles in einem Chat. Atendel verteilt die Arbeit in seinem Team und bestätigt dir, wenn sie erledigt ist.", "Es lernt, wie du arbeitest, und erledigt Dinge so, wie du es tun würdest."],
  globoTexto: "Melde dich mit deiner E-Mail an, ohne Passwort, am Handy oder am Computer.",
  equipoSub: "Vier Agenten, jeder mit eigenem Fachgebiet.",
  planesTexto: "Starte kostenlos mit dem ganzen Team.",
  cuandoTexto: "Free ist schon verfügbar. One und Max öffnen in Etappen.",
  garantias: [
    { titulo: "Nur dein Konto", texto: "Deine Daten sieht nur dein Geschäft." },
    { titulo: "Mit deiner Erlaubnis", texto: "Du entscheidest, was es allein erledigt und was es vorher mit dir abspricht. Zahlungen warten immer auf deine Freigabe." },
    { titulo: "Verschlüsselt", texto: "Alle deine Daten werden verschlüsselt übertragen." },
  ],
  casos: {
    probar: "Ausprobieren",
    lista: [
      { agente: "lola", corto: "Nach Feierabend", titulo: "Antwortet, auch wenn du nicht da bist", texto: "Aura beantwortet dein WhatsApp mit deinen Preisen und vereinbart Termine.", pide: "Hallo, was kostet eine Gesichtsbehandlung? Habt ihr am Donnerstag etwas frei?", responde: "Hallo! Sie kostet 650 $. Am Donnerstag ist um 11:00 oder um 17:00 Uhr frei. Was passt dir besser?" },
      { agente: "clara", corto: "Dringende E-Mail", titulo: "Das Dringende zuerst", texto: "Altair prüft deine E-Mails und bereitet die Antworten vor.", pide: "Was ist in meinen E-Mails dringend?", responde: "Zwei Dinge: Eine Rechnung ist morgen fällig und Andrea möchte ihren Termin verschieben. Die Antworten sind fertig." },
      { agente: "victor", corto: "Bewertungen", titulo: "Mehr Empfehlungen", texto: "Rigel bittet deine Kunden nach ihrem Besuch um eine Bewertung.", pide: "Bitte die Kunden von heute um eine Bewertung", responde: "Ich habe für jeden eine Nachricht vorbereitet. Soll ich sie senden?" },
      { agente: "iris", corto: "Monatsbericht", titulo: "Deine Zahlen, klar", texto: "Mira erstellt deine Berichte und Dokumente, damit du sie prüfen kannst.", pide: "Erstelle den Umsatzbericht des Monats", responde: "Fertig: Umsatz nach Woche und nach Leistung, im Vergleich zum Vormonat." },
      { agente: "lola", corto: "Doppelbuchungen", titulo: "Keine doppelten Termine", texto: "Es prüft deinen Kalender vor dem Buchen und schlägt bei Bedarf eine andere Zeit vor.", pide: "Ich habe am Freitag zwei Termine zur selben Zeit", responde: "Ich habe Luis Freitag um 18:00 Uhr vorgeschlagen. Ich sage dir Bescheid, wenn er bestätigt." },
      { agente: "victor", corto: "Kunden zurückholen", titulo: "Damit sie wiederkommen", texto: "Es findet, wer nicht wiedergekommen ist, und schreibt ihnen, mit deiner Freigabe.", pide: "Wer war seit 3 Monaten nicht mehr da?", responde: "Ich habe gefunden, wer nicht wiedergekommen ist, und für jeden eine Nachricht vorbereitet. Sollen wir sie durchgehen?" },
    ],
  },
  privacidad: {
    permisosTitulo: "Deine Berechtigungen",
    permisos: [
      { id: "whatsapp_business", que: "Deinen Kunden antworten", activo: true },
      { id: "gmail", que: "E-Mails lesen und zusammenfassen", activo: true },
      { id: "google_calendar", que: "Termine erstellen und verschieben", activo: false },
    ],
    mas: "So schützen wir deine Daten",
  },
  apps: {
    etiqueta: "Deine Apps",
    titulo: "Funktioniert mit den Apps, die du schon nutzt",
    texto: (n) => `${n} Apps verfügbar. Verbinde dein Konto und Atendel arbeitet darin, immer mit deiner Erlaubnis.`,
    que: "Was es macht",
    usa: "Wer sie nutzt",
    ejemplos: {
      correo: "Welche E-Mails brauchen heute eine Antwort?",
      mensajes: "Welche Nachrichten habe ich nicht beantwortet?",
      agenda: "Was habe ich morgen?",
      reservas: "Wer hat heute einen Termin?",
      documentos: "Fasse die Preisliste zusammen",
      clientes: "Wer war seit 3 Monaten nicht mehr da?",
      resenas: "Welche neuen Bewertungen habe ich?",
      pagos: "Wie viel habe ich diese Woche verkauft?",
      contabilidad: "Welche Rechnungen sind noch offen?",
      facturacion: "Welche E-Rechnungen habe ich diesen Monat bekommen?",
    },
  },
};

const IT: Contenido = {
  portadaEtiqueta: "Intelligenza artificiale per le attività",
  portada: "Atendel è un assistente che risponde su WhatsApp e alle email, e fissa gli appuntamenti.",
  decisionesTexto: "Tiene d'occhio la tua attività tutto il giorno e ti avvisa quando qualcosa richiede la tua attenzione.",
  caosTextos: ["Ecco la tua giornata oggi: messaggi, email, appuntamenti e cose da fare ovunque.", "Rispondi tardi, salta un appuntamento e un cliente non torna più.", "E le scartoffie si accumulano per la sera."],
  focoTextos: ["Chiedi tutto in un'unica chat. Atendel divide il lavoro con il suo team e ti conferma quando è pronto.", "Impara come lavori per risolvere le cose come faresti tu."],
  globoTexto: "Entra con la tua email, senza password, dal telefono o dal computer.",
  equipoSub: "Quattro agenti, ognuno con la sua specialità.",
  planesTexto: "Inizia gratis con tutto il team.",
  cuandoTexto: "Free è già disponibile. One e Max apriranno a tappe.",
  garantias: [
    { titulo: "Solo il tuo account", texto: "Le tue informazioni le vede solo la tua attività." },
    { titulo: "Con il tuo permesso", texto: "Decidi tu cosa fa da solo e cosa ti chiede prima. I pagamenti aspettano sempre la tua approvazione." },
    { titulo: "Cifrato", texto: "Tutte le tue informazioni viaggiano cifrate." },
  ],
  casos: {
    probar: "Provalo",
    lista: [
      { agente: "lola", corto: "Di sera", titulo: "Risponde anche quando non ci sei", texto: "Aura risponde al tuo WhatsApp con i tuoi prezzi e fissa gli appuntamenti.", pide: "Ciao, quanto costa la pulizia del viso? Avete posto giovedì?", responde: "Ciao! Costa 650 $. Giovedì c'è posto alle 11:00 o alle 17:00. Quale preferisci?" },
      { agente: "clara", corto: "Email urgente", titulo: "Prima l'urgente", texto: "Altair controlla la tua email e prepara le risposte.", pide: "Cosa c'è di urgente nella mia email?", responde: "Due cose: una fattura scade domani e Andrea vuole spostare il suo appuntamento. Le risposte sono pronte." },
      { agente: "victor", corto: "Recensioni", titulo: "Più raccomandazioni", texto: "Rigel chiede una recensione ai tuoi clienti dopo la visita.", pide: "Chiedi una recensione ai clienti di oggi", responde: "Ho preparato un messaggio per ognuno. Li invio?" },
      { agente: "iris", corto: "Report del mese", titulo: "I tuoi numeri, chiari", texto: "Mira prepara i tuoi report e documenti da rivedere.", pide: "Prepara il report delle vendite del mese", responde: "Fatto: vendite per settimana e per servizio, confrontate con il mese scorso." },
      { agente: "lola", corto: "Appuntamenti sovrapposti", titulo: "Niente appuntamenti sovrapposti", texto: "Controlla la tua agenda prima di fissare e propone un altro orario se serve.", pide: "Venerdì ho due appuntamenti alla stessa ora", responde: "Ho proposto a Luis venerdì alle 18:00. Ti avviso quando conferma." },
      { agente: "victor", corto: "Recuperare clienti", titulo: "Che tornino", texto: "Trova chi non è tornato e gli scrive, con la tua approvazione.", pide: "Chi non è tornato da 3 mesi?", responde: "Ho trovato chi non è tornato e preparato un messaggio per ognuno. Li rivediamo?" },
    ],
  },
  privacidad: {
    permisosTitulo: "I tuoi permessi",
    permisos: [
      { id: "whatsapp_business", que: "Rispondere ai tuoi clienti", activo: true },
      { id: "gmail", que: "Leggere e riassumere le email", activo: true },
      { id: "google_calendar", que: "Creare e spostare appuntamenti", activo: false },
    ],
    mas: "Come proteggiamo i tuoi dati",
  },
  apps: {
    etiqueta: "Le tue app",
    titulo: "Funziona con le app che usi già",
    texto: (n) => `${n} app disponibili. Collega il tuo account e Atendel ci lavora, sempre con il tuo permesso.`,
    que: "Cosa fa",
    usa: "Chi la usa",
    ejemplos: {
      correo: "Quali email richiedono una risposta oggi?",
      mensajes: "A quali messaggi non ho ancora risposto?",
      agenda: "Cosa ho domani?",
      reservas: "Chi ha un appuntamento oggi?",
      documentos: "Riassumi il file dei prezzi",
      clientes: "Chi non è tornato da 3 mesi?",
      resenas: "Quali nuove recensioni ho?",
      pagos: "Quanto ho venduto questa settimana?",
      contabilidad: "Quali fatture devo ancora incassare?",
      facturacion: "Quali fatture elettroniche ho ricevuto questo mese?",
    },
  },
};

const ZH: Contenido = {
  portadaEtiqueta: "面向商家的人工智能",
  portada: "Atendel 是一个助手，负责回复 WhatsApp 和邮件，并安排预约。",
  decisionesTexto: "它整天关注你的生意，有需要你处理的事就会提醒你。",
  caosTextos: ["这就是你今天的一天：消息、邮件、预约和待办事项到处都是。", "回复晚了，错过一个预约，一位客人就不再回来。", "文书工作还要堆到晚上处理。"],
  focoTextos: ["所有事情都在同一个聊天里提出。Atendel 会把工作分给团队，完成后向你确认。", "它会学习你的工作方式，像你一样处理事情。"],
  globoTexto: "用邮箱登录，不需要密码，手机或电脑都可以。",
  equipoSub: "四个智能体，各有专长。",
  planesTexto: "免费开始，整个团队都能用。",
  cuandoTexto: "Free 现已开放。One 和 Max 将分阶段开放。",
  garantias: [
    { titulo: "只属于你的账户", texto: "你的信息只有你的生意能看到。" },
    { titulo: "需要你的许可", texto: "由你决定哪些事它自己做，哪些事先问你。付款永远要等你批准。" },
    { titulo: "加密", texto: "你的所有信息都以加密方式传输。" },
  ],
  casos: {
    probar: "试试看",
    lista: [
      { agente: "lola", corto: "夜间接待", titulo: "你不在也有人回复", texto: "Aura 按你的价格回复 WhatsApp，并安排预约。", pide: "你好，面部清洁多少钱？周四还有空位吗？", responde: "你好！价格是 $650。周四 11:00 或 17:00 有空位。你想选哪个？" },
      { agente: "clara", corto: "紧急邮件", titulo: "急事优先", texto: "Altair 帮你查看邮件并准备好回复。", pide: "我的邮件里有什么急事？", responde: "有两件事：一张发票明天到期，Andrea 想改约时间。回复已经准备好了。" },
      { agente: "victor", corto: "评价", titulo: "更多推荐", texto: "Rigel 会在客人到店后请他们留下评价。", pide: "请今天的客人留评价", responde: "我给每个人都准备了一条消息。要发送吗？" },
      { agente: "iris", corto: "月度报告", titulo: "你的数字，一目了然", texto: "Mira 帮你准备报告和文件，供你审阅。", pide: "准备本月的销售报告", responde: "好了：按周和按服务统计的销售额，并与上个月对比。" },
      { agente: "lola", corto: "预约冲突", titulo: "预约不再撞车", texto: "预约前先查看你的日程，需要时会建议其他时间。", pide: "我周五有两个预约撞在同一时间", responde: "我已建议 Luis 改到周五 18:00。他确认后我会告诉你。" },
      { agente: "victor", corto: "找回客人", titulo: "让客人回来", texto: "找出很久没来的客人并给他们发消息，需经你批准。", pide: "哪些客人三个月没来了？", responde: "我找到了没再来的客人，并为每人准备了一条消息。要一起看看吗？" },
    ],
  },
  privacidad: {
    permisosTitulo: "你的权限",
    permisos: [
      { id: "whatsapp_business", que: "回复你的客人", activo: true },
      { id: "gmail", que: "阅读并总结邮件", activo: true },
      { id: "google_calendar", que: "创建和调整预约", activo: false },
    ],
    mas: "我们如何保护你的数据",
  },
  apps: {
    etiqueta: "你的应用",
    titulo: "适用于你已经在用的应用",
    texto: (n) => `目前支持 ${n} 个应用。连接你的账户后，Atendel 就能在其中工作，始终需要你的许可。`,
    que: "它做什么",
    usa: "谁在用",
    ejemplos: {
      correo: "今天哪些邮件需要回复？",
      mensajes: "哪些消息我还没回复？",
      agenda: "我明天有什么安排？",
      reservas: "今天谁有预约？",
      documentos: "总结一下价格表文件",
      clientes: "哪些客人三个月没来了？",
      resenas: "我有哪些新评价？",
      pagos: "我这周卖了多少？",
      contabilidad: "哪些发票还没收款？",
      facturacion: "我这个月收到了哪些电子发票？",
    },
  },
};

const POR_IDIOMA: Record<string, Contenido> = { es: ES, en: EN, pt: PT, fr: FR, de: DE, it: IT, zh: ZH };

export const contenidoMezcla = (idioma: string): Contenido => POR_IDIOMA[idioma] ?? EN;
