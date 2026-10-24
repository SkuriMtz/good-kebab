import type { CSSProperties } from "react";
import { Boton } from "./base/Boton";
import { Etiqueta } from "./base/Etiqueta";
import { Icono } from "./base/Iconos";
import { Personaje } from "./agentes/Personaje";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";
import { PLANES, type Plan } from "@/lib/planes";

const NOMBRE_CORTO: Record<Plan["id"], string> = { free: "Free", one: "One", max: "Max" };

/** Las líneas de "incluye" que nombran agentes ya se ven en la fila del equipo (con sus personajes). */
const NOMBRA_AGENTES = /^(Lola|Clara|Víctor|Iris),|^Los \d agentes/;

function listaNombres(nombres: string[]) {
  if (nombres.length <= 1) return nombres.join("");
  return `${nombres.slice(0, -1).join(", ")} ${nombres.length > 2 ? "e" : "y"} ${nombres[nombres.length - 1]}`;
}

/**
 * Los tres planes (Free, One, Max) de src/lib/planes.ts en UN solo panel de
 * vidrio: tres columnas separadas por líneas de 1px, con las filas alineadas
 * entre columnas (subgrid): nombre, precio, equipo, lo que incluye y botón.
 * Free —el único que se puede usar hoy— va resaltado con sutileza (filo
 * #8c93fb arriba y una capa más de vidrio) y lleva el único botón principal.
 * One y Max, sin precio publicado, invitan a la lista de espera con botón
 * fantasma. No hay ningún botón que cambie el plan de una cuenta.
 */
export function Planes({
  hrefLista = "/lista",
  nivelTitulo = 3,
}: {
  /** A dónde lleva "Avísame cuando abra" (en el inicio, al formulario de la misma página). */
  hrefLista?: string;
  nivelTitulo?: 2 | 3;
}) {
  const Titulo = `h${nivelTitulo}` as "h2" | "h3";
  return (
    <ol className="planes" aria-label="Planes de Atendel">
      {PLANES.map((p) => {
        const hoy = p.id === "free";
        const nombres = p.agentes.map((a) => AGENTE_POR_ID[a].nombre);
        const resto = p.incluye.filter((x) => !NOMBRA_AGENTES.test(x));
        return (
          <li key={p.id} className={`plan${hoy ? " plan--hoy" : ""}`} aria-labelledby={`plan-${p.id}`}>
            <div className="plan__cabeza">
              <Etiqueta tono={hoy ? "cielo" : "tenue"}>{hoy ? "Disponible hoy" : `Atendel · ${p.nivel}`}</Etiqueta>
              <Titulo id={`plan-${p.id}`} className="plan__nombre">
                <span className="sr-only">Atendel </span>
                {NOMBRE_CORTO[p.id]}
              </Titulo>
            </div>

            <div className="plan__precio">
              <p className={`plan__monto${p.precio ? "" : " plan__monto--pronto"}`}>{p.precio ?? "Próximamente"}</p>
              <p className="t-cuerpo">{p.resumen}</p>
            </div>

            <div className="plan__equipo">
              <ul className="plan__caras" aria-label={`Agentes: ${listaNombres(nombres)}`}>
                {p.agentes.map((a) => (
                  <li
                    key={a}
                    className="marca-agente marca-agente--chica"
                    style={{ "--agente": PERSONAJES[a].color } as CSSProperties}
                    title={`${AGENTE_POR_ID[a].nombre} · ${AGENTE_POR_ID[a].area}`}
                  >
                    <Personaje agente={a} avatar />
                  </li>
                ))}
              </ul>
              <p className="t-chico" aria-hidden="true">
                {p.agentes.length === 1
                  ? `${nombres[0]} · ${AGENTE_POR_ID[p.agentes[0]].area}`
                  : p.agentes.length === 4
                    ? "Los cuatro agentes"
                    : listaNombres(nombres)}
              </p>
            </div>

            <ul className="plan__incluye">
              {resto.map((x) => (
                <li key={x}>
                  <Icono nombre="check" tam={16} tono="cielo" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>

            <div className="plan__accion">
              {hoy ? (
                <Boton href="/entrar" tam="grande" bloque>
                  Empieza gratis
                </Boton>
              ) : (
                <Boton href={hrefLista} variante="fantasma" tam="grande" bloque>
                  Avísame cuando abra
                </Boton>
              )}
              <p className="t-caption">{hoy ? "Entras con tu correo, sin contraseña." : "Precio por anunciar."}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
