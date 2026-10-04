import Link from "next/link";
import { PAGINAS, PRUEBALO } from "@/lib/contenido";

const CENTRO = [...PAGINAS.slice(1), PRUEBALO, { href: "/preguntas#seguridad", label: "Tus datos" }];
const DERECHA = [
  { href: "/entrar", label: "Entrar" },
  { href: "/panel/chat", label: "Mi panel" },
];

/** Pie delgado, como el de Dala: una línea fina arriba; a la izquierda los derechos, al centro las páginas y a la derecha la cuenta. */
export function Footer() {
  return (
    <footer className="pie">
      <p className="pie__derechos">© {new Date().getFullYear()} Atendel. Todos los derechos reservados.</p>
      <nav aria-label="Páginas" className="pie__centro">
        {CENTRO.map((l) => (
          <Link key={l.href} href={l.href} className="pie__enlace">
            {l.label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Cuenta" className="pie__derecha">
        {DERECHA.map((l) => (
          <Link key={l.href} href={l.href} className="pie__enlace">
            {l.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
