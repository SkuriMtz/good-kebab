import type { Metadata } from "next";
import { Planes } from "@/components/Planes";
import { NoEstaTuPregunta, Preguntas } from "@/components/Preguntas";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { Comparacion } from "./Comparacion";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const idioma = idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.precios);
}

/**
 * /precios: encabezado con la escena del globo a la derecha (fondo de
 * partículas), los tres planes en un solo panel de vidrio, la comparación
 * por agente y las preguntas sobre planes. Ningún botón cambia el plan de
 * una cuenta: Free se empieza entrando; One y Max llevan a la lista de espera.
 */
export default function Precios() {
  const idioma = idiomaServidor();
  const d = t(idioma);
  const P = d.paginaPrecios;
  return (
    <Sitio>
      <header className="pagina-cabeza pagina-cabeza--escena contenedor" data-escena="globoDerecha">
        <div className="pagina-cabeza__texto">
          <Etiqueta tono="cielo">{P.etiqueta}</Etiqueta>
          <h1 className="t-display">{P.titulo}</h1>
          <p className="t-intro">{P.intro}</p>
        </div>
      </header>

      <Seccion espacio="compacto" fondo="ninguno" etiquetadaPor="planes-titulo" className="!pt-0">
        <h2 id="planes-titulo" className="sr-only">
          {P.planes}
        </h2>
        <Planes nivelTitulo={3} idioma={idioma} />
      </Seccion>

      <Seccion id="comparar" etiquetadaPor="comparar-titulo">
        <EncabezadoSeccion
          id="comparar-titulo"
          alineacion="izquierda"
          etiqueta={P.compararEtiqueta}
          titulo={P.compararTitulo}
          texto={P.compararTexto}
        />
        <Comparacion idioma={idioma} />
      </Seccion>

      <Seccion id="preguntas-planes" etiquetadaPor="preguntas-planes-titulo" fondo="fondo-2">
        <div className="faq-doble">
          <div className="faq-doble__lado">
            <EncabezadoSeccion
              id="preguntas-planes-titulo"
              alineacion="izquierda"
              etiqueta={P.antes}
              titulo={P.preguntasTitulo}
              className="faq-doble__encabezado"
            />
            <NoEstaTuPregunta idioma={idioma} />
          </div>
          <div className="faq-doble__preguntas">
            <Preguntas preguntas={d.preguntas.grupos.planes.preguntas} />
          </div>
        </div>
      </Seccion>

      <Seccion etiquetadaPor="precios-cierre-titulo" ancho="angosto">
        <div className="cierre">
          <h2 id="precios-cierre-titulo" className="t-seccion">
            {P.cierreTitulo}
          </h2>
          <p className="t-intro">{P.cierreTexto}</p>
          <div className="cierre__acciones">
            <Boton href="/pruebalo" variante="sutil" tam="grande">
              {P.pruebaAgentes}
            </Boton>
            <Boton href="/lista" variante="fantasma" tam="grande" flecha>
              {P.listaEspera}
            </Boton>
          </div>
        </div>
      </Seccion>
    </Sitio>
  );
}
