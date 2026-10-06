import { Fragment, type CSSProperties } from "react";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { FormularioLista } from "@/components/FormularioLista";
import { Escena3D } from "@/components/escena3d/Escena3D";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { PLANES } from "@/lib/planes";

/*
 * El título, compuesto a mano: cada palabra es una pieza y los cortes de
 * línea están decididos, no los decide el navegador.
 *   Computadora (2 líneas):  Que ningún cliente / se quede sin respuesta
 *   Celular (3 líneas):      Que ningún / cliente se quede / sin respuesta
 * "|e" corta solo en pantallas anchas; "|c" corta solo en celular.
 */
const TITULO = ["Que", "ningún", "|c", "cliente", "|e", "se", "quede", "|c", "sin", "respuesta"] as const;

// La línea en Mono de lo que cuesta empezar: sale de los datos reales del plan Free
const FREE = PLANES.find((p) => p.id === "free")!;
const CONDICIONES = [FREE.nombre, FREE.precio ?? "", `${FREE.mensajesMes} mensajes al mes`, "Entras con tu correo"].filter(Boolean);

const { lola, clara, victor, iris } = AGENTE_POR_ID;

/**
 * 1. Portada (Grupo 1 · propuesta G1-T4: "el título manda").
 * Un solo protagonista: el título display, con cortes de línea y tracking
 * trabajados a mano, que entra palabra por palabra una sola vez. Detrás,
 * el halo respira muy lento y la escena 3D es un polvo de estrellas casi
 * imperceptible con profundidad (parallax con el mouse), fija mientras el
 * contenido sube. Con movimiento reducido o sin WebGL: solo el halo.
 */
export function Portada() {
  let palabra = 0;
  return (
    <section aria-labelledby="portada-titulo" className="portada seccion--portada con-halo [clip-path:inset(0)]">
      <Escena3D modo="polvo" />
      <div className="portada__respiro" aria-hidden="true">
        <Halo y="44%" ancho="min(1040px, 150vw)" />
      </div>

      <div className="portada__contenido contenedor">
        <Etiqueta tono="cielo" className="portada__rotulo portada__entra">
          Para clínicas, consultorios y estéticas
        </Etiqueta>

        <h1 id="portada-titulo" className="t-display portada__titulo">
          {TITULO.map((pieza, i) => {
            if (pieza === "|e") return <br key={i} className="portada__corte portada__corte--ancho" />;
            if (pieza === "|c") return <br key={i} className="portada__corte portada__corte--celular" />;
            const orden = palabra++;
            return (
              <Fragment key={i}>
                <span className="portada__palabra">
                  <span style={{ "--i": orden } as CSSProperties}>{pieza}</span>
                </span>{" "}
              </Fragment>
            );
          })}
        </h1>

        <p className="t-intro portada__intro portada__entra">
          <b>{lola.nombre}</b> contesta tu WhatsApp y agenda citas, <b>{clara.nombre}</b> ordena tu correo,{" "}
          <b>{victor.nombre}</b> trae de regreso a tus clientes e <b>{iris.nombre}</b> lleva el trabajo de oficina. Lo
          importante no sale sin tu visto bueno.
        </p>

        <FormularioLista centrado className="portada__formulario portada__entra" />

        <Etiqueta tono="tenue" className="portada__condiciones portada__entra">
          {CONDICIONES.map((c, i) => (
            <span key={c}>
              {i > 0 ? <span aria-hidden="true"> · </span> : null}
              <span className="portada__condicion">{c}</span>
            </span>
          ))}
        </Etiqueta>
      </div>
    </section>
  );
}
