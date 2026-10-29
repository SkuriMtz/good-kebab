import type { CSSProperties } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";
import { PLANES, type Plan } from "@/lib/planes";

const NOMBRE_CORTO: Record<Plan["id"], string> = { free: "Free", one: "One", max: "Max" };

/** Los agentes en el orden en que se suman: Clara (Free), Lola (One), Víctor e Iris (Max). */
const ORDEN: IdAgente[] = ["clara", "lola", "victor", "iris"];

/** Funciones del chat que aparecen tal cual en "incluye" de src/lib/planes.ts. */
const FUNCIONES = ["Chats en grupo con tus agentes", "Eliges quién está en tu equipo", "Respuestas más elaboradas"];

function Celda({ si, plan }: { si: boolean; plan: Plan }) {
  return (
    <td className={plan.id === "free" ? "comparar__hoy" : undefined}>
      {si ? (
        <Icono nombre="check" tam={20} tono="cielo" titulo="Incluido" />
      ) : (
        <span className="comparar__no">
          <span aria-hidden="true">—</span>
          <span className="sr-only">No incluido</span>
        </span>
      )}
    </td>
  );
}

/**
 * Comparación por agente (/precios#comparar): una tabla de verdad, sin
 * caja, con líneas de 1px como las tablas de comparación de Apple. Cada fila
 * es un agente con su personaje; las columnas, los planes. Todo sale de
 * src/lib/planes.ts (agentes, mensajes al mes y lo que incluye).
 */
export function Comparacion() {
  return (
    <div className="comparar" role="region" aria-labelledby="comparar-titulo" tabIndex={0}>
      <table className="comparar__tabla">
        <caption className="sr-only">Qué agentes y funciones trae cada plan de Atendel</caption>
        <thead>
          <tr>
            <th scope="col" className="comparar__esquina">
              <span className="sr-only">Agente o función</span>
            </th>
            {PLANES.map((p) => (
              <th key={p.id} scope="col" className={p.id === "free" ? "comparar__hoy" : undefined}>
                <span className="comparar__plan">{NOMBRE_CORTO[p.id]}</span>
                <span className="comparar__precio">{p.precio ?? "Próximamente"}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="comparar__grupo">
            <th scope="colgroup" colSpan={4}>
              Agentes
            </th>
          </tr>
          {ORDEN.map((a) => {
            const info = AGENTE_POR_ID[a];
            return (
              <tr key={a}>
                <th scope="row">
                  <span className="comparar__agente">
                    <span
                      className="marca-agente marca-agente--chica"
                      style={{ "--agente": PERSONAJES[a].color } as CSSProperties}
                      aria-hidden="true"
                    >
                      <Personaje agente={a} avatar />
                    </span>
                    <span>
                      <span className="comparar__nombre">
                        {info.nombre} <span className="comparar__area">· {info.area}</span>
                      </span>
                      <span className="comparar__abarca">{info.abarca}</span>
                    </span>
                  </span>
                </th>
                {PLANES.map((p) => (
                  <Celda key={p.id} plan={p} si={p.agentes.includes(a)} />
                ))}
              </tr>
            );
          })}
          <tr className="comparar__grupo">
            <th scope="colgroup" colSpan={4}>
              En el chat
            </th>
          </tr>
          <tr>
            <th scope="row" className="comparar__funcion">
              Mensajes al mes
            </th>
            {PLANES.map((p) => (
              <td key={p.id} className={`comparar__cifra${p.id === "free" ? " comparar__hoy" : ""}`}>
                {p.mensajesMes.toLocaleString("es-MX")}
              </td>
            ))}
          </tr>
          {FUNCIONES.map((f) => (
            <tr key={f}>
              <th scope="row" className="comparar__funcion">
                {f}
              </th>
              {PLANES.map((p) => (
                <Celda key={p.id} plan={p} si={p.incluye.includes(f)} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
