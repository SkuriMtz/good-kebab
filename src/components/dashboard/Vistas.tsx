import type { ReactNode } from "react";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado, type TonoEstado } from "@/components/base/PuntoEstado";
import { Cara } from "./Caras";
import type { ResumenCorreo } from "./tipos";

/**
 * Piezas de las vistas que no son el Resumen (Agentes y Correo). Las usan
 * /pruebalo (ejemplo) y /panel (de verdad) con la misma forma.
 */

/** Encabezado de una vista: etiqueta pequeña, título de 24px, una línea de explicación y algo a la derecha. */
export function EncabezadoVista({
  etiqueta,
  titulo,
  texto,
  extra,
  id = "dash-vista-titulo",
}: {
  etiqueta?: ReactNode;
  titulo: string;
  texto?: ReactNode;
  extra?: ReactNode;
  id?: string;
}) {
  return (
    <header className="dash-vista__cabeza">
      <div className="dash-vista__titulos">
        {etiqueta ? <p className="dash-vista__etiqueta">{etiqueta}</p> : null}
        <h1 id={id} className="dash-vista__titulo">
          {titulo}
        </h1>
        {texto ? <p className="dash-vista__texto">{texto}</p> : null}
      </div>
      {extra ? <div className="dash-vista__extra">{extra}</div> : null}
    </header>
  );
}

/**
 * Un agente en la vista "Tu equipo": personaje grande, nombre, área, lo que
 * hace (con palomitas), su estado o el plan con el que se desbloquea, y sus
 * acciones abajo.
 */
export function TarjetaAgente({
  id,
  estado,
  bloqueado,
  enEquipo,
  acciones,
}: {
  id: IdAgente;
  estado?: { tono: TonoEstado; etiqueta: string; pulso?: boolean };
  /** "Con Atendel One": el plan no lo incluye. */
  bloqueado?: string;
  enEquipo?: boolean;
  acciones?: ReactNode;
}) {
  const a = AGENTE_POR_ID[id];
  const conPie = Boolean(acciones) || Boolean(estado && !bloqueado);
  return (
    <li className={`dash-agente-tarjeta${bloqueado ? " dash-agente-tarjeta--bloqueado" : ""}`}>
      <div className="dash-agente-tarjeta__cabeza">
        <Cara agente={id} tam="media" />
        <div className="dash-agente-tarjeta__nombre">
          <h2 className="dash-agente-tarjeta__titulo">{a.nombre}</h2>
          <p className="dash-agente-tarjeta__area">
            {a.area} · {a.abarca}
          </p>
        </div>
        {bloqueado ? (
          <Insignia tono="pronto">
            <Icono nombre="candado" tam={12} />
            {bloqueado}
          </Insignia>
        ) : enEquipo ? (
          <Insignia tono="azul">En tu equipo</Insignia>
        ) : (
          <Insignia>Fuera del equipo</Insignia>
        )}
      </div>
      <p className="dash-agente-tarjeta__lema">{a.lema}</p>
      <ul className="dash-agente-tarjeta__capacidades">
        {a.capacidades.map((c) => (
          <li key={c}>
            <Icono nombre="check" tam={16} />
            {c}
          </li>
        ))}
      </ul>
      {conPie ? (
        <div className="dash-agente-tarjeta__pie">
          {estado && !bloqueado ? <PuntoEstado tono={estado.tono} etiqueta={estado.etiqueta} mostrarEtiqueta pulso={estado.pulso} /> : <span />}
          {acciones ? <div className="dash-agente-tarjeta__acciones">{acciones}</div> : null}
        </div>
      ) : null}
    </li>
  );
}

/** Un correo resumido por Clara: quién y cuándo, el asunto, el resumen y lo que conviene hacer. */
export function FilaCorreo({ correo: c }: { correo: ResumenCorreo }) {
  const sugerencia = c.accion && c.accion.trim().toLowerCase() !== "ninguna" ? c.accion : null;
  return (
    <li className="dash-correo">
      <div className="dash-correo__meta">
        {c.nuevo ? <Insignia tono="azul">Nuevo</Insignia> : null}
        <span className="dash-correo__remitente">{c.remitente ?? "Sin remitente"}</span>
        <span className="dash-hora cifras">{c.cuando}</span>
      </div>
      <h3 className="dash-correo__asunto">{c.asunto || "Sin asunto"}</h3>
      <p className="dash-correo__resumen">{c.resumen}</p>
      {sugerencia ? (
        <p className="dash-correo__accion">
          <Icono nombre="flecha" tam={16} />
          {sugerencia}
        </p>
      ) : null}
    </li>
  );
}
