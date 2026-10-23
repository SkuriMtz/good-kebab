"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Boton, BotonIcono } from "@/components/base/Boton";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Menu, type ElementoMenu } from "@/components/base/Menu";
import { Personaje } from "@/components/agentes/Personaje";
import { Marca } from "@/components/Logo";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { Accionable, EnlaceMas, Hora, MarcaAgente, PilaAgentes } from "./Piezas";
import type { Accion, ElementoLista, Evento, TarjetaEvento } from "./tipos";

/* =====================================================================
   INICIO: calco del home de GitHub. El ícono y la bienvenida, la caja
   grande para pedir algo (abajo: qué pides, a quién, "+" y enviar, el
   único botón azul), la fila de atajos con borde, "Conoce a tu equipo",
   "Primeros pasos" y la actividad reciente en filas simples.
   ===================================================================== */

/** A quién se le pide: un agente o el equipo. */
export type OpcionPedido = { id: string; nombre: string; detalle?: string; agentes: IdAgente[] };

/** Qué pides ("Pedir ▾"): escribe el principio del pedido y elige al agente. */
export type ModoPedido = { id: string; etiqueta: string; icono: NombreIcono; texto: string; opcion?: string };

/** Un atajo con borde: prepara la caja (`modo`), navega (href/alElegir) o abre una lista (`menu`). */
export type Atajo = Accion & { id: string; etiqueta: string; icono: NombreIcono; modo?: string; menu?: ElementoMenu[] };

