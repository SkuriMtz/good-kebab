"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { Seccion } from "@/components/base/Seccion";
import { Personaje } from "@/components/agentes/Personaje";
import { DETALLE } from "@/components/agentes/detalle";
import { PASOS } from "@/lib/contenido";
import { PERSONAJES } from "@/lib/personajes";

/** La conversación de ejemplo de Lola (detalle.ts): Mariana pregunta y Lola deja lista la respuesta. */
const PREGUNTA = DETALLE.lola.conversacion.find((m) => m.de === "otro");
const RESPUESTA = DETALLE.lola.conversacion.find((m) => m.de === "agente");

/**
 * 5. Cómo funciona (Grupo 4 · propuesta T3).
 * Los tres pasos en fila (columna en celular), con el número en Mono sobre
 * una línea de 1px que los une. El tercero es más ancho porque ahí pasa el
 * trabajo: lleva una muestra del panel con un mensaje que espera tu visto
 * bueno. La muestra se puede probar: das el visto bueno y el mensaje sale.
 */
export function ComoFunciona() {
  return (
    <Seccion id="como-funciona" etiquetadaPor="como-funciona-titulo">
      <header className="pasos__cabeza">
        <div>
          <Etiqueta>Cómo funciona</Etiqueta>
          <h2 id="como-funciona-titulo" className="t-seccion mt-[var(--spacing-16)]">
            Un equipo que trabaja contigo
          </h2>
        </div>
        <p className="t-intro">Sin instalar nada y sin aprender un sistema nuevo.</p>
      </header>

      <ol className="pasos">
        {PASOS.map(([titulo, texto], i) => {
          const ultimo = i === PASOS.length - 1;
          return (
            <li key={titulo} className={`paso${ultimo ? " paso--trabajo" : ""}`}>
              <p className="paso__marca" aria-hidden="true">
                <span className="paso__numero">{String(i + 1).padStart(2, "0")}</span>
              </p>
              <h3 className="t-titulo">
                <span className="sr-only">Paso {i + 1}: </span>
                {titulo}
              </h3>
              <p className="t-cuerpo paso__texto">{texto}</p>
              {ultimo ? <MuestraVistoBueno /> : null}
            </li>
          );
        })}
      </ol>
    </Seccion>
  );
}

/**
 * Muestra del panel: la respuesta que Lola dejó lista para Mariana y que no
 * sale sin tu visto bueno. Es una muestra local (no envía nada): al darle el
 * visto bueno cambia a "Enviado"; "Ver de nuevo" la regresa al principio.
 */
function MuestraVistoBueno() {
  const [enviado, setEnviado] = useState(false);
  const acciones = useRef<HTMLDivElement>(null);
  const tocado = useRef(false);
  const color = { "--agente": PERSONAJES.lola.color } as CSSProperties;

  // El botón cambia (visto bueno ↔ ver de nuevo): el foco se queda en el que aparece
  useEffect(() => {
    if (tocado.current) acciones.current?.querySelector("button")?.focus();
  }, [enviado]);

  const cambiar = (valor: boolean) => {
    tocado.current = true;
    setEnviado(valor);
  };

  return (
    <MarcoNavegador
      titulo="Muestra del panel de Atendel: un mensaje que espera tu visto bueno"
      pestanas={[{ etiqueta: "Pendientes de tu visto bueno", activa: true }]}
      className="visto"
      classNameCuerpo="producto visto__cuerpo"
    >
      <div className="visto__cabeza">
        <span className="marca-agente marca-agente--mini" style={color}>
          <Personaje agente="lola" avatar />
        </span>
        <p className="visto__quien">
          <span className="visto__nombre">Lola</span>
          <span className="visto__para">para {PREGUNTA?.quien} · WhatsApp</span>
        </p>
        <span className="visto__estado" aria-live="polite">
          {enviado ? (
            <Insignia tono="exito" conPunto>
              Enviado
            </Insignia>
          ) : (
            <Insignia tono="atencion" conPunto>
              Espera tu visto bueno
            </Insignia>
          )}
        </span>
      </div>

      <div className="visto__hilo">
        <div className="visto__burbuja visto__burbuja--otro">
          <p>{PREGUNTA?.texto}</p>
          <span className="visto__hora cifras">{PREGUNTA?.hora}</span>
        </div>
        <div className={`visto__burbuja visto__burbuja--agente${enviado ? " visto__burbuja--enviada" : ""}`}>
          <span className="visto__borrador">{enviado ? "Respuesta de Lola" : "Borrador de Lola"}</span>
          <p>{RESPUESTA?.texto}</p>
          {enviado ? (
            <span className="visto__hora cifras">
              <Icono nombre="check-doble" tam={16} />
              {RESPUESTA?.hora}
            </span>
          ) : null}
        </div>
      </div>

      <div className="visto__acciones" ref={acciones}>
        {enviado ? (
          <>
            <p className="visto__nota">Salió con tu visto bueno.</p>
            <Boton variante="fantasma" tam="compacto" icono={<Icono nombre="repetir" tam={16} />} onClick={() => cambiar(false)}>
              Ver de nuevo
            </Boton>
          </>
        ) : (
          <>
            <p className="visto__nota">No sale hasta que lo apruebes.</p>
            <Boton variante="sutil" tam="compacto" icono={<Icono nombre="check" tam={16} />} onClick={() => cambiar(true)}>
              Dar visto bueno
            </Boton>
          </>
        )}
      </div>
    </MarcoNavegador>
  );
}
