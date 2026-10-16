import type { Metadata } from "next";
import { Borrador } from "@/components/Encabezado";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Seccion } from "@/components/base/Seccion";
import { TareasPorAgente } from "@/components/inicio/ParaQuien";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { SEGMENTOS } from "@/lib/contenido";
import { Conversacion } from "./Conversacion";
import { Navegacion } from "./Navegacion";

export const metadata: Metadata = {
  title: "Para quién es",
  description:
    "Clínicas, estéticas, consultorios y negocios de servicios: lo que hace cada agente de Atendel en tu tipo de negocio.",
};

/**
 * Qué conversación de ejemplo (detalle.ts) acompaña a cada negocio: la que
 * mejor se parece a su día. Clínicas: Iris compara precios con otras
 * clínicas. Estéticas: Víctor recupera a una clienta que preguntó por botox.
 * Consultorios: Clara cambia una cita por correo. Servicios: Lola agenda por
 * WhatsApp.
 */
const EJEMPLO: Record<(typeof SEGMENTOS)[number]["id"], IdAgente> = {
  clinicas: "iris",
  esteticas: "victor",
  consultorios: "clara",
  servicios: "lola",
};

const numero = (i: number) => `${String(i + 1).padStart(2, "0")}`;

/**
 * /para-quien-es (Grupo 4 · propuesta T1). Como las páginas de funciones de
 * GitHub: encabezado a la izquierda con la burbuja de partículas del sitio a
 * la derecha como imagen de portada, una barra de píldoras que se
 * queda fija y lleva a cada negocio, y un bloque por negocio que alterna de
 * lado: de un lado lo que vive ese negocio (texto de ejemplo, marcado como
 * borrador) y la tarea de cada agente con su personaje; del otro, el producto
 * en un marco de navegador con la conversación de ejemplo que le corresponde.
 */
export default function ParaQuienEs() {
  return (
    <Sitio>
      {/* data-escena: la escena de partículas del sitio dibuja la burbuja a la derecha (en celular, arriba).
          Es lo único transparente: los bloques de abajo llevan fondo, así las partículas no pasan por detrás del texto. */}
      <section className="seccion inf-hero-pagina" data-escena="burbujaDerecha" aria-labelledby="pqe-titulo">
        <header className="contenedor inf-hero">
          <Etiqueta>Para quién es · Negocios que atienden personas</Etiqueta>
          <h1 id="pqe-titulo" className="t-grande">
            Clínicas, estéticas, consultorios y negocios de servicios
          </h1>
          <p className="t-intro">
            Si tu negocio vive de atender, agendar y que tus clientes regresen, el equipo de Atendel hace esa parte contigo.
          </p>
          <div className="inf-hero__acciones">
            <Boton href="/pruebalo">Habla con los agentes</Boton>
          </div>
        </header>
      </section>

      <Navegacion negocios={SEGMENTOS.map((s, i) => ({ id: s.id, nombre: s.nombre, numero: numero(i) }))} />

      {SEGMENTOS.map((s, i) => {
        const agente = EJEMPLO[s.id];
        const invertido = i % 2 === 1;
        return (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-titulo`} className="seccion seccion--fondo inf-segmento">
            <div className={`contenedor columnas-asimetricas${invertido ? " columnas-asimetricas--invertidas" : ""}`}>
              <div className={`inf-segmento__texto${invertido ? " lg:order-2" : ""}`}>
                <Etiqueta tono="cielo">
                  {numero(i)} / {numero(SEGMENTOS.length - 1)}
                </Etiqueta>
                <h2 id={`${s.id}-titulo`} className="t-seccion">
                  {s.nombre}
                </h2>
                <p className="t-sub">{s.intro}</p>
                <Borrador />
                <div className="mt-[var(--spacing-8)] self-stretch">
                  <TareasPorAgente ayuda={s.ayuda} compacta />
                </div>
              </div>
              <div className={`inf-segmento__ejemplo${invertido ? " lg:order-1" : ""}`}>
                <Conversacion agente={agente} />
                <Etiqueta tono="tenue">
                  Ejemplo con {AGENTE_POR_ID[agente].nombre} · nombres ficticios
                </Etiqueta>
              </div>
            </div>
          </section>
        );
      })}

      <Seccion halo etiquetadaPor="pqe-final">
        <Halo y="50%" ancho="min(760px, 120vw)" suave />
        <div className="inf-final">
          <Etiqueta>Pruébalo</Etiqueta>
          <h2 id="pqe-final" className="t-seccion max-w-[18ch]">
            Pruébalo con tu negocio en mente
          </h2>
          <p className="t-intro">
            Habla con los cuatro agentes en una demostración con datos de ejemplo. No necesitas cuenta.
          </p>
          <div className="inf-hero__acciones">
            <Boton href="/pruebalo">Habla con los agentes</Boton>
            <Boton href="/precios" variante="sutil" flecha>
              Ver precios
            </Boton>
          </div>
        </div>
      </Seccion>
    </Sitio>
  );
}
