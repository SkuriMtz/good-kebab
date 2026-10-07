import type { Metadata } from "next";
import { ChatDemo } from "@/components/ChatDemo";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Atajos } from "@/components/inicio/ChatEnMarco";

export const metadata: Metadata = {
  title: "Pruébalo",
  description: "Escríbeles a Lola, Clara, Víctor e Iris: chats, grupos y acciones con respuestas de ejemplo.",
};

/**
 * El chat con los agentes a lo ancho, dentro del marco de navegador: grupos,
 * chats con cada agente, la barra para escribir y, a la derecha, lo que quedó
 * hecho. Guion local (no llama a la IA).
 */
export default function Pruebalo() {
  return (
    <Sitio>
      <section className="contenedor pb-[var(--spacing-64)] pt-[var(--spacing-24)]" aria-labelledby="pruebalo-titulo">
        <header className="pruebalo__cabeza">
          <div>
            <Etiqueta tono="cielo">Pruébalo · demostración</Etiqueta>
            <h1 id="pruebalo-titulo" className="pruebalo__titulo">
              Habla con tu equipo
            </h1>
            <p className="pruebalo__texto">
              Usa @ para mencionar a alguien o / para pedir una acción. Las respuestas son de ejemplo; en tu panel trabajan con tu negocio.
            </p>
          </div>
          <Boton href="/entrar" variante="sutil" flecha>
            Probarlo de verdad
          </Boton>
        </header>
        <ChatDemo variante="pagina" />
        <div className="chat-vivo__pie">
          <Atajos />
        </div>
      </section>
    </Sitio>
  );
}
