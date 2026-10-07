import type { Metadata } from "next";
import { ChatDemo } from "@/components/ChatDemo";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";

export const metadata: Metadata = { title: "Pruébalo" };

/**
 * Pruébalo (Grupo 2 · G2-T5): el chat con los agentes dentro del marco de
 * navegador, a lo ancho (chats, grupos y la barra para escribir). En el
 * celular el marco desaparece y el chat ocupa la pantalla como una app.
 * Guion local: aquí no se llama a la IA.
 */
export default function Pruebalo() {
  return (
    <Sitio fondo="ninguno">
      <section className="pruebalo con-halo" aria-labelledby="pruebalo-titulo">
        <Halo x="50%" y="0px" ancho="min(1100px, 140vw)" proporcion="16 / 6" suave />
        <div className="contenedor">
          <header className="pruebalo__cabeza">
            <div className="pruebalo__texto">
              <Etiqueta tono="cielo">Pruébalo · respuestas de ejemplo</Etiqueta>
              <h1 id="pruebalo-titulo" className="t-seccion">
                Habla con tu equipo
              </h1>
              <p className="t-cuerpo">
                Escríbeles como a tu recepcionista, o abre el grupo «Recepción» para ver a Lola y Víctor trabajar juntos.
              </p>
              <ul className="pruebalo__atajos" aria-label="Atajos">
                <li>
                  <kbd className="prompt-bar__tecla">/</kbd> pide una acción
                </li>
                <li>
                  <kbd className="prompt-bar__tecla">@</kbd> menciona a alguien del grupo
                </li>
                <li className="pruebalo__atajo-teclado">
                  <kbd className="prompt-bar__tecla">Esc</kbd> cierra los menús
                </li>
              </ul>
            </div>
            <div className="pruebalo__accion">
              <Boton variante="principal" href="/entrar" flecha>
                Probarlo con mi negocio
              </Boton>
              <p className="t-caption">Entras con tu correo, sin contraseña.</p>
            </div>
          </header>

          <MarcoNavegador
            titulo="Chat de demostración de Atendel"
            className="pruebalo__marco"
            direccion="atendel.mx/panel/chat"
            pestanas={[{ etiqueta: "Hablar con mi equipo", activa: true }]}
          >
            <ChatDemo completa />
          </MarcoNavegador>
        </div>
      </section>
    </Sitio>
  );
}
