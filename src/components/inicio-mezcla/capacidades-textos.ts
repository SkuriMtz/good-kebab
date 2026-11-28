/**
 * «Cuatro trabajos. Un solo asistente.» (el inicio, Capacidades.tsx): lo que hace Atendel, sin
 * prometer de más. Todo sale de lo que de verdad hace hoy (src/lib/conexiones/catalogo.ts y el
 * panel): con las apps de pagos y contabilidad solo LEE (no cobra ni mueve dinero); lo que manda
 * por ti va con tu OK salvo lo que elijas en «Qué hace solo», y lo de dinero siempre pregunta.
 * Los nombres y cosas de las animaciones son de ejemplo (y se dice). En los 7 idiomas.
 */
export type IdCapacidad = "clientes" | "responde" | "costos" | "procesos";
type Cap = { titulo: string; linea: string; ejemplos: [string, string, string, string] };
type Textos = {
  etiqueta: string;
  titulo: string;
  confianza: string;
  ejemplo: string;
  caps: Record<IdCapacidad, Cap>;
  vis: {
    clientes: { filas: [string, string][]; pendiente: string; listo: string };
    responde: { canal: string; mensajes: [string, string, string, string] };
    costos: { titulo: string; barras: [string, string, string, string]; alertas: [string, string] };
    procesos: [string, string, string, string];
  };
};

