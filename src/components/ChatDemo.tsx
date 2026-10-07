"use client";

import Link from "next/link";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import PromptBar, { type PromptBarCommand, type PromptBarSource } from "./PromptBar";
import { Personaje } from "./agentes/Personaje";
import { Icono, type NombreIcono } from "./base/Iconos";
import { MarcoNavegador } from "./base/MarcoNavegador";
import {
  Caras,
  ContenidoFila,
  Dia,
  Escribiendo,
  FiltroChats,
  Integrantes,
  ListaAcciones,
  MensajeAgente,
  MensajeTuyo,
  NuevoGrupo,
  SeccionDetalles,
  SeccionLista,
  Sistema,
  nombres,
  type Tarjeta,
} from "./chat/Piezas";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";

/*
 * Chat de demostración de Atendel (inicio y /pruebalo). Es un GUION LOCAL:
 * no llama a la IA; cada acción "/" tiene su respuesta de ejemplo. Dentro del
 * panel (/panel/chat) el chat sí es real.
 */

/* ---------- Lo que queda hecho después de un mensaje (panel de la derecha) ---------- */

type Hecho = {
  icono: NombreIcono;
  texto: string;
  /** hecho: listo · programado: pasará solo · espera: falta tu respuesta o tu visto bueno. */
  estado: "hecho" | "programado" | "espera";
};

const ESTADO: Record<Hecho["estado"], { icono: NombreIcono; etiqueta: string }> = {
  hecho: { icono: "check-circulo", etiqueta: "Hecho" },
  programado: { icono: "reloj", etiqueta: "Programado" },
  espera: { icono: "mano", etiqueta: "Espera tu visto bueno" },
};

/* ---------- Acciones del menú "/" y lo que contesta cada una ---------- */

type Accion = PromptBarCommand & { agente: IdAgente; respuesta: string; hechos: Hecho[] };

