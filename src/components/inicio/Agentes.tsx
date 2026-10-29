import { BotonFicha } from "@/components/agentes/BotonFicha";
import { Personaje } from "@/components/agentes/Personaje";
import { Revela } from "@/components/escena/Revela";
import { AGENTES_INFO } from "@/lib/agentes";

/**
 * 2. Tu equipo: una lista tipográfica enorme, sin tarjetas (de la muestra M3).
 * Cada fila: número en Mono, el personaje, el nombre en tamaño de título y
 * una línea de lo que hace. Al pasar el mouse (o con el teclado) la fila se
 * resalta y las demás se apagan; al tocarla se abre la ficha del agente
 * (todo lo que hace y su conversación de ejemplo).
 * Detrás, la burbuja de la portada se vuelve un globo a la derecha
 * (data-escena="agentesLista").
 */
export function Agentes() {
  return (
    <section id="agentes" aria-labelledby="agentes-titulo" className="m1 m1-agentes" data-escena="agentesLista">
      <div className="m1-marco">
        <Revela como="header" className="m1-agentes__cabeza">
          <p className="m1-etiqueta">Tu equipo</p>
          <h2 id="agentes-titulo" className="m1-titulo">
            Cuatro agentes, cada uno con su trabajo
          </h2>
          <p className="m1-parrafo">Toca a uno para ver todo lo que hace y una conversación de ejemplo.</p>
        </Revela>

        <ol className="m1-lista">
          {AGENTES_INFO.map((a, i) => (
            <li key={a.id}>
              <BotonFicha agente={a.id} className="m1-agente" ariaLabel={`${a.nombre}, ${a.area}: ${a.lema} Ver su ficha`}>
                <span className="m1-agente__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="m1-agente__personaje" aria-hidden="true">
                  <Personaje agente={a.id} avatar />
                </span>
                <span className="m1-agente__nombre">{a.nombre}</span>
                <span className="m1-agente__texto">
                  <span className="m1-agente__area">
                    {a.area} · {a.abarca}
                  </span>
                  <span className="m1-agente__lema">{a.lema}</span>
                </span>
                <span className="m1-agente__flecha" aria-hidden="true">
                  →
                </span>
              </BotonFicha>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
