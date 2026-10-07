"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import PromptBar, { type PromptBarCommand, type PromptBarSource } from "./PromptBar";
import { Personaje } from "./agentes/Personaje";
import { Boton } from "./base/Boton";
import { Icono, type NombreIcono } from "./base/Iconos";
import { MarcoNavegador } from "./base/MarcoNavegador";
import {
  Avatar,
  Caras,
  Comentario,
  Cuerpo,
  Dia,
  Escribiendo,
  Evento,
  Hilo,
  IconoLado,
  NuevoGrupo,
  nombres,
  type TonoEvento,
} from "./chat/Piezas";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";

/* ---------- Lo que pasa cuando un agente hace algo (eventos de la línea) ---------- */

type Hecho = { icono: NombreIcono; tono?: TonoEvento; texto: string; detalle?: string };

/* ---------- Acciones del menú "/" y lo que contesta cada una ---------- */

type Accion = PromptBarCommand & { agente: IdAgente; respuesta: string; hecho?: Hecho };

const ACCIONES: Accion[] = [
  {
    key: "agendar",
    name: "/agendar",
    description: "Agenda una cita",
    agente: "lola",
    respuesta:
      "Claro. Para **limpieza facial** (1 hora) tengo libre esta semana:\n\n- Jueves 11:00\n- Jueves 16:30\n- Viernes 10:00\n\nDime para quién es y le aparto el lugar. Le mando la confirmación por WhatsApp y un recordatorio un día antes.",
  },
  {
    key: "confirmar",
    name: "/confirmar",
    description: "Confirma las citas de mañana",
    agente: "lola",
    respuesta:
      "Mandé recordatorio a las **12 citas de mañana**.\n\n- **10** ya confirmaron.\n- **Carla Díaz** pide pasar de 16:00 a 17:00. Hay lugar, ¿se lo cambio?\n- **Rosa Peña** no ha contestado; le vuelvo a escribir a las 18:00.",
    hecho: {
      icono: "enviar",
      texto: "envió **12 recordatorios** por WhatsApp",
      detalle: "10 confirmaron · 1 pide cambio · 1 sin respuesta",
    },
  },
  {
    key: "resumir-correos",
    name: "/resumir-correos",
    description: "Lo importante del correo de hoy",
    agente: "clara",
    respuesta:
      "Hoy llegaron **23 correos**. Lo importante:\n\n1. **Urgente** · Insumos Médicos del Bajío: factura de $8,450 que vence el jueves.\n2. **Hoy** · Andrea Solís quiere pasar su cita del martes a la tarde. Le ofrecí 17:00 o 18:30.\n3. **Esta semana** · El Dr. Vela te recomienda a una paciente para valoración.\n\nLos otros 20 son promociones y avisos; no necesitan nada.",
    hecho: {
      icono: "alerta",
      tono: "alerta",
      texto: "marcó como urgente la factura de **Insumos Médicos del Bajío**",
      detalle: "$8,450 · vence el jueves",
    },
  },
  {
    key: "facturas",
    name: "/facturas",
    description: "Facturas y pagos del mes",
    agente: "clara",
    respuesta:
      "Este mes llegaron 4 movimientos:\n\n- **Insumos Médicos del Bajío** · $8,450, vence el jueves\n- **CFE** · $2,180, vence el 15\n- **Software de agenda** · $599, se cobra el día 20\n- **Karla Vega** · pago recibido, +$4,200\n\nPor pagar: **$11,229**.",
  },
  {
    key: "seguimiento",
    name: "/seguimiento",
    description: "Escribe a quien preguntó y no agendó",
    agente: "victor",
    respuesta:
      "Encontré **12 personas** que preguntaron por botox en las últimas dos semanas y no agendaron. Este es el mensaje que les mandaría, cada uno con su nombre:\n\n“Hola, Paola. La semana pasada preguntaste por botox. ¿Te aparto un lugar? Tengo viernes 12:00 o sábado 10:30.”\n\n¿Lo envío hoy a mediodía?",
  },
  {
    key: "reactivar",
    name: "/reactivar",
    description: "Trae de regreso a clientes inactivos",
    agente: "victor",
    respuesta:
      "Hay **31 clientes** que no vienen desde junio. Les propongo un mensaje personal, no una promoción masiva:\n\n“Hola, Laura. Hace tiempo que no te vemos. Este mes tu limpieza facial va con 20% menos, ¿te aparto un lugar?”\n\nA quien no conteste le escribo una vez más en 5 días, y te aviso quién regresa.",
  },
  {
    key: "reporte",
    name: "/reporte",
    description: "Reporte del mes: citas y clientes",
    agente: "iris",
    respuesta:
      "Septiembre contra agosto:\n\n- **Citas:** 342 (agosto: 324)\n- **Clientes nuevos:** 47 (agosto: 39)\n- **Faltas:** 21 (agosto: 26)\n\nLo más agendado fue **depilación láser**, con 96 citas. Te dejé el reporte en Excel y en PDF.",
    hecho: { icono: "documento", texto: "adjuntó **Reporte de septiembre**", detalle: "Excel · PDF" },
  },
  {
    key: "investigar",
    name: "/investigar",
    description: "Compara precios o proveedores",
    agente: "iris",
    respuesta:
      "Revisé 4 clínicas cercanas. Depilación láser de axilas:\n\n- **Clínica A** · $590 la sesión, 8 por $3,900\n- **Tú** · $750 la sesión, 6 por $3,900\n- **Clínica C** · $990 la sesión, 6 por $4,800\n\nEstás a la mitad del rango. Los precios pueden cambiar; conviene confirmarlos.",
  },
];

