import type { ReactNode } from "react";
import { Icono } from "./Iconos";

/**
 * Ventana tipo navegador para mostrar el producto (la prueba principal,
 * como el editor en GitHub): tres puntos de color (los colores de Lola,
 * Iris y Víctor), barra de pestañas con la activa resaltada, barra de
 * dirección opcional y el contenido dentro.
 * Radio 8px por fuera; los paneles internos usan la clase "marco__panel" (6px).
 * Superficies #0d1117 / #151a22 y bordes #21262d (en claro, valores de Primer).
 *
 * Las pestañas de la barra son decorativas por defecto (texto). Si necesitas
 * que cambien algo, pasa `alElegir` y se vuelven botones (role="tab").
 */

export type PestanaMarco = { id?: string; etiqueta: ReactNode; adorno?: ReactNode; activa?: boolean };

export function MarcoNavegador({
  pestanas = [],
  direccion,
  titulo,
  relleno = false,
  alElegir,
  className = "",
  classNameCuerpo = "",
  children,
}: {
  pestanas?: PestanaMarco[];
  /** Texto de la barra de dirección (ej. "atendel.mx/panel/chat"). Sin él, no hay barra. */
  direccion?: string;
  /** Nombre del marco para lectores de pantalla (ej. "Vista del chat de Atendel"). */
  titulo?: string;
  /** Padding interno de 16px (24px desde 640px). */
  relleno?: boolean;
  alElegir?: (id: string) => void;
  className?: string;
  classNameCuerpo?: string;
  children: ReactNode;
}) {
  const interactivas = Boolean(alElegir);
  return (
    <figure className={`marco ${className}`} aria-label={titulo}>
      <div className="marco__barra">
        <div className="marco__puntos" aria-hidden="true">
          <span className="marco__punto" />
          <span className="marco__punto" />
          <span className="marco__punto" />
        </div>
        {pestanas.length ? (
          <div className="marco__pestanas" role={interactivas ? "tablist" : undefined} aria-label={interactivas ? titulo : undefined}>
            {pestanas.map((p, i) =>
              interactivas ? (
                <button
                  key={p.id ?? i}
                  type="button"
                  role="tab"
                  aria-selected={Boolean(p.activa)}
                  className="marco__pestana"
                  onClick={() => p.id && alElegir?.(p.id)}
                >
                  {p.adorno ? <span className="marco__pestana-adorno">{p.adorno}</span> : null}
                  {p.etiqueta}
                </button>
              ) : (
                <span key={p.id ?? i} className="marco__pestana" data-activa={p.activa ? "true" : undefined}>
                  {p.adorno ? <span className="marco__pestana-adorno">{p.adorno}</span> : null}
                  {p.etiqueta}
                </span>
              ),
            )}
          </div>
        ) : null}
      </div>
      {direccion ? (
        <div className="marco__direccion" aria-hidden="true">
          <span className="marco__url">
            <Icono nombre="candado" tam={12} />
            {direccion}
          </span>
        </div>
      ) : null}
      <div className={`marco__cuerpo${relleno ? " marco__cuerpo--relleno" : ""} ${classNameCuerpo}`}>{children}</div>
    </figure>
  );
}
