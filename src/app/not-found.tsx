import type { Metadata } from "next";
import Link from "next/link";
import { MarcoAcceso } from "@/components/acceso/MarcoAcceso";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.noEncontrada);
}

/**
 * 404 con el estilo de las páginas de acceso: fondo de fragmentos y una
 * tarjeta con la marca, el título, una línea de qué pasó, el único botón
 * principal (al inicio) y los atajos de siempre.
 */
export default async function NoEncontrada() {
  const P = t(await idiomaServidor()).noEncontrada;
  return (
    <MarcoAcceso etiqueta={P.etiqueta} titulo={P.titulo} tituloId="no-encontrada-titulo" texto={P.texto}>
      <div className="acc__botones">
        <Boton href="/" tam="grande" bloque>
          {P.volver}
        </Boton>
      </div>
      <nav aria-labelledby="no-encontrada-atajos" className="acc__atajos">
        <p id="no-encontrada-atajos" className="acc__atajos-titulo">
          {P.sigue}
        </p>
        <ul>
          {P.atajos.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className="acc__atajo">
                <span>
                  <span className="acc__atajo-titulo">{a.titulo}</span>
                  <span className="acc__atajo-texto">{a.texto}</span>
                </span>
                <Icono nombre="chevron-derecha" tam={16} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </MarcoAcceso>
  );
}
