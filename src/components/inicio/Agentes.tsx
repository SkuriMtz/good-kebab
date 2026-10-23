import { Revela } from "@/components/escena/Revela";
import { CarruselEquipo } from "./CarruselEquipo";

/**
 * 2. Tu equipo (muestra M1). Segunda escena: la burbuja de la portada se
 * vuelve un globo arriba a la derecha (data-escena="globoEquipo"; en celular,
 * polvo ralo) y deja libre el carrusel de los cuatro agentes, a todo lo
 * ancho, como en la versión 7. El texto, a la izquierda, línea por línea.
 */
export function Agentes() {
  return (
    <section id="agentes" aria-labelledby="agentes-titulo" className="m1 m1-equipo" data-escena="globoEquipo">
      <div className="m1-marco">
        <Revela className="m1-equipo__cabeza">
          <p className="m1-etiqueta">Tu equipo</p>
          <h2 id="agentes-titulo" className="m1-titulo">
            Cuatro agentes, cada uno con su trabajo
          </h2>
          <p className="m1-parrafo m1-equipo__texto">
            Uno contesta WhatsApp y agenda, otra lleva tu correo, otro trae de regreso a tus clientes y otra hace el trabajo de oficina.
            Toca a cada uno para ver su ficha.
          </p>
        </Revela>
      </div>
      <CarruselEquipo />
    </section>
  );
}
