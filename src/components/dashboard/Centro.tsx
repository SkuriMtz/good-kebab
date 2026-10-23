"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Boton } from "@/components/base/Boton";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Menu } from "@/components/base/Menu";
import { AGENTE_POR_ID, IDS_AGENTES, type IdAgente } from "@/lib/agentes";
import { EnlaceMas, Hora, MarcaAgente, PilaAgentes } from "./Piezas";
import { saludo } from "./tiempo";
import type { Accion, ElementoLista, Evento, TarjetaEvento } from "./tipos";

/* =====================================================================
   INICIO (como el home de GitHub): el saludo grande, la caja para
   pedirle algo a tu equipo (con a quién se lo pides y el botón de
   enviar, el único azul de la pantalla) y una fila de atajos con borde.
   ===================================================================== */

/** A quién se le pide: un agente o el equipo (un grupo). */
export type OpcionPedido = { id: string; nombre: string; detalle?: string; agentes: IdAgente[] };

/** Un atajo de la fila de abajo (Agendar cita, Resumir un correo…). */
export type Atajo = Accion & { id: string; etiqueta: string; icono: NombreIcono };

export function Inicio({
  ahora,
  nombre,
  opciones,
  alPedir,
  atajos,
}: {
  ahora: Date | null;
  nombre?: string;
  opciones: OpcionPedido[];
  /** Al enviar: el texto y a quién (el id de la opción). */
  alPedir: (texto: string, opcion: string) => void;
  atajos: Atajo[];
}) {
  const id = useId().replace(/:/g, "");
  const [texto, setTexto] = useState("");
  const [elegida, setElegida] = useState(opciones[0]?.id ?? "");
  const opcion = opciones.find((o) => o.id === elegida) ?? opciones[0];
  const listo = Boolean(texto.trim() && opcion);

  const enviar = (e?: FormEvent) => {
    e?.preventDefault();
    if (!listo || !opcion) return;
    alPedir(texto.trim(), opcion.id);
  };

  const quien = !opcion ? "tu equipo" : opcion.agentes.length > 1 ? "tu equipo" : opcion.nombre;

  return (
    <section className="dash-inicio" aria-labelledby={`${id}-saludo`}>
      <h1 id={`${id}-saludo`} className="t-app-titulo-grande dash-inicio__saludo">
        <PilaAgentes ids={IDS_AGENTES} tam={20} className="dash-inicio__equipo" />
        <span>
          {saludo(ahora)}
          {nombre ? `, ${nombre}` : ""}
        </span>
      </h1>

      <form className="dash-pedir" onSubmit={enviar}>
        <label htmlFor={`${id}-pedido`} className="sr-only">
          Pídele algo a {quien}
        </label>
        <textarea
          id={`${id}-pedido`}
          className="dash-pedir__campo"
          rows={2}
          placeholder={`Pídele algo a ${quien}…`}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              enviar();
            }
          }}
        />
        <div className="dash-pedir__pie">
          {opcion && opciones.length > 1 ? (
            <Menu
              etiqueta="A quién se lo pides"
              etiquetaDisparador={`A quién se lo pides: ${opcion.nombre}`}
              aspecto="boton"
              claseDisparador="dash-pedir__quien"
              disparador={
                <span className="dash-pedir__elegido">
                  {opcion.agentes.length > 1 ? <PilaAgentes ids={opcion.agentes} tam={20} /> : <MarcaAgente id={opcion.agentes[0]} tam={20} />}
                  {opcion.nombre}
                </span>
              }
              elementos={opciones.map((o) => ({
                id: o.id,
                etiqueta: o.nombre,
                descripcion: o.detalle,
                actual: o.id === opcion.id,
                alElegir: () => setElegida(o.id),
              }))}
            />
          ) : opcion ? (
            <span className="dash-pedir__elegido dash-pedir__elegido--solo">
              <MarcaAgente id={opcion.agentes[0]} tam={20} />
              {opcion.nombre}
            </span>
          ) : null}
          <span className="dash-pedir__ayuda" aria-hidden="true">
            Enter para enviar
          </span>
          <button type="submit" className="boton boton--principal boton--compacto dash-pedir__enviar" disabled={!listo} aria-label={`Enviar a ${opcion?.nombre ?? "tu equipo"}`}>
            <Icono nombre="enviar" tam={16} />
          </button>
        </div>
      </form>

      {atajos.length ? (
        <ul className="dash-atajos" aria-label="Atajos">
          {atajos.map((a) => (
            <li key={a.id}>
              {a.href ? (
                <Boton variante="sutil" href={a.href} icono={<Icono nombre={a.icono} tam={16} />}>
                  {a.etiqueta}
                </Boton>
              ) : (
                <Boton variante="sutil" onClick={a.alElegir} icono={<Icono nombre={a.icono} tam={16} />}>
                  {a.etiqueta}
                </Boton>
              )}
            </li>
          ))}
        </ul>
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
