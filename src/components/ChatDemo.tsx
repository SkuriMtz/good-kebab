"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "./Buttons";
import PromptBar, { type PromptBarCommand, type PromptBarSource } from "./PromptBar";
import { Texto } from "./Texto";
import { Personaje } from "./agentes/Personaje";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";

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
      "Este mes llegaron 4 movimientos:\n\n| Quién | Concepto | Monto |\n|---|---|---|\n| Insumos Médicos del Bajío | Factura F-2291, vence el jueves | $8,450 |\n| CFE | Recibo de luz, vence el 15 | $2,180 |\n| Software de agenda | Se cobra el día 20 | $599 |\n| Karla Vega | Pago recibido por transferencia | +$4,200 |\n\nPor pagar: **$11,229**.",
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
      "Septiembre, comparado con agosto:\n\n| | Septiembre | Agosto |\n|---|---|---|\n| Citas | 342 | 324 |\n| Clientes nuevos | 47 | 39 |\n| Faltas | 21 | 26 |\n\nLo más agendado fue **depilación láser** (96 citas). Te dejé el reporte en Excel y en PDF.",
  },
  {
    key: "investigar",
    name: "/investigar",
    description: "Compara precios o proveedores",
    agente: "iris",
    respuesta:
      "Revisé 4 clínicas cercanas. Depilación láser de axilas, por sesión:\n\n| Clínica | Sesión | Paquete |\n|---|---|---|\n| Clínica A | $590 | 8 por $3,900 |\n| Tú | $750 | 6 por $3,900 |\n| Clínica C | $990 | 6 por $4,800 |\n\nEstás a la mitad del rango. Te dejé la tabla con fuentes en Excel; los precios pueden cambiar, conviene confirmarlos.",
  },
];

/** Cuando escriben algo libre: cada agente contesta en su tono y sugiere probar una acción. */
const LIBRE: Record<IdAgente, string> = {
  lola: "¡Con gusto! En tu panel lo resuelvo con tu agenda y tu WhatsApp de verdad. Aquí son respuestas de ejemplo: prueba **/agendar** o **/confirmar** para ver cómo trabajo.",
  clara: "Te ayudo con eso. En tu panel leo tu correo real; aquí te muestro ejemplos. Prueba **/resumir-correos** o **/facturas**.",
  victor: "¡Va! En tu panel trabajo con tus clientes reales. Para ver un ejemplo, prueba **/seguimiento** o **/reactivar**.",
  iris: "Claro. En tu panel lo investigo y te lo entrego en Excel. Para un ejemplo, prueba **/reporte** o **/investigar**.",
};

const FUENTES: PromptBarSource[] = AGENTES_INFO.map((a) => ({
  key: a.id,
  name: a.nombre,
  description: `${a.area} · ${a.abarca}`,
  icon: <Personaje agente={a.id} avatar className="h-5 w-5" />,
}));

/* ---------- Conversación ---------- */

type Mensaje = { id: number; de: "tu" | IdAgente; texto: string; hora: string; detenido?: boolean };

const INICIO: Mensaje[] = [
  { id: 1, de: "tu", texto: "/resumir-correos", hora: "09:41" },
  { id: 2, de: "clara", texto: ACCIONES[2].respuesta, hora: "09:41" },
  { id: 3, de: "tu", texto: "@Lola agenda a Mariana López el jueves en la tarde para limpieza facial", hora: "09:43" },
  {
    id: 4,
    de: "lola",
    texto:
      "Listo: **Mariana López**, jueves a las **16:30**, limpieza facial (1 hora).\n\nLe mandé la confirmación por WhatsApp y un día antes le llega su recordatorio.",
    hora: "09:43",
  },
];

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Quién contesta y qué: una acción "/", un agente con "@", o el último que habló. */
function responder(texto: string, ultimo: IdAgente): { agente: IdAgente; texto: string } {
  const accion = ACCIONES.find((a) => new RegExp(`(^|\\s)${a.name}(\\s|$)`).test(texto));
  if (accion) return { agente: accion.agente, texto: accion.respuesta };
  const plano = sinAcentos(texto);
  const mencion = AGENTES_INFO.find((a) => plano.includes(`@${sinAcentos(a.nombre)}`));
  const agente = mencion?.id ?? ultimo;
  return { agente, texto: LIBRE[agente] };
}

