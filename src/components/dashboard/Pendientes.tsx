"use client";

import { useId, useState, type ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import type { IdAgente } from "@/lib/agentes";
import { Accionable, Cifra, EnlaceMas, MarcaAgente, Vacio } from "./Piezas";
import { FilaMovimiento, type FilaPendiente } from "./Resumen";
import type { Accion } from "./tipos";

/* =====================================================================
   PENDIENTES: todo lo que espera algo de ti, en una lista agrupada que se
   abre y se cierra (grupo → quién → cada cosa), con los totales a la
   derecha. Arriba, los filtros (por tipo y por remitente) cambian la
   dirección: el botón de atrás regresa al filtro anterior.
   ===================================================================== */

export type SubgrupoPendientes = { id: string; titulo: string; filas: FilaPendiente[] };

export type GrupoPendientes = {
  id: string;
  titulo: string;
  icono?: NombreIcono;
  agente?: IdAgente;
  total: number;
  /** Agrupado por quién (remitente, cliente). */
  subgrupos?: SubgrupoPendientes[];
  filas?: FilaPendiente[];
  /** Contenido propio (la lista de "visto bueno" con sus botones). */
  contenido?: ReactNode;
  /** Una línea al pie del grupo ("Se ven los 100 más recientes de 140"). */
  nota?: string;
};

export type FiltroPendientes = Accion & { id: string; etiqueta: string; cuenta?: number; actual?: boolean };

export function VistaPendientes({
  grupos,
  filtros,
  total: totalDado,
  quitarFiltro,
  ahora,
  actividad,
  marca,
}: {
  grupos: GrupoPendientes[];
  /** El total exacto (si se listan menos de los que hay). Sin esto, la suma de los grupos. */
  total?: number | null;
  filtros: FiltroPendientes[];
  /** Si se filtró por remitente: "De: Andrea Solís ✕". */
  quitarFiltro?: Accion & { etiqueta: string };
  ahora: Date | null;
  actividad?: Accion;
  marca?: ReactNode;
}) {
  const total = totalDado ?? grupos.reduce((s, g) => s + g.total, 0);
  return (
    <div className="pnl-pagina">
      <header className="pnl-vista__cabeza">
        <div>
          <h1 className="pnl-vista__titulo">
            Pendientes
            {marca}
          </h1>
          <p className="pnl-vista__texto">{total ? `${total} ${total === 1 ? "cosa espera" : "cosas esperan"} algo de ti.` : "Nada espera algo de ti ahora."}</p>
        </div>
        {actividad ? <EnlaceMas accion={actividad}>Ver la actividad</EnlaceMas> : null}
      </header>

      <div className="pnl-filtros" role="group" aria-label="Filtrar los pendientes">
        {filtros.map((f) => (
          <Accionable key={f.id} accion={f} actual={f.actual} className={`pnl-filtro pnl-picable${f.actual ? " pnl-filtro--actual" : ""}`}>
            {f.etiqueta}
            {f.cuenta !== undefined ? <span className="pnl-filtro__cuenta cifras-app">{f.cuenta}</span> : null}
          </Accionable>
        ))}
        {quitarFiltro ? (
          <Accionable accion={quitarFiltro} className="pnl-filtro pnl-filtro--quitar pnl-picable" etiqueta={`Quitar el filtro: ${quitarFiltro.etiqueta}`}>
            {quitarFiltro.etiqueta}
            <Icono nombre="cerrar" tam={16} />
          </Accionable>
        ) : null}
      </div>

      <section className="pnl-tarjeta pnl-agrupada" aria-label="Pendientes agrupados">
        <div className="pnl-agrupada__total">
          <span>Por revisar</span>
          <Cifra valor={total} className="pnl-agrupada__suma" />
        </div>
        {grupos.length ? (
          <ul className="pnl-agrupada__grupos">
            {grupos.map((g) => (
              <li key={g.id}>
                <Grupo g={g} ahora={ahora} />
              </li>
            ))}
          </ul>
        ) : (
          <Vacio icono="check-circulo" titulo="Todo al día" texto="Cuando un agente necesite tu visto bueno o un correo pida algo, aparece aquí." />
        )}
      </section>
    </div>
  );
}

function Grupo({ g, ahora }: { g: GrupoPendientes; ahora: Date | null }) {
  const id = useId().replace(/:/g, "");
  const [abierto, setAbierto] = useState(true);
  return (
    <div className="pnl-agrupada__grupo">
      <button type="button" className="pnl-agrupada__cabeza pnl-picable" aria-expanded={abierto} aria-controls={`${id}-g`} onClick={() => setAbierto((v) => !v)}>
        <Icono nombre="chevron" tam={16} className="pnl-agrupada__flecha" />
        {g.agente ? <MarcaAgente id={g.agente} tam={24} /> : g.icono ? <Icono nombre={g.icono} tam={16} /> : null}
        <span className="pnl-agrupada__nombre">{g.titulo}</span>
        <span className="pnl-agrupada__cuenta cifras-app">{g.total}</span>
      </button>
      <div id={`${id}-g`} className="pnl-agrupada__cuerpo" hidden={!abierto}>
        {g.contenido}
        {g.filas?.length ? (
          <ul className="pnl-movs">
            {g.filas.map((f) => (
              <li key={f.id}>
                <FilaMovimiento f={f} ahora={ahora} />
              </li>
            ))}
          </ul>
        ) : null}
        {g.subgrupos?.map((s) => (
          <Subgrupo key={s.id} s={s} ahora={ahora} />
        ))}
        {g.nota ? <p className="dash-nota pnl-agrupada__nota">{g.nota}</p> : null}
      </div>
    </div>
  );
}

function Subgrupo({ s, ahora }: { s: SubgrupoPendientes; ahora: Date | null }) {
  const id = useId().replace(/:/g, "");
  const [abierto, setAbierto] = useState(true);
  return (
    <div className="pnl-agrupada__sub">
      <button type="button" className="pnl-agrupada__subcabeza pnl-picable" aria-expanded={abierto} aria-controls={`${id}-s`} onClick={() => setAbierto((v) => !v)}>
        <Icono nombre="chevron" tam={16} className="pnl-agrupada__flecha" />
        <span className="pnl-agrupada__nombre">{s.titulo}</span>
        <span className="pnl-agrupada__cuenta cifras-app">{s.filas.length}</span>
      </button>
      <ul id={`${id}-s`} className="pnl-movs" hidden={!abierto}>
        {s.filas.map((f) => (
          <li key={f.id}>
            <FilaMovimiento f={f} ahora={ahora} />
          </li>
        ))}
      </ul>
    </div>
  );
}
