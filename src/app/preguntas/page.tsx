import type { Metadata } from "next";
import Link from "next/link";
import { GrupoPreguntas, NoEstaTuPregunta, TEMAS_TODAS } from "@/components/Preguntas";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { GARANTIAS } from "@/lib/contenido";
import { IndiceTemas } from "./IndiceTemas";
import { metadatos } from "@/lib/seo";

export const metadata: Metadata = metadatos(
  "Posibles preguntas",
  "Cómo se empieza, qué trae cada plan, cómo trabajan los agentes con tus clientes y cómo cuidamos tus datos.",
);

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
  const entradas = [
    ...TEMAS_TODAS.map((t) => ({ id: t.id, nombre: t.nombre, cuenta: t.preguntas.length })),
    { id: "seguridad", nombre: "Cómo cuidamos tus datos" },
  ];
  return (
    <Sitio>
      <div className="contenedor faq-pagina">
        <aside className="faq-pagina__lado">
          <Etiqueta tono="cielo">Ayuda</Etiqueta>
          <h1 className="t-grande">Posibles preguntas</h1>
          <p className="t-cuerpo">Dudas que puedes tener antes de empezar con tu negocio.</p>
          <IndiceTemas etiqueta="Temas" entradas={entradas} />
          <div className="faq-pagina__pie">
            <NoEstaTuPregunta />
            <div className="faq-pagina__acciones">
              <Boton href="/pruebalo" variante="sutil">
                Prueba los agentes
              </Boton>
              <Boton href="/precios" variante="fantasma" flecha>
                Precios
              </Boton>
            </div>
          </div>
        </aside>
        <div className="faq-pagina__preguntas" id="preguntas">
          {TEMAS_TODAS.map((t, i) => (
            <GrupoPreguntas key={t.id} tema={t} nivel={2} abiertaInicial={i === 0 ? 0 : null} />
          ))}
        </div>
      </div>

      <section id="seguridad" className="seguridad-preguntas contenedor" data-escena="candadoDerecha" aria-labelledby="seguridad-titulo">
        <div className="seguridad-preguntas__texto">
          <Etiqueta tono="cielo">Tus datos</Etiqueta>
          <h2 id="seguridad-titulo" className="t-grande">
            Cada negocio ve solo lo suyo
          </h2>
          <ul className="seguridad-preguntas__lista">
            {GARANTIAS.map(([titulo, texto], i) => (
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
            ¿Algo más sobre tus datos?{" "}
            <Link href="/contacto" className="enlace">
              Escríbenos
            </Link>
          </p>
        </div>
      </section>
    </Sitio>
  );
}
