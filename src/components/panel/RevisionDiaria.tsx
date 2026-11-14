"use client";

import { useState } from "react";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, esIdAgente, type IdAgente } from "@/lib/agentes";
import { AvatarAgente } from "./Mensajes";
import { Enlace, claseBoton } from "./Piezas";

/**
 * La revisión diaria: cada día, a la hora que elegiste, cada agente revisó
 * su parte y dejó lo que falta (lo arma la base de datos, migración 0015).
 * Arriba de la Oficina. "Revisar ahora" la vuelve a hacer al momento.
 */

export type FaltaRevision = { texto: string; href: string };
export type ParteRevision = { agente: IdAgente; faltan: FaltaRevision[] };
export type DatosRevision = { id?: string; fecha: string; creado: string; partes: ParteRevision[]; faltan: number; leida?: boolean };

/** Lee lo que guardó la base de datos, sin confiar en su forma. */
export function partesDe(valor: unknown): ParteRevision[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((p) => {
    if (!p || typeof p !== "object") return [];
    const { agente, faltan } = p as { agente?: unknown; faltan?: unknown };
    if (!esIdAgente(agente)) return [];
    const lista = Array.isArray(faltan)
      ? faltan.flatMap((f) => {
          const x = f as { texto?: unknown; href?: unknown };
          // Solo enlaces del panel
          return typeof x?.texto === "string" && typeof x?.href === "string" && x.href.startsWith("/") && !x.href.startsWith("//") ? [{ texto: x.texto.slice(0, 300), href: x.href.slice(0, 300) }] : [];
        })
      : [];
    return [{ agente, faltan: lista }];
  });
}

const formatoDia = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export function RevisionDiaria({
  revision,
  hoy,
  hora,
  activa,
  alRevisar,
  hrefAjustes,
  zona,
}: {
  /** La zona horaria de la cuenta (la misma en el servidor y en el navegador). */
  zona: string;
  revision: DatosRevision | null;
  /** AAAA-MM-DD de hoy en la zona de la cuenta. */
  hoy: string;
  /** La hora elegida en Ajustes ("08:00"). */
  hora: string;
  activa: boolean;
  /** Vuelve a revisar al momento; devuelve un error o null. */
  alRevisar: () => Promise<string | null> | string | null;
  hrefAjustes: string;
}) {
  const [revisando, setRevisando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deHoy = revision?.fecha === hoy;
  const formatoHora = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", hourCycle: "h23", timeZone: zona });
  const dia = revision ? (deHoy ? "Hoy" : formatoDia.format(new Date(`${revision.fecha}T12:00:00Z`))) : null;

  async function revisar() {
    setRevisando(true);
    setError(null);
    const e = await alRevisar();
    setRevisando(false);
    if (e) setError(e);
  }

  return (
    <section className="pc-revision" aria-label="Revisión diaria">
      <div className="pc-revision__cabeza">
        <div className="pc-revision__textos">
          <h2 className="pc-revision__titulo">{revision ? `Revisión de tu equipo · ${dia} a las ${formatoHora.format(new Date(revision.creado))}` : "Revisión de tu equipo"}</h2>
          <p className="pc-revision__resumen">
            {revision
              ? revision.faltan
                ? `${revision.faltan === 1 ? "1 cosa" : `${revision.faltan} cosas`} por hacer para que tu equipo trabaje completo.`
                : "Todo en orden: no falta nada."
              : activa
                ? `Tu equipo revisa todo solo, cada día a las ${hora}. La primera revisión llega a esa hora.`
                : "La revisión diaria está apagada."}
          </p>
        </div>
        <button type="button" className={claseBoton("borde", true)} onClick={revisar} disabled={revisando}>
          <Icono nombre="recargar" tam={14} />
          {revisando ? "Revisando…" : "Revisar ahora"}
        </button>
      </div>
      {error ? (
        <p className="pc-citas-aviso pc-citas-aviso--error" role="alert">
          <Icono nombre="alerta" tam={16} />
          {error}
        </p>
      ) : null}
      {revision ? (
        <ul className="pc-revision__agentes">
          {revision.partes.map((p) => {
            const a = AGENTE_POR_ID[p.agente];
            return (
              <li key={p.agente} className="pc-revision__agente">
                <div className="pc-revision__quien">
                  <AvatarAgente agente={p.agente} tam={22} />
                  <span className="pc-revision__nombre">{a.nombre}</span>
                  <span className="pc-revision__area">{a.area}</span>
                  {p.faltan.length ? null : <span className="pc-revision__ok">Todo en orden</span>}
                </div>
                {p.faltan.length ? (
                  <ul className="pc-revision__faltan">
                    {p.faltan.map((f) => (
                      <li key={f.texto}>
                        <Enlace href={f.href} className="pc-revision__falta">
                          <span>{f.texto}</span>
                          <Icono nombre="chevron-derecha" tam={14} />
                        </Enlace>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      <p className="pc-revision__pie">
        {activa ? `Revisan solos cada día a las ${hora}, aunque no entres. ` : "Puedes prenderla para que revisen solos cada día. "}
        <Enlace href={hrefAjustes}>{activa ? "Cambiar la hora" : "Prenderla"}</Enlace>
      </p>
    </section>
  );
}
