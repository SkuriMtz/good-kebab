"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ACCIONES, INICIO, SALUDO, responder, type Conversacion as ConvBase, type Mensaje as MsjBase, type Turno } from "@/components/ChatDemo";
import PromptBar from "@/components/PromptBar";
import { useSubirDesdeChat } from "./negocio/SubirDesdeChat";
import { AGENTE_POR_ID, IDS_AGENTES, esIdAgente, type IdAgente } from "@/lib/agentes";
import { separarDatos } from "@/lib/demo-marcas";
import { partirIntervenciones } from "@/lib/grupo";
import type { Tarjeta } from "@/components/chat/Piezas";
import { Conversacion } from "./Conversacion";
import { lanzarFragmentos } from "./FondoFragmentos";
import { useSugerencia } from "./sugerencias";
import { Inicio } from "./Inicio";
import { DiaHilo, MensajeTuyo, RespuestaAtendel, TarjetaTrabajo, nombresDe } from "./Mensajes";
import { claseBoton } from "./Piezas";
import { PEDIDOS, pedidosDe, type IdArea } from "./pedidos";
import { modeloElegido, useModelo } from "./modelo";
import { SelectorModelo } from "./SelectorModelo";
import { PLAN_POR_ID } from "@/lib/planes";
import { DEMO_NEGOCIO } from "@/lib/demo-dashboard";

/** El plan de la demostración (Max: trae Rápido y Avanzado). */
const PLAN_DEMO = PLAN_POR_ID[DEMO_NEGOCIO.plan];

/* =====================================================================
   El chat de /pruebalo: contesta la IA DE VERDAD (/api/demo/chat, con los
   datos de ejemplo de Estudio Luna y un límite de 20 mensajes al día). Si la
   IA no está disponible o se acabó el límite, avisa y contesta el GUION
   LOCAL de ChatDemo, como antes.
   Las conversaciones de ejemplo, las acciones "/" y las respuestas son
   las mismas del chat de demostración del sitio; aquí se pintan con la
   forma del panel nuevo y la respuesta "llega" palabra por palabra.
   ===================================================================== */

export type ConvGuion = ConvBase & { titulo: string };

/** El idioma que se eligió en Ajustes > Apariencia (lo guarda el armazón en la pestaña). */
const idiomaElegido = () => {
  try {
    return window.sessionStorage.getItem("atendel-idioma") ?? "es-MX";
  } catch {
    return "es-MX";
  }
};

/** Los mensajes nuevos empiezan aquí (los del guion de inicio son menores). */
const PRIMER_NUEVO = 1000;
const ahora = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
const reducido = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Un envío que un agente deja en Pendientes en /pruebalo (lo escucha PanelDemo). */
export const EVENTO_PENDIENTE_DEMO = "atendel:demo-pendiente";

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
/** Las conversaciones del ejemplo que se eliminaron o renombraron en esta pestaña. */
const CLAVE_CAMBIOS = "atendel-pruebalo-cambios";
const esConvGuardada = (c: unknown): c is ConvGuion => {
  const x = c as ConvGuion;
  return Boolean(x && typeof x.id === "string" && x.id.startsWith("n") && Array.isArray(x.agentes) && x.agentes.every(esIdAgente) && Array.isArray(x.mensajes) && typeof x.titulo === "string");
};

