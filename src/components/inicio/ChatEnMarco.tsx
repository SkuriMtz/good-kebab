import { ChatDemo } from "@/components/ChatDemo";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTES_INFO } from "@/lib/agentes";

/** La pestaña de cada agente en la barra del marco: "Lola · WhatsApp", "Clara · Correo"… */
const PESTANAS = AGENTES_INFO.map((a, i) => ({
  id: a.id,
  etiqueta: `${a.nombre} · ${a.id === "lola" ? a.abarca.split(" ")[0] : a.area}`,
  adorno: <Personaje agente={a.id} avatar />,
  activa: i === 0,
}));

/**
 * 2. El producto en vivo (Grupo 2). Versión base: el chat de demostración
 * (guion local, sin IA) dentro del marco de navegador, como la prueba
 * principal de Atendel.
 */
export function ChatEnMarco() {
  return (
    <Seccion id="en-vivo" etiquetadaPor="en-vivo-titulo">
      <EncabezadoSeccion
        id="en-vivo-titulo"
        etiqueta="Pruébalo aquí mismo"
        titulo="Así se ve un día con tu equipo"
        texto="Escríbele a Lola como si fueras tu paciente, o abre el grupo de la recepción. Es una demostración: nada sale de esta página."
      />
      <MarcoNavegador titulo="Chat de demostración de Atendel" pestanas={PESTANAS} direccion="atendel.mx/pruebalo">
        <ChatDemo />
      </MarcoNavegador>
    </Seccion>
  );
}
