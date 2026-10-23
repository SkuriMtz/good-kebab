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
 * Muestra M1 ("la v7 de regreso"): el inicio empieza por escenas, como la
 * versión 7. Detrás, la figura de triangulitos (fondo="figuras") cambia de
 * forma por sección: burbuja en la portada y polvo arriba en Tu equipo.
 * Por eso Tu equipo sube justo después de la portada; el chat de
 * demostración sigue enseguida.
 */
export default function Inicio() {
  return (
    <Sitio fondo="figuras">
      <Portada />
      <Agentes />
      <ChatEnMarco />
      <QueEs />
      <ComoFunciona />
      <ParaQuien />
      <Seguridad />
      <Precios />
      <PreguntasInicio />
      <CtaFinal />
    </Sitio>
  );
}
