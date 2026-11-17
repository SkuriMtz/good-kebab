import type { CSSProperties } from "react";
import { Marca } from "@/components/Logo";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { AvatarAgente } from "./Mensajes";
import { Enlace, retrasoEscalon } from "./Piezas";

/**
 * «Hoy»: lo que hay debajo del saludo y la caja de Atendel. Tres secciones
 * en una sola columna, con filas y líneas finas (como Citas):
 * - Te necesita: todo lo que espera tu OK o tu revisión (máximo 5 filas).
 * - Lo que viene: las próximas corridas del Piloto automático y tus citas.
 * - Lo que ya hice: lo último que se terminó, con quién lo hizo.
 * Los agentes trabajan «en la cocina»: aquí solo se ven como la firma chica
 * de quién preparó o hizo cada cosa. Sin datos que inventar: lo mismo sirve
 * para /panel (datos reales) y /pruebalo (ejemplo).
 */

export type FilaTeNecesita = {
  id: string;
  titulo: string;
  detalle?: string;
  /** Quién lo preparó; sin agente, la firma es Atendel. */
  agente?: IdAgente;
  href: string;
};
export type FilaViene = { id: string; titulo: string; cuando: string };
export type FilaHecha = { id: string; titulo: string; agente: IdAgente; hace: string; href?: string };

/** La firma chica: el personaje y su nombre (o el logo de Atendel si no es de un agente). */
export function Firma({ agente }: { agente?: IdAgente }) {
  return (
    <span className="pc-hoy__firma">
      {agente ? <AvatarAgente agente={agente} tam={18} /> : <Marca className="pc-hoy__marca" />}
      <span>{agente ? AGENTE_POR_ID[agente].nombre : "Atendel"}</span>
    </span>
  );
}

const MAX_FILAS = 5;
const MAX_HECHO = 3;
const entra = (i: number) => ({ "--d": `${retrasoEscalon(i)}ms` }) as CSSProperties;

export function Hoy({
  teNecesita,
  total,
  hrefTeNecesita,
  viene,
  hrefPiloto,
  hrefCitas,
  hecho,
  hrefHecho,
}: {
  teNecesita: FilaTeNecesita[];
  /** Cuánto espera en total (puede ser más que las filas que se ven). */
  total: number;
  hrefTeNecesita: string;
  viene: FilaViene[];
  hrefPiloto: string;
  hrefCitas: string;
  hecho: FilaHecha[];
  hrefHecho: string;
}) {
  const filas = teNecesita.slice(0, MAX_FILAS);
  return (
    <div className="pc-hoy">
      <section className="pc-hoy__bloque" aria-labelledby="pc-hoy-necesita">
        <header className="pc-hoy__cabeza">
          <h2 id="pc-hoy-necesita" className="pc-hoy__titulo">
            Te necesita
            {total > 0 ? <span className="pc-hoy__cuenta cifras">{total}</span> : null}
          </h2>
          {total > 0 ? (
            <Enlace href={hrefTeNecesita} className="pc-hoy__ver">
              Ver todo ({total})
            </Enlace>
          ) : null}
        </header>
        {filas.length ? (
          <ul className="pc-hoy__filas">
            {filas.map((f, i) => (
              <li key={f.id} className="pc-entra" style={entra(i)}>
                <Enlace href={f.href} className="pc-hoy__fila">
                  <span className="pc-hoy__textos">
                    <span className="pc-hoy__que">{f.titulo}</span>
                    {f.detalle ? <span className="pc-hoy__detalle">{f.detalle}</span> : null}
                  </span>
                  <Firma agente={f.agente} />
                </Enlace>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pc-hoy__vacio">
            <Icono nombre="check" tam={16} trazo={2} />
            Nada te espera. Todo al día.
          </p>
        )}
      </section>

      <section className="pc-hoy__bloque" aria-labelledby="pc-hoy-viene">
        <header className="pc-hoy__cabeza">
          <h2 id="pc-hoy-viene" className="pc-hoy__titulo">
            Lo que viene
          </h2>
          <Enlace href={hrefPiloto} className="pc-hoy__ver">
            Ver piloto automático
          </Enlace>
        </header>
        <ul className="pc-hoy__filas">
          {viene.map((f, i) => (
            <li key={f.id} className="pc-entra" style={entra(i)}>
              <Enlace href={hrefPiloto} className="pc-hoy__fila">
                <span className="pc-hoy__textos">
                  <span className="pc-hoy__que">{f.titulo}</span>
                  <span className="pc-hoy__detalle">{f.cuando}</span>
                </span>
              </Enlace>
            </li>
          ))}
          <li className="pc-entra" style={entra(viene.length)}>
            <Enlace href={hrefCitas} className="pc-hoy__fila">
              <span className="pc-hoy__textos">
                <span className="pc-hoy__que">Ver tus citas de hoy</span>
              </span>
              <Icono nombre="chevron-derecha" tam={16} />
            </Enlace>
          </li>
        </ul>
        {!viene.length ? <p className="pc-hoy__nota">Aún no hay nada programado. Pídele a Atendel algo como «cada lunes revisa mis ventas».</p> : null}
      </section>

      <section className="pc-hoy__bloque" aria-labelledby="pc-hoy-hecho">
        <header className="pc-hoy__cabeza">
          <h2 id="pc-hoy-hecho" className="pc-hoy__titulo">
            Lo que ya hice
          </h2>
          {hecho.length ? (
            <Enlace href={hrefHecho} className="pc-hoy__ver">
              Ver todo
            </Enlace>
          ) : null}
        </header>
        {hecho.length ? (
          <ul className="pc-hoy__filas">
            {hecho.slice(0, MAX_HECHO).map((f, i) => {
              const dentro = (
                <>
                  <span className="pc-hoy__textos">
                    <span className="pc-hoy__que">{f.titulo}</span>
                    <span className="pc-hoy__detalle">{f.hace}</span>
                  </span>
                  <Firma agente={f.agente} />
                </>
              );
              return (
                <li key={f.id} className="pc-entra" style={entra(i)}>
                  {f.href ? (
                    <Enlace href={f.href} className="pc-hoy__fila">
                      {dentro}
                    </Enlace>
                  ) : (
                    <div className="pc-hoy__fila pc-hoy__fila--quieta">{dentro}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="pc-hoy__vacio">Todavía no he terminado nada. Pídeme algo arriba.</p>
        )}
      </section>
    </div>
  );
}

/** «hace 5 min», «hace 3 h», «ayer», «12 nov»: lo corto que cabe en una línea gris. */
export function haceTexto(iso: string, ahora: number, zona = "America/Mexico_City") {
  const min = Math.max(0, Math.round((ahora - Date.parse(iso)) / 60_000));
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  if (min < 60 * 24) return `hace ${Math.round(min / 60)} h`;
  const dia = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: zona }).format(new Date(t));
  if (dia(Date.parse(iso)) === dia(ahora - 86_400_000)) return "ayer";
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: zona }).format(new Date(iso)).replace(".", "");
}
