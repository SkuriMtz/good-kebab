import { Boton } from "@/components/base/Boton";
import { Halo } from "@/components/base/Halo";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { EnVivo } from "@/components/chat/EnVivo";

/**
 * 2. El producto en vivo (Grupo 2): la prueba principal de Atendel, como el
 * editor en la portada de una herramienta de desarrollo. Un marco de
 * navegador con una pestaña por canal; cada agente atiende una conversación
 * real de clínica y, al lado, aparece lo que dejó hecho. Guion local, sin IA.
 */
export function ChatEnMarco() {
  return (
    <Seccion id="en-vivo" etiquetadaPor="en-vivo-titulo" halo>
      <EncabezadoSeccion
        id="en-vivo-titulo"
        etiqueta="En vivo · guion de ejemplo"
        titulo="Ellos contestan. Tú ves lo que quedó hecho."
        texto="Elige un canal. Lola atiende un WhatsApp de las 11 de la noche, Clara resume el correo, Víctor da seguimiento e Iris arma el reporte. En cuanto terminan, ves lo que dejaron hecho."
      />
      <div className="envivo-escenario">
        <Halo y="55%" ancho="min(1100px, 140vw)" proporcion="16 / 9" suave />
        <EnVivo />
      </div>
      <div className="envivo-salida">
        <p className="t-chico">¿Quieres armar grupos y probar las acciones con / y @?</p>
        <Boton href="/pruebalo" variante="fantasma" tam="chico" flecha>
          Abrir el chat completo
        </Boton>
      </div>
    </Seccion>
  );
}
