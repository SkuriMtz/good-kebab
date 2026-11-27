import type { ReactNode } from "react";
import { Barra } from "./Barra";
import { Footer } from "./Footer";
import { FichasAgentes } from "./agentes/FichasAgentes";
import { Escena } from "./escena/Escena";
import { ScrollSuave } from "./escena/ScrollSuave";
import { Escena3D } from "./escena3d/Escena3D";
import { CierreMarca } from "./inicio-dala/CierreMarca";
import { DialogoLista } from "./inicio-dala/DialogoLista";
import { FondoInicio } from "./inicio-dala/FondoInicio";
import { PieDelgado } from "./inicio-dala/PieDelgado";

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
 * - `fondo="inicio"`: el inicio igual a los videos de referencia: el fondo
 *   de figuras que sigue las 8 escenas (FondoInicio), el scroll suave del
 *   video (Lenis lerp 0.08), la barra encima del contenido y el pie delgado.
 * - `cierre`: al final, el cierre del inicio («Deja que Atendel lo haga» y el botón de la
 *   lista, sin la marca de fragmentos) y el pie delgado del inicio, en lugar del pie grande.
 * - `pieDelgado`: solo el pie delgado del inicio, sin el cierre (p. ej., Descargar).
 * El pie siempre llega abajo, aunque la página sea corta. La barra es la
 * misma en todas las páginas públicas y "Únete a la lista" abre la lista de
 * espera ahí mismo (DialogoLista).
 */
export function Sitio({
  children,
  fondo = "particulas",
  cierre = false,
  pieDelgado = false,
}: {
  children: ReactNode;
  fondo?: "particulas" | "3d" | "ninguno" | "figuras" | "inicio";
  cierre?: boolean;
  pieDelgado?: boolean;
}) {
  const inicio = fondo === "inicio";
  return (
    <div className={`sitio sitio--${fondo}${cierre || pieDelgado ? " sitio--con-cierre" : ""}`}>
      {fondo === "3d" ? <Escena3D /> : inicio ? <FondoInicio /> : fondo === "particulas" || fondo === "figuras" ? <Escena sobrio /> : null}
      <ScrollSuave lerp={inicio ? 0.08 : undefined} />
      <Barra inicio={inicio} />
      <main id="contenido" tabIndex={-1} className="sitio__contenido sobre-escena">
        {children}
        {cierre ? <CierreMarca /> : null}
      </main>
      <div className="sobre-escena">{inicio || cierre || pieDelgado ? <PieDelgado /> : <Footer />}</div>
      <FichasAgentes />
      <DialogoLista />
    </div>
  );
}
