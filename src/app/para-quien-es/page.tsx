import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Borrador } from "@/components/Encabezado";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { Seccion } from "@/components/base/Seccion";
import { PilaAgentes, TareasNegocio } from "@/components/inicio/ParaQuien";
import { AGENTE_POR_ID, esIdAgente } from "@/lib/agentes";
import { SEGMENTOS } from "@/lib/contenido";
import { Revelar } from "./Revelar";

export const metadata: Metadata = { title: "Para quién es" };

/**
 * /para-quien-es (Grupo 4 · G4-T2, "el producto manda"). Encabezado a la
 * izquierda (la escena de partículas dibuja la burbuja a la derecha, como
 * siempre), saltos a cada negocio en píldoras y un bloque por negocio que
 * alterna de lado: el texto (con su marca de borrador) y, enfrente, cómo se ve
 * su equipo en el producto: las tareas de cada agente como renglones.
 */
export default function ParaQuienEs() {
  return (
    <Sitio>
      <header className="inf-pagina contenedor" data-escena="burbujaDerecha">
        <div className="inf-pagina__texto">
          <Etiqueta>Para quién es · Negocios que atienden personas</Etiqueta>
          <h1 className="t-grande">
            Clínicas, estéticas, consultorios y negocios de servicios
          </h1>
          <p className="t-intro">
            Si tu negocio vive de atender, agendar y que tus clientes regresen,
            el equipo de Atendel hace esa parte contigo.
          </p>
          <div className="inf-pagina__acciones">
            <Boton href="/pruebalo">Habla con los agentes</Boton>
            <Boton href="/precios" variante="sutil">
              Ver precios
            </Boton>
          </div>
          <nav aria-label="Tipos de negocio" className="inf-saltos">
            <Etiqueta as="span" tono="tenue">
              Ir a
            </Etiqueta>
            <ul>
              {SEGMENTOS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="inf-salto">
                    {s.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <div className="inf-cuerpo">
        {SEGMENTOS.map((s, i) => {
          const invertido = i % 2 === 1;
          return (
            <Seccion
              key={s.id}
              id={s.id}
              etiquetadaPor={`${s.id}-titulo`}
              fondo="ninguno"
              className="inf-bloque"
            >
              <Revelar
                className={`columnas-asimetricas lg:items-center${invertido ? " columnas-asimetricas--invertidas" : ""}`}
              >
                <div
                  className={invertido ? "lg:order-2" : undefined}
                  style={{ "--i": 0 } as CSSProperties}
                >
                  <Etiqueta tono="cielo">
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(SEGMENTOS.length).padStart(2, "0")}
                  </Etiqueta>
                  <h2
                    id={`${s.id}-titulo`}
                    className="t-seccion inf-bloque__titulo"
                  >
                    {s.nombre}
                  </h2>
                  <p className="t-intro inf-bloque__intro">{s.intro}</p>
                  <p className="inf-bloque__borrador">
                    <Borrador />
                  </p>
                  <div className="inf-bloque__equipo">
                    <PilaAgentes segmento={s} />
                    <Etiqueta as="span" tono="tenue">
                      {s.ayuda
                        .map(([id]) =>
                          esIdAgente(id) ? AGENTE_POR_ID[id].nombre : "",
                        )
                        .join(" · ")}
                    </Etiqueta>
                  </div>
                </div>
                <div
                  className={invertido ? "lg:order-1" : undefined}
                  style={{ "--i": 1 } as CSSProperties}
                >
                  <MarcoNavegador
                    titulo={`Ejemplo: qué hace cada agente en ${s.nombre.toLowerCase()}`}
                    pestanas={[
                      { etiqueta: `Tu equipo · ${s.nombre}`, activa: true },
                    ]}
                  >
                    <TareasNegocio segmento={s} />
                  </MarcoNavegador>
                </div>
              </Revelar>
            </Seccion>
          );
        })}

        <Seccion
          fondo="ninguno"
          etiquetadaPor="para-quien-cierre"
          className="inf-cierre"
        >
          <div className="inf-cierre__caja">
            <Etiqueta>Pruébalo</Etiqueta>
            <h2 id="para-quien-cierre" className="t-seccion">
              Pruébalo con tu negocio en mente
            </h2>
            <p className="t-intro">
              Habla con Lola, Clara, Víctor e Iris en el chat de demostración.
            </p>
            <div className="inf-pagina__acciones">
              <Boton href="/pruebalo">Habla con los agentes</Boton>
              <Boton href="/precios" variante="sutil" flecha>
                Ver precios
              </Boton>
            </div>
          </div>
        </Seccion>
      </div>
    </Sitio>
  );
}