/** El estado del chat de ejemplo. Vive arriba (en el panel de ejemplo) para que no se pierda al cambiar de sección. */
export function useGuion() {
  const [convs, setConvs] = useState<ConvGuion[]>(() => INICIO.map((c) => ({ ...c, titulo: tituloDe(c) })));
  /** Quién está contestando; `puntos`: todavía no llega texto (se ven los puntitos). */
  const [pendiente, setPendiente] = useState<{ conv: string; agente: IdAgente; puntos?: boolean } | null>(null);
  /** Cuántos mensajes con IA le quedan hoy a esta visita (lo dice el servidor). */
  const [quedan, setQuedan] = useState<number | null>(null);
  const corte = useRef<AbortController | null>(null);
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
      // Lo que se eliminó o renombró de las de ejemplo
      const cambios = JSON.parse(window.sessionStorage.getItem(CLAVE_CAMBIOS) ?? "{}") as { borradas?: unknown; nombres?: unknown };
      const borradas = Array.isArray(cambios.borradas) ? cambios.borradas.filter((x): x is string => typeof x === "string") : [];
      const nombres = cambios.nombres && typeof cambios.nombres === "object" ? (cambios.nombres as Record<string, unknown>) : {};
      setConvs((cs) => {
        const quedan = cs.filter((c) => !borradas.includes(c.id));
        return (quedan.length ? quedan : cs).map((c) => (typeof nombres[c.id] === "string" ? { ...c, titulo: String(nombres[c.id]).slice(0, 80) } : c));
      });
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
          // Lo que deja en Pendientes (un envío por aprobar) llega al tablero de /pruebalo
          if (t.pendiente) window.dispatchEvent(new CustomEvent(EVENTO_PENDIENTE_DEMO, { detail: t.pendiente }));
          if (i + 1 < turnos.length) setPendiente(null);
          timers.current.push(window.setTimeout(() => turno(i + 1), i + 1 < turnos.length ? 1100 : 0));
        }, espera),
      );
    };
    timers.current.push(window.setTimeout(() => turno(0), 450));
  };

  /** Un mensaje nuevo que se va a ir llenando (regresa su id). */
  const nuevo = (conv: string, m: Omit<MsjBase, "id">) => {
    const id = siguiente.current++;
    setConvs((cs) => cs.map((c) => (c.id === conv ? { ...c, orden: ++orden.current, mensajes: [...c.mensajes, { ...m, id }].slice(-60) } : c)));
    return id;
  };
  const cambiarMensaje = (conv: string, id: number, cambios: Partial<MsjBase>) =>
    setConvs((cs) => cs.map((c) => (c.id === conv ? { ...c, mensajes: c.mensajes.map((m) => (m.id === id ? { ...m, ...cambios } : m)) } : c)));

  /** La IA de verdad: el texto llega en vivo; en grupo, cada quien en su mensaje. */
  const conIA = async (c: ConvGuion, texto: string) => {
    const plano = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const mencion = c.agentes.find((a) => plano.includes(`@${AGENTE_POR_ID[a].nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}`));
    setPendiente({ conv: c.id, agente: mencion ?? c.agentes[0], puntos: true });
    const control = new AbortController();
    corte.current = control;
    const historial = c.mensajes.filter((m) => m.de === "tu" || esIdAgente(m.de)).map((m) => ({ de: m.de, texto: m.texto })).slice(-16);
    const ids: number[] = [];
    let tarjeta: Tarjeta | null = null;
    let vistos = 0;
    let acumulado = "";
    const procesar = () => {
      const corteError = acumulado.indexOf("\u0000ERROR:");
      const crudo = corteError >= 0 ? acumulado.slice(0, corteError) : acumulado;
      const { texto: limpio, datos } = separarDatos(crudo);
      for (const d of datos.slice(vistos)) {
        vistos++;
        if (d.tipo === "presentacion") {
          const t: Tarjeta = {
            tipo: "archivo",
            sello: "PowerPoint",
            estado: "Listo",
            titulo: d.datos.titulo,
            datos: [
              ["Diapositivas", String(d.datos.diapositivas.length + 1)],
              ["Archivo", d.archivo],
            ],
            presentacion: d.datos,
          };
          if (ids.length) cambiarMensaje(c.id, ids[ids.length - 1], { tarjeta: t });
          else tarjeta = t;
        } else if (d.tipo === "envio") {
          const p = d.pendiente;
          window.dispatchEvent(new CustomEvent(EVENTO_PENDIENTE_DEMO, { detail: { ...p, agente: esIdAgente(p.agente) ? p.agente : c.agentes[0] } }));
        }
      }
      const piezas = c.agentes.length > 1 ? partirIntervenciones(limpio, c.agentes, true) : [{ agente: c.agentes[0], texto: limpio.trim() }];
      piezas.forEach((p, i) => {
        if (ids[i] === undefined) {
          if (!p.texto) return;
          ids[i] = nuevo(c.id, { de: p.agente, texto: p.texto, hora: ahora(), ...(tarjeta ? { tarjeta } : {}) });
          tarjeta = null;
          setPendiente({ conv: c.id, agente: p.agente, puntos: false });
        } else cambiarMensaje(c.id, ids[i], { de: p.agente, texto: p.texto });
      });
      return corteError >= 0 ? acumulado.slice(corteError + "\u0000ERROR:".length) : null;
    };
    try {
      const r = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentes: c.agentes, historial, mensaje: texto, tema: c.agentes.length > 1 ? c.nombre : null, idioma: idiomaElegido(), modelo: modeloElegido() }),
        signal: control.signal,
      });
      if (!r.ok || !r.body) {
        const j = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "La IA de la demostración no está disponible ahora.");
      }
      const q = Number(r.headers.get("X-Demo-Quedan"));
      if (Number.isFinite(q)) setQuedan(q);
      const lector = r.body.getReader();
      const decodificar = new TextDecoder();
      let fallo: string | null = null;
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        acumulado += decodificar.decode(value, { stream: true });
        fallo = procesar();
      }
      acumulado += decodificar.decode();
      fallo = procesar();
      if (fallo) agregar(c.id, { de: "sistema", texto: fallo, hora: ahora() });
      if (tarjeta && !ids.length) nuevo(c.id, { de: c.agentes.includes("iris") ? "iris" : c.agentes[0], texto: "Listo, aquí está.", hora: ahora(), tarjeta });
      setPendiente(null);
    } catch (e) {
      if (control.signal.aborted) return;
      // Sin IA (límite, sin llave o sin red): se avisa y contesta el guion de ejemplo
      agregar(c.id, { de: "sistema", texto: `${e instanceof Error ? e.message : "La IA no está disponible ahora."} Te contesto con un ejemplo.`, hora: ahora() });
      correr(c.id, responderDemo(texto, c));
    } finally {
      if (corte.current === control) corte.current = null;
    }
  };

  const enviar = (c: ConvGuion, texto: string) => {
    const limpio = texto.trim();
    if (!limpio || pendiente) return;
    limpiar();
    agregar(c.id, { de: "tu", texto: limpio, hora: ahora() });
    void conIA(c, limpio);
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
    corte.current?.abort();
    corte.current = null;
    setPendiente(null);
  };

  /** Recuerda en la pestaña lo que cambió de las conversaciones de ejemplo (las nuevas ya se guardan completas). */
  const recordar = (cambio: (c: { borradas: string[]; nombres: Record<string, string> }) => void) => {
    try {
      const c = JSON.parse(window.sessionStorage.getItem(CLAVE_CAMBIOS) ?? "{}") as { borradas?: string[]; nombres?: Record<string, string> };
      const datos = { borradas: Array.isArray(c.borradas) ? c.borradas : [], nombres: c.nombres && typeof c.nombres === "object" ? c.nombres : {} };
      cambio(datos);
      window.sessionStorage.setItem(CLAVE_CAMBIOS, JSON.stringify(datos));
    } catch {
      /* sin almacenamiento: no se recuerda */
    }
  };

  const borrar = (id: string) => {
    if (pendiente?.conv === id) detener();
    setConvs((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs));
    recordar((c) => {
      if (!c.borradas.includes(id)) c.borradas.push(id);
    });
  };

  const renombrar = (id: string, titulo: string) => {
    setConvs((cs) => cs.map((c) => (c.id === id ? { ...c, titulo } : c)));
    recordar((c) => {
      c.nombres[id] = titulo;
    });
  };

  return { convs, pendiente, listo, quedan, enviar, crear, borrar, renombrar, detener };
}
export type Guion = ReturnType<typeof useGuion>;

