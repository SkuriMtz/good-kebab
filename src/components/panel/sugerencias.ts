"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { IDS_AGENTES, esIdAgente, type IdAgente } from "@/lib/agentes";

/**
 * Ejemplos de lo que se le puede pedir a cada quien. Uno al azar sale de
 * muestra en la caja de una conversación nueva (en vez de "Pregúntale a tu
 * equipo…"): con todo el equipo, de cualquiera; con un agente, de los suyos.
 * Solo cosas que el equipo sí hace (Stripe: cobros, saldo y quién paga más).
 */
export const SUGERENCIAS: Record<IdAgente, readonly string[]> = {
  lola: ["Contesta los mensajes de WhatsApp de hoy", "Confirma las citas de mañana", "Pásale la cita de las 4 al viernes", "Avísale a quien canceló que se abrió un lugar"],
  clara: ["Resume los correos importantes de hoy", "Contéstale al proveedor que mandó la factura", "Busca el correo donde viene el contrato", "Ayúdame a responder la queja de ayer"],
  victor: ["Escríbeles a los clientes que no han vuelto", "Dale seguimiento a quien preguntó precios", "Pide una reseña a los clientes de esta semana", "¿Quiénes son los clientes que más me compran?"],
  iris: ["Hazme un Excel con las ventas de la semana", "Revisa en Stripe cuánto cobré este mes", "Arma una presentación con los números del mes", "Compara en una tabla los precios de 3 proveedores", "¿Quién me ha pagado más en Stripe?"],
};

/** En el navegador, antes de pintar (sin parpadeo); en el servidor no hace nada. */
const antesDePintar = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Una sugerencia al azar para los agentes de la conversación nueva. El
 * servidor y la primera pasada del navegador usan la primera (igual en los
 * dos, sin errores de hidratación); justo después se elige una al azar.
 */
export function useSugerencia(agentes: readonly IdAgente[]) {
  const clave = agentes.join(",");
  const [texto, setTexto] = useState(() => SUGERENCIAS[agentes[0] ?? "lola"][0]);
  antesDePintar(() => {
    const ids = clave.split(",").filter(esIdAgente);
    const lista = (ids.length ? ids : IDS_AGENTES).flatMap((id) => SUGERENCIAS[id]);
    setTexto(lista[Math.floor(Math.random() * lista.length)]);
  }, [clave]);
  return texto;
}
