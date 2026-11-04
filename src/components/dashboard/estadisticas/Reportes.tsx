"use client";

import { useState, type CSSProperties } from "react";
import { AGENTE_POR_ID } from "@/lib/agentes";
import type { DatosEstadisticas, DestinoEstadisticas } from "@/lib/estadisticas";
import { Accionable, Cifra, Dona, EnlaceMas, ListaBarras, Tarjeta, type FilaBarra } from "../Piezas";
import type { Accion } from "../tipos";
import { cifra, cuenta, hora, rangoHora, reinicio } from "./formato";

/*
 * Las tarjetas de abajo, con las piezas del panel (Piezas.tsx): listas de
 * barras (lo más usado), la hora del día y la dona del plan. Cada fila y
 * cada barra lleva a su sección ya filtrada.
 */

type AccionDe = (d: DestinoEstadisticas) => Accion;
type Props = { datos: DatosEstadisticas; accionDe: AccionDe };

/** Cuando una tarjeta no tiene nada en este periodo (sin inventar ceros). */
function Nada({ children }: { children: string }) {
  return <p className="est-nada">{children}</p>;
}

export function PorAgente({ datos, accionDe }: Props) {
  const filas: FilaBarra[] = datos.porAgente.map((a) => {
    const info = AGENTE_POR_ID[a.agente];
    return {
      id: a.agente,
      etiqueta: info.nombre,
      detalle: info.area,
      valor: a.mensajes,
      agente: a.agente,
      ...accionDe({ tipo: "agente", agente: a.agente }),
    };
  });
  return (
    <Tarjeta
      titulo="Por agente"
      subtitulo="Mensajes en el periodo"
      className="est-area-agente"
      accion={<EnlaceMas accion={accionDe({ tipo: "chat" })}>Ir al chat</EnlaceMas>}
    >
      {filas.some((f) => f.valor) ? <ListaBarras filas={filas} unidad="mensajes" /> : <Nada>Tus agentes todavía no tienen mensajes en este periodo.</Nada>}
    </Tarjeta>
  );
}

export function Acciones({ datos, accionDe }: Props) {
  const filas: FilaBarra[] = datos.acciones.map((a) => ({ id: a.texto, etiqueta: a.texto, valor: a.total, ...accionDe({ tipo: "pendientes", accion: a.texto }) }));
  return (
    <Tarjeta
      titulo="Acciones sugeridas"
      subtitulo="Las más comunes en tus correos"
      className="est-area-acciones"
      accion={<EnlaceMas accion={accionDe({ tipo: "pendientes" })}>Ver todo</EnlaceMas>}
    >
      {filas.length ? <ListaBarras filas={filas} unidad="correos" /> : <Nada>Clara no ha sugerido acciones en este periodo.</Nada>}
    </Tarjeta>
  );
}

export function Remitentes({ datos, accionDe }: Props) {
  const filas: FilaBarra[] = datos.remitentes.map((r) => ({ id: r.clave, etiqueta: r.nombre, valor: r.total, ...accionDe({ tipo: "correo", de: r.nombre }) }));
  return (
    <Tarjeta
      titulo="Quién escribe más"
      subtitulo="Correos resumidos por remitente"
      className="est-area-remitentes"
      accion={<EnlaceMas accion={accionDe({ tipo: "correo" })}>Ver todo</EnlaceMas>}
    >
      {filas.length ? <ListaBarras filas={filas} unidad="correos" /> : <Nada>Todavía no hay correos resumidos en este periodo.</Nada>}
    </Tarjeta>
  );
}

