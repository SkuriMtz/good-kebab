import { BotonFicha } from "@/components/agentes/BotonFicha";
import { Personaje } from "@/components/agentes/Personaje";
import { Revela } from "@/components/escena/Revela";
import { AGENTES_INFO } from "@/lib/agentes";

/**
 * 3. Los cuatro agentes · muestra M3: una lista tipográfica enorme, sin
 * tarjetas. Cada fila: número en Mono, el personaje chiquito, el nombre en
 * tamaño de título y una línea de lo que hace. Al pasar el mouse (o con el
 * teclado) la fila se resalta y las demás se apagan; al tocarla se abre la
 * ficha del agente (todo lo que hace y su conversación de ejemplo).
 * Detrás, la burbuja de la portada se vuelve un globo a la derecha.
 */
export function Agentes() {
  return (
    <section id="agentes" aria-labelledby="agentes-titulo" className="m3 m3-agentes" data-escena="tresZonasAgentes">
      <div className="m3-contenedor">
        <Revela como="header" className="m3-agentes__cabeza">
          <p className="m3-etiqueta">Tu equipo</p>
          <h2 id="agentes-titulo" className="m3-subtitulo">
            Cuatro agentes, cada uno con su trabajo
          </h2>
          <p className="m3-agentes__texto">Toca a uno para ver todo lo que hace y una conversación de ejemplo.</p>
        </Revela>

        <ol className="m3-lista">
          {AGENTES_INFO.map((a, i) => (
            <li key={a.id}>
              <BotonFicha agente={a.id} className="m3-agente" ariaLabel={`${a.nombre}, ${a.area}: ${a.lema} Ver su ficha`}>
                <span className="m3-agente__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="m3-agente__personaje" aria-hidden="true">
                  <Personaje agente={a.id} avatar />
                </span>
                <span className="m3-agente__nombre">{a.nombre}</span>
                <span className="m3-agente__texto">
                  <span className="m3-agente__area">
                    {a.area} · {a.abarca}
                  </span>
                  <span className="m3-agente__lema">{a.lema}</span>
                </span>
                <span className="m3-agente__flecha" aria-hidden="true">
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
