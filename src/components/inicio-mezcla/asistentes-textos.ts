import type { IdAgente } from "@/lib/agentes";

/**
 * «Tus asistentes de IA» (el inicio): qué son y cómo trabajan, sin párrafos. Atendel son tus
 * asistentes: cada uno, en una línea, y tres pasos. En los 7 idiomas del sitio.
 */
type Textos = { titulo: string; roles: Record<IdAgente, string>; pasos: [string, string, string]; ver: string };

const POR_IDIOMA: Record<string, Textos> = {
  es: {
    titulo: "Tus asistentes de IA",
    roles: { lola: "Contesta tu WhatsApp y agenda citas", clara: "Lleva tu correo", victor: "Trae de vuelta a tus clientes", iris: "Hace el papeleo" },
    pasos: ["Llega un mensaje o tú pides algo", "Atendel se lo pasa al asistente indicado", "Lo resuelve y te avisa"],
    ver: "Conoce a tu equipo",
  },
  en: {
    titulo: "Your AI assistants",
    roles: { lola: "Answers your WhatsApp and books appointments", clara: "Handles your email", victor: "Brings your clients back", iris: "Does the paperwork" },
    pasos: ["A message comes in or you ask for something", "Atendel hands it to the right assistant", "It gets done and you get notified"],
    ver: "Meet your team",
  },
  pt: {
    titulo: "Seus assistentes de IA",
    roles: { lola: "Responde seu WhatsApp e marca horários", clara: "Cuida do seu e-mail", victor: "Traz seus clientes de volta", iris: "Faz a papelada" },
    pasos: ["Chega uma mensagem ou você pede algo", "O Atendel passa para o assistente certo", "Ele resolve e te avisa"],
    ver: "Conheça sua equipe",
  },
  fr: {
    titulo: "Vos assistants IA",
    roles: { lola: "Répond sur WhatsApp et prend les rendez-vous", clara: "Gère vos e-mails", victor: "Fait revenir vos clients", iris: "S'occupe de la paperasse" },
    pasos: ["Un message arrive ou vous demandez quelque chose", "Atendel le confie au bon assistant", "C'est fait, et vous êtes prévenu"],
    ver: "Découvrir votre équipe",
  },
  de: {
    titulo: "Deine KI-Assistenten",
    roles: { lola: "Beantwortet dein WhatsApp und vereinbart Termine", clara: "Kümmert sich um deine E-Mails", victor: "Holt deine Kunden zurück", iris: "Erledigt den Papierkram" },
    pasos: ["Eine Nachricht kommt oder du bittest um etwas", "Atendel gibt es dem passenden Assistenten", "Erledigt – und du bekommst Bescheid"],
    ver: "Lerne dein Team kennen",
  },
  it: {
    titulo: "I tuoi assistenti IA",
    roles: { lola: "Risponde su WhatsApp e fissa gli appuntamenti", clara: "Gestisce la tua email", victor: "Fa tornare i tuoi clienti", iris: "Si occupa delle scartoffie" },
    pasos: ["Arriva un messaggio o chiedi qualcosa", "Atendel lo passa all'assistente giusto", "Lo risolve e ti avvisa"],
    ver: "Conosci il tuo team",
  },
  zh: {
    titulo: "你的 AI 助手",
    roles: { lola: "回复 WhatsApp，安排预约", clara: "处理你的邮件", victor: "让老客人回来", iris: "处理文书工作" },
    pasos: ["来了一条消息，或你提出需求", "Atendel 交给合适的助手", "处理好后通知你"],
    ver: "认识你的团队",
  },
};

export const textosAsistentes = (idioma: string): Textos => POR_IDIOMA[idioma] ?? POR_IDIOMA.en;
