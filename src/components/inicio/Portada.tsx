import { FormularioLista } from "@/components/FormularioLista";
import { Revela } from "@/components/escena/Revela";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { PLANES } from "@/lib/planes";

// La línea en Mono de lo que cuesta empezar: sale de los datos reales del plan Free
const FREE = PLANES.find((p) => p.id === "free")!;
const CONDICIONES = [FREE.precio ?? "", `${FREE.mensajesMes} mensajes al mes`, "Entras con tu correo"].filter(Boolean);

const { lola, clara, victor, iris } = AGENTE_POR_ID;

/**
 * 1. Portada partida (muestra M2, "Zigzag y registro").
 * Como el primer cuadro de Dala: el título enorme a la izquierda, con el
 * párrafo, el formulario de la lista y un solo botón azul; a la derecha, la
 * constelación de triangulitos (la escena del fondo, data-escena) en forma de
 * burbuja de chat. El texto aparece línea por línea (Revela, de la v7).
 * Oscuro = negro de Dala; claro = papel de Vercel (lo deciden los tokens).
 */
export function Portada() {
  return (
    <section aria-labelledby="portada-titulo" className="m2-portada" data-escena="constelacion">
      <div className="contenedor m2-portada__rejilla">
        <div className="m2-portada__texto">
          <Revela>
            <p className="m2-ceja">Para clínicas, consultorios y estéticas</p>
            <h1 id="portada-titulo" className="m2-titulo m2-portada__titulo">
              Que ningún <br className="m2-corte" />
              cliente se quede <br className="m2-corte" />
              sin respuesta
            </h1>
            <p className="m2-parrafo m2-portada__intro">
              <b>{lola.nombre}</b> contesta tu WhatsApp y agenda citas, <b>{clara.nombre}</b> ordena tu correo,{" "}
              <b>{victor.nombre}</b> trae de regreso a tus clientes e <b>{iris.nombre}</b> lleva el trabajo de oficina.
              Lo importante no sale sin tu visto bueno.
            </p>
          </Revela>

          <FormularioLista conSecundario={false} className="m2-portada__formulario" />

          <p className="m2-ceja m2-ceja--tenue m2-portada__condiciones">
            {CONDICIONES.map((c, i) => (
              <span key={c}>
                {i > 0 ? <span aria-hidden="true"> · </span> : null}
                <span className="m2-portada__condicion">{c}</span>
              </span>
            ))}
          </p>
        </div>
        {/* La columna derecha la ocupa la constelación del fondo (fija, detrás) */}
        <div className="m2-portada__hueco" aria-hidden="true" />
      </div>
    </section>
  );
}
