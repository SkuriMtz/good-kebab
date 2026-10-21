import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Nav } from "./Nav";
import { FichasAgentes } from "./agentes/FichasAgentes";
import { Escena } from "./escena/Escena";
import { ScrollSuave } from "./escena/ScrollSuave";
import { Escena3D } from "./escena3d/Escena3D";
import { AGENTES_INFO } from "@/lib/agentes";
import { PAGINAS, PRUEBALO } from "@/lib/contenido";

const REPARTO = AGENTES_INFO.map((a) => ({
  id: a.id,
  nombre: a.nombre,
  papel: a.area,
  href: `/agentes?ficha=${a.id}`,
}));

const CUENTA = { href: "/entrar", label: "Entrar" };

/**
 * El marco de cada página pública:
 * - Un enlace para saltar directo al contenido (teclado y lectores de pantalla).
 * - Los fragmentos de fondo, fijos (solo se mueve el contenido) y discretos:
 *   el contenedor les baja la opacidad (lecciones 7, 8, 11 y 13).
 * - La barra, el contenido, el pie y la ficha de los agentes (se abre desde
 *   cualquier página).
 * `fondo="ninguno"`: la página pone su propia escena (el inicio la monta en la portada).
 */
export function Sitio({ children, fondo = "particulas" }: { children: ReactNode; fondo?: "particulas" | "3d" | "ninguno" }) {
  return (
    <div className="sitio">
      <a href="#contenido" className="saltar">
        Saltar al contenido
      </a>
      {fondo === "3d" ? <Escena3D /> : null}
      {fondo === "particulas" ? (
        <div className="sitio__fondo">
          <Escena />
        </div>
      ) : null}
      <ScrollSuave />
      <Nav items={PAGINAS} destacado={PRUEBALO} cuenta={CUENTA} reparto={REPARTO} />
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
