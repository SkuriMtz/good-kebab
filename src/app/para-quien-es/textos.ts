import type { IdAgente } from "@/lib/agentes";

/**
 * Los textos cortos de /para-quien-es: una línea arriba, y por cada caso (los SEGMENTOS de
 * src/lib/contenido.ts) una frase y lo que hace cada agente, en una línea. Tono calmado y claro,
 * sin palabras de más. En los 7 idiomas del sitio (los nombres de cada caso siguen saliendo de
 * src/i18n: paraQuien.segmentos).
 */
type Caso = { intro: string; agentes: Record<IdAgente, string> };
type TextosParaQuien = {
  texto: string;
  probar: string;
  equipo: string;
  casos: Record<"citas" | "mensajes" | "regresan" | "oficina", Caso>;
};

const ES: TextosParaQuien = {
  texto: "Elige tu caso y mira cómo te ayuda el equipo.",
  probar: "Pruébalo",
  equipo: "Y el resto del equipo",
  casos: {
    citas: {
      intro: "Agendar, confirmar y reagendar te quita el día.",
      agentes: {
        lola: "Contesta tu WhatsApp, agenda y confirma las citas.",
        clara: "Te avisa de los correos urgentes, como un cambio de cita.",
        victor: "Escribe a quien faltó o preguntó y no agendó.",
        iris: "Arma tu reporte mensual de citas.",
      },
    },
    mensajes: {
      intro: "Te preguntan lo mismo todo el día, también de noche.",
      agentes: {
        lola: "Responde precios, horarios y formas de pago por WhatsApp.",
        victor: "Da seguimiento a quien preguntó y no agendó.",
        clara: "Ordena tu correo por urgencia.",
        iris: "Redacta documentos y resúmenes cuando los necesitas.",
      },
    },
    regresan: {
      intro: "Lo que más vende es que tus clientes vuelvan.",
      agentes: {
        victor: "Escribe a quien no ha vuelto y pide reseñas después de cada visita.",
        lola: "Confirma las citas de mañana y reagenda a quien no puede.",
        clara: "Te avisa de pagos y cobros pendientes.",
        iris: "Compara tus precios con los de negocios cercanos.",
      },
    },
    oficina: {
      intro: "Correos, facturas y reportes se acumulan mientras atiendes.",
      agentes: {
        iris: "Redacta documentos y arma tus reportes.",
        clara: "Resume tu correo y te avisa de facturas por vencer.",
        lola: "Atiende tu WhatsApp mientras trabajas.",
        victor: "Da seguimiento a tus clientes y pide reseñas.",
      },
    },
  },
};

const EN: TextosParaQuien = {
  texto: "Pick your case and see how the team helps.",
  probar: "Try it",
  equipo: "And the rest of the team",
  casos: {
    citas: {
      intro: "Booking, confirming and rescheduling eats up your day.",
      agentes: {
        lola: "Answers your WhatsApp, books and confirms appointments.",
        clara: "Flags urgent emails, like a changed appointment.",
        victor: "Writes to whoever missed an appointment or asked and didn't book.",
        iris: "Puts together your monthly appointments report.",
      },
    },
    mensajes: {
      intro: "You get the same questions all day, at night too.",
      agentes: {
        lola: "Answers prices, hours and payment options on WhatsApp.",
        victor: "Follows up with whoever asked and didn't book.",
        clara: "Sorts your email by urgency.",
        iris: "Writes documents and summaries when you need them.",
      },
    },
    regresan: {
      intro: "What sells most is clients coming back.",
      agentes: {
        victor: "Writes to whoever hasn't come back and asks for reviews after each visit.",
        lola: "Confirms tomorrow's appointments and reschedules whoever can't make it.",
        clara: "Lets you know about pending payments.",
        iris: "Compares your prices with nearby businesses.",
      },
    },
    oficina: {
      intro: "Emails, invoices and reports pile up while you serve clients.",
      agentes: {
        iris: "Writes documents and puts your reports together.",
        clara: "Summarizes your email and flags invoices about to be due.",
        lola: "Handles your WhatsApp while you work.",
        victor: "Follows up with your clients and asks for reviews.",
      },
    },
  },
};

