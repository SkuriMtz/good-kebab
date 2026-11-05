"use client";

import type { CSSProperties } from "react";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { DEMO_ACTIVIDAD, DEMO_ACTIVIDAD_ANTERIOR, type Destino } from "@/lib/demo-dashboard";
import { diaLocal, horaLocal } from "@/lib/estadisticas";
import { AvatarAgente } from "./Mensajes";
import { Enlace, TituloSeccion, Vacio, retrasoEscalon } from "./Piezas";
import { Seccion } from "./Secciones";
import { nombreRemitente } from "./remitente";

/* =====================================================================
   Actividad: lo que pasó, en orden. Se llega desde Estadísticas (una hora
   o un día del calor, ?hora=10 o ?dia=2026-11-04) y desde el buscador.
   No está en el menú: es un detalle de Estadísticas.
   ===================================================================== */

export type FilaActividad = { id: string; cuando: string; agente?: IdAgente; texto: string; detalle?: string; href?: string };

const formatoDia = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const formatoHora = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Mexico_City" });
const formatoFecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Mexico_City" });

const textoDia = (dia: string) => formatoDia.format(new Date(`${dia}T12:00:00Z`));
const rango = (h: number) => `de ${h}:00 a ${h + 1}:00`;

function VistaActividad({ filas, base, hora, dia, nota }: { filas: FilaActividad[]; base: string; hora?: number; dia?: string; nota?: string }) {
  const filtro = hora !== undefined ? `Lo de ${rango(hora)}` : dia ? `Lo del ${textoDia(dia)}` : null;
  return (
    <Seccion>
      <TituloSeccion titulo="Actividad" texto={filtro ?? "Lo último que pasó con tu equipo: conversaciones y correos."} />
      {filtro ? (
        <div className="pc-filtros">
          <Enlace href={`${base}?vista=actividad`} className="pc-pildora pc-pildora--quitar" aria-label={`Quitar el filtro: ${filtro}`}>
            {hora !== undefined ? `${hora}:00` : textoDia(dia ?? "")}
            <Icono nombre="cerrar" tam={14} />
          </Enlace>
          <Enlace href={`${base}?vista=estadisticas`} className="pc-enlace">
            Volver a Estadísticas
          </Enlace>
        </div>
      ) : null}
      {filas.length ? (
        <ol className="pc-actividad">
          {filas.map((f, i) => (
            <li key={f.id} className="pc-entra" style={{ "--d": `${retrasoEscalon(i)}ms` } as CSSProperties}>
              {f.href ? (
                <Enlace href={f.href} className="pc-actividad__fila pc-actividad__fila--picable">
                  <Contenido f={f} />
                  <Icono nombre="chevron-derecha" tam={16} />
                </Enlace>
              ) : (
                <div className="pc-actividad__fila">
                  <Contenido f={f} />
                </div>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <Vacio icono="reloj" titulo={filtro ? "Nada en ese momento" : "Todavía no hay actividad"} texto={nota ?? "Aquí aparece lo que hacen tus agentes: tus conversaciones y los correos que Clara lee."} />
      )}
    </Seccion>
  );
}

function Contenido({ f }: { f: FilaActividad }) {
  return (
    <>
      <span className="pc-actividad__cuando cifras">{f.cuando}</span>
      {f.agente ? <AvatarAgente agente={f.agente} tam={24} /> : <span className="pc-actividad__punto" aria-hidden="true" />}
      <span className="pc-actividad__textos">
        <span className="pc-actividad__texto">{f.texto}</span>
        {f.detalle ? <span className="pc-actividad__detalle">{f.detalle}</span> : null}
      </span>
    </>
  );
}

/* ---------- /panel: conversaciones y correos de verdad ---------- */

export type ConvActividad = { id: string; agente: string; titulo: string; actualizado_en: string };
export type ResumenActividad = { id: string; remitente: string | null; asunto: string | null; accion_sugerida: string | null; creado_en: string };

export function ActividadReal({ conversaciones, resumenes, hora, dia }: { conversaciones: ConvActividad[]; resumenes: ResumenActividad[]; hora?: number; dia?: string }) {
  const filas = [
    ...conversaciones.map((c) => ({ en: c.actualizado_en, f: { id: `c-${c.id}`, agente: c.agente as IdAgente, texto: `Conversación con ${AGENTE_POR_ID[c.agente as IdAgente]?.nombre ?? "tu equipo"}`, detalle: c.titulo, href: `/panel?c=${encodeURIComponent(c.id)}` } })),
    ...resumenes.map((r) => {
      const quien = nombreRemitente(r.remitente);
      return { en: r.creado_en, f: { id: `r-${r.id}`, agente: "clara" as IdAgente, texto: `Clara leyó un correo de ${quien}`, detalle: r.asunto || "(sin asunto)", href: `/panel?vista=correo&de=${encodeURIComponent(quien)}` } };
    }),
  ]
    .filter((x) => (hora === undefined || horaLocal(x.en) === hora) && (!dia || diaLocal(x.en) === dia))
    .sort((a, b) => b.en.localeCompare(a.en))
    .slice(0, 60)
    .map((x) => ({ ...x.f, cuando: formatoFecha.format(new Date(x.en)) }));
  return <VistaActividad filas={filas} base="/panel" hora={hora} dia={dia} />;
}

/* ---------- /pruebalo: la actividad de ejemplo ---------- */

const destino = (d?: Destino) => {
  if (!d) return undefined;
  if (d.vista === "conversaciones") return `/pruebalo?con=${d.con ?? "recepcion"}`;
  if (d.vista === "correo") return d.de ? `/pruebalo?vista=correo&de=${encodeURIComponent(d.de)}` : "/pruebalo?vista=correo";
  if (d.vista === "actividad" && d.pestana === "visto-bueno") return "/pruebalo?vista=pendientes";
  return `/pruebalo?vista=${d.vista === "resumen" ? "" : d.vista}`;
};

export function ActividadDemo({ hora, dia, ahora }: { hora?: number; dia?: string; ahora: number }) {
  const filas = [...DEMO_ACTIVIDAD, ...DEMO_ACTIVIDAD_ANTERIOR]
    .map((e) => ({ e, en: new Date(ahora - (e.haceMin ?? 0) * 60_000) }))
    .filter(({ en }) => (hora === undefined || horaLocal(en) === hora) && (!dia || diaLocal(en) === dia))
    .map(({ e, en }) => ({
      id: e.id,
      cuando: formatoHora.format(en),
      agente: e.agente,
      texto: `${AGENTE_POR_ID[e.agente].nombre} ${e.verbo}${e.objeto ? ` ${e.objeto}` : ""}${e.complemento ? ` ${e.complemento}` : ""}`,
      detalle: e.tarjeta && "titulo" in e.tarjeta && e.tarjeta.titulo ? e.tarjeta.titulo : e.insignia?.texto,
      href: destino(e.ir),
    }));
  return <VistaActividad filas={filas} base="/pruebalo" hora={hora} dia={dia} nota="En el ejemplo solo están los últimos días. En tu panel se ve todo lo que hizo tu equipo." />;
}
