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
