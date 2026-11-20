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
 * apps), se lo pasa al agente que le toca y te avisa. El agente te pregunta
 * antes de hacerlo («¿Se la mando?»), tú le contestas escribiendo («Sí,
 * mándala»: se ve cómo se escribe en la barra y se manda) y él lo hace y te
 * cuenta (y lo que quedó, con su palomita). Los textos salen del diccionario
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
  const archivos = guion.pregunta.match(ARCHIVO) ?? [];
  const archivo = archivos[0];
  // Si te dejó un archivo (Mira), la nota es que lo aprobaste; si no, lo que quedó (la ficha del agente).
  const nota = archivo !== undefined ? C.aprobado(archivo) : d.detalle[agente].conversacion.findLast((m) => m.de === "nota")?.texto;
  // 1 Atendel te avisa · 2 te dice a quién se lo pasó · 3 el agente te pregunta · 4 le contestas
  // · 5 te dice que ya lo hizo · 6 lo que quedó
  const pasos = nota ? 6 : 5;

  const raiz = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLOListElement>(null);
  const [vistos, setVistos] = useState(0);
  const [escribe, setEscribe] = useState<"aviso" | "agente" | null>(null);
  /** Lo que llevas escrito en la barra (tu respuesta, letra por letra). */
  const [tecleado, setTecleado] = useState("");
  const [enviando, setEnviando] = useState(false);
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
      await esperar(700);
      if (cancelado) return;
      setVistos(2);
      setEscribe("agente");
      await esperar(1400);
      if (cancelado) return;
      setEscribe(null);
      setVistos(3);
      // Tiempo para leer la pregunta; luego tú escribes la respuesta en la barra y la mandas
      await esperar(1500);
      const letras = Array.from(guion.respuesta);
      for (let i = 1; i <= letras.length; i++) {
        if (cancelado) return;
        setTecleado(letras.slice(0, i).join(""));
        await esperar(60);
      }
      await esperar(300);
      if (cancelado) return;
      setEnviando(true);
      await esperar(180);
      if (cancelado) return;
      setEnviando(false);
      setTecleado("");
      setVistos(4);
      await esperar(500);
      if (cancelado) return;
      setEscribe("agente");
      await esperar(1200);
      if (cancelado) return;
      setEscribe(null);
      setVistos(5);
      if (pasos > 5) {
        await esperar(700);
        if (!cancelado) setVistos(6);
      }
    };
    if (porActivo) {
      void correr();
      return () => {
        cancelado = true;
        timers.forEach((x) => window.clearTimeout(x));
        // Si se cortó a la mitad, que se vea completa (sin volver a empezar)
        setEscribe(null);
        setTecleado("");
        setEnviando(false);
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
  }, [pasos, porActivo, activo, guion.respuesta]);

  // Como un chat: si ya no cabe, se ve lo último (solo se mueve la lista, no la página)
  useEffect(() => {
    const ol = lista.current;
    if (!ol || ol.scrollHeight <= ol.clientHeight) return;
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ol.scrollTo({ top: ol.scrollHeight, behavior: suave ? "smooth" : "auto" });
  }, [vistos, escribe]);

  const avatarAtendel = (
    <span className="conva__avatar conva__avatar--atendel" aria-hidden="true">
      <Marca className="h-[16px] w-[16px]" />
    </span>
  );
  const avatarAgente = (
    <span className="conva__avatar" aria-hidden="true">
      <Personaje agente={agente} avatar />
    </span>
  );
  const puntos = (
    <span className="conva__puntos">
      <i />
      <i />
      <i />
    </span>
  );
  const firma = (
    <p className="conva__firma">
      {info.nombre} <span>· {info.area}</span>
    </p>
  );

  return (
    <div ref={raiz} className={`conva${pintada ? " conva--pintada" : ""}`} style={{ "--agente": PERSONAJES[agente].color } as CSSProperties}>
      <div className="conva__cabeza">
        <span className="conva__logo">
          <Marca className="h-[18px] w-[18px]" />
        </span>
        <span className="conva__titulo">Atendel</span>
      </div>

      <ol ref={lista} className="conva__mensajes" aria-live="polite">
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
        ) : null}

        {/* El agente te pregunta antes de hacerlo */}
        {vistos >= 3 ? (
          <li className="conva__fila">
            {avatarAgente}
            <div className="conva__agente">
              {firma}
              <p className="conva__burbuja">{guion.pregunta}</p>
              {archivos.map((a) => (
                <span key={a} className="conva__adjunto">
                  <Icono nombre="documento" tam={16} />
                  {a}
                </span>
              ))}
            </div>
          </li>
        ) : vistos === 2 && escribe === "agente" ? (
          <li className="conva__fila" aria-label={`${info.nombre}…`}>
            {avatarAgente}
            {puntos}
          </li>
        ) : null}

        {/* Tú le contestas */}
        {vistos >= 4 ? (
          <li className="conva__fila conva__fila--tu">
            <p className="conva__burbuja conva__burbuja--tu">{guion.respuesta}</p>
          </li>
        ) : null}

        {/* Lo hace y te cuenta */}
        {vistos >= 5 ? (
          <li className="conva__fila">
            {avatarAgente}
            <div className="conva__agente">
              {firma}
              <p className="conva__burbuja">{guion.hecho}</p>
            </div>
          </li>
        ) : vistos === 4 && escribe === "agente" ? (
          <li className="conva__fila" aria-label={`${info.nombre}…`}>
            {avatarAgente}
            {puntos}
          </li>
        ) : null}

        {vistos >= 6 && nota ? (
          <li className="conva__nota">
            <span className="conva__nota-icono">
              <Icono nombre="check" tam={14} />
            </span>
            {nota}
          </li>
        ) : null}
      </ol>

      <div className={`conva__barra${tecleado ? " es-escribiendo" : ""}`} aria-hidden="true">
        <span className="conva__barra-texto">{tecleado || C.pidele}</span>
        <span className={`conva__enviar${enviando ? " es-tocado" : ""}`}>
          <Icono nombre="enviar" tam={14} />
        </span>
      </div>
    </div>
  );
}
