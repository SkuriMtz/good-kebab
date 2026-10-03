"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { TriSpinner } from "@/components/Buttons";
import PromptBar, { type PromptBarSource } from "@/components/PromptBar";
import SwipeRow from "@/components/SwipeRow";
import { NavApp } from "@/components/app/NavApp";
import { Uso } from "@/components/app/Uso";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, AGENTES_INFO, esIdAgente, type IdAgente } from "@/lib/agentes";
import { comandosDe } from "@/lib/comandos";
import { partirIntervenciones } from "@/lib/grupo";
import { PLAN_POR_ID, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";
import { Texto } from "@/components/Texto";

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
  error?: string;
  enCurso?: boolean;
};

const MARCA_ERROR = "\u0000ERROR:";
const MAX_MENSAJE = 4000;
const MAX_TEMA = 120;

function cuando(fecha: string) {
  const d = new Date(fecha);
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) {
    return d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

/** "Víctor e Iris", "Lola, Clara y Víctor" */
function nombres(ids: readonly IdAgente[]) {
  const n = ids.map((id) => AGENTE_POR_ID[id].nombre);
  if (n.length < 2) return n.join("");
  const ultimo = n[n.length - 1];
  const y = /^[iI]/.test(ultimo) ? "e" : "y";
  return `${n.slice(0, -1).join(", ")} ${y} ${ultimo}`;
}

const integrantes = (c: Conversacion): IdAgente[] | null => {
  const p = (c.participantes ?? []).filter(esIdAgente);
  return p.length >= 2 ? p : null;
};

function Candado() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="6" width="9" height="6.5" stroke="currentColor" />
      <path d="M4.5 6V4.2a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" />
    </svg>
  );
}

/** Varios personajes encimados un poquito (para grupos). */
function Avatares({ ids, className = "h-7 w-7" }: { ids: readonly IdAgente[]; className?: string }) {
  return (
    <span className="flex shrink-0 -space-x-1.5" aria-hidden="true">
      {ids.map((id) => (
        <Personaje key={id} agente={id} avatar className={className} />
      ))}
    </span>
  );
}

