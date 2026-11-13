"use client";

import type { CSSProperties } from "react";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";
import type { ItemHecho } from "@/lib/hecho";
import { Enlace } from "./Piezas";

const FECHA = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });

/** Qué es lo que quedó: por la extensión del archivo o, si no hubo archivo, por el área del agente. */
function tipoDe(it: ItemHecho): { tipo: "hoja" | "documento" | "presentacion" | "trabajo"; etiqueta: string } {
  const ext = it.archivo?.split(".").pop()?.toLowerCase();
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return { tipo: "hoja", etiqueta: "Hoja de cálculo" };
  if (ext === "pptx" || ext === "ppt") return { tipo: "presentacion", etiqueta: "Presentación" };
  if (ext) return { tipo: "documento", etiqueta: "Documento" };
  return { tipo: "trabajo", etiqueta: AGENTE_POR_ID[it.agente].area };
}

/** "Reporte-noviembre.xlsx" → "Reporte noviembre"; sin archivo, lo que se pidió. */
function nombreDe(it: ItemHecho) {
  if (!it.archivo) return it.titulo;
  return it.archivo.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+/g, " ").trim() || it.archivo;
}

/**
 * "Trabajo reciente", como "Recent artifacts" de Claude: lo último que
 * terminó tu equipo en tres tarjetas de 204 × 141. Arriba, una miniatura con
 * la hoja de lo que entregó (lo que se pidió y el principio de la respuesta,
 * con el tono del agente detrás); abajo, el nombre y el día. "Ver todo"
 * lleva a la pestaña Hecho de Pendientes. Sin nada hecho no sale.
 */
export function TrabajoReciente({ items, verTodo }: { items: ItemHecho[]; verTodo: string }) {
  if (items.length === 0) return null;
  return (
    <section className="pc-recientes" aria-labelledby="pc-recientes-titulo">
      <div className="pc-recientes__cabeza">
        <h2 id="pc-recientes-titulo" className="pc-recientes__titulo">
          Trabajo reciente
        </h2>
        <Enlace href={verTodo} className="pc-recientes__todo">
          Ver todo
        </Enlace>
      </div>
      <ul className="pc-recientes__lista">
        {items.slice(0, 3).map((it) => {
          const { tipo, etiqueta } = tipoDe(it);
          const agente = AGENTE_POR_ID[it.agente];
          const nombre = nombreDe(it);
          const dia = FECHA.format(new Date(it.en)).replace(".", "");
          return (
            <li key={it.id}>
              <Enlace
                href={it.href ?? verTodo}
                className="pc-reciente"
                style={{ "--pc-agente": PERSONAJES[it.agente].color } as CSSProperties}
                aria-label={`${nombre}. ${agente.nombre}, ${dia}`}
              >
                <span className="pc-reciente__mini" aria-hidden="true">
                  <span className="pc-reciente__hoja" data-tipo={tipo}>
                    <span className="pc-reciente__ceja">
                      {agente.nombre} · {etiqueta}
                    </span>
                    <span className="pc-reciente__pedido">{it.titulo}</span>
                    {it.detalle ? <span className="pc-reciente__detalle">{it.detalle}</span> : null}
                    {tipo === "hoja" ? (
                      <span className="pc-reciente__tabla">
                        {Array.from({ length: 12 }, (_, i) => (
                          <i key={i} />
                        ))}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="pc-reciente__pie">
                  <span className="pc-reciente__nombre">{nombre}</span>
                  <span className="pc-reciente__dia">{dia}</span>
                </span>
              </Enlace>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