const PT: TextosParaQuien = {
  texto: "Escolha o seu caso e veja como a equipe ajuda.",
  probar: "Experimente",
  equipo: "E o resto da equipe",
  casos: {
    citas: {
      intro: "Marcar, confirmar e remarcar toma o seu dia.",
      agentes: {
        lola: "Responde o seu WhatsApp, marca e confirma os horários.",
        clara: "Avisa dos e-mails urgentes, como uma mudança de horário.",
        victor: "Escreve para quem faltou ou perguntou e não marcou.",
        iris: "Monta o seu relatório mensal de horários.",
      },
    },
    mensajes: {
      intro: "Perguntam a mesma coisa o dia todo, à noite também.",
      agentes: {
        lola: "Responde preços, horários e formas de pagamento pelo WhatsApp.",
        victor: "Acompanha quem perguntou e não marcou.",
        clara: "Organiza o seu e-mail por urgência.",
        iris: "Escreve documentos e resumos quando você precisa.",
      },
    },
    regresan: {
      intro: "O que mais vende é o cliente voltar.",
      agentes: {
        victor: "Escreve para quem não voltou e pede avaliações depois de cada visita.",
        lola: "Confirma os horários de amanhã e remarca quem não pode.",
        clara: "Avisa de pagamentos e cobranças pendentes.",
        iris: "Compara os seus preços com os de negócios próximos.",
      },
    },
    oficina: {
      intro: "E-mails, faturas e relatórios se acumulam enquanto você atende.",
      agentes: {
        iris: "Escreve documentos e monta os seus relatórios.",
        clara: "Resume o seu e-mail e avisa das faturas a vencer.",
        lola: "Cuida do seu WhatsApp enquanto você trabalha.",
        victor: "Acompanha os seus clientes e pede avaliações.",
      },
    },
  },
};

const FR: TextosParaQuien = {
  texto: "Choisissez votre cas et voyez comment l'équipe vous aide.",
  probar: "Essayer",
  equipo: "Et le reste de l'équipe",
  casos: {
    citas: {
      intro: "Prendre, confirmer et déplacer des rendez-vous vous prend la journée.",
      agentes: {
        lola: "Répond sur votre WhatsApp, prend et confirme les rendez-vous.",
        clara: "Vous signale les e-mails urgents, comme un rendez-vous déplacé.",
        victor: "Écrit à ceux qui n'ont pas honoré leur rendez-vous ou n'ont pas réservé.",
        iris: "Prépare votre rapport mensuel des rendez-vous.",
      },
    },
    mensajes: {
      intro: "On vous pose les mêmes questions toute la journée, le soir aussi.",
      agentes: {
        lola: "Répond sur les prix, les horaires et les moyens de paiement sur WhatsApp.",
        victor: "Relance ceux qui ont demandé sans réserver.",
        clara: "Trie vos e-mails par urgence.",
        iris: "Rédige documents et résumés quand vous en avez besoin.",
      },
    },
    regresan: {
      intro: "Ce qui fait vendre, c'est que vos clients reviennent.",
      agentes: {
        victor: "Écrit à ceux qui ne sont pas revenus et demande un avis après chaque visite.",
        lola: "Confirme les rendez-vous du lendemain et déplace ceux qui ne peuvent pas venir.",
        clara: "Vous signale les paiements en attente.",
        iris: "Compare vos prix avec ceux des commerces voisins.",
      },
    },
    oficina: {
      intro: "E-mails, factures et rapports s'accumulent pendant que vous servez vos clients.",
      agentes: {
        iris: "Rédige vos documents et prépare vos rapports.",
        clara: "Résume vos e-mails et vous signale les factures qui arrivent à échéance.",
        lola: "S'occupe de votre WhatsApp pendant que vous travaillez.",
        victor: "Relance vos clients et demande des avis.",
      },
    },
  },
};

