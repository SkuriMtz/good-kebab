import Link from "next/link";
import { BotonTema } from "./BotonTema";
import { Marca } from "./Logo";
import { PAGINAS, PRUEBALO, SEGMENTOS } from "@/lib/contenido";

const titulo = (href: string) => PAGINAS.find((p) => p.href === href)?.label ?? href;

/** Las cuatro columnas del pie, como el pie del sitio de GitHub (solo el estilo). */
const COLUMNAS = [
  {
    titulo: "Producto",
    enlaces: [{ href: "/agentes", label: titulo("/agentes") }, PRUEBALO, { href: "/precios", label: titulo("/precios") }],
  },
  {
    titulo: "Para quién es",
    enlaces: SEGMENTOS.map((s) => ({
      href: `/para-quien-es#${s.id}`,
      label: s.corto,
    })),
  },
  {
    titulo: "Ayuda",
    enlaces: [
      { href: "/preguntas", label: titulo("/preguntas") },
      { href: "/preguntas#seguridad", label: "Tus datos" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
  {
    titulo: "Cuenta",
    enlaces: [
      { href: "/entrar", label: "Entrar" },
      { href: "/panel", label: "Mi panel" },
    ],
  },
];

/** Enlaces de la franja de abajo (los de ayuda y datos, como los legales del pie de GitHub). */
const FRANJA = [
  { href: "/preguntas#seguridad", label: "Tus datos" },
  { href: "/contacto", label: "Contacto" },
];

/**
 * Pie del sitio: arriba, la marca con una línea de qué es Atendel y cuatro
 * columnas de enlaces; abajo, una franja con el logo, el año, los enlaces de
 * ayuda y el selector de tema.
 */
export function Footer() {
  return (
    <footer className="pie-sitio">
      <div className="pie-sitio__arriba">
        <div className="pie-sitio__marca">
          <Link href="/" className="pie-sitio__logo" aria-label="Atendel, inicio">
            <Marca className="pie-sitio__logo-marca" />
            <span aria-hidden="true">Atendel</span>
          </Link>
          <p className="pie-sitio__lema">
            Lola, Clara, Víctor e Iris: cuatro agentes de IA para la recepción y la oficina de tu negocio.
          </p>
          <p className="pie-sitio__sello">Entras con tu correo · sin contraseña</p>
        </div>

        <nav className="pie-sitio__columnas" aria-label="Pie de página">
          {COLUMNAS.map((c) => (
            <div key={c.titulo} className="pie-sitio__columna">
              <h2 className="pie-sitio__titulo" id={`pie-${c.titulo.toLowerCase()}`}>
                {c.titulo}
              </h2>
              <ul className="pie-sitio__lista" aria-labelledby={`pie-${c.titulo.toLowerCase()}`}>
                {c.enlaces.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="pie-sitio__enlace">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="pie-sitio__franja">
        <div className="pie-sitio__franja-fila">
          <div className="pie-sitio__legal">
            <Marca className="pie-sitio__franja-marca" />
            <p className="pie-sitio__derechos">© {new Date().getFullYear()} Atendel</p>
            <ul className="pie-sitio__franja-enlaces" aria-label="Ayuda y datos">
              {FRANJA.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="pie-sitio__enlace pie-sitio__enlace--chico">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <BotonTema variante="selector" />
        </div>
      </div>
    </footer>
  );
}
