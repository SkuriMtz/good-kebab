import type { Metadata } from "next";
import Link from "next/link";
import { Sitio } from "@/components/Sitio";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Icono } from "@/components/base/Iconos";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { FormularioContacto } from "./FormularioContacto";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const idioma = idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.contacto);
}

/**
 * /contacto: sobria y centrada. Título, una tarjeta de vidrio con el
 * formulario (nombre, correo, negocio, mensaje) y, debajo, tres atajos por
 * si la respuesta ya está en el sitio.
 */
export default function Contacto() {
  const P = t(idiomaServidor()).contacto;
  return (
    <Sitio>
      <section className="pagina-sobria con-halo" aria-labelledby="contacto-titulo">
        <Halo y="22%" ancho="min(760px, 120vw)" suave />
        <div className="pagina-sobria__centro">
          <Etiqueta tono="cielo">{P.etiqueta}</Etiqueta>
          <h1 id="contacto-titulo" className="t-grande">
            {P.titulo}
          </h1>
          <p className="t-intro">{P.texto}</p>
        </div>
        <TarjetaVidrio relleno="amplio" className="contacto-tarjeta">
          <FormularioContacto />
        </TarjetaVidrio>
        <nav aria-label={P.atajosAria} className="contacto-atajos">
          <p className="etiqueta">{P.atajosEtiqueta}</p>
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
