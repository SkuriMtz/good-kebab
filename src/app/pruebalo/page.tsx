import type { Metadata } from "next";
import { ChatDemo } from "@/components/ChatDemo";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";

export const metadata: Metadata = { title: "Pruébalo" };

/**
 * /pruebalo: el chat completo de demostración (chats, grupos, PromptBar y el
 * panel de resultados) dentro del marco de navegador, a lo ancho. Guion
 * local: nada llama a la IA.
 */
export default function Pruebalo() {
  return (
    <Sitio>
      <section className="pruebalo con-halo" aria-labelledby="pruebalo-titulo">
        <Halo y="0%" ancho="min(1000px, 140vw)" proporcion="3 / 1" suave />
        <div className="contenedor">
          <header className="pruebalo__cabeza">
            <div className="pruebalo__texto">
              <Etiqueta tono="cielo">Pruébalo · demostración</Etiqueta>
              <h1 id="pruebalo-titulo" className="t-grande">
                Háblales como si ya trabajaran contigo
              </h1>
              <p className="pruebalo__intro">
                Escribe <kbd className="pruebalo__tecla">/</kbd> para ver lo que sabe hacer cada agente y{" "}
                <kbd className="pruebalo__tecla">@</kbd> para pedirle algo a alguien en un grupo. Las respuestas son de ejemplo; en tu
                panel trabajan con tu agenda, tu correo y tus clientes.
              </p>
            </div>
            <Boton href="/entrar" variante="principal" flecha className="pruebalo__accion">
              Crear mi cuenta gratis
            </Boton>
          </header>
          <MarcoNavegador
            titulo="Chat de demostración de Atendel"
            direccion="atendel.mx/panel/chat"
            pestanas={[{ etiqueta: "Hablar con mi equipo", activa: true }]}
          >
            <ChatDemo />
          </MarcoNavegador>
        </div>
      </section>
    </Sitio>
  );
}
