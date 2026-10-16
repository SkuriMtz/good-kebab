"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Seccion } from "@/components/base/Seccion";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, IDS_AGENTES, type IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

/**
 * Revelado al bajar: mientras el bloque no ha llegado a la pantalla queda en
 * data-inf-revela="esperando" (sus .inf-pieza escondidas); al entrar, pasa a
 * "visto" y las piezas suben una tras otra (informativas.css). Si ya estaba a
 * la vista al cargar, no se esconde nada. Una sola vez: no se repite al subir.
 */
export function useRevelado(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.85 && r.bottom > 0) return;
    el.dataset.infRevela = "esperando";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.infRevela = "visto";
        io.disconnect();
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}

/** El color del agente para el fondo de su marca (`.marca-agente`). */
export const colorAgente = (agente: IdAgente) => ({ "--agente": PERSONAJES[agente].color }) as CSSProperties;

type Resultado = { icono: NombreIcono; texto: string; archivo?: boolean };

/**
 * "Hoy en la recepción": lo que cada agente resolvió, en orden de hora.
 * Todo sale de las conversaciones de ejemplo de detalle.ts (nombres
 * ficticios): Andrea con Clara, Mariana con Lola, Paola con Víctor y el
 * encargo a Iris (que no lleva hora: es un chat contigo).
 */
const DIA: { agente: IdAgente; canal: string; hora?: string; frase: string; resultados: Resultado[] }[] = [
  {
    agente: "clara",
    canal: "Correo",
    hora: "09:40",
    frase: "le contestó a Andrea Solís desde tu correo y le pasó la cita a la tarde.",
    resultados: [{ icono: "correo", texto: "Martes 17:00 · cita cambiada" }],
  },
  {
    agente: "lola",
    canal: "WhatsApp",
    hora: "10:44",
    frase: "le dio a Mariana el precio de la limpieza facial y le apartó lugar.",
    resultados: [{ icono: "calendario", texto: "Jueves 16:30 · limpieza facial" }],
  },
  {
    agente: "victor",
    canal: "WhatsApp",
    hora: "11:20",
    frase: "le escribió a Paola, que preguntó por botox y no había agendado. Ya tiene cita.",
    resultados: [{ icono: "check-circulo", texto: "Viernes 12:00 · de prospecto a cita" }],
  },
  {
    agente: "iris",
    canal: "Chat",
    frase: "comparó lo que cobran 4 clínicas cercanas por depilación láser y dejó listo el reporte de septiembre.",
    resultados: [
      { icono: "documento", texto: "precios-laser.xlsx", archivo: true },
      { icono: "grafica", texto: "Reporte de septiembre · Excel y PDF" },
    ],
  },
];

/**
 * 4. Qué es Atendel (Grupo 4 · propuesta T1). Columnas asimétricas, como las
 * secciones de la portada de GitHub: a la izquierda el equipo (los cuatro
 * personajes), el título de 40px y el texto; a la derecha, un panel de
 * vidrio con "el día de la recepción" a modo de feed de actividad: quién
 * hizo qué, con sello de canal y hora en Mono y el resultado concreto (la
 * cita, el archivo) en una tarjetita anidada. Las filas aparecen una tras otra.
 */
export function QueEs() {
  const lista = useRef<HTMLOListElement>(null);
  useRevelado(lista);

  return (
    <Seccion id="que-es" etiquetadaPor="que-es-titulo" halo>
      <div className="inf-quees">
        <div className="inf-quees__texto">
          <div className="inf-equipo" aria-hidden="true">
            {IDS_AGENTES.map((a) => (
              <span key={a} className="marca-agente marca-agente--chica" style={colorAgente(a)}>
                <Personaje agente={a} avatar />
              </span>
            ))}
          </div>
          <Etiqueta>Qué es Atendel</Etiqueta>
          <h2 id="que-es-titulo" className="t-seccion max-w-[16ch]">
            Agentes de IA para negocios que atienden personas
          </h2>
          <p className="t-intro">
            Atendel es un equipo de cuatro agentes de inteligencia artificial para clínicas, consultorios y estéticas.
          </p>
          <p className="t-cuerpo max-w-[52ch]">
            Atienden tu WhatsApp y tus citas, ordenan tu correo, traen de regreso a tus clientes y hacen el trabajo de
            oficina. Les hablas como a una persona y te entregan el trabajo hecho: mensajes, tablas, reportes y
            documentos.
          </p>
        </div>

        <div className="relative">
          <Halo x="60%" y="40%" ancho="min(760px, 120vw)" suave />
          <TarjetaVidrio as="figure" relleno="ninguno" className="inf-dia" aria-labelledby="que-es-dia">
            <figcaption className="inf-dia__cabeza">
              <Etiqueta as="span" tono="texto" id="que-es-dia">
                Hoy en la recepción
              </Etiqueta>
              <Etiqueta as="span" tono="tenue">
                Ejemplo · nombres ficticios
              </Etiqueta>
            </figcaption>
            <ol ref={lista}>
              {DIA.map((d, i) => (
                <li key={d.agente} className="inf-dia__fila inf-pieza" style={{ "--i": i } as CSSProperties}>
                  <span
                    className="inf-dia__avatar marca-agente marca-agente--chica"
                    style={colorAgente(d.agente)}
                    aria-hidden="true"
                  >
                    <Personaje agente={d.agente} avatar />
                  </span>
                  <Etiqueta tono="tenue" className="inf-dia__sello">
                    {d.canal}
                    {d.hora ? (
                      <>
                        {" · "}
                        <time>{d.hora}</time>
                      </>
                    ) : null}
                  </Etiqueta>
                  <div className="inf-dia__texto">
                    <p className="t-cuerpo inf-dia__frase">
                      <span className="inf-nombre">{AGENTE_POR_ID[d.agente].nombre}</span> {d.frase}
                    </p>
                    <ul className="inf-resultados">
                      {d.resultados.map((r) => (
                        <li key={r.texto} className={`inf-resultado${r.archivo ? " inf-resultado--archivo" : ""}`}>
                          <Icono nombre={r.icono} tam={16} />
                          <span className="min-w-0 truncate">{r.texto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
            <div className="inf-dia__pie">
              <p className="t-chico">Todo queda guardado para que lo revises.</p>
              <Link href="/pruebalo" className="inf-enlace">
                <span>Ver el panel de ejemplo</span>
                <Icono nombre="flecha" tam={16} />
              </Link>
            </div>
          </TarjetaVidrio>
        </div>
      </div>
    </Seccion>
  );
}
