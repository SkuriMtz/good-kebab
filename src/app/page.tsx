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
 * Muestra M2: detrás va la escena de triangulitos de la v7 (fija): la
 * portada pide la constelación a la derecha y los agentes, polvo suelto.
 * Ritmo: centrado → producto en grande → pestañas → columnas asimétricas →
 * línea de tiempo → pestañas → tarjeta ancha → tarjetas de precio → acordeón → centrado.
 */
export default function Inicio() {
  return (
    <Sitio clase="sitio--inicio">
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
