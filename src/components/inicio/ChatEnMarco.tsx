import Link from "next/link";
import { ChatDemo } from "@/components/ChatDemo";
import { Personaje } from "@/components/agentes/Personaje";
import { Halo } from "@/components/base/Halo";
import { Icono } from "@/components/base/Iconos";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";

/** Cómo se usa el chat: con teclado en computadora, con toques en el celular. */
export function Atajos() {
  return (
    <ul className="chat-vivo__atajos" aria-label="Cómo usar el chat">
      <li>
        <kbd className="chat-vivo__tecla">@</kbd> menciona a un agente
      </li>
      <li>
        <kbd className="chat-vivo__tecla">/</kbd> pide una acción
      </li>
      <li className="chat-vivo__atajos--teclado">
        <kbd className="chat-vivo__tecla">Enter</kbd> envía
      </li>
    </ul>
  );
}

/**
 * 2. El producto en vivo (Grupo 2 · propuesta G2-T1). El chat de los agentes
 * dentro del marco de navegador, como la prueba principal de Atendel (el
 * editor en la portada de GitHub). Flota sobre un halo tenue. Al aparecer en
 * pantalla, el grupo "Recepción" se cuenta solo: una paciente pide cita, Lola
 * la agenda y aparece la cita confirmada. Guion local: no llama a la IA.
 */
export function ChatEnMarco() {
  return (
    <Seccion id="en-vivo" etiquetadaPor="en-vivo-titulo" halo>
      <EncabezadoSeccion
        id="en-vivo-titulo"
        adorno={<Personaje agente="lola" />}
        etiqueta="En vivo · demostración"
        titulo="Les escribes como a tu recepcionista y se reparten el trabajo"
        texto="Abre el grupo de la recepción, escríbele a Lola como si fueras tu paciente o usa / para pedir una acción. Las respuestas son de ejemplo y nada sale de esta página."
      />
      <div className="chat-vivo__marco">
        <Halo y="45%" ancho="min(1100px, 120vw)" proporcion="16 / 9" suave />
        <ChatDemo variante="inicio" />
      </div>
      <div className="chat-vivo__pie">
        <Atajos />
        <Link href="/pruebalo" className="conversa__enlace">
          Abrirlo en pantalla completa
          <Icono nombre="flecha" tam={16} className="flecha" />
        </Link>
      </div>
    </Seccion>
  );
}
