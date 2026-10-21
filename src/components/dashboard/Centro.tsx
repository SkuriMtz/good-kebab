"use client";

import { useId, useState, type ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { Boton } from "@/components/base/Boton";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { Accionable, CabezaBloque, EnlaceMas, Hora, MarcaAgente, PilaAgentes } from "./Piezas";
import { fechaLarga, saludo } from "./tiempo";
import type { Accion, ElementoLista, Estado, Evento, TarjetaEvento } from "./tipos";

/* =====================================================================
   BIENVENIDA: el único momento protagonista de la pantalla. Saludo por
   la hora, el día en una frase, las acciones y, a la derecha, el día en
   tres renglones que llevan a donde se resuelve cada cosa.
   ===================================================================== */

export type RenglonDia = Accion & { id: string; icono: NombreIcono; texto: string; detalle: string; tono?: "atencion" | "error" };

export function Bienvenida({
  ahora,
  nombre,
  marca,
  resumen,
  acciones,
  dia,
  tituloDia = "Tu día",
}: {
  ahora: Date | null;
  nombre?: string;
  /** Algo junto a la fecha (en /pruebalo: la insignia "Datos de ejemplo"). */
  marca?: ReactNode;
  resumen: ReactNode;
  acciones: ReactNode;
  dia?: RenglonDia[];
  tituloDia?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <section className={`dash-bienvenida${dia?.length ? " dash-bienvenida--con-dia" : ""}`} aria-labelledby={`${id}-saludo`}>
      <div className="dash-bienvenida__principal">
        <p className="dash-bienvenida__fecha">
          <span className="cifras">{ahora ? fechaLarga(ahora) : " "}</span>
          {marca}
        </p>
        <h1 id={`${id}-saludo`} className="t-app-saludo dash-bienvenida__saludo">
          {saludo(ahora)}
          {nombre ? `, ${nombre}` : ""}
        </h1>
        <p className="dash-bienvenida__resumen">{resumen}</p>
        <div className="dash-bienvenida__acciones">{acciones}</div>
      </div>
      {dia?.length ? (
        <div className="dash-bienvenida__dia">
          <h2 className="dash-bienvenida__dia-titulo">{tituloDia}</h2>
          <ul>
            {dia.map((r) => (
              <li key={r.id}>
                <Accionable accion={r} className={`dash-renglon${r.tono ? ` dash-renglon--${r.tono}` : ""}`}>
                  <Icono nombre={r.icono} tam={20} className="dash-renglon__icono" />
                  <span className="dash-renglon__texto">
                    <span className="dash-renglon__titulo">{r.texto}</span>
                    <span className="dash-renglon__detalle">{r.detalle}</span>
                  </span>
                  <Icono nombre="chevron-derecha" tam={16} className="dash-renglon__flecha" />
                </Accionable>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/* =====================================================================
   LÍNEA DE TIEMPO (el feed): cada evento con el personaje, la frase
   (quién, qué hizo, sobre qué, hace cuánto) y el objeto incrustado.
   Los eventos iguales van juntos y se despliegan.
   ===================================================================== */

export function LineaTiempo({ eventos, ahora, pie }: { eventos: Evento[]; ahora: Date | null; pie?: ReactNode }) {
  return (
    <div className="dash-feed">
      <ol className="dash-feed__lista">
        {eventos.map((ev) => (
          <EventoFila key={ev.id} evento={ev} ahora={ahora} />
        ))}
      </ol>
      {pie}
    </div>
  );
}

function EventoFila({ evento: ev, ahora }: { evento: Evento; ahora: Date | null }) {
  const quien = AGENTE_POR_ID[ev.agente].nombre;
  return (
    <li className="dash-evento">
      <div className="dash-evento__avatar">{ev.con ? <PilaAgentes ids={[ev.agente, ev.con]} tam={24} /> : <MarcaAgente id={ev.agente} tam={32} />}</div>
      <div className="dash-evento__cuerpo">
        <p className="dash-evento__frase">
          <strong>{quien}</strong> {ev.verbo}
          {ev.objeto ? (
            <>
              {" "}
              <strong>{ev.objeto}</strong>
            </>
          ) : null}
          {ev.complemento ? ` ${ev.complemento}` : null}
          <span className="dash-evento__cuando">
            <span aria-hidden="true"> · </span>
            <Hora item={ev} ahora={ahora} />
          </span>
        </p>
        {ev.insignia ? (
          <Insignia tono={ev.insignia.tono} conPunto className="dash-evento__insignia">
            {ev.insignia.texto}
          </Insignia>
        ) : null}
        {ev.tarjeta ? <TarjetaObjeto tarjeta={ev.tarjeta} /> : null}
        {ev.agrupado ? <Desplegable etiqueta={ev.agrupado.etiqueta} elementos={ev.agrupado.elementos} /> : null}
        {ev.accion && (ev.accion.href || ev.accion.alElegir) ? (
          <EnlaceMas accion={ev.accion}>{ev.accion.etiqueta}</EnlaceMas>
        ) : null}
      </div>
    </li>
  );
}

function FilaLista({ e }: { e: ElementoLista }) {
  return (
    <li className="dash-objeto__fila">
      <span className="dash-objeto__fila-texto">
        <span className="dash-objeto__titulo">{e.titulo}</span>
        {e.detalle ? <span className="dash-objeto__detalle">{e.detalle}</span> : null}
      </span>
      {e.insignia ? (
        <Insignia tono={e.insignia.tono} conPunto>
          {e.insignia.texto}
        </Insignia>
      ) : null}
    </li>
  );
}

/** El objeto del evento (la cita, el mensaje, el archivo, la lista), en una tarjeta incrustada. */
export function TarjetaObjeto({ tarjeta: t }: { tarjeta: TarjetaEvento }) {
  if (t.tipo === "cita") {
    return (
      <div className="dash-objeto dash-objeto--fila">
        <Icono nombre="calendario" tam={20} className="dash-objeto__icono" />
        <span className="dash-objeto__fila-texto">
          <span className="dash-objeto__titulo">{t.titulo}</span>
          <span className="dash-objeto__detalle cifras">{t.detalle}</span>
        </span>
        {t.insignia ? (
          <Insignia tono={t.insignia.tono} conPunto>
            {t.insignia.texto}
          </Insignia>
        ) : null}
      </div>
    );
  }
  if (t.tipo === "archivo") {
    return (
      <div className="dash-objeto dash-objeto--fila">
        <Icono nombre="documento" tam={20} className="dash-objeto__icono" />
        <span className="dash-objeto__fila-texto">
          <span className="dash-objeto__titulo">{t.nombre}</span>
          <span className="dash-objeto__detalle">{t.detalle}</span>
        </span>
      </div>
    );
  }
  if (t.tipo === "mensaje") {
    return (
      <figure className="dash-objeto dash-objeto--mensaje">
        {t.para ? <figcaption className="dash-objeto__para">{t.para}</figcaption> : null}
        <blockquote className="dash-objeto__cita">{t.texto}</blockquote>
        {t.pie ? <p className="dash-objeto__detalle">{t.pie}</p> : null}
      </figure>
    );
  }
  return (
    <div className="dash-objeto dash-objeto--lista">
      <ul>
        {t.elementos.map((e) => (
          <FilaLista key={e.id} e={e} />
        ))}
      </ul>
      {t.pie ? <p className="dash-objeto__pie">{t.pie}</p> : null}
    </div>
  );
}

/** Un evento agrupado que se despliega (la altura con grid-template-rows, como el acordeón de la base). */
function Desplegable({ etiqueta, elementos }: { etiqueta: string; elementos: ElementoLista[] }) {
  const [abierto, setAbierto] = useState(false);
  const id = `${useId().replace(/:/g, "")}-grupo`;
  return (
    <div className="dash-desplegable" data-abierto={abierto ? "true" : undefined}>
      <button type="button" className="dash-desplegable__boton" aria-expanded={abierto} aria-controls={id} onClick={() => setAbierto((v) => !v)}>
        <Icono nombre="chevron" tam={16} className="dash-desplegable__chevron" />
        {abierto ? "Ocultar" : etiqueta}
        <span className="dash-desplegable__cuenta cifras">{elementos.length}</span>
      </button>
      <div id={id} className="dash-desplegable__cuerpo" role="region" aria-label={etiqueta}>
        <div className="dash-desplegable__interior">
          <ul className="dash-objeto dash-objeto--lista">
            {elementos.map((e) => (
              <FilaLista key={e.id} e={e} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   ESPERA TU VISTO BUENO: lo que un agente dejó listo y no sale sin ti.
   ===================================================================== */

export type Pendiente = {
  id: string;
  agente: IdAgente;
  titulo: string;
  para: string;
  texto: string;
  alAprobar: string;
  haceMin?: number;
  fecha?: string;
  editar?: Accion;
};

export function ListaVistoBueno({
  pendientes,
  aprobados,
  alAprobar,
  alDeshacer,
  ahora,
}: {
  pendientes: Pendiente[];
  aprobados: Set<string>;
  alAprobar: (id: string) => void;
  alDeshacer: (id: string) => void;
  ahora: Date | null;
}) {
  return (
    <ul className="dash-pendientes">
      {pendientes.map((p) => {
        const listo = aprobados.has(p.id);
        const quien = AGENTE_POR_ID[p.agente].nombre;
        return (
          <li key={p.id} className={`dash-pendiente${listo ? " dash-pendiente--listo" : ""}`}>
            <div className="dash-pendiente__cabeza">
              <MarcaAgente id={p.agente} tam={32} />
              <div className="dash-pendiente__titulos">
                <p className="dash-pendiente__titulo">{p.titulo}</p>
                <p className="dash-pendiente__meta">
                  {quien} · <Hora item={p} ahora={ahora} />
                </p>
              </div>
              {listo ? (
                <Insignia tono="exito" conPunto>
                  Aprobado
                </Insignia>
              ) : (
                <Insignia tono="atencion" conPunto>
                  Espera tu visto bueno
                </Insignia>
              )}
            </div>
            <figure className="dash-objeto dash-objeto--mensaje">
              <figcaption className="dash-objeto__para">{p.para}</figcaption>
              <blockquote className="dash-objeto__cita">{p.texto}</blockquote>
            </figure>
            <div className="dash-pendiente__pie" aria-live="polite">
              {listo ? (
                <>
                  <p className="dash-pendiente__nota">
                    <Icono nombre="check-circulo" tam={16} />
                    {p.alAprobar}
                  </p>
                  <button type="button" className="dash-enlace" onClick={() => alDeshacer(p.id)}>
                    Deshacer
                  </button>
                </>
              ) : (
                <>
                  <p className="dash-pendiente__nota">Al aprobar: {p.alAprobar}</p>
                  <div className="dash-pendiente__botones">
                    {p.editar ? (
                      p.editar.href ? (
                        <Boton variante="fantasma" tam="compacto" href={p.editar.href}>
                          Cambiar algo
                        </Boton>
                      ) : (
                        <Boton variante="fantasma" tam="compacto" onClick={p.editar.alElegir}>
                          Cambiar algo
                        </Boton>
                      )
                    ) : null}
                    <Boton variante="sutil" tam="compacto" icono={<Icono nombre="check" tam={16} />} onClick={() => alAprobar(p.id)}>
                      Aprobar
                    </Boton>
                  </div>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* =====================================================================
   DESTACADOS: lo que marcaste con estrella para tenerlo a la mano.
   ===================================================================== */

export function ListaDestacados({
  elementos,
  alQuitar,
}: {
  elementos: (Accion & { id: string; agente: IdAgente; titulo: string; detalle: string })[];
  alQuitar: (id: string) => void;
}) {
  return (
    <ul className="dash-lista dash-lista--borde">
      {elementos.map((d) => (
        <li key={d.id} className="dash-fila">
          <Accionable accion={d} className="dash-fila__principal">
            <MarcaAgente id={d.agente} tam={32} />
            <span className="dash-fila__texto">
              <span className="dash-fila__titulo">{d.titulo}</span>
              <span className="dash-fila__detalle">{d.detalle}</span>
            </span>
          </Accionable>
          <button type="button" className="boton-icono boton-icono--capa boton-icono--compacto dash-estrella" aria-pressed="true" aria-label={`Quitar «${d.titulo}» de destacados`} title="Quitar de destacados" onClick={() => alQuitar(d.id)}>
            <Icono nombre="estrella" tam={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}

/* =====================================================================
   AGENTES FIJADOS (como los repositorios fijados): nombre en azul, su
   área en una etiqueta, qué hace y, abajo, su estado y su semana.
   ===================================================================== */

export type Fijado = Accion & {
  id: IdAgente;
  estado: Estado;
  meta: { icono: NombreIcono; texto: string }[];
};

export function AgentesFijados({ fijados, accion, titulo = "Agentes fijados" }: { fijados: Fijado[]; accion?: ReactNode; titulo?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <section aria-labelledby={`${id}-fijados`} className="dash-bloque">
      <CabezaBloque id={`${id}-fijados`} titulo={titulo} accion={accion} />
      <ul className="dash-fijados">
        {fijados.map((f) => {
          const info = AGENTE_POR_ID[f.id];
          return (
            <li key={f.id} className="dash-fijado">
              <div className="dash-fijado__cabeza">
                <MarcaAgente id={f.id} tam={24} />
                <Accionable accion={f} className="dash-fijado__nombre">
                  {info.nombre}
                </Accionable>
                <Insignia className="dash-fijado__area">{info.area}</Insignia>
              </div>
              <p className="dash-fijado__lema">{info.lema}</p>
              <div className="dash-fijado__meta">
                <PuntoEstado tono={f.estado.tono} etiqueta={f.estado.etiqueta} mostrarEtiqueta pulso={f.estado.pulso} />
                {f.meta.map((m) => (
                  <span key={m.texto} className="dash-fijado__dato">
                    <Icono nombre={m.icono} tam={16} />
                    {m.texto}
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* =====================================================================
   CONVERSACIONES RECIENTES: filas de 52px, quién, por dónde, lo último
   que se dijo, qué agente la lleva y hace cuánto.
   ===================================================================== */

export type FilaConversacion = Accion & {
  id: string;
  titulo: string;
  /** Canal o con quién ("WhatsApp", "Con Lola"). */
  canal?: string;
  ultimo?: string;
  agentes: IdAgente[];
  /** Persona del otro lado (cliente): sus iniciales; si no, el personaje. */
  persona?: string;
  sinLeer?: boolean;
  fecha?: string;
  haceMin?: number;
};

export function ConversacionesRecientes({
  filas,
  ahora,
  accion,
  vacio,
  titulo = "Conversaciones recientes",
}: {
  filas: FilaConversacion[];
  ahora: Date | null;
  accion?: ReactNode;
  vacio?: ReactNode;
  titulo?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <section aria-labelledby={`${id}-convs`} className="dash-bloque">
      <CabezaBloque id={`${id}-convs`} titulo={titulo} accion={accion} />
      {filas.length ? (
        <ul className="dash-lista dash-lista--borde">
          {filas.map((c) => (
            <li key={c.id}>
              <Accionable accion={c} className={`dash-conv${c.sinLeer ? " dash-conv--nueva" : ""}`}>
                {c.persona ? (
                  <Avatar nombre={c.persona} tam={32} />
                ) : c.agentes.length > 1 ? (
                  <PilaAgentes ids={c.agentes} tam={24} className="dash-conv__pila" />
                ) : (
                  <MarcaAgente id={c.agentes[0]} tam={32} />
                )}
                <span className="dash-conv__texto">
                  <span className="dash-conv__linea">
                    <span className="dash-conv__titulo">{c.titulo}</span>
                    {c.canal ? <span className="dash-conv__canal">{c.canal}</span> : null}
                  </span>
                  {c.ultimo ? <span className="dash-conv__ultimo">{c.ultimo}</span> : null}
                </span>
                <span className="dash-conv__fin">
                  <Hora item={c} ahora={ahora} />
                  <span className="dash-conv__quien">
                    {c.persona ? <PilaAgentes ids={c.agentes} tam={20} /> : null}
                    {c.sinLeer ? <Insignia punto tono="azul" etiqueta="Sin leer" /> : null}
                  </span>
                </span>
              </Accionable>
            </li>
          ))}
        </ul>
      ) : (
        vacio
      )}
    </section>
  );
}
