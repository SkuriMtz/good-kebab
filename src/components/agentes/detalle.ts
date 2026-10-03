import type { IdAgente } from "@/lib/agentes";

/**
 * Lo que se cuenta de cada agente en su ficha (el modal de la página de inicio).
 * Las conversaciones son ejemplos con nombres ficticios.
 */

export type MensajeEjemplo = { de: "otro" | "agente" | "nota"; quien?: string; texto: string; hora?: string };

export type DetalleAgente = {
  descripcion: string;
  funciones: { titulo: string; detalle: string }[];
  /** Dónde pasa la conversación de ejemplo (WhatsApp, correo…). */
  canal: string;
  conversacion: MensajeEjemplo[];
};

export const DETALLE: Record<IdAgente, DetalleAgente> = {
  lola: {
    descripcion:
      "Lola es tu recepcionista en WhatsApp. Contesta a tus clientes al momento y a cualquier hora, resuelve las dudas de siempre y lleva tus citas de principio a fin. Cuando una conversación necesita a una persona, te avisa y te la pasa.",
    funciones: [
      { titulo: "Contesta al momento", detalle: "Responde los mensajes de WhatsApp a cualquier hora, con el tono de tu negocio." },
      { titulo: "Resuelve preguntas frecuentes", detalle: "Precios, horarios, ubicación, formas de pago y cómo prepararse para cada servicio." },
      { titulo: "Agenda citas", detalle: "Ofrece los horarios libres y aparta el lugar sin encimar citas." },
      { titulo: "Confirma y recuerda", detalle: "Manda recordatorios antes de cada cita y anota quién confirmó." },
      { titulo: "Te pasa a una persona", detalle: "Si hay una queja, una duda médica o el cliente lo pide, te avisa de inmediato." },
    ],
    canal: "WhatsApp",
    conversacion: [
      { de: "otro", quien: "Mariana", hora: "10:42", texto: "Hola! cuánto cuesta la limpieza facial? tienen lugar el jueves?" },
      {
        de: "agente",
        hora: "10:42",
        texto: "¡Hola, Mariana! La limpieza facial profunda cuesta $850 y dura una hora. El jueves tengo 11:00 o 16:30, ¿cuál te acomoda?",
      },
      { de: "otro", quien: "Mariana", hora: "10:44", texto: "16:30 porfa" },
      { de: "agente", hora: "10:44", texto: "Listo, te esperamos el jueves a las 16:30. Un día antes te mando un recordatorio." },
      { de: "nota", texto: "Cita creada: jueves 16:30 · limpieza facial" },
    ],
  },
  clara: {
    descripcion:
      "Clara pone en orden el correo de tu negocio. Lee lo que llega, te dice qué es urgente y qué puede esperar, te deja respuestas listas para revisar y cuida que no se te pase ninguna factura ni ningún pago.",
    funciones: [
      { titulo: "Resume tu bandeja", detalle: "Cada correo en una línea: quién escribe y qué necesita." },
      { titulo: "Ordena por urgencia", detalle: "Lo urgente primero, luego lo de hoy y al final las promociones." },
      { titulo: "Sugiere respuestas", detalle: "Borradores claros y amables; tú decides si se envían." },
      { titulo: "Detecta facturas y pagos", detalle: "Montos, fechas límite y pagos recibidos, en una sola lista." },
      { titulo: "Solo lee", detalle: "No envía ni borra nada sin tu permiso." },
    ],
    canal: "Correo",
    conversacion: [
      {
        de: "otro",
        quien: "Andrea Solís",
        hora: "9:15",
        texto: "Hola, ¿podría cambiar mi cita del martes a la tarde? En la mañana no alcanzo a llegar.",
      },
      {
        de: "agente",
        hora: "9:16",
        texto: "Borrador para ti: “Claro, Andrea. El martes tengo 17:00 o 18:30, ¿cuál prefieres? Quedo atenta.”",
      },
      { de: "nota", texto: "Marcado como “Hoy”. Se envía cuando tú lo apruebes." },
    ],
  },
  victor: {
    descripcion:
      "Víctor se encarga de que los clientes lleguen y regresen. Da seguimiento a quien preguntó y no agendó, reactiva a quien dejó de venir, rescata a quien faltó a su cita y pide una reseña cuando alguien sale contento.",
    funciones: [
      { titulo: "Sigue a quien no agendó", detalle: "Escribe por su nombre a quien preguntó y se quedó en el aire." },
      { titulo: "Reactiva clientes inactivos", detalle: "Encuentra a quien dejó de venir y le propone volver." },
      { titulo: "Rescata faltas", detalle: "A quien no llegó a su cita le ofrece otro horario." },
      { titulo: "Pide reseñas", detalle: "Después de cada cita pregunta cómo les fue y, si salieron contentos, les pide una reseña." },
      { titulo: "Sin presionar", detalle: "Mensajes personales, nunca promociones masivas ni insistentes." },
    ],
    canal: "WhatsApp",
    conversacion: [
      {
        de: "agente",
        hora: "11:05",
        texto: "Hola, Paola. La semana pasada preguntaste por botox. ¿Te aparto un lugar? Esta semana tengo viernes 12:00 o sábado 10:30.",
      },
      { de: "otro", quien: "Paola", hora: "11:20", texto: "Sí! el viernes me queda perfecto" },
      { de: "agente", hora: "11:20", texto: "Listo, Paola: viernes a las 12:00. Te mando la ubicación y un recordatorio un día antes." },
      { de: "nota", texto: "De prospecto a cita agendada" },
    ],
  },
  iris: {
    descripcion:
      "Iris hace el trabajo de oficina que nunca te da tiempo de hacer. Investiga lo que le pidas y te lo entrega en Excel, resume PDFs largos, arma el reporte mensual de citas y clientes, y prepara documentos como consentimientos y contratos.",
    funciones: [
      { titulo: "Investiga y lo pasa a Excel", detalle: "Compara precios, proveedores u opciones y te entrega la tabla." },
      { titulo: "Resume PDFs", detalle: "Contratos y documentos largos, en los puntos que importan." },
      { titulo: "Reporte mensual", detalle: "Citas, clientes nuevos y faltas del mes, comparados con el anterior." },
      { titulo: "Prepara documentos", detalle: "Consentimientos, contratos y cartas con tus formatos." },
      { titulo: "Te dice cómo verificar", detalle: "Cuando un dato puede cambiar —precios, trámites— te dice dónde confirmarlo." },
    ],
    canal: "Chat con Iris",
    conversacion: [
      { de: "otro", quien: "Tú", texto: "¿Cuánto cobran otras clínicas de la zona por depilación láser?" },
      {
        de: "agente",
        texto: "Revisé 4 clínicas cercanas: por sesión de axilas cobran entre $590 y $990. Tú estás en $750, a la mitad. Te dejé la tabla con fuentes en precios-laser.xlsx.",
      },
      { de: "otro", quien: "Tú", texto: "Perfecto. ¿Y el reporte de septiembre?" },
      {
        de: "agente",
        texto: "Listo: 342 citas (18 más que agosto), 47 clientes nuevos y 21 faltas. Te lo dejé en Excel y en PDF.",
      },
    ],
  },
};
