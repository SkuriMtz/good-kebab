import type { IdAgente } from "@/lib/agentes";

/**
 * La primera línea del cierre («… Deja que Atendel lo haga.») cambia según la página. La
 * segunda línea no cambia (d.inicio.cierre.linea2). En los 7 idiomas del sitio.
 */
export type PaginaCierre = "apps" | "agentes" | IdAgente | "precios" | "preguntas" | "paraQuien" | "contacto" | "cuando";

const ES: Record<PaginaCierre, string> = {
  apps: "Contestar correos, mover citas, revisar cobros.",
  agentes: "WhatsApp, correo, clientes y oficina.",
  lola: "Tus clientes esperan respuesta.",
  clara: "Tu bandeja no se va a vaciar sola.",
  victor: "Tus clientes de antes pueden volver.",
  iris: "Ese reporte no se va a hacer solo.",
  precios: "Elige el plan a tu medida.",
  preguntas: "Ya sabes cómo funciona.",
  paraQuien: "Sea cual sea tu negocio.",
  contacto: "Tus clientes también merecen respuesta.",
  cuando: "Los lugares ya se están abriendo.",
};

const EN: Record<PaginaCierre, string> = {
  apps: "Answering emails, moving appointments, checking payments.",
  agentes: "WhatsApp, email, clients and office work.",
  lola: "Your clients are waiting for an answer.",
  clara: "Your inbox won't empty itself.",
  victor: "Your past clients can come back.",
  iris: "That report won't write itself.",
  precios: "Pick the plan that fits you.",
  preguntas: "Now you know how it works.",
  paraQuien: "Whatever your business.",
  contacto: "Your clients deserve an answer too.",
  cuando: "Spots are opening up.",
};

const PT: Record<PaginaCierre, string> = {
  apps: "Responder e-mails, mudar horários, conferir pagamentos.",
  agentes: "WhatsApp, e-mail, clientes e escritório.",
  lola: "Seus clientes esperam resposta.",
  clara: "Sua caixa de entrada não vai se esvaziar sozinha.",
  victor: "Seus clientes de antes podem voltar.",
  iris: "Esse relatório não vai se fazer sozinho.",
  precios: "Escolha o plano na sua medida.",
  preguntas: "Agora você já sabe como funciona.",
  paraQuien: "Seja qual for o seu negócio.",
  contacto: "Seus clientes também merecem resposta.",
  cuando: "As vagas já estão abrindo.",
};

const FR: Record<PaginaCierre, string> = {
  apps: "Répondre aux e-mails, déplacer des rendez-vous, vérifier les paiements.",
  agentes: "WhatsApp, e-mails, clients et bureau.",
  lola: "Vos clients attendent une réponse.",
  clara: "Votre boîte mail ne va pas se vider toute seule.",
  victor: "Vos anciens clients peuvent revenir.",
  iris: "Ce rapport ne va pas se faire tout seul.",
  precios: "Choisissez le plan qui vous va.",
  preguntas: "Vous savez maintenant comment ça marche.",
  paraQuien: "Quelle que soit votre activité.",
  contacto: "Vos clients méritent aussi une réponse.",
  cuando: "Les places commencent à ouvrir.",
};

const DE: Record<PaginaCierre, string> = {
  apps: "E-Mails beantworten, Termine verschieben, Zahlungen prüfen.",
  agentes: "WhatsApp, E-Mail, Kunden und Büro.",
  lola: "Deine Kunden warten auf eine Antwort.",
  clara: "Dein Posteingang leert sich nicht von selbst.",
  victor: "Deine früheren Kunden können wiederkommen.",
  iris: "Dieser Bericht schreibt sich nicht von selbst.",
  precios: "Wähle den Plan, der zu dir passt.",
  preguntas: "Jetzt weißt du, wie es funktioniert.",
  paraQuien: "Egal, welches Geschäft du hast.",
  contacto: "Auch deine Kunden verdienen eine Antwort.",
  cuando: "Die Plätze öffnen sich schon.",
};

const IT: Record<PaginaCierre, string> = {
  apps: "Rispondere alle email, spostare appuntamenti, controllare i pagamenti.",
  agentes: "WhatsApp, email, clienti e ufficio.",
  lola: "I tuoi clienti aspettano una risposta.",
  clara: "La tua casella non si svuoterà da sola.",
  victor: "I tuoi vecchi clienti possono tornare.",
  iris: "Quel report non si farà da solo.",
  precios: "Scegli il piano su misura per te.",
  preguntas: "Ora sai come funziona.",
  paraQuien: "Qualunque sia la tua attività.",
  contacto: "Anche i tuoi clienti meritano una risposta.",
  cuando: "I posti si stanno già aprendo.",
};

const ZH: Record<PaginaCierre, string> = {
  apps: "回复邮件、调整预约、核对收款。",
  agentes: "WhatsApp、邮件、客户和办公室。",
  lola: "你的客人在等回复。",
  clara: "收件箱不会自己清空。",
  victor: "老客人也能再回来。",
  iris: "那份报告不会自己写好。",
  precios: "选一个适合你的方案。",
  preguntas: "现在你知道它怎么运作了。",
  paraQuien: "不管你做什么生意。",
  contacto: "你的客人也值得得到回复。",
  cuando: "名额已经开始开放。",
};

const POR_IDIOMA: Record<string, Record<PaginaCierre, string>> = { es: ES, en: EN, pt: PT, fr: FR, de: DE, it: IT, zh: ZH };

export const fraseCierre = (idioma: string, pagina: PaginaCierre): string | undefined => POR_IDIOMA[idioma]?.[pagina];
