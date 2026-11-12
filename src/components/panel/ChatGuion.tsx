"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ACCIONES, INICIO, SALUDO, responder, type Conversacion as ConvBase, type Mensaje as MsjBase, type Turno } from "@/components/ChatDemo";
import PromptBar, { type PromptBarSource } from "@/components/PromptBar";
import { useSubirDesdeChat } from "./negocio/SubirDesdeChat";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, AGENTES_INFO, IDS_AGENTES, esIdAgente, type IdAgente } from "@/lib/agentes";
import { Conversacion } from "./Conversacion";
import { lanzarFragmentos } from "./FondoFragmentos";
import { FranjaPendientes, UsoPlan } from "./Franja";
import { Inicio } from "./Inicio";
import { AvisoHilo, Copiar, DiaHilo, Escribiendo, MensajeAgente, MensajeTuyo, TarjetaTrabajo, nombresDe } from "./Mensajes";
import { NuevoGrupo } from "./NuevoGrupo";
import { claseBoton } from "./Piezas";
import { SelectorAgente, type OpcionAgente } from "./Selector";
import { PEDIDOS, pedidosDe, type IdArea } from "./pedidos";

/* =====================================================================
   El chat de /pruebalo: el GUION LOCAL de ChatDemo (no llama a la IA).
   Las conversaciones de ejemplo, las acciones "/" y las respuestas son
   las mismas del chat de demostración del sitio; aquí se pintan con la
   forma del panel nuevo y la respuesta "llega" palabra por palabra.
   ===================================================================== */

export type ConvGuion = ConvBase & { titulo: string };

/** Los mensajes nuevos empiezan aquí (los del guion de inicio son menores). */
const PRIMER_NUEVO = 1000;
const ahora = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
const reducido = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** El título de una conversación del guion para el menú: el nombre del grupo, o lo que se pidió. */
function tituloDe(c: ConvBase) {
  if (c.agentes.length > 1) return c.nombre;
  const primero = c.mensajes.find((m) => m.de === "tu");
  return ACCIONES.find((a) => primero?.texto.trim() === a.name)?.description ?? c.nombre;
}

/** Si se envió el texto de una tarjeta "Pídele a tu equipo", contesta su acción del guion. */
function responderDemo(texto: string, c: ConvBase): Turno[] {
  const p = PEDIDOS.find((x) => x.texto === texto.trim());
  if (p && c.agentes.includes(p.agente)) {
    if (p.respuestaDemo) return [{ agente: p.agente, texto: p.respuestaDemo }];
    if (p.comando) return responder(p.comando, c);
  }
  return responder(texto, c);
}

/** Lo que ya terminó de "llegar" (para no repetirlo al volver a la conversación). */
const yaLlegaron = new Set<number>();

/** Las conversaciones nuevas de esta visita, para que no se pierdan al recargar (solo en esta pestaña). */
const CLAVE_SESION = "atendel-pruebalo-chats";
const esConvGuardada = (c: unknown): c is ConvGuion => {
  const x = c as ConvGuion;
  return Boolean(x && typeof x.id === "string" && x.id.startsWith("n") && Array.isArray(x.agentes) && x.agentes.every(esIdAgente) && Array.isArray(x.mensajes) && typeof x.titulo === "string");
};

