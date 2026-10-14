import type { CSSProperties } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import type { IdAgente } from "@/lib/agentes";

type Tam = "mini" | "chica" | "media";

// Clases completas para que Tailwind no las descarte al compilar
const CLASE: Record<Tam, string> = {
  mini: "marca-agente dash-cara dash-cara--mini",
  chica: "marca-agente dash-cara dash-cara--chica",
  media: "marca-agente dash-cara dash-cara--media",
};

/** El personaje de un agente en su círculo de color (su identidad: no es un ícono decorativo). */
export function Cara({ agente, tam = "mini", className = "" }: { agente: IdAgente; tam?: Tam; className?: string }) {
  return (
    <span className={`${CLASE[tam]} ${className}`} style={{ "--agente": `var(--agente-${agente})` } as CSSProperties} aria-hidden="true">
      <Personaje agente={agente} avatar />
    </span>
  );
}

/** Varios agentes encimados (un grupo). Cada cara lleva un filo del color del fondo para separarse. */
export function Caras({ agentes, tam = "mini" }: { agentes: IdAgente[]; tam?: Tam }) {
  if (agentes.length === 1) return <Cara agente={agentes[0]} tam={tam} />;
  return (
    <span className={tam === "mini" ? "dash-caras dash-caras--mini" : "dash-caras dash-caras--chica"} aria-hidden="true">
      {agentes.slice(0, 3).map((a) => (
        <Cara key={a} agente={a} tam={tam} />
      ))}
    </span>
  );
}