const DE: TextosParaQuien = {
  texto: "Wähle deinen Fall und sieh, wie das Team hilft.",
  probar: "Ausprobieren",
  equipo: "Und der Rest des Teams",
  casos: {
    citas: {
      intro: "Termine vereinbaren, bestätigen und verschieben kostet dich den ganzen Tag.",
      agentes: {
        lola: "Beantwortet dein WhatsApp, vereinbart und bestätigt Termine.",
        clara: "Meldet dringende E-Mails, etwa einen verschobenen Termin.",
        victor: "Schreibt allen, die nicht gekommen sind oder gefragt und nicht gebucht haben.",
        iris: "Erstellt deinen monatlichen Terminbericht.",
      },
    },
    mensajes: {
      intro: "Du bekommst den ganzen Tag dieselben Fragen, auch nachts.",
      agentes: {
        lola: "Beantwortet Preise, Öffnungszeiten und Zahlungsarten auf WhatsApp.",
        victor: "Fasst bei allen nach, die gefragt und nicht gebucht haben.",
        clara: "Sortiert deine E-Mails nach Dringlichkeit.",
        iris: "Schreibt Dokumente und Zusammenfassungen, wenn du sie brauchst.",
      },
    },
    regresan: {
      intro: "Am meisten verkaufst du, wenn deine Kunden wiederkommen.",
      agentes: {
        victor: "Schreibt allen, die nicht wiedergekommen sind, und bittet nach jedem Besuch um eine Bewertung.",
        lola: "Bestätigt die Termine für morgen und verschiebt, wer nicht kann.",
        clara: "Meldet offene Zahlungen.",
        iris: "Vergleicht deine Preise mit Geschäften in der Nähe.",
      },
    },
    oficina: {
      intro: "E-Mails, Rechnungen und Berichte stapeln sich, während du Kunden bedienst.",
      agentes: {
        iris: "Schreibt Dokumente und erstellt deine Berichte.",
        clara: "Fasst deine E-Mails zusammen und meldet bald fällige Rechnungen.",
        lola: "Kümmert sich um dein WhatsApp, während du arbeitest.",
        victor: "Fasst bei deinen Kunden nach und bittet um Bewertungen.",
      },
    },
  },
};

const IT: TextosParaQuien = {
  texto: "Scegli il tuo caso e guarda come ti aiuta il team.",
  probar: "Provalo",
  equipo: "E il resto del team",
  casos: {
    citas: {
      intro: "Fissare, confermare e spostare appuntamenti ti porta via la giornata.",
      agentes: {
        lola: "Risponde al tuo WhatsApp, fissa e conferma gli appuntamenti.",
        clara: "Ti segnala le email urgenti, come un appuntamento spostato.",
        victor: "Scrive a chi non si è presentato o ha chiesto senza prenotare.",
        iris: "Prepara il tuo report mensile degli appuntamenti.",
      },
    },
    mensajes: {
      intro: "Ti fanno le stesse domande tutto il giorno, anche di notte.",
      agentes: {
        lola: "Risponde su prezzi, orari e metodi di pagamento su WhatsApp.",
        victor: "Ricontatta chi ha chiesto senza prenotare.",
        clara: "Ordina la tua email per urgenza.",
        iris: "Scrive documenti e riassunti quando ti servono.",
      },
    },
    regresan: {
      intro: "Quello che vende di più è che i clienti tornino.",
      agentes: {
        victor: "Scrive a chi non è tornato e chiede una recensione dopo ogni visita.",
        lola: "Conferma gli appuntamenti di domani e sposta chi non può.",
        clara: "Ti avvisa dei pagamenti in sospeso.",
        iris: "Confronta i tuoi prezzi con quelli delle attività vicine.",
      },
    },
    oficina: {
      intro: "Email, fatture e report si accumulano mentre servi i clienti.",
      agentes: {
        iris: "Scrive documenti e prepara i tuoi report.",
        clara: "Riassume la tua email e ti avvisa delle fatture in scadenza.",
        lola: "Gestisce il tuo WhatsApp mentre lavori.",
        victor: "Ricontatta i tuoi clienti e chiede recensioni.",
      },
    },
  },
};

const ZH: TextosParaQuien = {
  texto: "选一个符合你的情况，看看团队怎么帮你。",
  probar: "试试看",
  equipo: "团队其他成员",
  casos: {
    citas: {
      intro: "预约、确认和改期占掉你一整天。",
      agentes: {
        lola: "回复你的 WhatsApp，安排并确认预约。",
        clara: "提醒你紧急邮件，比如预约有变动。",
        victor: "联系爽约或咨询后没预约的客人。",
        iris: "整理你的每月预约报告。",
      },
    },
    mensajes: {
      intro: "一整天都有人问同样的问题，晚上也是。",
      agentes: {
        lola: "在 WhatsApp 上回答价格、营业时间和付款方式。",
        victor: "跟进咨询后没预约的客人。",
        clara: "按紧急程度整理你的邮件。",
        iris: "在你需要时撰写文件和摘要。",
      },
    },
    regresan: {
      intro: "最能带来生意的，是客人再回来。",
      agentes: {
        victor: "联系很久没来的客人，每次到店后请他们留评价。",
        lola: "确认明天的预约，帮来不了的客人改期。",
        clara: "提醒你待收的款项。",
        iris: "把你的价格和附近商家做比较。",
      },
    },
    oficina: {
      intro: "你忙着接待客人时，邮件、发票和报告越堆越多。",
      agentes: {
        iris: "撰写文件，整理你的报告。",
        clara: "总结你的邮件，提醒快到期的发票。",
        lola: "你工作时帮你处理 WhatsApp。",
        victor: "跟进你的客人并请他们留评价。",
      },
    },
  },
};

