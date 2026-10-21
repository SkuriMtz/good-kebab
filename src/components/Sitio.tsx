import Link from "next/link";
import type { ReactNode } from "react";
import { SincronizarTema } from "./BotonTema";
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
  papel: `${a.area} · ${a.abarca}`,
  href: `/agentes?ficha=${a.id}`,
}));

/**
 * El marco de cada página pública, con el mismo lenguaje que el dashboard:
 * - Al fondo, los fragmentos (partículas) fijos y discretos: se quedan en
 *   las orillas y se apagan detrás del texto (lecciones 7, 8, 11 y 13).
 * - La barra (logo con la sección, buscador "/", botones de ícono con
 *   borde), el contenido y el pie, que siempre queda abajo aunque la página
 *   sea corta.
 * - La ficha de los agentes, que se puede abrir desde cualquier página.
 * `fondo="ninguno"`: la página pone su propia escena (el inicio la monta en la portada).
 */
export function Sitio({ children, fondo = "particulas" }: { children: ReactNode; fondo?: "particulas" | "3d" | "ninguno" }) {
  return (
    <>
      {fondo === "3d" ? (
        <Escena3D />
      ) : fondo === "particulas" ? (
        <div className="sitio__fondo" aria-hidden="true">
          <Escena />
        </div>
      ) : null}
      <ScrollSuave />
      <SincronizarTema />
      <div className="sitio">
        <a href="#contenido" className="sitio__saltar">
          Saltar al contenido
        </a>
        <Nav
          items={PAGINAS}
          destacado={PRUEBALO}
          reparto={REPARTO}
          buscar
          mobileBottom={
            <>
              <Link href="/entrar" className="boton boton--sutil boton--grande boton--bloque">
                Empezar gratis
              </Link>
              <Link href="/entrar" className="boton boton--fantasma boton--grande boton--bloque">
                Entrar
              </Link>
              <p className="menu-sitio__nota">Entras con tu correo, sin contraseña. El plan Free no pide tarjeta.</p>
            </>
          }
        />
        <main id="contenido" tabIndex={-1} className="sobre-escena sitio__principal">
          {children}
        </main>
        <div className="sobre-escena">
          <Footer />
        </div>
      </div>
      <FichasAgentes />
    </>
  );
}
