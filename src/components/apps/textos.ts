import type { CategoriaApp } from "@/lib/nucleo-tipos";

/**
 * Los textos cortos de /apps (el carrusel de tarjetas por tipo de app): qué hace Atendel en
 * cada tipo, en una frase, y los botones. En los 7 idiomas del sitio.
 */
type TextosApps = {
  anterior: string;
  siguiente: string;
  probar: string;
  pidele: string;
  tipos: Record<CategoriaApp, string>;
};

const ES: TextosApps = {
  anterior: "Anterior",
  siguiente: "Siguiente",
  probar: "Pruébalo",
  pidele: "Pídele",
  tipos: {
    correo: "Lee, resume y responde tus correos con tu aprobación.",
    mensajes: "Lee los mensajes que te mandan tus clientes.",
    agenda: "Crea, mueve y cancela citas sin que se encimen.",
    reservas: "Consulta tus citas, tus clientes y tus servicios.",
    documentos: "Lee y resume tus archivos y hojas de cálculo.",
    clientes: "Encuentra a tus clientes en tus contactos y tu CRM.",
    resenas: "Lee tus reseñas y propone cómo responderlas.",
    pagos: "Consulta tus cobros, pedidos y ventas. Nunca mueve dinero.",
    contabilidad: "Consulta tus facturas y cobros. Solo lectura.",
    facturacion: "Lee tus facturas electrónicas (CFDI). Solo lectura.",
  },
};

const EN: TextosApps = {
  anterior: "Previous",
  siguiente: "Next",
  probar: "Try it",
  pidele: "Ask",
  tipos: {
    correo: "Reads, summarizes and replies to your email with your approval.",
    mensajes: "Reads the messages your clients send you.",
    agenda: "Creates, moves and cancels appointments without overlaps.",
    reservas: "Checks your bookings, clients and services.",
    documentos: "Reads and summarizes your files and spreadsheets.",
    clientes: "Finds your clients in your contacts and CRM.",
    resenas: "Reads your reviews and suggests how to reply.",
    pagos: "Checks your payments, orders and sales. It never moves money.",
    contabilidad: "Checks your invoices and payments. Read only.",
    facturacion: "Reads your e-invoices (CFDI). Read only.",
  },
};

const PT: TextosApps = {
  anterior: "Anterior",
  siguiente: "Próximo",
  probar: "Experimente",
  pidele: "Peça",
  tipos: {
    correo: "Lê, resume e responde seus e-mails com a sua aprovação.",
    mensajes: "Lê as mensagens que seus clientes enviam.",
    agenda: "Cria, muda e cancela horários sem sobreposição.",
    reservas: "Consulta seus agendamentos, clientes e serviços.",
    documentos: "Lê e resume seus arquivos e planilhas.",
    clientes: "Encontra seus clientes nos contatos e no seu CRM.",
    resenas: "Lê suas avaliações e sugere como responder.",
    pagos: "Consulta seus pagamentos, pedidos e vendas. Nunca movimenta dinheiro.",
    contabilidad: "Consulta suas faturas e recebimentos. Só leitura.",
    facturacion: "Lê suas faturas eletrônicas (CFDI). Só leitura.",
  },
};

const FR: TextosApps = {
  anterior: "Précédent",
  siguiente: "Suivant",
  probar: "Essayer",
  pidele: "Demandez",
  tipos: {
    correo: "Lit, résume et répond à vos e-mails avec votre accord.",
    mensajes: "Lit les messages que vos clients vous envoient.",
    agenda: "Crée, déplace et annule des rendez-vous sans chevauchement.",
    reservas: "Consulte vos réservations, vos clients et vos services.",
    documentos: "Lit et résume vos fichiers et tableurs.",
    clientes: "Retrouve vos clients dans vos contacts et votre CRM.",
    resenas: "Lit vos avis et propose comment y répondre.",
    pagos: "Consulte vos paiements, commandes et ventes. Ne déplace jamais d'argent.",
    contabilidad: "Consulte vos factures et encaissements. Lecture seule.",
    facturacion: "Lit vos factures électroniques (CFDI). Lecture seule.",
  },
};

const DE: TextosApps = {
  anterior: "Zurück",
  siguiente: "Weiter",
  probar: "Ausprobieren",
  pidele: "Frag",
  tipos: {
    correo: "Liest, fasst zusammen und beantwortet deine E-Mails mit deiner Freigabe.",
    mensajes: "Liest die Nachrichten, die deine Kunden dir schicken.",
    agenda: "Erstellt, verschiebt und storniert Termine ohne Überschneidungen.",
    reservas: "Prüft deine Buchungen, Kunden und Leistungen.",
    documentos: "Liest deine Dateien und Tabellen und fasst sie zusammen.",
    clientes: "Findet deine Kunden in deinen Kontakten und deinem CRM.",
    resenas: "Liest deine Bewertungen und schlägt Antworten vor.",
    pagos: "Prüft deine Zahlungen, Bestellungen und Verkäufe. Bewegt nie Geld.",
    contabilidad: "Prüft deine Rechnungen und Zahlungseingänge. Nur lesen.",
    facturacion: "Liest deine E-Rechnungen (CFDI). Nur lesen.",
  },
};

const IT: TextosApps = {
  anterior: "Precedente",
  siguiente: "Successivo",
  probar: "Provalo",
  pidele: "Chiedi",
  tipos: {
    correo: "Legge, riassume e risponde alle tue email con la tua approvazione.",
    mensajes: "Legge i messaggi che ti mandano i tuoi clienti.",
    agenda: "Crea, sposta e cancella appuntamenti senza sovrapposizioni.",
    reservas: "Consulta le tue prenotazioni, i clienti e i servizi.",
    documentos: "Legge e riassume i tuoi file e fogli di calcolo.",
    clientes: "Trova i tuoi clienti nei contatti e nel CRM.",
    resenas: "Legge le tue recensioni e propone come rispondere.",
    pagos: "Consulta pagamenti, ordini e vendite. Non sposta mai denaro.",
    contabilidad: "Consulta fatture e incassi. Solo lettura.",
    facturacion: "Legge le tue fatture elettroniche (CFDI). Solo lettura.",
  },
};

const ZH: TextosApps = {
  anterior: "上一个",
  siguiente: "下一个",
  probar: "试试看",
  pidele: "问它",
  tipos: {
    correo: "阅读、总结并回复你的邮件，需经你批准。",
    mensajes: "阅读客人发给你的消息。",
    agenda: "创建、调整和取消预约，避免时间冲突。",
    reservas: "查看你的预订、客人和服务。",
    documentos: "阅读并总结你的文件和表格。",
    clientes: "在你的通讯录和 CRM 中找到客人。",
    resenas: "阅读你的评价并建议如何回复。",
    pagos: "查看你的收款、订单和销售。从不转移资金。",
    contabilidad: "查看你的发票和收款。只读。",
    facturacion: "读取你的电子发票（CFDI）。只读。",
  },
};

const POR_IDIOMA: Record<string, TextosApps> = { es: ES, en: EN, pt: PT, fr: FR, de: DE, it: IT, zh: ZH };

export const textosApps = (idioma: string): TextosApps => POR_IDIOMA[idioma] ?? EN;
