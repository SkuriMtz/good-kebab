/**
 * Los textos de lo nuevo de la landing combinada (vista previa en /vista-zapia), en los 7
 * idiomas del sitio. Son de Atendel: pedidos de ejemplo de cosas que sí hace. Cuando pase a
 * «/», se mudan a src/i18n.
 */

type TextosMezcla = {
  /** Lo que se lee al tocar la caja (para lectores de pantalla). */
  pidele: string;
  /** Los pedidos que la caja escribe sola, uno tras otro. */
  ejemplos: string[];
};

const TEXTOS: Record<string, TextosMezcla> = {
  es: {
    pidele: "Pídeselo a Atendel",
    ejemplos: ["Confirma las citas de mañana", "¿Qué es urgente en mi correo?", "Pídeles reseña a los clientes de hoy", "Hazme el reporte de ventas del mes"],
  },
  en: {
    pidele: "Ask Atendel",
    ejemplos: ["Confirm tomorrow's appointments", "What's urgent in my email?", "Ask today's clients for a review", "Make this month's sales report"],
  },
  pt: {
    pidele: "Peça ao Atendel",
    ejemplos: ["Confirme os agendamentos de amanhã", "O que é urgente no meu e-mail?", "Peça avaliação aos clientes de hoje", "Faça o relatório de vendas do mês"],
  },
  fr: {
    pidele: "Demandez à Atendel",
    ejemplos: ["Confirme les rendez-vous de demain", "Qu'est-ce qui est urgent dans mes e-mails ?", "Demande un avis aux clients du jour", "Fais le rapport des ventes du mois"],
  },
  de: {
    pidele: "Frag Atendel",
    ejemplos: ["Bestätige die Termine für morgen", "Was ist in meinen E-Mails dringend?", "Bitte die Kunden von heute um eine Bewertung", "Erstelle den Umsatzbericht des Monats"],
  },
  it: {
    pidele: "Chiedilo ad Atendel",
    ejemplos: ["Conferma gli appuntamenti di domani", "Cosa c'è di urgente nella mia email?", "Chiedi una recensione ai clienti di oggi", "Prepara il report vendite del mese"],
  },
  zh: {
    pidele: "交给 Atendel",
    ejemplos: ["确认明天的预约", "我的邮件里有什么急事？", "请今天的客人留个评价", "做一份本月销售报告"],
  },
};

export const textosMezcla = (idioma: string): TextosMezcla => TEXTOS[idioma] ?? TEXTOS.en;
