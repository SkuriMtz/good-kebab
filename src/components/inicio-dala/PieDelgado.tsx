import Link from "next/link";
import { BotonTema } from "@/components/BotonTema";
import { textosServidor } from "@/i18n/servidor";
import { legalesCompletos } from "@/lib/legal";

const ENLACES = [
  { href: "/agentes", id: "agentes" },
  { href: "/precios", id: "precios" },
  { href: "/preguntas", id: "preguntas" },
  { href: "/contacto", id: "contacto" },
  { href: "/entrar", id: "entrar" },
] as const;

const ENLACES_LEGALES = [
  { href: "/privacidad", id: "privacidad" },
  { href: "/terminos", id: "terminos" },
] as const;

/**
 * El pie delgado del inicio, como el del video: una línea casi invisible
 * arriba, el aviso a la izquierda, los enlaces en mayúsculas al centro y,
 * en lugar de redes sociales, el botón del tema a la derecha.
 */
export async function PieDelgado() {
  const d = await textosServidor();
  const enlaces = legalesCompletos() ? [...ENLACES, ...ENLACES_LEGALES] : ENLACES;
  return (
    <footer className="pie-delgado">
      <p className="pie-delgado__aviso">© Atendel</p>
      <nav aria-label={d.pie.aria} className="pie-delgado__nav">
        <ul className="pie-delgado__lista">
          {enlaces.map((e) => (
            <li key={e.href}>
              <Link href={e.href} className="pie-delgado__enlace">
                {d.pie[e.id]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <BotonTema className="pie-delgado__tema" />
    </footer>
  );
}
