import { ChatDemo } from "@/components/ChatDemo";
import { Boton } from "@/components/base/Boton";
import { Halo } from "@/components/base/Halo";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { Avatar } from "@/components/chat/Piezas";
import { IDS_AGENTES } from "@/lib/agentes";

/**
 * 2. El producto en vivo (Grupo 2 · propuesta G2-T4).
 * Como el editor en la página de GitHub: el producto real, grande, dentro de
 * un marco de navegador que flota sobre el halo morado. Adentro, la
 * conversación de la recepción se reproduce sola al aparecer: Lola agenda a
 * una paciente, le pasa el seguimiento a Víctor y queda un mensaje esperando
 * tu visto bueno. Después la persona puede escribir (guion local, sin IA).
 */
export function ChatEnMarco() {
  return (
    <Seccion id="en-vivo" etiquetadaPor="en-vivo-titulo" halo>
      <EncabezadoSeccion
        id="en-vivo-titulo"
        adorno={
          <span className="en-vivo__personajes">
            {IDS_AGENTES.map((id) => (
              <Avatar key={id} agente={id} tam={40} />
            ))}
          </span>
        }
        etiqueta="En vivo · guion de ejemplo"
        titulo="Una paciente escribe y tu equipo se pasa el trabajo"
        texto="Sofía pidió su primera limpieza facial por WhatsApp. Mira cómo Lola le da cita y le pasa el seguimiento a Víctor. Luego escríbeles tú: nada sale de esta página."
      />
      <div className="en-vivo__escenario">
        <Halo y="45%" ancho="min(1760px, 190vw)" proporcion="16 / 10" />
        <ChatDemo lugar="inicio" />
      </div>
      <div className="en-vivo__pie">
        <ol className="en-vivo__nota etiqueta" aria-label="Qué pasa en la conversación">
          <li>
            <span className="en-vivo__num">01</span> Lola agenda
          </li>
          <li>
            <span className="en-vivo__num">02</span> Víctor da seguimiento
          </li>
          <li>
            <span className="en-vivo__num">03</span> Tú das el visto bueno
          </li>
        </ol>
        <Boton href="/pruebalo" variante="fantasma" tam="chico" flecha>
          Abrir a pantalla completa
        </Boton>
      </div>
    </Seccion>
  );
}
