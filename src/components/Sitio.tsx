import Link from "next/link";
import type { ReactNode } from "react";
import { claseBoton } from "./Buttons";
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
 * El marco de cada página pública: la escena de triangulitos al fondo, la
 * barra (con "Pruébalo", el chat, como botón violeta), el pie y la ficha de
 * los agentes, que se puede abrir desde cualquier página.
 * `fondo="ninguno"`: la página pone su propia escena (el inicio la monta en la portada).
 */
export function Sitio({ children, fondo = "particulas" }: { children: ReactNode; fondo?: "particulas" | "3d" | "ninguno" }) {
  return (
    <>
      {fondo === "3d" ? <Escena3D /> : fondo === "particulas" ? <Escena /> : null}
      <ScrollSuave />
      <Nav
        items={PAGINAS}
        destacado={PRUEBALO}
        reparto={REPARTO}
        desktopRight={
          <Link href="/entrar" className="barra__enlace">
            Entrar
          </Link>
        }
        mobileBottom={
          <>
            <Link href="/entrar" className={`${claseBoton("suave", "grande")} w-full`}>
              Empezar gratis
            </Link>
            <Link href="/entrar" className={`${claseBoton("texto", "grande")} w-full`}>
              Entrar
            </Link>
            <p className="t-chico text-center">Entras con tu correo, sin contraseña.</p>
          </>
        }
      />
      <main className="sobre-escena">{children}</main>
      <div className="sobre-escena">
        <Footer />
      </div>
      <FichasAgentes />
    </>
  );
}
