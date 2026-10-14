"use client";

import { Fragment, type ReactNode } from "react";
import { BotonIcono } from "@/components/base/Boton";
import { Escribiendo } from "@/components/base/Escribiendo";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import type { AgenteFijado, ConversacionReciente, Destacado, Evento } from "./tipos";
import { CabezaBloque, CarasAgentes, MarcaAgente, Negritas, Quien, Tocable } from "./util";

/* =====================================================================
   PIEZAS DE LA VISTA RESUMEN (centro del dashboard)
   ===================================================================== */

/* ---------- Bienvenida ---------- */

export function Bienvenida({
  fecha,
  saludo,
  ejemplo,
  resumen,
  acciones,
  equipo,
}: {
  fecha: string | null;
  saludo: string;
  ejemplo?: boolean;
  resumen: ReactNode;
  acciones: ReactNode;
  /** Quién está en el equipo y qué hace ahora (a la derecha en computadora). */
  equipo?: { agentes: IdAgente[]; escribe?: { agente: IdAgente; texto: string } };
}) {
  return (
    <section className="tb-tarjeta tb-bienvenida" aria-labelledby="tb-saludo">
      <div className="tb-bienvenida__texto">
        <div className="tb-bienvenida__sello">
          <span className="tb-texto-2 cifras">{fecha ?? " "}</span>
          {ejemplo ? <Insignia>Datos de ejemplo</Insignia> : null}
        </div>
        <h1 id="tb-saludo" className="t-app-saludo tb-bienvenida__saludo">
          {saludo}
        </h1>
        <p className="tb-bienvenida__resumen">{resumen}</p>
        <div className="tb-bienvenida__acciones">{acciones}</div>
      </div>
      {equipo ? (
        <div className="tb-bienvenida__equipo">
          <span className="tb-equipo" aria-hidden="true">
            {equipo.agentes.map((a) => (
              <MarcaAgente key={a} agente={a} tam={40} className="tb-equipo__cara" />
            ))}
          </span>
          {equipo.escribe ? (
            <span className="tb-bienvenida__ahora">
              <Escribiendo quien={AGENTE_POR_ID[equipo.escribe.agente].nombre} />
              <span>{equipo.escribe.texto}</span>
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/* ---------- Filtros en píldora (por agente) ---------- */

export function Filtros<T extends string>({
  etiqueta,
  opciones,
  activo,
  alCambiar,
}: {
  etiqueta: string;
  opciones: { id: T; etiqueta: string; agente?: IdAgente; icono?: NombreIcono }[];
  activo: T;
  alCambiar: (id: T) => void;
}) {
  return (
    <div className="tb-filtros" role="group" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button key={o.id} type="button" className="tb-filtro" aria-pressed={o.id === activo} onClick={() => alCambiar(o.id)}>
          {o.agente ? <MarcaAgente agente={o.agente} tam={20} /> : o.icono ? <Icono nombre={o.icono} tam={16} /> : null}
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

/* ---------- Actividad: línea de tiempo con relevos ---------- */

export function LineaTiempo({ eventos, nombreTu, vacio }: { eventos: Evento[]; nombreTu: string; vacio: ReactNode }) {
  if (!eventos.length) return <>{vacio}</>;
  const dias: { dia: string; eventos: Evento[] }[] = [];
  for (const e of eventos) {
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo.dia === e.dia) ultimo.eventos.push(e);
    else dias.push({ dia: e.dia, eventos: [e] });
  }
  return (
    <div className="tb-linea">
      {dias.map((d) => (
        <section key={d.dia} className="tb-linea__dia" aria-label={d.dia}>
          <h3 className="tb-linea__fecha" suppressHydrationWarning>
            {d.dia}
          </h3>
          <ol className="tb-linea__eventos">
            {d.eventos.map((e) => (
              <EventoLinea key={e.id} evento={e} nombreTu={nombreTu} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function EventoLinea({ evento: e, nombreTu }: { evento: Evento; nombreTu: string }) {
  if (e.tipo === "simple") {
    return (
      <li className="tb-evento">
        <span className="tb-evento__nodo" aria-hidden="true">
          <Icono nombre={e.icono} tam={16} />
        </span>
        <div className="tb-evento__cuerpo">
          <p className="tb-evento__texto">
            <span className="tb-evento__quien" aria-hidden="true">
              <Quien quien={e.agente} tam={20} nombreTu={nombreTu} />
            </span>
            <Negritas texto={e.texto} />
            {e.insignia ? null : <time className="tb-evento__hora cifras">{e.hora}</time>}
          </p>
          {e.insignia ? (
            <div className="tb-evento__pie">
              <Insignia tono={e.insignia.tono} conPunto>
                {e.insignia.texto}
              </Insignia>
              <time className="tb-evento__hora cifras">{e.hora}</time>
            </div>
          ) : null}
        </div>
      </li>
    );
  }
  if (e.tipo === "relevo") {
    const de = AGENTE_POR_ID[e.de].nombre;
    const a = AGENTE_POR_ID[e.a].nombre;
    return (
      <li className="tb-evento tb-evento--relevo">
        <span className="tb-evento__nodo" aria-hidden="true">
          <Icono nombre="flecha" tam={16} />
        </span>
        <div className="tb-evento__cuerpo">
          <p className="tb-evento__texto">
            <span className="tb-relevo-pareja" aria-hidden="true">
              <MarcaAgente agente={e.de} tam={20} />
              <Icono nombre="chevron-derecha" tam={16} className="tb-relevo-pareja__flecha" />
              <MarcaAgente agente={e.a} tam={20} />
            </span>
            <span>
              <span className="tb-fuerte">{de}</span> le pasó un caso a <span className="tb-fuerte">{a}</span>
            </span>
            <time className="tb-evento__hora cifras">{e.hora}</time>
          </p>
          <div className="tb-hilo">
            <p className="tb-hilo__linea">
              <span className="tb-hilo__quien">{de}</span>
              {e.texto}
            </p>
            {e.respuesta ? (
              <p className="tb-hilo__linea">
                <span className="tb-hilo__quien">{a}</span>
                {e.respuesta}
              </p>
            ) : null}
          </div>
        </div>
      </li>
    );
  }
  return (
    <li className="tb-evento tb-evento--caja">
      <span className="tb-evento__nodo tb-evento__nodo--agente" aria-hidden="true">
        <MarcaAgente agente={e.agente} tam={32} />
      </span>
      <div className="tb-evento__cuerpo">
        <div className="tb-comentario">
          <p className="tb-comentario__cabeza">
            <span>
              <Negritas texto={e.titulo} />
            </span>
            <time className="tb-evento__hora cifras">{e.hora}</time>
          </p>
          {e.lineas ? (
            <ul className="tb-comentario__lineas">
              {e.lineas.map((l, i) => (
                <li key={i}>
                  {l.etiqueta ? <Insignia tono={l.etiqueta === "Urgente" ? "atencion" : "neutra"}>{l.etiqueta}</Insignia> : null}
                  <span>{l.texto}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {e.archivo ? (
            <div className="tb-archivo tb-archivo--en-comentario">
              <span className="tb-archivo__icono" aria-hidden="true">
                <Icono nombre="documento" tam={20} />
              </span>
              <span className="tb-archivo__texto">
                <span className="tb-archivo__nombre">{e.archivo.nombre}</span>
                <span className="tb-archivo__detalle">{e.archivo.detalle}</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/* ---------- Destacados de la semana ---------- */

export function Destacados({
  destacados,
  fijados,
  alFijar,
}: {
  destacados: Destacado[];
  fijados: string[];
  alFijar: (id: string) => void;
}) {
  return (
    <ul className="tb-tarjeta tb-destacados">
      {destacados.map((d) => {
        const fijado = fijados.includes(d.id);
        return (
          <li key={d.id} className="tb-destacado">
            <MarcaAgente agente={d.agente} tam={32} />
            <div className="tb-destacado__texto">
              <p className="tb-destacado__titulo">{d.titulo}</p>
              <p className="tb-destacado__detalle">{d.detalle}</p>
              <p className="tb-destacado__quien">{AGENTE_POR_ID[d.agente].nombre}</p>
            </div>
            <BotonIcono
              etiqueta={fijado ? `Quitar «${d.titulo}» de fijados` : `Fijar «${d.titulo}»`}
              icono="estrella"
              aria-pressed={fijado}
              className={fijado ? "tb-estrella tb-estrella--puesta" : "tb-estrella"}
              onClick={() => alFijar(d.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Agentes fijados (como los repositorios fijados) ---------- */

export function AgentesFijados({ agentes, accion }: { agentes: AgenteFijado[]; accion?: ReactNode }) {
  return (
    <section className="tb-bloque" aria-labelledby="tb-fijados">
      <CabezaBloque id="tb-fijados" titulo="Agentes fijados">
        {accion}
      </CabezaBloque>
      <ul className="tb-fijados">
        {agentes.map((a) => (
          <li key={a.id}>
            <Tocable destino={a} className={`tb-fijado${a.apagado ? " tb-fijado--apagado" : ""}`}>
              <span className="tb-fijado__cabeza">
                <MarcaAgente agente={a.id} tam={24} apagado={a.apagado} />
                <span className="tb-fijado__nombre">{a.nombre}</span>
                <Insignia tono="pronto">{a.area}</Insignia>
                <Icono nombre="fijar" tam={16} className="tb-fijado__pin" />
              </span>
              <span className="tb-fijado__lema">{a.lema}</span>
              <span className="tb-fijado__meta">
                <span className="tb-fijado__color" style={{ background: `var(--agente-${a.id})` }} aria-hidden="true" />
                <span>{a.abarca}</span>
              </span>
              <span className="tb-fijado__pie">
                <PuntoEstado tono={a.estado.tono} etiqueta={a.estado.texto} mostrarEtiqueta />
                {a.datos.length ? (
                  <span className="tb-fijado__datos cifras">
                    {a.datos.map((d, i) => (
                      <Fragment key={d}>
                        {i ? <span aria-hidden="true"> · </span> : null}
                        {d}
                      </Fragment>
                    ))}
                  </span>
                ) : null}
              </span>
            </Tocable>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Conversaciones recientes ---------- */

export function ConversacionesRecientes({
  conversaciones,
  accion,
  vacio,
}: {
  conversaciones: ConversacionReciente[];
  accion?: ReactNode;
  vacio: ReactNode;
}) {
  return (
    <section className="tb-bloque" aria-labelledby="tb-recientes">
      <CabezaBloque id="tb-recientes" titulo="Conversaciones recientes">
        {accion}
      </CabezaBloque>
      {conversaciones.length ? (
        <ul className="tb-tarjeta tb-filas">
          {conversaciones.map((c) => (
            <li key={c.id}>
              <Tocable destino={c} className="tb-fila tb-fila--chat">
                <CarasAgentes agentes={c.agentes} tam={32} />
                <span className="tb-fila__texto">
                  <span className="tb-fila__titulo">{c.nombre}</span>
                  <span className="tb-fila__detalle">{c.ultimo}</span>
                </span>
                <span className="tb-fila__lado">
                  <time className="tb-fila__hora cifras" suppressHydrationWarning>
                    {c.hora}
                  </time>
                  {c.sinLeer ? <Insignia tono="azul" contador={c.sinLeer} etiqueta={`${c.sinLeer} sin leer`} /> : null}
                </span>
              </Tocable>
            </li>
          ))}
        </ul>
      ) : (
        vacio
      )}
    </section>
  );
}

/* ---------- Estado vacío ---------- */

export function EstadoVacio({
  icono,
  agente,
  titulo,
  texto,
  accion,
  plano = false,
}: {
  icono?: NombreIcono;
  agente?: IdAgente;
  titulo: string;
  texto: ReactNode;
  accion?: ReactNode;
  /** Sin tarjeta (dentro de otra tarjeta). */
  plano?: boolean;
}) {
  return (
    <div className={`tb-vacio${plano ? "" : " tb-tarjeta"}`}>
      {agente ? <MarcaAgente agente={agente} tam={40} /> : icono ? <Icono nombre={icono} tam={24} className="tb-vacio__icono" /> : null}
      <p className="tb-vacio__titulo">{titulo}</p>
      <p className="tb-vacio__texto">{texto}</p>
      {accion ? <div className="tb-vacio__accion">{accion}</div> : null}
    </div>
  );
}
