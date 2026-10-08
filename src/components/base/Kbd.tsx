import type { ReactNode } from "react";

/**
 * Una tecla del teclado (estilo en globals.css, ".kbd"): Mona Sans Mono 12px,
 * 20px de alto, borde de 1px con el filo de abajo marcado, radio 6px.
 * Se usa para atajos: "/" para buscar, "Esc" para cerrar, "⌘ K".
 *
 *   <Kbd>/</Kbd>
 *   <Kbd teclas={["Ctrl", "K"]} />   → dos teclas juntas
 *
 * En pantallas táctiles no hay teclado: no muestres atajos ahí (el buscador
 * ya los esconde con (pointer: coarse)).
 */
export function Kbd({ teclas, children, className = "" }: { teclas?: string[]; children?: ReactNode; className?: string }) {
  if (teclas?.length) {
    return (
      <kbd className={`kbd-grupo ${className}`}>
        {teclas.map((t, i) => (
          <kbd key={`${t}-${i}`} className="kbd">
            {t}
          </kbd>
        ))}
      </kbd>
    );
  }
  return <kbd className={`kbd ${className}`}>{children}</kbd>;
}
