import type { ReactNode } from "react";

/**
 * Insignia del dashboard: contadores y etiquetas de estado (estilo en
 * globals.css, ".insignia"). Píldora de 20px, 12px/500, números tabulares.
 *
 * Tonos (los de estado solo en insignias pequeñas y puntos, como pide la guía):
 * - "neutra"   gris (cuenta de elementos, "Borrador")
 * - "azul"     acción/información ("Nuevo", "3 sin leer")
 * - "exito"    verde ("Conectado", "Enviado")
 * - "atencion" ámbar ("Espera tu visto bueno")
 * - "error"    rojo ("Falló el envío")
 * - "pronto"   contorno sin relleno: lo que todavía no existe ("Pronto").
 *              Úsala en vez de inventar una función.
 *
 * Variantes:
 * - `contador={n}`: número (con `max`, "99+"). Redondo si es de un dígito.
 * - `solida`: relleno azul con texto blanco (el contador que pide atención).
 * - `punto`: solo un punto de 8px, sin texto ("hay algo nuevo").
 * - `conPunto`: un punto de su color antes del texto (estados).
 * - `sobre`: va encima de un botón de ícono (esquina superior derecha, con
 *   anillo del color del fondo; cambia el anillo con style={{"--anillo": …}}).
 *
 * Accesibilidad: si la insignia sola no se entiende ("3"), pasa `etiqueta`
 * ("3 avisos sin leer"): se lee eso en vez del número. Si ya la explica el
 * botón donde está (BotonIcono lo hace), se oculta a los lectores (`oculta`).
 */

export type TonoInsignia = "neutra" | "azul" | "exito" | "atencion" | "error" | "pronto";

// Clases completas para que Tailwind no las descarte al compilar
const TONO: Record<TonoInsignia, string> = {
  neutra: "",
  azul: "insignia--azul",
  exito: "insignia--exito",
  atencion: "insignia--atencion",
  error: "insignia--error",
  pronto: "insignia--pronto",
};

export function Insignia({
  tono,
  contador,
  max = 99,
  solida = false,
  punto = false,
  conPunto = false,
  sobre = false,
  etiqueta,
  oculta,
  className = "",
  children,
}: {
  tono?: TonoInsignia;
  contador?: number;
  /** Tope del contador; arriba de eso se pinta "99+". */
  max?: number;
  solida?: boolean;
  punto?: boolean;
  conPunto?: boolean;
  sobre?: boolean;
  /** Cómo se lee (ej. "3 avisos sin leer", "Estado: conectado"). */
  etiqueta?: string;
  /** Escondida para lectores de pantalla (cuando el contexto ya la dice). Por defecto, sí si va `sobre`. */
  oculta?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const esContador = typeof contador === "number";
  const tonoFinal: TonoInsignia = tono ?? (punto ? "azul" : "neutra");
  const clases = [
    "insignia",
    TONO[tonoFinal],
    esContador ? "insignia--contador" : "",
    solida ? "insignia--solida" : "",
    punto ? "insignia--punto" : "",
    sobre ? "insignia--sobre" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const esconder = oculta ?? sobre;
  const texto = punto ? null : esContador ? (contador > max ? `${max}+` : String(contador)) : children;

  return (
    <span className={clases} aria-hidden={esconder || undefined}>
      {conPunto && !punto ? <span className="insignia__punto" aria-hidden="true" /> : null}
      {etiqueta && !esconder ? (
        <>
          <span aria-hidden="true">{texto}</span>
          <span className="sr-only">{etiqueta}</span>
        </>
      ) : (
        texto
      )}
    </span>
  );
}
