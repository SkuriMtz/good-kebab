import type { Metadata } from "next";
import { ChatDemo } from "@/components/ChatDemo";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";

export const metadata: Metadata = { title: "Pruébalo" };

/**
 * El chat con los agentes a casi toda la pantalla, dentro del marco de
 * navegador: chats, grupos, deslizar para borrar un grupo y la barra para
 * escribir (con @ y /). Guion local: no se llama a la IA.
 */
export default function Pruebalo() {
  return (
    <Sitio>
      <section className="pruebalo con-halo" aria-labelledby="pruebalo-titulo">
        <Halo y="40%" ancho="min(1400px, 170vw)" proporcion="16 / 9" suave />
        <div className="contenedor">
          <div className="pruebalo__cabeza">
            <div>
              <Etiqueta tono="cielo">Demostración · respuestas de ejemplo</Etiqueta>
              <h1 id="pruebalo-titulo" className="pruebalo__titulo">
                Habla con Lola, Clara, Víctor e Iris
              </h1>
              <p className="pruebalo__texto">Abre un chat o arma un grupo. Con @ mencionas a alguien; con / pides una acción.</p>
            </div>
            <Boton href="/entrar" variante="sutil" flecha>
              Probarlo con tu negocio
            </Boton>
          </div>
          <ChatDemo lugar="pagina" />
        </div>
      </section>
    </Sitio>
  );
}
