"use client";

import Link from "next/link";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Arrow } from "./Buttons";
import PromptBar, {
  type PromptBarCommand,
  type PromptBarSource,
} from "./PromptBar";
import { Texto } from "./Texto";
import { PERSONAJES, Personaje } from "./agentes/Personaje";
import {
  AGENTE_POR_ID,
  AGENTES_INFO,
  IDS_AGENTES,
  type IdAgente,
} from "@/lib/agentes";

/* ---------- Acciones del menú "/" y lo que contesta cada una ---------- */

type Accion = PromptBarCommand & { agente: IdAgente; respuesta: string };

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
    victor:
      "Cuando pase la cita le escribo para ver cómo le fue y, si quedó contenta, le pido su reseña.",
  },
  confirmar: {
    victor:
      "A quien cancele le ofrezco otro horario esta misma semana, para no perderlo.",
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
    clara:
      "De pagos: quedan **2 facturas** por pagar, $10,630 en total. La más próxima vence el jueves.",
  },
  investigar: {
    victor:
      "Con esto armo un paquete para quienes preguntaron por láser y no agendaron.",
  },
};

/** Cuando escriben algo libre: cada agente contesta en su tono y sugiere probar una acción. */
const LIBRE: Record<IdAgente, string> = {
  lola: "¡Con gusto! En tu panel lo resuelvo con tu agenda y tu WhatsApp de verdad. Aquí son respuestas de ejemplo: prueba **/agendar** o **/confirmar**.",
  clara:
    "Te ayudo con eso. En tu panel leo y contesto tu correo real; aquí te muestro ejemplos. Prueba **/resumir-correos** o **/facturas**.",
  victor:
    "¡Va! En tu panel trabajo con tus clientes reales. Para ver un ejemplo, prueba **/seguimiento** o **/reactivar**.",
  iris: "Claro. En tu panel lo investigo y te lo entrego en Excel. Para un ejemplo, prueba **/reporte** o **/investigar**.",
};

/** Lo primero que dice cada agente al entrar a un grupo nuevo. */
const SALUDO: Record<IdAgente, string> = {
  lola: "¡Hola! Yo veo el WhatsApp y la agenda.",
  clara: "Hola. Yo llevo el correo, las facturas y los pagos.",
  victor:
    "¡Qué tal! Yo me encargo de que los clientes regresen y dejen su reseña.",
  iris: "Hola. Yo hago los reportes, las investigaciones y los documentos.",
};

/* ---------- Conversaciones de ejemplo ---------- */

type De = "tu" | "sistema" | IdAgente;
type Mensaje = {
  id: number;
  de: De;
  texto: string;
  hora: string;
  /** Si no es de hoy: "Ayer", "Lunes"… */ dia?: string;
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
const m = (de: De, hora: string, texto: string, dia?: string): Mensaje => ({
  id: ++contador,
  de,
  hora,
  texto,
  dia,
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
      m(
        "tu",
        "10:02",
        "Escribió Sofía Ramírez por WhatsApp: quiere su primera limpieza facial. ¿Quién la atiende?",
      ),
      m(
        "lola",
        "10:02",
        "Yo. Le ofrecí jueves 11:00 o viernes 10:00 y eligió **viernes a las 10:00**. Ya le mandé su confirmación con la ubicación.",
      ),
      m(
        "lola",
        "10:02",
        "Como es su primera vez, le pedí que llegue 10 minutos antes para llenar su ficha.",
      ),
      m(
        "victor",
        "10:03",
        "Yo me encargo de después: el sábado le escribo para ver cómo le fue y, si quedó contenta, le pido su reseña en Google.",
      ),
      m(
        "victor",
        "10:03",
        "Y en 4 semanas le recuerdo agendar su siguiente limpieza. ¿Te parece?",
      ),
      m("tu", "10:04", "Perfecto. @Víctor que el mensaje sea corto"),
      m(
        "victor",
        "10:04",
        "Va, este le mandaría:\n\n“Hola, Sofía. ¿Cómo sentiste tu piel después de la limpieza? Si te gustó, nos ayudas mucho con una reseña. ¡Te esperamos pronto!”",
      ),
      m(
        "lola",
        "10:05",
        "Lo anoté en su ficha para que no le lleguen dos mensajes el mismo día.",
      ),
    ],
  },
  {
    id: "cierre",
    nombre: "Cierre de mes",
    agentes: ["clara", "iris"],
    sinLeer: 1,
    orden: 7,
    mensajes: [
      m(
        "sistema",
        "18:02",
        "Creaste el grupo «Cierre de mes» con Clara e Iris.",
        "Ayer",
      ),
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
      m(
        "iris",
        "08:16",
        "Listo. Te dejé el reporte en Excel con una hoja de citas y otra de pagos.",
      ),
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
      m(
        "lola",
        "09:33",
        "Hecho: **Carla Díaz** queda mañana a las **17:00**. Ya le avisé.",
      ),
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
      m("tu", "11:20", "/seguimiento", "Ayer"),
      m("victor", "11:21", ACCIONES[4].respuesta, "Ayer"),
      m("tu", "11:40", "Sí, mándalo", "Ayer"),
      m(
        "victor",
        "12:01",
        "Enviado a las 12 personas. **3 ya contestaron** y Lola les está apartando cita.",
        "Ayer",
      ),
    ],
  },
  {
    id: "iris",
    nombre: "Iris",
    agentes: ["iris"],
    sinLeer: 0,
    orden: 4,
    mensajes: [
      m("tu", "16:10", "/investigar", "Lunes"),
      m("iris", "16:12", ACCIONES[7].respuesta, "Lunes"),
    ],
  },
];

