import Link from "next/link";
import { PAGINAS, PRUEBALO } from "@/lib/contenido";

const PRODUCTO = [PAGINAS[0], PRUEBALO, ...PAGINAS.slice(1)];
const CUENTA = [
  { href: "/entrar", label: "Entrar" },
  { href: "/panel/chat", label: "Mi panel" },
];

/** Pie mínimo: una raya punteada, columnas en mayúsculas y el nombre gigante en color corcho. */
export function Footer() {
  return (
    <footer className="overflow-hidden border-t border-dashed hairline">
      <div className="grid gap-10 px-[var(--orilla)] pb-10 pt-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <p className="cuerpo max-w-[460px] !text-[clamp(1.0625rem,1.4vw,1.375rem)]">
          Agentes de inteligencia artificial para negocios que atienden personas: clínicas, consultorios y estéticas.
        </p>
        {[
          { titulo: "Producto", links: PRODUCTO },
          { titulo: "Cuenta", links: CUENTA },
        ].map((grupo) => (
          <nav key={grupo.titulo} aria-label={grupo.titulo}>
            <p className="etiqueta etiqueta--brasa">{grupo.titulo}</p>
            <ul className="mt-3">
              {grupo.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="btn-ghost !min-h-[36px] !text-[0.75rem]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-dashed hairline px-[var(--orilla)] py-4">
        <span className="etiqueta etiqueta--suave">© {new Date().getFullYear()} Atendel</span>
        <span className="etiqueta etiqueta--suave">Agentes de IA · México</span>
      </div>
      <p className="pie-palabra pointer-events-none select-none px-[var(--orilla)] pt-6" aria-hidden="true">
        Atendel
      </p>
    </footer>
  );
}
