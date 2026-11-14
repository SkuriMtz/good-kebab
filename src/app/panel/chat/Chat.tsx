"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import PromptBar from "@/components/PromptBar";
import { Giro } from "@/components/base/Iconos";
import { ContextoChats } from "@/components/panel/contexto";
import { EVENTO_CHAT_ELIMINADO, EVENTO_CHAT_RENOMBRADO } from "@/components/panel/MenuChats";
import { Conversacion as VistaConversacion } from "@/components/panel/Conversacion";
import { lanzarFragmentos } from "@/components/panel/FondoFragmentos";
import { Inicio } from "@/components/panel/Inicio";
import { AvisoHilo, DiaHilo, MensajeTuyo, RespuestaAtendel, nombresDe } from "@/components/panel/Mensajes";
import { separarEstado } from "@/lib/estado-chat";
import { useSubirDesdeChat } from "@/components/panel/negocio/SubirDesdeChat";
import { ContextoNavegar, Enlace, Modal, claseBoton } from "@/components/panel/Piezas";
import { useSugerencia } from "@/components/panel/sugerencias";
import { esArea, pedidosDe, type IdArea } from "@/components/panel/pedidos";
import { esIdAgente, type IdAgente } from "@/lib/agentes";
import { comandosDe } from "@/lib/comandos";
import { partirIntervenciones } from "@/lib/grupo";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";
import type { Bloqueo } from "@/lib/uso-estado";
import { useModelo } from "@/components/panel/modelo";
import { SelectorModelo } from "@/components/panel/SelectorModelo";

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