/** En un grupo, lo que agrega un compañero después de una acción: así se ve que colaboran. */
const COMPLEMENTO: Record<string, Partial<Record<IdAgente, string>>> = {
  agendar: {
    victor: "Cuando pase la cita le escribo para ver cómo le fue y, si quedó contenta, le pido su reseña.",
  },
  confirmar: {
    victor: "A quien cancele le ofrezco otro horario esta misma semana, para no perderlo.",
  },
  "resumir-correos": {
    lola: "La cita de Andrea ya la pasé a las 17:00 y le avisé por WhatsApp.",
  },
  facturas: { iris: "Lo sumé al reporte del mes, en la hoja de gastos." },
  seguimiento: {
    lola: "Si alguien contesta, yo le aparto la cita en la agenda.",
  },
  reactivar: {
    lola: "Dejé apartados dos horarios por día para quienes regresen.",
  },
  reporte: {
    clara: "De pagos: quedan **2 facturas** por pagar, $10,630 en total. La más próxima vence el jueves.",
  },
  investigar: {
    victor: "Con esto armo un paquete para quienes preguntaron por láser y no agendaron.",
  },
};

/** Cuando escriben algo libre: cada agente contesta en su tono y sugiere probar una acción. */
const LIBRE: Record<IdAgente, string> = {
  lola: "¡Con gusto! En tu panel lo resuelvo con tu agenda y tu WhatsApp de verdad. Aquí son respuestas de ejemplo: prueba **/agendar** o **/confirmar**.",
  clara:
    "Te ayudo con eso. En tu panel leo y contesto tu correo real; aquí te muestro ejemplos. Prueba **/resumir-correos** o **/facturas**.",
  victor: "¡Va! En tu panel trabajo con tus clientes reales. Para ver un ejemplo, prueba **/seguimiento** o **/reactivar**.",
  iris: "Claro. En tu panel lo investigo y te lo entrego en Excel. Para un ejemplo, prueba **/reporte** o **/investigar**.",
};

/** Lo primero que dice cada agente al entrar a un grupo nuevo. */
const SALUDO: Record<IdAgente, string> = {
  lola: "¡Hola! Yo veo el WhatsApp y la agenda.",
  clara: "Hola. Yo llevo el correo, las facturas y los pagos.",
  victor: "¡Qué tal! Yo me encargo de que los clientes regresen y dejen su reseña.",
  iris: "Hola. Yo hago los reportes, las investigaciones y los documentos.",
};

/** El canal de cada agente, para las pestañas del marco ("Lola · WhatsApp"). */
const CANAL: Record<IdAgente, string> = { lola: "WhatsApp", clara: "Correo", victor: "Clientes", iris: "Oficina" };

/* ---------- Conversaciones de ejemplo ---------- */

type De = "tu" | "sistema" | IdAgente;
type Mensaje = {
  id: number;
  de: De;
  texto: string;
  hora: string;
  /** Si no es de hoy: "Ayer", "Lunes"… */
  dia?: string;
  /** Si es algo que el agente HIZO (o un aviso del sistema): va como evento en la línea. */
  hecho?: Omit<Hecho, "texto">;
};
type Conversacion = {
  id: string;
  nombre: string;
  /** Uno = chat con ese agente; dos o más = grupo. */
  agentes: IdAgente[];
  mensajes: Mensaje[];
  sinLeer: number;
  orden: number;
};

