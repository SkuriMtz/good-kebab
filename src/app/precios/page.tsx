import type { Metadata } from "next";
import { Planes } from "@/components/Planes";
import { NoEstaTuPregunta, Preguntas } from "@/components/Preguntas";
import { Sitio } from "@/components/Sitio";
import { Etiqueta } from "@/components/base/Etiqueta";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { Comparacion } from "./Comparacion";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.precios);
}

/**
 * /precios: encabezado con la escena del globo a la derecha (fondo de
 * partículas), los tres planes en un solo panel de vidrio, la comparación
 * por agente y las preguntas sobre planes. Ningún botón cambia el plan de
 * una cuenta: Free se empieza entrando; One y Max llevan a la lista de espera.
 */
export default async function Precios() {
  const idioma = await idiomaServidor();
  const d = t(idioma);
  const P = d.paginaPrecios;
  return (
    <Sitio cierre="precios">
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
    </Sitio>
  );
}
