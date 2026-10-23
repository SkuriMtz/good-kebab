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
 * La portada va en #000 (con la escena 3D adentro); el resto, en #0d1117.
 * Ritmo: centrado → producto en grande → pestañas → columnas asimétricas →
 * línea de tiempo → pestañas → tarjeta ancha → tarjetas de precio → acordeón → centrado.
 */
export default function Inicio() {
  return (
    <Sitio fondo="ninguno">
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
