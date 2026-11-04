"use client";

import { useId, type ReactNode } from "react";
import { BotonIcono } from "@/components/base/Boton";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { normalizar } from "@/lib/estadisticas";
import { useCerrable } from "./Centro";
import { Fragmentos } from "./Fragmentos";
import { Accionable, Cifra, Dona, EnlaceMas, Hora, Letra, MarcaAgente, Tarjeta, Tendencia, Vacio, VerTodo } from "./Piezas";
import { fechaLarga, saludo } from "./tiempo";
import type { Accion, Estado, InsigniaDato } from "./tipos";

/* =====================================================================
   El inicio del panel, en este orden: el chat (el nombre del negocio en
   grande y la caja para pedirle algo al equipo), los agentes (cada uno con
   su personaje y lo que hizo), los pendientes y las estadísticas en
   pequeño. Lo comparten /panel (datos reales) y /pruebalo (ejemplo).
   Todo lo que se ve lleva a su sección, ya filtrada.
   ===================================================================== */

export type AgenteResumen = Accion & {
  id: IdAgente;
  estado: Estado;
  /** Lo que hizo (el número grande). null: sin dato, se ve "—". */
  cifra: number | null;
  unidad: string;
  /** Si su plan no lo incluye: "Con Atendel One". */
  bloqueado?: string;
};

export type FilaPendiente = Accion & {
  id: string;
  /** Qué es (en gris, a la derecha): "Visto bueno", "Correo", "Conversación". */
  tipo: string;
  titulo: string;
  detalle?: string;
  /** Un agente (su personaje) o una persona (sus iniciales). */
  agente?: IdAgente;
  quien?: string;
  fecha?: string;
  haceMin?: number;
  insignia?: InsigniaDato;
  /** Un correo: la acción que sugiere Clara (para filtrar por acción). */
  accion?: string;
};

export type CifraResumen = Accion & { id: string; etiqueta: string; valor: number | null; delta?: number | null; icono: NombreIcono };

export type PropsResumen = {
  negocio: string;
  /** "Buenos días, Ana" (se arma con la hora del navegador). */
  nombre?: string;
  ahora: Date | null;
  /** El aviso que se cierra (y se queda cerrado en este navegador). */
  aviso?: { clave: string; texto: ReactNode; accion: Accion & { etiqueta: string } };
  /** La caja para pedirle algo al equipo (<Inicio sinTitulo>). */
  pedido: ReactNode;
  agentes: AgenteResumen[];
  verAgentes: Accion;
  pendientes: { total: number | null; filas: FilaPendiente[]; accion: Accion; vacio?: ReactNode };
  estadisticas: {
    periodo: string;
    cifras: CifraResumen[];
    uso: { usados: number | null; limite: number; plan: string } & Accion;
    accion: Accion;
  };
  /** En /pruebalo: "Datos de ejemplo" junto al título. */
  marca?: ReactNode;
};

const formato = new Intl.NumberFormat("es-MX");

export function ResumenVista({ negocio, nombre, ahora, aviso, pedido, agentes, verAgentes, pendientes, estadisticas, marca }: PropsResumen) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="pnl-pagina pnl-resumen">
      <header className="pnl-hola">
        <Fragmentos cantidad={11} semilla={3} tamMin={10} tamMax={28} className="pnl-hola__frag" />
        <p className="pnl-hola__saludo">
          {saludo(ahora)}
          {nombre ? `, ${nombre}` : ""}
          {ahora ? <span className="pnl-hola__fecha">{fechaLarga(ahora)}</span> : null}
        </p>
        <h1 className="pnl-hola__titulo">
          {negocio}
          {marca}
        </h1>
      </header>

      {aviso ? <AvisoCerrable {...aviso} /> : null}

      <section className="pnl-tarjeta pnl-chat" aria-label="Pregúntale a tu equipo">
        {pedido}
      </section>

      <section className="pnl-seccion" aria-labelledby={`${id}-equipo`}>
        <div className="pnl-seccion__cabeza">
          <h2 id={`${id}-equipo`} className="pnl-seccion__titulo">
            Tu equipo
          </h2>
          <EnlaceMas accion={verAgentes}>Ver agentes</EnlaceMas>
        </div>
        <ul className="pnl-agentes">
          {agentes.map((a, i) => (
            <li key={a.id}>
              <TarjetaAgente a={a} indice={i} />
            </li>
          ))}
        </ul>
      </section>

      <div className="pnl-fila">
        <Pendientes {...pendientes} ahora={ahora} />
        <EstadisticasMini {...estadisticas} />
      </div>
    </div>
  );
}

