import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FormularioLista } from "@/components/FormularioLista";
import { Sitio } from "@/components/Sitio";
import { Personaje } from "@/components/agentes/Personaje";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { IDS_AGENTES } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const idioma = idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.lista);
}

/**
 * /lista: la lista de espera, sobria y centrada. Arriba el equipo, el
 * título y el formulario a lo grande sobre el halo; abajo, en una columna
 * angosta, qué pasa después de anotarte (tres pasos con número en Mono y una
 * línea de 1px que los une).
 */
export default function Lista() {
  const P = t(idiomaServidor()).listaEspera.pagina;
  return (
    <Sitio>
      <section className="pagina-sobria con-halo" aria-labelledby="lista-pagina-titulo">
        <Halo y="38%" ancho="min(760px, 120vw)" suave />
        <div className="pagina-sobria__centro">
          <ul className="pagina-sobria__equipo" aria-label={P.equipo}>
            {IDS_AGENTES.map((a) => (
              <li
                key={a}
                className="marca-agente marca-agente--chica"
                style={{ "--agente": PERSONAJES[a].color } as CSSProperties}
              >
                <Personaje agente={a} avatar />
              </li>
            ))}
          </ul>
          <Etiqueta tono="cielo">{P.etiqueta}</Etiqueta>
          <h1 id="lista-pagina-titulo" className="t-grande">
            {P.titulo}
          </h1>
          <p className="t-intro">{P.texto}</p>
          <FormularioLista centrado conSecundario={false} className="pagina-sobria__formulario" />
        </div>
      </section>

      <section className="pagina-sobria pagina-sobria--siguiente" aria-labelledby="despues-titulo">
        <div className="pagina-sobria__columna">
          <h2 id="despues-titulo" className="etiqueta">
            {P.despuesTitulo}
          </h2>
          <ol className="pasos-lista">
            {P.despues.map((d, i) => (
              <li key={d.titulo} className="pasos-lista__paso">
                <span className="pasos-lista__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="t-sub">{d.titulo}</h3>
                  <p className="t-cuerpo">{d.texto}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="pagina-sobria__acciones">
            <Boton href="/pruebalo" variante="sutil">
              {P.pruebaAgentes}
            </Boton>
            <Boton href="/entrar" variante="fantasma" flecha>
              {P.empiezaFree}
            </Boton>
          </div>
          <p className="t-chico">
            {P.preguntar}{" "}
            <Link href="/contacto" className="enlace">
              {P.escribenos}
            </Link>
          </p>
        </div>
      </section>
    </Sitio>
  );
}
