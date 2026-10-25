import type { Metadata } from "next";
import Link from "next/link";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Revela } from "@/components/escena/Revela";
import { PRUEBALO } from "@/lib/contenido";
import { metadatos } from "@/lib/seo";

export const metadata: Metadata = metadatos(
  "Página no encontrada",
  "Esta dirección no existe en Atendel. Vuelve al inicio o sigue a los agentes, los precios o las posibles preguntas.",
);

/** A dónde seguir: las páginas principales del sitio, con una línea de qué hay en cada una. */
const ATAJOS = [
  { href: "/agentes", titulo: "Agentes", texto: "Lola, Clara, Víctor e Iris: qué hace cada uno" },
  { href: "/precios", titulo: "Precios", texto: "Qué trae Free, One y Max" },
  { href: "/preguntas", titulo: "Posibles preguntas", texto: "Cómo se empieza y cómo cuidamos tus datos" },
  { href: PRUEBALO.href, titulo: "Pruébalo", texto: "Platica con los agentes en un chat de ejemplo" },
];

/**
 * 404 del sitio público, con la barra, el pie y la figura de fondo de
 * siempre (la burbuja a la derecha, como los encabezados con escena).
 * Etiqueta en Mono, título grande, una línea de qué pasó, el único botón
 * principal (al inicio) y una lista de atajos con divisiones de 1px.
 */
export default function NoEncontrada() {
  return (
    <Sitio>
      <section className="encabezado-escena contenedor pagina-404" data-escena="burbujaDerecha" aria-labelledby="no-encontrada-titulo">
        <Revela className="encabezado-escena__texto">
          <p className="t-etiqueta">Error 404</p>
          <h1 id="no-encontrada-titulo" className="t-portada mt-[var(--spacing-18)]">
            Esta página no existe
          </h1>
          <p className="d-parrafos max-w-[460px]">
            Puede que el enlace esté mal escrito o que la página haya cambiado de lugar.
          </p>
          <div className="mt-[var(--spacing-36)] flex flex-wrap items-center gap-[var(--spacing-12)]">
            <Boton href="/" tam="grande">
              Volver al inicio
            </Boton>
          </div>
        </Revela>
        <nav aria-labelledby="no-encontrada-atajos" className="contacto-atajos pagina-404__atajos">
          <p id="no-encontrada-atajos" className="etiqueta">
            O sigue por aquí
          </p>
          <ul>
            {ATAJOS.map((a) => (
              <li key={a.href}>
                <Link href={a.href} className="contacto-atajo">
                  <span>
                    <span className="contacto-atajo__titulo">{a.titulo}</span>
                    <span className="t-chico">{a.texto}</span>
                  </span>
                  <Icono nombre="chevron-derecha" tam={16} className="contacto-atajo__flecha" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </Sitio>
  );
}