const ACCIONES: Accion[] = [
  {
    key: "agendar",
    name: "/agendar",
    description: "Agenda una cita",
    agente: "lola",
    respuesta:
      "Claro. Para **limpieza facial** (1 hora) tengo libre esta semana:\n\n- Jueves 11:00\n- Jueves 16:30\n- Viernes 10:00\n\nDime para quién es y le aparto el lugar. Le mando la confirmación por WhatsApp y un recordatorio un día antes.",
    hechos: [{ icono: "calendario", texto: "Tres horarios para limpieza facial · falta para quién es", estado: "espera" }],
  },
  {
    key: "confirmar",
    name: "/confirmar",
    description: "Confirma las citas de mañana",
    agente: "lola",
    respuesta:
      "Mandé recordatorio a las **12 citas de mañana**.\n\n- **10** ya confirmaron.\n- **Carla Díaz** pide pasar de 16:00 a 17:00. Hay lugar, ¿se lo cambio?\n- **Rosa Peña** no ha contestado; le vuelvo a escribir a las 18:00.",
    hechos: [
      { icono: "mensaje", texto: "Recordatorio a las 12 citas de mañana · 10 confirmaron", estado: "hecho" },
      { icono: "calendario", texto: "Carla Díaz pide pasar a las 17:00", estado: "espera" },
    ],
  },
  {
    key: "resumir-correos",
    name: "/resumir-correos",
    description: "Lo importante del correo de hoy",
    agente: "clara",
    respuesta:
      "Hoy llegaron **23 correos**. Lo importante:\n\n1. **Urgente** · Insumos Médicos del Bajío: factura de $8,450 que vence el jueves.\n2. **Hoy** · Andrea Solís quiere pasar su cita del martes a la tarde. Le ofrecí 17:00 o 18:30.\n3. **Esta semana** · El Dr. Vela te recomienda a una paciente para valoración.\n\nLos otros 20 son promociones y avisos; no necesitan nada.",
    hechos: [{ icono: "correo", texto: "Correo de hoy resumido · 3 importantes de 23", estado: "hecho" }],
  },
  {
    key: "facturas",
    name: "/facturas",
    description: "Facturas y pagos del mes",
    agente: "clara",
    respuesta:
      "Este mes llegaron 4 movimientos:\n\n- **Insumos Médicos del Bajío** · $8,450, vence el jueves\n- **CFE** · $2,180, vence el 15\n- **Software de agenda** · $599, se cobra el día 20\n- **Karla Vega** · pago recibido, +$4,200\n\nPor pagar: **$11,229**.",
    hechos: [{ icono: "documento", texto: "Facturas del mes · $11,229 por pagar", estado: "hecho" }],
  },
  {
    key: "seguimiento",
    name: "/seguimiento",
    description: "Escribe a quien preguntó y no agendó",
    agente: "victor",
    respuesta:
      "Encontré **12 personas** que preguntaron por botox en las últimas dos semanas y no agendaron. Este es el mensaje que les mandaría, cada uno con su nombre:\n\n“Hola, Paola. La semana pasada preguntaste por botox. ¿Te aparto un lugar? Tengo viernes 12:00 o sábado 10:30.”\n\n¿Lo envío hoy a mediodía?",
    hechos: [{ icono: "mensaje", texto: "Seguimiento para 12 personas que preguntaron por botox", estado: "espera" }],
  },
  {
    key: "reactivar",
    name: "/reactivar",
    description: "Trae de regreso a clientes inactivos",
    agente: "victor",
    respuesta:
      "Hay **31 clientes** que no vienen desde junio. Les propongo un mensaje personal, no una promoción masiva:\n\n“Hola, Laura. Hace tiempo que no te vemos. Este mes tu limpieza facial va con 20% menos, ¿te aparto un lugar?”\n\nA quien no conteste le escribo una vez más en 5 días, y te aviso quién regresa.",
    hechos: [{ icono: "usuarios", texto: "Mensaje para 31 clientes que no vienen desde junio", estado: "espera" }],
  },
  {
    key: "reporte",
    name: "/reporte",
    description: "Reporte del mes: citas y clientes",
    agente: "iris",
    respuesta:
      "Septiembre contra agosto:\n\n- **Citas:** 342 (agosto: 324)\n- **Clientes nuevos:** 47 (agosto: 39)\n- **Faltas:** 21 (agosto: 26)\n\nLo más agendado fue **depilación láser**, con 96 citas. Te dejé el reporte en Excel y en PDF.",
    hechos: [{ icono: "documento", texto: "Reporte de septiembre en Excel y PDF", estado: "hecho" }],
  },
  {
    key: "investigar",
    name: "/investigar",
    description: "Compara precios o proveedores",
    agente: "iris",
    respuesta:
      "Revisé 4 clínicas cercanas. Depilación láser de axilas:\n\n- **Clínica A** · $590 la sesión, 8 por $3,900\n- **Tú** · $750 la sesión, 6 por $3,900\n- **Clínica C** · $990 la sesión, 6 por $4,800\n\nEstás a la mitad del rango. Los precios pueden cambiar; conviene confirmarlos.",
    hechos: [{ icono: "documento", texto: "Precios de depilación láser en 4 clínicas", estado: "hecho" }],
  },
];

