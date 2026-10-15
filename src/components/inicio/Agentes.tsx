import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { VitrinaAgentes } from "@/components/agentes/VitrinaAgentes";

/**
 * 3. Los cuatro agentes (Grupo 3 · G3-T1). Como la fila de funciones de la
 * portada de GitHub: pestañas en píldora con el personaje de cada agente y,
 * debajo, un panel de vidrio con qué hace y su conversación de ejemplo dentro
 * de una ventana del producto.
 */
export function Agentes() {
  return (
    <Seccion id="agentes" etiquetadaPor="agentes-titulo">
      <EncabezadoSeccion
        id="agentes-titulo"
        etiqueta="Tu equipo"
        titulo="Cuatro agentes, cada uno con su trabajo"
        texto="Uno contesta WhatsApp y agenda, otra lleva tu correo, otro trae de regreso a tus clientes y otra hace el trabajo de oficina. Elige uno para ver cómo trabaja."
      />
      <VitrinaAgentes />
    </Seccion>
  );
}