export function Horas({ datos, accionDe }: Props) {
  const [sobre, setSobre] = useState<number | null>(null);
  const max = Math.max(...datos.porHora);
  const pico = max ? datos.porHora.indexOf(max) : null;
  const nota =
    sobre !== null
      ? `De ${rangoHora(sobre)} · ${cuenta(datos.porHora[sobre], "mensaje", "mensajes")}`
      : pico !== null
        ? `Más movimiento: de ${rangoHora(pico)}`
        : "Sin mensajes en este periodo";
  return (
    <Tarjeta titulo="Hora del día" subtitulo={nota} className="est-area-hora">
      <div className="est-horas__cuerpo">
        <ul className="est-horas" onPointerLeave={() => setSobre(null)}>
          {datos.porHora.map((v, h) => (
            <li key={h} onPointerEnter={() => setSobre(h)} onFocus={() => setSobre(h)} onBlur={() => setSobre(null)} style={{ "--i": h } as CSSProperties}>
              <Accionable accion={accionDe({ tipo: "hora", hora: h })} className="est-hora" etiqueta={`De ${rangoHora(h)}: ${cuenta(v, "mensaje", "mensajes")}. Ver la actividad.`}>
                <span className="est-hora__barra" data-pico={h === pico || undefined} style={{ height: `${max ? Math.max(v ? 3 : 0, (v / max) * 100) : 0}%` }} />
              </Accionable>
            </li>
          ))}
        </ul>
        <div className="est-horas__eje" aria-hidden="true">
          {[0, 6, 12, 18].map((h) => (
            <span key={h} style={{ left: `${(h / 24) * 100}%` }}>
              {hora(h)}
            </span>
          ))}
        </div>
      </div>
    </Tarjeta>
  );
}

export function UsoPlan({ datos, accionDe }: Props) {
  const { plan } = datos;
  const proporcion = plan.limite ? plan.usados / plan.limite : 0;
  const color = proporcion >= 1 ? "var(--c-error)" : proporcion >= 0.8 ? "var(--c-atencion)" : "var(--c-accion-texto)";
  const accion = accionDe({ tipo: "plan" });
  const leyenda = `${plan.nombre}: ${cifra(plan.usados)} de ${cifra(plan.limite)} mensajes usados este mes`;
  return (
    <Tarjeta titulo="Uso del plan" subtitulo={`${plan.nombre} · este mes`} className="est-area-plan" accion={<EnlaceMas accion={accion}>Ver planes</EnlaceMas>}>
      <div className="est-plan">
        <Accionable accion={accion} className="est-dona pnl-picable" etiqueta={`${leyenda}. Ver planes.`}>
          <Dona
            partes={datos.totales.uso === null && !plan.usados ? [] : [{ id: "usados", valor: plan.usados, color }]}
            total={plan.limite}
            tam={128}
            grosor={12}
            etiqueta={leyenda}
            centro={
              <span className="est-dona__centro">
                <Cifra valor={datos.totales.uso === null && !plan.usados ? null : Math.round(proporcion * 100)} sufijo="%" className="est-dona__cifra" />
                <span className="est-dona__texto">usado</span>
              </span>
            }
          />
        </Accionable>
        <dl className="est-plan__datos">
          <div>
            <dt>
              <span className="est-plan__muestra" style={{ background: color }} aria-hidden="true" />
              Usados
            </dt>
            <dd>{cifra(plan.usados)}</dd>
          </div>
          <div>
            <dt>
              <span className="est-plan__muestra" data-pista="" aria-hidden="true" />
              Disponibles
            </dt>
            <dd>{cifra(Math.max(0, plan.limite - plan.usados))}</dd>
          </div>
          <div>
            <dt>Límite al mes</dt>
            <dd>{cifra(plan.limite)}</dd>
          </div>
          <div>
            <dt>Se reinicia</dt>
            <dd>{reinicio(plan.mes)}</dd>
          </div>
        </dl>
      </div>
      {proporcion >= 0.8 ? (
        <p className="est-plan__aviso">
          {proporcion >= 1 ? "Ya usaste todos los mensajes de este mes." : `Llevas ${Math.round(proporcion * 100)}% de tus mensajes del mes.`} Se reinician el {reinicio(plan.mes)}.
        </p>
      ) : null}
    </Tarjeta>
  );
}