/* ---------- Ayudas ---------- */

const sinAcentos = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const ahora = () =>
  new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/** "Lola", "Lola y Víctor", "Lola, Clara e Iris". */
function nombres(ids: readonly IdAgente[]) {
  const n = ids.map((id) => AGENTE_POR_ID[id].nombre);
  if (n.length < 2) return n.join("");
  const ultimo = n[n.length - 1];
  return `${n.slice(0, -1).join(", ")} ${sinAcentos(ultimo).startsWith("i") ? "e" : "y"} ${ultimo}`;
}

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
  return c.agentes.length > 1
    ? `${AGENTE_POR_ID[u.de].nombre}: ${plano}`
    : plano;
}

type Turno = { agente: IdAgente; texto: string };

/** Quién contesta y qué: una acción "/", alguien mencionado con "@", o quien habló al último. */
function responder(texto: string, c: Conversacion): Turno[] {
  const miembros = c.agentes;
  const accion = ACCIONES.find((a) =>
    new RegExp(`(^|\\s)${a.name}(\\s|$)`).test(texto),
  );
  if (accion && miembros.includes(accion.agente)) {
    const turnos: Turno[] = [
      { agente: accion.agente, texto: accion.respuesta },
    ];
    const otro = miembros.find(
      (id) => id !== accion.agente && COMPLEMENTO[accion.key]?.[id],
    );
    if (otro)
      turnos.push({ agente: otro, texto: COMPLEMENTO[accion.key][otro]! });
    return turnos;
  }
  const plano = sinAcentos(texto);
  const mencion = miembros.find((id) =>
    plano.includes(`@${sinAcentos(AGENTE_POR_ID[id].nombre)}`),
  );
  const anterior = [...c.mensajes]
    .reverse()
    .find((x) => x.de !== "tu" && x.de !== "sistema")?.de as
    | IdAgente
    | undefined;
  const quien =
    mencion ??
    (anterior && miembros.includes(anterior) ? anterior : miembros[0]);
  if (accion) {
    const lleva = AGENTE_POR_ID[accion.agente].nombre;
    const agregar = accion.agente === "victor" ? "Agrégalo" : "Agrégala";
    return [
      {
        agente: quien,
        texto: `Eso lo lleva **${lleva}**. ${agregar} al grupo o escríbele directo y lo resuelve.`,
      },
    ];
  }
  return [{ agente: quien, texto: LIBRE[quien] }];
}

/** Los IDs nuevos empiezan aquí: solo esos mensajes entran con animación. */
const PRIMER_NUEVO = 1000;

/**
 * El chat de ejemplo de la página de inicio, como una app de mensajería:
 * lista de chats y grupos a la izquierda, la conversación a la derecha y la
 * barra PromptBar para escribir. Las respuestas son de muestra (no se llama
 * a la IA desde aquí); dentro del panel sí es real.
 */
