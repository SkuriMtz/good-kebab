"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { APP_POR_ID } from "@/lib/conexiones/catalogo";
import { LOGO_APP } from "@/lib/conexiones/logos";
import type { ItemHecho } from "@/lib/hecho";
import type { IdApp } from "@/lib/nucleo-tipos";
import { AvatarAgente } from "./Mensajes";
import { Enlace, Pildoras, TituloSeccion, Vacio, retrasoEscalon } from "./Piezas";
import { Seccion } from "./Secciones";

/* =====================================================================
   Hecho: lo que tu equipo ya terminó (al lado de Pendientes, que es lo
   que espera tu visto bueno). Por día, con quién lo hizo, qué entregó y
   con qué apps. Se filtra por agente.
   ===================================================================== */

const zona = "America/Mexico_City";
const diaDe = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: zona }).format(new Date(iso));
const formatoHora = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: zona });
const formatoDia = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: zona });

function nombreDia(dia: string, hoy: string, ayer: string) {
  if (dia === hoy) return "Hoy";
  if (dia === ayer) return "Ayer";
  const t = formatoDia.format(new Date(`${dia}T18:00:00Z`));
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function Hecho({ items, ahora, demo = false }: { items: ItemHecho[]; ahora: number; demo?: boolean }) {
  const [quien, setQuien] = useState<"todo" | IdAgente>("todo");
  const filtrados = quien === "todo" ? items : items.filter((i) => i.agente === quien);
  const hoy = diaDe(new Date(ahora).toISOString());
  const ayer = diaDe(new Date(ahora - 86_400_000).toISOString());
  const dias = useMemo(() => {
    const grupos = new Map<string, ItemHecho[]>();
    for (const it of filtrados) {
      const d = diaDe(it.en);
      grupos.set(d, [...(grupos.get(d) ?? []), it]);
    }
    return [...grupos.entries()];
  }, [filtrados]);
  const semana = items.filter((i) => ahora - Date.parse(i.en) < 7 * 86_400_000).length;
  let n = 0;

  return (
    <Seccion>
      <TituloSeccion
        titulo="Hecho"
        texto={`Lo que tu equipo ya terminó: lo que le pediste y lo que entregó.${items.length ? ` ${semana.toLocaleString("es-MX")} ${semana === 1 ? "cosa" : "cosas"} en los últimos 7 días.` : ""}${demo ? " (Datos de ejemplo.)" : ""}`}
      />
      {items.length ? (
        <div className="pc-filtros">
          <Pildoras
            etiqueta="Quién lo hizo"
            activa={quien}
            alElegir={(id) => setQuien(id as "todo" | IdAgente)}
            opciones={[{ id: "todo", etiqueta: "Todo" }, ...AGENTES_INFO.map((a) => ({ id: a.id, etiqueta: a.nombre }))]}
          />
        </div>
      ) : null}
      {dias.length ? (
        dias.map(([dia, lista]) => (
          <section key={dia} className="pc-hecho__dia" aria-label={nombreDia(dia, hoy, ayer)}>
            <h2 className="pc-hecho__titulo-dia">{nombreDia(dia, hoy, ayer)}</h2>
            <ol className="pc-hecho">
              {lista.map((it) => {
                const fila = (
                  <>
                    <span className="pc-hecho__check" aria-label="Hecho">
                      <Icono nombre="check" tam={14} />
                    </span>
                    <AvatarAgente agente={it.agente} tam={26} />
                    <span className="pc-hecho__textos">
                      <span className="pc-hecho__que">{it.titulo}</span>
                      {it.detalle ? (
                        <span className="pc-hecho__detalle">
                          <strong>{AGENTE_POR_ID[it.agente].nombre}:</strong> {it.detalle}
                        </span>
                      ) : null}
                      {it.archivo || it.apps?.length ? (
                        <span className="pc-hecho__extras">
                          {it.archivo ? (
                            <span className="pc-hecho__archivo">
                              <Icono nombre="documento" tam={14} />
                              {it.archivo}
                            </span>
                          ) : null}
                          {(it.apps ?? []).map((a) =>
                            a in LOGO_APP ? (
                              <span key={a} className="pc-hecho__app">
                                {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
                                <img src={LOGO_APP[a as IdApp]} alt="" width={14} height={14} />
                                {APP_POR_ID[a as IdApp]?.nombre ?? a}
                              </span>
                            ) : null,
                          )}
                        </span>
                      ) : null}
                    </span>
                    <span className="pc-hecho__hora cifras">{formatoHora.format(new Date(it.en))}</span>
                  </>
                );
                return (
                  <li key={it.id} className="pc-entra" style={{ "--d": `${retrasoEscalon(n++)}ms` } as CSSProperties}>
                    {it.href ? (
                      <Enlace href={it.href} className="pc-hecho__fila pc-hecho__fila--picable">
                        {fila}
                      </Enlace>
                    ) : (
                      <div className="pc-hecho__fila">{fila}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      ) : (
        <Vacio
          agente="iris"
          titulo={items.length ? "Nada de ese agente todavía" : "Todavía no hay nada hecho"}
          texto={items.length ? "Prueba con otro o con Todo." : "Pídele algo a tu equipo en el chat: lo que termine aparece aquí, con lo que entregó."}
        />
      )}
    </Seccion>
  );
}
