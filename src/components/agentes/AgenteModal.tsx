"use client";

import { useEffect, useRef, useState } from "react";
import { Boton, BotonIcono } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { ConversacionEjemplo } from "./ConversacionEjemplo";
import { Personaje } from "./Personaje";
import type { IdAgente } from "@/lib/agentes";
import { agenteDe, planesDe, planMinimoDe } from "@/i18n";
import { useIdioma } from "@/i18n/Idioma";

/** Lo que tarda en irse la ficha (--dur-salida); con movimiento reducido es solo un fundido. */
function duracionSalida() {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dur-salida"));
  return Number.isFinite(v) ? v * 1000 : 150;
}

/**
 * Ficha de un agente: qué es, todo lo que hace, una conversación de ejemplo
 * y en qué plan está. Una ventana de vidrio "frost" (radio 24px) centrada
 * sobre el velo. Es un <dialog> nativo: se cierra con la ✕, con Escape o
 * tocando afuera, y mantiene el foco dentro mientras está abierta.
 * Entra con opacidad + escala 0.98→1 + 8px (0.4s, curva de entrada) y sale
 * más rápido (0.15s) por el mismo camino.
 */
export function AgenteModal({ agente, onClose }: { agente: IdAgente | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const cajaRef = useRef<HTMLDivElement>(null);
  // El agente que se ve: se queda mientras la ficha se va, para que no se vacíe al cerrar
  const [mostrado, setMostrado] = useState<IdAgente | null>(agente);
  const abierto = agente !== null;

  useEffect(() => {
    if (agente) setMostrado(agente);
  }, [agente]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto) {
      delete d.dataset.cerrando;
      if (!d.open) d.showModal();
      if (cajaRef.current) cajaRef.current.scrollTop = 0;
      const html = document.documentElement;
      const previo = html.style.overflow;
      html.style.overflow = "hidden";
      return () => {
        html.style.overflow = previo;
      };
    }
    if (d.open) {
      d.dataset.cerrando = "true";
      const t = window.setTimeout(() => {
        d.close();
        delete d.dataset.cerrando;
        setMostrado(null);
      }, duracionSalida());
      return () => window.clearTimeout(t);
    }
  }, [abierto, agente]);

  const { idioma, d } = useIdioma();
  const F = d.ficha;
  const id = mostrado;
  const info = id ? agenteDe(idioma, id) : null;
  const detalle = id ? d.detalle[id] : null;
  const minimo = id ? planMinimoDe(idioma, id) : null;
  const enFree = minimo?.id === "free";

  return (
    <dialog
      ref={ref}
      className="ficha"
      aria-labelledby="agente-modal-titulo"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Clic en el velo (fuera de la ventana): el evento llega al propio <dialog>
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {info && detalle && id ? (
        <div ref={cajaRef} className="ficha__caja vidrio vidrio--frost" key={id}>
          <header className="ficha__cabeza">
            <Personaje agente={id} className="ficha__personaje" />
            <div className="ficha__titulos">
              <Etiqueta tono="cielo">
                {info.area} · {info.abarca}
              </Etiqueta>
              <h2 id="agente-modal-titulo" className="t-grande">
                {info.nombre}
              </h2>
              <p className="t-intro">{info.lema}</p>
            </div>
            <BotonIcono etiqueta={F.cerrar} icono="cerrar" tam="normal" className="ficha__cerrar" onClick={onClose} />
          </header>

          <div className="ficha__cuerpo">
            <div className="ficha__columna">
              <section>
                <h3 className="etiqueta">{F.queEs}</h3>
                <p className="t-cuerpo ficha__parrafo">{detalle.descripcion}</p>
              </section>
              <section>
                <h3 className="etiqueta">{F.todo}</h3>
                <ul className="funciones funciones--compacta">
                  {detalle.funciones.map((f) => (
                    <li key={f.titulo} className="funciones__fila">
                      <p className="funciones__titulo">{f.titulo}</p>
                      <p className="t-cuerpo">{f.detalle}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="ficha__columna">
              <MarcoNavegador
                titulo={d.paginaAgentes.conversacionCon(info.nombre)}
                pestanas={[{ etiqueta: `${info.nombre} · ${detalle.canal}`, adorno: <Personaje agente={id} avatar />, activa: true }]}
              >
                <ConversacionEjemplo agente={id} idioma={idioma} />
              </MarcoNavegador>

              <section>
                <h3 className="etiqueta">{F.enQuePlan}</h3>
                <ul className="ficha__planes">
                  {planesDe(idioma).map((p) => {
                    const incluido = p.agentes.includes(id);
                    return (
                      <li key={p.id} data-incluido={incluido ? "true" : "false"}>
                        <span className="ficha__plan-nombre">{p.nombre.replace("Atendel ", "")}</span>
                        <span className="ficha__plan-estado">
                          <Icono nombre={incluido ? "check" : "cerrar"} tam={14} />
                          {incluido ? F.incluido : F.noIncluido}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {!enFree && minimo ? <p className="t-chico ficha__nota">{F.llegaCon(info.nombre, minimo.nombre)}</p> : null}
                <div className="ficha__acciones">
                  <Boton href="/entrar" onClick={onClose}>
                    {enFree ? F.probarGratis(info.nombre) : F.empezarGratis}
                  </Boton>
                  <Boton href={`/pruebalo?con=${id}#conversaciones`} variante="sutil" onClick={onClose}>
                    {F.pruebaloCon(info.nombre)}
                  </Boton>
                  <Boton href={`/agentes/${id}`} variante="sutil" onClick={onClose}>
                    {F.suPagina}
                  </Boton>
                  <Boton href="/precios" variante="fantasma" flecha onClick={onClose}>
                    {F.verPrecios}
                  </Boton>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
