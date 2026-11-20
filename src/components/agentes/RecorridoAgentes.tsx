"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Boton } from "@/components/base/Boton";
import { MarcoCelular } from "@/components/base/MarcoCelular";
import { ConversacionAtendel } from "./ConversacionAtendel";
import { Personaje } from "./Personaje";
import { CATALOGO } from "@/lib/conexiones/catalogo";
import { LOGO_APP } from "@/lib/conexiones/logos";
import type { IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";
import { agentesDe, t, type Idioma } from "@/i18n";

/**
 * EL RECORRIDO DE /agentes: al bajar, el texto (izquierda) y el celular
 * (derecha) se quedan fijos y pasan por los cuatro agentes, uno por pantalla
 * de scroll. El celular se pinta del color de cada uno y muestra cómo
 * funciona: le escribes a Atendel y el agente lo hace.
 *
 * - Cuál toca: una marca invisible de una pantalla de alto por agente (con
 *   su ancla #lola, #clara…); la que cruza la mitad de la pantalla manda.
 * - Las transiciones (como un fundido): lo que se va se apaga y se
 *   desenfoca; lo que llega aparece desde borroso, un poco después. La
 *   pantalla del celular cambia de color con un fundido.
 * - Con «reducir movimiento», cambia sin animación.
 * - En celular también se queda fijo, pero todo cabe: arriba el nombre y el
 *   lema, y el teléfono entero, achicado para caber en lo que queda de
 *   pantalla (antes se cortaba y se sentía trabado). Entre un agente y otro
 *   hay menos scroll que en compu.
 */

/** Las más conocidas primero (solo pasan si de verdad están en el catálogo para ese agente). */
const PRIMERO: Record<IdAgente, string[]> = {
  lola: ["whatsapp_business", "google_calendar", "outlook_calendar", "instagram"],
  clara: ["gmail", "outlook"],
  victor: ["google_business", "instagram", "hubspot", "mailchimp"],
  iris: ["google_drive", "google_sheets", "excel", "notion"],
};
/** Nombres de marca cortos (el catálogo los tiene en español largo). */
const NOMBRE_CORTO: Record<string, string> = { whatsapp_business: "WhatsApp", outlook_calendar: "Outlook", google_business: "Google Business" };

/** Las apps con las que trabaja cada agente (del catálogo real, con logo; máximo 4). */
const appsDe = (agente: IdAgente) => {
  const suyas = CATALOGO.filter((a) => a.fase === 1 && a.agentes.includes(agente) && LOGO_APP[a.id]);
  const orden = PRIMERO[agente];
  const pos = (id: string) => (orden.includes(id) ? orden.indexOf(id) : orden.length);
  return [...suyas].sort((x, z) => pos(x.id) - pos(z.id)).slice(0, orden.length || 4);
};

/** Lo de cada agente: su globo, su lema, qué hace y con qué apps trabaja (igual en compu y en celular). */
function TextoAgente({ a, idioma }: { a: ReturnType<typeof agentesDe>[number]; idioma: Idioma }) {
  const d = t(idioma);
  const apps = appsDe(a.id);
  return (
    <>
      <span className="recorrido__globo">
        <Personaje agente={a.id} avatar className="recorrido__cara" />
        {a.nombre} · {a.area}
      </span>
      <h2 className="recorrido__titulo">{a.lema}</h2>
      <p className="recorrido__parrafo">{d.detalle[a.id].descripcion}</p>
      {apps.length ? (
        <div className="recorrido__apps">
          <span className="recorrido__trabaja">{d.conversacion.trabajaCon}</span>
          <ul>
            {apps.map((x) => (
              <li key={x.id} className="recorrido__app">
                {/* Logos chicos y fijos de /public */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO_APP[x.id]} alt="" width={16} height={16} />
                {NOMBRE_CORTO[x.id] ?? x.nombre}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

/** En celular (como en el CSS: menos de 900 px) el teléfono se achica para caber entero. */
const CELULAR = "(max-width: 899px)";
/** El alto del teléfono a tamaño normal (agentes.css, .celular__cuerpo). */
const ALTO_CELULAR = 660;

export function RecorridoAgentes({ idioma = "es" }: { idioma?: Idioma }) {
  const d = t(idioma);
  const P = d.paginaAgentes;
  const agentes = agentesDe(idioma);
  const marcas = useRef<(HTMLDivElement | null)[]>([]);
  const fijo = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(0);
  /** En celular: cuánto se achica el teléfono para que quepa entero debajo del título (1 = normal). */
  const [escala, setEscala] = useState(1);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const ver = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setActivo(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const m of marcas.current) if (m) ver.observe(m);
    return () => ver.disconnect();
  }, []);

  // Lo que queda de pantalla debajo del título es lo que mide el teléfono (completo, nunca cortado)
  useEffect(() => {
    const el = fijo.current;
    if (!el) return;
    const mq = window.matchMedia(CELULAR);
    const medir = () => {
      const cel = el.querySelector<HTMLElement>(".recorrido__celular");
      if (!mq.matches || !cel) {
        setEscala(1);
        return;
      }
      const abajo = parseFloat(getComputedStyle(el).paddingBottom) || 0;
      const disponible = el.clientHeight - abajo - (cel.getBoundingClientRect().top - el.getBoundingClientRect().top);
      setEscala(Math.min(1, Math.max(0.45, Math.floor((disponible / ALTO_CELULAR) * 100) / 100)));
    };
    medir();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(medir);
    ro?.observe(el);
    mq.addEventListener("change", medir);
    return () => {
      ro?.disconnect();
      mq.removeEventListener("change", medir);
    };
  }, []);

  const color = PERSONAJES[agentes[activo]?.id ?? "lola"].color;

  return (
    <section className="recorrido" style={{ "--n": agentes.length } as CSSProperties} aria-label={P.etiqueta}>
      {agentes.map((a, i) => (
        <div
          key={a.id}
          id={a.id}
          ref={(el) => {
            marcas.current[i] = el;
          }}
          data-i={i}
          className="recorrido__marca"
          style={{ "--i": i } as CSSProperties}
          aria-hidden="true"
        />
      ))}

      <div ref={fijo} className="recorrido__fijo contenedor" style={{ "--escala": escala } as CSSProperties}>
        <div className="recorrido__textos">
          {agentes.map((a, i) => {
            const esta = i === activo;
            return (
              <article key={a.id} className="recorrido__texto" data-activo={esta ? "" : undefined} style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}>
                <TextoAgente a={a} idioma={idioma} />
                <div className="recorrido__accion">
                  <Boton href={`/agentes/${a.id}`} variante="fantasma" flecha tabIndex={esta ? undefined : -1}>
                    {P.suPagina}
                  </Boton>
                </div>
              </article>
            );
          })}
        </div>

        <MarcoCelular className="recorrido__celular" titulo={P.conversacionCon(agentes[activo]?.nombre ?? "")} quien={agentes[activo]?.nombre ?? "Atendel"} idioma={idioma} pantalla={color}>
          <div className="recorrido__pantallas">
            {agentes.map((a, i) => (
              <div key={a.id} className="recorrido__pantalla" data-activo={i === activo ? "" : undefined} aria-hidden={i === activo ? undefined : true}>
                <ConversacionAtendel agente={a.id} idioma={idioma} activo={i === activo} pintada />
              </div>
            ))}
          </div>
        </MarcoCelular>
      </div>
    </section>
  );
}
