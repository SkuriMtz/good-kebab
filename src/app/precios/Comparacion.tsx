import { Icono } from "@/components/base/Iconos";
import type { Plan } from "@/lib/planes";
import { planesDe, t, type Idioma } from "@/i18n";

const NOMBRE_CORTO: Record<Plan["id"], string> = { free: "Free", one: "One", max: "Max" };

/** Lo que aparta del límite de trabajo por su cuenta una tarea que investiga en internet (src/lib/tareas.ts). */
const TAREA_INTERNET = 300_000;

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
 * Qué trae cada plan (/precios#comparar): una tabla sin caja, con líneas de 1px. Los cuatro
 * agentes van en una sola fila (los traen los tres planes); luego el uso del chat y lo que traen
 * de más los planes de pago. Todo sale de src/lib/planes.ts:
 * - trabaja por su cuenta: con un límite de trabajo de al menos el de One;
 * - IA avanzada: si el plan puede usar el modelo Avanzado;
 * - tareas que investigan en internet: si el límite de la semana da para más de una.
 */
export function Comparacion({ idioma = "es" }: { idioma?: Idioma }) {
  const d = t(idioma);
  const C = d.comparacion;
  const PLANES = planesDe(idioma);
  const trabajoOne = PLANES.find((p) => p.id === "one")?.trabajo.semana ?? TAREA_INTERNET;
  const celda = (p: Plan, si: boolean) => <Celda key={p.id} plan={p} si={si} incluido={C.incluido} noIncluido={C.noIncluido} />;
  const fila = (nombre: string, si: (p: Plan) => boolean) => (
    <tr key={nombre}>
      <th scope="row" className="comparar__funcion">
        {nombre}
      </th>
      {PLANES.map((p) => celda(p, si(p)))}
    </tr>
  );
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
          {fila(C.cuatro, (p) => p.agentes.length === 4)}
          <tr>
            <th scope="row" className="comparar__funcion">
              {C.uso}
            </th>
            {PLANES.map((p) => (
              <td key={p.id} className={`comparar__cifra${p.id === "free" ? " comparar__hoy" : ""}`}>
                {p.uso}
              </td>
            ))}
          </tr>
          {fila(C.trabajo, (p) => p.trabajo.semana >= trabajoOne)}
          {fila(C.avanzada, (p) => p.modelos.includes("avanzado"))}
          {fila(C.internet, (p) => p.trabajo.semana > TAREA_INTERNET * 2)}
        </tbody>
      </table>
    </div>
  );
}
