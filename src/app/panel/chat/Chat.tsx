"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import PromptBar, { type PromptBarSource } from "@/components/PromptBar";
import { Personaje } from "@/components/agentes/Personaje";
import { Giro } from "@/components/base/Iconos";
import { ContextoChats } from "@/components/panel/contexto";
import { Conversacion as VistaConversacion } from "@/components/panel/Conversacion";
import { Inicio } from "@/components/panel/Inicio";
import { AvisoHilo, Copiar, DiaHilo, Escribiendo, MensajeAgente, MensajeTuyo, nombresDe } from "@/components/panel/Mensajes";
import { NuevoGrupo } from "@/components/panel/NuevoGrupo";
import { ContextoNavegar, Enlace, Modal, claseBoton } from "@/components/panel/Piezas";
import { SelectorAgente, type OpcionAgente } from "@/components/panel/Selector";
import { FranjaPendientes, UsoPlan } from "@/components/panel/Franja";
import { esArea, pedidosDe, type IdArea } from "@/components/panel/pedidos";
import { AGENTE_POR_ID, AGENTES_INFO, esIdAgente, type IdAgente } from "@/lib/agentes";
import { comandosDe } from "@/lib/comandos";
import { partirIntervenciones } from "@/lib/grupo";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";

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
  usadosIniciales,
  conversacionesIniciales,
  agenteInicial,
  conversacionInicial,
  textoInicial,
  saludo,
  pendientes,
}: {
  planId: IdPlan;
  activos: IdAgente[];
  usadosIniciales: number;
  conversacionesIniciales: Conversacion[];
  /** ?agente=: hablar solo con ese agente. Sin esto, con todo el equipo (si el plan trae grupos). */
  agenteInicial: IdAgente | null;
  conversacionInicial: string | null;
  /** Lo que se pidió desde una tarjeta o el buscador: llega escrito, listo para enviar. */
  textoInicial?: string;
  /** "Buenas noches, Ana" (con la hora de la Ciudad de México, igual en el servidor y aquí). */
  saludo: string;
  /** Lo que espera tu visto bueno (null: no se pudo leer). */
  pendientes: number | null;
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
  const [usados, setUsados] = useState(usadosIniciales);
  const [aviso, setAviso] = useState<string | null>(null);
  const [porBorrar, setPorBorrar] = useState<Conversacion | null>(null);
  const [caja, setCaja] = useState<{ texto?: string; n: number }>({ texto: textoInicial, n: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortar = useRef<AbortController | null>(null);
  const pegado = useRef(true); // ¿la vista está hasta abajo?
  const menu = useContext(ContextoChats);
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
  const sinMensajes = usados >= plan.mensajesMes;
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
    else empezar();
    setEnviando(true);
    const control = new AbortController();
    abortar.current = control;

    const actualizar = (cambio: Partial<Mensaje>) => setMensajes((m) => m.map((x) => (x.id === idRespuesta ? { ...x, ...cambio } : x)));

    // Un grupo nuevo manda a sus integrantes y el tema; uno ya guardado, solo su id
    const cuerpo = grupo && !actual ? { agentes: grupo, tema, mensaje: limpio } : { agente, mensaje: limpio, conversacionId: actual };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
        signal: control.signal,
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        actualizar({ enCurso: false, error: j.error ?? "No se pudo enviar el mensaje." });
        return;
      }
      setUsados((u) => u + 1);
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
        const corte = acumulado.indexOf(MARCA_ERROR);
        if (corte >= 0) {
          actualizar({ contenido: acumulado.slice(0, corte), error: acumulado.slice(corte + MARCA_ERROR.length) });
        } else {
          actualizar({ contenido: acumulado });
        }
      }
      actualizar({ enCurso: false });
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
      return { key: `${m.id}-${i}`, de: v.agente, texto: v.texto, fecha, nuevo: m.nuevo, enCurso: m.enCurso && ultima, error: ultima ? m.error : undefined };
    });
  });
  const visibles = piezas.filter((p) => p.texto || p.enCurso || p.error);
  // Quién escribe ahora (para los tres puntos y la cabecera)
  const enCurso = visibles[visibles.length - 1]?.enCurso ? (visibles[visibles.length - 1].de as IdAgente) : null;

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
        Llegaste a los {plan.mensajesMes.toLocaleString("es-MX")} mensajes de este mes.{" "}
        <Enlace href="/precios" className="pc-enlace">
          Ver los planes
        </Enlace>
      </p>
    ) : (
      <PromptBar
        key={`${grupo ? grupo.join("-") : agente}-${caja.n}`}
        className="pc-caja"
        initialText={caja.texto}
        placeholder={grupo ? "Pregúntale a tu equipo… (escribe @ para elegir agente)" : `Pídele algo a ${info.nombre}…`}
        sources={fuentes}
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
  if (!actual && mensajes.length === 0 && !cargando) {
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
        return {
          pedido: p,
          href: enEquipo ? `/panel?agente=${p.agente}&pide=${encodeURIComponent(p.texto)}${conFiltro}` : enPlan ? "/panel/agentes" : "/precios",
          bloqueado: enEquipo ? undefined : enPlan ? "Fuera de tu equipo" : `Llega con ${planMinimo(p.agente).nombre}`,
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
          uso={<UsoPlan plan={plan.nombre.replace(/^Atendel\s+/, "")} usados={usados} total={plan.mensajesMes} href="/panel?vista=ajustes" />}
          franja={<FranjaPendientes n={pendientes} href="/panel?vista=pendientes" />}
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
      </ContextoNavegar.Provider>
    );
  }

  /* ---------- La conversación ---------- */
  return (
    <>
      <VistaConversacion
        agentes={participantes}
        titulo={tituloConv}
        sub={
          enCurso ? (
            <span className="pc-conv__escribe">{AGENTE_POR_ID[enCurso].nombre} está escribiendo…</span>
          ) : grupo ? (
            `Grupo · ${nombresDe(grupo)}`
          ) : (
            `${info.area} · ${info.abarca}`
          )
        }
        acciones={
          <>
            <Enlace href="/panel" className={claseBoton("fantasma", true)}>
              Nueva
            </Enlace>
            {actualConv ? (
              <button type="button" className={claseBoton("fantasma", true)} onClick={() => setPorBorrar(actualConv)}>
                Borrar
              </button>
            ) : null}
          </>
        }
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
              else if (!p.texto && p.enCurso) pieza = <Escribiendo agente={p.de} cabeza={primero} />;
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

