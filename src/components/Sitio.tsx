import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Nav } from "./Nav";
import { FichasAgentes } from "./agentes/FichasAgentes";
import { Escena } from "./escena/Escena";
import { ScrollSuave } from "./escena/ScrollSuave";
import { Escena3D } from "./escena3d/Escena3D";

/**
 * El marco de cada página pública: los fragmentos de fondo (fijos: solo se
 * mueve el contenido), la barra, el contenido, el pie y las fichas de los
 * agentes, que se pueden abrir desde cualquier página.
 * - `fondo="particulas"` (por defecto): la escena de triangulitos, sobria y
 *   discreta (opacidad baja y casi invisible detrás del texto, lecciones 7, 11 y 13).
 * - `fondo="3d"`: la escena 3D completa (la historia de /vista-3d).
 * - `fondo="ninguno"`: la página pone su propia escena.
 * - `fondo="figuras"`: el inicio por escenas (como la versión 7): la figura
 *   de triangulitos cambia de forma según la sección (data-escena), en su
 *   versión sobria.
 * El pie siempre llega abajo, aunque la página sea corta.
 */
export function Sitio({ children, fondo = "particulas" }: { children: ReactNode; fondo?: "particulas" | "3d" | "ninguno" | "figuras" }) {
  return (
    <div className={`sitio sitio--${fondo}`}>
      {fondo === "3d" ? <Escena3D /> : fondo === "particulas" || fondo === "figuras" ? <Escena sobrio /> : null}
      <ScrollSuave />
      <Nav />
      <main id="contenido" tabIndex={-1} className="sitio__contenido sobre-escena">
        {children}
      </main>
      <div className="sobre-escena">
        <Footer />
      </div>
      <FichasAgentes />
    </div>
  );
}
