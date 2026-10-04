import Link from "next/link";
import { PAGINAS, PRUEBALO } from "@/lib/contenido";

const PRODUCTO = [PAGINAS[0], PRUEBALO, ...PAGINAS.slice(1)];
const CUENTA = [
  { href: "/entrar", label: "Entrar" },
  { href: "/panel/chat", label: "Mi panel" },
];

/** Pie: el nombre gigante y muy tenue, y debajo las columnas de enlaces. */
export function Footer() {
  return (
    <footer className="mt-[120px] overflow-hidden lg:mt-[176px]">
      <p
        className="pointer-events-none select-none text-center text-[26vw] font-semibold leading-[0.8] tracking-[-0.075em] text-bone/[0.07]"
        aria-hidden="true"
      >
        atendel
      </p>
      <div className="mx-auto mt-10 max-w-[calc(var(--ancho)+3rem)] px-6 pb-10 sm:max-w-[calc(var(--ancho)+5rem)] sm:px-10 lg:mt-14 lg:max-w-[calc(var(--ancho)+8rem)] lg:px-16">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <p className="texto-suave max-w-[340px]">
            Agentes de inteligencia artificial para negocios que atienden personas: clínicas, consultorios y estéticas.
          </p>
          {[
            { titulo: "Producto", links: PRODUCTO },
            { titulo: "Cuenta", links: CUENTA },
          ].map((grupo) => (
            <nav key={grupo.titulo} aria-label={grupo.titulo}>
              <p className="text-[0.8125rem] font-medium text-bone">{grupo.titulo}</p>
              <ul className="mt-2">
                {grupo.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="btn-ghost !min-h-[38px] !text-[0.875rem]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-16 flex items-center justify-between text-[0.8125rem] text-ash">
          <span>© {new Date().getFullYear()} Atendel</span>
          <span>Agentes de IA</span>
        </div>
      </div>
    </footer>
  );
}
