import Link from "next/link";
import { BotonTema } from "./BotonTema";
import { Logo } from "./Logo";
import { PRUEBALO, SEGMENTOS } from "@/lib/contenido";

type Enlace = { href: string; label: string };

/** Los negocios del pie llevan a su bloque en /para-quien-es (el ancla es su id). */
const NEGOCIOS: Enlace[] = SEGMENTOS.map((s) => ({
  href: `/para-quien-es#${s.id}`,
  label: s.id === "servicios" ? "Servicios" : s.nombre,
}));

const COLUMNAS: { id: string; titulo: string; enlaces: Enlace[] }[] = [
  {
    id: "producto",
    titulo: "Producto",
    enlaces: [{ href: "/agentes", label: "Agentes" }, PRUEBALO, { href: "/precios", label: "Precios" }],
  },
  { id: "negocios", titulo: "Negocios", enlaces: NEGOCIOS },
  {
    id: "ayuda",
    titulo: "Ayuda",
    enlaces: [
      { href: "/preguntas", label: "Preguntas" },
      { href: "/preguntas#seguridad", label: "Tus datos" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
  {
    id: "cuenta",
    titulo: "Cuenta",
    enlaces: [
      { href: "/entrar", label: "Entrar" },
      { href: "/panel", label: "Mi panel" },
    ],
  },
];

/**
 * Pie corto y ordenado: cuatro columnas sin bordes (el espacio separa) y,
 * abajo, el logo, el año y el modo claro/oscuro.
 */
export function Footer() {
  return (
    <footer className="pie-sitio">
      <div className="contenedor">
        <div className="pie-sitio__columnas">
          {COLUMNAS.map((c) => (
            <nav key={c.id} aria-labelledby={`pie-${c.id}`} className="pie-sitio__columna">
              <h2 id={`pie-${c.id}`} className="pie-sitio__titulo">
                {c.titulo}
              </h2>
              <ul className="pie-sitio__lista">
                {c.enlaces.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="pie-sitio__enlace">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="pie-sitio__base">
          <Link href="/" className="pie-sitio__inicio" aria-label="Atendel, inicio">
            <Logo className="logo--chico" />
          </Link>
          <p className="pie-sitio__derechos">
            © {new Date().getFullYear()} Atendel
            <span className="pie-sitio__lema">Agentes de IA para clínicas, consultorios y estéticas</span>
          </p>
          <BotonTema variante="segmentado" className="pie-sitio__tema" />
        </div>
      </div>
    </footer>
  );
}
