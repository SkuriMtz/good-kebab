"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Icono } from "@/components/base/Iconos";
import { createClient } from "@/lib/supabase/client";
import { claseBoton } from "../Piezas";
import { DEMO_MEMORIA, DEMO_PROCESOS, DEMO_REGLAS } from "@/lib/cerebro-demo";
import { useFuenteNegocio } from "./fuente";

/* =====================================================================
   El cerebro de Atendel, en Tu negocio (migración 0019):
   - Reglas: lo que nunca se equivoca (precios, políticas, datos, "nunca").
   - Procesos: cómo se hace cada cosa (cuándo y los pasos).
   - Memoria: lo que aprendió de ti (lo guarda en el chat; aquí se ve, se
     agrega o se borra).
   En /panel se guarda en Supabase (RLS: solo lo tuyo); en /pruebalo, el
   ejemplo de Estudio Luna vive en esta pestaña y no se guarda.
   ===================================================================== */

type TipoRegla = "precio" | "politica" | "dato" | "nunca";
type Regla = { id: string; tipo: TipoRegla; texto: string; por_aprobar?: boolean };
type Proceso = { id: string; titulo: string; cuando: string; pasos: string; activo: boolean };
type Recuerdo = { id: string; texto: string; fuente: "dueño" | "chat" | "trabajo"; creado_en: string };

const TIPOS: { id: TipoRegla; nombre: string; ejemplo: string }[] = [
  { id: "precio", nombre: "Precio", ejemplo: "Ej.: Sesión de 1 hora: $900 MXN" },
  { id: "politica", nombre: "Política", ejemplo: "Ej.: Cancelaciones con 24 horas de anticipación; si no, se cobra el 50 %." },
  { id: "dato", nombre: "Dato", ejemplo: "Ej.: Estamos en Av. Reforma 123, a una cuadra del metro." },
  { id: "nunca", nombre: "Nunca", ejemplo: "Ej.: Nunca ofrecer descuentos de más del 10 %." },
];
const NOMBRE: Record<TipoRegla, string> = { precio: "Precio", politica: "Política", dato: "Dato", nunca: "Nunca" };

const formatoDia = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });

/** Leer, agregar, cambiar y borrar: en Supabase (cuenta real) o en memoria (demostración). */
function useLista<T extends { id: string }>(tabla: "reglas" | "procesos" | "memoria", columnas: string, orden: { col: string; asc: boolean }, demo: T[]) {
  const fuente = useFuenteNegocio();
  const [lista, setLista] = useState<T[] | null>(fuente.demo ? demo : null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fuente.demo) return;
    let vivo = true;
    createClient()
      .from(tabla)
      .select(columnas)
      .order(orden.col, { ascending: orden.asc })
      .limit(500)
      .then(({ data, error: e }) => {
        if (!vivo) return;
        if (e) setError("No se pudo leer. Recarga la página.");
        setLista(((data ?? []) as unknown as T[]) ?? []);
      });
    return () => {
      vivo = false;
    };
  }, [fuente.demo, tabla, columnas, orden.col, orden.asc]);

  const agregar = async (fila: Omit<T, "id">) => {
    setError(null);
    if (fuente.demo) {
      setLista((l) => [{ ...(fila as T), id: `d${Date.now()}` }, ...(l ?? [])]);
      return true;
    }
    const { data, error: e } = await createClient()
      .from(tabla)
      .insert(fila as Record<string, unknown>)
      .select(columnas)
      .single();
    if (e || !data) {
      setError(e?.code === "23514" ? "Llegaste al máximo. Borra algo para agregar más." : "No se pudo guardar. Intenta de nuevo.");
      return false;
    }
    setLista((l) => [data as unknown as T, ...(l ?? [])]);
    return true;
  };
  const cambiar = async (id: string, cambios: Partial<T>) => {
    setError(null);
    setLista((l) => (l ?? []).map((x) => (x.id === id ? { ...x, ...cambios } : x)));
    if (fuente.demo) return;
    const { error: e } = await createClient()
      .from(tabla)
      .update({ ...cambios, ...(tabla === "memoria" ? {} : { actualizado_en: new Date().toISOString() }) })
      .eq("id", id);
    if (e) setError("No se pudo guardar el cambio.");
  };
  const borrar = async (id: string) => {
    setError(null);
    const antes = lista;
    setLista((l) => (l ?? []).filter((x) => x.id !== id));
    if (fuente.demo) return;
    const { error: e } = await createClient().from(tabla).delete().eq("id", id);
    if (e) {
      setLista(antes);
      setError("No se pudo borrar.");
    }
  };
  return { lista, error, agregar, cambiar, borrar, demo: fuente.demo };
}

function Aviso({ error, demo }: { error: string | null; demo: boolean }) {
  return (
    <>
      {demo ? <p className="pc-cerebro__nota">Ejemplo de Estudio Luna: puedes probar, pero nada se guarda.</p> : null}
      {error ? (
        <p className="pc-citas-aviso pc-citas-aviso--error" role="alert">
          <Icono nombre="alerta" tam={16} />
          {error}
        </p>
      ) : null}
    </>
  );
}