const ahora = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * El chat de ejemplo de la página de inicio: una conversación con los
 * agentes y la barra PromptBar para escribirles. Las respuestas son de
 * muestra (no se llama a la IA desde aquí); dentro del panel sí es real.
 */
export function ChatDemo() {
  const [mensajes, setMensajes] = useState<Mensaje[]>(INICIO);
  const [escribiendo, setEscribiendo] = useState<{ agente: IdAgente; texto: string; total: string } | null>(null);
  const [pensando, setPensando] = useState<IdAgente | null>(null);
  const [copiado, setCopiado] = useState<number | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const siguienteId = useRef(5);
  const timers = useRef<number[]>([]);
  const ultimo = useRef<IdAgente>("lola");
  const ocupado = pensando !== null || escribiendo !== null;

  const limpiar = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => limpiar, []);

  // Siempre a la vista el último mensaje (solo dentro de la ventana, sin mover la página)
  useEffect(() => {
    const el = listaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [mensajes, escribiendo, pensando]);

  const terminar = (agente: IdAgente, texto: string, detenido = false) => {
    setEscribiendo(null);
    setPensando(null);
    ultimo.current = agente;
    setMensajes((m) => [...m, { id: siguienteId.current++, de: agente, texto, hora: ahora(), detenido }].slice(-10));
  };

  const enviar = (texto: string) => {
    if (!texto || ocupado) return;
    limpiar();
    setMensajes((m) => [...m, { id: siguienteId.current++, de: "tu" as const, texto, hora: ahora() }].slice(-10));
    const { agente, texto: respuesta } = responder(texto, ultimo.current);
    setPensando(agente);
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.current.push(
      window.setTimeout(() => {
        setPensando(null);
        if (quieto) {
          terminar(agente, respuesta);
          return;
        }
        // La respuesta se va escribiendo, como en una app de chat
        let n = 0;
        const paso = () => {
          n = Math.min(respuesta.length, n + 5);
          // No cortar una tabla a la mitad (se vería rota mientras se escribe)
          let visible = respuesta.slice(0, n);
          const corte = visible.lastIndexOf("\n");
          if (n < respuesta.length && visible.slice(corte + 1).startsWith("|")) visible = visible.slice(0, corte);
          setEscribiendo({ agente, texto: visible, total: respuesta });
          if (n >= respuesta.length) terminar(agente, respuesta);
          else timers.current.push(window.setTimeout(paso, 18));
        };
        paso();
      }, 650),
    );
  };

  const detener = () => {
    limpiar();
    if (escribiendo) terminar(escribiendo.agente, escribiendo.texto, true);
    else setPensando(null);
  };

  const copiar = async (m: Mensaje) => {
    try {
      await navigator.clipboard.writeText(m.texto);
      setCopiado(m.id);
      window.setTimeout(() => setCopiado((c) => (c === m.id ? null : c)), 1600);
    } catch {
      // Sin permiso para copiar: no pasa nada
    }
  };

  return (
    <div className="chat-demo border hairline">
      {/* Encabezado: quién está en el chat */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b hairline px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1.5" aria-hidden="true">
            {AGENTES_INFO.map((a) => (
              <Personaje key={a.id} agente={a.id} avatar className="h-7 w-7" />
            ))}
          </div>
          <div>
            <p className="text-[0.9375rem] font-medium leading-tight">Tu equipo</p>
            <p className="text-[0.8125rem] leading-tight text-ash">Ejemplo con respuestas de muestra</p>
          </div>
        </div>
        <Link href="/entrar" className="btn-ghost !text-bone">
          Probarlo de verdad
          <Arrow />
        </Link>
      </div>

      {/* Mensajes */}
      <div
        ref={listaRef}
        className="chat-demo__lista flex flex-col gap-9 overflow-y-auto px-5 py-10 sm:px-10"
        aria-live="polite"
        aria-label="Conversación de ejemplo"
      >
        {mensajes.map((m) =>
          m.de === "tu" ? (
            <div key={m.id} className="chat-demo__entra flex flex-col items-end gap-1.5">
              <p className="max-w-[85%] whitespace-pre-wrap border hairline bg-shale px-4 py-3 text-[0.9375rem] leading-relaxed sm:max-w-[70%]">
                {m.texto}
              </p>
              <span className="text-[0.75rem] tabular-nums text-ash">{m.hora}</span>
            </div>
          ) : (
            <Respuesta
              key={m.id}
              agente={m.de}
              hora={m.hora}
              texto={m.texto}
              detenido={m.detenido}
              copiado={copiado === m.id}
              onCopiar={() => copiar(m)}
            />
          ),
        )}
        {pensando ? (
          <div className="chat-demo__entra flex items-center gap-3">
            <Personaje agente={pensando} avatar className="h-9 w-9 shrink-0" />
            <span className="chat-demo__puntos" aria-label={`${AGENTE_POR_ID[pensando].nombre} está escribiendo`}>
              <i />
              <i />
              <i />
            </span>
          </div>
        ) : null}
        {escribiendo ? <Respuesta agente={escribiendo.agente} texto={escribiendo.texto} /> : null}
      </div>

      {/* Sugerencias y barra para escribir */}
      <div className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Prueba una acción">
          {ACCIONES.filter((_, i) => i % 2 === 0).map((a) => (
            <button key={a.key} type="button" className="chat-demo__sugerencia" disabled={ocupado} onClick={() => enviar(a.name)}>
              {a.name}
            </button>
          ))}
        </div>
        <PromptBar
          placeholder="Escríbele a tu equipo… usa @ para elegir agente o / para una acción"
          sources={FUENTES}
          commands={ACCIONES}
          models={[]}
          efforts={[]}
          busy={ocupado}
          onSend={(texto) => enviar(texto)}
          onStop={detener}
          background="var(--color-shale)"
          color="var(--color-bone-white)"
          menuBackground="var(--color-void)"
          width={4000}
          radius={0}
          maxRows={5}
        />
        <p className="mt-4 text-center text-[0.8125rem] leading-relaxed text-ash">
          Es una demostración con nombres y cifras de ejemplo. En tu panel te contesta la inteligencia artificial de verdad.
        </p>
      </div>
    </div>
  );
}

/** Mensaje de un agente: su personaje chiquito, nombre, hora, texto y "Copiar". */
function Respuesta({
  agente,
  texto,
  hora,
  detenido,
  copiado,
  onCopiar,
}: {
  agente: IdAgente;
  texto: string;
  hora?: string;
  detenido?: boolean;
  copiado?: boolean;
  onCopiar?: () => void;
}) {
  const info = AGENTE_POR_ID[agente];
  return (
    <div className="chat-demo__entra grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 sm:gap-x-4">
      <Personaje agente={agente} avatar className="h-9 w-9" />
      <div className="min-w-0">
        <p className="flex items-baseline gap-2 text-[0.8125rem]">
          <span className="font-medium text-bone">{info.nombre}</span>
          <span className="text-ash">{info.area}</span>
          {hora ? <span className="tabular-nums text-ash">· {hora}</span> : null}
        </p>
        <div className="chat-demo__texto mt-2 text-[0.9375rem] leading-relaxed text-silver">
          <Texto texto={texto} />
        </div>
        {detenido ? <p className="mt-2 text-[0.8125rem] text-ash">Respuesta detenida.</p> : null}
        {onCopiar ? (
          <button type="button" className="chat-demo__accion mt-3" onClick={onCopiar}>
            {copiado ? "Copiado" : "Copiar"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
