import Link from "next/link";
import { Logo } from "./Logo";

const PRODUCTO = [
  { href: "/#agentes", label: "Agentes" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#seguridad", label: "Seguridad" },
];
const CUENTA = [
  { href: "/entrar", label: "Entrar" },
  { href: "/panel", label: "Mi panel" },
];

export function Footer() {
  return (
    <footer className="mx-auto max-w-page px-6 pb-12 pt-[96px] lg:px-10 lg:pt-[140px]">
      <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-[320px] text-body text-ash">
            Agentes de inteligencia artificial para negocios que atienden personas.
          </p>
        </div>
        {[
          { titulo: "Producto", links: PRODUCTO },
          { titulo: "Cuenta", links: CUENTA },
        ].map((grupo) => (
          <nav key={grupo.titulo} aria-label={grupo.titulo}>
            <p className="text-caption font-semibold uppercase tracking-[0.08em] text-saffron">{grupo.titulo}</p>
            <ul className="mt-3">
              {grupo.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="btn-ghost">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mt-[60px] text-caption text-ash">© {new Date().getFullYear()} Atendel</p>
    </footer>
  );
}