/* ---------- Reglas ---------- */
export function ReglasNegocio() {
  const { lista, error, agregar, cambiar, borrar, demo } = useLista<Regla>("reglas", "id, tipo, texto, por_aprobar", { col: "creado_en", asc: true }, DEMO_REGLAS);
  const [tipo, setTipo] = useState<TipoRegla>("precio");
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState<{ id: string; texto: string } | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    if (await agregar({ tipo, texto: t.slice(0, 500) })) setTexto("");
  }

  return (
    <div className="pc-cerebro">
      <p className="pc-cerebro__intro">
        Lo que Atendel <strong>nunca</strong> puede decir mal. Si algo cuesta $5,000, escríbelo aquí: nunca le dirá a un cliente otro precio. Antes de dejarte un mensaje, lo revisa contra estas reglas.
      </p>
      <Aviso error={error} demo={demo} />
      <form className="pc-cerebro__forma" onSubmit={enviar}>
        <div className="pc-cerebro__tipos" role="group" aria-label="Tipo de regla">
          {TIPOS.map((t) => (
            <button key={t.id} type="button" className="pc-pildora" aria-pressed={tipo === t.id} onClick={() => setTipo(t.id)}>
              {t.nombre}
            </button>
          ))}
        </div>
        <div className="pc-cerebro__fila">
          <input className="pc-campo__entrada" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={TIPOS.find((t) => t.id === tipo)?.ejemplo} maxLength={500} aria-label="Nueva regla" />
          <button type="submit" className={claseBoton("principal")} disabled={!texto.trim()}>
            Agregar
          </button>
        </div>
      </form>
      {lista === null ? (
        <p className="pc-cerebro__nota">Cargando…</p>
      ) : !lista.length ? (
        <p className="pc-cerebro__vacio">Todavía no hay reglas. Empieza por tus precios: son lo que más importa que diga bien.</p>
      ) : (
        TIPOS.filter((t) => lista.some((r) => r.tipo === t.id)).map((t) => (
          <section key={t.id} className="pc-cerebro__grupo">
            <h3 className="pc-cerebro__titulo">{NOMBRE[t.id]}</h3>
            <ul className="pc-cerebro__lista">
              {lista
                .filter((r) => r.tipo === t.id)
                .map((r) => (
                  <li key={r.id} className="pc-cerebro__item">
                    {editando?.id === r.id ? (
                      <form
                        className="pc-cerebro__fila"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const v = editando.texto.trim();
                          if (v) void cambiar(r.id, { texto: v.slice(0, 500) });
                          setEditando(null);
                        }}
                      >
                        <input className="pc-campo__entrada" value={editando.texto} onChange={(e) => setEditando({ id: r.id, texto: e.target.value })} maxLength={500} aria-label="Cambiar regla" autoFocus />
                        <button type="submit" className={claseBoton("borde", true)}>
                          Guardar
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="pc-cerebro__texto">
                          {r.por_aprobar ? <span className="pc-cerebro__por-aprobar">Por aprobar</span> : null}
                          {r.texto}
                        </span>
                        <span className="pc-cerebro__acciones">
                          {r.por_aprobar ? (
                            <button type="button" className={claseBoton("borde", true)} onClick={() => void cambiar(r.id, { por_aprobar: false })}>
                              Aprobar
                            </button>
                          ) : null}
                          <button type="button" className="pc-icono" aria-label="Cambiar" title="Cambiar" onClick={() => setEditando({ id: r.id, texto: r.texto })}>
                            <Icono nombre="documento" tam={15} />
                          </button>
                          <button type="button" className="pc-icono" aria-label="Borrar" title="Borrar" onClick={() => void borrar(r.id)}>
                            <Icono nombre="basura" tam={15} />
                          </button>
                        </span>
                      </>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

/* ---------- Procesos ---------- */
export function ProcesosNegocio() {
  const { lista, error, agregar, cambiar, borrar, demo } = useLista<Proceso>("procesos", "id, titulo, cuando, pasos, activo", { col: "creado_en", asc: true }, DEMO_PROCESOS);
  const vacio = { titulo: "", cuando: "", pasos: "" };
  const [forma, setForma] = useState(vacio);
  const [abierta, setAbierta] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!forma.titulo.trim() || !forma.cuando.trim() || !forma.pasos.trim()) return;
    if (await agregar({ titulo: forma.titulo.trim().slice(0, 120), cuando: forma.cuando.trim().slice(0, 300), pasos: forma.pasos.trim().slice(0, 3000), activo: true })) {
      setForma(vacio);
      setAbierta(false);
    }
  }

  return (
    <div className="pc-cerebro">
      <p className="pc-cerebro__intro">Cómo se hace cada cosa en tu negocio. Atendel los sigue paso a paso, como lo harías tú.</p>
      <Aviso error={error} demo={demo} />
      {abierta ? (
        <form className="pc-cerebro__proceso-forma" onSubmit={enviar}>
          <label className="pc-campo">
            <span className="pc-campo__etiqueta">Nombre</span>
            <input className="pc-campo__entrada" value={forma.titulo} onChange={(e) => setForma({ ...forma, titulo: e.target.value })} placeholder="Ej.: Agendar una cita" maxLength={120} />
          </label>
          <label className="pc-campo">
            <span className="pc-campo__etiqueta">Cuándo aplica</span>
            <input className="pc-campo__entrada" value={forma.cuando} onChange={(e) => setForma({ ...forma, cuando: e.target.value })} placeholder="Ej.: Cuando alguien pide cita por WhatsApp" maxLength={300} />
          </label>
          <label className="pc-campo">
            <span className="pc-campo__etiqueta">Los pasos</span>
            <textarea className="pc-campo__entrada pc-campo__entrada--largo" value={forma.pasos} onChange={(e) => setForma({ ...forma, pasos: e.target.value })} placeholder={"1. Ofrece 2 horarios libres.\n2. Confirma día, hora y servicio.\n3. Manda la ubicación."} maxLength={3000} />
          </label>
          <div className="pc-cerebro__fila pc-cerebro__fila--fin">
            <button type="button" className={claseBoton("fantasma")} onClick={() => setAbierta(false)}>
              Cancelar
            </button>
            <button type="submit" className={claseBoton("principal")} disabled={!forma.titulo.trim() || !forma.cuando.trim() || !forma.pasos.trim()}>
              Guardar proceso
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className={claseBoton("borde")} onClick={() => setAbierta(true)}>
          <Icono nombre="mas" tam={16} />
          Nuevo proceso
        </button>
      )}
      {lista === null ? (
        <p className="pc-cerebro__nota">Cargando…</p>
      ) : !lista.length ? (
        <p className="pc-cerebro__vacio">Todavía no hay procesos. Escribe cómo quieres que se haga lo que más se repite: agendar, dar seguimiento, cobrar.</p>
      ) : (
        <ul className="pc-cerebro__procesos">
          {lista.map((p) => (
            <li key={p.id} className="pc-cerebro__proceso" data-apagado={p.activo ? undefined : ""}>
              <div className="pc-cerebro__proceso-cabeza">
                <p className="pc-cerebro__proceso-titulo">{p.titulo}</p>
                <span className="pc-cerebro__acciones">
                  <button type="button" className="pc-pildora" aria-pressed={p.activo} onClick={() => void cambiar(p.id, { activo: !p.activo })}>
                    {p.activo ? "Activo" : "Pausado"}
                  </button>
                  <button type="button" className="pc-icono" aria-label="Borrar" title="Borrar" onClick={() => void borrar(p.id)}>
                    <Icono nombre="basura" tam={15} />
                  </button>
                </span>
              </div>
              <p className="pc-cerebro__cuando">Cuándo: {p.cuando}</p>
              <p className="pc-cerebro__pasos">{p.pasos}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Memoria ---------- */
export function MemoriaNegocio() {
  const { lista, error, agregar, borrar, demo } = useLista<Recuerdo>("memoria", "id, texto, fuente, creado_en", { col: "creado_en", asc: false }, DEMO_MEMORIA);
  const [texto, setTexto] = useState("");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    if (await agregar({ texto: t.slice(0, 400), fuente: "dueño", creado_en: new Date().toISOString() })) setTexto("");
  }

  return (
    <div className="pc-cerebro">
      <p className="pc-cerebro__intro">Lo que Atendel recuerda de ti y de tu negocio. Lo aprende cuando platican; aquí lo ves, lo agregas o lo borras.</p>
      <Aviso error={error} demo={demo} />
      <form className="pc-cerebro__fila" onSubmit={enviar}>
        <input className="pc-campo__entrada" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej.: Chuchito es el proveedor de la carne y entrega los martes." maxLength={400} aria-label="Algo para recordar" />
        <button type="submit" className={claseBoton("principal")} disabled={!texto.trim()}>
          Recordar
        </button>
      </form>
      {lista === null ? (
        <p className="pc-cerebro__nota">Cargando…</p>
      ) : !lista.length ? (
        <p className="pc-cerebro__vacio">Todavía no recuerda nada. Cuéntale cosas en el chat (por ejemplo, «mi proveedor de carne es Chuchito») y las irá guardando aquí.</p>
      ) : (
        <ul className="pc-cerebro__lista">
          {lista.map((m) => (
            <li key={m.id} className="pc-cerebro__item">
              <span className="pc-cerebro__texto">
                {m.texto}
                <span className="pc-cerebro__origen">
                  {m.fuente === "chat" ? "Lo aprendió en el chat" : m.fuente === "trabajo" ? "Lo aprendió trabajando" : "Lo agregaste tú"} · {formatoDia.format(new Date(m.creado_en))}
                </span>
              </span>
              <span className="pc-cerebro__acciones">
                <button type="button" className="pc-icono" aria-label="Olvidar" title="Olvidar" onClick={() => void borrar(m.id)}>
                  <Icono nombre="basura" tam={15} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
