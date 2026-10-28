import Link from "next/link";
import { BotonTema } from "@/components/BotonTema";

const ENLACES = [
  { href: "/agentes", texto: "Agentes" },
  { href: "/precios", texto: "Precios" },
  { href: "/preguntas", texto: "Preguntas" },
  { href: "/contacto", texto: "Contacto" },
  { href: "/entrar", texto: "Entrar" },
];

/**
 * El pie delgado del inicio, como el del video: una línea casi invisible
 * arriba, el aviso a la izquierda, los enlaces en mayúsculas al centro y,
 * en lugar de redes sociales, el botón del tema a la derecha.
 */
export function PieDelgado() {
  return (
    <footer className="pie-delgado">
      <p className="pie-delgado__aviso">© Atendel</p>
      <nav aria-label="Pie de página" className="pie-delgado__nav">
        <ul className="pie-delgado__lista">
          {ENLACES.map((e) => (
            <li key={e.href}>
              <Link href={e.href} className="pie-delgado__enlace">
                {e.texto}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <BotonTema className="pie-delgado__tema" />
    </footer>
  );
}
