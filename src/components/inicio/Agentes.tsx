import { EnlaceFicha } from "@/components/agentes/BotonFicha";
import { Personaje } from "@/components/agentes/Personaje";
import { Revela } from "@/components/escena/Revela";
import { AGENTES_INFO } from "@/lib/agentes";
import { RegistroDia } from "./RegistroDia";

/**
 * 3. Los cuatro agentes (muestra M2, "Zigzag y registro").
 * Arriba, en dos columnas: el título grande y, a la derecha, el registro del
 * día (lo que hicieron hoy, en Mono). Abajo, cada agente en una fila de dos
 * columnas que alterna de lado: su texto y su personaje en grande.
 * En celular todo se apila: personaje arriba, texto abajo.
 */
export function Agentes() {
  return (
    <section id="agentes" aria-labelledby="agentes-titulo" className="m2-agentes" data-escena="polvo">
      <div className="contenedor">
        <div className="m2-agentes__cabeza">
          <Revela className="m2-agentes__intro">
            <p className="m2-ceja">Tu equipo</p>
            <h2 id="agentes-titulo" className="m2-titulo m2-titulo--seccion">
              Cuatro agentes, cada uno con su trabajo
            </h2>
            <p className="m2-parrafo">
              Uno contesta WhatsApp y agenda, otra lleva tu correo, otro trae de regreso a tus clientes y otra hace el
              trabajo de oficina. Así se ve un día con ellos.
            </p>
          </Revela>
          <RegistroDia />
        </div>

        <ol className="m2-zigzag">
          {AGENTES_INFO.map((a, i) => (
            <li key={a.id} className={`m2-agente${i % 2 ? " m2-agente--derecha" : ""}`}>
              <div className="m2-agente__figura">
                <Personaje agente={a.id} className="m2-agente__personaje" />
              </div>
              <Revela className="m2-agente__texto">
                <p className="m2-ceja">
                  {String(i + 1).padStart(2, "0")} · {a.area} · {a.abarca}
                </p>
                <h3 className="m2-agente__nombre">{a.nombre}</h3>
                <p className="m2-parrafo m2-agente__lema">{a.lema}</p>
                <ul className="m2-agente__lista">
                  {a.capacidades.map((c) => (
                    <li key={c}>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <EnlaceFicha agente={a.id} className="m2-enlace">
                  Todo lo que hace {a.nombre}
                </EnlaceFicha>
              </Revela>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
