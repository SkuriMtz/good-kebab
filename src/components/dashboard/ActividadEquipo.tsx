"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Pestanas } from "@/components/base/Pestanas";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { BotonAccion, CaraAgente, EnlaceAccion, Vacio } from "./piezas";
import type { Destacado, GrupoEventos, Pendiente, Vacio as DatosVacio } from "./tipos";

/*
 * Centro del resumen, abajo de la gráfica: tres pestañas en píldora.
 * - Actividad: línea de tiempo por día (quién hizo qué y a qué hora), con
 *   la línea vertical que une los eventos, relevos entre agentes y archivos.
 * - Espera tu visto bueno: lo que un agente dejó listo y no sale sin ti.
 * - Destacados: las cifras que vale la pena ver.
 * Las pestañas también se abren con #actividad, #pendientes o #destacados.
 */

export type IdPestana = "actividad" | "pendientes" | "destacados";
const PESTANAS: IdPestana[] = ["actividad", "pendientes", "destacados"];

function LineaTiempo({ grupos, vacio }: { grupos: GrupoEventos[]; vacio: DatosVacio }) {
  if (!grupos.length) return <Vacio vacio={vacio} icono="reloj" />;
  return (
    <div className="tb-linea">
      {grupos.map((g) => (
        <section key={g.dia} className="tb-linea__dia" aria-label={g.dia}>
          <h3 className="tb-linea__fecha">{g.dia}</h3>
          <ol className="tb-linea__eventos">
            {g.eventos.map((e) => {
              const a = AGENTE_POR_ID[e.agente];
              return (
                <li key={e.id} className="tb-evento">
                  <CaraAgente id={e.agente} tam={28} className="tb-evento__cara" />
                  <div className="tb-evento__cuerpo">
                    <p className="tb-evento__texto">
                      <strong>{a.nombre}</strong> {e.texto}
                    </p>
                    {e.detalle ? <p className="tb-evento__detalle">{e.detalle}</p> : null}
                    {e.insignia || e.archivo || e.relevo || e.accion ? (
                      <div className="tb-evento__extras">
                        {e.insignia ? (
                          <Insignia tono={e.insignia.tono} conPunto>
                            {e.insignia.texto}
                          </Insignia>
                        ) : null}
                        {e.relevo ? (
                          <span className="tb-relevo">
                            <CaraAgente id={e.agente} tam={20} />
                            <Icono nombre="flecha" tam={14} />
                            <CaraAgente id={e.relevo} tam={20} />
                            <span>
                              {a.nombre} → {AGENTE_POR_ID[e.relevo].nombre}
                            </span>
                          </span>
                        ) : null}
                        {e.archivo ? (
                          <span className="tb-archivo">
                            <Icono nombre="documento" tam={14} />
                            {e.archivo}
                          </span>
                        ) : null}
                        {e.accion ? (
                          <EnlaceAccion accion={e.accion} className="tb-enlace tb-enlace--chico">
                            {e.accion.etiqueta}
                            <Icono nombre="chevron-derecha" tam={14} />
                          </EnlaceAccion>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <time className="tb-evento__hora cifras">{e.hora}</time>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

function Pendientes({
  lista,
  vacio,
  aprobados,
  alAprobar,
  alDeshacer,
}: {
  lista: Pendiente[];
  vacio: DatosVacio;
  aprobados: Set<string>;
  alAprobar: (id: string) => void;
  alDeshacer: (id: string) => void;
}) {
  if (!lista.length) return <Vacio vacio={vacio} icono="check-circulo" />;
  return (
    <ul className="tb-pendientes">
      {lista.map((p) => {
        const a = AGENTE_POR_ID[p.agente];
        const listo = aprobados.has(p.id);
        return (
          <li key={p.id} className="tb-pendiente" data-aprobado={listo ? "true" : undefined}>
            <div className="tb-pendiente__cabeza">
              <CaraAgente id={p.agente} tam={28} />
              <p className="tb-pendiente__titulo">
                <strong>{a.nombre}</strong>
                <span>{p.titulo}</span>
              </p>
              {listo ? (
                <Insignia tono="exito" conPunto>
                  Aprobado
                </Insignia>
              ) : (
                <Insignia tono="atencion" conPunto>
                  Por aprobar
                </Insignia>
              )}
            </div>
            <blockquote className="tb-pendiente__mensaje">{p.cita}</blockquote>
            <p className="tb-pendiente__detalle">{listo ? `Aprobado: en tu cuenta, ${a.nombre} lo enviaría ahora. En esta demostración no sale nada.` : p.detalle}</p>
            <div className="tb-pendiente__acciones">
              {p.revisar ? <BotonAccion accion={p.revisar} variante="fantasma" /> : null}
              {p.aprobable ? (
                listo ? (
                  <Boton variante="fantasma" tam="compacto" icono={<Icono nombre="repetir" />} onClick={() => alDeshacer(p.id)}>
                    Deshacer
                  </Boton>
                ) : (
                  <Boton variante="sutil" tam="compacto" icono={<Icono nombre="check" />} onClick={() => alAprobar(p.id)}>
                    Aprobar y enviar
                  </Boton>
                )
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Destacados({ lista, vacio }: { lista: Destacado[]; vacio: DatosVacio }) {
  if (!lista.length) return <Vacio vacio={vacio} icono="estrella" />;
  return (
    <ul className="tb-destacados">
      {lista.map((d) => (
        <li key={d.id} className="tb-destacado">
          <p className="tb-destacado__cifra">{d.cifra}</p>
          <p className="tb-destacado__texto">{d.texto}</p>
          {d.detalle ? <p className="tb-destacado__detalle">{d.detalle}</p> : null}
          {d.agente ? (
            <p className="tb-destacado__fuente">
              <CaraAgente id={d.agente} tam={20} />
              Según {AGENTE_POR_ID[d.agente].nombre}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function ActividadEquipo({
  eventos,
  eventosVacio,
  pendientes,
  pendientesVacio,
  pendientesEtiqueta,
  destacados,
  destacadosVacio,
  pestana,
  alCambiarPestana,
  aprobados,
  alAprobar,
  alDeshacer,
}: {
  eventos: GrupoEventos[];
  eventosVacio: DatosVacio;
  pendientes: Pendiente[];
  pendientesVacio: DatosVacio;
  pendientesEtiqueta: string;
  destacados: Destacado[];
  destacadosVacio: DatosVacio;
  pestana?: IdPestana;
  alCambiarPestana?: (p: IdPestana) => void;
  aprobados: Set<string>;
  alAprobar: (id: string) => void;
  alDeshacer: (id: string) => void;
}) {
  const [libre, setLibre] = useState<IdPestana>("actividad");
  const activa = pestana ?? libre;
  const raiz = useRef<HTMLElement>(null);
  const cambiar = (p: IdPestana) => {
    if (pestana === undefined) setLibre(p);
    alCambiarPestana?.(p);
  };

  // #pendientes (u otra pestaña) en la dirección: se abre y se acerca
  const avisar = useRef(alCambiarPestana);
  useEffect(() => {
    avisar.current = alCambiarPestana;
  }, [alCambiarPestana]);
  useEffect(() => {
    const leer = () => {
      const h = window.location.hash.slice(1) as IdPestana;
      if (!PESTANAS.includes(h)) return;
      setLibre(h);
      avisar.current?.(h);
      raiz.current?.scrollIntoView({ block: "start" });
    };
    leer();
    window.addEventListener("hashchange", leer);
    return () => window.removeEventListener("hashchange", leer);
  }, []);

  const porAprobar = pendientes.filter((p) => !aprobados.has(p.id)).length;
  const etiqueta = (texto: string, extra?: ReactNode) => (
    <span className="tb-pestana">
      {texto}
      {extra}
    </span>
  );

  return (
    <section ref={raiz} id="actividad" aria-labelledby="actividad-titulo" className="tb-bloque tb-actividad">
      <h2 id="actividad-titulo" className="sr-only">
        Actividad de tu equipo
      </h2>
      <Pestanas
        etiqueta="Actividad de tu equipo"
        alineacion="izquierda"
        activa={activa}
        alCambiar={(id) => cambiar(id as IdPestana)}
        className="tb-pestanas"
        classNamePanel="tb-pestanas__panel"
        pestanas={[
          { id: "actividad", etiqueta: etiqueta("Actividad"), contenido: <LineaTiempo grupos={eventos} vacio={eventosVacio} /> },
          {
            id: "pendientes",
            etiqueta: etiqueta(
              pendientesEtiqueta,
              porAprobar ? <Insignia tono="atencion" contador={porAprobar} etiqueta={`${porAprobar} por aprobar`} /> : null,
            ),
            contenido: <Pendientes lista={pendientes} vacio={pendientesVacio} aprobados={aprobados} alAprobar={alAprobar} alDeshacer={alDeshacer} />,
          },
          { id: "destacados", etiqueta: etiqueta("Destacados"), contenido: <Destacados lista={destacados} vacio={destacadosVacio} /> },
        ]}
      />
    </section>
  );
}
