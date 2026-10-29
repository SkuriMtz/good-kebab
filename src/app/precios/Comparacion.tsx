import type { CSSProperties } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Icono } from "@/components/base/Iconos";
import type { IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";
import type { Plan } from "@/lib/planes";
import { agenteDe, numero, planesDe, t, type Idioma } from "@/i18n";

const NOMBRE_CORTO: Record<Plan["id"], string> = { free: "Free", one: "One", max: "Max" };

/** Los agentes en el orden en que se suman: Clara (Free), Lola (One), Víctor e Iris (Max). */
const ORDEN: IdAgente[] = ["clara", "lola", "victor", "iris"];

function Celda({ si, plan, incluido, noIncluido }: { si: boolean; plan: Plan; incluido: string; noIncluido: string }) {
  return (
    <td className={plan.id === "free" ? "comparar__hoy" : undefined}>
      {si ? (
        <Icono nombre="check" tam={20} tono="cielo" titulo={incluido} />
      ) : (
        <span className="comparar__no">
          <span aria-hidden="true">—</span>
          <span className="sr-only">{noIncluido}</span>
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
export function Comparacion({ idioma = "es" }: { idioma?: Idioma }) {
  const d = t(idioma);
  const C = d.comparacion;
  /** Funciones del chat que aparecen tal cual en "incluye" de cada plan (src/i18n). */
  const FUNCIONES = C.funciones;
  const PLANES = planesDe(idioma);
  const celda = (p: Plan, si: boolean) => <Celda key={p.id} plan={p} si={si} incluido={C.incluido} noIncluido={C.noIncluido} />;
  return (
    <div className="comparar" role="region" aria-labelledby="comparar-titulo" tabIndex={0}>
      <table className="comparar__tabla">
        <caption className="sr-only">{C.caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="comparar__esquina">
              <span className="sr-only">{C.agenteOFuncion}</span>
            </th>
            {PLANES.map((p) => (
              <th key={p.id} scope="col" className={p.id === "free" ? "comparar__hoy" : undefined}>
                <span className="comparar__plan">{NOMBRE_CORTO[p.id]}</span>
                <span className="comparar__precio">{p.precio ?? d.tarjetasPlanes.proximamente}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="comparar__grupo">
            <th scope="colgroup" colSpan={4}>
              {C.agentes}
            </th>
          </tr>
          {ORDEN.map((a) => {
            const info = agenteDe(idioma, a);
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
                {PLANES.map((p) => celda(p, p.agentes.includes(a)))}
              </tr>
            );
          })}
          <tr className="comparar__grupo">
            <th scope="colgroup" colSpan={4}>
              {C.enElChat}
            </th>
          </tr>
          <tr>
            <th scope="row" className="comparar__funcion">
              {C.mensajesMes}
            </th>
            {PLANES.map((p) => (
              <td key={p.id} className={`comparar__cifra${p.id === "free" ? " comparar__hoy" : ""}`}>
                {numero(idioma, p.mensajesMes)}
              </td>
            ))}
          </tr>
          {FUNCIONES.map((f) => (
            <tr key={f}>
              <th scope="row" className="comparar__funcion">
                {f}
              </th>
              {PLANES.map((p) => celda(p, p.incluye.includes(f)))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