let contador = 0;
const m = (de: De, hora: string, texto: string, dia?: string): Mensaje => ({ id: ++contador, de, hora, texto, dia });
/** Un evento: lo que hizo un agente (o el sistema, con `de` = "sistema"). */
const ev = (de: De, hora: string, h: Hecho, dia?: string): Mensaje => ({
  id: ++contador,
  de,
  hora,
  texto: h.texto,
  dia,
  hecho: { icono: h.icono, tono: h.tono, detalle: h.detalle },
});
const grupoCreado = (nombre: string, agentes: IdAgente[]): Hecho => ({
  icono: "usuarios",
  texto: `Creaste el grupo **${nombre}** con ${nombres(agentes)}`,
});

const INICIO: Conversacion[] = [
  {
    id: "recepcion",
    nombre: "Recepción",
    agentes: ["lola", "victor"],
    sinLeer: 0,
    orden: 9,
    mensajes: [
      ev("sistema", "09:58", grupoCreado("Recepción", ["lola", "victor"])),
      m("tu", "10:02", "Escribió Sofía Ramírez por WhatsApp: quiere su primera limpieza facial. ¿Quién la atiende?"),
      m(
        "lola",
        "10:02",
        "Yo. Le ofrecí jueves 11:00 o viernes 10:00 y eligió **viernes a las 10:00**. Ya le mandé su confirmación con la ubicación.",
      ),
      m("lola", "10:02", "Como es su primera vez, le pedí que llegue 10 minutos antes para llenar su ficha."),
      ev("lola", "10:02", {
        icono: "calendario",
        tono: "exito",
        texto: "agendó la primera cita de **Sofía Ramírez**",
        detalle: "Limpieza facial · viernes 10:00 · confirmada por WhatsApp",
      }),
      m(
        "victor",
        "10:03",
        "Yo me encargo de después: el sábado le escribo para ver cómo le fue y, si quedó contenta, le pido su reseña en Google.",
      ),
      m("victor", "10:03", "Y en 4 semanas le recuerdo agendar su siguiente limpieza. ¿Te parece?"),
      m("tu", "10:04", "Perfecto. @Víctor que el mensaje sea corto"),
      m(
        "victor",
        "10:04",
        "Va, este le mandaría:\n\n“Hola, Sofía. ¿Cómo sentiste tu piel después de la limpieza? Si te gustó, nos ayudas mucho con una reseña. ¡Te esperamos pronto!”",
      ),
      ev("victor", "10:04", {
        icono: "reloj",
        texto: "programó el mensaje de reseña para **Sofía Ramírez**",
        detalle: "Sábado · WhatsApp",
      }),
      m("lola", "10:05", "Lo anoté en su ficha para que no le lleguen dos mensajes el mismo día."),
    ],
  },
  {
    id: "cierre",
    nombre: "Cierre de mes",
    agentes: ["clara", "iris"],
    sinLeer: 1,
    orden: 7,
    mensajes: [
      ev("sistema", "18:02", grupoCreado("Cierre de mes", ["clara", "iris"]), "Ayer"),
      m("tu", "18:03", "¿Cómo nos fue en septiembre?", "Ayer"),
      m(
        "iris",
        "18:04",
        "Bien: **342 citas**, 18 más que en agosto, y **47 clientes nuevos**. Las faltas bajaron de 26 a 21.",
        "Ayer",
      ),
      m(
        "clara",
        "18:04",
        "De pagos: quedan **2 facturas** por pagar, $10,630 en total. La más próxima vence el jueves.",
        "Ayer",
      ),
      m("tu", "08:15", "@Iris pásamelo en Excel"),
      m("iris", "08:16", "Listo. Te dejé el reporte en Excel con una hoja de citas y otra de pagos."),
      ev("iris", "08:16", { icono: "documento", texto: "adjuntó **Reporte de septiembre**", detalle: "Excel · hoja de citas y hoja de pagos" }),
    ],
  },
  {
    id: "lola",
    nombre: "Lola",
    agentes: ["lola"],
    sinLeer: 0,
    orden: 8,
    mensajes: [
      m("tu", "09:30", "/confirmar"),
      m("lola", "09:31", ACCIONES[1].respuesta),
      ev("lola", "09:31", ACCIONES[1].hecho!),
      m("tu", "09:33", "Sí, cámbiale a Carla"),
      m("lola", "09:33", "Hecho: **Carla Díaz** queda mañana a las **17:00**. Ya le avisé."),
      ev("lola", "09:33", {
        icono: "calendario",
        tono: "exito",
        texto: "movió la cita de **Carla Díaz**",
        detalle: "Mañana · 16:00 → 17:00",
      }),
    ],
  },
  {
    id: "clara",
    nombre: "Clara",
    agentes: ["clara"],
    sinLeer: 2,
    orden: 6,
    mensajes: [
      m("tu", "08:40", "/resumir-correos"),
      m("clara", "08:41", ACCIONES[2].respuesta),
      ev("clara", "08:41", ACCIONES[2].hecho!),
      m("clara", "08:52", "Llegó la factura de CFE: $2,180, vence el 15."),
    ],
  },
  {
    id: "victor",
    nombre: "Víctor",
    agentes: ["victor"],
    sinLeer: 0,
    orden: 5,
    mensajes: [
      m("tu", "11:20", "/seguimiento", "Ayer"),
      m("victor", "11:21", ACCIONES[4].respuesta, "Ayer"),
      m("tu", "11:40", "Sí, mándalo", "Ayer"),
      ev("victor", "12:00", { icono: "enviar", texto: "envió **12 mensajes** de seguimiento", detalle: "WhatsApp · uno por persona" }, "Ayer"),
      m("victor", "12:01", "Enviado a las 12 personas. **3 ya contestaron** y Lola les está apartando cita.", "Ayer"),
    ],
  },
  {
    id: "iris",
    nombre: "Iris",
    agentes: ["iris"],
    sinLeer: 0,
    orden: 4,
    mensajes: [m("tu", "16:10", "/investigar", "Lunes"), m("iris", "16:12", ACCIONES[7].respuesta, "Lunes")],
  },
];

