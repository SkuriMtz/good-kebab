"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Pista } from "@/components/ChatDemo";
import PromptBar, { type PromptBarSource } from "@/components/PromptBar";
import { NavApp } from "@/components/app/NavApp";
import { Uso } from "@/components/app/Uso";
import { Personaje } from "@/components/agentes/Personaje";
import { Boton } from "@/components/base/Boton";
import { Giro, Icono } from "@/components/base/Iconos";
import { FilaDeslizable } from "@/components/chat/Deslizar";
import {
  Avatar,
  Caras,
  Comentario,
  Cuerpo,
  Dia,
  Escribiendo,
  Evento,
  Hilo,
  IconoCopiar,
  IconoLado,
  NuevoGrupo,
  nombres,
} from "@/components/chat/Piezas";
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
/** Lo que se pinta: cada voz de una respuesta en grupo es su propia burbuja. */
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

function cuando(fecha: string) {
  const d = new Date(fecha);
  if (mismoDia(d, new Date())) return hora(d);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

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
 * Chat con los agentes, como una app de mensajería: a la izquierda tus
 * agentes, grupos y conversaciones; a la derecha la conversación abierta.
 * Eliges con quién hablar (uno o un grupo), escribes y la respuesta va
 * apareciendo. Se guarda todo.
 */
export function Chat({
  email,
  planId,
  activos,
  usadosIniciales,
  conversacionesIniciales,
  agenteInicial,
  conversacionInicial,
}: {
  email: string;
  planId: IdPlan;
  activos: IdAgente[];
  usadosIniciales: number;
  conversacionesIniciales: Conversacion[];
  agenteInicial: IdAgente;
  conversacionInicial: string | null;
}) {
  const plan = PLAN_POR_ID[planId];
  const [agente, setAgente] = useState<IdAgente>(agenteInicial);
  const [grupo, setGrupo] = useState<IdAgente[] | null>(null);
  const [tema, setTema] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [conversaciones, setConversaciones] = useState(conversacionesIniciales);
  const [actual, setActual] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [usados, setUsados] = useState(usadosIniciales);
  const [lista, setLista] = useState(false); // lista de chats en celular
  const [aviso, setAviso] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortar = useRef<AbortController | null>(null);
  const pegado = useRef(true); // ¿la vista está hasta abajo?

  const info = AGENTE_POR_ID[agente];
  const participantes: IdAgente[] = grupo ?? [agente];
  const disponible = participantes.every((id) => activos.includes(id));
  const sinMensajes = usados >= plan.mensajesMes;
  const puedeGrupos = activos.length >= 2;

  const ponerUrl = (params: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    window.history.replaceState(null, "", `/panel/chat${q ? `?${q}` : ""}`);
  };

  const nueva = useCallback((id: IdAgente) => {
    abortar.current?.abort();
    setAgente(id);
    setGrupo(null);
    setTema(null);
    setCreando(false);
    setActual(null);
    setMensajes([]);
    setAviso(null);
    setLista(false);
    ponerUrl({ agente: id });
  }, []);

  const nuevoGrupo = (ids: IdAgente[], temaNuevo: string | null) => {
    abortar.current?.abort();
    setAgente(ids[0]);
    setGrupo(ids);
    setTema(temaNuevo);
    setCreando(false);
    setActual(null);
    setMensajes([]);
    setAviso(null);
    setLista(false);
    ponerUrl({});
  };

  const abrir = useCallback(async (c: Conversacion) => {
    abortar.current?.abort();
    setLista(false);
    setCreando(false);
    setAviso(null);
    setActual(c.id);
    setAgente(c.agente);
    setGrupo(integrantes(c));
    setTema(c.tema ?? null);
    setMensajes([]);
    setCargando(true);
    ponerUrl({ c: c.id });
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

  // Abrir la conversación de la URL al cargar
  useEffect(() => {
    if (!conversacionInicial) return;
    const c = conversacionesIniciales.find((x) => x.id === conversacionInicial);
    if (c) abrir(c);
  }, [conversacionInicial, conversacionesIniciales, abrir]);

  // Mantener la vista abajo mientras llega la respuesta (si la persona no subió)
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pegado.current) el.scrollTop = el.scrollHeight;
  }, [mensajes]);

  // Escape cierra la lista de chats en el celular
  useEffect(() => {
    if (!lista) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setLista(false);
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [lista]);

  /** Borrar una conversación (papelera o deslizar): pregunta antes. Devuelve si se borró. */
  async function borrar(c: Conversacion) {
    if (!window.confirm(`¿Borrar "${c.titulo}"?`)) return false;
    const { error } = await createClient().from("conversaciones").delete().eq("id", c.id);
    if (error) {
      setAviso("No se pudo borrar la conversación.");
      return false;
    }
    setConversaciones((l) => l.filter((x) => x.id !== c.id));
    if (actual === c.id) nueva(c.agente);
    return true;
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
    setMensajes((m) => [
      ...m,
      { id: `u-${Date.now()}`, rol: "user", contenido: limpio, creado_en: ahora, nuevo: true },
      { id: idRespuesta, rol: "assistant", contenido: "", creado_en: ahora, enCurso: true, nuevo: true },
    ]);
    setEnviando(true);
    const control = new AbortController();
    abortar.current = control;

    const actualizar = (cambio: Partial<Mensaje>) =>
      setMensajes((m) => m.map((x) => (x.id === idRespuesta ? { ...x, ...cambio } : x)));

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
      // Subir (o agregar) la conversación al principio de la lista
      if (idConv) {
        setConversaciones((l) => {
          const existente = l.find((x) => x.id === idConv);
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
          return [item, ...l.filter((x) => x.id !== idConv)];
        });
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
    return voces(m).map((v, i, todas) => {
      const ultima = i === todas.length - 1;
      return {
        key: `${m.id}-${i}`,
        de: v.agente,
        texto: v.texto,
        fecha,
        nuevo: m.nuevo,
        enCurso: m.enCurso && ultima,
        error: ultima ? m.error : undefined,
      };
    });
  });
  const visibles = piezas.filter((p) => p.texto || p.enCurso || p.error);
  // Quién escribe ahora (para los tres puntos y la cabecera)
  const enCurso = visibles[visibles.length - 1]?.enCurso ? (visibles[visibles.length - 1].de as IdAgente) : null;

  /** La línea de tiempo: día, comentarios (voces seguidas juntas), "escribiendo" y errores. */
  type Bloque =
    | { tipo: "dia"; key: string; fecha: Date }
    | { tipo: "escribiendo"; key: string; agente: IdAgente }
    | { tipo: "error"; key: string; texto: string; fecha: Date }
    | { tipo: "comentario"; key: string; autor: "tu" | IdAgente; partes: Pieza[] };
  const bloques: Bloque[] = [];
  visibles.forEach((p, i) => {
    const antes = visibles[i - 1];
    if (!antes || !mismoDia(antes.fecha, p.fecha)) bloques.push({ tipo: "dia", key: `d-${p.key}`, fecha: p.fecha });
    if (p.de !== "tu" && !p.texto && p.enCurso) {
      bloques.push({ tipo: "escribiendo", key: `e-${p.key}`, agente: p.de });
      return;
    }
    if (!p.texto) {
      bloques.push({ tipo: "error", key: `x-${p.key}`, texto: p.error ?? "", fecha: p.fecha });
      return;
    }
    const ultimo = bloques[bloques.length - 1];
    if (ultimo?.tipo === "comentario" && ultimo.autor === p.de) ultimo.partes.push(p);
    else bloques.push({ tipo: "comentario", key: `c-${p.key}`, autor: p.de, partes: [p] });
  });

  const fuentes: PromptBarSource[] = (grupo ?? activos).map((id) => ({
    key: id,
    name: AGENTE_POR_ID[id].nombre,
    description: `${AGENTE_POR_ID[id].area} · ${AGENTE_POR_ID[id].abarca}`,
    icon: <Personaje agente={id} avatar className="h-5 w-5" />,
  }));
  const sugerencias = grupo ? grupo.slice(0, 3).map((id) => AGENTE_POR_ID[id].sugerencias[0]) : info.sugerencias;
  const comandos = comandosDe(participantes);
  const gruposGuardados = conversaciones.filter((c) => integrantes(c));
  const chatsGuardados = conversaciones.filter((c) => !integrantes(c));

  const filaConversacion = (c: Conversacion) => {
    const ids = integrantes(c) ?? [c.agente];
    return (
      <FilaDeslizable key={c.id} etiqueta={`Borrar «${c.titulo}»`} alBorrar={() => borrar(c)}>
        <button type="button" className="charla__conv" aria-current={c.id === actual ? "true" : undefined} onClick={() => abrir(c)}>
          <Caras agentes={ids} tam={32} />
          <span className="charla__conv-texto">
            <span className="charla__conv-linea">
              <span className="charla__conv-nombre">{c.titulo}</span>
              <span className="charla__conv-hora">{cuando(c.actualizado_en)}</span>
            </span>
            <span className="charla__conv-vista">{ids.length > 1 ? nombres(ids) : AGENTE_POR_ID[c.agente]?.nombre}</span>
          </span>
        </button>
      </FilaDeslizable>
    );
  };

  return (
    <>
      <NavApp email={email} />
      <div className="charla charla--pantalla">
        {/* ---------- Agentes, grupos y conversaciones ---------- */}
        <aside className="charla__lado" data-abierta={lista ? "" : undefined} aria-label="Equipo y conversaciones">
          <div className="charla__lado-cabeza">
            <p className="charla__lado-titulo">Conversaciones</p>
            <button type="button" className="charla__boton-icono charla__solo-movil" onClick={() => setLista(false)} aria-label="Cerrar la lista">
              <Icono nombre="cerrar" tam={16} />
            </button>
          </div>
          <div className="charla__lado-accion">
            {puedeGrupos ? (
              <Boton
                variante="fantasma"
                tam="chico"
                bloque
                icono={<Icono nombre="mas" tam={16} />}
                onClick={() => {
                  setCreando(true);
                  setLista(false);
                }}
              >
                Nuevo grupo
              </Boton>
            ) : (
              <Boton variante="fantasma" tam="chico" bloque href="/precios" icono={<Icono nombre="candado" tam={16} />}>
                Grupos con Atendel One
              </Boton>
            )}
          </div>

          <div className="charla__listas" data-lenis-prevent="">
            <p className="charla__seccion">Tu equipo</p>
            <ul>
              {AGENTES_INFO.map((a) => {
                const activo = activos.includes(a.id);
                const elegido = a.id === agente && !grupo && !actual;
                const contenido = (
                  <>
                    <Caras agentes={[a.id]} tam={32} />
                    <span className="charla__conv-texto">
                      <span className="charla__conv-nombre">{a.nombre}</span>
                      <span className="charla__conv-vista">
                        {activo ? (
                          `${a.area} · ${a.abarca}`
                        ) : (
                          <>
                            <Icono nombre="candado" tam={12} /> Con {planMinimo(a.id).nombre}
                          </>
                        )}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={a.id}>
                    {activo ? (
                      <button type="button" className="charla__conv" aria-current={elegido ? "true" : undefined} onClick={() => nueva(a.id)}>
                        {contenido}
                      </button>
                    ) : (
                      <Link href="/precios" className="charla__conv charla__conv--bloqueado" title={`Disponible con ${planMinimo(a.id).nombre}`}>
                        {contenido}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            {gruposGuardados.length ? (
              <>
                <p className="charla__seccion">Grupos</p>
                <ul>{gruposGuardados.map(filaConversacion)}</ul>
              </>
            ) : null}

            <p className="charla__seccion">Conversaciones</p>
            {chatsGuardados.length ? (
              <ul>{chatsGuardados.map(filaConversacion)}</ul>
            ) : (
              <p className="charla__conv-vista px-[var(--spacing-8)]">Aquí aparecerán tus conversaciones.</p>
            )}
          </div>

          <div className="charla__plan">
            <p className="charla__plan-nombre">{plan.nombre}</p>
            <Uso usados={usados} plan={plan} compacto />
          </div>
        </aside>
        <button
          type="button"
          className="charla__velo charla__solo-movil"
          data-abierta={lista ? "" : undefined}
          onClick={() => setLista(false)}
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* ---------- Conversación abierta ---------- */}
        <section className="charla__principal" aria-label={grupo ? `Grupo: ${tema ?? nombres(grupo)}` : `Chat con ${info.nombre}`}>
          <header className="charla__cabeza">
            <button type="button" className="charla__boton-icono charla__solo-movil" onClick={() => setLista(true)} aria-label="Ver conversaciones">
              <IconoLado tam={20} />
            </button>
            <Caras agentes={participantes} tam={32} />
            <div className="charla__cabeza-texto">
              <p className="charla__cabeza-titulo">{grupo ? (tema ?? nombres(grupo)) : info.nombre}</p>
              <p className="charla__cabeza-meta" aria-live="polite">
                {enCurso ? (
                  <span className="charla__escribe">{grupo ? `${AGENTE_POR_ID[enCurso].nombre} está escribiendo…` : "Escribiendo…"}</span>
                ) : grupo ? (
                  `Grupo · ${nombres(grupo)}`
                ) : (
                  `${info.area} · ${info.abarca}`
                )}
              </p>
            </div>
            {actual ? (
              <Boton variante="fantasma" tam="chico" icono={<Icono nombre="mas" tam={16} />} onClick={() => (grupo ? nuevoGrupo(grupo, tema) : nueva(agente))}>
                Nueva
              </Boton>
            ) : null}
          </header>

          <div
            ref={scrollRef}
            className="charla__mensajes"
            data-lenis-prevent=""
            onScroll={(e) => {
              const el = e.currentTarget;
              pegado.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            }}
          >
            <div className="charla__columna flex min-h-full flex-col">
              {cargando ? (
                <p className="charla__cargando" role="status">
                  <Giro /> Abriendo conversación…
                </p>
              ) : mensajes.length === 0 ? (
                <div className="charla__vacio">
                  <Caras agentes={participantes} tam={64} />
                  <p className="charla__vacio-titulo">{grupo ? (tema ?? `Grupo con ${nombres(grupo)}`) : `Hola, soy ${info.nombre}.`}</p>
                  <p className="charla__vacio-texto">
                    {grupo
                      ? `${tema ? `Con ${nombres(grupo)}. ` : ""}Contesta quien sepa del tema y se complementan entre ellos. Usa @ para pedirle algo a alguien en especial.`
                      : info.lema}
                  </p>
                  {disponible ? (
                    <div className="charla__ideas">
                      <p className="charla__ideas-titulo etiqueta">Para empezar</p>
                      {sugerencias.map((s) => (
                        <button key={s} type="button" className="charla__idea" onClick={() => enviar(s)} disabled={sinMensajes}>
                          <span>{s}</span>
                          <Icono nombre="flecha" tam={16} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="charla__vacio-texto">
                      {grupo ? "Alguien de este grupo no está en tu equipo." : `${info.nombre} no está en tu equipo.`}{" "}
                      <Link href={participantes.every((id) => plan.agentes.includes(id)) ? "/panel/agentes" : "/precios"} className="enlace">
                        {!participantes.every((id) => plan.agentes.includes(id))
                          ? `Desbloquéalo con ${planMinimo(participantes.find((id) => !plan.agentes.includes(id)) ?? agente).nombre}`
                          : "Agrégalo en Mis agentes"}
                      </Link>
                      .
                    </p>
                  )}
                </div>
              ) : (
                <div role="log" aria-live="polite">
                  <Hilo etiqueta={grupo ? `Conversación con ${nombres(grupo)}` : `Conversación con ${info.nombre}`}>
                    {bloques.map((b, i) => {
                      if (b.tipo === "dia") return <Dia key={b.key}>{dia(b.fecha)}</Dia>;
                      if (b.tipo === "escribiendo") return <Escribiendo key={b.key} agente={b.agente} />;
                      if (b.tipo === "error")
                        return <Evento key={b.key} icono="alerta" tono="error" texto={b.texto} hora={hora(b.fecha)} alerta />;
                      const ultimaParte = b.partes[b.partes.length - 1];
                      const listo = !ultimaParte.enCurso;
                      return (
                        <Comentario
                          key={b.key}
                          autor={b.autor}
                          hora={hora(b.partes[0].fecha)}
                          nueva={b.partes[0].nuevo}
                          acciones={
                            b.autor !== "tu" && listo ? (
                              <Copiar texto={b.partes.map((p) => p.texto).join("\n\n")} fijo={i === bloques.length - 1} />
                            ) : null
                          }
                          pie={
                            ultimaParte.error ? (
                              <p role="alert" className="charla__error">
                                {ultimaParte.error}
                              </p>
                            ) : null
                          }
                        >
                          {b.partes.map((p, k) => (
                            <Fragment key={p.key}>
                              {k > 0 ? <hr className="charla__separador" aria-hidden="true" /> : null}
                              <Cuerpo autor={b.autor} texto={p.texto} />
                            </Fragment>
                          ))}
                        </Comentario>
                      );
                    })}
                    {aviso ? <Evento icono="alerta" tono="error" texto={aviso} alerta /> : null}
                  </Hilo>
                </div>
              )}
              {aviso && mensajes.length === 0 ? (
                <p role="alert" className="charla__error text-center">
                  {aviso}
                </p>
              ) : null}
            </div>
          </div>

          <div className="charla__pie pb-[max(var(--spacing-16),env(safe-area-inset-bottom))]">
            <div className="charla__columna charla__compositor">
              {disponible && !sinMensajes ? <Avatar autor="tu" className="charla__avatar--lado" /> : null}
              <div className="charla__compositor-cuerpo">
                {sinMensajes ? (
                  <p className="charla__limite">
                    Llegaste a los {plan.mensajesMes} mensajes de este mes.{" "}
                    <Link href="/precios" className="enlace">
                      Ver planes
                    </Link>
                  </p>
                ) : null}
                {disponible && !sinMensajes ? (
                  <PromptBar
                    key={grupo ? grupo.join("-") : agente}
                    placeholder={grupo ? "Escribe al grupo" : `Escríbele a ${info.nombre}`}
                    sources={fuentes}
                    commands={comandos}
                    models={[]}
                    efforts={[]}
                    busy={enviando}
                    onSend={(t) => enviar(t)}
                    onStop={() => abortar.current?.abort()}
                    pista={<Pista grupo={Boolean(grupo)} />}
                    maxRows={8}
                  />
                ) : null}
                <p className="charla__nota">
                  {grupo ? "Pueden equivocarse" : `${info.nombre} puede equivocarse`}. Revisa lo importante antes de enviarlo a un cliente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {creando ? (
          <NuevoGrupo
            disponibles={activos}
            nombreObligatorio={false}
            maxNombre={MAX_TEMA}
            onCrear={(nombre, ids) => nuevoGrupo(ids, nombre || null)}
            onCerrar={() => setCreando(false)}
          />
        ) : null}
      </div>
    </>
  );
}

/** "Copiar" en la cabecera de la respuesta: aparece al pasar el cursor; en pantallas táctiles, solo en la última (`fijo`). */
function Copiar({ texto, fijo }: { texto: string; fijo: boolean }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className={`charla__copiar${fijo ? " charla__copiar--fijo" : ""}`}
      data-hecho={copiado ? "" : undefined}
      aria-label={copiado ? "Copiado" : "Copiar respuesta"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          window.setTimeout(() => setCopiado(false), 1600);
        } catch {
          /* sin permiso para copiar */
        }
      }}
    >
      {copiado ? <Icono nombre="check" tam={16} /> : <IconoCopiar tam={16} />}
      <span aria-hidden="true">{copiado ? "Copiado" : "Copiar"}</span>
    </button>
  );
}
