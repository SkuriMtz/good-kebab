"use client";

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import type { Idioma } from "@/i18n";
import { textosCapacidades, type IdCapacidad } from "./capacidades-textos";
import { Etiqueta } from "./Piezas";

/**
 * «Cuatro trabajos. Un solo asistente.» (el inicio, después de la segunda pantalla): las cuatro
 * cosas que hace Atendel como UN asistente, no como cuatro productos.
 * - Arriba, cuatro puntos unidos por una línea por la que corre una luz (es el mismo asistente);
 *   cada punto dice su trabajo en una línea, así se entiende todo sin tocar nada.
 * - Al elegir uno: su explicación, ejemplos concretos y una animación chiquita de cómo se ve
 *   (un chat, interesados con seguimiento, gastos del mes, tareas que se palomean). Lo de la
 *   animación es de ejemplo y lo dice.
 * - Pestañas accesibles (flechas, Inicio y Fin). Sin movimiento si se pide reducirlo.
 */
const ORDEN: IdCapacidad[] = ["clientes", "responde", "costos", "procesos"];
const ICONO: Record<IdCapacidad, NombreIcono> = { clientes: "usuarios", responde: "mensaje", costos: "grafica", procesos: "rayo" };
// Su color (y uno más hondo para el modo claro, para que se lea sobre fondo claro)
const COLOR: Record<IdCapacidad, string> = { clientes: "#f1bc5b", responde: "#3fd6b8", costos: "#916ef8", procesos: "#7fb2ff" };
const COLOR_CLARO: Record<IdCapacidad, string> = { clientes: "#94650a", responde: "#0d7d69", costos: "#6b48e0", procesos: "#2f66c9" };

type T = ReturnType<typeof textosCapacidades>;

function VisClientes({ t }: { t: T }) {
  const v = t.vis.clientes;
  return (
    <ul className="mz-cap-vis mz-cap-vis--clientes">
      {v.filas.map(([nombre, que], i) => (
        <li key={nombre} style={{ "--i": i } as CSSProperties}>
          <span className="mz-cap-vis__inicial">{nombre.charAt(0)}</span>
          <span className="mz-cap-vis__quien">
            <b>{nombre}</b>
            <span>{que}</span>
          </span>
          <span className="mz-cap-vis__estado">
            <span className="mz-cap-vis__antes">{v.pendiente}</span>
            <span className="mz-cap-vis__despues">
              <Icono nombre="check" tam={13} />
              {v.listo}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function VisResponde({ t }: { t: T }) {
  const v = t.vis.responde;
  return (
    <div className="mz-cap-vis mz-cap-vis--responde">
      <span className="mz-cap-vis__canal">{v.canal}</span>
      {v.mensajes.map((m, i) => (
        <p key={m} className={i % 2 ? "mz-cap-vis__burbuja mz-cap-vis__burbuja--atendel" : "mz-cap-vis__burbuja"} style={{ "--i": i } as CSSProperties}>
          {m}
        </p>
      ))}
    </div>
  );
}

const ALTOS = [0.62, 0.9, 0.44, 0.3];

function VisCostos({ t }: { t: T }) {
  const v = t.vis.costos;
  return (
    <div className="mz-cap-vis mz-cap-vis--costos">
      <span className="mz-cap-vis__canal">{v.titulo}</span>
      <div className="mz-cap-vis__barras">
        {v.barras.map((b, i) => (
          <span key={b} className={i === 1 ? "mz-cap-vis__barra mz-cap-vis__barra--sube" : "mz-cap-vis__barra"} style={{ "--i": i, "--alto": ALTOS[i] } as CSSProperties}>
            <i />
            <small>{b}</small>
          </span>
        ))}
      </div>
      <div className="mz-cap-vis__alertas">
        {v.alertas.map((a, i) => (
          <span key={a} style={{ "--i": i } as CSSProperties}>
            <Icono nombre={i ? "facturacion" : "alerta"} tam={14} />
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}

function VisProcesos({ t }: { t: T }) {
  return (
    <ul className="mz-cap-vis mz-cap-vis--procesos">
      {t.vis.procesos.map((p, i) => (
        <li key={p} style={{ "--i": i } as CSSProperties}>
          <span className="mz-cap-vis__check">
            <Icono nombre="check" tam={13} />
          </span>
          {p}
        </li>
      ))}
    </ul>
  );
}

const VISUAL: Record<IdCapacidad, (p: { t: T }) => React.ReactElement> = {
  clientes: VisClientes,
  responde: VisResponde,
  costos: VisCostos,
  procesos: VisProcesos,
};

export function Capacidades({ idioma }: { idioma: Idioma }) {
  const t = textosCapacidades(idioma);
  const [activa, setActiva] = useState<IdCapacidad>("clientes");
  const base = useId();
  const pestanas = useRef<(HTMLButtonElement | null)[]>([]);
  const cap = t.caps[activa];
  const Visual = VISUAL[activa];

  const conTeclado = (e: KeyboardEvent, i: number) => {
    const destino = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % ORDEN.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + ORDEN.length - 1) % ORDEN.length : e.key === "Home" ? 0 : e.key === "End" ? ORDEN.length - 1 : -1;
    if (destino < 0) return;
    e.preventDefault();
    setActiva(ORDEN[destino]);
    pestanas.current[destino]?.focus();
  };

  return (
    <div className="mz-cap">
      <div className="mz-cabeza">
        <Etiqueta>{t.etiqueta}</Etiqueta>
        <h2 id="capacidades-titulo" className="ini-titulo">
          {t.titulo}
        </h2>
      </div>

      <div role="tablist" aria-labelledby="capacidades-titulo" className="mz-cap__riel">
        {ORDEN.map((id, i) => (
          <button
            key={id}
            ref={(el) => {
              pestanas.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-pestana-${id}`}
            aria-selected={activa === id}
            aria-controls={`${base}-panel`}
            tabIndex={activa === id ? 0 : -1}
            className="mz-cap__nodo"
            style={{ "--c": COLOR[id], "--cc": COLOR_CLARO[id] } as CSSProperties}
            onClick={() => setActiva(id)}
            onKeyDown={(e) => conTeclado(e, i)}
          >
            <span className="mz-cap__punto" aria-hidden="true">
              <Icono nombre={ICONO[id]} tam={18} />
            </span>
            <span className="mz-cap__nodo-texto">
              <b>{t.caps[id].titulo}</b>
              <span>{t.caps[id].linea}</span>
            </span>
          </button>
        ))}
      </div>

      <div key={activa} role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-pestana-${activa}`} className="mz-cap__panel" style={{ "--c": COLOR[activa], "--cc": COLOR_CLARO[activa] } as CSSProperties}>
        <div className="mz-cap__texto">
          <h3>{cap.titulo}</h3>
          <p>{cap.linea}</p>
          <ul>
            {cap.ejemplos.map((e, i) => (
              <li key={e} style={{ "--i": i } as CSSProperties}>
                <Icono nombre="check" tam={16} />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mz-cap__visual" aria-hidden="true">
          <Visual t={t} />
          <span className="mz-cap__ejemplo">{t.ejemplo}</span>
        </div>
      </div>

      <p className="mz-cap__confianza">
        <Icono nombre="escudo" tam={16} />
        <span>{t.confianza}</span>
      </p>
    </div>
  );
}
