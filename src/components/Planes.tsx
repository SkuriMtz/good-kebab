import Link from "next/link";
import { Boton } from "./base/Boton";
import { Etiqueta } from "./base/Etiqueta";
import { Icono } from "./base/Iconos";
import { BotonLista } from "./inicio-dala/BotonLista";
import { planesDe, t, type Idioma } from "@/i18n";
import type { Plan } from "@/lib/planes";

const NOMBRE_CORTO: Record<Plan["id"], string> = { free: "Free", one: "One", max: "Max" };

/**
 * Los tres planes (Free, One, Max) de src/lib/planes.ts en UN solo panel de
 * vidrio: tres columnas separadas por líneas de 1px, con las filas alineadas
 * entre columnas (subgrid): nombre, precio, «Incluye los 4 agentes» (los tres
 * los traen, así que va en una línea, sin las caras), lo que incluye y botón.
 * Free —el único que se puede usar hoy— va resaltado con sutileza (filo
 * #8c93fb arriba y una capa más de vidrio) y lleva el único botón principal.
 * One y Max, sin precio publicado, invitan a la lista de espera con botón
 * fantasma. No hay ningún botón que cambie el plan de una cuenta.
 */
export function Planes({
  hrefLista = "/lista",
  nivelTitulo = 3,
  idioma = "es",
  variante = "normal",
}: {
  /** A dónde lleva "Avísame cuando abra" (en el inicio, al formulario de la misma página). */
  hrefLista?: string;
  nivelTitulo?: 2 | 3;
  idioma?: Idioma;
  /**
   * "inicio": con el estilo del inicio (negro, líneas finas, violeta solo en
   * los botones); Free lleva a entrar y One y Max abren la lista de espera ahí mismo.
   */
  variante?: "normal" | "inicio";
}) {
  const Titulo = `h${nivelTitulo}` as "h2" | "h3";
  const d = t(idioma);
  const T = d.tarjetasPlanes;
  const inicio = variante === "inicio";
  return (
    <ol className={`planes${inicio ? " planes--inicio" : ""}`} aria-label={T.aria}>
      {planesDe(idioma).map((p) => {
        const hoy = p.id === "free";
        return (
          <li key={p.id} className={`plan${hoy ? " plan--hoy" : ""}`} aria-labelledby={`plan-${p.id}`}>
            <div className="plan__cabeza">
              <Etiqueta tono={hoy && !inicio ? "cielo" : "tenue"}>{hoy ? T.disponibleHoy : T.nivel(p.nivel)}</Etiqueta>
              <Titulo id={`plan-${p.id}`} className="plan__nombre">
                <span className="sr-only">Atendel </span>
                {NOMBRE_CORTO[p.id]}
              </Titulo>
            </div>

            <div className="plan__precio">
              <p className={`plan__monto${p.precio ? "" : " plan__monto--pronto"}`}>{p.precio ?? T.proximamente}</p>
              <p className="t-cuerpo">{p.resumen}</p>
            </div>

            <div className="plan__equipo">
              <p className="plan__cuatro">{T.incluyeCuatro}</p>
            </div>

            <ul className="plan__incluye">
              {p.incluye.map((x) => (
                <li key={x}>
                  <Icono nombre="check" tam={16} tono={inicio ? undefined : "cielo"} />
                  <span>{x}</span>
                </li>
              ))}
            </ul>

            <div className="plan__accion">
              {inicio ? (
                hoy ? (
                  <Link href="/entrar" className="boton-lista plan__boton">
                    <span className="boton-lista__texto">{T.empiezaGratis}</span>
                  </Link>
                ) : (
                  <BotonLista className="boton-lista--contorno plan__boton">{T.unete}</BotonLista>
                )
              ) : hoy ? (
                <Boton href="/entrar" tam="grande" bloque>
                  {T.empiezaGratis}
                </Boton>
              ) : (
                <Boton href={hrefLista} variante="fantasma" tam="grande" bloque>
                  {T.avisame}
                </Boton>
              )}
              <p className="t-caption">{hoy ? T.sinContrasena : T.porAnunciar}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