/** En un grupo, lo que agrega un compañero después de una acción: así se ve que colaboran. */
const COMPLEMENTO: Record<string, Partial<Record<IdAgente, { texto: string; hechos?: Hecho[] }>>> = {
  agendar: {
    victor: {
      texto: "Cuando pase la cita le escribo para ver cómo le fue y, si quedó contenta, le pido su reseña.",
      hechos: [{ icono: "reloj", texto: "Pedir reseña después de la cita", estado: "programado" }],
    },
  },
  confirmar: { victor: { texto: "A quien cancele le ofrezco otro horario esta misma semana, para no perderlo." } },
  "resumir-correos": {
    lola: {
      texto: "La cita de Andrea ya la pasé a las 17:00 y le avisé por WhatsApp.",
      hechos: [{ icono: "calendario", texto: "Andrea Solís pasó a las 17:00", estado: "hecho" }],
    },
  },
  facturas: { iris: { texto: "Lo sumé al reporte del mes, en la hoja de gastos." } },
  seguimiento: { lola: { texto: "Si alguien contesta, yo le aparto la cita en la agenda." } },
  reactivar: { lola: { texto: "Dejé apartados dos horarios por día para quienes regresen." } },
  reporte: {
    clara: { texto: "De pagos: quedan **2 facturas** por pagar, $10,630 en total. La más próxima vence el jueves." },
  },
  investigar: { victor: { texto: "Con esto armo un paquete para quienes preguntaron por láser y no agendaron." } },
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

/* ---------- Conversaciones de ejemplo ---------- */

type De = "tu" | "sistema" | IdAgente;
type Mensaje = {
  id: number;
  de: De;
  texto: string;
  hora: string;
  /** Si no es de hoy: "Ayer", "Lunes"… */
  dia?: string;
  tarjeta?: Tarjeta;
  hechos?: Hecho[];
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
const m = (de: De, hora: string, texto: string, extra: Partial<Omit<Mensaje, "id" | "de" | "hora" | "texto">> = {}): Mensaje => ({
  id: ++contador,
  de,
  hora,
  texto,
  ...extra,
});

const INICIO: Conversacion[] = [
  {
    id: "recepcion",
    nombre: "Recepción",
    agentes: ["lola", "victor"],
    sinLeer: 0,
    orden: 9,
    mensajes: [
      m("sistema", "09:58", "Creaste el grupo «Recepción» con Lola y Víctor."),
      m("tu", "10:02", "Escribió Sofía Ramírez por WhatsApp: quiere su primera limpieza facial. ¿Quién la atiende?"),
      m(
        "lola",
        "10:02",
        "Yo. Le ofrecí jueves 11:00 o viernes 10:00 y eligió **viernes a las 10:00**. Ya le mandé su confirmación con la ubicación.",
        {
          tarjeta: {
            icono: "calendario",
            sello: "Cita confirmada",
            titulo: "Limpieza facial · 1 hora",
            detalle: "Viernes 10:00 · Sofía Ramírez · primera vez",
            pie: "Confirmación y ubicación enviadas por WhatsApp",
          },
          hechos: [{ icono: "calendario", texto: "Cita de Sofía Ramírez · viernes 10:00", estado: "hecho" }],
        },
      ),
      m("lola", "10:02", "Como es su primera vez, le pedí que llegue 10 minutos antes para llenar su ficha."),
      m(
        "victor",
        "10:03",
        "Yo me encargo de después: el sábado le escribo para ver cómo le fue y, si quedó contenta, le pido su reseña en Google.",
        { hechos: [{ icono: "reloj", texto: "Preguntarle cómo le fue y pedir reseña · sábado", estado: "programado" }] },
      ),
      m("victor", "10:03", "Y en 4 semanas le recuerdo agendar su siguiente limpieza. ¿Te parece?", {
        hechos: [{ icono: "calendario", texto: "Recordarle su siguiente limpieza · en 4 semanas", estado: "programado" }],
      }),
      m("tu", "10:04", "Perfecto. @Víctor que el mensaje sea corto"),
      m(
        "victor",
        "10:04",
        "Va, este le mandaría:\n\n“Hola, Sofía. ¿Cómo sentiste tu piel después de la limpieza? Si te gustó, nos ayudas mucho con una reseña. ¡Te esperamos pronto!”",
      ),
      m("lola", "10:05", "Lo anoté en su ficha para que no le lleguen dos mensajes el mismo día.", {
        hechos: [{ icono: "documento", texto: "Nota en la ficha de Sofía", estado: "hecho" }],
      }),
    ],
  },
  {
    id: "cierre",
    nombre: "Cierre de mes",
    agentes: ["clara", "iris"],
    sinLeer: 1,
    orden: 7,
    mensajes: [
      m("sistema", "18:02", "Creaste el grupo «Cierre de mes» con Clara e Iris.", { dia: "Ayer" }),
      m("tu", "18:03", "¿Cómo nos fue en septiembre?", { dia: "Ayer" }),
      m("iris", "18:04", "Bien: **342 citas**, 18 más que en agosto, y **47 clientes nuevos**. Las faltas bajaron de 26 a 21.", {
        dia: "Ayer",
      }),
      m("clara", "18:04", "De pagos: quedan **2 facturas** por pagar, $10,630 en total. La más próxima vence el jueves.", {
        dia: "Ayer",
      }),
      m("tu", "08:15", "@Iris pásamelo en Excel"),
      m("iris", "08:16", "Listo. Te dejé el reporte en Excel con una hoja de citas y otra de pagos.", {
        tarjeta: {
          icono: "documento",
          sello: "Archivo · Excel",
          titulo: "Reporte de septiembre",
          detalle: "2 hojas: citas y pagos",
        },
        hechos: [{ icono: "documento", texto: "Reporte de septiembre en Excel", estado: "hecho" }],
      }),
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
      m("lola", "09:31", ACCIONES[1].respuesta, { hechos: [ACCIONES[1].hechos[0]] }),
      m("tu", "09:33", "Sí, cámbiale a Carla"),
      m("lola", "09:33", "Hecho: **Carla Díaz** queda mañana a las **17:00**. Ya le avisé.", {
        tarjeta: {
          icono: "calendario",
          sello: "Cita cambiada",
          titulo: "Carla Díaz · mañana 17:00",
          detalle: "Antes: 16:00",
          pie: "Aviso enviado por WhatsApp",
        },
        hechos: [{ icono: "calendario", texto: "Carla Díaz pasó a mañana 17:00", estado: "hecho" }],
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
      m("clara", "08:41", ACCIONES[2].respuesta, { hechos: ACCIONES[2].hechos }),
      m("clara", "08:52", "Llegó la factura de CFE: $2,180, vence el 15.", {
        hechos: [{ icono: "documento", texto: "Factura de CFE · $2,180, vence el 15", estado: "hecho" }],
      }),
    ],
  },
  {
    id: "victor",
    nombre: "Víctor",
    agentes: ["victor"],
    sinLeer: 0,
    orden: 5,
    mensajes: [
      m("tu", "11:20", "/seguimiento", { dia: "Ayer" }),
      m("victor", "11:21", ACCIONES[4].respuesta, { dia: "Ayer" }),
      m("tu", "11:40", "Sí, mándalo", { dia: "Ayer" }),
      m("victor", "12:01", "Enviado a las 12 personas. **3 ya contestaron** y Lola les está apartando cita.", {
        dia: "Ayer",
        hechos: [{ icono: "mensaje", texto: "Seguimiento enviado a 12 personas · 3 contestaron", estado: "hecho" }],
      }),
    ],
  },
  {
    id: "iris",
    nombre: "Iris",
    agentes: ["iris"],
    sinLeer: 0,
    orden: 4,
    mensajes: [
      m("tu", "16:10", "/investigar", { dia: "Lunes" }),
      m("iris", "16:12", ACCIONES[7].respuesta, { dia: "Lunes", hechos: ACCIONES[7].hechos }),
    ],
  },
];

/** En el inicio, la Recepción se cuenta sola al aparecer: se ven estos primeros mensajes y el resto llega en vivo. */
const GUION_VISIBLE = 2;
const GUION = INICIO[0].mensajes;

/* ---------- Ayudas ---------- */

const sinAcentos = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const ahora = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
const tecleo = (texto: string) => Math.min(1600, 700 + texto.length * 5);

/** Texto plano del último mensaje, para la vista previa de la lista. */
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
  return c.agentes.length > 1 ? `${AGENTE_POR_ID[u.de].nombre}: ${plano}` : plano;
}

type Turno = { agente: IdAgente; texto: string; hechos?: Hecho[] };

/** Quién contesta y qué: una acción "/", alguien mencionado con "@", o quien habló al último. */
function responder(texto: string, c: Conversacion): Turno[] {
  const miembros = c.agentes;
  const accion = ACCIONES.find((a) => new RegExp(`(^|\\s)${a.name}(\\s|$)`).test(texto));
  if (accion && miembros.includes(accion.agente)) {
    const turnos: Turno[] = [{ agente: accion.agente, texto: accion.respuesta, hechos: accion.hechos }];
    const otro = miembros.find((id) => id !== accion.agente && COMPLEMENTO[accion.key]?.[id]);
    if (otro) turnos.push({ agente: otro, ...COMPLEMENTO[accion.key][otro]! });
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

/** Las pestañas del marco: una por agente ("Lola · WhatsApp"…); abren su chat. */
const PESTANAS = AGENTES_INFO.map((a) => ({
  id: a.id,
  etiqueta: `${a.nombre} · ${a.id === "lola" ? "WhatsApp" : a.area}`,
}));

/**
 * El chat de demostración dentro del marco de navegador, como una app de
 * producto: a la izquierda los grupos y los chats con cada agente, al centro
 * la conversación y, cuando hay espacio, a la derecha quién está y lo que
 * quedó hecho. `variante="inicio"`: la Recepción se cuenta sola la primera
 * vez que aparece en pantalla (se detiene en cuanto tocas algo).
 */
export function ChatDemo({ variante = "pagina" }: { variante?: "inicio" | "pagina" }) {
  const [convs, setConvs] = useState<Conversacion[]>(INICIO);
  const [activa, setActiva] = useState("recepcion");
  const [pendiente, setPendiente] = useState<{ conv: string; agente: IdAgente } | null>(null);
  const [creando, setCreando] = useState(false);
  const [lateral, setLateral] = useState(false);
  const [filtro, setFiltro] = useState("");
  const raizRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const activaRef = useRef(activa);
  const siguienteId = useRef(PRIMER_NUEVO);
  const orden = useRef(10);
  const timers = useRef<number[]>([]);
  /** null: sin guion · "espera": esperando a aparecer en pantalla · "corre": contándose. */
  const guion = useRef<null | "espera" | "corre">(null);

  activaRef.current = activa;
  const conv = convs.find((c) => c.id === activa) ?? convs[0];
  const esGrupo = conv.agentes.length > 1;
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

  // "?con=lola" abre directo el chat con ese agente (desde "Háblale a Lola")
  useEffect(() => {
    const con = new URLSearchParams(window.location.search).get("con");
    if (!con || !INICIO.some((c) => c.id === con)) return;
    setActiva(con);
    setConvs((cs) => cs.map((c) => (c.id === con ? { ...c, sinLeer: 0 } : c)));
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

  /* ---------- El guion de la Recepción (solo en el inicio) ---------- */

  /** Deja la Recepción completa al instante (si el guion se interrumpe). */
  const terminarGuion = () => {
    if (!guion.current) return;
    guion.current = null;
    limpiar();
    setPendiente(null);
    setConvs((cs) =>
      cs.map((c) =>
        c.id === "recepcion"
          ? { ...c, mensajes: [...c.mensajes.filter((x) => x.id < PRIMER_NUEVO).slice(0, GUION_VISIBLE), ...GUION.slice(GUION_VISIBLE)] }
          : c,
      ),
    );
  };

  useEffect(() => {
    if (variante !== "inicio") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const raiz = raizRef.current;
    if (!raiz || !("IntersectionObserver" in window)) return;
    guion.current = "espera";
    setConvs((cs) => cs.map((c) => (c.id === "recepcion" ? { ...c, mensajes: GUION.slice(0, GUION_VISIBLE) } : c)));

    const correrGuion = () => {
      guion.current = "corre";
      let t = 600;
      GUION.slice(GUION_VISIBLE).forEach((msg, i, resto) => {
        const sigue = i > 0 && resto[i - 1].de === msg.de;
        if (msg.de === "tu" || msg.de === "sistema") {
          t += 1100;
          timers.current.push(window.setTimeout(() => agregar("recepcion", msg), t));
          return;
        }
        const agente = msg.de;
        // Una pausa entre quien termina y quien empieza; los mensajes seguidos van más pegados
        t += sigue ? 250 : 500;
        timers.current.push(window.setTimeout(() => setPendiente({ conv: "recepcion", agente }), t));
        t += tecleo(msg.texto);
        timers.current.push(
          window.setTimeout(() => {
            agregar("recepcion", msg);
            setPendiente(null);
          }, t),
        );
      });
      timers.current.push(window.setTimeout(() => (guion.current = null), t + 50));
    };

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && guion.current === "espera") {
          obs.disconnect();
          correrGuion();
        }
      },
      { threshold: 0.45 },
    );
    obs.observe(raiz);
    return () => obs.disconnect();
    // Solo al montar: el guion corre una vez por visita
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Lo que hace la persona ---------- */

  /** Cada agente "escribe" un momento (los tres puntos) y luego aparece su mensaje. */
  const correr = (id: string, turnos: Turno[]) => {
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paso = (i: number) => {
      if (i >= turnos.length) {
        setPendiente(null);
        return;
      }
      const t = turnos[i];
      setPendiente({ conv: id, agente: t.agente });
      timers.current.push(
        window.setTimeout(
          () => {
            agregar(id, { de: t.agente, texto: t.texto, hora: ahora(), hechos: t.hechos });
            if (i + 1 < turnos.length) setPendiente(null);
            timers.current.push(window.setTimeout(() => paso(i + 1), i + 1 < turnos.length ? 450 : 0));
          },
          quieto ? 500 : Math.min(1900, 800 + t.texto.length * 4),
        ),
      );
    };
    timers.current.push(window.setTimeout(() => paso(0), 350));
  };

  const enviar = (texto: string) => {
    terminarGuion();
    if (!texto.trim() || (ocupado && !guion.current)) return;
    limpiar();
    setPendiente(null);
    agregar(conv.id, { de: "tu", texto: texto.trim(), hora: ahora() });
    correr(conv.id, responder(texto, conv));
  };

  const detener = () => {
    terminarGuion();
    limpiar();
    setPendiente(null);
  };

  const abrir = (id: string) => {
    if (id !== "recepcion") terminarGuion();
    setActiva(id);
    setLateral(false);
    setConvs((cs) => cs.map((c) => (c.id === id && c.sinLeer ? { ...c, sinLeer: 0 } : c)));
  };

  const crearGrupo = (nombre: string, agentes: IdAgente[]) => {
    terminarGuion();
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
            texto: `Creaste el grupo «${nombre}» con ${nombres(agentes)}.`,
          },
        ],
      },
      ...cs,
    ]);
    setCreando(false);
    setFiltro("");
    abrir(id);
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
    if (!lateral) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setLateral(false);
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [lateral]);

  const porOrden = (a: Conversacion, b: Conversacion) => b.orden - a.orden;
  const buscado = sinAcentos(filtro.trim());
  const coincide = (c: Conversacion) =>
    !buscado || sinAcentos(c.nombre).includes(buscado) || sinAcentos(vistaPrevia(c)).includes(buscado) || c.agentes.some((id) => sinAcentos(AGENTE_POR_ID[id].nombre).includes(buscado));
  const grupos = convs.filter((c) => c.agentes.length > 1 && coincide(c)).sort(porOrden);
  const chats = convs.filter((c) => c.agentes.length === 1 && coincide(c)).sort(porOrden);
  const comandos = ACCIONES.filter((a) => conv.agentes.includes(a.agente));
  const sugerencias = esGrupo ? conv.agentes.map((id) => comandos.find((c) => c.agente === id)!).filter(Boolean) : comandos;
  const fuentes: PromptBarSource[] = conv.agentes.map((id) => ({
    key: id,
    name: AGENTE_POR_ID[id].nombre,
    description: `${AGENTE_POR_ID[id].area} · ${AGENTE_POR_ID[id].abarca}`,
    icon: <Personaje agente={id} avatar className="h-5 w-5" />,
  }));
  const sinLeerTotal = convs.reduce((s, c) => s + (c.id === activa ? 0 : c.sinLeer), 0);
  const hechos = conv.mensajes.flatMap((x) => (x.hechos ?? []).map((h, i) => ({ ...h, hora: x.dia ?? x.hora, key: `${x.id}-${i}` })));

  const fila = (c: Conversacion) => {
    const escribe = pendiente?.conv === c.id ? pendiente.agente : null;
    const ultimo = c.mensajes[c.mensajes.length - 1];
    return (
      <li key={c.id}>
        <button type="button" className="conversa__fila-lista" aria-current={c.id === activa ? "true" : undefined} onClick={() => abrir(c.id)}>
          <ContenidoFila
            agentes={c.agentes}
            nombre={c.nombre}
            hora={ultimo?.dia ?? ultimo?.hora}
            linea={vistaPrevia(c)}
            escribiendo={escribe ? (c.agentes.length > 1 ? `${AGENTE_POR_ID[escribe].nombre} está escribiendo…` : "Escribiendo…") : null}
            sinLeer={c.id !== activa ? c.sinLeer : 0}
          />
        </button>
      </li>
    );
  };

  return (
    <MarcoNavegador
      titulo="Chat de demostración de Atendel"
      pestanas={PESTANAS.map((p) => ({ ...p, adorno: <Personaje agente={p.id} avatar />, activa: p.id === activa }))}
      alElegir={(id) => abrir(id)}
      className={`conversa-marco conversa-marco--${variante}`}
    >
      <div className="conversa-caja">
      <div
        ref={raizRef}
        className="conversa conversa--con-detalles"
        data-variante={variante}
        data-lateral={lateral ? "abierta" : undefined}
        onPointerDownCapture={() => guion.current === "corre" && terminarGuion()}
        onKeyDownCapture={() => guion.current === "corre" && terminarGuion()}
      >
        {/* ---------- Grupos y chats ---------- */}
        <aside className="conversa__lateral" aria-label="Tus chats">
          <div className="conversa__lateral-cabeza">
            <h2 className="conversa__lateral-titulo">Chats</h2>
            <button type="button" className="conversa__nuevo" onClick={() => setCreando(true)}>
              <Icono nombre="mas" tam={16} />
              Nuevo grupo
            </button>
            <button type="button" className="conversa__icono conversa__solo-movil" onClick={() => setLateral(false)} aria-label="Cerrar la lista">
              <Icono nombre="cerrar" tam={16} />
            </button>
          </div>
          <FiltroChats valor={filtro} alCambiar={setFiltro} />
          <nav className="conversa__listas" aria-label="Conversaciones" data-lenis-prevent>
            {grupos.length ? (
              <SeccionLista titulo="Grupos" cuenta={grupos.length}>
                <ul>{grupos.map(fila)}</ul>
              </SeccionLista>
            ) : null}
            {chats.length ? (
              <SeccionLista titulo="Agentes" cuenta={chats.length}>
                <ul>{chats.map(fila)}</ul>
              </SeccionLista>
            ) : null}
            {!grupos.length && !chats.length ? (
              <div className="conversa__vacio-lista">
                <p>Ningún chat coincide con «{filtro.trim()}».</p>
                <button type="button" className="conversa__enlace" onClick={() => setFiltro("")}>
                  Borrar la búsqueda
                </button>
              </div>
            ) : null}
          </nav>
          <div className="conversa__lateral-pie">
            <p className="conversa__nota">
              <span className="conversa__sello">Demostración</span>
              Respuestas de ejemplo; nada sale de esta página.
            </p>
            <Link href="/entrar" className="conversa__enlace">
              Probarlo con tu negocio
              <Icono nombre="flecha" tam={16} className="flecha" />
            </Link>
          </div>
        </aside>
        <button
          type="button"
          className="conversa__velo"
          onClick={() => setLateral(false)}
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* ---------- Conversación abierta ---------- */}
        <section className="conversa__principal" aria-label={`Chat: ${conv.nombre}`}>
          <header className="conversa__cabeza">
            <button type="button" className="conversa__icono conversa__solo-movil" onClick={() => setLateral(true)} aria-label="Ver chats">
              <Icono nombre="menu" tam={20} />
              {sinLeerTotal ? <span className="conversa__punto" aria-label={`${sinLeerTotal} sin leer`} /> : null}
            </button>
            <Caras agentes={conv.agentes} tam={32} />
            <div className="conversa__cabeza-texto">
              <p className="conversa__titulo">{conv.nombre}</p>
              <p className="conversa__estado" aria-live="polite">
                {escribiendoAqui ? (
                  <span className="conversa__estado--escribe">
                    {esGrupo ? `${AGENTE_POR_ID[escribiendoAqui].nombre} está escribiendo…` : "escribiendo…"}
                  </span>
                ) : esGrupo ? (
                  `Grupo · ${nombres(conv.agentes)}`
                ) : (
                  `${AGENTE_POR_ID[conv.agentes[0]].area} · ${AGENTE_POR_ID[conv.agentes[0]].abarca}`
                )}
              </p>
            </div>
            <span className="conversa__sello conversa__sello--cabeza">Demo</span>
          </header>

          <div ref={listaRef} className="conversa__mensajes" data-lenis-prevent>
            <div key={conv.id} className="conversa__hilo" role="log" aria-live="polite" aria-label={`Mensajes de ${conv.nombre}`}>
              {conv.mensajes.map((msg, i) => {
                const antes = conv.mensajes[i - 1];
                const dia = msg.dia ?? "Hoy";
                const nuevoDia = !antes || (antes.dia ?? "Hoy") !== dia;
                const despues = conv.mensajes[i + 1];
                const primero = nuevoDia || antes.de !== msg.de;
                const ultimo = !despues || despues.de !== msg.de || (despues.dia ?? "Hoy") !== dia;
                const comun = { primero, ultimo, nueva: msg.id >= PRIMER_NUEVO, bloque: primero && !nuevoDia, hora: msg.hora };
                return (
                  <Fragment key={msg.id}>
                    {nuevoDia ? <Dia>{dia}</Dia> : null}
                    {msg.de === "sistema" ? (
                      <Sistema texto={msg.texto} {...comun} />
                    ) : msg.de === "tu" ? (
                      <MensajeTuyo texto={msg.texto} {...comun} />
                    ) : (
                      <MensajeAgente agente={msg.de} texto={msg.texto} enGrupo={esGrupo} tarjeta={msg.tarjeta} {...comun} />
                    )}
                  </Fragment>
                );
              })}
              {escribiendoAqui ? (
                <Escribiendo
                  agente={escribiendoAqui}
                  enGrupo={esGrupo}
                  sigue={conv.mensajes[conv.mensajes.length - 1]?.de === escribiendoAqui}
                />
              ) : null}
            </div>
          </div>

          <div className="conversa__pie">
            <div className="conversa__sugerencias" aria-label="Prueba una acción" role="group">
              {sugerencias.map((a) => (
                <button key={a.key} type="button" className="conversa__sugerencia" disabled={ocupado && !guion.current} onClick={() => enviar(a.name)}>
                  <span className="conversa__sugerencia-nombre">{a.name}</span>
                  <span className="conversa__sugerencia-desc">{a.description}</span>
                </button>
              ))}
            </div>
            <PromptBar
              key={conv.id}
              placeholder={esGrupo ? "Escribe al grupo · @ para mencionar" : `Escríbele a ${conv.nombre} · / para acciones`}
              sources={fuentes}
              commands={comandos}
              models={[]}
              efforts={[]}
              busy={ocupado}
              onSend={(texto) => enviar(texto)}
              onStop={detener}
              width={4000}
              maxRows={5}
            />
          </div>
        </section>

        {/* ---------- Quién está y lo que quedó hecho ---------- */}
        <aside className="conversa__detalles" aria-label="Detalles de la conversación" data-lenis-prevent>
          <SeccionDetalles titulo={esGrupo ? "Integrantes" : "Agente"}>
            <Integrantes agentes={conv.agentes} />
          </SeccionDetalles>
          <SeccionDetalles titulo="Lo que quedó hecho">
            {hechos.length ? (
              <ul className="conversa__hechos">
                {hechos.map((h) => {
                  const [principal, ...detalle] = h.texto.split(" · ");
                  return (
                    <li key={h.key} className="conversa__hecho conversa__entra" data-estado={h.estado}>
                      <span className="conversa__hecho-icono">
                        <Icono nombre={ESTADO[h.estado].icono} tam={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="conversa__hecho-texto">{principal}</span>
                        {detalle.length ? <span className="conversa__hecho-detalle">{detalle.join(" · ")}</span> : null}
                        <span className="conversa__hecho-meta">
                          {ESTADO[h.estado].etiqueta} · <time>{h.hora}</time>
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="conversa__detalle-vacio">Todavía nada. Pide una acción y aquí aparece lo que quede listo.</p>
            )}
          </SeccionDetalles>
          <SeccionDetalles titulo="Acciones">
            <ListaAcciones acciones={comandos} alElegir={enviar} deshabilitada={ocupado && !guion.current} />
          </SeccionDetalles>
        </aside>

        {creando ? <NuevoGrupo onCrear={crearGrupo} onCerrar={() => setCreando(false)} /> : null}
      </div>
      </div>
    </MarcoNavegador>
  );
}
