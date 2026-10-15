"use client";

import { useEffect, useRef, useState } from "react";
import { Boton, BotonIcono } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { ConversacionEjemplo } from "./ConversacionEjemplo";
import { Personaje } from "./Personaje";
import { DETALLE } from "./detalle";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { PLANES, planMinimo } from "@/lib/planes";

/** Lo que tarda en salir (igual a --dur-salida). */
const SALIDA_MS = 150;

/**
 * Ficha de un agente: qué es, todo lo que hace, una conversación de ejemplo
 * y en qué plan está. Una ventana de vidrio "frost" (radio 24px, desenfoque
 * de 20px) sobre un velo. Es un <dialog> nativo: se cierra con el botón, con
 * Escape o tocando afuera, y mantiene el foco dentro mientras está abierta.
 * Entra con opacidad y escala 0.96 → 1 (0.4s, curva de entrada) desde el
 * centro, y sale más rápido de lo que entra (0.15s). Con movimiento reducido,
 * solo opacidad.
 */
export function AgenteModal({ agente, onClose }: { agente: IdAgente | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  // El agente que se ve: se queda mientras la ficha sale, aunque ya se haya pedido cerrar
  const [mostrado, setMostrado] = useState<IdAgente | null>(agente);
  const [estado, setEstado] = useState<"cerrada" | "entrando" | "abierta" | "saliendo">("cerrada");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (agente) {
      setMostrado(agente);
      if (!d.open) {
        setEstado("entrando");
        d.showModal();
        d.scrollTop = 0;
        // Dos cuadros: primero se pinta el punto de partida, luego se anima
        const r = requestAnimationFrame(() => requestAnimationFrame(() => setEstado("abierta")));
        return () => cancelAnimationFrame(r);
      }
      setEstado("abierta");
      return;
    }
    if (d.open) {
      setEstado("saliendo");
      const t = window.setTimeout(() => {
        d.close();
        setEstado("cerrada");
        setMostrado(null);
      }, SALIDA_MS);
      return () => window.clearTimeout(t);
    }
  }, [agente]);

  // Mientras está abierta, la página de atrás no se desplaza
  const abierta = estado !== "cerrada";
  useEffect(() => {
    if (!abierta) return;
    const html = document.documentElement;
    const previo = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previo;
    };
  }, [abierta]);

  const info = mostrado ? AGENTE_POR_ID[mostrado] : null;
  const detalle = mostrado ? DETALLE[mostrado] : null;
  const enFree = mostrado ? PLANES.some((p) => p.id === "free" && p.agentes.includes(mostrado)) : false;
  const minimo = mostrado ? planMinimo(mostrado) : null;

  return (
    <dialog
      ref={ref}
      className="ficha-ag"
      data-estado={estado}
      aria-labelledby="agente-modal-titulo"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Clic en el velo (fuera de la caja): el evento llega al propio <dialog>
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {info && detalle && mostrado && minimo ? (
        <div className="ficha-ag__caja" key={mostrado}>
          <div className="ficha-ag__barra">
            <BotonIcono etiqueta="Cerrar la ficha" icono="cerrar" tam="normal" onClick={onClose} className="ficha-ag__cerrar" />
          </div>

          {/* Encabezado: personaje, área, nombre y frase */}
          <header className="ficha-ag__cabeza">
            <Personaje agente={mostrado} className="ficha-ag__personaje" />
            <div className="min-w-0">
              <Etiqueta tono="cielo">
                {info.area} · {info.abarca}
              </Etiqueta>
              <h2 id="agente-modal-titulo" className="t-grande mt-[var(--spacing-4)]">
                {info.nombre}
              </h2>
              <p className="t-intro mt-[var(--spacing-12)]">{info.lema}</p>
            </div>
          </header>

          <div className="ficha-ag__cuerpo">
            <div className="ficha-ag__col">
              <section>
                <h3 className="etiqueta">Qué es y para qué sirve</h3>
                <p className="t-cuerpo mt-[var(--spacing-12)]">{detalle.descripcion}</p>
              </section>

              <section>
                <h3 className="etiqueta">Todo lo que puede hacer</h3>
                <ul className="ag-funciones ag-funciones--una mt-[var(--spacing-16)]">
                  {detalle.funciones.map((f) => (
                    <li key={f.titulo} className="ag-funcion">
                      <Icono nombre="check" tam={20} className="ag-funcion__icono" />
                      <div>
                        <p className="ag-funcion__titulo">{f.titulo}</p>
                        <p className="t-cuerpo">{f.detalle}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="ficha-ag__col">
              <MarcoNavegador
                titulo={`Conversación de ejemplo con ${info.nombre}`}
                pestanas={[{ etiqueta: `${info.nombre} · ${detalle.canal}`, adorno: <Personaje agente={mostrado} avatar />, activa: true }]}
                relleno
              >
                <ConversacionEjemplo agente={mostrado} encabezado={false} />
              </MarcoNavegador>

              <section>
                <h3 className="etiqueta">En qué plan está</h3>
                <ul className="ficha-ag__planes mt-[var(--spacing-16)]">
                  {PLANES.map((p) => {
                    const incluido = p.agentes.includes(mostrado);
                    return (
                      <li key={p.id} className="ficha-ag__plan" data-incluido={incluido ? "true" : "false"}>
                        <span className="t-caption">Atendel</span>
                        <span className="ficha-ag__plan-nombre">{p.nombre.replace("Atendel ", "")}</span>
                        <span className="ficha-ag__plan-estado">
                          {incluido ? <Icono nombre="check" tam={16} /> : null}
                          {incluido ? "Incluido" : "No incluido"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {!enFree ? (
                  <p className="t-chico mt-[var(--spacing-16)]">
                    {info.nombre} llega con {minimo.nombre}. Mientras, puedes empezar gratis con Clara.
                  </p>
                ) : null}
              </section>

              <div className="ficha-ag__acciones">
                <Boton href="/entrar" onClick={onClose}>
                  {enFree ? `Probar a ${info.nombre} gratis` : "Empezar gratis"}
                </Boton>
                <Boton href={`/agentes/${mostrado}`} variante="sutil" flecha onClick={onClose}>
                  Todo sobre {info.nombre}
                </Boton>
                <Boton href="/precios" variante="fantasma" onClick={onClose} className="boton--solo-texto">
                  Ver precios
                </Boton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
