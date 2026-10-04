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

/** Pie: la marca y, en columnas, las páginas, los agentes y la cuenta. Sin líneas: solo aire. */
export function Footer() {
  return (
    <footer className="contenedor pb-[var(--spacing-36)] pt-[var(--spacing-60)] lg:pt-[var(--spacing-96)]">
      <div className="grid grid-cols-2 gap-x-[var(--spacing-24)] gap-y-[var(--spacing-36)] md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="t-chico mt-[var(--spacing-18)] max-w-[300px]">
            Agentes de inteligencia artificial para negocios que atienden personas: clínicas, consultorios y estéticas.
          </p>
        </div>
        <nav aria-label="Producto">
          <p className="pie__titulo">Producto</p>
          <ul className="mt-[var(--spacing-12)]">
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
          <ul className="mt-[var(--spacing-12)]">
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
          <ul className="mt-[var(--spacing-12)]">
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
      <div className="mt-[var(--spacing-60)] flex flex-wrap items-center justify-between gap-x-[var(--spacing-24)] gap-y-1">
        <p className="t-caption">© {new Date().getFullYear()} Atendel</p>
        <p className="t-caption">Agentes de IA · México</p>
      </div>
    </footer>
  );
}
