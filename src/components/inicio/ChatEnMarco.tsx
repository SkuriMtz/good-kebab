import { ChatDemo } from "@/components/ChatDemo";
import { Personaje } from "@/components/agentes/Personaje";
import { Boton } from "@/components/base/Boton";
import { Halo } from "@/components/base/Halo";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { IDS_AGENTES } from "@/lib/agentes";

/** Cómo leer lo que se ve en el marco: tres claves en fila, separadas por rayas. */
const CLAVES: { icono: NombreIcono; titulo: string; texto: string }[] = [
  {
    icono: "mensaje",
    titulo: "Les escribes como a tu recepción",
    texto: "Con @ le hablas a uno en especial; con / le encargas una tarea, como /confirmar.",
  },
  {
    icono: "calendario",
    titulo: "Lo que hacen queda en el hilo",
    texto: "Cada cita agendada, mensaje enviado o factura urgente aparece con su hora.",
  },
  {
    icono: "mano",
    titulo: "Lo importante espera tu visto bueno",
    texto: "Víctor pregunta antes de mandar el seguimiento; tú decides si sale.",
  },
];

/**
 * 2. El producto en vivo (Grupo 2 · propuesta G2-T3): el chat de los agentes
 * dentro de un marco de navegador, sobre el halo, como la prueba principal
 * de Atendel. La conversación se lee como una línea de tiempo: comentarios
 * de cada voz y, sobre la línea, lo que cada agente hizo. Guion local: aquí
 * no se llama a la IA.
 */
export function ChatEnMarco() {
  return (
    <Seccion id="en-vivo" etiquetadaPor="en-vivo-titulo" halo>
      <EncabezadoSeccion
        id="en-vivo-titulo"
        adorno={
          <span className="en-vivo__personajes">
            {IDS_AGENTES.map((id) => (
              <span key={id}>
                <Personaje agente={id} avatar />
              </span>
            ))}
          </span>
        }
        etiqueta="En vivo · guion de ejemplo"
        titulo="Una mañana de la recepción, contada por tu equipo"
        texto="Sofía pidió su primera limpieza facial por WhatsApp. Lola le dio cita, Víctor dejó listo el mensaje de reseña y cada paso quedó anotado con su hora. Escríbeles tú: nada sale de esta página."
      />
      <div className="en-vivo__escenario">
        <Halo y="45%" ancho="min(1100px, 120vw)" proporcion="16 / 9" suave />
        <ChatDemo alto="seccion" />
      </div>
      <ul className="en-vivo__claves">
        {CLAVES.map((c) => (
          <li key={c.titulo} className="en-vivo__clave">
            <span className="charla__insignia" aria-hidden="true">
              <Icono nombre={c.icono} tam={16} />
            </span>
            <h3>{c.titulo}</h3>
            <p>{c.texto}</p>
          </li>
        ))}
      </ul>
      <div className="en-vivo__acciones">
        <Boton variante="sutil" href="/pruebalo" flecha>
          Abrir el chat completo
        </Boton>
        <Boton variante="fantasma" href="/agentes">
          Qué hace cada agente
        </Boton>
      </div>
    </Seccion>
  );
}
