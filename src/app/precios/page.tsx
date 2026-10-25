import type { Metadata } from "next";
import { Planes } from "@/components/Planes";
import { NoEstaTuPregunta, PREGUNTAS_PLANES, Preguntas } from "@/components/Preguntas";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { PREGUNTAS } from "@/lib/contenido";
import { Comparacion } from "./Comparacion";
import { metadatos } from "@/lib/seo";

export const metadata: Metadata = metadatos(
  "Precios",
  "Atendel Free es gratis y trae a Clara, tu agente de correo. One suma a Lola; Max, a los cuatro agentes.",
);

const QUE_CAMBIA = PREGUNTAS.filter((q) => q.p.startsWith("¿Qué incluye cada plan"));

/**
 * /precios: encabezado con la escena del globo a la derecha (fondo de
 * partículas), los tres planes en un solo panel de vidrio, la comparación
 * por agente y las preguntas sobre planes. Ningún botón cambia el plan de
 * una cuenta: Free se empieza entrando; One y Max llevan a la lista de espera.
 */
export default function Precios() {
  return (
    <Sitio>
      <header className="pagina-cabeza pagina-cabeza--escena contenedor" data-escena="globoDerecha">
        <div className="pagina-cabeza__texto">
          <Etiqueta tono="cielo">Precios · Free, One y Max</Etiqueta>
          <h1 className="t-display">Empieza gratis. Crece cuando tu negocio lo pida.</h1>
          <p className="t-intro">
            Free para conocer a Clara, tu agente de correo. One para sumar a Lola en la atención por WhatsApp y citas. Max
            para tener a los cuatro.
          </p>
        </div>
      </header>

      <Seccion espacio="compacto" fondo="ninguno" etiquetadaPor="planes-titulo" className="!pt-0">
        <h2 id="planes-titulo" className="sr-only">
          Planes
        </h2>
        <Planes nivelTitulo={3} />
      </Seccion>

      <Seccion id="comparar" etiquetadaPor="comparar-titulo">
        <EncabezadoSeccion
          id="comparar-titulo"
          alineacion="izquierda"
          etiqueta="Comparación"
          titulo="Quién trabaja contigo en cada plan"
          texto="Cada plan suma agentes y mensajes. Clara está en todos; Lola llega con One; Víctor e Iris, con Max."
        />
        <Comparacion />
      </Seccion>

      <Seccion id="preguntas-planes" etiquetadaPor="preguntas-planes-titulo" fondo="fondo-2">
        <div className="faq-doble">
          <div className="faq-doble__lado">
            <EncabezadoSeccion
              id="preguntas-planes-titulo"
              alineacion="izquierda"
              etiqueta="Antes de decidir"
              titulo="Preguntas sobre los planes"
              className="faq-doble__encabezado"
            />
            <NoEstaTuPregunta />
          </div>
          <div className="faq-doble__preguntas">
            <Preguntas preguntas={[...QUE_CAMBIA, ...PREGUNTAS_PLANES]} />
          </div>
        </div>
      </Seccion>

      <Seccion etiquetadaPor="precios-cierre-titulo" ancho="angosto">
        <div className="cierre">
          <h2 id="precios-cierre-titulo" className="t-seccion">
            Pruébalos antes de decidir.
          </h2>
          <p className="t-intro">
            Platica con Lola, Clara, Víctor e Iris en el chat de demostración, o anótate para saber cuándo abren One y
            Max.
          </p>
          <div className="cierre__acciones">
            <Boton href="/pruebalo" variante="sutil" tam="grande">
              Prueba los agentes
            </Boton>
            <Boton href="/lista" variante="fantasma" tam="grande" flecha>
              Lista de espera
            </Boton>
          </div>
        </div>
      </Seccion>
    </Sitio>
  );
}
