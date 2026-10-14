import type { CSSProperties } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Caras } from "@/components/chat/Piezas";
import type { IdAgente } from "@/lib/agentes";

/**
 * El personaje de un agente en su círculo de color (la única "ilustración"
 * del dashboard). Tamaños de la base: mini 28 · chica 40 · normal 48 · grande 64.
 */
export function MarcaAgente({
  agente,
  tam = "mini",
  apagado = false,
  className = "",
}: {
  agente: IdAgente;
  tam?: "mini" | "chica" | "normal" | "grande";
  /** Fuera del plan: más tenue. */
  apagado?: boolean;
  className?: string;
}) {
  const clase =
    tam === "mini" ? "marca-agente--mini" : tam === "chica" ? "marca-agente--chica" : tam === "grande" ? "marca-agente--grande" : "";
  return (
    <span
      className={`marca-agente ${clase} ${apagado ? "tablero-apagado" : ""} ${className}`}
      style={{ "--agente": `var(--agente-${agente})` } as CSSProperties}
      aria-hidden="true"
    >
      <Personaje agente={agente} avatar />
    </span>
  );
}

/**
 * Uno o varios agentes: el personaje solo; un grupo chico (28px) como dos
 * personajes encimados; un grupo grande (40px) con las caras del chat.
 */
export function MarcaConversacion({ agentes, tam = 28 }: { agentes: readonly IdAgente[]; tam?: 28 | 40 }) {
  if (agentes.length === 1) return <MarcaAgente agente={agentes[0]} tam={tam === 28 ? "mini" : "chica"} />;
  if (tam === 28)
    return (
      <span className="marcas-grupo" aria-hidden="true">
        {agentes.slice(0, 2).map((a) => (
          <MarcaAgente key={a} agente={a} className="marcas-grupo__una" />
        ))}
      </span>
    );
  return <Caras agentes={agentes} tam={tam} />;
}
