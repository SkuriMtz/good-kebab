"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IDS_AGENTES, esIdAgente, type IdAgente } from "@/lib/agentes";

/**
 * Ejemplos de lo que se le puede pedir a cada quien. En la caja de una
 * conversación nueva (en vez de "Pregúntale a tu equipo…") van saliendo al
 * azar, uno tras otro: con todo el equipo, de cualquiera; con un agente, de
 * los suyos. Solo cosas que el equipo sí hace (Stripe: cobros, saldo y
 * quién paga más).
 */
export const SUGERENCIAS: Record<IdAgente, readonly string[]> = {
  lola: [
    "Contesta los mensajes de WhatsApp de hoy",
    "Confirma las citas de mañana",
    "Pásale la cita de las 4 al viernes",
    "Avísale a quien canceló que se abrió un lugar",
    "¿Qué horarios tengo libres el jueves?",
    "Recuérdales su cita a los de la tarde",
    "Contéstale a quien preguntó por los horarios",
    "Agenda a un cliente nuevo el lunes a las 10",
  ],
  clara: [
    "Resume los correos importantes de hoy",
    "Contéstale al proveedor que mandó la factura",
    "Busca el correo donde viene el contrato",
    "Ayúdame a responder la queja de ayer",
    "¿Qué correos llevan días sin respuesta?",
    "Redacta un correo para pedir una cotización",
    "Junta las facturas que llegaron esta semana",
  ],
  victor: [
    "Escríbeles a los clientes que no han vuelto",
    "Dale seguimiento a quien preguntó precios",
    "Pide una reseña a los clientes de esta semana",
    "¿Quiénes son los clientes que más me compran?",
    "Manda una promoción a los clientes frecuentes",
    "¿Quién dejó de venir en los últimos 3 meses?",
    "Agradécele a quien nos recomendó",
  ],
  iris: [
    "Hazme un Excel con las ventas de la semana",
    "Revisa en Stripe cuánto cobré este mes",
    "Arma una presentación con los números del mes",
    "Compara en una tabla los precios de 3 proveedores",
    "¿Quién me ha pagado más en Stripe?",
    "¿Cuánto saldo tengo en Stripe?",
    "Haz un resumen de la semana en una hoja",
    "Pasa los pagos de hoy a un Excel",
  ],
};

/** Cada cuánto cambia la sugerencia y cuánto tarda en desvanecerse la anterior. */
const CADA_MS = 3800;
const FUNDIDO_MS = 220;

/** En el navegador, antes de pintar (sin parpadeo); en el servidor no hace nada. */
const antesDePintar = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Revuelve una copia (Fisher-Yates). */
function revolver<T>(lista: readonly T[]) {
  const r = [...lista];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/**
 * La sugerencia de la caja, al azar y cambiando sola: sale una bolsa
 * revuelta con todas las de esos agentes; se van sacando una por una (no se
 * repite ninguna hasta que salen todas) y al acabarse se revuelve otra vez
 * sin repetir la última. Cada 3.8 s la actual se desvanece y entra la
 * siguiente (`cambiando` dura 220ms: con él la caja apaga el texto de
 * muestra). No cambia con la pestaña oculta ni con "reducir movimiento"
 * (ahí solo se elige una al azar). El servidor y la primera pasada del
 * navegador usan la primera de la lista (sin errores de hidratación).
 */
export function useSugerencia(agentes: readonly IdAgente[], rotar = true) {
  const clave = agentes.join(",");
  const [texto, setTexto] = useState(() => SUGERENCIAS[agentes[0] ?? "lola"][0]);
  const [cambiando, setCambiando] = useState(false);
  const bolsa = useRef<string[]>([]);
  const ultima = useRef("");

  antesDePintar(() => {
    const ids = clave.split(",").filter(esIdAgente);
    const todas = (ids.length ? ids : IDS_AGENTES).flatMap((id) => SUGERENCIAS[id]);
    bolsa.current = [];
    const siguiente = () => {
      if (bolsa.current.length === 0) {
        bolsa.current = revolver(todas);
        // La primera de la bolsa nueva no puede ser la que se acaba de ver
        if (bolsa.current.length > 1 && bolsa.current[bolsa.current.length - 1] === ultima.current) {
          [bolsa.current[0], bolsa.current[bolsa.current.length - 1]] = [bolsa.current[bolsa.current.length - 1], bolsa.current[0]];
        }
      }
      const t = bolsa.current.pop() ?? todas[0];
      ultima.current = t;
      return t;
    };
    setTexto(siguiente());
    setCambiando(false);
    if (!rotar || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let fundido = 0;
    const reloj = window.setInterval(() => {
      if (document.hidden) return;
      setCambiando(true);
      fundido = window.setTimeout(() => {
        setTexto(siguiente());
        setCambiando(false);
      }, FUNDIDO_MS);
    }, CADA_MS);
    return () => {
      window.clearInterval(reloj);
      window.clearTimeout(fundido);
    };
  }, [clave, rotar]);

  return { texto, cambiando };
}