/* ---------- El Inicio de /pruebalo ---------- */

const comandosDe = (ids: readonly IdAgente[]) => ACCIONES.filter((a) => ids.includes(a.agente)).map((a) => ({ key: a.key, name: a.name, description: a.description }));

export function InicioDemo({
  guion,
  saludo,
  area,
  agentePedido,
  pide,
  alEmpezar,
}: {
  guion: Guion;
  saludo: string;
  area: IdArea;
  agentePedido: IdAgente | null;
  pide?: string;
  /** Ya se creó la conversación y se envió el texto: el panel abre ?con=. */
  alEmpezar: (id: string) => void;
}) {
  const subida = useSubirDesdeChat();
  // Rápido o Avanzado, como en tu cuenta (la demostración es Max: trae los dos)
  const selector = useModelo(PLAN_DEMO.modelos);
  // Chat único: le escribes a Atendel y él reparte el trabajo a todo el equipo
  const agentes: IdAgente[] = [...IDS_AGENTES];
  // En vez de "Pregúntale a tu equipo…": algo que se le puede pedir, al azar
  const { texto: sugerencia, cambiando } = useSugerencia(agentes);
  const conFiltro = area === "todo" ? "" : `&area=${area}`;

  return (
    <>
      <Inicio
        saludo={saludo}
        uso={<SelectorModelo modelo={selector.modelo} permitidos={PLAN_DEMO.modelos} alElegir={selector.elegir} />}
        caja={
          <PromptBar
            key={`atendel-${pide ?? ""}-${agentePedido ?? ""}`}
            className={`pc-caja${cambiando ? " pc-caja--cambia" : ""}`}
            initialText={pide}
            placeholder={sugerencia}
            forma="fila"
            sources={[]}
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
        selector={null}
        area={area}
        hrefArea={(a) => (a === "todo" ? "/pruebalo" : `/pruebalo?area=${a}`)}
        tarjetas={pedidosDe(area).map((p) => ({ pedido: p, href: `/pruebalo?agente=${p.agente}&pide=${encodeURIComponent(p.texto)}${conFiltro}` }))}
      />
      {subida.elementos}
    </>
  );
}

/* ---------- Una conversación del guion ---------- */



export function ConversacionDemo({ guion, conv }: { guion: Guion; conv: ConvGuion }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pegado = useRef(true);
  const subida = useSubirDesdeChat();
  const selector = useModelo(PLAN_DEMO.modelos);
  const ocupado = guion.pendiente?.conv === conv.id ? guion.pendiente : null;
  // Los puntitos solo mientras no llega texto; luego el mensaje se escribe solo
  const escribe = ocupado && ocupado.puntos !== false ? ocupado.agente : null;

  const bajar = useCallback(() => {
    const el = scrollRef.current;
    if (el && pegado.current) el.scrollTop = el.scrollHeight;
  }, []);
  useLayoutEffect(() => {
    pegado.current = true;
    bajar();
  }, [conv.id, bajar]);
  useLayoutEffect(bajar, [conv.mensajes.length, escribe, bajar]);

  // Tus mensajes y, entre uno y otro, UNA respuesta de Atendel (cada parte la hizo su agente)
  type Bloque =
    | { tipo: "tu"; key: string; texto: string; dia: string; nuevo: boolean }
    | { tipo: "atendel"; key: string; piezas: { agente: IdAgente; texto: string }[]; tarjetas: Tarjeta[]; dia: string; hora?: string; nuevo: boolean };
  const bloques: Bloque[] = [];
  for (const m of conv.mensajes) {
    const dia = m.dia ?? "Hoy";
    const nuevo = m.id >= PRIMER_NUEVO;
    if (m.de === "tu") {
      bloques.push({ tipo: "tu", key: String(m.id), texto: m.texto, dia, nuevo });
      continue;
    }
    // Los avisos de grupo y de "le pasa el seguimiento a…" ya no van: Atendel reparte por dentro
    if (!esIdAgente(m.de)) continue;
    const ultimo = bloques[bloques.length - 1];
    if (ultimo && ultimo.tipo === "atendel" && ultimo.dia === dia) {
      ultimo.piezas.push({ agente: m.de, texto: m.texto });
      if (m.tarjeta) ultimo.tarjetas.push(m.tarjeta);
    } else bloques.push({ tipo: "atendel", key: String(m.id), piezas: [{ agente: m.de, texto: m.texto }], tarjetas: m.tarjeta ? [m.tarjeta] : [], dia, hora: m.hora, nuevo });
  }
  // Mientras Atendel trabaja y todavía no llega texto: los triangulitos
  if (escribe && bloques[bloques.length - 1]?.tipo !== "atendel") bloques.push({ tipo: "atendel", key: "trabajando", piezas: [], tarjetas: [], dia: bloques[bloques.length - 1]?.dia ?? "Hoy", nuevo: true });

  return (
    <Conversacion
      agentes={conv.agentes}
      titulo={conv.titulo}
      sub={`Atendel · ${nombresDe(conv.agentes)}`}
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
          placeholder="Pídele algo a Atendel…"
          forma="fila"
          sources={[]}
          plusActions={subida.acciones}
          commands={comandosDe(conv.agentes)}
          models={[]}
          efforts={[]}
          busy={ocupado !== null}
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
      modelo={<SelectorModelo modelo={selector.modelo} permitidos={PLAN_DEMO.modelos} alElegir={selector.elegir} hacia="arriba" />}
      legal={`Atendel puede equivocarse. Revisa lo importante antes de enviarlo a un cliente.${guion.quedan !== null && guion.quedan <= 5 ? ` Te quedan ${guion.quedan} mensajes hoy.` : ""}`}
    >
      <div role="log" aria-live="polite" aria-label="Mensajes" className="pc-hilo">
        {bloques.map((b, i) => {
          const nuevoDia = i === 0 || bloques[i - 1].dia !== b.dia;
          const ultimo = i === bloques.length - 1;
          return (
            <Fragment key={b.key}>
              {nuevoDia ? <DiaHilo>{b.dia}</DiaHilo> : null}
              {b.tipo === "tu" ? (
                <MensajeTuyo texto={b.texto} nuevo={b.nuevo} />
              ) : (
                <RespuestaAtendel
                  piezas={b.piezas}
                  enCurso={ultimo && ocupado !== null}
                  nuevo={b.nuevo}
                  hora={b.hora}
                  tarjetas={b.tarjetas.length ? b.tarjetas.map((t, k) => <TarjetaTrabajo key={k} tarjeta={t} aprobable />) : null}
                  copiar={ultimo}
                />
              )}
            </Fragment>
          );
        })}
      </div>
      {subida.elementos}
    </Conversacion>
  );
}
