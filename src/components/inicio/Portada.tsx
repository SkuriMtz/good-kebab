import { Marca } from "@/components/Logo";
import { FormularioLista } from "@/components/FormularioLista";
import { AGENTES_INFO, AGENTE_POR_ID } from "@/lib/agentes";
import { PLANES } from "@/lib/planes";

// La línea en Mono de lo que cuesta empezar: sale de los datos reales del plan Free
const FREE = PLANES.find((p) => p.id === "free")!;
const CONDICIONES = [FREE.nombre, FREE.precio ?? "", `${FREE.mensajesMes} mensajes al mes`, "Entras con tu correo"].filter(Boolean);

const { lola, clara, victor, iris } = AGENTE_POR_ID;

/**
 * 1. Portada (estilo diseno/vercel, "Hero Composition"): tres zonas.
 * - Izquierda: el titular grande (Geist 450, -0.06em, interlineado 1.0).
 * - Centro: el símbolo de Atendel (los cuatro círculos del logo) en grande,
 *   sin borde ni adornos.
 * - Derecha: una pila de etiquetas en Geist Mono (para quién es y los
 *   cuatro agentes con su área).
 * Debajo: qué hace cada agente en una línea, el formulario de la lista de
 * espera (que sigue funcionando igual) y las condiciones del plan Free.
 */
export function Portada() {
  return (
    <section aria-labelledby="portada-titulo" className="heroe">
      <div className="contenedor">
        <div className="heroe__rejilla">
          <h1 id="portada-titulo" className="heroe__titulo">
            Que ningún cliente se quede sin respuesta.
          </h1>

          <div className="heroe__simbolo" aria-hidden="true">
            <Marca className="heroe__marca" />
          </div>

          <ul className="heroe__sellos" aria-label="Para quién es y quién trabaja contigo">
            <li className="heroe__sello heroe__sello--fuerte">Para clínicas, consultorios y estéticas</li>
            {AGENTES_INFO.map((a) => (
              <li key={a.id} className="heroe__sello">
                {a.nombre} · {a.area}
              </li>
            ))}
          </ul>
        </div>

        <div className="heroe__pie">
          <p className="heroe__intro">
            <b>{lola.nombre}</b> contesta tu WhatsApp y agenda citas, <b>{clara.nombre}</b> ordena tu correo,{" "}
            <b>{victor.nombre}</b> trae de regreso a tus clientes e <b>{iris.nombre}</b> lleva el trabajo de oficina. Lo
            importante no sale sin tu visto bueno.
          </p>

          <FormularioLista className="heroe__formulario" />

          <p className="etiqueta etiqueta--tenue heroe__condiciones">
            {CONDICIONES.map((c, i) => (
              <span key={c}>
                {i > 0 ? <span aria-hidden="true"> · </span> : null}
                <span className="whitespace-nowrap">{c}</span>
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
