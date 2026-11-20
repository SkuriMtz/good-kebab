"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icono } from "@/components/base/Iconos";
import { Marca } from "@/components/Logo";
import { Personaje } from "./Personaje";
import type { IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";
import { agenteDe, t, type Idioma } from "@/i18n";

/** Archivos que el agente menciona («precios-zona.xlsx»): se muestran como adjunto. */
const ARCHIVO = /[^\s,:;]+\.(?:xlsx|pdf|docx)/g;

/**
 * Cómo funciona Atendel, dentro del celular de muestra (el chat de la app):
 * Atendel ya sabe lo que pasó (lo leyó en tu WhatsApp, tu correo o tus
 * apps) y te avisa; tú solo le dices «Soluciónalo»; Atendel se
 * lo pasa al agente que le toca, el agente lo resuelve y te cuenta qué hizo
 * (y lo que quedó, con su palomita). Los textos salen del diccionario
 * (conversacion.conAtendel) y los nombres son de ejemplo.
 * Al llegar a la pantalla, los mensajes entran uno tras otro (con los tres
 * puntos de «escribiendo»); con «reducir movimiento», todo desde el inicio.
 * - `activo`: si se pasa, entran cuando se vuelve true (el recorrido de
 *   /agentes, donde todas las pantallas están en el mismo celular).
 * - `pintada`: la pantalla del color del agente (texto oscuro).
 */
export function ConversacionAtendel({ agente, idioma = "es", activo, pintada = false }: { agente: IdAgente; idioma?: Idioma; activo?: boolean; pintada?: boolean }) {
  const d = t(idioma);
  const C = d.conversacion;
  const info = agenteDe(idioma, agente);
  const guion = C.conAtendel[agente];
  const nota = d.detalle[agente].conversacion.findLast((m) => m.de === "nota")?.texto;
  const archivos = guion.reporte.match(ARCHIVO) ?? [];
  // 1 Atendel te avisa · 2 tú: «Soluciónalo» · 3 Atendel se lo pasa al agente · 4 el agente te cuenta · 5 lo que quedó
  const pasos = nota ? 5 : 4;

  const raiz = useRef<HTMLDivElement>(null);
  const [vistos, setVistos] = useState(0);
  const [escribe, setEscribe] = useState<"aviso" | "atendel" | "agente" | null>(null);
  const corrio = useRef(false);
  const porActivo = activo !== undefined;

  useEffect(() => {
    const el = raiz.current;
    if (!el || corrio.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || (!porActivo && typeof IntersectionObserver === "undefined")) {
      setVistos(pasos);
      return;
    }
    if (porActivo && !activo) return;
    let cancelado = false;
    const timers: number[] = [];
    const esperar = (ms: number) => new Promise<void>((ok) => timers.push(window.setTimeout(ok, ms)));
    const correr = async () => {
      corrio.current = true;
      await esperar(porActivo ? 200 : 350);
      if (cancelado) return;
      setEscribe("aviso");
      await esperar(800);
      if (cancelado) return;
      setEscribe(null);
      setVistos(1);
      await esperar(900);
      if (cancelado) return;
      setVistos(2);
      setEscribe("atendel");
      await esperar(700);
      if (cancelado) return;
      setEscribe(null);
      setVistos(3);
      setEscribe("agente");
      await esperar(1400);
      if (cancelado) return;
      setEscribe(null);
      setVistos(4);
      if (pasos > 4) {
        await esperar(700);
        if (!cancelado) setVistos(5);
      }
    };
    if (porActivo) {
      void correr();
      return () => {
        cancelado = true;
        timers.forEach((x) => window.clearTimeout(x));
        // Si se cortó a la mitad, que se vea completa (sin volver a empezar)
        setEscribe(null);
        setVistos(pasos);
      };
    }
    const ver = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        ver.disconnect();
        void correr();
      },
      { threshold: 0.35 },
    );
    ver.observe(el);
    return () => {
      cancelado = true;
      ver.disconnect();
      timers.forEach((x) => window.clearTimeout(x));
    };
  }, [pasos, porActivo, activo]);

  const avatarAtendel = (
    <span className="conva__avatar conva__avatar--atendel" aria-hidden="true">
      <Marca className="h-[16px] w-[16px]" />
    </span>
  );
  const puntos = (
    <span className="conva__puntos">
      <i />
      <i />
      <i />
    </span>
  );

  return (
    <div ref={raiz} className={`conva${pintada ? " conva--pintada" : ""}`} style={{ "--agente": PERSONAJES[agente].color } as CSSProperties}>
      <div className="conva__cabeza">
        <span className="conva__logo">
          <Marca className="h-[18px] w-[18px]" />
        </span>
        <span className="conva__titulo">Atendel</span>
      </div>

      <ol className="conva__mensajes" aria-live="polite">
        {vistos >= 1 ? (
          <li className="conva__fila">
            {avatarAtendel}
            <p className="conva__burbuja">{guion.aviso}</p>
          </li>
        ) : escribe === "aviso" ? (
          <li className="conva__fila" aria-label="Atendel…">
            {avatarAtendel}
            {puntos}
          </li>
        ) : null}

        {vistos >= 2 ? (
          <li className="conva__fila conva__fila--tu">
            <p className="conva__burbuja conva__burbuja--tu">{guion.pedido}</p>
          </li>
        ) : null}

        {vistos >= 3 ? (
          <li className="conva__fila">
            {avatarAtendel}
            <p className="conva__burbuja">
              {C.seLoPaso(info.nombre)}
              <span className="conva__chip">
                <Personaje agente={agente} avatar className="conva__chip-cara" />
                {info.nombre}
              </span>
            </p>
          </li>
        ) : escribe === "atendel" ? (
          <li className="conva__fila" aria-label="Atendel…">
            {avatarAtendel}
            {puntos}
          </li>
        ) : null}

        {vistos >= 4 ? (
          <li className="conva__fila">
            <span className="conva__avatar" aria-hidden="true">
              <Personaje agente={agente} avatar />
            </span>
            <div className="conva__agente">
              <p className="conva__firma">
                {info.nombre} <span>· {info.area}</span>
              </p>
              <p className="conva__burbuja">{guion.reporte}</p>
              {archivos.map((a) => (
                <span key={a} className="conva__adjunto">
                  <Icono nombre="documento" tam={16} />
                  {a}
                </span>
              ))}
            </div>
          </li>
        ) : escribe === "agente" ? (
          <li className="conva__fila" aria-label={`${info.nombre}…`}>
            <span className="conva__avatar" aria-hidden="true">
              <Personaje agente={agente} avatar />
            </span>
            {puntos}
          </li>
        ) : null}

        {vistos >= 5 && nota ? (
          <li className="conva__nota">
            <span className="conva__nota-icono">
              <Icono nombre="check" tam={14} />
            </span>
            {nota}
          </li>
        ) : null}
      </ol>

      <div className="conva__barra" aria-hidden="true">
        <span>{C.pidele}</span>
        <span className="conva__enviar">
          <Icono nombre="enviar" tam={14} />
        </span>
      </div>
    </div>
  );
}