/** El estado del chat de ejemplo. Vive arriba (en el panel de ejemplo) para que no se pierda al cambiar de sección. */
export function useGuion() {
  const [convs, setConvs] = useState<ConvGuion[]>(() => INICIO.map((c) => ({ ...c, titulo: tituloDe(c) })));
  const [pendiente, setPendiente] = useState<{ conv: string; agente: IdAgente } | null>(null);
  /** Ya se leyó lo guardado en la pestaña (antes de esto, una ?con=n… todavía puede aparecer). */
  const [listo, setListo] = useState(false);
  const siguiente = useRef(PRIMER_NUEVO);
  const orden = useRef(10);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    try {
      const guardadas = JSON.parse(window.sessionStorage.getItem(CLAVE_SESION) ?? "[]") as unknown[];
      const nuevas = Array.isArray(guardadas) ? guardadas.filter(esConvGuardada).slice(0, 12) : [];
      if (nuevas.length) {
        for (const c of nuevas) for (const m of c.mensajes) yaLlegaron.add(m.id);
        siguiente.current = Math.max(siguiente.current, ...nuevas.flatMap((c) => c.mensajes.map((m) => m.id + 1)));
        orden.current = Math.max(orden.current, ...nuevas.map((c) => c.orden));
        setConvs((cs) => [...nuevas.filter((n) => !cs.some((c) => c.id === n.id)), ...cs]);
      }
    } catch {
      /* sin almacenamiento: se empieza de cero */
    }
    setListo(true);
  }, []);
  useEffect(() => {
    if (!listo) return;
    try {
      window.sessionStorage.setItem(CLAVE_SESION, JSON.stringify(convs.filter((c) => c.id.startsWith("n")).slice(0, 12)));
    } catch {
      /* sin almacenamiento: no se recuerda */
    }
  }, [convs, listo]);

  const limpiar = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => limpiar(), []);

  const agregar = (id: string, m: Omit<MsjBase, "id">) =>
    setConvs((cs) => cs.map((c) => (c.id === id ? { ...c, orden: ++orden.current, mensajes: [...c.mensajes, { ...m, id: siguiente.current++ }].slice(-60) } : c)));

  /** Cada agente "escribe" un momento (los puntitos) y luego llega su mensaje. */
  const correr = (id: string, turnos: Turno[]) => {
    const quieto = reducido();
    const turno = (i: number) => {
      if (i >= turnos.length) {
        setPendiente(null);
        return;
      }
      const t = turnos[i];
      const anterior = turnos[i - 1];
      if (t.recibe && anterior) agregar(id, { de: "paso", texto: "le pasa lo que sigue a", hora: ahora(), paso: { de: anterior.agente, a: t.recibe } });
      setPendiente({ conv: id, agente: t.agente });
      const espera = quieto ? 400 : Math.min(1800, 900 + t.texto.length * 2);
      timers.current.push(
        window.setTimeout(() => {
          agregar(id, { de: t.agente, texto: t.texto, hora: ahora(), tarjeta: t.tarjeta });
          if (i + 1 < turnos.length) setPendiente(null);
          timers.current.push(window.setTimeout(() => turno(i + 1), i + 1 < turnos.length ? 1100 : 0));
        }, espera),
      );
    };
    timers.current.push(window.setTimeout(() => turno(0), 450));
  };

  const enviar = (c: ConvGuion, texto: string) => {
    const limpio = texto.trim();
    if (!limpio || pendiente) return;
    limpiar();
    agregar(c.id, { de: "tu", texto: limpio, hora: ahora() });
    correr(c.id, responderDemo(limpio, c));
  };

  /** Una conversación nueva (sin nombre: un chat; con nombre: un grupo que saluda). */
  const crear = (agentes: IdAgente[], nombre: string | null, titulo: string): ConvGuion => {
    const id = `n${Date.now()}`;
    const c: ConvGuion = {
      id,
      nombre: nombre ?? nombresDe(agentes),
      titulo: (nombre ?? titulo).replace(/\s+/g, " ").slice(0, 80),
      agentes,
      sinLeer: 0,
      orden: ++orden.current,
      mensajes: nombre ? [{ id: siguiente.current++, de: "sistema", hora: ahora(), texto: `Creaste el grupo «${nombre}» con ${nombresDe(agentes)}.` }] : [],
    };
    setConvs((cs) => [c, ...cs]);
    if (nombre) {
      limpiar();
      correr(
        id,
        agentes.map((a, i) => ({ agente: a, texto: i === agentes.length - 1 ? `${SALUDO[a]} Menciónanos con @ para pedirle algo a alguien en especial.` : SALUDO[a] })),
      );
    }
    return c;
  };

  const detener = () => {
    limpiar();
    setPendiente(null);
  };

  const borrar = (id: string) => {
    if (pendiente?.conv === id) detener();
    setConvs((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs));
  };

  return { convs, pendiente, listo, enviar, crear, borrar, detener };
}
export type Guion = ReturnType<typeof useGuion>;

const fuentesDe = (ids: readonly IdAgente[]): PromptBarSource[] =>
  ids.map((id) => ({
    key: id,
    name: AGENTE_POR_ID[id].nombre,
    description: `${AGENTE_POR_ID[id].area} · ${AGENTE_POR_ID[id].abarca}`,
    icon: <Personaje agente={id} avatar className="chat__personaje-menu" />,
  }));
const comandosDe = (ids: readonly IdAgente[]) => ACCIONES.filter((a) => ids.includes(a.agente)).map((a) => ({ key: a.key, name: a.name, description: a.description }));

/* ---------- El Inicio de /pruebalo ---------- */

