"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BotonIcono, claseBotonBase } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { ConversacionEjemplo } from "./ConversacionEjemplo";
import { DETALLE } from "./detalle";
import { DatosAgente, PlanesAgente, RetratoAgente } from "./PiezasAgente";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { PLANES, planMinimo } from "@/lib/planes";

/** Lee una duración de la base ("0.2s") en milisegundos. */
function duracion(token: string, respaldo: number) {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(token));
  return Number.isFinite(v) ? v * 1000 : respaldo;
}

/**
 * Ficha de un agente: una ventana de vidrio "frost" (radio 24px, desenfoque)
 * con su cabecera de perfil (retrato, área, nombre, lo que hace en una línea
 * y las acciones), qué es, todo lo que hace, una conversación de ejemplo y
 * en qué plan está.
 * Es un <dialog> nativo: foco atrapado y devuelto al cerrar; se cierra con
 * la ✕, con Escape o tocando afuera. Entra con opacidad + escala 0.96→1
 * (0.4s, curva de entrada) y sale más rápido (0.2s); con movimiento
 * reducido, solo opacidad.
 */
export function AgenteModal({ agente, onClose }: { agente: IdAgente | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  // Lo que se pinta: el agente pedido, o el último mientras la ficha sale
  const [ultimo, setUltimo] = useState<IdAgente | null>(agente);
  if (agente && agente !== ultimo) setUltimo(agente);
  const mostrado = agente ?? ultimo;
  const cierre = useRef(0);
  const desbordePrevio = useRef<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const html = document.documentElement;
    if (agente) {
      window.clearTimeout(cierre.current);
      if (!d.open) {
        d.showModal();
        if (desbordePrevio.current === null) {
          desbordePrevio.current = html.style.overflow;
          html.style.overflow = "hidden";
        }
        // Dos cuadros: primero se pinta cerrada, luego entra
        requestAnimationFrame(() => requestAnimationFrame(() => (d.dataset.visible = "true")));
      }
      if (caja.current) caja.current.scrollTop = 0;
      return;
    }
    if (d.open) {
      d.dataset.visible = "false";
      cierre.current = window.setTimeout(() => {
        d.close();
        setUltimo(null);
        if (desbordePrevio.current !== null) {
          html.style.overflow = desbordePrevio.current;
          desbordePrevio.current = null;
        }
      }, duracion("--dur-micro", 200));
    }
  }, [agente]);

  // Si la página se va con la ficha abierta, se devuelve el scroll
  useEffect(
    () => () => {
      window.clearTimeout(cierre.current);
      if (desbordePrevio.current !== null) document.documentElement.style.overflow = desbordePrevio.current;
    },
    [],
  );

  const info = mostrado ? AGENTE_POR_ID[mostrado] : null;
  const detalle = mostrado ? DETALLE[mostrado] : null;
  const enFree = mostrado ? PLANES.some((p) => p.id === "free" && p.agentes.includes(mostrado)) : false;

  return (
    <dialog
      ref={ref}
      className="ficha-agente"
      aria-labelledby="ficha-agente-titulo"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Clic en el velo (fuera de la caja): el evento llega al propio <dialog>
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {info && detalle && mostrado ? (
        <div className="ficha-agente__caja" ref={caja} key={mostrado} data-lenis-prevent>
          <header className="ficha-agente__cabeza">
            <RetratoAgente agente={mostrado} tam="chico" className="ficha-agente__retrato" />
            <div className="ficha-agente__identidad">
              <Etiqueta tono="tenue">
                {info.area} · {info.abarca}
              </Etiqueta>
              <h2 id="ficha-agente-titulo" className="ficha-agente__nombre">
                {info.nombre}
              </h2>
            </div>
            <BotonIcono etiqueta="Cerrar la ficha" icono="cerrar" tam="normal" className="ficha-agente__cerrar" onClick={onClose} />
            <p className="ficha-agente__lema">{info.lema}</p>
          </header>

          <div className="ficha-agente__acciones">
            <Link href="/entrar" className={claseBotonBase("principal")} onClick={onClose}>
              {enFree ? `Probar a ${info.nombre} gratis` : "Empezar gratis"}
            </Link>
            <Link href={`/agentes/${mostrado}`} className={claseBotonBase("sutil")} onClick={onClose}>
              Ver su perfil completo
            </Link>
            <Link href="/precios" className={claseBotonBase("fantasma")} onClick={onClose}>
              Ver precios
            </Link>
          </div>
          {!enFree ? (
            <p className="ficha-agente__aviso">
              {info.nombre} llega con {planMinimo(mostrado).nombre}. Mientras, puedes empezar gratis con Clara.
            </p>
          ) : null}

          <div className="ficha-agente__cuerpo">
            <div className="ficha-agente__columna">
              <section aria-labelledby="ficha-que-es">
                <Etiqueta as="h3" tono="tenue" id="ficha-que-es">
                  Qué es y para qué sirve
                </Etiqueta>
                <p className="ficha-agente__lectura">{detalle.descripcion}</p>
                <DatosAgente agente={mostrado} className="ficha-agente__datos" />
              </section>
              <section aria-labelledby="ficha-hace">
                <Etiqueta as="h3" tono="tenue" id="ficha-hace">
                  Todo lo que puede hacer
                </Etiqueta>
                <ul className="ficha-agente__funciones">
                  {detalle.funciones.map((f) => (
                    <li key={f.titulo}>
                      <p className="ficha-agente__funcion">{f.titulo}</p>
                      <p className="ficha-agente__detalle">{f.detalle}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="ficha-agente__columna">
              <section className="ficha-agente__panel" aria-label={`Conversación de ejemplo con ${info.nombre}`}>
                <ConversacionEjemplo agente={mostrado} cabecera />
              </section>
              <section aria-labelledby="ficha-plan">
                <Etiqueta as="h3" tono="tenue" id="ficha-plan">
                  En qué plan está
                </Etiqueta>
                <PlanesAgente agente={mostrado} compacto />
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