const sinAcentos = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function Inicio({
  titulo,
  opciones,
  modos,
  alPedir,
  atajos,
}: {
  titulo: string;
  opciones: OpcionPedido[];
  modos: ModoPedido[];
  /** Al enviar: el texto y a quién (el id de la opción). */
  alPedir: (texto: string, opcion: string) => void;
  atajos: Atajo[];
}) {
  const id = useId().replace(/:/g, "");
  const campo = useRef<HTMLTextAreaElement>(null);
  const [texto, setTexto] = useState("");
  const [elegida, setElegida] = useState(opciones[0]?.id ?? "");
  const [modo, setModo] = useState(modos[0]?.id ?? "");
  const [sugerida, setSugerida] = useState(0);
  const opcion = opciones.find((o) => o.id === elegida) ?? opciones[0];
  const modoActual = modos.find((m) => m.id === modo) ?? modos[0];
  const agentesSolos = opciones.filter((o) => o.agentes.length === 1);

  // "@" para elegir agente: la palabra que se está escribiendo al final
  const arroba = /(^|\s)@([a-zA-ZÀ-ÿ]*)$/.exec(texto);
  const sugerencias = arroba ? agentesSolos.filter((o) => sinAcentos(o.nombre).startsWith(sinAcentos(arroba[2]))) : [];
  const actual = sugerencias[Math.min(sugerida, sugerencias.length - 1)];

  const enfocar = () =>
    requestAnimationFrame(() => {
      const el = campo.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });

  const usarModo = (m: ModoPedido) => {
    setModo(m.id);
    if (m.opcion) setElegida(m.opcion);
    setTexto(m.texto);
    enfocar();
  };

  const mencionar = (o: OpcionPedido) => {
    setElegida(o.id);
    setTexto((t) => t.replace(/@[a-zA-ZÀ-ÿ]*$/, `@${o.nombre} `));
    setSugerida(0);
    enfocar();
  };

  // Si el texto menciona a un agente (@Lola), va con él; si no, con el elegido
  const destino = () => agentesSolos.find((o) => sinAcentos(texto).includes(`@${sinAcentos(o.nombre)}`)) ?? opcion;
  const listo = Boolean(texto.trim() && opcion);

  const enviar = (e?: FormEvent) => {
    e?.preventDefault();
    const d = destino();
    if (!texto.trim() || !d) return;
    alPedir(texto.trim(), d.id);
  };

  return (
    <section className="dash-inicio" aria-labelledby={`${id}-saludo`}>
      <h1 id={`${id}-saludo`} className="dash-inicio__saludo">
        <Marca className="dash-inicio__icono" />
        {titulo}
      </h1>

      <form className="dash-pedir" onSubmit={enviar}>
        <label htmlFor={`${id}-pedido`} className="sr-only">
          Pídele algo a tu equipo
        </label>
        <textarea
          ref={campo}
          id={`${id}-pedido`}
          className="dash-pedir__campo"
          rows={2}
          placeholder="Pídele algo a tu equipo o escribe @ para elegir agente"
          value={texto}
          aria-autocomplete="list"
          aria-controls={sugerencias.length ? `${id}-sugerencias` : undefined}
          aria-activedescendant={actual ? `${id}-sug-${actual.id}` : undefined}
          onChange={(e) => {
            setTexto(e.target.value);
            setSugerida(0);
          }}
          onKeyDown={(e) => {
            if (sugerencias.length && actual) {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const n = sugerencias.length;
                setSugerida((i) => (Math.min(i, n - 1) + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                mencionar(actual);
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              enviar();
            }
          }}
        />
        {sugerencias.length ? (
          <ul id={`${id}-sugerencias`} role="listbox" aria-label="Agentes" className="dash-pedir__sugerencias">
            {sugerencias.map((o) => (
              <li
                key={o.id}
                id={`${id}-sug-${o.id}`}
                role="option"
                aria-selected={o === actual}
                className="dash-pedir__sugerencia"
                onMouseDown={(e) => {
                  e.preventDefault();
                  mencionar(o);
                }}
              >
                <MarcaAgente id={o.agentes[0]} tam={20} />
                <span className="dash-pedir__sugerencia-nombre">{o.nombre}</span>
                <span className="dash-pedir__sugerencia-detalle">{o.detalle}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="dash-pedir__pie">
          {modoActual ? (
            <Menu
              etiqueta="Qué quieres pedir"
              etiquetaDisparador={`Qué quieres pedir: ${modoActual.etiqueta}`}
              aspecto="boton"
              claseDisparador="dash-control"
              disparador={
                <span className="dash-control__texto">
                  <Icono nombre={modoActual.icono} tam={16} />
                  {modoActual.etiqueta}
                </span>
              }
              elementos={modos.map((m) => ({ id: m.id, etiqueta: m.etiqueta, icono: m.icono, actual: m.id === modoActual.id, alElegir: () => usarModo(m) }))}
            />
          ) : null}
          {opcion && opciones.length > 1 ? (
            <Menu
              etiqueta="A quién se lo pides"
              etiquetaDisparador={`A quién se lo pides: ${opcion.nombre}`}
              aspecto="boton"
              claseDisparador="dash-control"
              disparador={
                <span className="dash-control__texto">
                  {opcion.agentes.length > 1 ? <Icono nombre="usuarios" tam={16} /> : <MarcaAgente id={opcion.agentes[0]} tam={20} />}
                  {opcion.nombre}
                </span>
              }
              elementos={opciones.map((o) => ({ id: o.id, etiqueta: o.nombre, descripcion: o.detalle, actual: o.id === opcion.id, alElegir: () => setElegida(o.id) }))}
            />
          ) : null}
          <Menu
            etiqueta="Agregar al pedido"
            aspecto="icono"
            claseDisparador="dash-control-cuadro"
            disparador={<Icono nombre="mas" tam={16} />}
            elementos={[
              {
                id: "mencionar",
                etiqueta: "Mencionar a un agente",
                descripcion: "Escribe @ y su nombre",
                icono: "usuarios",
                alElegir: () => {
                  setTexto((t) => (t && !/\s$/.test(t) ? `${t} @` : `${t}@`));
                  enfocar();
                },
              },
              { id: "archivo", etiqueta: "Adjuntar un archivo", icono: "documento", pronto: true },
            ]}
          />
          <button type="submit" className="boton boton--principal boton--compacto dash-pedir__enviar" disabled={!listo} aria-label={`Enviar a ${destino()?.nombre ?? "tu equipo"}`}>
            <Icono nombre="enviar" tam={16} />
          </button>
        </div>
      </form>

      {atajos.length ? (
        <ul className="dash-atajos" aria-label="Atajos">
          {atajos.map((a) => {
            const icono = <Icono nombre={a.icono} tam={16} />;
            const m = a.modo ? modos.find((x) => x.id === a.modo) : undefined;
            return (
              <li key={a.id}>
                {a.menu ? (
                  <Menu
                    etiqueta={a.etiqueta}
                    aspecto="boton"
                    claseDisparador="dash-atajo-menu"
                    alineacion="fin"
                    disparador={
                      <span className="dash-control__texto">
                        {icono}
                        {a.etiqueta}
                      </span>
                    }
                    elementos={a.menu}
                  />
                ) : a.href ? (
                  <Boton variante="sutil" href={a.href} icono={icono}>
                    {a.etiqueta}
                  </Boton>
                ) : (
                  <Boton variante="sutil" onClick={m ? () => usarModo(m) : a.alElegir} icono={icono}>
                    {a.etiqueta}
                  </Boton>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

/** "Conoce a tu equipo": los cuatro personajes en grande (en el lugar de la tarjeta de video). Se cierra con la ✕. */
export function TarjetaEquipo({
  agentes,
  texto,
  alCerrar,
}: {
  agentes: (Accion & { id: IdAgente; nota?: string; apagado?: boolean })[];
  texto: string;
  alCerrar: () => void;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <section className="dash-equipo" aria-labelledby={`${id}-equipo`}>
      <BotonIcono etiqueta="Cerrar «Conoce a tu equipo»" icono="cerrar" className="dash-equipo__cerrar" onClick={alCerrar} />
      <h2 id={`${id}-equipo`} className="dash-equipo__titulo">
        Conoce a tu equipo
      </h2>
      <p className="dash-equipo__texto">{texto}</p>
      <ul className="dash-equipo__lista">
        {agentes.map((a) => {
          const info = AGENTE_POR_ID[a.id];
          return (
            <li key={a.id}>
              <Accionable accion={a} className={`dash-equipo__agente${a.apagado ? " dash-equipo__agente--apagado" : ""}`} etiqueta={`${info.nombre}, ${a.nota ?? info.area}`}>
                <Personaje agente={a.id} className="dash-equipo__personaje" />
                <span className="dash-equipo__nombre">{info.nombre}</span>
                <span className="dash-equipo__area">{a.nota ?? info.area}</span>
              </Accionable>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Un paso de "Primeros pasos": hecho o con su botón. */
export type Paso = Accion & { id: string; titulo: string; detalle: string; listo: boolean; boton: string };

/** "Primeros pasos" con su barra de avance ("1 de 3 listo"), como "Getting started". */
export function PrimerosPasos({ pasos }: { pasos: Paso[] }) {
  const id = useId().replace(/:/g, "");
  const listos = pasos.filter((p) => p.listo).length;
  return (
    <section className="dash-seccion" aria-labelledby={`${id}-pasos`}>
      <div className="dash-seccion__cabeza">
        <h2 id={`${id}-pasos`} className="dash-seccion__titulo">
          Primeros pasos
        </h2>
        <span className="dash-avance">
          <span className="dash-avance__barra" role="progressbar" aria-label="Primeros pasos" aria-valuemin={0} aria-valuemax={pasos.length} aria-valuenow={listos}>
            <span style={{ width: `${(listos / pasos.length) * 100}%` }} />
          </span>
          <span>
            {listos} de {pasos.length} {listos === 1 ? "listo" : "listos"}
          </span>
        </span>
      </div>
      <ol className="dash-lista dash-lista--borde">
        {pasos.map((p) => (
          <li key={p.id} className={`dash-paso${p.listo ? " dash-paso--listo" : ""}`}>
            {p.listo ? <Icono nombre="check-circulo" tam={16} className="dash-paso__marca" /> : <span className="dash-paso__circulo" aria-hidden="true" />}
            <span className="dash-paso__texto">
              <span className="dash-paso__titulo">
                {p.titulo}
                {p.listo ? <span className="sr-only"> (listo)</span> : null}
              </span>
              <span className="dash-paso__detalle">{p.detalle}</span>
            </span>
            {p.listo ? null : p.href ? (
              <Boton variante="sutil" tam="compacto" href={p.href}>
                {p.boton}
              </Boton>
            ) : (
              <Boton variante="sutil" tam="compacto" onClick={p.alElegir}>
                {p.boton}
              </Boton>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** La actividad reciente en filas simples: quién, qué hizo y hace cuánto. */
export function ActividadReciente({ eventos, ahora, accion, vacio }: { eventos: Evento[]; ahora: Date | null; accion?: ReactNode; vacio?: ReactNode }) {
  const id = useId().replace(/:/g, "");
  return (
    <section className="dash-seccion" aria-labelledby={`${id}-reciente`}>
      <div className="dash-seccion__cabeza">
        <h2 id={`${id}-reciente`} className="dash-seccion__titulo">
          Actividad reciente
        </h2>
        {accion}
      </div>
      {eventos.length ? (
        <ul className="dash-lista dash-lista--borde">
          {eventos.map((ev) => {
            const contenido = (
              <>
                {ev.con ? <PilaAgentes ids={[ev.agente, ev.con]} tam={20} /> : <MarcaAgente id={ev.agente} tam={20} />}
                <span className="dash-reciente__frase">
                  <strong>{AGENTE_POR_ID[ev.agente].nombre}</strong> {ev.verbo}
                  {ev.objeto ? (
                    <>
                      {" "}
                      <strong>{ev.objeto}</strong>
                    </>
                  ) : null}
                  {ev.complemento ? ` ${ev.complemento}` : null}
                </span>
                <Hora item={ev} ahora={ahora} />
              </>
            );
            return (
              <li key={ev.id} className="dash-reciente">
                {ev.accion && (ev.accion.href || ev.accion.alElegir) && !ev.agrupado ? (
                  <Accionable accion={ev.accion} className="dash-reciente__fila">
                    {contenido}
                  </Accionable>
                ) : (
                  <div className="dash-reciente__fila">{contenido}</div>
                )}
                {ev.agrupado ? (
                  <div className="dash-reciente__mas">
                    <Desplegable etiqueta={ev.agrupado.etiqueta} elementos={ev.agrupado.elementos} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        vacio
      )}
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
              ) : null}
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

/** Algo que se cierra con su ✕ y se queda cerrado en este navegador (si se puede guardar). */
export function useCerrable(clave: string): [boolean, () => void] {
  const [abierto, setAbierto] = useState(true);
  useEffect(() => {
    try {
      if (window.localStorage.getItem(clave) === "1") setAbierto(false);
    } catch {
      /* sin almacenamiento: se queda abierto */
    }
  }, [clave]);
  const cerrar = () => {
    setAbierto(false);
    try {
      window.localStorage.setItem(clave, "1");
    } catch {
      /* sin almacenamiento: solo se cierra ahora */
    }
  };
  return [abierto, cerrar];
}