export function InicioDemo({
  guion,
  saludo,
  area,
  agentePedido,
  pide,
  pendientes,
  usados,
  total,
  alEmpezar,
}: {
  guion: Guion;
  saludo: string;
  area: IdArea;
  agentePedido: IdAgente | null;
  pide?: string;
  pendientes: number;
  usados: number;
  total: number;
  /** Ya se creó la conversación y se envió el texto: el panel abre ?con=. */
  alEmpezar: (id: string) => void;
}) {
  const [eleccion, setEleccion] = useState<string>(agentePedido ?? "equipo");
  const subida = useSubirDesdeChat();
  const [creando, setCreando] = useState(false);
  useEffect(() => {
    if (agentePedido) setEleccion(agentePedido);
  }, [agentePedido]);
  const agentes: IdAgente[] = esIdAgente(eleccion) ? [eleccion] : [...IDS_AGENTES];
  const info = agentes.length === 1 ? AGENTE_POR_ID[agentes[0]] : null;

  const opciones: OpcionAgente[] = [
    { id: "equipo", etiqueta: "Todo el equipo", detalle: nombresDe(IDS_AGENTES), agentes: [...IDS_AGENTES] },
    ...AGENTES_INFO.map((a) => ({ id: a.id, etiqueta: a.nombre, detalle: `${a.area} · ${a.abarca}`, agentes: [a.id] })),
    { id: "nuevo-grupo", etiqueta: "Nuevo grupo…", agentes: [], accion: true },
  ];
  const conFiltro = area === "todo" ? "" : `&area=${area}`;

  return (
    <>
      <Inicio
        saludo={saludo}
        caja={
          <PromptBar
            key={`${eleccion}-${pide ?? ""}`}
            className="pc-caja"
            initialText={pide}
            placeholder={info ? `Pídele algo a ${info.nombre}…` : "Pregúntale a tu equipo… (escribe @ para elegir agente)"}
            forma="fila"
            sources={fuentesDe(agentes)}
            plusActions={subida.acciones}
            commands={comandosDe(agentes)}
            models={[]}
            efforts={[]}
            onSend={(texto) => {
              const limpio = texto.trim();
              if (!limpio) return;
              const c = guion.crear(agentes, null, limpio);
              guion.enviar(c, limpio);
              alEmpezar(c.id);
            }}
            maxRows={8}
            sparkBoost={0}
            dictarPronto
          />
        }
        selector={
          <SelectorAgente
            opciones={opciones}
            activa={eleccion}
            alElegir={(id) => {
              if (id === "nuevo-grupo") setCreando(true);
              else setEleccion(id);
            }}
          />
        }
        uso={<UsoPlan plan="Max" usados={usados} total={total} href="/pruebalo?vista=ajustes&seccion=uso" />}
        franja={<FranjaPendientes n={pendientes} href="/pruebalo?vista=pendientes" />}
        area={area}
        hrefArea={(a) => (a === "todo" ? "/pruebalo" : `/pruebalo?area=${a}`)}
        tarjetas={pedidosDe(area).map((p) => ({ pedido: p, href: `/pruebalo?agente=${p.agente}&pide=${encodeURIComponent(p.texto)}${conFiltro}` }))}
      />
      <NuevoGrupo
        abierto={creando}
        onCerrar={() => setCreando(false)}
        nombreObligatorio
        onCrear={(nombre, ids) => {
          setCreando(false);
          const c = guion.crear(ids, nombre, nombre);
          alEmpezar(c.id);
        }}
      />
      {subida.elementos}
    </>
  );
}

/* ---------- Una conversación del guion ---------- */



function MensajeQueLlega({ m, cabeza, ultimo, alCrecer }: { m: MsjBase & { de: IdAgente }; cabeza: boolean; ultimo: boolean; alCrecer: () => void }) {
  const nuevo = m.id >= PRIMER_NUEVO;
  // Solo la primera vez que llega se escribe en vivo (al volver a la conversación ya está)
  const [enVivo] = useState(() => nuevo && !yaLlegaron.has(m.id) && !reducido());
  useEffect(() => {
    yaLlegaron.add(m.id);
  }, [m.id]);
  useLayoutEffect(() => {
    alCrecer();
  }, [alCrecer]);
  return (
    <MensajeAgente
      agente={m.de}
      texto={m.texto}
      cabeza={cabeza}
      nuevo={nuevo}
      enCurso={enVivo}
      hora={cabeza ? m.hora : undefined}
      tarjeta={m.tarjeta ? <TarjetaTrabajo tarjeta={m.tarjeta} aprobable /> : null}
      pie={ultimo ? <Copiar texto={m.texto.replace(/\*\*/g, "")} /> : null}
    />
  );
}

