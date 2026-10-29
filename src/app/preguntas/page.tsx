import type { Metadata } from "next";
import Link from "next/link";
import { GrupoPreguntas, NoEstaTuPregunta, temasDe } from "@/components/Preguntas";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { IndiceTemas } from "./IndiceTemas";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const idioma = idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.preguntas);
}

const ICONOS_GARANTIA: NombreIcono[] = ["candado", "mano", "escudo"];

/**
 * /preguntas: dos columnas como la documentación de GitHub. A la izquierda,
 * el título y los temas (fijos al bajar, con el tema que lees marcado, y
 * "Tus datos" que lleva a #seguridad); a la derecha, todas las preguntas
 * agrupadas por tema en acordeón.
 * Abajo, #seguridad con las GARANTIAS y la escena del candado a la derecha
 * (fondo de partículas). Al integrar, el Grupo 4 puede poner aquí su
 * componente <Seguridad variante="preguntas" /> conservando id="seguridad".
 */
export default function PreguntasFrecuentes() {
  const idioma = idiomaServidor();
  const P = t(idioma).preguntas;
  const temas = temasDe(idioma);
  const entradas = [
    ...temas.map((x) => ({ id: x.id, nombre: x.nombre, cuenta: x.preguntas.length })),
    { id: "seguridad", nombre: P.cuidamos },
  ];
  return (
    <Sitio>
      <div className="contenedor faq-pagina">
        <aside className="faq-pagina__lado">
          <Etiqueta tono="cielo">{P.etiqueta}</Etiqueta>
          <h1 className="t-grande">{P.titulo}</h1>
          <p className="t-cuerpo">{P.texto}</p>
          <IndiceTemas etiqueta={P.temas} entradas={entradas} />
          <div className="faq-pagina__pie">
            <NoEstaTuPregunta idioma={idioma} />
            <div className="faq-pagina__acciones">
              <Boton href="/pruebalo" variante="sutil">
                {P.pruebaAgentes}
              </Boton>
              <Boton href="/precios" variante="fantasma" flecha>
                {P.precios}
              </Boton>
            </div>
          </div>
        </aside>
        <div className="faq-pagina__preguntas" id="preguntas">
          {temas.map((tema, i) => (
            <GrupoPreguntas key={tema.id} tema={tema} nivel={2} abiertaInicial={i === 0 ? 0 : null} />
          ))}
        </div>
      </div>

      <section id="seguridad" className="seguridad-preguntas contenedor" data-escena="candadoDerecha" aria-labelledby="seguridad-titulo">
        <div className="seguridad-preguntas__texto">
          <Etiqueta tono="cielo">{P.seguridadEtiqueta}</Etiqueta>
          <h2 id="seguridad-titulo" className="t-grande">
            {P.seguridadTitulo}
          </h2>
          <ul className="seguridad-preguntas__lista">
            {P.garantias.map(({ titulo, texto }, i) => (
              <li key={titulo}>
                <Icono nombre={ICONOS_GARANTIA[i] ?? "check"} tam={24} tono="cielo" />
                <div>
                  <h3 className="t-titulo">{titulo}</h3>
                  <p className="t-cuerpo">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="t-chico">
            {P.algoMas}{" "}
            <Link href="/contacto" className="enlace">
              {P.escribenos}
            </Link>
          </p>
        </div>
      </section>
    </Sitio>
  );
}
