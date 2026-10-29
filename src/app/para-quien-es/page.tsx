import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { EncabezadoPagina } from "@/components/Encabezado";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Personaje } from "@/components/agentes/Personaje";
import type { IdAgente } from "@/lib/agentes";
import { esIdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";
import { Indice } from "./Indice";
import { agenteDe, t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const idioma = idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.paraQuien);
}

/** El agente que va al frente de cada situación (SEGMENTOS en contenido.ts). */
const alFrente = (frente: string): IdAgente => (esIdAgente(frente) ? frente : "lola");

const color = (id: IdAgente) =>
  ({ "--agente": PERSONAJES[id].color }) as CSSProperties;

/**
 * Para quién es (Grupo 4 · propuesta T3): lectura larga y ordenada.
 * Encabezado con la escena de partículas (la burbuja a la derecha); luego un
 * índice fijo a la izquierda y un bloque por situación: número en Mono, nombre,
 * introducción, el agente que va al frente con su personaje en
 * grande y su tarea como frase, y el resto del equipo en una lista con
 * divisiones de 1px. El personaje grande cambia de lado en cada bloque.
 */
export default function ParaQuienEs() {
  const idioma = idiomaServidor();
  const P = t(idioma).paraQuien;
  const SEGMENTOS = P.segmentos;
  return (
    <Sitio>
      <EncabezadoPagina
        escena="burbujaDerecha"
        etiqueta={P.etiqueta}
        titulo={P.titulo}
        texto={P.texto}
        acciones={
          <Boton href="/pruebalo" variante="principal">
            {P.hablar}
          </Boton>
        }
      />

      <div className="pqe-cuerpo">
        <div className="contenedor pqe-lectura">
          <Indice titulo={P.indice} negocios={SEGMENTOS.map((s) => ({ id: s.id, nombre: s.nombre }))} />

          <div className="pqe-lectura__bloques">
            {SEGMENTOS.map((s, i) => {
              const frente = alFrente(s.frente);
              const tareaFrente = s.ayuda.find((x) => x.id === frente)?.texto;
              const resto = s.ayuda.filter((x) => x.id !== frente);
              const a = agenteDe(idioma, frente);
              return (
                <section
                  key={s.id}
                  id={s.id}
                  aria-labelledby={`${s.id}-titulo`}
                  className="pqe-bloque"
                >
                  <header className="pqe-bloque__cabeza">
                    <p className="pqe-bloque__numero" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}{" "}
                      <span>/ {String(SEGMENTOS.length).padStart(2, "0")}</span>
                    </p>
                    <h2 id={`${s.id}-titulo`} className="t-seccion">
                      {s.nombre}
                    </h2>
                    <p className="t-intro pqe-bloque__intro">{s.intro}</p>
                  </header>

                  <figure
                    className={`pqe-frente${i % 2 ? " pqe-frente--invertido" : ""}`}
                  >
                    <span
                      className="pqe-frente__personaje"
                      style={color(frente)}
                    >
                      <Personaje agente={frente} />
                    </span>
                    <figcaption className="pqe-frente__texto">
                      <Etiqueta tono="cielo">
                        {a.nombre} · {a.area}
                      </Etiqueta>
                      <p className="t-sub">{tareaFrente}</p>
                    </figcaption>
                  </figure>

                  <ul
                    className="pqe-equipo"
                    aria-label={P.resto}
                  >
                    {resto.map(({ id, texto }) => {
                      if (!esIdAgente(id)) return null;
                      const ag = agenteDe(idioma, id);
                      return (
                        <li key={id} className="pqe-equipo__fila">
                          <span
                            className="marca-agente marca-agente--chica"
                            style={color(id)}
                          >
                            <Personaje agente={id} avatar />
                          </span>
                          <div>
                            <p className="info-quien">
                              <span className="info-nombre">{ag.nombre}</span>
                              <Etiqueta as="span" tono="tenue">
                                {ag.area}
                              </Etiqueta>
                            </p>
                            <p className="t-cuerpo">{texto}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        <section
          className="seccion pqe-cierre-negocios"
          aria-labelledby="cierre-titulo"
        >
          <div className="contenedor">
            <div className="pqe-cierre-negocios__fila">
              <div>
                <Etiqueta>{P.cierreEtiqueta}</Etiqueta>
                <h2
                  id="cierre-titulo"
                  className="t-grande pqe-cierre-negocios__titulo"
                >
                  {P.cierreTitulo}
                </h2>
              </div>
              <div className="pqe-cierre-negocios__acciones">
                <Boton href="/pruebalo" variante="principal">
                  {P.hablar}
                </Boton>
                <Boton href="/precios" variante="fantasma" flecha>
                  {P.verPrecios}
                </Boton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Sitio>
  );
}
