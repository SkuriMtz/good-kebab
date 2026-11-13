"use client";

import { useState } from "react";
import { Icono } from "@/components/base/Iconos";
import { Enlace, Odometro } from "./Piezas";

/**
 * El aviso arriba de la caja del Inicio, como el de uso de Claude: un
 * recuadro de una línea con el reloj, "3 esperan tu visto bueno", el botón
 * "Revisar" (lleva a Pendientes) y la ✕ que lo oculta hasta que vuelvas a
 * entrar. Sin pendientes (o sin poder leerlos) no sale.
 */
export function FranjaPendientes({ n, href }: { n: number | null; href: string }) {
  const [oculta, setOculta] = useState(false);
  if (n === null || n <= 0 || oculta) return null;
  return (
    <div className="pc-franja" role="status">
      <Icono nombre="reloj" tam={20} className="pc-franja__icono" />
      <span className="pc-franja__texto">
        {n} {n === 1 ? "espera" : "esperan"} tu visto bueno
      </span>
      <Enlace href={href} className="pc-franja__boton">
        Revisar
      </Enlace>
      <button type="button" className="pc-franja__cerrar" onClick={() => setOculta(true)} aria-label="Ocultar este aviso" title="Ocultar">
        <Icono nombre="cerrar" tam={18} />
      </button>
    </div>
  );
}

/** "Max  43 % usado" a la derecha, debajo de la caja (como "Opus 5.5 Medium" en Claude): lleva a Ajustes. */
export function UsoPlan({ plan, usados, total, href }: { plan: string; usados: number; total: number; href: string }) {
  const pct = Math.min(100, Math.round((usados / Math.max(1, total)) * 100));
  return (
    <Enlace href={href} className="pc-uso" aria-label={`Atendel ${plan}: ${pct} % de los mensajes del mes usados. Ver tu plan`}>
      <span className="pc-uso__plan">{plan}</span>
      <span className="pc-uso__tenue" aria-hidden="true">
        <Odometro valor={pct} /> % usado
      </span>
    </Enlace>
  );
}
