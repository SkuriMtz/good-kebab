"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import PromptBar, { type PromptBarCommand, type PromptBarSource } from "./PromptBar";
import { Personaje } from "./agentes/Personaje";
import { claseBotonBase } from "./base/Boton";
import { Icono } from "./base/Iconos";
import { MarcoNavegador } from "./base/MarcoNavegador";
import { Deslizable } from "./chat/Deslizable";
import {
  Atajos,
  Dia,
  Escribiendo,
  Hilo,
  MensajeAgente,
  MensajeTuyo,
  NuevoGrupo,
  Paso,
  PilaAvatares,
  Sistema,
  TarjetaTrabajo,
  nombres,
  type Tarjeta,
} from "./chat/Piezas";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/* ---------- Acciones del menú "/" y lo que contesta cada una ---------- */

type Accion = PromptBarCommand & { agente: IdAgente; respuesta: string; tarjeta?: Tarjeta };

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
  },
  {
    key: "resumir-correos",
    name: "/resumir-correos",
    description: "Lo importante del correo de hoy",
    agente: "clara",
    respuesta:
      "Hoy llegaron **23 correos**. Lo importante:\n\n1. **Urgente** · Insumos Médicos del Bajío: factura de $8,450 que vence el jueves.\n2. **Hoy** · Andrea Solís quiere pasar su cita del martes a la tarde. Le ofrecí 17:00 o 18:30.\n3. **Esta semana** · El Dr. Vela te recomienda a una paciente para valoración.\n\nLos otros 20 son promociones y avisos; no necesitan nada.",
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
      "Encontré **12 personas** que preguntaron por botox en las últimas dos semanas y no agendaron. Este es el mensaje que les mandaría, cada uno con su nombre:",
    tarjeta: {
      tipo: "programado",
      sello: "WhatsApp · 12 personas",
      estado: "Espera tu visto bueno",
      cita: "Hola, Paola. La semana pasada preguntaste por botox. ¿Te aparto un lugar? Tengo viernes 12:00 o sábado 10:30.",
    },
  },
  {
    key: "reactivar",
    name: "/reactivar",
    description: "Trae de regreso a clientes inactivos",
    agente: "victor",
    respuesta:
      "Hay **31 clientes** que no vienen desde junio. Les propongo un mensaje personal, no una promoción masiva. A quien no conteste le escribo una vez más en 5 días, y te aviso quién regresa.",
    tarjeta: {
      tipo: "programado",
      sello: "WhatsApp · 31 clientes",
      estado: "Espera tu visto bueno",
      cita: "Hola, Laura. Hace tiempo que no te vemos. Este mes tu limpieza facial va con 20% menos, ¿te aparto un lugar?",
    },
  },
  {
    key: "reporte",
    name: "/reporte",
    description: "Reporte del mes: citas y clientes",
    agente: "iris",
    respuesta:
      "Septiembre contra agosto:\n\n- **Citas:** 342 (agosto: 324)\n- **Clientes nuevos:** 47 (agosto: 39)\n- **Faltas:** 21 (agosto: 26)\n\nLo más agendado fue **depilación láser**, con 96 citas.",
    tarjeta: {
      tipo: "archivo",
      sello: "Excel y PDF",
      estado: "Listo",
      titulo: "Reporte de septiembre",
      datos: [["Hojas", "Citas, clientes y faltas"]],
    },
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

/* ---------- Conversaciones de ejemplo ---------- */

type De = "tu" | "sistema" | "paso" | IdAgente;
type Mensaje = {
  id: number;
  de: De;
  texto: string;
  hora: string;
  /** Si no es de hoy: "Ayer", "Lunes"… */
  dia?: string;
  tarjeta?: Tarjeta;
  /** Solo en los pasos: quién entrega y quién recibe el trabajo. */
  paso?: { de: IdAgente; a: IdAgente };
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
const paso = (de: IdAgente, a: IdAgente, hora: string, texto: string, dia?: string): Mensaje => m("paso", hora, texto, { paso: { de, a }, dia });

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
            tipo: "cita",
            sello: "Cita · WhatsApp",
            estado: "Confirmada",
            titulo: "Limpieza facial · primera vez",
            datos: [
              ["Paciente", "Sofía Ramírez"],
              ["Cuándo", "Viernes 10:00"],
              ["Dura", "1 hora"],
            ],
          },
        },
      ),
      m("lola", "10:02", "Como es su primera vez, le pedí que llegue 10 minutos antes para llenar su ficha."),
      paso("lola", "victor", "10:03", "le pasa el seguimiento a"),
      m(
        "victor",
        "10:03",
        "Yo me encargo de después: el sábado le escribo para ver cómo le fue y, si quedó contenta, le pido su reseña en Google.",
      ),
      m("victor", "10:03", "Y en 4 semanas le recuerdo agendar su siguiente limpieza. ¿Te parece?"),
      m("tu", "10:04", "Perfecto. @Víctor que el mensaje sea corto"),
      m("victor", "10:04", "Va, este le mandaría:", {
        tarjeta: {
          tipo: "programado",
          sello: "WhatsApp · Sábado",
          estado: "Espera tu visto bueno",
          cita: "Hola, Sofía. ¿Cómo sentiste tu piel después de la limpieza? Si te gustó, nos ayudas mucho con una reseña. ¡Te esperamos pronto!",
        },
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
      m("sistema", "18:02", "Creaste el grupo «Cierre de mes» con Clara e Iris.", { dia: "Ayer" }),
      m("tu", "18:03", "¿Cómo nos fue en septiembre?", { dia: "Ayer" }),
      m(
        "iris",
        "18:04",
        "Bien: **342 citas**, 18 más que en agosto, y **47 clientes nuevos**. Las faltas bajaron de 26 a 21.",
        { dia: "Ayer" },
      ),
      paso("iris", "clara", "18:04", "le pasa los pagos a", "Ayer"),
      m("clara", "18:04", "De pagos: quedan **2 facturas** por pagar, $10,630 en total. La más próxima vence el jueves.", { dia: "Ayer" }),
      m("tu", "08:15", "@Iris pásamelo en Excel"),
      m("iris", "08:16", "Listo. Te dejé el reporte con una hoja de citas y otra de pagos.", {
        tarjeta: {
          tipo: "archivo",
          sello: "Excel",
          estado: "Listo",
          titulo: "Cierre de septiembre",
          datos: [["Hojas", "Citas y pagos"]],
        },
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
      m("lola", "09:31", ACCIONES[1].respuesta),
      m("tu", "09:33", "Sí, cámbiale a Carla"),
      m("lola", "09:33", "Hecho. Ya le avisé por WhatsApp.", {
        tarjeta: {
          tipo: "cita",
          sello: "Cita · cambio de hora",
          estado: "Confirmada",
          titulo: "Carla Díaz",
          datos: [
            ["Antes", "Mañana 16:00"],
            ["Ahora", "Mañana 17:00"],
          ],
        },
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
      m("tu", "11:20", "/seguimiento", { dia: "Ayer" }),
      m("victor", "11:21", ACCIONES[4].respuesta, { dia: "Ayer", tarjeta: ACCIONES[4].tarjeta }),
      m("tu", "11:40", "Sí, mándalo", { dia: "Ayer" }),
      m("victor", "12:01", "Enviado a las 12 personas. **3 ya contestaron** y Lola les está apartando cita.", { dia: "Ayer" }),
    ],
  },
  {
    id: "iris",
    nombre: "Iris",
    agentes: ["iris"],
    sinLeer: 0,
    orden: 4,
    mensajes: [m("tu", "16:10", "/investigar", { dia: "Lunes" }), m("iris", "16:12", ACCIONES[7].respuesta, { dia: "Lunes" })],
  },
];

/** En el inicio, la conversación de la recepción se reproduce sola desde aquí (lo anterior ya se ve). */
const VIVO_DESDE = 2;

/* ---------- Ayudas ---------- */

const sinAcentos = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
const ahora = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

/** Texto plano de un mensaje para la vista previa de la lista. */
function vistaPrevia(c: Conversacion, mensajes: Mensaje[]) {
  const u = [...mensajes].reverse().find((x) => x.de !== "paso");
  if (!u) return "";
  const plano = u.texto
    .replace(/\*\*/g, "")
    .replace(/^\s*([-*]|\d+\.)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (u.de === "sistema") return plano;
  if (u.de === "tu") return `Tú: ${plano}`;
  if (u.de === "paso") return plano;
  return c.agentes.length > 1 ? `${AGENTE_POR_ID[u.de].nombre}: ${plano}` : plano;
}

type Turno = { agente: IdAgente; texto: string; tarjeta?: Tarjeta; recibe?: IdAgente };

/** Quién contesta y qué: una acción "/", alguien mencionado con "@", o quien habló al último. */
function responder(texto: string, c: Conversacion): Turno[] {
  const miembros = c.agentes;
  const accion = ACCIONES.find((a) => new RegExp(`(^|\\s)${a.name}(\\s|$)`).test(texto));
  if (accion && miembros.includes(accion.agente)) {
    const turnos: Turno[] = [{ agente: accion.agente, texto: accion.respuesta, tarjeta: accion.tarjeta }];
    const otro = miembros.find((id) => id !== accion.agente && COMPLEMENTO[accion.key]?.[id]);
    if (otro) turnos.push({ agente: otro, texto: COMPLEMENTO[accion.key][otro]!, recibe: otro });
    return turnos;
  }
  const plano = sinAcentos(texto);
  const mencion = miembros.find((id) => plano.includes(`@${sinAcentos(AGENTE_POR_ID[id].nombre)}`));
  const anterior = [...c.mensajes].reverse().find((x) => x.de !== "tu" && x.de !== "sistema" && x.de !== "paso")?.de as
    | IdAgente
    | undefined;
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

const reducido = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * El chat de demostración: lista de chats y grupos a la izquierda, la
 * conversación (un hilo de trabajo) a la derecha y la barra para escribir.
 * Todo es guion local: no se llama a la IA desde aquí; en el panel sí es real.
 *
 * - `lugar="inicio"`: dentro del marco de navegador de la página de inicio;
 *   la conversación de la recepción se reproduce sola al aparecer en pantalla.
 * - `lugar="pagina"`: /pruebalo, a casi toda la pantalla.
 */
export function ChatDemo({ lugar = "pagina" }: { lugar?: "inicio" | "pagina" }) {
  const enVivo = lugar === "inicio";
  const [convs, setConvs] = useState<Conversacion[]>(INICIO);
  const [activa, setActiva] = useState("recepcion");
  const [pendiente, setPendiente] = useState<{ conv: string; agente: IdAgente } | null>(null);
  const [creando, setCreando] = useState(false);
  const [barra, setBarra] = useState(false);
  /** La reproducción del inicio: cuántos mensajes de la recepción se ven y quién escribe. null = terminó. */
  const [vivo, setVivo] = useState<{ revelados: number; escribe: IdAgente | null; corriendo: boolean } | null>(
    enVivo ? { revelados: VIVO_DESDE, escribe: null, corriendo: false } : null,
  );
  const animados = useRef(new Set<number>());
  const raizRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const activaRef = useRef(activa);
  const siguienteId = useRef(PRIMER_NUEVO);
  const orden = useRef(10);
  const timers = useRef<number[]>([]);
  const timersVivo = useRef<number[]>([]);

  activaRef.current = activa;
  const conv = convs.find((c) => c.id === activa) ?? convs[0];
  const esGrupo = conv.agentes.length > 1;
  const ocupado = pendiente !== null;

  /** Lo que se ve de cada conversación (la recepción se va revelando en el inicio). */
  const visibles = (c: Conversacion) => (vivo && c.id === "recepcion" ? c.mensajes.slice(0, vivo.revelados) : c.mensajes);
  const mensajes = visibles(conv);
  const escribiendoAqui = pendiente?.conv === conv.id ? pendiente.agente : vivo && conv.id === "recepcion" ? vivo.escribe : null;

  const limpiar = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const limpiarVivo = () => {
    timersVivo.current.forEach((t) => window.clearTimeout(t));
    timersVivo.current = [];
  };
  useEffect(
    () => () => {
      limpiar();
      limpiarVivo();
    },
    [],
  );

  /** Termina la reproducción y deja ver todo (cuando la persona toma el control). */
  const terminarVivo = () => {
    if (!vivo) return;
    limpiarVivo();
    setVivo(null);
  };

  // La reproducción arranca cuando el chat aparece en pantalla (una sola vez)
  useEffect(() => {
    if (!enVivo) return;
    if (reducido()) {
      setVivo(null);
      return;
    }
    const raiz = raizRef.current;
    if (!raiz) return;
    const total = INICIO[0].mensajes.length;
    const correrDesde = (i: number) => {
      if (i >= total) {
        setVivo(null);
        return;
      }
      const msg = INICIO[0].mensajes[i];
      const revelar = () => {
        animados.current.add(msg.id);
        setVivo({ revelados: i + 1, escribe: null, corriendo: true });
        timersVivo.current.push(window.setTimeout(() => correrDesde(i + 1), msg.de === "paso" ? 600 : 800));
      };
      if (msg.de === "tu" || msg.de === "sistema" || msg.de === "paso") {
        timersVivo.current.push(window.setTimeout(revelar, msg.de === "tu" ? 900 : 500));
      } else {
        const anterior = INICIO[0].mensajes[i - 1];
        setVivo({ revelados: i, escribe: msg.de, corriendo: true });
        const espera = Math.min(1400, 600 + msg.texto.length * 5) - (anterior?.de === msg.de ? 300 : 0);
        timersVivo.current.push(window.setTimeout(revelar, espera));
      }
    };
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        timersVivo.current.push(window.setTimeout(() => correrDesde(VIVO_DESDE), 600));
      },
      { threshold: 0.2 },
    );
    obs.observe(raiz);
    return () => {
      obs.disconnect();
      limpiarVivo();
    };
  }, [enVivo]);

  // Al cambiar de chat, directo al final; con cada mensaje nuevo, un desliz suave
  const vista = useRef(activa);
  useLayoutEffect(() => {
    const el = listaRef.current;
    if (!el) return;
    if (vista.current !== activa) {
      vista.current = activa;
      el.scrollTop = el.scrollHeight;
    } else el.scrollTop = el.scrollHeight; // la fila nueva ya entra subiendo 8px: no hace falta deslizar
  }, [activa, mensajes.length, escribiendoAqui]);

  // "?con=lola" abre directo el chat con ese agente (desde "Háblale a Lola")
  useEffect(() => {
    if (enVivo) return;
    const con = new URLSearchParams(window.location.search).get("con");
    if (!con || !INICIO.some((c) => c.id === con)) return;
    setActiva(con);
    setConvs((cs) => cs.map((c) => (c.id === con ? { ...c, sinLeer: 0 } : c)));
  }, [enVivo]);

  const agregar = (id: string, mensaje: Omit<Mensaje, "id">) =>
    setConvs((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              orden: ++orden.current,
              sinLeer: id === activaRef.current || mensaje.de === "tu" || mensaje.de === "paso" ? c.sinLeer : c.sinLeer + 1,
              mensajes: [...c.mensajes, { ...mensaje, id: siguienteId.current++ }].slice(-40),
            }
          : c,
      ),
    );

  /** Cada agente "escribe" un momento (los tres puntos) y luego aparece su mensaje. */
  const correr = (id: string, turnos: Turno[]) => {
    const quieto = reducido();
    const turno = (i: number) => {
      if (i >= turnos.length) {
        setPendiente(null);
        return;
      }
      const t = turnos[i];
      const anterior = turnos[i - 1];
      if (t.recibe && anterior) {
        agregar(id, { de: "paso", texto: "le pasa lo que sigue a", hora: ahora(), paso: { de: anterior.agente, a: t.recibe } });
      }
      setPendiente({ conv: id, agente: t.agente });
      const espera = quieto ? 500 : Math.min(1900, 800 + t.texto.length * 4);
      timers.current.push(
        window.setTimeout(() => {
          agregar(id, { de: t.agente, texto: t.texto, hora: ahora(), tarjeta: t.tarjeta });
          if (i + 1 < turnos.length) setPendiente(null);
          timers.current.push(window.setTimeout(() => turno(i + 1), i + 1 < turnos.length ? 600 : 0));
        }, espera),
      );
    };
    timers.current.push(window.setTimeout(() => turno(0), 350));
  };

  const enviar = (texto: string) => {
    if (!texto.trim() || ocupado) return;
    terminarVivo();
    limpiar();
    agregar(conv.id, { de: "tu", texto: texto.trim(), hora: ahora() });
    correr(conv.id, responder(texto, conv));
  };

  const detener = () => {
    limpiar();
    setPendiente(null);
  };

  const abrir = (id: string) => {
    if (id !== activa) terminarVivo();
    animados.current.clear();
    setActiva(id);
    setBarra(false);
    setConvs((cs) => cs.map((c) => (c.id === id && c.sinLeer ? { ...c, sinLeer: 0 } : c)));
  };

  const borrar = (id: string) => {
    const restantes = convs.filter((c) => c.id !== id);
    if (!restantes.length) return;
    if (pendiente?.conv === id) detener();
    if (id === "recepcion") terminarVivo();
    setConvs(restantes);
    if (activa === id) abrir([...restantes].sort((a, b) => b.orden - a.orden)[0].id);
  };

  const crearGrupo = (nombre: string, agentes: IdAgente[]) => {
    terminarVivo();
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
    if (!barra) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setBarra(false);
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [barra]);

  const porOrden = (a: Conversacion, b: Conversacion) => b.orden - a.orden;
  const grupos = convs.filter((c) => c.agentes.length > 1).sort(porOrden);
  const chats = convs.filter((c) => c.agentes.length === 1).sort(porOrden);
  const comandos = ACCIONES.filter((a) => conv.agentes.includes(a.agente));
  const sugerencias = esGrupo ? conv.agentes.map((id) => comandos.find((c) => c.agente === id)!).filter(Boolean) : comandos;
  const fuentes: PromptBarSource[] = conv.agentes.map((id) => ({
    key: id,
    name: AGENTE_POR_ID[id].nombre,
    description: `${AGENTE_POR_ID[id].area} · ${AGENTE_POR_ID[id].abarca}`,
    icon: <Personaje agente={id} avatar className="chat__personaje-menu" />,
  }));
  const sinLeerTotal = convs.reduce((s, c) => s + (c.id === activa ? 0 : c.sinLeer), 0);

  const fila = (c: Conversacion) => {
    const vis = visibles(c);
    const escribe = pendiente?.conv === c.id ? pendiente.agente : vivo && c.id === "recepcion" ? vivo.escribe : null;
    const ultimo = vis[vis.length - 1];
    const boton = (
      <button type="button" className="chat__conv" aria-current={c.id === activa ? "true" : undefined} onClick={() => abrir(c.id)}>
        <PilaAvatares agentes={c.agentes} tam={c.agentes.length > 1 ? 28 : 40} />
        <span className="chat__conv-texto">
          <span className="chat__conv-linea">
            <span className="chat__conv-nombre">{c.nombre}</span>
            <span className="chat__conv-hora">{ultimo?.dia ?? ultimo?.hora}</span>
          </span>
          <span className="chat__conv-linea">
            {escribe ? (
              <span className="chat__conv-previa chat__conv-previa--escribe">
                {c.agentes.length > 1 ? `${AGENTE_POR_ID[escribe].nombre} está escribiendo…` : "Escribiendo…"}
              </span>
            ) : (
              <span className="chat__conv-previa">{vistaPrevia(c, vis)}</span>
            )}
            {c.sinLeer && c.id !== activa ? (
              <span className="chat__contador" aria-label={`${c.sinLeer} sin leer`}>
                {c.sinLeer}
              </span>
            ) : null}
          </span>
        </span>
      </button>
    );
    return (
      <li key={c.id}>
        {c.agentes.length > 1 ? (
          <Deslizable etiqueta={`el grupo ${c.nombre}`} alBorrar={() => borrar(c.id)}>
            {boton}
          </Deslizable>
        ) : (
          boton
        )}
      </li>
    );
  };

  const app = (
    <div
      ref={raizRef}
      className={`chat chat--${lugar}`}
      data-lenis-prevent
      onPointerDownCapture={(e) => {
        // Si la persona toca el chat mientras se reproduce, se le entrega completo
        if (vivo && (e.target as HTMLElement).closest("button, textarea, a")) terminarVivo();
      }}
    >
      {/* ---------- Lista de chats y grupos ---------- */}
      <aside className="chat__barra" data-abierta={barra ? "" : undefined} aria-label="Tus chats">
        <div className="chat__barra-cabeza">
          <p className="chat__barra-titulo">Conversaciones</p>
          <button type="button" className={`${claseBotonBase("fantasma", "chico")} chat__nuevo`} onClick={() => setCreando(true)}>
            <Icono nombre="mas" tam={16} />
            Nuevo grupo
          </button>
          <button type="button" className="chat__icono chat__solo-celular" onClick={() => setBarra(false)} aria-label="Cerrar la lista">
            <Icono nombre="cerrar" tam={16} />
          </button>
        </div>
        <div className="chat__listas" data-lenis-prevent>
          {grupos.length ? (
            <>
              <p className="chat__seccion">Grupos</p>
              <ul className="chat__lista">{grupos.map(fila)}</ul>
            </>
          ) : null}
          <p className="chat__seccion">Agentes</p>
          <ul className="chat__lista">{chats.map(fila)}</ul>
        </div>
      </aside>
      <button
        type="button"
        className="chat__velo"
        data-abierta={barra ? "" : undefined}
        onClick={() => setBarra(false)}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* ---------- Conversación abierta ---------- */}
      <section className="chat__principal" aria-label={`Chat: ${conv.nombre}`}>
        <header className="chat__cabeza">
          <button type="button" className="chat__icono chat__solo-celular" onClick={() => setBarra(true)} aria-label="Ver chats">
            <Icono nombre="mensaje" tam={20} />
            {sinLeerTotal ? <span className="chat__punto" aria-label={`${sinLeerTotal} sin leer`} /> : null}
          </button>
          <PilaAvatares agentes={conv.agentes} tam={32} />
          <div className="chat__cabeza-texto">
            <p className="chat__cabeza-titulo">{conv.nombre}</p>
            <p className="chat__cabeza-sub" aria-live="polite">
              {escribiendoAqui ? (
                <span className="chat__escribe">
                  {esGrupo ? `${AGENTE_POR_ID[escribiendoAqui].nombre} está escribiendo…` : "Escribiendo…"}
                </span>
              ) : esGrupo ? (
                `Grupo · ${nombres(conv.agentes)}`
              ) : (
                `${AGENTE_POR_ID[conv.agentes[0]].area} · ${AGENTE_POR_ID[conv.agentes[0]].abarca}`
              )}
            </p>
          </div>
          <span className="chat__demo">Guion de ejemplo</span>
        </header>

        <div ref={listaRef} className="chat__mensajes" data-lenis-prevent role="log" aria-live="polite" aria-label={`Mensajes de ${conv.nombre}`}>
          <Hilo key={conv.id}>
            {mensajes.map((msg, i) => {
              const antes = mensajes[i - 1];
              const dia = msg.dia ?? "Hoy";
              const nuevoDia = !antes || (antes.dia ?? "Hoy") !== dia;
              const despues = mensajes[i + 1];
              const primero = nuevoDia || !antes || antes.de !== msg.de;
              const ultimo = !despues || despues.de !== msg.de || (despues.dia ?? "Hoy") !== dia;
              const nueva = msg.id >= PRIMER_NUEVO || animados.current.has(msg.id);
              return (
                <Fragment key={msg.id}>
                  {nuevoDia ? <Dia>{dia}</Dia> : null}
                  <Pieza mensaje={msg} primero={primero} ultimo={ultimo} nueva={nueva} enGrupo={esGrupo} bloque={primero && !nuevoDia} />
                </Fragment>
              );
            })}
            {escribiendoAqui ? (
              <Escribiendo agente={escribiendoAqui} sigue={mensajes[mensajes.length - 1]?.de === escribiendoAqui} enGrupo={esGrupo} />
            ) : null}
          </Hilo>
        </div>

        <div className="chat__pie">
          <div className="chat__sugerencias" aria-label="Prueba una acción">
            {sugerencias.map((a) => (
              <button key={a.key} type="button" className="chat__sugerencia" disabled={ocupado} onClick={() => enviar(a.name)}>
                <code>{a.name}</code>
                <span>{a.description}</span>
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
            maxRows={5}
          />
          <Atajos />
        </div>
      </section>

      {creando ? <NuevoGrupo onCrear={crearGrupo} onCerrar={() => setCreando(false)} /> : null}
    </div>
  );

  // Las pestañas del marco abren la conversación (útil en celular, donde la lista va escondida)
  const pestanas = [
    ...grupos.filter((g) => g.id === "recepcion"),
    ...["lola", "clara", "victor", "iris"].map((id) => convs.find((c) => c.id === id)).filter((c): c is Conversacion => Boolean(c)),
  ].map((c) => ({
    id: c.id,
    etiqueta: c.agentes.length > 1 ? c.nombre : `${c.nombre} · ${AGENTE_POR_ID[c.agentes[0]].area}`,
    adorno:
      c.agentes.length > 1 ? (
        <span className="chat__pestana-grupo">
          {c.agentes.map((id) => (
            <Personaje key={id} agente={id} avatar />
          ))}
        </span>
      ) : (
        <Personaje agente={c.agentes[0]} avatar />
      ),
    activa: c.id === activa,
  }));

  return (
    <MarcoNavegador
      className={`chat-marco chat-marco--${lugar}`}
      titulo="Chat de demostración de Atendel"
      direccion="atendel.mx/pruebalo"
      pestanas={pestanas}
      alElegir={abrir}
    >
      {app}
    </MarcoNavegador>
  );
}

/** Un mensaje del guion con la pieza que le toca. */
function Pieza({
  mensaje,
  ...fila
}: {
  mensaje: Mensaje;
  primero: boolean;
  ultimo: boolean;
  nueva: boolean;
  enGrupo: boolean;
  bloque: boolean;
}) {
  const comun = { ...fila, hora: mensaje.hora };
  if (mensaje.de === "sistema") return <Sistema texto={mensaje.texto} hora={mensaje.hora} nueva={fila.nueva} />;
  if (mensaje.de === "paso" && mensaje.paso)
    return <Paso de={mensaje.paso.de} a={mensaje.paso.a} texto={mensaje.texto} hora={mensaje.hora} nueva={fila.nueva} />;
  if (mensaje.de === "paso") return null;
  if (mensaje.de === "tu") return <MensajeTuyo texto={mensaje.texto} {...comun} />;
  return (
    <MensajeAgente
      agente={mensaje.de}
      texto={mensaje.texto}
      {...comun}
      tarjeta={mensaje.tarjeta ? <TarjetaTrabajo tarjeta={mensaje.tarjeta} /> : undefined}
    />
  );
}