/* ---------- Ayudas ---------- */

const sinAcentos = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const ahora = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
const esGrupoConv = (c: Conversacion) => c.agentes.length > 1;

/** Texto plano de un mensaje para la vista previa de la lista. */
function vistaPrevia(c: Conversacion) {
  const u = c.mensajes[c.mensajes.length - 1];
  if (!u) return "";
  const plano = u.texto
    .replace(/\*\*/g, "")
    .replace(/^\s*([-*]|\d+\.)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (u.de === "sistema") return plano;
  if (u.de === "tu") return `Tú: ${plano}`;
  if (u.hecho) return `${AGENTE_POR_ID[u.de].nombre} ${plano}`;
  return esGrupoConv(c) ? `${AGENTE_POR_ID[u.de].nombre}: ${plano}` : plano;
}

/** Un turno de la respuesta: un mensaje del agente, o algo que hizo (evento). */
type Turno = { agente: IdAgente; texto: string; hecho?: Hecho };

/** Quién contesta y qué: una acción "/", alguien mencionado con "@", o quien habló al último. */
function responder(texto: string, c: Conversacion): Turno[] {
  const miembros = c.agentes;
  const accion = ACCIONES.find((a) => new RegExp(`(^|\\s)${a.name}(\\s|$)`).test(texto));
  if (accion && miembros.includes(accion.agente)) {
    const turnos: Turno[] = [{ agente: accion.agente, texto: accion.respuesta }];
    if (accion.hecho) turnos.push({ agente: accion.agente, texto: accion.hecho.texto, hecho: accion.hecho });
    const otro = miembros.find((id) => id !== accion.agente && COMPLEMENTO[accion.key]?.[id]);
    if (otro) turnos.push({ agente: otro, texto: COMPLEMENTO[accion.key][otro]! });
    return turnos;
  }
  const plano = sinAcentos(texto);
  const mencion = miembros.find((id) => plano.includes(`@${sinAcentos(AGENTE_POR_ID[id].nombre)}`));
  const anterior = [...c.mensajes].reverse().find((x) => x.de !== "tu" && x.de !== "sistema")?.de as IdAgente | undefined;
  const quien = mencion ?? (anterior && miembros.includes(anterior) ? anterior : miembros[0]);
  if (accion) {
    const lleva = AGENTE_POR_ID[accion.agente].nombre;
    const agregar = accion.agente === "victor" ? "Agrégalo" : "Agrégala";
    return [{ agente: quien, texto: `Eso lo lleva **${lleva}**. ${agregar} al grupo o escríbele directo y lo resuelve.` }];
  }
  return [{ agente: quien, texto: LIBRE[quien] }];
}

/** Los IDs nuevos empiezan aquí: solo esos mensajes entran con animación. */
const PRIMER_NUEVO = 1000;

/**
 * Agrupa la conversación para pintarla como línea de tiempo: separador del
 * día, comentarios (mensajes seguidos de la misma voz juntos) y eventos.
 */
function linea(mensajes: Mensaje[]) {
  type Bloque =
    | { tipo: "dia"; key: string; dia: string }
    | { tipo: "evento"; key: string; msg: Mensaje }
    | { tipo: "comentario"; key: string; autor: "tu" | IdAgente; partes: Mensaje[] };
  const bloques: Bloque[] = [];
  let dia = "";
  for (const msg of mensajes) {
    const d = msg.dia ?? "Hoy";
    if (d !== dia) {
      dia = d;
      bloques.push({ tipo: "dia", key: `d-${msg.id}`, dia: d });
    }
    if (msg.de === "sistema" || msg.hecho) {
      bloques.push({ tipo: "evento", key: `e-${msg.id}`, msg });
      continue;
    }
    const ultimo = bloques[bloques.length - 1];
    if (ultimo?.tipo === "comentario" && ultimo.autor === msg.de) ultimo.partes.push(msg);
    else bloques.push({ tipo: "comentario", key: `c-${msg.id}`, autor: msg.de, partes: [msg] });
  }
  return bloques;
}

/**
 * El chat de ejemplo de Atendel dentro de un marco de navegador: la lista de
 * grupos y agentes a la izquierda, la conversación como línea de tiempo
 * (comentarios y lo que cada agente hizo) y la barra PromptBar al final.
 * Las respuestas son de muestra: aquí no se llama a la IA; en el panel sí.
 * `alto`: "seccion" (inicio) o "pagina" (/pruebalo, casi toda la pantalla).
 */
export function ChatDemo({ alto = "seccion", direccion = "atendel.mx/pruebalo" }: { alto?: "seccion" | "pagina"; direccion?: string }) {
  const [convs, setConvs] = useState<Conversacion[]>(INICIO);
  const [activa, setActiva] = useState("recepcion");
  const [grupoVisto, setGrupoVisto] = useState("recepcion");
  const [pendiente, setPendiente] = useState<{ conv: string; agente: IdAgente } | null>(null);
  const [creando, setCreando] = useState(false);
  const [barra, setBarra] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);
  const activaRef = useRef(activa);
  const siguienteId = useRef(PRIMER_NUEVO);
  const orden = useRef(10);
  const timers = useRef<number[]>([]);

  activaRef.current = activa;
  const conv = convs.find((c) => c.id === activa) ?? convs[0];
  const esGrupo = esGrupoConv(conv);
  const ocupado = pendiente !== null;
  const escribiendoAqui = pendiente?.conv === conv.id ? pendiente.agente : null;

  const limpiar = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => limpiar, []);

  // Al cambiar de chat, directo al final; con cada mensaje nuevo, un desliz suave
  const vista = useRef(activa);
  useLayoutEffect(() => {
    const el = listaRef.current;
    if (!el) return;
    if (vista.current !== activa) {
      vista.current = activa;
      el.scrollTop = el.scrollHeight;
    } else el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [activa, conv.mensajes.length, escribiendoAqui]);

  useEffect(() => {
    const el = listaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // La pestaña activa del marco, siempre a la vista (en celular la barra se desliza de lado)
  useEffect(() => {
    const barraTabs = listaRef.current?.closest(".marco")?.querySelector<HTMLElement>(".marco__pestanas");
    const tab = barraTabs?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!barraTabs || !tab) return;
    const izq = tab.offsetLeft - barraTabs.offsetLeft;
    if (izq < barraTabs.scrollLeft || izq + tab.offsetWidth > barraTabs.scrollLeft + barraTabs.clientWidth)
      barraTabs.scrollTo({ left: Math.max(0, izq - 16), behavior: "smooth" });
  }, [activa]);

  const abrir = (id: string) => {
    setActiva(id);
    setBarra(false);
    setConvs((cs) => cs.map((c) => (c.id === id && c.sinLeer ? { ...c, sinLeer: 0 } : c)));
  };

  // "?con=lola" abre directo el chat con ese agente (desde "Háblale a Lola")
  useEffect(() => {
    const con = new URLSearchParams(window.location.search).get("con");
    if (!con || !INICIO.some((c) => c.id === con)) return;
    abrir(con);
    if (INICIO.find((c) => c.id === con)!.agentes.length > 1) setGrupoVisto(con);
  }, []);

  const agregar = (id: string, mensaje: Omit<Mensaje, "id">) =>
    setConvs((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              orden: ++orden.current,
              sinLeer: id === activaRef.current || mensaje.de === "tu" ? c.sinLeer : c.sinLeer + 1,
              mensajes: [...c.mensajes, { ...mensaje, id: siguienteId.current++ }].slice(-40),
            }
          : c,
      ),
    );

  /** Cada agente "escribe" un momento y luego aparece su mensaje; lo que hace aparece como evento. */
  const correr = (id: string, turnos: Turno[]) => {
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paso = (i: number) => {
      if (i >= turnos.length) {
        setPendiente(null);
        return;
      }
      const t = turnos[i];
      if (t.hecho) {
        // Un evento no se "escribe": aparece en la línea poco después del mensaje
        timers.current.push(
          window.setTimeout(() => {
            agregar(id, {
              de: t.agente,
              texto: t.texto,
              hora: ahora(),
              hecho: { icono: t.hecho!.icono, tono: t.hecho!.tono, detalle: t.hecho!.detalle },
            });
            timers.current.push(window.setTimeout(() => paso(i + 1), 450));
          }, 400),
        );
        return;
      }
      setPendiente({ conv: id, agente: t.agente });
      const espera = quieto ? 500 : Math.min(1900, 800 + t.texto.length * 4);
      timers.current.push(
        window.setTimeout(() => {
          agregar(id, { de: t.agente, texto: t.texto, hora: ahora() });
          if (i + 1 < turnos.length) setPendiente(turnos[i + 1].hecho ? { conv: id, agente: t.agente } : null);
          timers.current.push(window.setTimeout(() => paso(i + 1), i + 1 < turnos.length ? 450 : 0));
        }, espera),
      );
    };
    timers.current.push(window.setTimeout(() => paso(0), 350));
  };

  const enviar = (texto: string) => {
    if (!texto.trim() || ocupado) return;
    limpiar();
    agregar(conv.id, { de: "tu", texto: texto.trim(), hora: ahora() });
    correr(conv.id, responder(texto, conv));
  };

  const detener = () => {
    limpiar();
    setPendiente(null);
  };

  const elegir = (id: string) => {
    abrir(id);
    const c = convs.find((x) => x.id === id);
    if (c && esGrupoConv(c)) setGrupoVisto(id);
  };

  const crearGrupo = (nombre: string, agentes: IdAgente[]) => {
    limpiar();
    setPendiente(null);
    const id = `g${Date.now()}`;
    setConvs((cs) => [
      {
        id,
        nombre,
        agentes,
        sinLeer: 0,
        orden: ++orden.current,
        mensajes: [
          {
            id: siguienteId.current++,
            de: "sistema",
            hora: ahora(),
            texto: grupoCreado(nombre, agentes).texto,
            hecho: { icono: "usuarios" },
          },
        ],
      },
      ...cs,
    ]);
    setCreando(false);
    abrir(id);
    setGrupoVisto(id);
    correr(
      id,
      agentes.map((a, i) => ({
        agente: a,
        texto: i === agentes.length - 1 ? `${SALUDO[a]} Menciónanos con @ para pedirle algo a alguien en especial.` : SALUDO[a],
      })),
    );
  };

  // Escape cierra la lista de chats en el celular
  useEffect(() => {
    if (!barra) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setBarra(false);
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [barra]);

  const porOrden = (a: Conversacion, b: Conversacion) => b.orden - a.orden;
  const grupos = convs.filter(esGrupoConv).sort(porOrden);
  const chats = convs.filter((c) => !esGrupoConv(c)).sort(porOrden);
  const comandos = ACCIONES.filter((a) => conv.agentes.includes(a.agente));
  const sugerencias = esGrupo ? conv.agentes.map((id) => comandos.find((c) => c.agente === id)!).filter(Boolean) : comandos;
  const fuentes: PromptBarSource[] = conv.agentes.map((id) => ({
    key: id,
    name: AGENTE_POR_ID[id].nombre,
    description: `${AGENTE_POR_ID[id].area} · ${AGENTE_POR_ID[id].abarca}`,
    icon: <Personaje agente={id} avatar className="h-5 w-5" />,
  }));
  const sinLeerTotal = convs.reduce((s, c) => s + (c.id === activa ? 0 : c.sinLeer), 0);

  // Pestañas del marco: el último grupo abierto y los cuatro agentes
  const grupoTab = convs.find((c) => c.id === grupoVisto) ?? grupos[0];
  const pestanas = [
    ...(grupoTab
      ? [{ id: grupoTab.id, etiqueta: grupoTab.nombre, adorno: <Caras agentes={grupoTab.agentes} tam={18} />, activa: activa === grupoTab.id }]
      : []),
    ...AGENTES_INFO.map((a) => ({
      id: a.id,
      etiqueta: `${a.nombre} · ${CANAL[a.id]}`,
      adorno: <Personaje agente={a.id} avatar />,
      activa: activa === a.id,
    })),
  ];

  const fila = (c: Conversacion) => {
    const escribe = pendiente?.conv === c.id ? pendiente.agente : null;
    const ultimo = c.mensajes[c.mensajes.length - 1];
    const sinLeer = c.sinLeer && c.id !== activa ? c.sinLeer : 0;
    return (
      <li key={c.id}>
        <button
          type="button"
          className="charla__conv"
          aria-current={c.id === activa ? "true" : undefined}
          data-sin-leer={sinLeer ? "" : undefined}
          onClick={() => elegir(c.id)}
        >
          <Caras agentes={c.agentes} tam={32} />
          <span className="charla__conv-texto">
            <span className="charla__conv-linea">
              <span className="charla__conv-nombre">{c.nombre}</span>
              <span className="charla__conv-hora">{ultimo?.dia ?? ultimo?.hora}</span>
            </span>
            <span className="charla__conv-linea">
              {escribe ? (
                <span className="charla__conv-vista charla__escribe">
                  {esGrupoConv(c) ? `${AGENTE_POR_ID[escribe].nombre} está escribiendo…` : "Escribiendo…"}
                </span>
              ) : (
                <span className="charla__conv-vista">{vistaPrevia(c)}</span>
              )}
              {sinLeer ? (
                <span className="charla__contador" aria-label={`${sinLeer} sin leer`}>
                  {sinLeer}
                </span>
              ) : null}
            </span>
          </span>
        </button>
      </li>
    );
  };

  const bloques = linea(conv.mensajes);

  return (
    <MarcoNavegador
      titulo="Chat de demostración de Atendel"
      pestanas={pestanas}
      alElegir={elegir}
      direccion={`${direccion}?con=${conv.id}`}
      className="charla-marco"
    >
      <div className={`charla charla--${alto}`}>
        {/* ---------- Lista de grupos y agentes ---------- */}
        <aside className="charla__lado" data-abierta={barra ? "" : undefined} aria-label="Tus conversaciones">
          <div className="charla__lado-cabeza">
            <p className="charla__lado-titulo">Conversaciones</p>
            <button type="button" className="charla__boton-icono charla__solo-movil" onClick={() => setBarra(false)} aria-label="Cerrar la lista">
              <Icono nombre="cerrar" tam={16} />
            </button>
          </div>
          <div className="charla__lado-accion">
            <Boton variante="fantasma" tam="chico" bloque icono={<Icono nombre="mas" tam={16} />} onClick={() => setCreando(true)}>
              Nuevo grupo
            </Boton>
          </div>
          <div className="charla__listas" data-lenis-prevent="">
            <p className="charla__seccion">Grupos</p>
            <ul>{grupos.map(fila)}</ul>
            <p className="charla__seccion">Agentes</p>
            <ul>{chats.map(fila)}</ul>
          </div>
        </aside>
        <button
          type="button"
          className="charla__velo charla__solo-movil"
          data-abierta={barra ? "" : undefined}
          onClick={() => setBarra(false)}
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* ---------- Conversación abierta ---------- */}
        <section className="charla__principal" aria-label={`Chat: ${conv.nombre}`}>
          <header className="charla__cabeza">
            <button type="button" className="charla__boton-icono charla__solo-movil" onClick={() => setBarra(true)} aria-label="Ver conversaciones">
              <IconoLado tam={20} />
              {sinLeerTotal ? <span className="charla__punto" aria-label={`${sinLeerTotal} sin leer`} /> : null}
            </button>
            <Caras agentes={conv.agentes} tam={32} />
            <div className="charla__cabeza-texto">
              <p className="charla__cabeza-titulo">{conv.nombre}</p>
              <p className="charla__cabeza-meta" aria-live="polite">
                {escribiendoAqui ? (
                  <span className="charla__escribe">
                    {esGrupo ? `${AGENTE_POR_ID[escribiendoAqui].nombre} está escribiendo…` : "Escribiendo…"}
                  </span>
                ) : esGrupo ? (
                  `Grupo · ${nombres(conv.agentes)}`
                ) : (
                  `${AGENTE_POR_ID[conv.agentes[0]].area} · ${AGENTE_POR_ID[conv.agentes[0]].abarca}`
                )}
              </p>
            </div>
            <span className="charla__estado">
              <span className="charla__estado-punto" aria-hidden="true" />
              Demostración
            </span>
          </header>

          <div ref={listaRef} className="charla__mensajes" data-lenis-prevent="" role="log" aria-live="polite" aria-label={`Mensajes de ${conv.nombre}`}>
            <div key={conv.id} className="charla__columna">
              <Hilo etiqueta={`Conversación: ${conv.nombre}`}>
                {bloques.map((b) => {
                  if (b.tipo === "dia") return <Dia key={b.key}>{b.dia}</Dia>;
                  if (b.tipo === "evento") {
                    const x = b.msg;
                    return (
                      <Evento
                        key={b.key}
                        agente={x.de === "sistema" || x.de === "tu" ? null : x.de}
                        icono={x.hecho?.icono ?? "usuarios"}
                        tono={x.hecho?.tono}
                        texto={x.de === "sistema" || x.de === "tu" ? x.texto : `**${AGENTE_POR_ID[x.de].nombre}** ${x.texto}`}
                        detalle={x.hecho?.detalle}
                        hora={x.hora}
                        nueva={x.id >= PRIMER_NUEVO}
                      />
                    );
                  }
                  return (
                    <Comentario key={b.key} autor={b.autor} hora={b.partes[0].hora} nueva={b.partes[0].id >= PRIMER_NUEVO}>
                      {b.partes.map((p, i) => (
                        <Fragment key={p.id}>
                          {i > 0 ? <Separador nueva={p.id >= PRIMER_NUEVO} hora={p.hora} /> : null}
                          <div className={p.id >= PRIMER_NUEVO && i > 0 ? "charla__entra" : undefined}>
                            <Cuerpo autor={b.autor} texto={p.texto} />
                          </div>
                        </Fragment>
                      ))}
                    </Comentario>
                  );
                })}
                {escribiendoAqui ? <Escribiendo key={`esc-${conv.mensajes.length}`} agente={escribiendoAqui} /> : null}
              </Hilo>
            </div>
          </div>

          <div className="charla__pie">
            <div className="charla__columna charla__compositor">
              <Avatar autor="tu" className="charla__avatar--lado" />
              <div className="charla__compositor-cuerpo">
                <div className="charla__sugerencias" role="group" aria-label="Prueba una acción">
                  {sugerencias.map((a) => (
                    <button key={a.key} type="button" className="charla__sugerencia" disabled={ocupado} onClick={() => enviar(a.name)}>
                      {a.name}
                      <span className="charla__sugerencia-quien">{AGENTE_POR_ID[a.agente].nombre}</span>
                    </button>
                  ))}
                </div>
                <PromptBar
                  key={conv.id}
                  placeholder={esGrupo ? "Escribe al grupo" : `Escríbele a ${conv.nombre}`}
                  sources={fuentes}
                  commands={comandos}
                  models={[]}
                  efforts={[]}
                  busy={ocupado}
                  onSend={(texto) => enviar(texto)}
                  onStop={detener}
                  pista={<Pista grupo={esGrupo} />}
                  maxRows={5}
                />
              </div>
            </div>
          </div>
        </section>

        {creando ? <NuevoGrupo onCrear={crearGrupo} onCerrar={() => setCreando(false)} /> : null}
      </div>
    </MarcoNavegador>
  );
}

/** Entre dos mensajes seguidos de la misma voz: una raya fina con la hora del segundo. */
function Separador({ hora, nueva }: { hora: string; nueva: boolean }) {
  return (
    <p className={`charla__separador${nueva ? " charla__entra" : ""}`} aria-hidden="true">
      <span>{hora}</span>
    </p>
  );
}

/** Los atajos del compositor, como teclas. */
export function Pista({ grupo }: { grupo: boolean }): ReactNode {
  return (
    <>
      <kbd>@</kbd> {grupo ? "mencionar" : "agentes"}
      <kbd>/</kbd> acciones
    </>
  );
}