const POR_IDIOMA: Record<string, Textos> = {
  es: {
    etiqueta: "Lo que hace Atendel",
    titulo: "Cuatro trabajos. Un solo asistente.",
    confianza: "Tú decides qué hace solo y qué te pregunta antes. Lo de dinero, siempre te lo pregunta.",
    ejemplo: "Ejemplo",
    caps: {
      clientes: {
        titulo: "Consigue clientes",
        linea: "Ninguna oportunidad se queda olvidada.",
        ejemplos: ["Junta a los interesados de tus mensajes, formularios y CRM", "Te dice a quién darle seguimiento y cuándo", "Les escribe por ti, con tu OK, antes de que se enfríen", "Trae de vuelta a clientes que dejaron de venir"],
      },
      responde: {
        titulo: "Responde a tus clientes",
        linea: "Nadie se queda esperando una respuesta.",
        ejemplos: ["Contesta tu WhatsApp y tu correo", "Resuelve dudas de precios, horarios y servicios", "Agenda, mueve y confirma citas", "Lo que no sabe, te lo pregunta antes de contestar"],
      },
      costos: {
        titulo: "Revisa tus costos y cobros",
        linea: "Entiende en qué se va tu dinero.",
        ejemplos: ["Lee tus hojas de cálculo, facturas y pagos", "Saca cuentas y te señala dónde puedes ahorrar", "Lleva lo que te pagan y lo que te deben", "Te avisa si una factura vence y prepara el recordatorio de cobro"],
      },
      procesos: {
        titulo: "Automatiza tus procesos",
        linea: "Menos tareas, más tiempo para crecer.",
        ejemplos: ["Hace solo las tareas que le programas: reportes, recordatorios, seguimientos", "Crea citas y pendientes en las apps que ya usas", "Sigue tus reglas y tus procesos", "Te avisa en WhatsApp o en tu celular cuando algo necesita atención"],
      },
    },
    vis: {
      clientes: { filas: [["Paola", "Preguntó por precios"], ["Andrés", "Llenó tu formulario"], ["Lucía", "No ha vuelto desde marzo"]], pendiente: "Sin seguimiento", listo: "Mensaje listo" },
      responde: { canal: "WhatsApp", mensajes: ["¿Tienen lugar mañana en la tarde?", "Sí: 16:00 o 17:30. ¿Cuál te aparto?", "17:30, por favor", "Listo, quedó agendada."] },
      costos: { titulo: "Gastos del mes", barras: ["Renta", "Insumos", "Servicios", "Envíos"], alertas: ["Insumos subió este mes", "Una factura vence el viernes"] },
      procesos: ["Recordatorio de cita enviado", "Pendiente creado en tu lista", "Reporte de la semana listo", "Aviso: un cliente espera respuesta"],
    },
  },
  en: {
    etiqueta: "What Atendel does",
    titulo: "Four jobs. One assistant.",
    confianza: "You decide what it does on its own and what it asks you first. Anything involving money, it always asks.",
    ejemplo: "Example",
    caps: {
      clientes: {
        titulo: "Win clients",
        linea: "No opportunity gets forgotten.",
        ejemplos: ["Gathers interested people from your messages, forms and CRM", "Tells you who to follow up with and when", "Writes to them for you, with your OK, before they go cold", "Brings back clients who stopped coming"],
      },
      responde: {
        titulo: "Answer your clients",
        linea: "No one is left waiting for a reply.",
        ejemplos: ["Answers your WhatsApp and your email", "Handles questions about prices, hours and services", "Books, moves and confirms appointments", "What it doesn't know, it asks you before replying"],
      },
      costos: {
        titulo: "Review your costs and payments",
        linea: "See where your money goes.",
        ejemplos: ["Reads your spreadsheets, invoices and payments", "Does the math and points out where you can save", "Keeps track of what you're paid and what you're owed", "Warns you when an invoice is due and prepares the payment reminder"],
      },
      procesos: {
        titulo: "Automate your processes",
        linea: "Fewer tasks, more time to grow.",
        ejemplos: ["Runs the tasks you schedule: reports, reminders, follow-ups", "Creates appointments and to-dos in the apps you already use", "Follows your rules and your processes", "Alerts you on WhatsApp or your phone when something needs attention"],
      },
    },
    vis: {
      clientes: { filas: [["Paola", "Asked about prices"], ["Andrés", "Filled out your form"], ["Lucía", "Hasn't been back since March"]], pendiente: "No follow-up", listo: "Message ready" },
      responde: { canal: "WhatsApp", mensajes: ["Do you have a spot tomorrow afternoon?", "Yes: 4:00 or 5:30 pm. Which one should I hold?", "5:30, please", "Done, you're booked."] },
      costos: { titulo: "This month's expenses", barras: ["Rent", "Supplies", "Utilities", "Shipping"], alertas: ["Supplies went up this month", "An invoice is due Friday"] },
      procesos: ["Appointment reminder sent", "To-do added to your list", "Weekly report ready", "Alert: a client is waiting for a reply"],
    },
  },
  pt: {
    etiqueta: "O que o Atendel faz",
    titulo: "Quatro trabalhos. Um só assistente.",
    confianza: "Você decide o que ele faz sozinho e o que pergunta antes. Tudo o que envolve dinheiro, ele sempre pergunta.",
    ejemplo: "Exemplo",
    caps: {
      clientes: {
        titulo: "Conquiste clientes",
        linea: "Nenhuma oportunidade fica esquecida.",
        ejemplos: ["Reúne os interessados das suas mensagens, formulários e CRM", "Diz com quem fazer o acompanhamento e quando", "Escreve para eles por você, com seu OK, antes que esfriem", "Traz de volta clientes que pararam de vir"],
      },
      responde: {
        titulo: "Responda seus clientes",
        linea: "Ninguém fica esperando resposta.",
        ejemplos: ["Responde seu WhatsApp e seu e-mail", "Tira dúvidas sobre preços, horários e serviços", "Marca, muda e confirma horários", "O que não sabe, pergunta para você antes de responder"],
      },
      costos: {
        titulo: "Revise custos e cobranças",
        linea: "Entenda para onde vai seu dinheiro.",
        ejemplos: ["Lê suas planilhas, notas fiscais e pagamentos", "Faz as contas e aponta onde dá para economizar", "Acompanha o que você recebe e o que te devem", "Avisa quando uma fatura vence e prepara o lembrete de cobrança"],
      },
      procesos: {
        titulo: "Automatize seus processos",
        linea: "Menos tarefas, mais tempo para crescer.",
        ejemplos: ["Faz sozinho as tarefas que você programa: relatórios, lembretes, acompanhamentos", "Cria horários e pendências nos apps que você já usa", "Segue suas regras e seus processos", "Avisa no WhatsApp ou no celular quando algo precisa de atenção"],
      },
    },
    vis: {
      clientes: { filas: [["Paola", "Perguntou os preços"], ["André", "Preencheu seu formulário"], ["Lúcia", "Não volta desde março"]], pendiente: "Sem acompanhamento", listo: "Mensagem pronta" },
      responde: { canal: "WhatsApp", mensajes: ["Vocês têm horário amanhã à tarde?", "Sim: 16h ou 17h30. Qual eu reservo?", "17h30, por favor", "Pronto, ficou marcado."] },
      costos: { titulo: "Gastos do mês", barras: ["Aluguel", "Insumos", "Serviços", "Envios"], alertas: ["Os insumos subiram este mês", "Uma fatura vence na sexta"] },
      procesos: ["Lembrete de horário enviado", "Pendência criada na sua lista", "Relatório da semana pronto", "Aviso: um cliente espera resposta"],
    },
  },
  fr: {
    etiqueta: "Ce que fait Atendel",
    titulo: "Quatre métiers. Un seul assistant.",
    confianza: "Vous décidez ce qu'il fait seul et ce qu'il vous demande d'abord. Tout ce qui touche à l'argent, il vous le demande toujours.",
    ejemplo: "Exemple",
    caps: {
      clientes: {
        titulo: "Trouvez des clients",
        linea: "Aucune opportunité n'est oubliée.",
        ejemplos: ["Rassemble les personnes intéressées de vos messages, formulaires et CRM", "Vous dit qui relancer et quand", "Leur écrit pour vous, avec votre accord, avant qu'ils ne refroidissent", "Fait revenir les clients qui ne viennent plus"],
      },
      responde: {
        titulo: "Répondez à vos clients",
        linea: "Personne n'attend une réponse.",
        ejemplos: ["Répond sur WhatsApp et par e-mail", "Répond aux questions sur les prix, horaires et services", "Prend, déplace et confirme les rendez-vous", "Ce qu'il ne sait pas, il vous le demande avant de répondre"],
      },
      costos: {
        titulo: "Suivez vos coûts et paiements",
        linea: "Comprenez où va votre argent.",
        ejemplos: ["Lit vos tableurs, factures et paiements", "Fait les calculs et vous montre où économiser", "Suit ce qu'on vous paie et ce qu'on vous doit", "Vous prévient quand une facture arrive à échéance et prépare la relance"],
      },
      procesos: {
        titulo: "Automatisez vos processus",
        linea: "Moins de tâches, plus de temps pour grandir.",
        ejemplos: ["Fait seul les tâches que vous programmez : rapports, rappels, relances", "Crée rendez-vous et tâches dans les applis que vous utilisez déjà", "Suit vos règles et vos processus", "Vous alerte sur WhatsApp ou sur votre téléphone quand quelque chose demande votre attention"],
      },
    },
    vis: {
      clientes: { filas: [["Paola", "A demandé les prix"], ["André", "A rempli votre formulaire"], ["Lucie", "Pas revenue depuis mars"]], pendiente: "Sans relance", listo: "Message prêt" },
      responde: { canal: "WhatsApp", mensajes: ["Vous avez une place demain après-midi ?", "Oui : 16h00 ou 17h30. Laquelle je vous réserve ?", "17h30, s'il vous plaît", "C'est fait, c'est réservé."] },
      costos: { titulo: "Dépenses du mois", barras: ["Loyer", "Fournitures", "Services", "Livraisons"], alertas: ["Les fournitures ont augmenté ce mois-ci", "Une facture arrive à échéance vendredi"] },
      procesos: ["Rappel de rendez-vous envoyé", "Tâche ajoutée à votre liste", "Rapport de la semaine prêt", "Alerte : un client attend une réponse"],
    },
  },
  de: {
    etiqueta: "Was Atendel macht",
    titulo: "Vier Aufgaben. Ein Assistent.",
    confianza: "Du entscheidest, was er allein macht und was er dich vorher fragt. Bei allem, was Geld betrifft, fragt er immer.",
    ejemplo: "Beispiel",
    caps: {
      clientes: {
        titulo: "Kunden gewinnen",
        linea: "Keine Chance gerät in Vergessenheit.",
        ejemplos: ["Sammelt Interessenten aus deinen Nachrichten, Formularen und deinem CRM", "Sagt dir, bei wem du nachfassen solltest und wann", "Schreibt ihnen für dich, mit deinem OK, bevor sie abkühlen", "Holt Kunden zurück, die nicht mehr kommen"],
      },
      responde: {
        titulo: "Deinen Kunden antworten",
        linea: "Niemand wartet auf eine Antwort.",
        ejemplos: ["Beantwortet dein WhatsApp und deine E-Mails", "Klärt Fragen zu Preisen, Öffnungszeiten und Leistungen", "Vereinbart, verschiebt und bestätigt Termine", "Was er nicht weiß, fragt er dich, bevor er antwortet"],
      },
      costos: {
        titulo: "Kosten und Zahlungen prüfen",
        linea: "Sieh, wohin dein Geld geht.",
        ejemplos: ["Liest deine Tabellen, Rechnungen und Zahlungen", "Rechnet nach und zeigt dir, wo du sparen kannst", "Behält im Blick, was dir gezahlt wird und was offen ist", "Warnt dich, wenn eine Rechnung fällig wird, und bereitet die Zahlungserinnerung vor"],
      },
      procesos: {
        titulo: "Abläufe automatisieren",
        linea: "Weniger Aufgaben, mehr Zeit zum Wachsen.",
        ejemplos: ["Erledigt die Aufgaben, die du planst: Berichte, Erinnerungen, Nachfassen", "Legt Termine und Aufgaben in den Apps an, die du schon nutzt", "Hält sich an deine Regeln und Abläufe", "Meldet sich per WhatsApp oder auf dem Handy, wenn etwas deine Aufmerksamkeit braucht"],
      },
    },
    vis: {
      clientes: { filas: [["Paola", "Hat nach Preisen gefragt"], ["Andreas", "Hat dein Formular ausgefüllt"], ["Lucia", "Seit März nicht mehr da"]], pendiente: "Kein Nachfassen", listo: "Nachricht bereit" },
      responde: { canal: "WhatsApp", mensajes: ["Habt ihr morgen Nachmittag einen Termin frei?", "Ja: 16:00 oder 17:30. Welchen soll ich reservieren?", "17:30, bitte", "Erledigt, der Termin steht."] },
      costos: { titulo: "Ausgaben des Monats", barras: ["Miete", "Material", "Nebenkosten", "Versand"], alertas: ["Material ist diesen Monat teurer", "Eine Rechnung ist am Freitag fällig"] },
      procesos: ["Terminerinnerung gesendet", "Aufgabe zu deiner Liste hinzugefügt", "Wochenbericht fertig", "Hinweis: Ein Kunde wartet auf Antwort"],
    },
  },
  it: {
    etiqueta: "Cosa fa Atendel",
    titulo: "Quattro lavori. Un solo assistente.",
    confianza: "Decidi tu cosa fa da solo e cosa ti chiede prima. Per tutto ciò che riguarda i soldi, chiede sempre.",
    ejemplo: "Esempio",
    caps: {
      clientes: {
        titulo: "Trova clienti",
        linea: "Nessuna opportunità viene dimenticata.",
        ejemplos: ["Raccoglie gli interessati dai tuoi messaggi, moduli e CRM", "Ti dice chi ricontattare e quando", "Scrive loro per te, con il tuo OK, prima che si raffreddino", "Fa tornare i clienti che non vengono più"],
      },
      responde: {
        titulo: "Rispondi ai tuoi clienti",
        linea: "Nessuno resta in attesa di una risposta.",
        ejemplos: ["Risponde su WhatsApp e via email", "Risolve dubbi su prezzi, orari e servizi", "Fissa, sposta e conferma appuntamenti", "Quello che non sa, te lo chiede prima di rispondere"],
      },
      costos: {
        titulo: "Controlla costi e incassi",
        linea: "Capisci dove vanno i tuoi soldi.",
        ejemplos: ["Legge i tuoi fogli di calcolo, fatture e pagamenti", "Fa i conti e ti indica dove puoi risparmiare", "Tiene traccia di quanto ti pagano e di quanto ti devono", "Ti avvisa quando una fattura scade e prepara il sollecito di pagamento"],
      },
      procesos: {
        titulo: "Automatizza i tuoi processi",
        linea: "Meno compiti, più tempo per crescere.",
        ejemplos: ["Fa da solo i compiti che programmi: report, promemoria, ricontatti", "Crea appuntamenti e attività nelle app che usi già", "Segue le tue regole e i tuoi processi", "Ti avvisa su WhatsApp o sul telefono quando qualcosa richiede attenzione"],
      },
    },
    vis: {
      clientes: { filas: [["Paola", "Ha chiesto i prezzi"], ["Andrea", "Ha compilato il tuo modulo"], ["Lucia", "Non torna da marzo"]], pendiente: "Da ricontattare", listo: "Messaggio pronto" },
      responde: { canal: "WhatsApp", mensajes: ["Avete posto domani pomeriggio?", "Sì: 16:00 o 17:30. Quale ti tengo?", "17:30, grazie", "Fatto, è prenotato."] },
      costos: { titulo: "Spese del mese", barras: ["Affitto", "Forniture", "Utenze", "Spedizioni"], alertas: ["Le forniture sono aumentate questo mese", "Una fattura scade venerdì"] },
      procesos: ["Promemoria dell'appuntamento inviato", "Attività aggiunta alla tua lista", "Report della settimana pronto", "Avviso: un cliente aspetta una risposta"],
    },
  },
  zh: {
    etiqueta: "Atendel 能做什么",
    titulo: "四项工作，一个助手。",
    confianza: "由你决定它可以自己做什么、什么要先问你。凡是涉及钱的事，它都会先问你。",
    ejemplo: "示例",
    caps: {
      clientes: {
        titulo: "争取客户",
        linea: "不错过任何机会。",
        ejemplos: ["从你的消息、表单和 CRM 中汇总有意向的人", "告诉你该跟进谁、什么时候跟进", "经你同意后替你联系他们，趁热打铁", "让不再光顾的老客人回来"],
      },
      responde: {
        titulo: "回复你的客户",
        linea: "不让任何人等回复。",
        ejemplos: ["回复你的 WhatsApp 和邮件", "解答价格、营业时间和服务的问题", "预约、改约和确认预约", "不知道的，会先问你再回复"],
      },
      costos: {
        titulo: "查看成本和收款",
        linea: "看清你的钱花在哪里。",
        ejemplos: ["读取你的表格、发票和付款记录", "帮你算账，并指出可以节省的地方", "记录收到的钱和别人欠你的钱", "发票快到期时提醒你，并准备好催款消息"],
      },
      procesos: {
        titulo: "让流程自动化",
        linea: "少做杂事，多花时间发展生意。",
        ejemplos: ["自动完成你安排的任务：报告、提醒、跟进", "在你已在用的应用里创建预约和待办", "按照你的规则和流程办事", "有需要你处理的事时，通过 WhatsApp 或手机通知你"],
      },
    },
    vis: {
      clientes: { filas: [["Paola", "问了价格"], ["Andrés", "填写了你的表单"], ["Lucía", "三月后就没来过"]], pendiente: "未跟进", listo: "消息已备好" },
      responde: { canal: "WhatsApp", mensajes: ["明天下午还有空位吗？", "有：16:00 或 17:30。帮你约哪个？", "17:30，谢谢", "好了，已经约上了。"] },
      costos: { titulo: "本月支出", barras: ["房租", "耗材", "水电", "运费"], alertas: ["本月耗材费用上涨", "有一张发票周五到期"] },
      procesos: ["预约提醒已发送", "已在你的清单中添加待办", "本周报告已备好", "提醒：有客人在等回复"],
    },
  },
};

export const textosCapacidades = (idioma: string): Textos => POR_IDIOMA[idioma] ?? POR_IDIOMA.en;
