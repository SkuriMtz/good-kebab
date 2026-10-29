import Link from "next/link";
import { BotonTema } from "./BotonTema";
import { Marca } from "./Logo";
import { PRUEBALO } from "@/lib/contenido";
import type { Diccionario } from "@/i18n";
import { textosServidor } from "@/i18n/servidor";

/** Las cuatro columnas del pie, como el pie del sitio de GitHub (solo el estilo). */
function columnas(d: Diccionario) {
  return [
    {
      id: "producto",
      titulo: d.pie.producto,
      enlaces: [
        { href: "/agentes", label: d.pie.agentes },
        { href: PRUEBALO.href, label: d.pie.pruebalo },
        { href: "/precios", label: d.pie.precios },
      ],
    },
    {
      id: "para-quien",
      titulo: d.pie.paraQuien,
      enlaces: d.paraQuien.segmentos.map((s) => ({ href: `/para-quien-es#${s.id}`, label: s.corto })),
    },
    {
      id: "ayuda",
      titulo: d.pie.ayuda,
      enlaces: [
        { href: "/preguntas", label: d.pie.preguntas },
        { href: "/preguntas#seguridad", label: d.pie.tusDatos },
        { href: "/contacto", label: d.pie.contacto },
      ],
    },
    {
      id: "cuenta",
      titulo: d.pie.cuenta,
      enlaces: [
        { href: "/entrar", label: d.pie.entrar },
        { href: "/panel", label: d.pie.miPanel },
      ],
    },
  ];
}

/**
 * Pie del sitio: arriba, la marca con una línea de qué es Atendel y cuatro
 * columnas de enlaces; abajo, una franja con el logo, el año, los enlaces de
 * ayuda y el selector de tema.
 */
export function Footer() {
  const d = textosServidor();
  const FRANJA = [
    { href: "/preguntas#seguridad", label: d.pie.tusDatos },
    { href: "/contacto", label: d.pie.contacto },
  ];
  return (
    <footer className="pie-sitio">
      <div className="pie-sitio__arriba">
        <div className="pie-sitio__marca">
          <Link href="/" className="pie-sitio__logo" aria-label={d.barra.inicio}>
            <Marca className="pie-sitio__logo-marca" />
            <span aria-hidden="true">Atendel</span>
          </Link>
          <p className="pie-sitio__lema">{d.pie.lema}</p>
          <p className="pie-sitio__sello">{d.pie.sello}</p>
        </div>

        <nav className="pie-sitio__columnas" aria-label={d.pie.aria}>
          {columnas(d).map((c) => (
            <div key={c.id} className="pie-sitio__columna">
              <h2 className="pie-sitio__titulo" id={`pie-${c.id}`}>
                {c.titulo}
              </h2>
              <ul className="pie-sitio__lista" aria-labelledby={`pie-${c.id}`}>
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
            <ul className="pie-sitio__franja-enlaces" aria-label={d.pie.franja}>
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
