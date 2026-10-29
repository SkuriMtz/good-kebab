import type { Metadata } from "next";
import Link from "next/link";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Revela } from "@/components/escena/Revela";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const idioma = idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.noEncontrada);
}

/**
 * 404 del sitio público, con la barra, el pie y la figura de fondo de
 * siempre (la burbuja a la derecha, como los encabezados con escena).
 * Etiqueta en Mono, título grande, una línea de qué pasó, el único botón
 * principal (al inicio) y una lista de atajos con divisiones de 1px.
 */
export default function NoEncontrada() {
  const P = t(idiomaServidor()).noEncontrada;
  return (
    <Sitio>
      <section className="encabezado-escena contenedor pagina-404" data-escena="burbujaDerecha" aria-labelledby="no-encontrada-titulo">
        <Revela className="encabezado-escena__texto">
          <p className="t-etiqueta">{P.etiqueta}</p>
          <h1 id="no-encontrada-titulo" className="t-portada mt-[var(--spacing-18)]">
            {P.titulo}
          </h1>
          <p className="d-parrafos max-w-[460px]">{P.texto}</p>
          <div className="mt-[var(--spacing-36)] flex flex-wrap items-center gap-[var(--spacing-12)]">
            <Boton href="/" tam="grande">
              {P.volver}
            </Boton>
          </div>
        </Revela>
        <nav aria-labelledby="no-encontrada-atajos" className="contacto-atajos pagina-404__atajos">
          <p id="no-encontrada-atajos" className="etiqueta">
            {P.sigue}
          </p>
          <ul>
            {P.atajos.map((a) => (
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