const MARCA_ERROR = "\u0000ERROR:";
const MAX_MENSAJE = 4000;

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
  /** Ya no se usa: le escribes a Atendel y él reparte (se queda para no romper enlaces viejos con ?agente=). */
  agenteInicial?: IdAgente | null;
  conversacionInicial: string | null;
  /** Lo que se pidió desde una tarjeta o el buscador: llega escrito, listo para enviar. */
  textoInicial?: string;
  /** "Buenas noches, Ana" (con la hora de la Ciudad de México, igual en el servidor y aquí). */
  saludo: string;
  /** ¿Gmail conectado? (las tarjetas de Clara sin Gmail llevan a conectarlo). */
  conGoogle: boolean;
}) {
  const plan = PLAN_POR_ID[planId];
  // Rápido o Avanzado (como el selector de Claude); se recuerda en este navegador
  const selector = useModelo(plan.modelos);
  // Chat único: le escribes a Atendel y él reparte el trabajo a todo tu equipo
  // (las conversaciones viejas con un solo agente se siguen abriendo como estaban)
  const equipo: IdAgente[] | null = activos.length >= 2 ? activos : null;
  const [agente, setAgente] = useState<IdAgente>(activos[0] ?? "clara");
  const [grupo, setGrupo] = useState<IdAgente[] | null>(equipo);
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
  const reiniciar = useCallback(() => {
    abortar.current?.abort();
    setAgente(activos[0] ?? "clara");
    setGrupo(activos.length >= 2 ? activos : null);
    setActual(null);
    setMensajes([]);
    setAviso(null);
  }, [activos]);

  const nueva = () => {
    reiniciar();
    ponerUrl({});
  };

  // El "⋯" del menú cambió el nombre o eliminó una conversación: la cabecera se actualiza y,
  // si era la abierta, se vuelve a una conversación nueva
  const alEliminarDesdeMenu = useRef<(id: string) => void>(() => undefined);
  alEliminarDesdeMenu.current = (id: string) => {
    setConversaciones((l) => l.filter((x) => x.id !== id));
    if (actual === id) {
      reiniciar();
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

  const abrir = useCallback(async (c: Conversacion) => {
    abortar.current?.abort();
    setAviso(null);
    setActual(c.id);
    setAgente(c.agente);
    setGrupo(integrantes(c));
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
    const pide = p.get("pide");
    // ?agente= ya no elige a nadie: todo va a Atendel (que reparte)
    if (!actualRef.current && !p.get("agente") && !pide) return; // solo cambió el filtro
    if (actualRef.current) reiniciar();
    setCaja((k) => ({ texto: pide ? pide.slice(0, 2000) : undefined, n: k.n + 1 }));
  }, [consulta, conversacionInicial, abrir, reiniciar]);

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
    if (actual === c.id) nueva();
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

    // Una conversación nueva es con Atendel (el servidor pone a todo el equipo); una guardada, su id
    // estados: true → el stream trae lo que hace el agente con las apps ("\u0001…\u0002", src/lib/estado-chat.ts)
    const cuerpo = {
      ...(actual ? { conversacionId: actual } : {}),
      mensaje: limpio,
      modelo: selector.modelo,
      estados: true,
    };

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
              titulo: limpio.replace(/\s+/g, " ").slice(0, 80),
              actualizado_en: new Date().toISOString(),
              participantes: grupo,
              tema: null,
            };
        setConversaciones((l) => [item, ...l.filter((x) => x.id !== idConv)]);
        const ids = integrantes(item) ?? [item.agente];
        menu?.agregar({ id: item.id, titulo: item.titulo, href: `/panel?c=${encodeURIComponent(item.id)}`, agentes: ids }, false);
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

  /** Una respuesta puede traer el trabajo de varios agentes; cada parte con quién la hizo. */
  const voces = (m: Mensaje) => {
    if (esIdAgente(m.agente)) return [{ agente: m.agente, texto: m.contenido }];
    if (grupo) return partirIntervenciones(m.contenido, grupo, m.enCurso);
    return [{ agente, texto: m.contenido }];
  };

  // Lo que se pinta: tus mensajes y, entre uno y otro, UNA respuesta de Atendel
  // (en la base cada parte es un mensaje de su agente: aquí se juntan)
  type Bloque =
    | { tipo: "tu"; key: string; texto: string; fecha: Date; nuevo?: boolean }
    | { tipo: "atendel"; key: string; piezas: { agente: IdAgente; texto: string }[]; fecha: Date; nuevo?: boolean; enCurso?: boolean; error?: string; estado?: string | null };
  const bloques: Bloque[] = [];
  for (const m of mensajes) {
    const fecha = m.creado_en ? new Date(m.creado_en) : new Date();
    if (m.rol === "user") {
      bloques.push({ tipo: "tu", key: m.id, texto: m.contenido, fecha, nuevo: m.nuevo });
      continue;
    }
    const ultimo = bloques[bloques.length - 1];
    const piezasM = voces(m);
    if (ultimo && ultimo.tipo === "atendel") {
      ultimo.piezas.push(...piezasM);
      ultimo.enCurso = m.enCurso;
      ultimo.error = m.error ?? ultimo.error;
      ultimo.estado = m.estado;
      ultimo.nuevo = ultimo.nuevo || m.nuevo;
    } else bloques.push({ tipo: "atendel", key: m.id, piezas: [...piezasM], fecha, nuevo: m.nuevo, enCurso: m.enCurso, error: m.error, estado: m.estado });
  }

  const actualConv = actual ? todas.current.find((x) => x.id === actual) : undefined;
  const tituloConv = actualConv?.titulo ?? "Nueva conversación";

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
        key={`atendel-${caja.n}`}
        className={enInicio && cambiando ? "pc-caja pc-caja--cambia" : "pc-caja"}
        initialText={caja.texto}
        placeholder={enInicio ? sugerencia : "Pídele algo a Atendel…"}
        forma="fila"
        sources={[]}
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
    // Una conversación vieja con alguien que ya no está en tu equipo
    <p className="pc-aviso-caja">
      Esta conversación es con alguien que ya no está en tu equipo.{" "}
      <Enlace href="/panel" className="pc-enlace">
        Empieza una nueva con Atendel
      </Enlace>
    </p>
  );

  /* ---------- Inicio: todavía no hay conversación ---------- */
  if (enInicio) {
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
          uso={<SelectorModelo modelo={selector.modelo} permitidos={plan.modelos} alElegir={selector.elegir} />}
          selector={null}
          area={area}
          hrefArea={(a) => (a === "todo" ? "/panel" : `/panel?area=${a}`)}
          tarjetas={tarjetas}
        />
        {aviso ? (
          <p role="alert" className="pc-aviso-flota">
            {aviso}
          </p>
        ) : null}
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
        sub={`Atendel · ${nombresDe(participantes)}`}
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
        legal="Atendel puede equivocarse. Revisa lo importante antes de enviarlo a un cliente."
        modelo={<SelectorModelo modelo={selector.modelo} permitidos={plan.modelos} alElegir={selector.elegir} hacia="arriba" />}
      >
        {cargando ? (
          <p className="pc-cargando" role="status">
            <Giro /> Abriendo la conversación…
          </p>
        ) : (
          <div role="log" aria-live="polite" aria-label="Mensajes" className="pc-hilo">
            {bloques.map((b, i) => {
              const antes = bloques[i - 1];
              const nuevoDia = !antes || !mismoDia(antes.fecha, b.fecha);
              const pieza =
                b.tipo === "tu" ? (
                  <MensajeTuyo texto={b.texto} nuevo={b.nuevo} />
                ) : !b.piezas.some((x) => x.texto) && !b.enCurso ? (
                  <AvisoHilo error nuevo={b.nuevo}>
                    {b.error ?? "No llegó la respuesta."}
                  </AvisoHilo>
                ) : (
                  <RespuestaAtendel
                    piezas={b.piezas}
                    enCurso={b.enCurso}
                    nuevo={b.nuevo}
                    hora={hora(b.fecha)}
                    estado={b.estado}
                    error={b.error}
                    copiar={i === bloques.length - 1}
                  />
                );
              return (
                <Fragment key={b.key}>
                  {nuevoDia ? <DiaHilo>{dia(b.fecha)}</DiaHilo> : null}
                  {pieza}
                </Fragment>
              );
            })}
            {aviso ? <AvisoHilo error>{aviso}</AvisoHilo> : null}
          </div>
        )}
      </VistaConversacion>
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

