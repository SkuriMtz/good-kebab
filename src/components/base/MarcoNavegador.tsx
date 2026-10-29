import { useId, type KeyboardEvent, type ReactNode } from "react";
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
 * que cambien algo, pasa `alElegir` y se vuelven botones (role="tab"); el
 * cuerpo pasa a ser su role="tabpanel" (con aria-controls / aria-labelledby),
 * y las flechas ← →, Inicio y Fin recorren las pestañas.
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
  const base = useId().replace(/:/g, "");
  const idCuerpo = `${base}-cuerpo`;
  const idPestana = (p: PestanaMarco, i: number) => `${base}-pestana-${p.id ?? i}`;
  const activa = pestanas.findIndex((p) => p.activa);

  // Flechas, Inicio y Fin entre pestañas (el foco y la elección se mueven juntos)
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const conId = pestanas.filter((p) => p.id);
    const i = conId.findIndex((p) => p.activa);
    let destino: PestanaMarco | undefined;
    if (e.key === "ArrowRight") destino = conId[(i + 1) % conId.length];
    else if (e.key === "ArrowLeft") destino = conId[(i - 1 + conId.length) % conId.length];
    else if (e.key === "Home") destino = conId[0];
    else if (e.key === "End") destino = conId[conId.length - 1];
    if (!destino?.id) return;
    e.preventDefault();
    alElegir?.(destino.id);
    const indice = pestanas.indexOf(destino);
    requestAnimationFrame(() => document.getElementById(idPestana(destino!, indice))?.focus());
  };

  return (
    <figure className={`marco ${className}`} aria-label={titulo}>
      <div className="marco__barra">
        <div className="marco__puntos" aria-hidden="true">
          <span className="marco__punto" />
          <span className="marco__punto" />
          <span className="marco__punto" />
        </div>
        {pestanas.length ? (
          <div
            className="marco__pestanas"
            role={interactivas ? "tablist" : undefined}
            aria-label={interactivas ? titulo : undefined}
            onKeyDown={interactivas ? alTeclear : undefined}
          >
            {pestanas.map((p, i) =>
              interactivas ? (
                <button
                  key={p.id ?? i}
                  id={idPestana(p, i)}
                  type="button"
                  role="tab"
                  aria-selected={Boolean(p.activa)}
                  aria-controls={p.activa ? idCuerpo : undefined}
                  tabIndex={p.activa || (activa === -1 && i === 0) ? 0 : -1}
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
      <div
        className={`marco__cuerpo${relleno ? " marco__cuerpo--relleno" : ""} ${classNameCuerpo}`}
        {...(interactivas
          ? {
              id: idCuerpo,
              role: "tabpanel",
              "aria-labelledby": activa >= 0 ? idPestana(pestanas[activa], activa) : undefined,
            }
          : {})}
      >
        {children}
      </div>
    </figure>
  );
}
