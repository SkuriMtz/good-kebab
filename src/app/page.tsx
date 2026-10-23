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
 * Inicio con el estilo de diseno/vercel (lección 14). Cada sección vive en su
 * archivo de src/components/inicio/; aquí solo se decide el orden. Un solo
 * lienzo (sin cambios de fondo entre bandas) y los fragmentos de fondo fijos
 * y en gris, en las orillas. Ritmo: portada en tres zonas → dos columnas con
 * el producto → cuadrícula de agentes → dos columnas con la terminal →
 * cuadrícula de pasos → pestañas → cuadrícula de garantías → precios →
 * preguntas → cierre.
 */
export default function Inicio() {
  return (
    <Sitio>
      <Portada />
      <ChatEnMarco />
      <Agentes />
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
