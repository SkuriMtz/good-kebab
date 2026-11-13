"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import PromptBar, { type PromptBarSource } from "@/components/PromptBar";
import { Personaje } from "@/components/agentes/Personaje";
import { Giro } from "@/components/base/Iconos";
import { ContextoChats } from "@/components/panel/contexto";
import { EVENTO_CHAT_ELIMINADO, EVENTO_CHAT_RENOMBRADO } from "@/components/panel/MenuChats";
import { Conversacion as VistaConversacion } from "@/components/panel/Conversacion";
import { lanzarFragmentos } from "@/components/panel/FondoFragmentos";
import { Inicio } from "@/components/panel/Inicio";
import { AvisoHilo, Copiar, DiaHilo, Escribiendo, LineaEscribe, MensajeAgente, MensajeTuyo, nombresDe } from "@/components/panel/Mensajes";
import { separarEstado } from "@/lib/estado-chat";
import { useSubirDesdeChat } from "@/components/panel/negocio/SubirDesdeChat";
import { NuevoGrupo } from "@/components/panel/NuevoGrupo";
import { ContextoNavegar, Enlace, Modal, claseBoton } from "@/components/panel/Piezas";
import { SelectorAgente, type OpcionAgente } from "@/components/panel/Selector";
import { useSugerencia } from "@/components/panel/sugerencias";
import { esArea, pedidosDe, type IdArea } from "@/components/panel/pedidos";
import { AGENTE_POR_ID, AGENTES_INFO, esIdAgente, type IdAgente } from "@/lib/agentes";
import { comandosDe } from "@/lib/comandos";
import { partirIntervenciones } from "@/lib/grupo";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";
import type { Bloqueo } from "@/lib/uso-estado";

export type Conversacion = {
  id: string;
  agente: IdAgente;
  titulo: string;
  actualizado_en: string;
  /** Si es un grupo: los agentes que están (2 a 4). */
  participantes?: string[] | null;
  tema?: string | null;
};
type Mensaje = {
  id: string;
  rol: "user" | "assistant";
  contenido: string;
  agente?: string | null;
  creado_en?: string;
  error?: string;
  enCurso?: boolean;
  /** Escrito en esta visita: entra con animación. */
  nuevo?: boolean;
  /** Lo que hace el agente con una app mientras contesta ("Clara está revisando tu correo…"). */
  estado?: string | null;
};
/** Lo que se pinta: cada voz de una respuesta en grupo es su propia pieza. */
type Pieza = {
  key: string;
  de: "tu" | IdAgente;
  texto: string;
  fecha: Date;
  nuevo?: boolean;
  enCurso?: boolean;
  error?: string;
  estado?: string | null;
};

const MARCA_ERROR = "\u0000ERROR:";
const MAX_MENSAJE = 4000;
const MAX_TEMA = 120;

const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const hora = (d: Date) => d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

function dia(d: Date) {
  const hoy = new Date();
  if (mismoDia(d, hoy)) return "Hoy";
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (mismoDia(d, ayer)) return "Ayer";
  return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" });
}

const integrantes = (c: Conversacion): IdAgente[] | null => {
  const p = (c.participantes ?? []).filter(esIdAgente);
  return p.length >= 2 ? p : null;
};

/**
 * Del Inicio a la conversación, en el mismo lugar: la caja viaja de en medio
 * hasta abajo (View Transition, 280ms) y lo demás se cruza. Sin soporte o
 * con "reducir movimiento", cambia al instante.
 */
export function conVista(cambio: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  const html = document.documentElement;
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches || html.classList.contains("vt-pagina")) {
    cambio();
    return;
  }
  html.classList.add("pc-vt-chat");
  try {
    doc
      .startViewTransition(() => flushSync(cambio))
      .finished.catch(() => {})
      .finally(() => html.classList.remove("pc-vt-chat"));
  } catch {
    html.classList.remove("pc-vt-chat");
    cambio();
  }
}