/** El aviso de ancho completo que se cierra con su ✕ (como "Check it out"). */
function AvisoCerrable({ clave, texto, accion }: { clave: string; texto: ReactNode; accion: Accion & { etiqueta: string } }) {
  const [abierto, cerrar] = useCerrable(clave);
  if (!abierto) return null;
  return (
    <div className="pnl-aviso" role="note">
      <span className="pnl-aviso__icono" aria-hidden="true">
        <Icono nombre="grafica" tam={16} />
      </span>
      <p className="pnl-aviso__texto">{texto}</p>
      <Accionable accion={accion} className="pnl-aviso__accion pnl-picable">
        {accion.etiqueta}
      </Accionable>
      <BotonIcono etiqueta="Cerrar el aviso" icono="cerrar" onClick={cerrar} className="pnl-aviso__cerrar" />
    </div>
  );
}

/** Un agente: su personaje, su estado y lo que hizo. Toda la tarjeta lleva a su sección. */
function TarjetaAgente({ a, indice }: { a: AgenteResumen; indice: number }) {
  const info = AGENTE_POR_ID[a.id];
  return (
    <Accionable
      accion={a}
      className={`pnl-agente pnl-picable${a.bloqueado ? " pnl-agente--bloqueado" : ""}`}
      etiqueta={`${info.nombre}, ${info.area}. ${a.bloqueado ?? a.estado.etiqueta}${a.bloqueado ? "" : `. ${a.cifra === null ? "Sin datos" : formato.format(a.cifra)} ${a.unidad}`}`}
    >
      <span className="pnl-agente__cabeza">
        <MarcaAgente id={a.id} tam={40} />
        {a.bloqueado ? (
          <Insignia>
            <Icono nombre="candado" tam={16} />
            {a.bloqueado}
          </Insignia>
        ) : (
          <PuntoEstado tono={a.estado.tono} etiqueta={a.estado.etiqueta} pulso={a.estado.pulso} />
        )}
      </span>
      <span className="pnl-agente__nombre">{info.nombre}</span>
      <span className="pnl-agente__area">{a.bloqueado ? info.lema : a.estado.etiqueta}</span>
      {a.bloqueado ? null : (
        <span className="pnl-agente__dato">
          <Cifra valor={a.cifra} indice={indice} className="pnl-agente__cifra" />
          <span className="pnl-agente__unidad">{a.unidad}</span>
        </span>
      )}
    </Accionable>
  );
}

/** Pendientes: la caja "N pendientes ›" y la lista (nombre y tipo a la izquierda; hora a la derecha). */
function Pendientes({ total, filas, accion, vacio, ahora }: PropsResumen["pendientes"] & { ahora: Date | null }) {
  return (
    <Tarjeta
      titulo="Pendientes"
      subtitulo="Lo que espera algo de ti"
      className="pnl-pendientes"
      accion={
        <Accionable accion={accion} className="pnl-caja-pendientes pnl-picable" etiqueta={total === null ? "Ver pendientes" : `${total} pendientes: ver todos`}>
          <Icono nombre="campana" tam={16} />
          <Cifra valor={total} />
          <span>{total === 1 ? "pendiente" : "pendientes"}</span>
          <Icono nombre="chevron-derecha" tam={16} />
        </Accionable>
      }
      pie={filas.length ? <VerTodo accion={accion}>Ver todos los pendientes</VerTodo> : null}
    >
      {filas.length ? (
        <ul className="pnl-movs">
          {filas.map((f) => (
            <li key={f.id}>
              <FilaMovimiento f={f} ahora={ahora} />
            </li>
          ))}
        </ul>
      ) : (
        (vacio ?? <Vacio icono="check-circulo" titulo="Todo al día" texto="Cuando un agente necesite algo de ti, aparece aquí." compacto />)
      )}
    </Tarjeta>
  );
}

