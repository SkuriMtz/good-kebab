import Link from "next/link";
import { SelectorTema } from "./BotonTema";
import { Marca } from "./Logo";
import { SEGMENTOS } from "@/lib/contenido";

type Columna = { titulo: string; enlaces: { href: string; label: string }[] };

/** Nombres cortos para el pie ("Negocios de servicios" → "Servicios"). */
const CORTO: Record<string, string> = { servicios: "Servicios" };

const COLUMNAS: Columna[] = [
  {
    titulo: "Producto",
    enlaces: [
      { href: "/agentes", label: "Agentes" },
      { href: "/pruebalo", label: "Pruébalo" },
      { href: "/precios", label: "Precios" },
    ],
  },
  {
    titulo: "Negocios",
    enlaces: SEGMENTOS.map((s) => ({ href: `/para-quien-es#${s.id}`, label: CORTO[s.id] ?? s.nombre })),
  },
  {
    titulo: "Ayuda",
    enlaces: [
      { href: "/preguntas", label: "Preguntas" },
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

/**
 * Pie como el de GitHub: a la izquierda la marca con una línea de qué es
 * Atendel; a la derecha cuatro columnas sin bordes (encabezados 16/600 y
 * enlaces 14/400 gris perla, 12px entre uno y otro). Abajo, sobre una
 * orilla de 1px, los derechos y el selector de tema (claro, oscuro o como
 * el sistema).
 */
export function Footer() {
  return (
    <footer className="pie-sitio">
      <div className="pie-sitio__arriba">
        <div className="pie-sitio__marca">
          <Link href="/" className="pie-sitio__logo" aria-label="Atendel, inicio">
            <Marca className="pie-sitio__circulos" />
            <span className="pie-sitio__nombre">Atendel</span>
          </Link>
          <p className="pie-sitio__lema">Agentes de IA para clínicas, consultorios y estéticas.</p>
        </div>

        <nav className="pie-sitio__columnas" aria-label="Pie de página">
          {COLUMNAS.map((c) => (
            <div key={c.titulo} className="pie-sitio__columna">
              <h2 className="pie-sitio__titulo">{c.titulo}</h2>
              <ul className="pie-sitio__lista">
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

      <div className="pie-sitio__abajo">
        <p className="pie-sitio__derechos">© {new Date().getFullYear()} Atendel. Todos los derechos reservados.</p>
        <SelectorTema />
      </div>
    </footer>
  );
}