const POR_IDIOMA: Record<string, TextosParaQuien> = { es: ES, en: EN, pt: PT, fr: FR, de: DE, it: IT, zh: ZH };

export const textosParaQuien = (idioma: string): TextosParaQuien => POR_IDIOMA[idioma] ?? EN;

/**
 * Más casos (además de los cuatro de src/lib/contenido.ts): ventas en línea, facturas y cobros,
 * y proveedores. Solo lo que el equipo de verdad hace con las apps del catálogo (Shopify, Mercado
 * Libre y Stripe los ven Rigel y Mira; las facturas electrónicas, Mira; el correo, Altair). Quién
 * va al frente y en qué orden van los demás es igual en todos los idiomas.
 */
type IdExtra = "ventas" | "cobros" | "proveedores";
const ORDEN_EXTRA: { id: IdExtra; frente: IdAgente; resto: IdAgente[] }[] = [
  { id: "ventas", frente: "victor", resto: ["lola", "clara", "iris"] },
  { id: "cobros", frente: "clara", resto: ["iris", "lola", "victor"] },
  { id: "proveedores", frente: "iris", resto: ["clara", "victor", "lola"] },
];
type TextoExtra = { corto: string; nombre: string; intro: string; agentes: Record<IdAgente, string> };

const EXTRA: Record<string, Record<IdExtra, TextoExtra>> = {
  es: {
    ventas: {
      corto: "Ventas en línea",
      nombre: "Vendes en línea",
      intro: "Preguntas, pedidos y pagos llegan a toda hora.",
      agentes: {
        victor: "Da seguimiento a quien preguntó y no compró, y pide reseñas.",
        lola: "Responde por WhatsApp e Instagram dudas de precios y pedidos.",
        clara: "Te avisa de los pedidos y pagos que llegan a tu correo.",
        iris: "Arma tu reporte semanal de ventas.",
      },
    },
    cobros: {
      corto: "Facturas y cobros",
      nombre: "Cobras y facturas",
      intro: "Facturas, pagos y comprobantes se pierden entre correos.",
      agentes: {
        clara: "Encuentra tus facturas y te avisa antes de que venzan.",
        iris: "Resume tus facturas electrónicas (CFDI) del mes.",
        lola: "Responde por WhatsApp dudas de pagos y formas de pago.",
        victor: "Da seguimiento a tus clientes y pide reseñas.",
      },
    },
    proveedores: {
      corto: "Proveedores",
      nombre: "Compras a proveedores",
      intro: "Cotizar y comparar proveedores te quita horas.",
      agentes: {
        iris: "Investiga proveedores y precios, y te deja una tabla para comparar.",
        clara: "Escribe a tus proveedores desde tu correo, con tu aprobación.",
        victor: "Avisa a tus clientes de lo nuevo, con tu aprobación.",
        lola: "Atiende tu WhatsApp mientras tú cotizas.",
      },
    },
  },
  en: {
    ventas: {
      corto: "Online sales",
      nombre: "You sell online",
      intro: "Questions, orders and payments come in at all hours.",
      agentes: {
        victor: "Follows up with whoever asked and didn't buy, and asks for reviews.",
        lola: "Answers questions about prices and orders on WhatsApp and Instagram.",
        clara: "Lets you know about orders and payments that reach your email.",
        iris: "Puts together your weekly sales report.",
      },
    },
    cobros: {
      corto: "Invoices and payments",
      nombre: "You invoice and collect",
      intro: "Invoices, payments and receipts get lost in your email.",
      agentes: {
        clara: "Finds your invoices and warns you before they're due.",
        iris: "Summarizes your e-invoices (CFDI) for the month.",
        lola: "Answers questions about payments and payment options on WhatsApp.",
        victor: "Follows up with your clients and asks for reviews.",
      },
    },
    proveedores: {
      corto: "Suppliers",
      nombre: "You buy from suppliers",
      intro: "Getting quotes and comparing suppliers takes hours.",
      agentes: {
        iris: "Researches suppliers and prices, and leaves you a table to compare.",
        clara: "Writes to your suppliers from your email, with your approval.",
        victor: "Tells your clients about what's new, with your approval.",
        lola: "Handles your WhatsApp while you get quotes.",
      },
    },
  },
  pt: {
    ventas: {
      corto: "Vendas online",
      nombre: "Você vende online",
      intro: "Perguntas, pedidos e pagamentos chegam a qualquer hora.",
      agentes: {
        victor: "Acompanha quem perguntou e não comprou, e pede avaliações.",
        lola: "Responde no WhatsApp e no Instagram dúvidas de preços e pedidos.",
        clara: "Avisa dos pedidos e pagamentos que chegam ao seu e-mail.",
        iris: "Monta o seu relatório semanal de vendas.",
      },
    },
    cobros: {
      corto: "Faturas e cobranças",
      nombre: "Você fatura e cobra",
      intro: "Faturas, pagamentos e comprovantes se perdem entre os e-mails.",
      agentes: {
        clara: "Encontra as suas faturas e avisa antes do vencimento.",
        iris: "Resume as suas faturas eletrônicas (CFDI) do mês.",
        lola: "Responde no WhatsApp dúvidas de pagamentos e formas de pagamento.",
        victor: "Acompanha os seus clientes e pede avaliações.",
      },
    },
    proveedores: {
      corto: "Fornecedores",
      nombre: "Você compra de fornecedores",
      intro: "Cotar e comparar fornecedores toma horas.",
      agentes: {
        iris: "Pesquisa fornecedores e preços, e deixa uma tabela para comparar.",
        clara: "Escreve aos seus fornecedores pelo seu e-mail, com a sua aprovação.",
        victor: "Avisa os seus clientes das novidades, com a sua aprovação.",
        lola: "Cuida do seu WhatsApp enquanto você faz cotações.",
      },
    },
  },
  fr: {
    ventas: {
      corto: "Ventes en ligne",
      nombre: "Vous vendez en ligne",
      intro: "Questions, commandes et paiements arrivent à toute heure.",
      agentes: {
        victor: "Relance ceux qui ont demandé sans acheter, et demande des avis.",
        lola: "Répond sur WhatsApp et Instagram aux questions sur les prix et les commandes.",
        clara: "Vous signale les commandes et paiements qui arrivent dans vos e-mails.",
        iris: "Prépare votre rapport hebdomadaire des ventes.",
      },
    },
    cobros: {
      corto: "Factures et encaissements",
      nombre: "Vous facturez et encaissez",
      intro: "Factures, paiements et reçus se perdent dans vos e-mails.",
      agentes: {
        clara: "Retrouve vos factures et vous prévient avant l'échéance.",
        iris: "Résume vos factures électroniques (CFDI) du mois.",
        lola: "Répond sur WhatsApp aux questions sur les paiements et les moyens de paiement.",
        victor: "Relance vos clients et demande des avis.",
      },
    },
    proveedores: {
      corto: "Fournisseurs",
      nombre: "Vous achetez à des fournisseurs",
      intro: "Demander des devis et comparer les fournisseurs prend des heures.",
      agentes: {
        iris: "Recherche fournisseurs et prix, et vous laisse un tableau pour comparer.",
        clara: "Écrit à vos fournisseurs depuis votre e-mail, avec votre accord.",
        victor: "Informe vos clients des nouveautés, avec votre accord.",
        lola: "S'occupe de votre WhatsApp pendant que vous demandez des devis.",
      },
    },
  },
  de: {
    ventas: {
      corto: "Onlineverkauf",
      nombre: "Du verkaufst online",
      intro: "Fragen, Bestellungen und Zahlungen kommen zu jeder Uhrzeit.",
      agentes: {
        victor: "Fasst bei allen nach, die gefragt und nicht gekauft haben, und bittet um Bewertungen.",
        lola: "Beantwortet auf WhatsApp und Instagram Fragen zu Preisen und Bestellungen.",
        clara: "Meldet Bestellungen und Zahlungen, die per E-Mail kommen.",
        iris: "Erstellt deinen wöchentlichen Verkaufsbericht.",
      },
    },
    cobros: {
      corto: "Rechnungen und Zahlungen",
      nombre: "Du stellst Rechnungen und kassierst",
      intro: "Rechnungen, Zahlungen und Belege gehen zwischen E-Mails verloren.",
      agentes: {
        clara: "Findet deine Rechnungen und erinnert dich vor der Fälligkeit.",
        iris: "Fasst deine E-Rechnungen (CFDI) des Monats zusammen.",
        lola: "Beantwortet auf WhatsApp Fragen zu Zahlungen und Zahlungsarten.",
        victor: "Fasst bei deinen Kunden nach und bittet um Bewertungen.",
      },
    },
    proveedores: {
      corto: "Lieferanten",
      nombre: "Du kaufst bei Lieferanten",
      intro: "Angebote einholen und Lieferanten vergleichen kostet Stunden.",
      agentes: {
        iris: "Recherchiert Lieferanten und Preise und legt dir eine Vergleichstabelle hin.",
        clara: "Schreibt deinen Lieferanten von deiner E-Mail aus, mit deiner Freigabe.",
        victor: "Informiert deine Kunden über Neues, mit deiner Freigabe.",
        lola: "Kümmert sich um dein WhatsApp, während du Angebote einholst.",
      },
    },
  },
  it: {
    ventas: {
      corto: "Vendite online",
      nombre: "Vendi online",
      intro: "Domande, ordini e pagamenti arrivano a ogni ora.",
      agentes: {
        victor: "Ricontatta chi ha chiesto senza comprare, e chiede recensioni.",
        lola: "Risponde su WhatsApp e Instagram a domande su prezzi e ordini.",
        clara: "Ti avvisa degli ordini e dei pagamenti che arrivano nella tua email.",
        iris: "Prepara il tuo report settimanale delle vendite.",
      },
    },
    cobros: {
      corto: "Fatture e incassi",
      nombre: "Fatturi e incassi",
      intro: "Fatture, pagamenti e ricevute si perdono tra le email.",
      agentes: {
        clara: "Trova le tue fatture e ti avvisa prima della scadenza.",
        iris: "Riassume le tue fatture elettroniche (CFDI) del mese.",
        lola: "Risponde su WhatsApp a domande su pagamenti e metodi di pagamento.",
        victor: "Ricontatta i tuoi clienti e chiede recensioni.",
      },
    },
    proveedores: {
      corto: "Fornitori",
      nombre: "Compri dai fornitori",
      intro: "Chiedere preventivi e confrontare fornitori richiede ore.",
      agentes: {
        iris: "Cerca fornitori e prezzi, e ti lascia una tabella per confrontarli.",
        clara: "Scrive ai tuoi fornitori dalla tua email, con la tua approvazione.",
        victor: "Avvisa i tuoi clienti delle novità, con la tua approvazione.",
        lola: "Gestisce il tuo WhatsApp mentre chiedi preventivi.",
      },
    },
  },
  zh: {
    ventas: {
      corto: "网上销售",
      nombre: "你在网上卖东西",
      intro: "咨询、订单和付款随时都会进来。",
      agentes: {
        victor: "跟进咨询后没下单的客人，并请他们留评价。",
        lola: "在 WhatsApp 和 Instagram 上回答价格和订单问题。",
        clara: "提醒你邮箱里收到的订单和付款。",
        iris: "整理你的每周销售报告。",
      },
    },
    cobros: {
      corto: "发票和收款",
      nombre: "你要开票和收款",
      intro: "发票、付款和凭证淹没在邮件里。",
      agentes: {
        clara: "找出你的发票，并在到期前提醒你。",
        iris: "汇总你本月的电子发票（CFDI）。",
        lola: "在 WhatsApp 上回答付款和付款方式的问题。",
        victor: "跟进你的客人并请他们留评价。",
      },
    },
    proveedores: {
      corto: "供应商",
      nombre: "你要向供应商采购",
      intro: "询价和比较供应商要花好几个小时。",
      agentes: {
        iris: "调研供应商和价格，给你一张对比表。",
        clara: "经你批准后，用你的邮箱给供应商写信。",
        victor: "经你批准后，告诉客人有什么新东西。",
        lola: "你询价的时候，帮你处理 WhatsApp。",
      },
    },
  },
};

export type CasoExtra = { id: IdExtra; corto: string; nombre: string; intro: string; frente: IdAgente; resto: IdAgente[]; agentes: Record<IdAgente, string> };

export const casosExtra = (idioma: string): CasoExtra[] => {
  const T = EXTRA[idioma] ?? EXTRA.en;
  return ORDEN_EXTRA.map((o) => ({ ...o, ...T[o.id] }));
};
