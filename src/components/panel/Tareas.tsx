"use client";

import { useEffect, useState, type CSSProperties, type FormEvent , type ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";
import { createClient } from "@/lib/supabase/client";
import { NOMBRES_DIA, cuandoEnPalabras, errorFrecuencia, frecuenciaEnPalabras, siguienteVez, type Frecuencia, type TipoTarea } from "@/lib/tareas-tiempo";
import { Enlace, TituloSeccion, claseBoton, retrasoEscalon } from "./Piezas";
import { Seccion } from "./Secciones";
import { pareceInvestigacion } from "@/lib/investigar";

/* =====================================================================
   PILOTO AUTOMÁTICO (antes «Tareas»): lo que Atendel hace solo, a la hora que le dijiste (0020).
   Lo más fácil: pedírselas en el chat con tus palabras (los ejemplos de
   arriba llevan al chat). También se pueden crear aquí con solo dos cosas:
   qué hacer y cuándo. Se pausan o se borran. En /pruebalo, de ejemplo.
   ===================================================================== */

type Tarea = {
  id: string;
  titulo: string;
  instruccion: string;
  tipo: TipoTarea;
  dias: number[];
  dia_mes: number | null;
  fecha: string | null;
  hora: string;
  zona: string;
  proxima: string | null;
  ultima: string | null;
  ultimo_resultado: string | null;
  activa: boolean;
};

const COLUMNAS = "id, titulo, instruccion, tipo, dias, dia_mes, fecha, hora, zona, proxima, ultima, ultimo_resultado, activa";
const EJEMPLOS = [
  "Cada martes a las 3 pm pregúntale a Chuchito si llegó el pedido.",
  "El último día de cada mes revisa mis ventas y hazme un reporte.",
  "Todos los días a las 7 pm dime qué citas tengo mañana.",
];
const CUANDO: { id: TipoTarea; nombre: string }[] = [
  { id: "una_vez", nombre: "Una vez" },
  { id: "diaria", nombre: "Todos los días" },
  { id: "semanal", nombre: "Cada semana" },
  { id: "mensual", nombre: "Cada mes" },
];
// Lunes primero, como se piensa la semana
const DIAS = [1, 2, 3, 4, 5, 6, 0];
const HORAS = Array.from({ length: 33 }, (_, i) => `${String(6 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

export function tareasDeEjemplo(ahora: number, zona: string): Tarea[] {
  const base = [
    { id: "t1", titulo: "Preguntarle a Chuchito por el pedido", instruccion: "Pregúntale a Chuchito (proveedor) si ya llegó el pedido de la semana.", tipo: "semanal" as const, dias: [2], dia_mes: null, fecha: null, hora: "15:00" },
    { id: "t2", titulo: "Reporte de ventas del mes", instruccion: "Revisa las ventas del mes y arma un reporte corto con lo más importante.", tipo: "mensual" as const, dias: [], dia_mes: -1, fecha: null, hora: "09:00" },
  ];
  return base.map((t) => ({
    ...t,
    zona,
    proxima: siguienteVez({ ...t, zona }, ahora),
    ultima: t.id === "t1" ? new Date(ahora - 5 * 86_400_000).toISOString() : null,
    ultimo_resultado: t.id === "t1" ? "Le dejé el mensaje a Chuchito en Pendientes; espera tu visto bueno." : null,
    activa: true,
  }));
}

export function TareasVista({
  demo = false,
  zona,
  ahora,
  base,
  resumen,
}: {
  demo?: boolean;
  zona: string;
  ahora: number;
  /** "/panel" o "/pruebalo" */
  base: string;
  /** Te necesita, Lo que viene y Lo que ya hizo (antes iban debajo de la caja de la Oficina). */
  resumen?: ReactNode;
}) {
  const [lista, setLista] = useState<Tarea[] | null>(demo ? tareasDeEjemplo(ahora, zona) : null);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState(false);
  const [forma, setForma] = useState<{ que: string; tipo: TipoTarea; dias: number[]; dia_mes: number; fecha: string; hora: string }>({
    que: "",
    tipo: "semanal",
    dias: [1],
    dia_mes: 1,
    fecha: new Intl.DateTimeFormat("en-CA", { timeZone: zona }).format(new Date(ahora + 86_400_000)),
    hora: "09:00",
  });

  useEffect(() => {
    if (demo) return;
    let vivo = true;
    createClient()
      .from("tareas")
      .select(COLUMNAS)
      .order("creado_en", { ascending: true })
      .then(({ data, error: e }) => {
        if (!vivo) return;
        if (e) setError("No se pudo leer tus tareas. Recarga la página.");
        setLista((data ?? []) as Tarea[]);
      });
    return () => {
      vivo = false;
    };
  }, [demo]);

  const frecuenciaDeForma = (): Frecuencia => ({
    tipo: forma.tipo,
    dias: forma.tipo === "semanal" ? forma.dias : [],
    dia_mes: forma.tipo === "mensual" ? forma.dia_mes : null,
    fecha: forma.tipo === "una_vez" ? forma.fecha : null,
    hora: forma.hora,
    zona,
  });
  const vistaPrevia = (() => {
    const f = frecuenciaDeForma();
    if (errorFrecuencia(f)) return null;
    const p = siguienteVez(f, Date.now());
    return p ? `${frecuenciaEnPalabras(f)}. La primera vez: ${cuandoEnPalabras(p, zona)}.` : "Esa fecha y hora ya pasaron.";
  })();

  async function crear(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const que = forma.que.trim();
    const f = frecuenciaDeForma();
    const mal = errorFrecuencia(f);
    if (!que || mal) return setError(mal ?? "Escribe qué quieres que haga.");
    const proxima = siguienteVez(f, Date.now());
    if (!proxima) return setError("Esa fecha y hora ya pasaron.");
    const nueva = { titulo: que.replace(/\s+/g, " ").slice(0, 60) + (que.length > 60 ? "…" : ""), instruccion: que.slice(0, 2000), tipo: f.tipo, dias: f.dias, dia_mes: f.dia_mes, fecha: f.fecha, hora: f.hora, zona, proxima };
    if (demo) {
      setLista((l) => [...(l ?? []), { ...nueva, id: `d${Date.now()}`, ultima: null, ultimo_resultado: null, activa: true }]);
    } else {
      // Si pide investigar (proveedores, precios…), cuando corra buscará en internet
      const { data, error: e2 } = await createClient()
        .from("tareas")
        .insert({ ...nueva, internet: pareceInvestigacion(que) })
        .select(COLUMNAS)
        .single();
      if (e2 || !data) return setError(e2?.code === "23514" ? "Ya tienes 30 tareas, el máximo. Borra alguna para agregar otra." : "No se pudo guardar. Intenta de nuevo.");
      setLista((l) => [...(l ?? []), data as Tarea]);
    }
    setForma((x) => ({ ...x, que: "" }));
    setAbierta(false);
  }

  async function pausar(t: Tarea) {
    setError(null);
    const activa = !t.activa;
    // Al reanudar, se calcula de nuevo la siguiente vez
    const proxima = activa ? siguienteVez({ tipo: t.tipo, dias: t.dias, dia_mes: t.dia_mes, fecha: t.fecha, hora: t.hora, zona: t.zona }, Date.now()) : t.proxima;
    if (activa && !proxima) return setError("Esa tarea era para una fecha que ya pasó. Bórrala y crea otra.");
    setLista((l) => (l ?? []).map((x) => (x.id === t.id ? { ...x, activa, proxima } : x)));
    if (demo) return;
    const { error: e } = await createClient().from("tareas").update({ activa, proxima }).eq("id", t.id);
    if (e) setError("No se pudo guardar el cambio.");
  }

  async function borrar(t: Tarea) {
    setError(null);
    const antes = lista;
    setLista((l) => (l ?? []).filter((x) => x.id !== t.id));
    if (demo) return;
    const { error: e } = await createClient().from("tareas").delete().eq("id", t.id);
    if (e) {
      setLista(antes);
      setError("No se pudo borrar.");
    }
  }

  return (
    <Seccion>
      <TituloSeccion titulo="Tareas" texto="Lo que Atendel hace solo, a su hora. Cuando toca, lo hace y te deja el resultado." />
      {resumen}

      <section className="pc-tareas__pide" aria-label="Pídeselas a Atendel">
        <p className="pc-tareas__pide-titulo">Lo más fácil: pídeselas a Atendel con tus palabras</p>
        <div className="pc-tareas__ejemplos">
          {EJEMPLOS.map((x) => (
            <Enlace key={x} href={`${base}?pide=${encodeURIComponent(x)}`} className="pc-tareas__ejemplo">
              <Icono nombre="mensaje" tam={14} />
              {x}
            </Enlace>
          ))}
        </div>
      </section>

      {error ? (
        <p className="pc-citas-aviso pc-citas-aviso--error" role="alert">
          <Icono nombre="alerta" tam={16} />
          {error}
        </p>
      ) : null}
      {demo ? <p className="pc-cerebro__nota">Ejemplo de Estudio Luna: puedes probar, pero nada se guarda.</p> : null}

      {abierta ? (
        <form className="pc-tareas__forma" onSubmit={crear}>
          <label className="pc-campo">
            <span className="pc-campo__etiqueta">Qué quieres que haga</span>
            <textarea className="pc-campo__entrada pc-campo__entrada--largo" value={forma.que} onChange={(e) => setForma({ ...forma, que: e.target.value })} placeholder="Ej.: Pregúntale a Chuchito si ya llegó el pedido de la semana." maxLength={2000} rows={3} />
          </label>
          <fieldset className="pc-campo pc-elige">
            <legend className="pc-campo__etiqueta pc-elige__etiqueta">Cuándo</legend>
            <div className="pc-cerebro__tipos">
              {CUANDO.map((c) => (
                <button key={c.id} type="button" className="pc-pildora" aria-pressed={forma.tipo === c.id} onClick={() => setForma({ ...forma, tipo: c.id })}>
                  {c.nombre}
                </button>
              ))}
            </div>
          </fieldset>
          {forma.tipo === "semanal" ? (
            <div className="pc-tareas__dias" role="group" aria-label="Qué días">
              {DIAS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="pc-pildora"
                  aria-pressed={forma.dias.includes(d)}
                  aria-label={NOMBRES_DIA[d]}
                  onClick={() => setForma({ ...forma, dias: forma.dias.includes(d) ? forma.dias.filter((x) => x !== d) : [...forma.dias, d] })}
                >
                  {NOMBRES_DIA[d].slice(0, 3)}
                </button>
              ))}
            </div>
          ) : null}
          <div className="pc-elige__par">
            {forma.tipo === "mensual" ? (
              <label className="pc-campo">
                <span className="pc-campo__etiqueta">Qué día del mes</span>
                <select className="pc-campo__entrada" value={forma.dia_mes} onChange={(e) => setForma({ ...forma, dia_mes: Number(e.target.value) })}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      El {d}
                    </option>
                  ))}
                  <option value={-1}>El último día</option>
                </select>
              </label>
            ) : forma.tipo === "una_vez" ? (
              <label className="pc-campo">
                <span className="pc-campo__etiqueta">Qué día</span>
                <input type="date" className="pc-campo__entrada" value={forma.fecha} onChange={(e) => setForma({ ...forma, fecha: e.target.value })} />
              </label>
            ) : null}
            <label className="pc-campo">
              <span className="pc-campo__etiqueta">A qué hora</span>
              <select className="pc-campo__entrada" value={forma.hora} onChange={(e) => setForma({ ...forma, hora: e.target.value })}>
                {HORAS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {vistaPrevia ? <p className="pc-tareas__previa">{vistaPrevia}</p> : null}
          <div className="pc-cerebro__fila pc-cerebro__fila--fin">
            <button type="button" className={claseBoton("fantasma")} onClick={() => setAbierta(false)}>
              Cancelar
            </button>
            <button type="submit" className={claseBoton("principal")} disabled={!forma.que.trim()}>
              Guardar tarea
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className={`${claseBoton("borde")} pc-tareas__nueva`} onClick={() => setAbierta(true)}>
          <Icono nombre="mas" tam={16} />O créala aquí
        </button>
      )}

      {lista === null ? (
        <p className="pc-cerebro__nota">Cargando…</p>
      ) : !lista.length ? (
        <p className="pc-cerebro__vacio">Todavía no hay nada programado. Pídele a Atendel algo que se repita y lo hará solo.</p>
      ) : (
        <ul className="pc-tareas">
          {lista.map((t, i) => (
            <li key={t.id} className="pc-tareas__tarea pc-entra" data-pausada={t.activa ? undefined : ""} style={{ "--d": `${retrasoEscalon(i)}ms` } as CSSProperties}>
              <div className="pc-tareas__cabeza">
                <span className="pc-tareas__icono" aria-hidden="true">
                  <Icono nombre="reloj" tam={18} />
                </span>
                <div className="pc-tareas__textos">
                  <p className="pc-tareas__titulo">{t.titulo}</p>
                  <p className="pc-tareas__cuando">{frecuenciaEnPalabras(t)}</p>
                </div>
                <span className="pc-cerebro__acciones">
                  <button type="button" className={claseBoton("borde", true)} onClick={() => void pausar(t)}>
                    {t.activa ? "Pausar" : t.ultima ? "Reanudar" : "Activar"}
                  </button>
                  <button type="button" className="pc-icono" aria-label="Borrar tarea" title="Borrar" onClick={() => void borrar(t)}>
                    <Icono nombre="basura" tam={15} />
                  </button>
                </span>
              </div>
              <p className="pc-tareas__detalle">
                {t.activa
                  ? t.proxima
                    ? `Próxima vez: ${cuandoEnPalabras(t.proxima, t.zona)}`
                    : "Ya se hizo."
                  : t.ultima
                    ? "En pausa: no se hará hasta que la reanudes."
                    : "Esperando tu OK: tócale «Activar» para que empiece."}
              </p>
              {t.ultima ? (
                <p className="pc-tareas__ultima">
                  Última vez ({cuandoEnPalabras(t.ultima, t.zona)}): {t.ultimo_resultado ?? "hecha."}{" "}
                  <Enlace href={`${base}?vista=oficina`}>Ver en la Oficina</Enlace>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  );
}