/** Una fila de la lista de pendientes. */
export function FilaMovimiento({ f, ahora }: { f: FilaPendiente; ahora: Date | null }) {
  return (
    <Accionable accion={f} className="pnl-mov pnl-picable">
      {f.agente ? <MarcaAgente id={f.agente} tam={32} /> : <Letra nombre={f.quien ?? f.titulo} />}
      <span className="pnl-mov__texto">
        <span className="pnl-mov__titulo">{f.titulo}</span>
        {f.detalle ? <span className="pnl-mov__detalle">{f.detalle}</span> : null}
      </span>
      <span className="pnl-mov__fin">
        {f.fecha || f.haceMin !== undefined ? <Hora item={f} ahora={ahora} /> : null}
        {f.insignia ? (
          <Insignia tono={f.insignia.tono} conPunto>
            {f.insignia.texto}
          </Insignia>
        ) : (
          <span className="pnl-mov__tipo">{f.tipo}</span>
        )}
      </span>
    </Accionable>
  );
}

/** Las estadísticas en pequeño: la dona del uso del plan y los números del periodo, con su cambio. */
function EstadisticasMini({ periodo, cifras, uso, accion }: PropsResumen["estadisticas"]) {
  const pct = uso.usados === null ? null : Math.min(100, Math.round((uso.usados / uso.limite) * 100));
  return (
    <Tarjeta titulo="Estadísticas" subtitulo={periodo} className="pnl-mini" accion={<EnlaceMas accion={accion}>Ver todo</EnlaceMas>}>
      <Accionable
        accion={uso}
        className="pnl-mini__uso pnl-picable"
        etiqueta={uso.usados === null ? `${uso.plan}: sin datos de uso` : `${uso.plan}: ${formato.format(uso.usados)} de ${formato.format(uso.limite)} mensajes este mes`}
      >
        <Dona
          partes={uso.usados === null ? [] : [{ id: "usados", valor: uso.usados, color: "var(--c-accion-texto)" }]}
          total={uso.limite}
          tam={88}
          grosor={10}
          etiqueta={pct === null ? "Sin datos" : `${pct}% del plan`}
          centro={
            <span className="pnl-mini__pct">
              <Cifra valor={pct} sufijo="%" />
            </span>
          }
        />
        <span className="pnl-mini__uso-texto">
          <span className="pnl-mini__uso-titulo">Uso del plan</span>
          <span className="pnl-mini__uso-detalle">
            <Cifra valor={uso.usados} /> de {formato.format(uso.limite)} mensajes
          </span>
          <span className="pnl-mini__uso-detalle">{uso.plan}</span>
        </span>
      </Accionable>
      <ul className="pnl-mini__rejilla">
        {cifras.map((c, i) => (
          <li key={c.id}>
            <Accionable accion={c} className="pnl-mini__dato pnl-picable">
              <span className="pnl-mini__icono" aria-hidden="true">
                <Icono nombre={c.icono} tam={16} />
              </span>
              <Cifra valor={c.valor} indice={i + 1} className="pnl-mini__cifra" />
              <span className="pnl-mini__etiqueta">{c.etiqueta}</span>
              {c.delta !== undefined ? <Tendencia delta={c.delta} /> : null}
            </Accionable>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

/** ¿Esta acción sugerida es la que se pidió? Igual que en Estadísticas: sin acentos, mayúsculas ni el punto final. */
export function coincideAccion(accion: string | undefined, buscada: string) {
  if (!accion) return false;
  const b = normalizar(buscada);
  return Boolean(b) && normalizar(accion) === b;
}