export function ChatDemo() {
  const [convs, setConvs] = useState<Conversacion[]>(INICIO);
  const [activa, setActiva] = useState("recepcion");
  const [pendiente, setPendiente] = useState<{
    conv: string;
    agente: IdAgente;
  } | null>(null);
  const [creando, setCreando] = useState(false);
  const [barra, setBarra] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);
  const activaRef = useRef(activa);
  const siguienteId = useRef(PRIMER_NUEVO);
  const orden = useRef(10);
  const timers = useRef<number[]>([]);

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

  const agregar = (id: string, mensaje: Omit<Mensaje, "id">) =>
    setConvs((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              orden: ++orden.current,
              sinLeer:
                id === activaRef.current || mensaje.de === "tu"
                  ? c.sinLeer
                  : c.sinLeer + 1,
              mensajes: [
                ...c.mensajes,
                { ...mensaje, id: siguienteId.current++ },
              ].slice(-40),
            }
          : c,
      ),
    );

  /** Cada agente "escribe" un momento (los tres puntos) y luego aparece su mensaje. */
  const correr = (id: string, turnos: Turno[]) => {
    const quieto = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const paso = (i: number) => {
      if (i >= turnos.length) {
        setPendiente(null);
        return;
      }
      const t = turnos[i];
      setPendiente({ conv: id, agente: t.agente });
      const espera = quieto ? 500 : Math.min(1900, 800 + t.texto.length * 4);
      timers.current.push(
        window.setTimeout(() => {
          agregar(id, { de: t.agente, texto: t.texto, hora: ahora() });
          if (i + 1 < turnos.length) setPendiente(null);
          timers.current.push(
            window.setTimeout(
              () => paso(i + 1),
              i + 1 < turnos.length ? 450 : 0,
            ),
          );
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

  const abrir = (id: string) => {
    setActiva(id);
    setBarra(false);
    setConvs((cs) =>
      cs.map((c) => (c.id === id && c.sinLeer ? { ...c, sinLeer: 0 } : c)),
    );
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
        texto:
          i === agentes.length - 1
            ? `${SALUDO[a]} Menciónanos con @ para pedirle algo a alguien en especial.`
            : SALUDO[a],
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
  const sugerencias = esGrupo
    ? conv.agentes
        .map((id) => comandos.find((c) => c.agente === id)!)
        .filter(Boolean)
    : comandos;
  const fuentes: PromptBarSource[] = conv.agentes.map((id) => ({
    key: id,
    name: AGENTE_POR_ID[id].nombre,
    description: `${AGENTE_POR_ID[id].area} · ${AGENTE_POR_ID[id].abarca}`,
    icon: <Personaje agente={id} avatar className="h-5 w-5" />,
  }));
  const sinLeerTotal = convs.reduce(
    (s, c) => s + (c.id === activa ? 0 : c.sinLeer),
    0,
  );

  const fila = (c: Conversacion) => {
    const escribe = pendiente?.conv === c.id ? pendiente.agente : null;
    const ultimo = c.mensajes[c.mensajes.length - 1];
    return (
      <li key={c.id}>
        <button
          type="button"
          className="chat-app__conv"
          aria-current={c.id === activa ? "true" : undefined}
          onClick={() => abrir(c.id)}
        >
          <Caras agentes={c.agentes} tam={46} />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[0.9375rem] font-medium text-bone">
                {c.nombre}
              </span>
              <span className="shrink-0 text-[0.75rem] tabular-nums text-ash">
                {ultimo?.dia ?? ultimo?.hora}
              </span>
            </span>
            <span className="mt-0.5 flex items-center gap-3">
              {escribe ? (
                <span className="chat-app__escribe truncate text-[0.8125rem]">
                  {esGrupoConv(c)
                    ? `${AGENTE_POR_ID[escribe].nombre} está escribiendo…`
                    : "Escribiendo…"}
                </span>
              ) : (
                <span className="truncate text-[0.8125rem] text-ash">
                  {vistaPrevia(c)}
                </span>
              )}
              {c.sinLeer && c.id !== activa ? (
                <span
                  className="chat-app__sin-leer"
                  aria-label={`${c.sinLeer} sin leer`}
                >
                  {c.sinLeer}
                </span>
              ) : null}
            </span>
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="chat-app">
      {/* ---------- Lista de chats y grupos ---------- */}
      <aside
        className="chat-app__barra"
        data-abierta={barra ? "" : undefined}
        aria-label="Tus chats"
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-6 sm:px-6">
          <p className="text-[1.125rem] font-medium tracking-[-0.01em]">
            Chats
          </p>
          <button
            type="button"
            className="chat-app__icono md:hidden"
            onClick={() => setBarra(false)}
            aria-label="Cerrar la lista"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="px-4 sm:px-5">
          <button
            type="button"
            className="chat-app__nuevo"
            onClick={() => setCreando(true)}
          >
            <span className="chat-app__nuevo-mas" aria-hidden="true">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5">
                <path
                  d="M10 4v12M4 10h12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            Nuevo grupo
          </button>
        </div>
        <div className="chat-app__listas">
          <p className="chat-app__seccion">Grupos</p>
          <ul>{grupos.map(fila)}</ul>
          <p className="chat-app__seccion">Agentes</p>
          <ul>{chats.map(fila)}</ul>
        </div>
      </aside>
      <button
        type="button"
        className="chat-app__velo md:hidden"
        data-abierta={barra ? "" : undefined}
        onClick={() => setBarra(false)}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* ---------- Conversación abierta ---------- */}
      <section
        className="chat-app__principal"
        aria-label={`Chat: ${conv.nombre}`}
      >
        <header className="chat-app__cabeza">
          <button
            type="button"
            className="chat-app__icono relative md:hidden"
            onClick={() => setBarra(true)}
            aria-label="Ver chats"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-[18px] w-[18px]"
              aria-hidden="true"
            >
              <path
                d="M3 6h14M3 10h14M3 14h9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            {sinLeerTotal ? (
              <span
                className="chat-app__punto"
                aria-label={`${sinLeerTotal} sin leer`}
              />
            ) : null}
          </button>
          <Caras agentes={conv.agentes} tam={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[1rem] font-medium leading-tight">
              {conv.nombre}
            </p>
            <p
              className="truncate text-[0.8125rem] leading-snug text-ash"
              aria-live="polite"
            >
              {escribiendoAqui ? (
                <span className="chat-app__escribe">
                  {esGrupo
                    ? `${AGENTE_POR_ID[escribiendoAqui].nombre} está escribiendo…`
                    : "escribiendo…"}
                </span>
              ) : esGrupo ? (
                `Grupo · ${nombres(conv.agentes)}`
              ) : (
                `${AGENTE_POR_ID[conv.agentes[0]].area} · en línea`
              )}
            </p>
          </div>
          <Link
            href="/entrar"
            className="chat-app__probar hidden sm:inline-flex"
          >
            Probarlo de verdad
            <Arrow />
          </Link>
        </header>

        <div
          ref={listaRef}
          className="chat-app__mensajes"
          role="log"
          aria-live="polite"
          aria-label={`Mensajes de ${conv.nombre}`}
        >
          <div key={conv.id} className="chat-app__hilo">
            {conv.mensajes.map((msg, i) => {
              const antes = conv.mensajes[i - 1];
              const dia = msg.dia ?? "Hoy";
              const nuevoDia = !antes || (antes.dia ?? "Hoy") !== dia;
              const despues = conv.mensajes[i + 1];
              const primero = nuevoDia || antes.de !== msg.de;
              const ultimo =
                (!despues ||
                  despues.de !== msg.de ||
                  (despues.dia ?? "Hoy") !== dia) &&
                !(escribiendoAqui && escribiendoAqui === msg.de && !despues);
              return (
                <Fragment key={msg.id}>
                  {nuevoDia ? <p className="chat-app__dia">{dia}</p> : null}
                  <Burbuja
                    mensaje={msg}
                    primero={primero}
                    ultimo={ultimo}
                    nueva={msg.id >= PRIMER_NUEVO}
                    enGrupo={esGrupo}
                    inicio={nuevoDia}
                  />
                </Fragment>
              );
            })}
            {escribiendoAqui ? (
              <Escribiendo
                agente={escribiendoAqui}
                sigue={
                  conv.mensajes[conv.mensajes.length - 1]?.de ===
                  escribiendoAqui
                }
              />
            ) : null}
          </div>
        </div>

        <div className="chat-app__pie">
          <div className="chat-app__sugerencias" aria-label="Prueba una acción">
            {sugerencias.map((a) => (
              <button
                key={a.key}
                type="button"
                className="chat-app__sugerencia"
                disabled={ocupado}
                onClick={() => enviar(a.name)}
              >
                {a.name}
              </button>
            ))}
          </div>
          <PromptBar
            key={conv.id}
            className="prompt-bar--suave"
            placeholder={
              esGrupo
                ? "Escribe al grupo · @ para mencionar"
                : `Escríbele a ${conv.nombre} · / para acciones`
            }
            sources={fuentes}
            commands={comandos}
            models={[]}
            efforts={[]}
            busy={ocupado}
            onSend={(texto) => enviar(texto)}
            onStop={detener}
            background="var(--chat-campo)"
            color="var(--color-bone-white)"
            menuBackground="var(--chat-menu)"
            width={4000}
            radius={22}
            maxRows={5}
          />
        </div>
      </section>

      {creando ? (
        <NuevoGrupo onCrear={crearGrupo} onCerrar={() => setCreando(false)} />
      ) : null}
    </div>
  );
}

const esGrupoConv = (c: Conversacion) => c.agentes.length > 1;

/* ---------- Piezas ---------- */

/** Posición de cada cara en una caja de 46px: encimadas, una sobre otra. */
const ACOMODO: Record<number, { x: number; y: number; s: number }[]> = {
  1: [{ x: 0, y: 0, s: 46 }],
  2: [
    { x: 0, y: 0, s: 32 },
    { x: 14, y: 14, s: 32 },
  ],
  3: [
    { x: 0, y: 3, s: 28 },
    { x: 18, y: 3, s: 28 },
    { x: 9, y: 18, s: 28 },
  ],
  4: [
    { x: 0, y: 0, s: 26 },
    { x: 20, y: 0, s: 26 },
    { x: 0, y: 20, s: 26 },
    { x: 20, y: 20, s: 26 },
  ],
};

/** El personaje (o los personajes encimados de un grupo) en un círculo suave. */
function Caras({ agentes, tam }: { agentes: IdAgente[]; tam: number }) {
  const k = tam / 46;
  const acomodo = ACOMODO[Math.min(agentes.length, 4)];
  return (
    <span
      className="relative block shrink-0"
      style={{ width: tam, height: tam }}
      aria-hidden="true"
    >
      {agentes.slice(0, 4).map((id, i) => {
        const p = acomodo[i];
        return (
          <span
            key={id}
            className="chat-app__cara"
            data-sola={agentes.length === 1 ? "" : undefined}
            style={{
              left: p.x * k,
              top: p.y * k,
              width: p.s * k,
              height: p.s * k,
            }}
          >
            <Personaje agente={id} avatar className="h-[78%] w-[78%]" />
          </span>
        );
      })}
    </span>
  );
}

/** Resalta @menciones y /acciones dentro del mensaje de la persona. */
function TextoTuyo({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/((?:^|\s)[@/][\wÀ-ÿ-]+)/g).map((p, i) =>
        /^\s?[@/]/.test(p) ? (
          <Fragment key={i}>
            {p.startsWith(" ") ? " " : ""}
            <strong className="font-semibold">{p.trim()}</strong>
          </Fragment>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

function Burbuja({
  mensaje,
  primero,
  ultimo,
  nueva,
  enGrupo,
  inicio,
}: {
  mensaje: Mensaje;
  primero: boolean;
  ultimo: boolean;
  nueva: boolean;
  enGrupo: boolean;
  inicio: boolean;
}) {
  const clases = `chat-app__fila${nueva ? " chat-app__entra" : ""}${primero && !inicio ? " chat-app__fila--bloque" : ""}`;
  if (mensaje.de === "sistema") {
    return (
      <p className={`${clases} chat-app__sistema`}>
        <span>{mensaje.texto}</span>
      </p>
    );
  }
  if (mensaje.de === "tu") {
    return (
      <div className={`${clases} justify-end`}>
        <p
          className="chat-app__burbuja chat-app__burbuja--tu"
          data-primero={primero ? "" : undefined}
          data-ultimo={ultimo ? "" : undefined}
        >
          <span className="whitespace-pre-wrap">
            <TextoTuyo texto={mensaje.texto} />
          </span>
          <span className="chat-app__hora">{mensaje.hora}</span>
        </p>
      </div>
    );
  }
  const info = AGENTE_POR_ID[mensaje.de];
  return (
    <div className={clases}>
      <span className="chat-app__avatar">
        {ultimo ? (
          <Personaje agente={mensaje.de} avatar className="h-8 w-8" />
        ) : null}
      </span>
      <div className="chat-app__columna">
        {primero ? (
          <p className="chat-app__nombre">
            <span
              className="chat-app__marca"
              style={{ background: PERSONAJES[mensaje.de].color }}
              aria-hidden="true"
            />
            <span className="font-medium text-bone">{info.nombre}</span>
            {enGrupo ? <span className="text-ash">{info.area}</span> : null}
          </p>
        ) : null}
        <div
          className="chat-app__burbuja chat-app__burbuja--agente"
          data-primero={primero ? "" : undefined}
          data-ultimo={ultimo ? "" : undefined}
        >
          <div className="chat-app__texto">
            <Texto texto={mensaje.texto} />
          </div>
          <span className="chat-app__hora">{mensaje.hora}</span>
        </div>
      </div>
    </div>
  );
}

/** Los tres puntos de "escribiendo…", con el personaje de quien escribe. */
function Escribiendo({ agente, sigue }: { agente: IdAgente; sigue: boolean }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <div
      className={`chat-app__fila chat-app__entra${sigue ? "" : " chat-app__fila--bloque"}`}
    >
      <span className="chat-app__avatar">
        <Personaje agente={agente} avatar className="h-8 w-8" />
      </span>
      <div className="chat-app__columna">
        {sigue ? null : (
          <p className="chat-app__nombre">
            <span
              className="chat-app__marca"
              style={{ background: PERSONAJES[agente].color }}
              aria-hidden="true"
            />
            <span className="font-medium text-bone">{info.nombre}</span>
          </p>
        )}
        <span
          className="chat-app__burbuja chat-app__burbuja--agente chat-app__puntos"
          data-primero={sigue ? undefined : ""}
          data-ultimo=""
          role="status"
          aria-label={`${info.nombre} está escribiendo`}
        >
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

/** Panel para armar un grupo: se eligen los personajes y se le pone nombre. */
function NuevoGrupo({
  onCrear,
  onCerrar,
}: {
  onCrear: (nombre: string, agentes: IdAgente[]) => void;
  onCerrar: () => void;
}) {
  const [elegidos, setElegidos] = useState<IdAgente[]>([]);
  const [nombre, setNombre] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const listo = elegidos.length >= 2 && nombre.trim().length > 0;

  useEffect(() => {
    panelRef.current
      ?.querySelector<HTMLButtonElement>("button[aria-pressed]")
      ?.focus({ preventScroll: true });
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  const alternar = (id: IdAgente) =>
    setElegidos((e) =>
      e.includes(id)
        ? e.filter((x) => x !== id)
        : IDS_AGENTES.filter((x) => x === id || e.includes(x)),
    );

  return (
    <div
      className="chat-app__capa"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div
        ref={panelRef}
        className="chat-app__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-grupo-titulo"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              id="nuevo-grupo-titulo"
              className="text-[1.25rem] font-medium tracking-[-0.01em]"
            >
              Nuevo grupo
            </p>
            <p className="mt-1 text-[0.875rem] text-ash">
              Elige a quién incluir (mínimo dos) y ponle nombre.
            </p>
          </div>
          <button
            type="button"
            className="chat-app__icono -mr-2 -mt-1"
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AGENTES_INFO.map((a) => {
            const on = elegidos.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                className="chat-app__elegir"
                aria-pressed={on}
                onClick={() => alternar(a.id)}
              >
                <span className="chat-app__check" aria-hidden="true">
                  <svg viewBox="0 0 20 20" className="h-3 w-3">
                    <path
                      d="M5 10.5l3.2 3L15 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <Personaje agente={a.id} avatar className="h-14 w-14" />
                <span className="mt-3 text-[0.9375rem] font-medium text-bone">
                  {a.nombre}
                </span>
                <span className="text-[0.75rem] text-ash">{a.area}</span>
              </button>
            );
          })}
        </div>

        <label className="mt-7 block">
          <span className="text-[0.8125rem] text-ash">Nombre del grupo</span>
          <input
            className="chat-app__campo mt-2"
            value={nombre}
            maxLength={40}
            placeholder="Ej. Promociones de diciembre"
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && listo) onCrear(nombre.trim(), elegidos);
            }}
          />
        </label>

        <div className="mt-8 flex items-center justify-end gap-4 sm:justify-between">
          <p className="hidden min-w-0 truncate text-[0.8125rem] text-ash sm:block">
            {elegidos.length ? nombres(elegidos) : "Nadie todavía"}
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="chat-app__boton"
              onClick={onCerrar}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="chat-app__boton chat-app__boton--fuerte"
              disabled={!listo}
              onClick={() => onCrear(nombre.trim(), elegidos)}
            >
              Crear grupo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
