import { useId, type CSSProperties, type ReactNode } from "react";

/**
 * Barra de progreso (estilo en globals.css, ".progreso"): para el uso del
 * plan ("Mensajes de octubre · 320 de 500"). Pista de 6px redonda en
 * --c-activo; el relleno es azul de acción (texto) y se corre de lado con
 * transform (0.4s), sin deformar la punta.
 * Cambia de tono solo: ámbar desde `umbralAtencion` (80%) y rojo al llegar
 * al tope (`umbralError`, 100%). El color nunca va solo: pon `detalle`
 * ("Te quedan 20 mensajes este mes").
 *
 * Accesible: role="progressbar" con aria-valuenow/min/max y aria-valuetext
 * ("320 de 500 mensajes"), nombrado por la etiqueta visible.
 *
 *   <BarraProgreso etiqueta="Mensajes de octubre" valor={320} max={500} unidad="mensajes" />
 */
export function BarraProgreso({
  etiqueta,
  valor,
  max = 100,
  unidad,
  mostrarValor = true,
  ocultarEtiqueta = false,
  detalle,
  umbralAtencion = 0.8,
  umbralError = 1,
  className = "",
}: {
  /** Qué se mide (visible arriba a la izquierda y nombre accesible). */
  etiqueta: string;
  valor: number;
  max?: number;
  /** "mensajes", "citas"… se usa en la lectura y en el valor visible. */
  unidad?: string;
  /** "320 / 500" a la derecha. */
  mostrarValor?: boolean;
  /** La etiqueta solo para lectores de pantalla (cuando ya hay un título cerca). */
  ocultarEtiqueta?: boolean;
  /** Una línea debajo (ej. "Se renueva el 1 de noviembre"). */
  detalle?: ReactNode;
  umbralAtencion?: number;
  umbralError?: number;
  className?: string;
}) {
  const idEtiqueta = `${useId().replace(/:/g, "")}-etiqueta`;
  const tope = max > 0 ? max : 1;
  const fraccion = Math.min(1, Math.max(0, valor / tope));
  const proporcion = valor / tope;
  const tono = proporcion >= umbralError ? "progreso--error" : proporcion >= umbralAtencion ? "progreso--atencion" : "";
  const formato = new Intl.NumberFormat("es-MX");
  const textoValor = `${formato.format(valor)} de ${formato.format(max)}${unidad ? ` ${unidad}` : ""}`;

  return (
    <div className={`progreso ${tono} ${className}`}>
      <div className={ocultarEtiqueta && !mostrarValor ? "sr-only" : "progreso__cabeza"}>
        <span id={idEtiqueta} className={ocultarEtiqueta ? "sr-only" : "progreso__etiqueta"}>
          {etiqueta}
        </span>
        {mostrarValor ? (
          <span className="progreso__valor" aria-hidden="true">
            {formato.format(valor)} / {formato.format(max)}
          </span>
        ) : null}
      </div>
      <div
        className="progreso__pista"
        role="progressbar"
        aria-labelledby={idEtiqueta}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(valor, max)}
        aria-valuetext={textoValor}
      >
        <span className="progreso__relleno" style={{ "--progreso": fraccion } as CSSProperties} />
      </div>
      {detalle ? <p className="progreso__detalle">{detalle}</p> : null}
    </div>
  );
}
