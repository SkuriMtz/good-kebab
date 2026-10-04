import Link from "next/link";
import { Logo } from "./Logo";
import { EnlaceFicha } from "./agentes/BotonFicha";
import { AGENTES_INFO } from "@/lib/agentes";
import { PAGINAS, PRUEBALO } from "@/lib/contenido";

const PRODUCTO = [PAGINAS[0], PRUEBALO, ...PAGINAS.slice(1)];
const CUENTA = [
  { href: "/entrar", label: "Entrar" },
  { href: "/panel/chat", label: "Mi panel" },
  { href: "/#seguridad", label: "Tus datos y seguridad" },
];

/** Pie: la marca y, en columnas, las páginas, los agentes y la cuenta. */
export function Footer() {
  return (
    <footer className="pie">
      <div className="contenedor grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr] lg:py-16">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="t-chico mt-4 max-w-[300px]">
            Agentes de inteligencia artificial para negocios que atienden personas: clínicas, consultorios y estéticas.
          </p>
        </div>
        <nav aria-label="Producto">
          <p className="pie__titulo">Producto</p>
          <ul className="mt-2">
            {PRODUCTO.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="pie__enlace">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Los agentes">
          <p className="pie__titulo">Los agentes</p>
          <ul className="mt-2">
            {AGENTES_INFO.map((a) => (
              <li key={a.id}>
                <EnlaceFicha agente={a.id} className="pie__enlace">
                  {a.nombre} · {a.area}
                </EnlaceFicha>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Cuenta">
          <p className="pie__titulo">Cuenta</p>
          <ul className="mt-2">
            {CUENTA.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="pie__enlace">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-[var(--linea)]">
        <div className="contenedor flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-6">
          <p className="t-chico">© {new Date().getFullYear()} Atendel</p>
          <p className="t-chico">Agentes de IA · México</p>
        </div>
      </div>
    </footer>
  );
}
