"use client";

import { useState } from "react";
import { enTransicion } from "@/lib/transiciones";

/**
 * Se vuelve a montar en cada cambio de página.
 * - Con View Transitions, la transición la hace el navegador
 *   (src/lib/transiciones.ts): aquí no se anima nada, para no repetirla.
 * - Sin ellas (navegadores viejos) o al abrir la página, el contenido entra
 *   con el fundido de respaldo (.page-enter, src/estilos/transiciones.css).
 * Se decide al montar: si se quitara la clase después, la animación
 * arrancaría tarde.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const [conTransicion] = useState(enTransicion);
  return <div className={conTransicion ? "overflow-x-clip" : "page-enter overflow-x-clip"}>{children}</div>;
}
