import { Sitio } from "@/components/Sitio";
import { Agentes } from "@/components/inicio/Agentes";
import { ChatEnMarco } from "@/components/inicio/ChatEnMarco";
import { ComoFunciona } from "@/components/inicio/ComoFunciona";
import { CtaFinal } from "@/components/inicio/CtaFinal";
import { ParaQuien } from "@/components/inicio/ParaQuien";
import { Portada } from "@/components/inicio/Portada";
import { Precios } from "@/components/inicio/Precios";
import { PreguntasInicio } from "@/components/inicio/PreguntasInicio";
import { QueEs } from "@/components/inicio/QueEs";
import { Seguridad } from "@/components/inicio/Seguridad";

/*
 * Inicio, en el orden de diseno/plan.md. Cada sección vive en su archivo de
 * src/components/inicio/ y la trabaja su grupo; aquí solo se decide el orden.
 * El inicio empieza por escenas, como la versión 7: detrás, la figura de
 * triangulitos (fondo="figuras") cambia de forma por sección: burbuja en la
 * portada y globo junto a la lista de Tu equipo. Por eso Tu equipo sube
 * justo después de la portada; el chat de demostración sigue enseguida.
 * En el resto (data-escena="vacio") la figura se deshace para no tapar texto.
 */
export default function Inicio() {
  return (
    <Sitio fondo="figuras">
      <Portada />
      <Agentes />
      <div data-escena="vacio">
        <ChatEnMarco />
        <QueEs />
        <ComoFunciona />
        <ParaQuien />
        <Seguridad />
        <Precios />
        <PreguntasInicio />
        <CtaFinal />
      </div>
    </Sitio>
  );
}
