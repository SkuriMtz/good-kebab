"use client";

import type { CSSProperties } from "react";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { filasEjemplo } from "@/components/dashboard/estadisticas-negocio/ejemplo";
import { diaLocal, horaLocal, rangos, type Periodo } from "@/lib/estadisticas";
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

function VistaActividad({ filas, base, hora, dia, nota, resumen, mas = 0 }: { filas: FilaActividad[]; base: string; hora?: number; dia?: string; nota?: string; resumen?: string; mas?: number }) {
  const filtro = hora !== undefined ? `Lo de ${rango(hora)}` : dia ? `Lo del ${textoDia(dia)}` : null;
  return (
    <Seccion>
      <TituloSeccion titulo="Actividad" texto={[filtro ?? "Lo último que pasó con tu equipo: conversaciones y correos.", resumen].filter(Boolean).join(" · ")} />
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
        <Vacio agente="lola" titulo={filtro ? "Nada en ese momento" : "Todavía no hay actividad"} texto={nota ?? "Aquí aparece lo que hacen tus agentes: tus conversaciones y los correos que Clara lee."} />
      )}
      {mas > 0 ? <p className="pc-nota">Y {mas.toLocaleString("es-MX")} más. Estos son los más recientes.</p> : null}
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

/**
 * Sale de las MISMAS filas que las Estadísticas de ejemplo (filasEjemplo):
 * una hora o un día que se pica allá muestra aquí sus conversaciones y
 * correos. El total ("108 movimientos") cuenta igual que el calor:
 * cada mensaje de WhatsApp y cada correo, en el periodo (30 días si no se dice).
 */
export function ActividadDemo({ hora, dia, periodo, ahora }: { hora?: number; dia?: string; periodo: Periodo; ahora: number }) {
  const { hoy, whatsapp, correos } = filasEjemplo(new Date(ahora));
  const r = rangos(periodo, hoy).actual;
  const desde = dia ?? r.desde;
  const hasta = dia ?? r.hasta;
  const dentro = (iso: string) => {
    const d = diaLocal(iso);
    return d >= desde && d <= hasta && (hora === undefined || horaLocal(iso) === hora);
  };
  const msjs = whatsapp.filter((w) => dentro(w.creado_en));
  const mails = correos.filter((c) => dentro(c.creado_en));
  const porConv = new Map<string, { cliente: string; en: string; n: number; tema?: string }>();
  for (const w of msjs) {
    const c = porConv.get(w.conversacion) ?? { cliente: w.cliente, en: w.creado_en, n: 0, tema: undefined };
    c.n += 1;
    if (w.creado_en < c.en) c.en = w.creado_en;
    if (w.tema) c.tema = w.tema;
    porConv.set(w.conversacion, c);
  }
  const todas = [
    ...[...porConv.entries()].map(([id, c]) => ({
      en: c.en,
      f: { id: `w-${id}`, agente: "lola" as IdAgente, texto: `Lola atendió a ${c.cliente} por WhatsApp`, detalle: `${c.tema ?? "Siguió la conversación"} · ${c.n} ${c.n === 1 ? "mensaje" : "mensajes"}`, href: `/pruebalo?vista=citas&de=${encodeURIComponent(c.cliente)}` },
    })),
    ...mails.map((c, i) => {
      const accion = c.accion_sugerida && !/^ninguna/i.test(c.accion_sugerida) ? c.accion_sugerida : null;
      return { en: c.creado_en, f: { id: `c-${i}-${c.creado_en}`, agente: "clara" as IdAgente, texto: `Clara leyó un correo de ${c.remitente}`, detalle: accion ?? "Sin acción", href: `/pruebalo?vista=correo&de=${encodeURIComponent(c.remitente ?? "")}` } };
    }),
  ].sort((a, b) => b.en.localeCompare(a.en));
  const TOPE = 60;
  const filas = todas.slice(0, TOPE).map((x) => ({ ...x.f, cuando: (hora !== undefined || !dia ? formatoFecha : formatoHora).format(new Date(x.en)) }));
  const total = msjs.length + mails.length;
  const resumen = `${total.toLocaleString("es-MX")} ${total === 1 ? "movimiento" : "movimientos"}${dia ? "" : periodo === "7d" ? " en los últimos 7 días" : periodo === "mes" ? " este mes" : " en los últimos 30 días"}`;
  return <VistaActividad filas={filas} base="/pruebalo" hora={hora} dia={dia} resumen={resumen} mas={Math.max(0, todas.length - TOPE)} nota="Nada con ese filtro en el ejemplo. En tu panel se ve todo lo que hizo tu equipo." />;
}
