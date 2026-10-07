import type { Metadata } from "next";
import { ChatDemo } from "@/components/ChatDemo";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";

export const metadata: Metadata = { title: "Pruébalo" };

/**
 * El chat con los agentes a lo ancho, dentro del marco de navegador: grupos,
 * agentes, la conversación como línea de tiempo y el compositor (PromptBar).
 * Es una demostración con guion local: aquí no se llama a la IA.
 */
export default function Pruebalo() {
  return (
    <Sitio>
      <section className="seccion seccion--compacta con-halo" aria-labelledby="pruebalo-titulo">
        <Halo y="0%" ancho="min(900px, 110vw)" proporcion="2 / 1" suave />
        <div className="contenedor">
          <header className="pruebalo__cabeza">
            <div>
              <Etiqueta tono="cielo">Pruébalo · demostración</Etiqueta>
              <h1 id="pruebalo-titulo" className="t-grande">
                Habla con tu equipo
              </h1>
              <p className="t-intro">
                Escríbeles como a tu recepción. Las respuestas son de ejemplo y nada sale de esta página; con tu cuenta trabajan con tu
                agenda y tu correo de verdad.
              </p>
            </div>
            <Boton variante="principal" href="/entrar" flecha>
              Probarlo con mi negocio
            </Boton>
          </header>
          <ChatDemo alto="pagina" />
          <p className="pruebalo__atajos">
            <span>
              <kbd>@</kbd>mencionar a un agente
            </span>
            <span>
              <kbd>/</kbd>encargar una tarea
            </span>
            <span>
              <kbd>Enter</kbd>enviar
            </span>
            <span>
              <kbd>Shift + Enter</kbd>otra línea
            </span>
            <span>
              <kbd>Esc</kbd>cerrar el menú
            </span>
          </p>
        </div>
      </section>
    </Sitio>
  );
}
