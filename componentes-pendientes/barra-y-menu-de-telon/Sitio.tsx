import Link from "next/link";
import type { ReactNode } from "react";
import { PillLink, Roll } from "./Buttons";
import { Footer } from "./Footer";
import { MenuLateral } from "./MenuLateral";
import { Nav } from "./Nav";
import { FichasAgentes } from "./agentes/FichasAgentes";
import { AGENTES_INFO } from "@/lib/agentes";
import { PAGINAS, PRUEBALO } from "@/lib/contenido";

const REPARTO = AGENTES_INFO.map((a) => ({ nombre: a.nombre, papel: a.area, href: `/agentes?ficha=${a.id}` }));

/**
 * El marco de cada página pública: barra (con "Pruébalo" destacado), menú
 * lateral, pie y la ficha de los agentes (que se puede abrir desde el menú
 * en cualquier página). La página de agentes trae su propia ficha.
 */
export function Sitio({ children, fichas = true }: { children: ReactNode; fichas?: boolean }) {
  return (
    <>
      <Nav
        items={PAGINAS}
        destacado={PRUEBALO}
        reparto={REPARTO}
        menuLateral
        desktopRight={
          <>
            <Link href="/entrar" className="btn-ghost !text-bone">
              <Roll>Entrar</Roll>
            </Link>
            <PillLink href="/entrar" className="btn-pill--chica btn-pill--suave hidden xl:inline-flex" arrow={false}>
              Empezar gratis
            </PillLink>
          </>
        }
        mobileBottom={
          <div className="flex flex-col items-start gap-3">
            <PillLink href="/entrar">Empezar gratis</PillLink>
            <p className="text-[0.875rem] text-ash">Entras con tu correo, sin contraseña.</p>
          </div>
        }
      />
      <main>{children}</main>
      <Footer />
      <MenuLateral />
      {fichas ? <FichasAgentes /> : null}
    </>
  );
}
