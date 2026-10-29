/**
 * Indicador "escribiendo…" compartido (lo pidieron los grupos 1 y 2; estilo
 * en globals.css, ".escribiendo"). Tres puntos de 6px que se encienden en ola
 * (solo opacidad, 1.2 s). Con movimiento reducido siguen, más lentos, porque
 * es información y no adorno.
 *
 * - variante "burbuja": dentro de una burbuja de chat (--radio-burbuja, con la
 *   esquina de abajo a la izquierda en --radio-burbuja-esquina, fondo --c-elevado).
 * - variante "suelto": solo los puntos, del color del texto (en una fila de
 *   lista, en la cabecera de un chat o junto al nombre del agente).
 * - `conTexto`: además, el texto visible ("Lola está escribiendo…").
 *
 * Accesibilidad: role="status" con el texto completo; los puntos van ocultos.
 *
 *   <Escribiendo quien="Lola" variante="burbuja" />
 */
export function Escribiendo({
  quien,
  variante = "suelto",
  conTexto = false,
  className = "",
}: {
  /** Quién escribe (para la lectura y el texto visible). */
  quien?: string;
  variante?: "burbuja" | "suelto";
  conTexto?: boolean;
  className?: string;
}) {
  const texto = quien ? `${quien} está escribiendo…` : "Escribiendo…";
  return (
    <span role="status" aria-label={texto} className={`escribiendo${variante === "burbuja" ? " escribiendo--burbuja" : ""} ${className}`}>
      <span className="escribiendo__puntos" aria-hidden="true">
        <span className="escribiendo__punto" />
        <span className="escribiendo__punto" />
        <span className="escribiendo__punto" />
      </span>
      {conTexto ? (
        <span className="escribiendo__texto" aria-hidden="true">
          {texto}
        </span>
      ) : null}
    </span>
  );
}