export function ConversacionDemo({ guion, conv }: { guion: Guion; conv: ConvGuion }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pegado = useRef(true);
  const subida = useSubirDesdeChat();
  const escribe = guion.pendiente?.conv === conv.id ? guion.pendiente.agente : null;
  const grupo = conv.agentes.length > 1;
  const info = AGENTE_POR_ID[conv.agentes[0]];

  const bajar = useCallback(() => {
    const el = scrollRef.current;
    if (el && pegado.current) el.scrollTop = el.scrollHeight;
  }, []);
  useLayoutEffect(() => {
    pegado.current = true;
    bajar();
  }, [conv.id, bajar]);
  useLayoutEffect(bajar, [conv.mensajes.length, escribe, bajar]);

  const ms = conv.mensajes;
  return (
    <Conversacion
      agentes={conv.agentes}
      titulo={conv.titulo}
      sub={grupo ? `Grupo · ${nombresDe(conv.agentes)}` : `${info.nombre} · ${info.area} · ${info.abarca}`}
      estado={escribe ? `${AGENTE_POR_ID[escribe].nombre} está escribiendo…` : null}
      menu={[
        { id: "nueva", etiqueta: "Nueva conversación", icono: "mas", href: "/pruebalo" },
        ...(guion.convs.length > 1 ? [{ id: "borrar", etiqueta: "Borrar conversación", icono: "basura" as const, href: "/pruebalo", alElegir: () => guion.borrar(conv.id), peligroso: true }] : []),
      ]}
      scrollRef={scrollRef}
      alDesplazar={(e) => {
        const el = e.currentTarget;
        pegado.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      }}
      caja={
        <PromptBar
          key={conv.id}
          className="pc-caja"
          placeholder={grupo ? "Pídele algo a tu equipo… (usa @ para alguien en especial)" : `Pídele algo a ${info.nombre}…`}
          forma="fila"
          sources={fuentesDe(conv.agentes)}
          plusActions={subida.acciones}
          commands={comandosDe(conv.agentes)}
          models={[]}
          efforts={[]}
          busy={escribe !== null}
          onSend={(t) => {
            lanzarFragmentos(document.querySelector(".pc-conv__caja .pc-caja"));
            guion.enviar(conv, t);
          }}
          onStop={guion.detener}
          maxRows={8}
          sparkBoost={0}
          dictarPronto
        />
      }
      legal="Datos de ejemplo: las respuestas son un guion, no la IA. En tu panel contestan tus agentes de verdad."
    >
      <div role="log" aria-live="polite" aria-label="Mensajes" className="pc-hilo">
        {ms.map((m, i) => {
          const antes = ms[i - 1];
          const diaAntes = antes ? (antes.dia ?? "Hoy") : null;
          const diaEste = m.dia ?? "Hoy";
          const nuevoDia = diaAntes !== diaEste;
          const cabeza = nuevoDia || !antes || antes.de !== m.de;
          const ultimo = i === ms.length - 1;
          const nuevo = m.id >= PRIMER_NUEVO;
          let pieza;
          if (m.de === "tu") pieza = <MensajeTuyo texto={m.texto} nuevo={nuevo} />;
          else if (m.de === "sistema")
            pieza = (
              <AvisoHilo icono="usuarios" nuevo={nuevo}>
                {m.texto}
              </AvisoHilo>
            );
          else if (m.de === "paso" && m.paso)
            pieza = (
              <AvisoHilo icono="flecha" nuevo={nuevo}>
                <strong>{AGENTE_POR_ID[m.paso.de].nombre}</strong> {m.texto} <strong>{AGENTE_POR_ID[m.paso.a].nombre}</strong>
              </AvisoHilo>
            );
          else if (esIdAgente(m.de)) pieza = <MensajeQueLlega m={m as MsjBase & { de: IdAgente }} cabeza={cabeza} ultimo={ultimo && !escribe} alCrecer={bajar} />;
          return (
            <Fragment key={m.id}>
              {nuevoDia ? <DiaHilo>{diaEste}</DiaHilo> : null}
              {pieza}
            </Fragment>
          );
        })}
        {escribe ? <Escribiendo agente={escribe} cabeza={ms[ms.length - 1]?.de !== escribe} /> : null}
      </div>
      {subida.elementos}
    </Conversacion>
  );
}
