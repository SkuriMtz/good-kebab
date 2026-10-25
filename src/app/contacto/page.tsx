import type { Metadata } from "next";
import Link from "next/link";
import { Sitio } from "@/components/Sitio";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Icono } from "@/components/base/Iconos";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { FormularioContacto } from "./FormularioContacto";
import { metadatos } from "@/lib/seo";

export const metadata: Metadata = metadatos(
  "Contacto",
  "Escríbenos tus dudas sobre Atendel, los planes o cómo cuidamos tus datos. Te contestamos a tu correo.",
);

const ATAJOS = [
  { href: "/preguntas", titulo: "Posibles preguntas", texto: "Cómo se empieza y qué hace cada agente" },
  { href: "/precios", titulo: "Precios", texto: "Qué trae Free, One y Max" },
  { href: "/preguntas#seguridad", titulo: "Tus datos", texto: "Cómo cuidamos la información de tu negocio" },
];

/**
 * /contacto: sobria y centrada. Título, una tarjeta de vidrio con el
 * formulario (nombre, correo, negocio, mensaje) y, debajo, tres atajos por
 * si la respuesta ya está en el sitio.
 */
export default function Contacto() {
  return (
    <Sitio>
      <section className="pagina-sobria con-halo" aria-labelledby="contacto-titulo">
        <Halo y="22%" ancho="min(760px, 120vw)" suave />
        <div className="pagina-sobria__centro">
          <Etiqueta tono="cielo">Contacto</Etiqueta>
          <h1 id="contacto-titulo" className="t-grande">
            Escríbenos
          </h1>
          <p className="t-intro">
            Dudas sobre los planes, sobre tu tipo de negocio o sobre cómo cuidamos tus datos. Te contestamos a tu correo.
          </p>
        </div>
        <TarjetaVidrio relleno="amplio" className="contacto-tarjeta">
          <FormularioContacto />
        </TarjetaVidrio>
        <nav aria-label="Quizá tu respuesta ya está aquí" className="contacto-atajos">
          <p className="etiqueta">Quizá ya está aquí</p>
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
