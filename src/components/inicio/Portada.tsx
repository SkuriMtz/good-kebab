import { FormularioLista } from "@/components/FormularioLista";
import { Revela } from "@/components/escena/Revela";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { PLANES } from "@/lib/planes";

// Lo que cuesta empezar: sale de los datos reales del plan Free
const FREE = PLANES.find((p) => p.id === "free")!;
const REGISTRO = [[FREE.nombre, FREE.precio].filter(Boolean).join(" · "), `${FREE.mensajesMes} mensajes al mes`, "Entras con tu correo"];

const { lola, clara, victor, iris } = AGENTE_POR_ID;

/**
 * 1. Portada (muestra M1, "la v7 de regreso"). Primera escena del inicio:
 * detrás, la figura de triangulitos forma una burbuja de chat a la derecha
 * (data-escena="portada"); al bajar se deshace y forma la siguiente.
 * El texto aparece línea por línea (Revela), en una sola columna a la
 * izquierda: etiqueta en Mono, título enorme, párrafo ligero, el formulario
 * (único botón principal, en azul) y el "registro" de lo que cuesta empezar.
 * Oscuro = Dala (negro, sin cajas); claro = Vercel (#fafafa, anillos finos).
 * Entrada: una sola secuencia de menos de 1.2 s (etiqueta → título por
 * línea → párrafo → formulario → registro, que entra completo).
 */
export function Portada() {
  return (
    <section aria-labelledby="portada-titulo" className="m1 m1-portada" data-escena="portada">
      <div className="m1-marco">
        <Revela className="m1-portada__texto">
          <p className="m1-etiqueta">Para clínicas, consultorios y estéticas</p>
          <h1 id="portada-titulo" className="m1-display">
            Que ningún cliente se quede sin respuesta
          </h1>
          <p className="m1-parrafo m1-portada__intro">
            <b>{lola.nombre}</b> contesta tu WhatsApp y agenda citas, <b>{clara.nombre}</b> ordena tu correo, <b>{victor.nombre}</b> trae
            de regreso a tus clientes e <b>{iris.nombre}</b> lleva el trabajo de oficina. Lo importante no sale sin tu visto bueno.
          </p>
          <FormularioLista className="m1-portada__formulario" />
          <div className="m1-registro" data-rv-unidad="">
            <p className="m1-etiqueta m1-registro__titulo">Para empezar</p>
            <ul className="m1-registro__lista">
              {REGISTRO.map((linea) => (
                <li key={linea}>
                  <span className="m1-registro__check" aria-hidden="true">
                    ✓
                  </span>{" "}
                  {linea}
                </li>
              ))}
            </ul>
          </div>
        </Revela>
      </div>
    </section>
  );
}
