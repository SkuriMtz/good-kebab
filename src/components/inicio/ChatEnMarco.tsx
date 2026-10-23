import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Seccion } from "@/components/base/Seccion";
import { VitrinaAgentes } from "@/components/agentes/VitrinaAgentes";

/**
 * 2. El producto (estilo diseno/vercel: dos columnas, título a la izquierda
 * y el producto a la derecha). A la derecha, la conversación real de cada
 * agente dentro de una tarjeta fina, con pestañas para cambiar de agente.
 * El chat completo, con grupos y la barra de escribir, vive en /pruebalo.
 */
export function ChatEnMarco() {
  return (
    <Seccion id="en-vivo" etiquetadaPor="en-vivo-titulo">
      <div className="dos-zonas">
        <div className="dos-zonas__texto">
          <Etiqueta>Conversaciones de ejemplo</Etiqueta>
          <h2 id="en-vivo-titulo" className="t-seccion">
            Un cliente escribe y tu equipo contesta.
          </h2>
          <p className="t-intro">
            Lola agenda por WhatsApp, Clara contesta desde tu correo, Víctor trae de regreso a quien no agendó e Iris
            te entrega la tabla. Elige un agente para ver cómo trabaja.
          </p>
          <ol className="dos-zonas__pasos" aria-label="Qué pasa en cada conversación">
            <li>
              <span className="dos-zonas__num">01</span> El cliente pregunta
            </li>
            <li>
              <span className="dos-zonas__num">02</span> El agente resuelve
            </li>
            <li>
              <span className="dos-zonas__num">03</span> Tú das el visto bueno
            </li>
          </ol>
          <div className="dos-zonas__acciones">
            <Boton href="/pruebalo" variante="fantasma" flecha>
              Abrir Pruébalo
            </Boton>
          </div>
        </div>
        <VitrinaAgentes />
      </div>
    </Seccion>
  );
}