/**
 * El chat con los agentes, que en el panel nuevo ES el Inicio: sin
 * conversación abierta se ven el saludo, la caja y "Pídele a tu equipo"; al
 * enviar, la conversación se abre en el mismo lugar. La lógica es la de
 * siempre: la API (/api/chat, en streaming), los grupos, las @menciones y
 * los comandos (/), y todo se guarda. Las conversaciones viven en el menú
 * (Fijados y Recientes); la dirección cambia (?c=, ?agente=, ?pide=,
 * ?area=) y atrás y recargar funcionan.
 */
export function Chat({
  planId,
  activos,
  bloqueoInicial,
  conversacionesIniciales,
  agenteInicial,
  conversacionInicial,
  textoInicial,
  saludo,
  conGoogle,
}: {
  planId: IdPlan;
  activos: IdAgente[];
  /** Si ya se llegó al límite de uso (sesión de 5 horas o semana): el aviso y hasta cuándo. */
  bloqueoInicial: Bloqueo | null;
  conversacionesIniciales: Conversacion[];
  /** ?agente=: hablar solo con ese agente. Sin esto, con todo el equipo (si el plan trae grupos). */
  agenteInicial: IdAgente | null;
  conversacionInicial: string | null;
  /** Lo que se pidió desde una tarjeta o el buscador: llega escrito, listo para enviar. */
  textoInicial?: string;
  /** "Buenas noches, Ana" (con la hora de la Ciudad de México, igual en el servidor y aquí). */
  saludo: string;
  /** ¿Gmail conectado? (las tarjetas de Clara sin Gmail llevan a conectarlo). */
  conGoogle: boolean;
}) {
  const plan = PLAN_POR_ID[planId];
  const puedeGrupos = activos.length >= 2;
  const [agente, setAgente] = useState<IdAgente>(agenteInicial ?? activos[0] ?? "clara");
  const [grupo, setGrupo] = useState<IdAgente[] | null>(!agenteInicial && puedeGrupos ? activos : null);
  const [tema, setTema] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [conversaciones, setConversaciones] = useState(conversacionesIniciales);
  const [actual, setActual] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [bloqueo, setBloqueo] = useState(bloqueoInicial);
  // A la hora en que se reinicia el límite, el chat se vuelve a abrir solo
  useEffect(() => {
    if (!bloqueo?.hasta) return;
    const falta = new Date(bloqueo.hasta).getTime() - Date.now();
    if (falta > 2_147_000_000) return;
    const t = window.setTimeout(() => setBloqueo(null), Math.max(0, falta) + 1000);
    return () => window.clearTimeout(t);
  }, [bloqueo]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [porBorrar, setPorBorrar] = useState<Conversacion | null>(null);
  const [caja, setCaja] = useState<{ texto?: string; n: number }>({ texto: textoInicial, n: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortar = useRef<AbortController | null>(null);
  const pegado = useRef(true); // ¿la vista está hasta abajo?
  const menu = useContext(ContextoChats);
  /** El "+" de la caja: subir un documento a Tu negocio o ir a conectar una app. */
  const subida = useSubirDesdeChat();
  const router = useRouter();
  const params = useSearchParams();
  const consulta = params.toString();
  /** La última dirección que escribió este chat (para no reaccionar a sus propios cambios). */
  const propia = useRef<string | null>(null);
  const actualRef = useRef(actual);
  actualRef.current = actual;
  const todas = useRef<Conversacion[]>([]);
  todas.current = [...conversaciones, ...conversacionesIniciales];

  const info = AGENTE_POR_ID[agente];
  const participantes: IdAgente[] = grupo ?? [agente];
  const disponible = participantes.every((id) => activos.includes(id));
  const sinMensajes = bloqueo !== null;
  // En la conversación nueva, en vez de "Pregúntale a tu equipo…": algo que se le puede pedir, al azar
  const enInicio = !actual && mensajes.length === 0 && !cargando;
  const { texto: sugerencia, cambiando } = useSugerencia(grupo ?? [agente], enInicio);
  const filtro = params.get("area");
  const area: IdArea = esArea(filtro) ? filtro : "todo";

  /** Escribe la dirección sin ir al servidor (Next la sincroniza); el filtro del Inicio se queda. */
  const ponerUrl = (p: Record<string, string>) => {
    const q = new URLSearchParams(p);
    const filtroActual = new URLSearchParams(window.location.search).get("area");
    if (filtroActual && !p.c) q.set("area", filtroActual);
    const texto = q.toString();
    propia.current = texto;
    window.history.replaceState(null, "", `/panel${texto ? `?${texto}` : ""}`);
  };

  /** En el Inicio, las píldoras y las tarjetas solo cambian la dirección (atrás funciona); lo de fuera navega. */
  const navegarAqui = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.href);
      // Solo lo que se queda en el chat (filtro, tarjeta) cambia sin ir al servidor; una sección sí lo necesita
      if (url.pathname === window.location.pathname && !url.searchParams.has("vista")) window.history.pushState(null, "", `${url.pathname}${url.search}`);
      else router.push(href);
    },
    [router],
  );

  /** Deja el chat listo para una conversación nueva (sin tocar la dirección). */
  const reiniciar = useCallback((ids: IdAgente[] | null, id: IdAgente, temaNuevo: string | null) => {
    abortar.current?.abort();
    setAgente(id);
    setGrupo(ids);
    setTema(temaNuevo);
    setCreando(false);
    setActual(null);
    setMensajes([]);
    setAviso(null);
  }, []);

  const nueva = (id: IdAgente) => {
    reiniciar(null, id, null);
    ponerUrl({ agente: id });
  };

  // El "⋯" del menú cambió el nombre o eliminó una conversación: la cabecera se actualiza y,
  // si era la abierta, se vuelve a una conversación nueva
  const alEliminarDesdeMenu = useRef<(id: string) => void>(() => undefined);
  alEliminarDesdeMenu.current = (id: string) => {
    setConversaciones((l) => l.filter((x) => x.id !== id));
    if (actual === id) {
      const c = todas.current.find((x) => x.id === id);
      reiniciar(null, c?.agente ?? agente, null);
      ponerUrl({});
    }
  };
  useEffect(() => {
    const renombrada = (e: Event) => {
      const d = (e as CustomEvent<{ id: string; titulo: string; campo: string }>).detail;
      setConversaciones((l) => {
        const base = l.some((x) => x.id === d.id) ? l : [...l, ...todas.current.filter((x) => x.id === d.id)];
        return base.map((x) => (x.id === d.id ? { ...x, titulo: d.titulo, ...(d.campo === "tema" ? { tema: d.titulo } : {}) } : x));
      });
    };
    const eliminada = (e: Event) => alEliminarDesdeMenu.current((e as CustomEvent<{ id: string }>).detail.id);
    window.addEventListener(EVENTO_CHAT_RENOMBRADO, renombrada);
    window.addEventListener(EVENTO_CHAT_ELIMINADO, eliminada);
    return () => {
      window.removeEventListener(EVENTO_CHAT_RENOMBRADO, renombrada);
      window.removeEventListener(EVENTO_CHAT_ELIMINADO, eliminada);
    };
  }, []);

  const nuevoGrupo = (ids: IdAgente[], temaNuevo: string | null) => {
    reiniciar(ids, ids[0], temaNuevo);
    ponerUrl({});
  };

  const abrir = useCallback(async (c: Conversacion) => {
    abortar.current?.abort();
    setCreando(false);
    setAviso(null);
    setActual(c.id);
    setAgente(c.agente);
    setGrupo(integrantes(c));
    setTema(c.tema ?? null);
    setMensajes([]);
    setCargando(true);
    const { data, error } = await createClient()
      .from("mensajes")
      .select("id, rol, contenido, agente, creado_en")
      .eq("conversacion_id", c.id)
      .order("creado_en", { ascending: true });
    setCargando(false);
    if (error) {
      setAviso("No se pudo abrir la conversación.");
      return;
    }
    pegado.current = true;
    setMensajes((data ?? []) as Mensaje[]);
  }, []);

  // La dirección manda: al entrar (?c=), al picar algo del menú o una tarjeta, y con atrás/adelante
  useEffect(() => {
    if (consulta === propia.current) return;
    const primera = propia.current === null;
    propia.current = consulta;
    const p = new URLSearchParams(consulta);
    const c = p.get("c") ?? (primera ? conversacionInicial : null);
    if (c) {
      if (c === actualRef.current) return;
      const conv = todas.current.find((x) => x.id === c);
      if (conv) abrir(conv);
      else setAviso("No encontré esa conversación.");
      return;
    }
    if (primera) return; // lo demás ya viene en el estado inicial
    const pedido = p.get("agente");
    const pide = p.get("pide");
    if (!actualRef.current && !pedido && !pide) return; // solo cambió el filtro
    const id = esIdAgente(pedido) ? pedido : null;
    if (id) reiniciar(null, id, null);
    else if (actualRef.current) reiniciar(puedeGrupos ? activos : null, activos[0] ?? "clara", null);
    setCaja((k) => ({ texto: pide ? pide.slice(0, 2000) : undefined, n: k.n + 1 }));
  }, [consulta, conversacionInicial, abrir, reiniciar, puedeGrupos, activos]);

  // Mantener la vista abajo mientras llega la respuesta (si la persona no subió)
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pegado.current) el.scrollTop = el.scrollHeight;
  }, [mensajes]);

  /** Borrar (pregunta antes, en una ventana). */
  async function borrar(c: Conversacion) {
    setPorBorrar(null);
    const { error } = await createClient().from("conversaciones").delete().eq("id", c.id);
    if (error) {
      setAviso("No se pudo borrar la conversación.");
      return;
    }
    setConversaciones((l) => l.filter((x) => x.id !== c.id));
    menu?.quitar(c.id);
    if (actual === c.id) nueva(c.agente);
  }

  async function enviar(contenido: string) {
    const limpio = contenido.trim();
    if (!limpio || enviando || !disponible || sinMensajes) return;
    if (limpio.length > MAX_MENSAJE) {
      setAviso(`El mensaje es muy largo (máximo ${MAX_MENSAJE} caracteres).`);
      return;
    }
    setAviso(null);
    pegado.current = true;
    const idRespuesta = `r-${Date.now()}`;
    const ahora = new Date().toISOString();
    const empezar = () =>
      setMensajes((m) => [
        ...m,
        { id: `u-${Date.now()}`, rol: "user", contenido: limpio, creado_en: ahora, nuevo: true },
        { id: idRespuesta, rol: "assistant", contenido: "", creado_en: ahora, enCurso: true, nuevo: true },
      ]);
    if (mensajes.length === 0 && !actual) conVista(empezar);
    else {
      lanzarFragmentos(document.querySelector(".pc-conv__caja .pc-caja"));
      empezar();
    }
    setEnviando(true);
    const control = new AbortController();
    abortar.current = control;

    const actualizar = (cambio: Partial<Mensaje>) => setMensajes((m) => m.map((x) => (x.id === idRespuesta ? { ...x, ...cambio } : x)));

    // Un grupo nuevo manda a sus integrantes y el tema; uno ya guardado, solo su id
    // estados: true → el stream trae lo que hace el agente con las apps ("\u0001…\u0002", src/lib/estado-chat.ts)
    const cuerpo = grupo && !actual ? { agentes: grupo, tema, mensaje: limpio, estados: true } : { agente, mensaje: limpio, conversacionId: actual, estados: true };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
        signal: control.signal,
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => ({}))) as { error?: string; hasta?: string | null };
        // Llegó al límite de uso: el aviso va en lugar de la caja (y se quita solo a la hora del reinicio)
        if (res.status === 429 && j.error) setBloqueo({ texto: j.error, hasta: j.hasta ?? null });
        actualizar({ enCurso: false, error: j.error ?? "No se pudo enviar el mensaje." });
        return;
      }
      const idConv = res.headers.get("X-Conversacion-Id");
      if (idConv && idConv !== actual) {
        setActual(idConv);
        ponerUrl({ c: idConv });
      }
      // Subir (o agregar) la conversación al principio de la lista y del menú
      if (idConv) {
        const existente = todas.current.find((x) => x.id === idConv);
        const item: Conversacion = existente
          ? { ...existente, actualizado_en: new Date().toISOString() }
          : {
              id: idConv,
              agente,
              titulo: (tema ?? limpio).replace(/\s+/g, " ").slice(0, 80),
              actualizado_en: new Date().toISOString(),
              participantes: grupo,
              tema,
            };
        setConversaciones((l) => [item, ...l.filter((x) => x.id !== idConv)]);
        const ids = integrantes(item) ?? [item.agente];
        menu?.agregar({ id: item.id, titulo: item.titulo, href: `/panel?c=${encodeURIComponent(item.id)}`, agentes: ids }, ids.length > 1 && Boolean(item.tema));
      }

      const lector = res.body.getReader();
      const decoder = new TextDecoder();
      let acumulado = "";
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        acumulado += decoder.decode(value, { stream: true });
        // Primero el error de siempre; luego, lo que hace el agente con las apps (el estado) se separa del texto
        const corte = acumulado.indexOf(MARCA_ERROR);
        if (corte >= 0) {
          actualizar({ contenido: separarEstado(acumulado.slice(0, corte)).texto, error: acumulado.slice(corte + MARCA_ERROR.length), estado: null });
        } else {
          const { texto, estado } = separarEstado(acumulado);
          actualizar({ contenido: texto, estado });
        }
      }
      actualizar({ enCurso: false, estado: null });
    } catch (e) {
      const detenido = e instanceof DOMException && e.name === "AbortError";
      actualizar({ enCurso: false, error: detenido ? undefined : "Se perdió la conexión. Intenta de nuevo." });
    } finally {
      setEnviando(false);
      abortar.current = null;
    }
  }

  /** Una respuesta puede traer varias voces (grupo); cada una con su personaje. */
  const voces = (m: Mensaje) => {
    if (esIdAgente(m.agente)) return [{ agente: m.agente, texto: m.contenido }];
    if (grupo) return partirIntervenciones(m.contenido, grupo, m.enCurso);
    return [{ agente, texto: m.contenido }];
  };

  const piezas: Pieza[] = mensajes.flatMap((m): Pieza[] => {
    const fecha = m.creado_en ? new Date(m.creado_en) : new Date();
    if (m.rol === "user") return [{ key: m.id, de: "tu", texto: m.contenido, fecha, nuevo: m.nuevo }];
    return voces(m).map((v, i, lista) => {
      const ultima = i === lista.length - 1;
      return { key: `${m.id}-${i}`, de: v.agente, texto: v.texto, fecha, nuevo: m.nuevo, enCurso: m.enCurso && ultima, error: ultima ? m.error : undefined, estado: m.enCurso && ultima ? m.estado : null };
    });
  });
  const visibles = piezas.filter((p) => p.texto || p.enCurso || p.error);

  const fuentes: PromptBarSource[] = (grupo ?? activos).map((id) => ({
    key: id,
    name: AGENTE_POR_ID[id].nombre,
    description: `${AGENTE_POR_ID[id].area} · ${AGENTE_POR_ID[id].abarca}`,
    icon: <Personaje agente={id} avatar className="chat__personaje-menu" />,
  }));
  const esEquipo = grupo !== null && !tema && grupo.length === activos.length && grupo.every((id) => activos.includes(id));
  const actualConv = actual ? todas.current.find((x) => x.id === actual) : undefined;
  const tituloConv = actualConv?.titulo ?? (grupo ? (tema ?? (esEquipo ? "Todo el equipo" : nombresDe(grupo))) : info.nombre);

  const barra = disponible ? (
    sinMensajes ? (
      <p className="pc-aviso-caja">
        {bloqueo?.texto}{" "}
        <Enlace href="/precios" className="pc-enlace">
          Ver los planes
        </Enlace>
      </p>
    ) : (
      <PromptBar
        key={`${grupo ? grupo.join("-") : agente}-${caja.n}`}
        className={enInicio && cambiando ? "pc-caja pc-caja--cambia" : "pc-caja"}
        initialText={caja.texto}
        placeholder={enInicio ? sugerencia : grupo ? "Pregúntale a tu equipo… (escribe @ para elegir agente)" : `Pídele algo a ${info.nombre}…`}
        forma="fila"
        sources={fuentes}
        plusActions={subida.acciones}
        commands={comandosDe(participantes)}
        models={[]}
        efforts={[]}
        busy={enviando}
        onSend={(t) => enviar(t)}
        onStop={() => abortar.current?.abort()}
        maxRows={8}
        sparkBoost={0}
        dictarPronto
      />
    )
  ) : (
    <p className="pc-aviso-caja">
      {grupo ? "Alguien de este grupo no está en tu equipo." : `${info.nombre} no está en tu equipo.`}{" "}
      {participantes.every((id) => plan.agentes.includes(id)) ? (
        <Enlace href="/panel/agentes" className="pc-enlace">
          Agrégalo en Agentes
        </Enlace>
      ) : (
        <Enlace href="/precios" className="pc-enlace">
          Llega con {planMinimo(participantes.find((id) => !plan.agentes.includes(id)) ?? agente).nombre}
        </Enlace>
      )}
    </p>
  );

  const nuevoGrupoModal = (
    <NuevoGrupo abierto={creando} disponibles={activos} maxNombre={MAX_TEMA} onCrear={(nombre, ids) => nuevoGrupo(ids, nombre || null)} onCerrar={() => setCreando(false)} />
  );

  /* ---------- Inicio: todavía no hay conversación ---------- */
  if (enInicio) {
    const opciones: OpcionAgente[] = [
      ...(puedeGrupos ? [{ id: "equipo", etiqueta: "Todo el equipo", detalle: nombresDe(activos), agentes: activos }] : []),
      ...AGENTES_INFO.map((a) => ({
        id: a.id,
        etiqueta: a.nombre,
        detalle: `${a.area} · ${a.abarca}`,
        agentes: [a.id],
        bloqueado: activos.includes(a.id) ? undefined : plan.agentes.includes(a.id) ? "Fuera de tu equipo" : `Con ${planMinimo(a.id).nombre}`,
      })),
      ...(grupo && !esEquipo ? [{ id: "grupo", etiqueta: tema ?? nombresDe(grupo), detalle: "Tu grupo", agentes: grupo }] : []),
      ...(puedeGrupos ? [{ id: "nuevo-grupo", etiqueta: "Nuevo grupo…", agentes: [], accion: true }] : []),
    ];
    const conFiltro = area === "todo" ? "" : `&area=${area}`;
    const tarjetas = pedidosDe(area)
      .map((p) => {
        const enEquipo = activos.includes(p.agente);
        const enPlan = plan.agentes.includes(p.agente);
        // Clara lee tu Gmail: sin Gmail, la tarjeta lleva a conectarlo. WhatsApp todavía no: Lola deja el mensaje listo
        const sinGmail = p.requiere === "gmail" && !conGoogle;
        return {
          pedido: p,
          href: !enEquipo ? (enPlan ? "/panel/agentes" : "/precios") : sinGmail ? "/panel?vista=correo#gmail" : `/panel?agente=${p.agente}&pide=${encodeURIComponent(p.texto)}${conFiltro}`,
          bloqueado: enEquipo ? undefined : enPlan ? "Fuera de tu equipo" : `Llega con ${planMinimo(p.agente).nombre}`,
          insignia: !enEquipo
            ? undefined
            : p.requiere === "whatsapp"
              ? { texto: "WhatsApp · pronto", tono: "neutro" as const }
              : sinGmail
                ? { texto: "Conecta Gmail", tono: "atencion" as const }
                : undefined,
        };
      })
      .sort((a, b) => Number(Boolean(a.bloqueado)) - Number(Boolean(b.bloqueado)));
    return (
      // Las píldoras y las tarjetas cambian la dirección sin ir al servidor: el chat no necesita nada más
      <ContextoNavegar.Provider value={navegarAqui}>
        <Inicio
          saludo={saludo}
          caja={barra}
          selector={
            <SelectorAgente
              opciones={opciones}
              activa={grupo ? (esEquipo ? "equipo" : "grupo") : agente}
              alElegir={(id) => {
                if (id === "equipo") nuevoGrupo(activos, null);
                else if (id === "nuevo-grupo") setCreando(true);
                else if (esIdAgente(id)) nueva(id);
              }}
            />
          }
          area={area}
          hrefArea={(a) => (a === "todo" ? "/panel" : `/panel?area=${a}`)}
          tarjetas={tarjetas}
        />
        {aviso ? (
          <p role="alert" className="pc-aviso-flota">
            {aviso}
          </p>
        ) : null}
        {nuevoGrupoModal}
        {subida.elementos}
      </ContextoNavegar.Provider>
    );
  }

  /* ---------- La conversación ---------- */
  return (
    <>
      <VistaConversacion
        agentes={participantes}
        titulo={tituloConv}
        sub={grupo ? `Grupo · ${nombresDe(grupo)}` : `${info.nombre} · ${info.area} · ${info.abarca}`}
        menu={[
          { id: "nueva", etiqueta: "Nueva conversación", icono: "mas", href: "/panel" },
          ...(actualConv ? [{ id: "borrar", etiqueta: "Borrar conversación", icono: "basura" as const, alElegir: () => setPorBorrar(actualConv), peligroso: true }] : []),
        ]}
        scrollRef={scrollRef}
        alDesplazar={(e) => {
          const el = e.currentTarget;
          pegado.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        caja={barra}
        legal={`${grupo ? "Pueden equivocarse" : `${info.nombre} puede equivocarse`}. Revisa lo importante antes de enviarlo a un cliente.`}
      >
        {cargando ? (
          <p className="pc-cargando" role="status">
            <Giro /> Abriendo la conversación…
          </p>
        ) : (
          <div role="log" aria-live="polite" aria-label="Mensajes" className="pc-hilo">
            {visibles.map((p, i) => {
              const antes = visibles[i - 1];
              const nuevoDia = !antes || !mismoDia(antes.fecha, p.fecha);
              const primero = nuevoDia || antes.de !== p.de;
              let pieza;
              if (p.de === "tu") pieza = <MensajeTuyo texto={p.texto} nuevo={p.nuevo} />;
              else if (!p.texto && p.enCurso) pieza = <Escribiendo agente={p.de} cabeza={primero} texto={p.estado ?? undefined} />;
              else if (!p.texto)
                pieza = (
                  <AvisoHilo error nuevo={p.nuevo}>
                    {p.error}
                  </AvisoHilo>
                );
              else
                pieza = (
                  <MensajeAgente
                    agente={p.de}
                    texto={p.texto}
                    cabeza={primero}
                    nuevo={p.nuevo}
                    enCurso={p.enCurso}
                    hora={primero && !p.enCurso ? hora(p.fecha) : undefined}
                    pie={
                      p.error ? (
                        <p role="alert" className="pc-msj__error">
                          {p.error}
                        </p>
                      ) : p.enCurso && p.estado ? (
                        <LineaEscribe texto={p.estado} agente={p.de} />
                      ) : !p.enCurso && i === visibles.length - 1 ? (
                        <Copiar texto={p.texto} />
                      ) : null
                    }
                  />
                );
              return (
                <Fragment key={p.key}>
                  {nuevoDia ? <DiaHilo>{dia(p.fecha)}</DiaHilo> : null}
                  {pieza}
                </Fragment>
              );
            })}
            {aviso ? <AvisoHilo error>{aviso}</AvisoHilo> : null}
          </div>
        )}
      </VistaConversacion>
      {nuevoGrupoModal}
      {subida.elementos}
      <Modal
        abierto={porBorrar !== null}
        alCerrar={() => setPorBorrar(null)}
        titulo="¿Borrar esta conversación?"
        descripcion={porBorrar ? `«${porBorrar.titulo}» y sus mensajes se borran para siempre.` : undefined}
        pie={
          <>
            <button type="button" className={claseBoton("fantasma")} onClick={() => setPorBorrar(null)}>
              Cancelar
            </button>
            <button type="button" className={claseBoton("principal")} onClick={() => porBorrar && borrar(porBorrar)}>
              Borrar
            </button>
          </>
        }
      >
        <p className="pc-modal__nota">Tus agentes ya no la podrán consultar.</p>
      </Modal>
    </>
  );
}

