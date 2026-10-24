/**
 * Punto de estado (estilo en globals.css, ".punto-estado"): un círculo de
 * 8px (10px en "grande") del color del estado, con texto opcional al lado.
 * Los colores de estado solo van en puntos e insignias pequeñas.
 *
 * Tonos:
 * - "exito"    verde: activo, conectado, en línea
 * - "azul"     azul: trabajando ahora (con `pulso`, late despacio)
 * - "atencion" ámbar: espera tu visto bueno, en pausa por límite
 * - "error"    rojo: con un problema, sin conexión
 * - "neutro"   gris: pausado, apagado, todavía sin conectar
 *
 * Accesibilidad: el color nunca va solo. Con `mostrarEtiqueta` se ve el texto;
 * sin él, el texto queda para lectores de pantalla. Sobre un avatar usa
 * `sobre` (anillo del color del fondo; cámbialo con style={{"--anillo": …}}).
 *
 *   <PuntoEstado tono="exito" etiqueta="Activa" mostrarEtiqueta />
 */

export type TonoEstado = "exito" | "azul" | "atencion" | "error" | "neutro";

// Clases completas para que Tailwind no las descarte al compilar
const TONO: Record<TonoEstado, string> = {
  exito: "punto-estado--exito",
  azul: "punto-estado--azul",
  atencion: "punto-estado--atencion",
  error: "punto-estado--error",
  neutro: "punto-estado--neutro",
};

export function PuntoEstado({
  tono = "neutro",
  etiqueta,
  mostrarEtiqueta = false,
  pulso = false,
  grande = false,
  sobre = false,
  className = "",
}: {
  tono?: TonoEstado;
  /** Qué significa el color ("Activa", "Espera tu visto bueno"). */
  etiqueta?: string;
  mostrarEtiqueta?: boolean;
  /** Late despacio (solo opacidad) para "trabajando ahora". */
  pulso?: boolean;
  grande?: boolean;
  /** Encima de un avatar o ícono, con anillo del color del fondo. */
  sobre?: boolean;
  className?: string;
}) {
  const clases = [
    "punto-estado",
    TONO[tono],
    pulso ? "punto-estado--pulso" : "",
    grande ? "punto-estado--grande" : "",
    sobre ? "punto-estado--sobre" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={clases}>
      <span className="punto-estado__punto" aria-hidden="true" />
      {etiqueta ? mostrarEtiqueta ? <span className="punto-estado__texto">{etiqueta}</span> : <span className="sr-only">{etiqueta}</span> : null}
    </span>
  );
}
