"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { TriSpinner } from "@/components/Buttons";
import SwipeRow from "@/components/SwipeRow";
import { NavApp } from "@/components/app/NavApp";
import { Uso } from "@/components/app/Uso";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";
import { Texto } from "@/components/Texto";

export type Conversacion = { id: string; agente: IdAgente; titulo: string; actualizado_en: string };
type Mensaje = { id: string; rol: "user" | "assistant"; contenido: string; error?: string; enCurso?: boolean };

const MARCA_ERROR = "\u0000ERROR:";
const MAX_MENSAJE = 4000;

function cuando(fecha: string) {
  const d = new Date(fecha);
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) {
    return d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function Candado() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="6" width="9" height="6.5" stroke="currentColor" />
      <path d="M4.5 6V4.2a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" />
    </svg>
  );
}

/**
 * Chat con los agentes, como en ChatGPT o Claude: eliges con quién hablar,
 * escribes y la respuesta va apareciendo. Las conversaciones se guardan.
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
  const [conversaciones, setConversaciones] = useState(conversacionesIniciales);
  const [actual, setActual] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [usados, setUsados] = useState(usadosIniciales);
  const [texto, setTexto] = useState("");
  const [lista, setLista] = useState(false); // panel de conversaciones en celular
  const [aviso, setAviso] = useState<string | null>(null);
  const [reintentos, setReintentos] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const abortar = useRef<AbortController | null>(null);
  const pegado = useRef(true); // ¿la vista está hasta abajo?

  const info = AGENTE_POR_ID[agente];
  const disponible = activos.includes(agente);
  const sinMensajes = usados >= plan.mensajesMes;

  const ponerUrl = (params: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    window.history.replaceState(null, "", `/panel/chat${q ? `?${q}` : ""}`);
  };

  const nueva = useCallback(
    (id: IdAgente) => {
      abortar.current?.abort();
      setAgente(id);
      setActual(null);
      setMensajes([]);
      setAviso(null);
      setLista(false);
      ponerUrl({ agente: id });
      window.setTimeout(() => campoRef.current?.focus(), 50);
    },
    [],
  );

  const abrir = useCallback(async (c: Conversacion) => {
    abortar.current?.abort();
    setLista(false);
    setAviso(null);
    setActual(c.id);
    setAgente(c.agente);
    setMensajes([]);
    setCargando(true);
    ponerUrl({ c: c.id });
    const { data, error } = await createClient()
      .from("mensajes")
      .select("id, rol, contenido")
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
    setTexto("");
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

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agente, mensaje: limpio, conversacionId: actual }),
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
            : { id: idConv, agente, titulo: limpio.replace(/\s+/g, " ").slice(0, 80), actualizado_en: ahora };
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

  function alEnviar(e: FormEvent) {
    e.preventDefault();
    enviar(texto);
  }

  function alTeclear(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      enviar(texto);
    }
  }

  // El campo crece con el texto (hasta un tope)
  useEffect(() => {
    const el = campoRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [texto]);

  const lateral = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-5">
        <button type="button" className="btn-pill w-full" onClick={() => nueva(agente)}>
          + Nueva conversación
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <p className="mt-2 font-cond text-base uppercase tracking-[0.03em] text-ash">Tu equipo</p>
        <ul className="mt-2">
          {AGENTES_INFO.map((a) => {
            const activo = activos.includes(a.id);
            const elegido = a.id === agente && !actual;
            return (
              <li key={a.id}>
                {activo ? (
                  <button
                    type="button"
                    className="chat-agente"
                    data-active={elegido ? "true" : "false"}
                    onClick={() => nueva(a.id)}
                  >
                    <span className="editorial text-[1.375rem] leading-none">{a.nombre}</span>
                    <span className="text-[0.75rem] uppercase tracking-[0.05em] text-ash">{a.area}</span>
                  </button>
                ) : (
                  <Link href="/#planes" className="chat-agente opacity-50" title="Disponible con Atendel One">
                    <span className="editorial text-[1.375rem] leading-none">{a.nombre}</span>
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
            {conversaciones.map((c) => (
              <li key={c.id} className="group relative -mx-2.5">
                <SwipeRow
                  key={`${c.id}-${reintentos}`}
                  label={c.titulo}
                  actions={[{ id: "borrar", label: "Borrar", icon: <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.8} /> }]}
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
                    className="chat-conv"
                    data-active={c.id === actual ? "true" : "false"}
                    onClick={() => abrir(c)}
                  >
                    <span className="block truncate pr-6 text-[0.9375rem]">{c.titulo}</span>
                    <span className="mt-0.5 block text-[0.75rem] text-ash">
                      {AGENTE_POR_ID[c.agente]?.nombre} · {cuando(c.actualizado_en)}
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
            ))}
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
          <header className="flex min-h-[60px] items-center justify-between gap-4 border-b hairline px-5 lg:px-8">
            <p className="flex min-w-0 items-baseline gap-3">
              <span className="editorial truncate text-[1.75rem] leading-none">{info.nombre}</span>
              <span className="truncate text-[0.75rem] uppercase tracking-[0.05em] text-ash">{info.area}</span>
            </p>
            <div className="flex items-center gap-2">
              {actual ? (
                <button type="button" className="btn-ghost !text-[0.8125rem]" onClick={() => nueva(agente)}>
                  + Nueva
                </button>
              ) : null}
              <button type="button" className="btn-ghost !text-[0.8125rem] lg:hidden" onClick={() => setLista(true)}>
                Equipo y chats
              </button>
            </div>
          </header>

          {/* Mensajes */}
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto"
            onScroll={(e) => {
              const el = e.currentTarget;
              pegado.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            }}
          >
            <div className="mx-auto w-full max-w-[780px] px-5 py-8 lg:px-8 lg:py-12">
              {cargando ? (
                <p className="flex items-center gap-2 text-ash">
                  <TriSpinner className="h-3 w-3" /> Abriendo conversación…
                </p>
              ) : mensajes.length === 0 ? (
                <div className="page-enter">
                  <p className="editorial text-[clamp(2.75rem,6vw,4.75rem)] leading-[0.95]">
                    Hola, soy {info.nombre}.
                  </p>
                  <p className="mt-4 max-w-[520px] text-body text-silver">{info.lema}</p>
                  {disponible ? (
                    <>
                      <p className="mt-10 font-cond text-base uppercase tracking-[0.03em] text-ash">Para empezar</p>
                      <ul className="mt-2 border-b hairline">
                        {info.sugerencias.map((s) => (
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
                      {info.nombre} no está en tu equipo.{" "}
                      <Link href={planId === "free" ? "/#planes" : "/panel/agentes"} className="text-bone underline underline-offset-4">
                        {planId === "free" ? "Desbloquéalo con Atendel One" : "Agrégalo en Mis agentes"}
                      </Link>
                      .
                    </p>
                  )}
                </div>
              ) : (
                <ol className="flex flex-col gap-8" aria-live="polite">
                  {mensajes.map((m) =>
                    m.rol === "user" ? (
                      <li key={m.id} className="flex justify-end">
                        <p className="max-w-[85%] whitespace-pre-wrap border hairline bg-shale px-4 py-3 text-body">
                          {m.contenido}
                        </p>
                      </li>
                    ) : (
                      <li key={m.id} className="text-body text-silver">
                        <p className="mb-2 font-cond text-base uppercase tracking-[0.03em] text-ash">{info.nombre}</p>
                        {m.contenido ? (
                          <Texto texto={m.contenido} />
                        ) : m.enCurso ? (
                          <p className="flex items-center gap-2 text-ash">
                            <TriSpinner className="h-3 w-3" /> Escribiendo…
                          </p>
                        ) : null}
                        {m.error ? (
                          <p role="alert" className="mt-3 text-[0.9375rem] text-signal">
                            {m.error}
                          </p>
                        ) : null}
                        {!m.enCurso && m.contenido ? <Copiar texto={m.contenido} /> : null}
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
          <form onSubmit={alEnviar} className="mx-auto w-full max-w-[780px] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-8 lg:pb-6">
            {sinMensajes ? (
              <p className="mb-3 text-[0.9375rem] text-silver">
                Llegaste a los {plan.mensajesMes} mensajes de este mes.{" "}
                <Link href="/#planes" className="text-bone underline underline-offset-4">
                  Ver planes
                </Link>
              </p>
            ) : null}
            <div className="chat-campo flex items-end gap-2 border hairline bg-shale p-2 pl-4">
              <label htmlFor="mensaje" className="sr-only">
                Mensaje para {info.nombre}
              </label>
              <textarea
                id="mensaje"
                ref={campoRef}
                rows={1}
                value={texto}
                maxLength={MAX_MENSAJE}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={alTeclear}
                placeholder={disponible ? `Escríbele a ${info.nombre}…` : `${info.nombre} no está en tu equipo`}
                disabled={!disponible || sinMensajes}
                className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-body text-bone outline-none placeholder:text-ash disabled:cursor-not-allowed"
              />
              {enviando ? (
                <button
                  type="button"
                  className="grid h-11 w-11 shrink-0 place-items-center border border-bone text-bone"
                  onClick={() => abortar.current?.abort()}
                  aria-label="Detener"
                >
                  <span className="h-3 w-3 bg-bone" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="grid h-11 w-11 shrink-0 place-items-center bg-bone text-void transition-opacity disabled:opacity-30"
                  disabled={!texto.trim() || !disponible || sinMensajes}
                  aria-label="Enviar"
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-[0.75rem] text-ash">
              {info.nombre} puede equivocarse. Revisa lo importante antes de enviarlo a un cliente.
            </p>
          </form>
        </section>
      </div>
    </>
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
