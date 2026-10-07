import type { PromptBarCommand } from "@/components/PromptBar";
import type { NombreIcono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/*
 * Guion del chat de demostración (inicio y /pruebalo). Todo es local: nada
 * de esto llama a la IA. Las cifras son de una clínica de ejemplo y se
 * repiten igual en todas las escenas para que la historia cuadre.
 */

/* ---------- Lo que deja hecho cada agente (panel "Resultado") ---------- */

export type EstadoResultado = "listo" | "aprobar" | "espera";

export type Resultado = {
  agente: IdAgente;
  /** Sello en Mono arriba del panel: dónde vive esto en tu negocio. */
  sello: string;
  titulo: string;
  sub?: string;
  estado: EstadoResultado;
  /** Para una cita: el día y la hora en grande. */
  cita?: { dia: string; hora: string };
  /** Renglones con ícono: lo que ya pasó o lo que sigue. */
  filas?: { icono: NombreIcono; texto: string }[];
  /** Lista con sello (urgencia, estado). */
  lista?: { marca: string; texto: string; fuerte?: boolean }[];
  tabla?: { columnas: string[]; filas: string[][]; pie?: [string, string] };
  /** Un archivo que quedó listo. */
  archivo?: { nombre: string; tipo: string };
  /** Un mensaje que está por salir (para el visto bueno). */
  borrador?: string;
};

export const TEXTO_ESTADO: Record<EstadoResultado, string> = {
  listo: "Listo",
  aprobar: "Espera tu visto bueno",
  espera: "Esperando respuesta",
};

export const RESULTADOS: Record<string, Resultado> = {
  "cita-sofia": {
    agente: "lola",
    sello: "Tu agenda · viernes",
    titulo: "Limpieza facial · 1 h",
    sub: "Sofía Ramírez · primera vez",
    estado: "listo",
    cita: { dia: "Vie", hora: "10:00" },
    filas: [
      { icono: "mensaje", texto: "Confirmación enviada por WhatsApp, con la ubicación" },
      { icono: "reloj", texto: "Recordatorio el jueves a las 10:00" },
      { icono: "documento", texto: "Llega 10 minutos antes para llenar su ficha" },
    ],
  },
  agendar: {
    agente: "lola",
    sello: "Tu agenda · esta semana",
    titulo: "Horarios ofrecidos",
    sub: "Limpieza facial · 1 h",
    estado: "espera",
    lista: [
      { marca: "Jue", texto: "11:00" },
      { marca: "Jue", texto: "16:30" },
      { marca: "Vie", texto: "10:00" },
    ],
    filas: [{ icono: "mensaje", texto: "Al elegir, le llega la confirmación por WhatsApp" }],
  },
  confirmar: {
    agente: "lola",
    sello: "Tu agenda · mañana",
    titulo: "12 citas recordadas",
    estado: "listo",
    lista: [
      { marca: "10", texto: "ya confirmaron" },
      { marca: "17:00", texto: "Carla Díaz pasa de 16:00 a 17:00", fuerte: true },
      { marca: "18:00", texto: "Rosa Peña no contesta; le vuelve a escribir" },
    ],
  },
  "resumir-correos": {
    agente: "clara",
    sello: "Tu bandeja · hoy",
    titulo: "23 correos, 3 importantes",
    estado: "listo",
    lista: [
      { marca: "Urgente", texto: "Insumos Médicos del Bajío: factura de $8,450, vence el jueves", fuerte: true },
      { marca: "Hoy", texto: "Andrea Solís quiere pasar su cita del martes a la tarde" },
      { marca: "Semana", texto: "El Dr. Vela te recomienda a una paciente para valoración" },
    ],
    filas: [{ icono: "correo", texto: "Los otros 20 son promociones y avisos" }],
  },
  facturas: {
    agente: "clara",
    sello: "Tus pagos · este mes",
    titulo: "4 movimientos",
    estado: "listo",
    tabla: {
      columnas: ["Concepto", "Monto"],
      filas: [
        ["Insumos Médicos del Bajío", "$8,450"],
        ["CFE", "$2,180"],
        ["Software de agenda", "$599"],
        ["Karla Vega (pago recibido)", "+$4,200"],
      ],
      pie: ["Por pagar", "$11,229"],
    },
  },
  seguimiento: {
    agente: "victor",
    sello: "Seguimiento · botox",
    titulo: "12 personas por contactar",
    sub: "Preguntaron en las últimas dos semanas y no agendaron",
    estado: "aprobar",
    borrador: "Hola, Paola. La semana pasada preguntaste por botox. ¿Te aparto un lugar? Tengo viernes 12:00 o sábado 10:30.",
    filas: [{ icono: "reloj", texto: "Sale hoy a mediodía, cuando lo apruebes" }],
  },
  "seguimiento-enviado": {
    agente: "victor",
    sello: "Seguimiento · botox",
    titulo: "Enviado a 12 personas",
    estado: "listo",
    lista: [
      { marca: "3", texto: "ya contestaron", fuerte: true },
      { marca: "Lola", texto: "les está apartando cita" },
    ],
    filas: [{ icono: "mensaje", texto: "Cada mensaje con el nombre de la persona" }],
  },
  reactivar: {
    agente: "victor",
    sello: "Clientes · sin venir desde junio",
    titulo: "31 clientes por reactivar",
    estado: "aprobar",
    borrador: "Hola, Laura. Hace tiempo que no te vemos. Este mes tu limpieza facial va con 20% menos, ¿te aparto un lugar?",
    filas: [{ icono: "reloj", texto: "A quien no conteste, otro mensaje en 5 días" }],
  },
  "reactivar-enviado": {
    agente: "victor",
    sello: "Clientes · sin venir desde junio",
    titulo: "Enviado a 31 clientes",
    estado: "listo",
    filas: [
      { icono: "mensaje", texto: "Cada mensaje con el nombre de la persona" },
      { icono: "reloj", texto: "A quien no conteste, otro mensaje en 5 días" },
      { icono: "usuarios", texto: "Te avisa quién regresa" },
    ],
  },
  reporte: {
    agente: "iris",
    sello: "Reporte · septiembre",
    titulo: "Septiembre contra agosto",
    estado: "listo",
    tabla: {
      columnas: ["", "Sep", "Ago"],
      filas: [
        ["Citas", "342", "324"],
        ["Clientes nuevos", "47", "39"],
        ["Faltas", "21", "26"],
      ],
    },
    archivo: { nombre: "Reporte de septiembre", tipo: "Excel y PDF" },
  },
  "reporte-excel": {
    agente: "iris",
    sello: "Reporte · septiembre",
    titulo: "Septiembre contra agosto",
    estado: "listo",
    tabla: {
      columnas: ["", "Sep", "Ago"],
      filas: [
        ["Citas", "342", "324"],
        ["Clientes nuevos", "47", "39"],
        ["Faltas", "21", "26"],
      ],
    },
    archivo: { nombre: "Cierre de septiembre", tipo: "Excel · hoja de citas y de pagos" },
  },
  investigar: {
    agente: "iris",
    sello: "Investigación · láser de axilas",
    titulo: "4 clínicas cercanas",
    estado: "listo",
    tabla: {
      columnas: ["", "Sesión", "Paquete"],
      filas: [
        ["Clínica A", "$590", "8 por $3,900"],
        ["Tú", "$750", "6 por $3,900"],
        ["Clínica C", "$990", "6 por $4,800"],
      ],
    },
    filas: [{ icono: "alerta", texto: "Los precios pueden cambiar; conviene confirmarlos" }],
  },
};

/* ---------- Acciones del menú "/" y lo que contesta cada una ---------- */

export type Accion = PromptBarCommand & { agente: IdAgente; respuesta: string; resultado: string };

export const ACCIONES: Accion[] = [
  {
    key: "agendar",
    name: "/agendar",
    description: "Agenda una cita",
    agente: "lola",
    resultado: "agendar",
    respuesta:
      "Claro. Para **limpieza facial** (1 hora) tengo libre esta semana:\n\n- Jueves 11:00\n- Jueves 16:30\n- Viernes 10:00\n\nDime para quién es y le aparto el lugar. Le mando la confirmación por WhatsApp y un recordatorio un día antes.",
  },
  {
    key: "confirmar",
    name: "/confirmar",
    description: "Confirma las citas de mañana",
    agente: "lola",
    resultado: "confirmar",
    respuesta:
      "Mandé recordatorio a las **12 citas de mañana**.\n\n- **10** ya confirmaron.\n- **Carla Díaz** pide pasar de 16:00 a 17:00. Hay lugar, ¿se lo cambio?\n- **Rosa Peña** no ha contestado; le vuelvo a escribir a las 18:00.",
  },
  {
    key: "resumir-correos",
    name: "/resumir-correos",
    description: "Lo importante del correo de hoy",
    agente: "clara",
    resultado: "resumir-correos",
    respuesta:
      "Hoy llegaron **23 correos**. Lo importante:\n\n1. **Urgente** · Insumos Médicos del Bajío: factura de $8,450 que vence el jueves.\n2. **Hoy** · Andrea Solís quiere pasar su cita del martes a la tarde. Le ofrecí 17:00 o 18:30.\n3. **Esta semana** · El Dr. Vela te recomienda a una paciente para valoración.\n\nLos otros 20 son promociones y avisos; no necesitan nada.",
  },
  {
    key: "facturas",
    name: "/facturas",
    description: "Facturas y pagos del mes",
    agente: "clara",
    resultado: "facturas",
    respuesta:
      "Este mes llegaron 4 movimientos:\n\n- **Insumos Médicos del Bajío** · $8,450, vence el jueves\n- **CFE** · $2,180, vence el 15\n- **Software de agenda** · $599, se cobra el día 20\n- **Karla Vega** · pago recibido, +$4,200\n\nPor pagar: **$11,229**.",
  },
  {
    key: "seguimiento",
    name: "/seguimiento",
    description: "Escribe a quien preguntó y no agendó",
    agente: "victor",
    resultado: "seguimiento",
    respuesta:
      "Encontré **12 personas** que preguntaron por botox en las últimas dos semanas y no agendaron. Este es el mensaje que les mandaría, cada uno con su nombre:\n\n“Hola, Paola. La semana pasada preguntaste por botox. ¿Te aparto un lugar? Tengo viernes 12:00 o sábado 10:30.”\n\n¿Lo envío hoy a mediodía?",
  },
  {
    key: "reactivar",
    name: "/reactivar",
    description: "Trae de regreso a clientes inactivos",
    agente: "victor",
    resultado: "reactivar",
    respuesta:
      "Hay **31 clientes** que no vienen desde junio. Les propongo un mensaje personal, no una promoción masiva:\n\n“Hola, Laura. Hace tiempo que no te vemos. Este mes tu limpieza facial va con 20% menos, ¿te aparto un lugar?”\n\nA quien no conteste le escribo una vez más en 5 días, y te aviso quién regresa.",
  },
  {
    key: "reporte",
    name: "/reporte",
    description: "Reporte del mes: citas y clientes",
    agente: "iris",
    resultado: "reporte",
    respuesta:
      "Septiembre contra agosto:\n\n- **Citas:** 342 (agosto: 324)\n- **Clientes nuevos:** 47 (agosto: 39)\n- **Faltas:** 21 (agosto: 26)\n\nLo más agendado fue **depilación láser**, con 96 citas. Te dejé el reporte en Excel y en PDF.",
  },
  {
    key: "investigar",
    name: "/investigar",
    description: "Compara precios o proveedores",
    agente: "iris",
    resultado: "investigar",
    respuesta:
      "Revisé 4 clínicas cercanas. Depilación láser de axilas:\n\n- **Clínica A** · $590 la sesión, 8 por $3,900\n- **Tú** · $750 la sesión, 6 por $3,900\n- **Clínica C** · $990 la sesión, 6 por $4,800\n\nEstás a la mitad del rango. Los precios pueden cambiar; conviene confirmarlos.",
  },
];

export const ACCION_POR_KEY = Object.fromEntries(ACCIONES.map((a) => [a.key, a])) as Record<string, Accion>;

/** En un grupo, lo que agrega un compañero después de una acción: así se ve que colaboran. */
export const COMPLEMENTO: Record<string, Partial<Record<IdAgente, string>>> = {
  agendar: { victor: "Cuando pase la cita le escribo para ver cómo le fue y, si quedó contenta, le pido su reseña." },
  confirmar: { victor: "A quien cancele le ofrezco otro horario esta misma semana, para no perderlo." },
  "resumir-correos": { lola: "La cita de Andrea ya la pasé a las 17:00 y le avisé por WhatsApp." },
  facturas: { iris: "Lo sumé al reporte del mes, en la hoja de gastos." },
  seguimiento: { lola: "Si alguien contesta, yo le aparto la cita en la agenda." },
  reactivar: { lola: "Dejé apartados dos horarios por día para quienes regresen." },
  reporte: { clara: "De pagos: quedan **2 facturas** por pagar, $10,630 en total. La más próxima vence el jueves." },
  investigar: { victor: "Con esto armo un paquete para quienes preguntaron por láser y no agendaron." },
};

/** Cuando escriben algo libre: cada agente contesta en su tono y sugiere probar una acción. */
export const LIBRE: Record<IdAgente, string> = {
  lola: "¡Con gusto! En tu panel lo resuelvo con tu agenda y tu WhatsApp de verdad. Aquí son respuestas de ejemplo: prueba **/agendar** o **/confirmar**.",
  clara: "Te ayudo con eso. En tu panel leo y contesto tu correo real; aquí te muestro ejemplos. Prueba **/resumir-correos** o **/facturas**.",
  victor: "¡Va! En tu panel trabajo con tus clientes reales. Para ver un ejemplo, prueba **/seguimiento** o **/reactivar**.",
  iris: "Claro. En tu panel lo investigo y te lo entrego en Excel. Para un ejemplo, prueba **/reporte** o **/investigar**.",
};

/** Lo primero que dice cada agente al entrar a un grupo nuevo. */
export const SALUDO: Record<IdAgente, string> = {
  lola: "¡Hola! Yo veo el WhatsApp y la agenda.",
  clara: "Hola. Yo llevo el correo, las facturas y los pagos.",
  victor: "¡Qué tal! Yo me encargo de que los clientes regresen y dejen su reseña.",
  iris: "Hola. Yo hago los reportes, las investigaciones y los documentos.",
};

/* ---------- Conversaciones de ejemplo (/pruebalo) ---------- */

export type De = "tu" | "sistema" | IdAgente;
export type Mensaje = {
  id: number;
  de: De;
  texto: string;
  hora: string;
  /** Si no es de hoy: "Ayer", "Lunes"… */
  dia?: string;
};
export type Conversacion = {
  id: string;
  nombre: string;
  /** Uno = chat con ese agente; dos o más = grupo. */
  agentes: IdAgente[];
  mensajes: Mensaje[];
  sinLeer: number;
  orden: number;
  /** Lo último que dejaron hecho en esta conversación (clave de RESULTADOS). */
  resultado?: string;
};

let contador = 0;
const m = (de: De, hora: string, texto: string, dia?: string): Mensaje => ({ id: ++contador, de, hora, texto, dia });

export const INICIO: Conversacion[] = [
  {
    id: "recepcion",
    nombre: "Recepción",
    agentes: ["lola", "victor"],
    sinLeer: 0,
    orden: 9,
    resultado: "cita-sofia",
    mensajes: [
      m("sistema", "09:58", "Creaste el grupo «Recepción» con Lola y Víctor."),
      m("tu", "10:02", "Escribió Sofía Ramírez por WhatsApp: quiere su primera limpieza facial. ¿Quién la atiende?"),
      m("lola", "10:02", "Yo. Le ofrecí jueves 11:00 o viernes 10:00 y eligió **viernes a las 10:00**. Ya le mandé su confirmación con la ubicación."),
      m("lola", "10:02", "Como es su primera vez, le pedí que llegue 10 minutos antes para llenar su ficha."),
      m("victor", "10:03", "Yo me encargo de después: el sábado le escribo para ver cómo le fue y, si quedó contenta, le pido su reseña en Google."),
      m("victor", "10:03", "Y en 4 semanas le recuerdo agendar su siguiente limpieza. ¿Te parece?"),
      m("tu", "10:04", "Perfecto. @Víctor que el mensaje sea corto"),
      m("victor", "10:04", "Va, este le mandaría:\n\n“Hola, Sofía. ¿Cómo sentiste tu piel después de la limpieza? Si te gustó, nos ayudas mucho con una reseña. ¡Te esperamos pronto!”"),
      m("lola", "10:05", "Lo anoté en su ficha para que no le lleguen dos mensajes el mismo día."),
    ],
  },
  {
    id: "cierre",
    nombre: "Cierre de mes",
    agentes: ["clara", "iris"],
    sinLeer: 1,
    orden: 7,
    resultado: "reporte-excel",
    mensajes: [
      m("sistema", "18:02", "Creaste el grupo «Cierre de mes» con Clara e Iris.", "Ayer"),
      m("tu", "18:03", "¿Cómo nos fue en septiembre?", "Ayer"),
      m("iris", "18:04", "Bien: **342 citas**, 18 más que en agosto, y **47 clientes nuevos**. Las faltas bajaron de 26 a 21.", "Ayer"),
      m("clara", "18:04", "De pagos: quedan **2 facturas** por pagar, $10,630 en total. La más próxima vence el jueves.", "Ayer"),
      m("tu", "08:15", "@Iris pásamelo en Excel"),
      m("iris", "08:16", "Listo. Te dejé el reporte en Excel con una hoja de citas y otra de pagos."),
    ],
  },
  {
    id: "lola",
    nombre: "Lola",
    agentes: ["lola"],
    sinLeer: 0,
    orden: 8,
    resultado: "confirmar",
    mensajes: [
      m("tu", "09:30", "/confirmar"),
      m("lola", "09:31", ACCIONES[1].respuesta),
      m("tu", "09:33", "Sí, cámbiale a Carla"),
      m("lola", "09:33", "Hecho: **Carla Díaz** queda mañana a las **17:00**. Ya le avisé."),
    ],
  },
  {
    id: "clara",
    nombre: "Clara",
    agentes: ["clara"],
    sinLeer: 2,
    orden: 6,
    resultado: "resumir-correos",
    mensajes: [
      m("tu", "08:40", "/resumir-correos"),
      m("clara", "08:41", ACCIONES[2].respuesta),
      m("clara", "08:52", "Llegó la factura de CFE: $2,180, vence el 15."),
    ],
  },
  {
    id: "victor",
    nombre: "Víctor",
    agentes: ["victor"],
    sinLeer: 0,
    orden: 5,
    resultado: "seguimiento-enviado",
    mensajes: [
      m("tu", "11:20", "/seguimiento", "Ayer"),
      m("victor", "11:21", ACCIONES[4].respuesta, "Ayer"),
      m("tu", "11:40", "Sí, mándalo", "Ayer"),
      m("victor", "12:01", "Enviado a las 12 personas. **3 ya contestaron** y Lola les está apartando cita.", "Ayer"),
    ],
  },
  {
    id: "iris",
    nombre: "Iris",
    agentes: ["iris"],
    sinLeer: 0,
    orden: 4,
    resultado: "investigar",
    mensajes: [
      m("tu", "16:10", "/investigar", "Lunes"),
      m("iris", "16:12", ACCIONES[7].respuesta, "Lunes"),
    ],
  },
];

/** Lo que pasa cuando das el visto bueno a un resultado que lo espera. */
export const APROBAR: Record<string, { pides: string; turno: Turno }> = {
  seguimiento: {
    pides: "Sí, mándalo",
    turno: { agente: "victor", texto: "Enviado a las 12 personas, cada una con su nombre. Te aviso en cuanto contesten.", resultado: "seguimiento-enviado" },
  },
  reactivar: {
    pides: "Sí, mándalo",
    turno: { agente: "victor", texto: "Listo, salieron los **31 mensajes**. A quien no conteste le escribo otra vez en 5 días.", resultado: "reactivar-enviado" },
  },
};

/* ---------- Quién contesta y qué ---------- */

export type Turno = { agente: IdAgente; texto: string; resultado?: string };

const sinAcentos = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Una acción "/" del texto, si la hay. */
export const accionDe = (texto: string) => ACCIONES.find((a) => new RegExp(`(^|\\s)${a.name}(\\s|$)`).test(texto));

/** Quién contesta y qué: una acción "/", alguien mencionado con "@", o quien habló al último. */
export function responder(texto: string, miembros: readonly IdAgente[], anterior?: IdAgente): Turno[] {
  const accion = accionDe(texto);
  if (accion && miembros.includes(accion.agente)) {
    const turnos: Turno[] = [{ agente: accion.agente, texto: accion.respuesta, resultado: accion.resultado }];
    const otro = miembros.find((id) => id !== accion.agente && COMPLEMENTO[accion.key]?.[id]);
    if (otro) turnos.push({ agente: otro, texto: COMPLEMENTO[accion.key][otro]! });
    return turnos;
  }
  const plano = sinAcentos(texto);
  const mencion = miembros.find((id) => plano.includes(`@${sinAcentos(AGENTE_POR_ID[id].nombre)}`));
  const quien = mencion ?? (anterior && miembros.includes(anterior) ? anterior : miembros[0]);
  if (accion) {
    const lleva = AGENTE_POR_ID[accion.agente].nombre;
    const agregar = accion.agente === "victor" ? "Agrégalo" : "Agrégala";
    return [{ agente: quien, texto: `Eso lo lleva **${lleva}**. ${agregar} al grupo o escríbele directo y lo resuelve.` }];
  }
  return [{ agente: quien, texto: LIBRE[quien] }];
}

/* ---------- Escenas del inicio: un canal por agente ---------- */

export type PasoEscena = { de: "tu" | IdAgente; texto: string; hora: string; resultado?: string };

export type Escena = {
  agente: IdAgente;
  /** Pestaña del marco: "Lola · WhatsApp". */
  canal: string;
  /** Quién habla del lado derecho y cómo se llama el hilo. */
  persona: { nombre: string; iniciales: string; papel: string };
  sello: string;
  pasos: PasoEscena[];
  placeholder: string;
  /** El visitante escribe como paciente (Lola) o como dueño (los demás). */
  comoPaciente?: boolean;
};

export const ESCENAS: Escena[] = [
  {
    agente: "lola",
    canal: "WhatsApp",
    persona: { nombre: "Sofía Ramírez", iniciales: "SR", papel: "Paciente nueva" },
    sello: "WhatsApp · 23:14",
    comoPaciente: true,
    placeholder: "Ahora tú: escríbele a Lola como si fueras paciente",
    pasos: [
      { de: "tu", hora: "23:14", texto: "Hola, buenas noches. ¿Tienen lugar para limpieza facial esta semana? Sería mi primera vez." },
      { de: "lola", hora: "23:14", texto: "¡Hola, Sofía! Sí. La limpieza facial dura 1 hora. Tengo **jueves a las 11:00** o **viernes a las 10:00**. ¿Cuál te acomoda?" },
      { de: "tu", hora: "23:16", texto: "El viernes a las 10, por favor." },
      {
        de: "lola",
        hora: "23:16",
        resultado: "cita-sofia",
        texto: "Listo, quedó tu cita el **viernes a las 10:00**. Te mando la ubicación. Como es tu primera vez, llega 10 minutos antes para llenar tu ficha. Un día antes te recuerdo.",
      },
    ],
  },
  {
    agente: "clara",
    canal: "Correo",
    persona: { nombre: "Tú", iniciales: "TÚ", papel: "Dueña de la clínica" },
    sello: "Chat con Clara · 08:40",
    placeholder: "Pídele algo a Clara · / para acciones",
    pasos: [
      { de: "tu", hora: "08:40", texto: "/resumir-correos" },
      { de: "clara", hora: "08:41", texto: ACCION_POR_KEY["resumir-correos"].respuesta, resultado: "resumir-correos" },
    ],
  },
  {
    agente: "victor",
    canal: "Clientes",
    persona: { nombre: "Tú", iniciales: "TÚ", papel: "Dueña de la clínica" },
    sello: "Chat con Víctor · 11:20",
    placeholder: "Pídele algo a Víctor · / para acciones",
    pasos: [
      { de: "tu", hora: "11:20", texto: "/seguimiento" },
      { de: "victor", hora: "11:21", texto: ACCION_POR_KEY.seguimiento.respuesta, resultado: "seguimiento" },
      { de: "tu", hora: "11:40", texto: "Sí, mándalo" },
      { de: "victor", hora: "12:01", texto: "Enviado a las 12 personas. **3 ya contestaron** y Lola les está apartando cita.", resultado: "seguimiento-enviado" },
    ],
  },
  {
    agente: "iris",
    canal: "Oficina",
    persona: { nombre: "Tú", iniciales: "TÚ", papel: "Dueña de la clínica" },
    sello: "Chat con Iris · 18:03",
    placeholder: "Pídele algo a Iris · / para acciones",
    pasos: [
      { de: "tu", hora: "18:03", texto: "/reporte" },
      { de: "iris", hora: "18:04", texto: ACCION_POR_KEY.reporte.respuesta, resultado: "reporte" },
    ],
  },
];

/* ---------- Lola con quien juega a ser paciente (inicio) ---------- */

const HORARIOS = [
  { dia: "Jue", nombre: "jueves", hora: "11:00", prueba: /jueves.*(11|once|manana)|(11|once).*jueves/ },
  { dia: "Jue", nombre: "jueves", hora: "16:30", prueba: /jueves.*(16|4|cuatro|tarde)|(16:30|4:30|cuatro y media)/ },
  { dia: "Vie", nombre: "viernes", hora: "10:00", prueba: /viernes|(^|\D)10(\D|$)|diez/ },
];

/**
 * Lo que contesta Lola a quien escribe como paciente: si ya eligió un
 * horario, le aparta la cita; si no, le ofrece los libres. Guion local.
 */
export function lolaPaciente(texto: string): Turno & { cita?: Resultado } {
  const plano = sinAcentos(texto);
  const eligio =
    HORARIOS.find((h) => h.prueba.test(plano)) ?? (/jueves/.test(plano) ? HORARIOS[0] : undefined);
  if (eligio) {
    return {
      agente: "lola",
      texto: `Listo, te aparté el **${eligio.nombre} a las ${eligio.hora}** para limpieza facial. Te llega la confirmación por WhatsApp y un recordatorio un día antes.`,
      cita: {
        agente: "lola",
        sello: `Tu agenda · ${eligio.nombre}`,
        titulo: "Limpieza facial · 1 h",
        sub: "Paciente de prueba · desde esta página",
        estado: "listo",
        cita: { dia: eligio.dia, hora: eligio.hora },
        filas: [
          { icono: "mensaje", texto: "Confirmación enviada por WhatsApp" },
          { icono: "reloj", texto: "Recordatorio un día antes" },
        ],
      },
    };
  }
  return {
    agente: "lola",
    resultado: "agendar",
    texto: "¡Hola! Soy Lola, de la clínica. Para limpieza facial tengo **jueves 11:00**, **jueves 16:30** o **viernes 10:00**. ¿Cuál te acomoda?",
  };
}

/** Hora actual "14:05". */
export const ahora = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

/** Cuánto "escribe" un agente antes de que aparezca su mensaje. */
export const esperaDe = (texto: string) => Math.min(1900, 800 + texto.length * 4);
