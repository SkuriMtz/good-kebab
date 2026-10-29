import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Borrador, EncabezadoPagina } from "@/components/Encabezado";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Personaje } from "@/components/agentes/Personaje";
import type { IdAgente } from "@/lib/agentes";
import { AGENTE_POR_ID, esIdAgente } from "@/lib/agentes";
import { SEGMENTOS } from "@/lib/contenido";
import { PERSONAJES } from "@/lib/personajes";
import { Indice } from "./Indice";

export const metadata: Metadata = { title: "Para quién es" };

/**
 * El agente que va al frente de cada negocio: el que responde a la frase
 * clave de su introducción (que es texto de ejemplo, marcado como borrador).
 * No se agrega nada nuevo: su tarea sale tal cual de SEGMENTOS.
 * - Clínicas, "citas y proveedores" → Clara (facturas de proveedores).
 * - Estéticas, "lo que más vende es que regresen" → Víctor.
 * - Consultorios, "la parte de recepción y oficina" → Iris (documentos y trámites).
 * - Negocios de servicios, "vive de agendar" → Lola.
 */
const AL_FRENTE: Record<string, IdAgente> = {
  clinicas: "clara",
  esteticas: "victor",
  consultorios: "iris",
  servicios: "lola",
};

const color = (id: IdAgente) =>
  ({ "--agente": PERSONAJES[id].color }) as CSSProperties;

/**
 * Para quién es (Grupo 4 · propuesta T3): lectura larga y ordenada.
 * Encabezado con la escena de partículas (la burbuja a la derecha); luego un
 * índice fijo a la izquierda y un bloque por negocio: número en Mono, nombre,
 * introducción (borrador), el agente que va al frente con su personaje en
 * grande y su tarea como frase, y el resto del equipo en una lista con
 * divisiones de 1px. El personaje grande cambia de lado en cada bloque.
 */
export default function ParaQuienEs() {
  return (
    <Sitio>
      <EncabezadoPagina
        escena="burbujaDerecha"
        etiqueta="Para quién es · Negocios que atienden personas"
        titulo="Clínicas, estéticas, consultorios y negocios de servicios."
        texto="Si tu negocio vive de atender, agendar y que tus clientes regresen, el equipo de Atendel hace esa parte contigo."
        acciones={
          <Boton href="/pruebalo" variante="principal">
            Habla con los agentes
          </Boton>
        }
      />

      <div className="pqe-cuerpo">
        <div className="contenedor pqe-lectura">
          <Indice
            negocios={SEGMENTOS.map((s) => ({ id: s.id, nombre: s.nombre }))}
          />

          <div className="pqe-lectura__bloques">
            {SEGMENTOS.map((s, i) => {
              const frente = AL_FRENTE[s.id] ?? "lola";
              const tareaFrente = s.ayuda.find(([id]) => id === frente)?.[1];
              const resto = s.ayuda.filter(([id]) => id !== frente);
              const a = AGENTE_POR_ID[frente];
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
                    <p>
                      <Borrador />
                    </p>
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
                    aria-label={`El resto del equipo en ${s.nombre.toLowerCase()}`}
                  >
                    {resto.map(([id, texto]) => {
                      if (!esIdAgente(id)) return null;
                      const ag = AGENTE_POR_ID[id];
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
                <Etiqueta>Pruébalo</Etiqueta>
                <h2
                  id="cierre-titulo"
                  className="t-grande pqe-cierre-negocios__titulo"
                >
                  Pruébalo con tu negocio en mente.
                </h2>
              </div>
              <div className="pqe-cierre-negocios__acciones">
                <Boton href="/pruebalo" variante="principal">
                  Habla con los agentes
                </Boton>
                <Boton href="/precios" variante="fantasma" flecha>
                  Ver precios
                </Boton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Sitio>
  );
}
