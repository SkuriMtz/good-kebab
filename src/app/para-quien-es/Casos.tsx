"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import type { IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

export type AgenteCaso = { id: IdAgente; nombre: string; area: string; texto: string };
export type CasoNegocio = { id: string; corto: string; nombre: string; intro: string; frente: AgenteCaso; resto: AgenteCaso[] };

const color = (id: IdAgente) => ({ "--agente": PERSONAJES[id].color }) as CSSProperties;

/**
 * /para-quien-es: los casos (Citas, Mensajes, Clientes que regresan, Papeleo) como botones y,
 * abajo, una tarjeta tranquila con el caso que toques: qué pasa en una frase, el agente que va
 * al frente (con su personaje y lo que hace) y el resto del equipo, una línea cada uno.
 */
export function Casos({ casos, t }: { casos: CasoNegocio[]; t: { probar: string; equipo: string; elegir: string } }) {
  const [activo, setActivo] = useState(0);
  const caso = casos[activo];
  return (
    <div className="pq">
      <div className="pq__chips" role="group" aria-label={t.elegir}>
        {casos.map((c, k) => (
          <button key={c.id} type="button" className="pq__chip" aria-pressed={k === activo} onClick={() => setActivo(k)}>
            {c.corto}
          </button>
        ))}
      </div>

      <article key={caso.id} className="pq__tarjeta" style={color(caso.frente.id)} aria-live="polite" aria-labelledby="pq-titulo">
        <div className="pq__cabeza">
          <div className="pq__texto">
            <h2 id="pq-titulo" className="pq__titulo">
              {caso.nombre}
            </h2>
            <p className="pq__intro">{caso.intro}</p>
            <Link href={`/pruebalo?con=${caso.frente.id}`} className="pq__boton">
              {t.probar} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="pq__frente">
            <span className="pq__personaje">
              <Personaje agente={caso.frente.id} />
            </span>
            <p className="pq__quien">
              {caso.frente.nombre} <span>· {caso.frente.area}</span>
            </p>
            <p className="pq__hace">{caso.frente.texto}</p>
          </div>
        </div>

        <div className="pq__equipo">
          <p className="pq__equipo-titulo">{t.equipo}</p>
          <ul>
            {caso.resto.map((a) => (
              <li key={a.id} style={color(a.id)}>
                <span className="pq__cara">
                  <Personaje agente={a.id} avatar />
                </span>
                <span>
                  <b>{a.nombre}</b>
                  {a.texto}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </div>
  );
}