/**
 * Chat con los agentes, como en ChatGPT o Claude: eliges con quién hablar
 * (uno o un grupo), escribes y la respuesta va apareciendo. Se guarda todo.
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
  const [lista, setLista] = useState(false); // panel de conversaciones en celular
  const [aviso, setAviso] = useState<string | null>(null);
  const [reintentos, setReintentos] = useState(0);
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
      .select("id, rol, contenido, agente")
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

  /** Con la ✕ pregunta antes; al deslizar la fila hasta el fondo ya es la confirmación. */
  async function borrar(c: Conversacion, preguntar = true) {
    if (preguntar && !window.confirm(`¿Borrar "${c.titulo}"?`)) return;
    const { error } = await createClient().from("conversaciones").delete().eq("id", c.id);
    if (error) {
      setAviso("No se pudo borrar la conversación.");
      setReintentos((n) => n + 1); // la fila deslizada vuelve a aparecer
      return;
    }
    setConversaciones((l) => l.filter((x) => x.id !== c.id));
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
    setMensajes((m) => [
      ...m,
      { id: `u-${Date.now()}`, rol: "user", contenido: limpio },
      { id: idRespuesta, rol: "assistant", contenido: "", enCurso: true },
    ]);
    setEnviando(true);
    const control = new AbortController();
    abortar.current = control;

    const actualizar = (cambio: Partial<Mensaje>) =>
      setMensajes((m) => m.map((x) => (x.id === idRespuesta ? { ...x, ...cambio } : x)));

    // Un grupo nuevo manda a sus integrantes y el tema; uno ya guardado, solo su id
    const cuerpo =
      grupo && !actual
        ? { agentes: grupo, tema, mensaje: limpio }
        : { agente, mensaje: limpio, conversacionId: actual };

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
        const ahora = new Date().toISOString();
        setConversaciones((l) => {
          const existente = l.find((x) => x.id === idConv);
          const item: Conversacion = existente
            ? { ...existente, actualizado_en: ahora }
            : {
                id: idConv,
                agente,
                titulo: (tema ?? limpio).replace(/\s+/g, " ").slice(0, 80),
                actualizado_en: ahora,
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

  const fuentes: PromptBarSource[] = (grupo ?? activos).map((id) => ({
    key: id,
    name: AGENTE_POR_ID[id].nombre,
    description: `${AGENTE_POR_ID[id].area} · ${AGENTE_POR_ID[id].abarca}`,
    icon: <Personaje agente={id} avatar className="h-5 w-5" />,
  }));
  const sugerencias = grupo
    ? grupo.slice(0, 3).map((id) => AGENTE_POR_ID[id].sugerencias[0])
    : info.sugerencias;

  const lateral = (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 px-5 pb-4 pt-5">
        <button type="button" className="btn-pill w-full" onClick={() => nueva(agente)}>
          + Nueva conversación
        </button>
        {puedeGrupos ? (
          <button
            type="button"
            className="w-full border hairline py-3 text-[0.8125rem] font-medium uppercase tracking-[0.04em] text-silver transition-colors hover:border-bone hover:text-bone"
            onClick={() => {
              setCreando(true);
              setLista(false);
            }}
          >
            + Nuevo grupo
          </button>
        ) : (
          <Link href="/#planes" className="flex items-center justify-center gap-1.5 py-2 text-[0.8125rem] text-ash">
            <Candado /> Grupos con Atendel One
          </Link>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <p className="mt-2 font-cond text-base uppercase tracking-[0.03em] text-ash">Tu equipo</p>
        <ul className="mt-2">
          {AGENTES_INFO.map((a) => {
            const activo = activos.includes(a.id);
            const elegido = a.id === agente && !grupo && !actual && !creando;
            return (
              <li key={a.id}>
                {activo ? (
                  <button
                    type="button"
                    className="chat-agente"
                    data-active={elegido ? "true" : "false"}
                    onClick={() => nueva(a.id)}
                  >
                    <span className="flex items-center gap-2.5">
                      <Personaje agente={a.id} avatar className="h-6 w-6" />
                      <span className="editorial text-[1.375rem] leading-none">{a.nombre}</span>
                    </span>
                    <span className="text-[0.75rem] uppercase tracking-[0.05em] text-ash">{a.area}</span>
                  </button>
                ) : (
                  <Link href="/#planes" className="chat-agente opacity-50" title="Disponible con Atendel One">
                    <span className="flex items-center gap-2.5">
                      <Personaje agente={a.id} avatar className="h-6 w-6" />
                      <span className="editorial text-[1.375rem] leading-none">{a.nombre}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[0.75rem] uppercase tracking-[0.05em] text-ash">
                      <Candado />
                      One
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-8 font-cond text-base uppercase tracking-[0.03em] text-ash">Conversaciones</p>
        {conversaciones.length === 0 ? (
          <p className="mt-2 text-[0.875rem] text-ash">Aquí aparecerán tus conversaciones.</p>
        ) : (
          <ul className="mt-2">
            {conversaciones.map((c) => {
              const ids = integrantes(c) ?? [c.agente];
              return (
                <li key={c.id} className="group relative -mx-2.5">
                  <SwipeRow
                    key={`${c.id}-${reintentos}`}
                    label={c.titulo}
                    actions={[
                      { id: "borrar", label: "Borrar", icon: <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} /> },
                    ]}
                    onCommit={() => borrar(c, false)}
                    actionColor="#e5484d"
                    drawerColor="var(--color-shale)"
                    rowColor="var(--color-void)"
                    textColor="var(--color-bone-white)"
                    height={58}
                    radius={0}
                    actionWidth={76}
                    className="chat-conv-fila"
                  >
                    <button
                      type="button"
                      className="chat-conv flex items-center gap-2.5"
                      data-active={c.id === actual ? "true" : "false"}
                      onClick={() => abrir(c)}
                    >
                      <Avatares ids={ids} className="h-6 w-6" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate pr-6 text-[0.9375rem]">{c.titulo}</span>
                        <span className="mt-0.5 block truncate text-[0.75rem] text-ash">
                          {ids.length > 1 ? `Grupo · ${nombres(ids)}` : AGENTE_POR_ID[c.agente]?.nombre} ·{" "}
                          {cuando(c.actualizado_en)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="absolute right-0 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-ash opacity-100 transition-opacity hover:text-bone lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                      aria-label={`Borrar ${c.titulo}`}
                      onClick={() => borrar(c)}
                    >
                      ×
                    </button>
                  </SwipeRow>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t hairline px-5 py-4">
        <p className="mb-2 text-[0.8125rem] text-silver">{plan.nombre}</p>
        <Uso usados={usados} plan={plan} compacto />
      </div>
    </div>
  );

  return (
    <>
      <NavApp email={email} />
      <div className="chat fixed inset-x-0 bottom-0 top-[72px] flex border-t hairline">
        {/* Lateral en computadora */}
        <aside className="hidden w-[300px] shrink-0 border-r hairline lg:block" aria-label="Equipo y conversaciones">
          {lateral}
        </aside>

        {/* Lateral en celular: se abre sobre el chat */}
        {lista ? (
          <div className="absolute inset-0 z-20 bg-void lg:hidden" role="dialog" aria-label="Equipo y conversaciones">
            <button
              type="button"
              className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center text-xl"
              aria-label="Cerrar"
              onClick={() => setLista(false)}
            >
              ×
            </button>
            {lateral}
          </div>
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          {/* Con quién hablas */}
          <header className="flex min-h-[64px] items-center justify-between gap-4 border-b hairline px-5 lg:px-8">
            {creando ? (
              <p className="editorial truncate text-[1.75rem] leading-none">Nuevo grupo</p>
            ) : grupo ? (
              <div className="flex min-w-0 items-center gap-3">
                <Avatares ids={grupo} className="h-8 w-8" />
                <p className="min-w-0">
                  <span className="block truncate text-[1rem] font-medium leading-tight">{tema ?? nombres(grupo)}</span>
                  <span className="block truncate text-[0.75rem] uppercase tracking-[0.05em] text-ash">
                    Grupo · {nombres(grupo)}
                  </span>
                </p>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-3">
                <Personaje agente={agente} avatar className="h-9 w-9 shrink-0" />
                <p className="flex min-w-0 items-baseline gap-3">
                  <span className="editorial truncate text-[1.75rem] leading-none">{info.nombre}</span>
                  <span className="truncate text-[0.75rem] uppercase tracking-[0.05em] text-ash">{info.area}</span>
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              {actual ? (
                <button
                  type="button"
                  className="btn-ghost !text-[0.8125rem]"
                  onClick={() => (grupo ? nuevoGrupo(grupo, tema) : nueva(agente))}
                >
                  + Nueva
                </button>
              ) : null}
              <button type="button" className="btn-ghost !text-[0.8125rem] lg:hidden" onClick={() => setLista(true)}>
                Equipo y chats
              </button>
            </div>
          </header>

          {creando ? (
            <CrearGrupo
              activos={activos}
              onCrear={(ids, t) => nuevoGrupo(ids, t)}
              onCancelar={() => setCreando(false)}
            />
          ) : (
            <>
              {/* Mensajes */}
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  pegado.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                }}
              >
                <div className="mx-auto w-full max-w-[800px] px-5 py-10 lg:px-10 lg:py-14">
                  {cargando ? (
                    <p className="flex items-center gap-2 text-ash">
                      <TriSpinner className="h-3 w-3" /> Abriendo conversación…
                    </p>
                  ) : mensajes.length === 0 ? (
                    <div className="page-enter">
                      {grupo ? (
                        <>
                          <Avatares ids={grupo} className="h-14 w-14" />
                          <p className="editorial mt-6 text-[clamp(2.5rem,5.5vw,4.25rem)] leading-[0.95]">
                            {tema ?? `Grupo con ${nombres(grupo)}.`}
                          </p>
                          <p className="mt-4 max-w-[540px] text-body text-silver">
                            {tema ? `Con ${nombres(grupo)}. ` : ""}Escribe tu pregunta y contesta quien sepa del tema; se
                            complementan entre ellos. Usa @ para dirigirte a alguien en particular.
                          </p>
                        </>
                      ) : (
                        <>
                          <Personaje agente={agente} className="h-24 w-24" />
                          <p className="editorial mt-4 text-[clamp(2.75rem,6vw,4.75rem)] leading-[0.95]">
                            Hola, soy {info.nombre}.
                          </p>
                          <p className="mt-4 max-w-[520px] text-body text-silver">{info.lema}</p>
                        </>
                      )}
                      {disponible ? (
                        <>
                          <p className="mt-10 font-cond text-base uppercase tracking-[0.03em] text-ash">Para empezar</p>
                          <ul className="mt-2 border-b hairline">
                            {sugerencias.map((s) => (
                              <li key={s} className="border-t hairline">
                                <button
                                  type="button"
                                  className="chat-sugerencia"
                                  onClick={() => enviar(s)}
                                  disabled={sinMensajes}
                                >
                                  {s}
                                  <span aria-hidden="true">→</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="mt-8 text-body text-silver">
                          {grupo ? "Alguien de este grupo no está en tu equipo." : `${info.nombre} no está en tu equipo.`}{" "}
                          <Link
                            href={planId === "free" ? "/#planes" : "/panel/agentes"}
                            className="text-bone underline underline-offset-4"
                          >
                            {planId === "free" ? "Desbloquéalo con Atendel One" : "Agrégalo en Mis agentes"}
                          </Link>
                          .
                        </p>
                      )}
                    </div>
                  ) : (
                    <ol className="flex flex-col gap-9" aria-live="polite">
                      {mensajes.map((m) =>
                        m.rol === "user" ? (
                          <li key={m.id} className="flex justify-end">
                            <p className="max-w-[85%] whitespace-pre-wrap border hairline bg-shale px-4 py-3 text-[0.9375rem] leading-relaxed sm:max-w-[75%]">
                              {m.contenido}
                            </p>
                          </li>
                        ) : (
                          <li key={m.id} className="flex flex-col gap-7">
                            {voces(m).map((v, i, todas) => (
                              <Voz
                                key={i}
                                agente={v.agente}
                                texto={v.texto}
                                escribiendo={!!m.enCurso && i === todas.length - 1}
                                error={i === todas.length - 1 ? m.error : undefined}
                              />
                            ))}
                          </li>
                        ),
                      )}
                    </ol>
                  )}
                  {aviso ? (
                    <p role="alert" className="mt-6 text-signal">
                      {aviso}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Escribir */}
              <div className="mx-auto w-full max-w-[800px] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-10 lg:pb-6">
                {sinMensajes ? (
                  <p className="mb-3 text-[0.9375rem] text-silver">
                    Llegaste a los {plan.mensajesMes} mensajes de este mes.{" "}
                    <Link href="/#planes" className="text-bone underline underline-offset-4">
                      Ver planes
                    </Link>
                  </p>
                ) : null}
                {disponible && !sinMensajes ? (
                  <PromptBar
                    key={grupo ? grupo.join("-") : agente}
                    placeholder={
                      grupo
                        ? "Escríbele al grupo… @ para dirigirte a alguien, / para acciones"
                        : `Escríbele a ${info.nombre}… / para acciones`
                    }
                    sources={fuentes}
                    commands={comandosDe(participantes)}
                    models={[]}
                    efforts={[]}
                    busy={enviando}
                    onSend={(t) => enviar(t)}
                    onStop={() => abortar.current?.abort()}
                    background="var(--color-shale)"
                    color="var(--color-bone-white)"
                    menuBackground="var(--color-void)"
                    width={4000}
                    radius={0}
                    maxRows={8}
                  />
                ) : null}
                <p className="mt-2 text-center text-[0.75rem] text-ash">
                  {grupo ? "Pueden equivocarse" : `${info.nombre} puede equivocarse`}. Revisa lo importante antes de enviarlo
                  a un cliente.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

/** Lo que dice un agente: su personaje, su nombre y el texto. */
function Voz({ agente, texto, escribiendo, error }: { agente: IdAgente; texto: string; escribiendo?: boolean; error?: string }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 sm:gap-x-4">
      <Personaje agente={agente} avatar className="h-9 w-9" />
      <div className="min-w-0">
        <p className="flex items-baseline gap-2 text-[0.8125rem]">
          <span className="font-medium text-bone">{info.nombre}</span>
          <span className="text-ash">{info.area}</span>
        </p>
        <div className="mt-2 text-body text-silver">
          {texto ? (
            <Texto texto={texto} />
          ) : escribiendo ? (
            <p className="flex items-center gap-2 text-ash">
              <TriSpinner className="h-3 w-3" /> Escribiendo…
            </p>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-[0.9375rem] text-signal">
            {error}
          </p>
        ) : null}
        {!escribiendo && texto ? <Copiar texto={texto} /> : null}
      </div>
    </div>
  );
}

/** Armar un grupo: eliges 2 o más agentes de tu equipo y, si quieres, un tema. */
function CrearGrupo({
  activos,
  onCrear,
  onCancelar,
}: {
  activos: IdAgente[];
  onCrear: (ids: IdAgente[], tema: string | null) => void;
  onCancelar: () => void;
}) {
  const [elegidos, setElegidos] = useState<IdAgente[]>([]);
  const [tema, setTema] = useState("");
  const listo = elegidos.length >= 2;
  const alternar = (id: IdAgente) =>
    setElegidos((l) => (l.includes(id) ? l.filter((x) => x !== id) : AGENTES_INFO.map((a) => a.id).filter((x) => x === id || l.includes(x))));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <form
        className="page-enter mx-auto w-full max-w-[720px] px-5 py-10 lg:px-10 lg:py-14"
        onSubmit={(e) => {
          e.preventDefault();
          if (listo) onCrear(elegidos, tema.trim() || null);
        }}
      >
        <h2 className="editorial text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.95]">Arma un grupo.</h2>
        <p className="mt-4 max-w-[520px] text-body text-silver">
          Elige con quiénes quieres hablar de un tema. Contesta quien sepa y se complementan entre ellos, en una sola
          conversación.
        </p>

        <fieldset className="mt-10">
          <legend className="font-cond text-base uppercase tracking-[0.03em] text-ash">Integrantes · mínimo 2</legend>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {AGENTES_INFO.map((a) => {
              const puede = activos.includes(a.id);
              const on = elegidos.includes(a.id);
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    className="crear-grupo__agente"
                    aria-pressed={on}
                    disabled={!puede}
                    onClick={() => alternar(a.id)}
                  >
                    <Personaje agente={a.id} avatar className="h-11 w-11 shrink-0" />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-[1rem] font-medium">{a.nombre}</span>
                      <span className="block truncate text-[0.8125rem] text-ash">
                        {puede ? `${a.area} · ${a.abarca}` : "No está en tu equipo"}
                      </span>
                    </span>
                    <span className="crear-grupo__marca" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <label className="mt-10 block">
          <span className="font-cond text-base uppercase tracking-[0.03em] text-ash">Tema (opcional)</span>
          <input
            type="text"
            value={tema}
            maxLength={MAX_TEMA}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Por ejemplo: campaña de noviembre"
            className="mt-3 block w-full border-b hairline bg-transparent py-3 text-body text-bone outline-none placeholder:text-ash focus:border-bone"
          />
        </label>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button type="submit" className="btn-pill" disabled={!listo}>
            {listo ? `Crear grupo con ${nombres(elegidos)}` : "Elige al menos 2"}
          </button>
          <button type="button" className="btn-ghost" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Copiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost mt-2 !min-h-[36px] !text-[0.75rem]"
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
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}
