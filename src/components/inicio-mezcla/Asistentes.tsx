import Link from "next/link";
import type { CSSProperties } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { IDS_AGENTES, type IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";
import { agenteDe, type Idioma } from "@/i18n";
import { Etiqueta } from "./Piezas";
import { textosAsistentes } from "./asistentes-textos";

const ICONOS: NombreIcono[] = ["mensaje", "agentes", "check-circulo"];

/**
 * «Tus asistentes de IA» (el inicio): qué son y cómo trabajan, rápido y sin párrafos. Las cuatro
 * tarjetas dicen quién es cada uno y qué hace en una línea (llevan a su parte en /agentes); abajo,
 * tres pasos que se encienden uno tras otro, con una flechita entre uno y otro.
 */
export function Asistentes({ idioma, etiqueta }: { idioma: Idioma; etiqueta: string }) {
  const T = textosAsistentes(idioma);
  return (
    <div className="mz-asis">
      <div className="mz-cabeza">
        <Etiqueta>{etiqueta}</Etiqueta>
        <h2 id="equipo-titulo" className="ini-titulo">
          {T.titulo}
        </h2>
      </div>

      <ul className="mz-asis__lista">
        {IDS_AGENTES.map((id: IdAgente) => {
          const a = agenteDe(idioma, id);
          return (
            <li key={id} style={{ "--c": PERSONAJES[id].color } as CSSProperties}>
              <Link href={`/agentes#${id}`} className="mz-asis__tarjeta">
                <span className="mz-asis__cara" aria-hidden="true">
                  <Personaje agente={id} avatar />
                </span>
                <span className="mz-asis__texto">
                  <b>{a.nombre}</b>
                  <span>{T.roles[id]}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <ol className="mz-asis__pasos">
        {T.pasos.map((p, i) => (
          <li key={p} style={{ "--i": i } as CSSProperties}>
            <span className="mz-asis__icono" aria-hidden="true">
              <Icono nombre={ICONOS[i]} tam={18} />
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ol>

      <Link href="/agentes" className="mz-boton mz-boton--contorno mz-asis__ver">
        {T.ver}
      </Link>
    </div>
  );
}
