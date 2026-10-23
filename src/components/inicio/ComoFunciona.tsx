"use client";

import { useEffect, useRef, useState } from "react";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { Seccion } from "@/components/base/Seccion";
import { Personaje } from "@/components/agentes/Personaje";
import { DETALLE } from "@/components/agentes/detalle";
import { AGENTES_INFO } from "@/lib/agentes";
import { PASOS } from "@/lib/contenido";

/** La conversación de ejemplo de Lola (detalle.ts): Mariana pregunta y Lola deja lista la respuesta. */
const PREGUNTA = DETALLE.lola.conversacion.find((m) => m.de === "otro");
const RESPUESTA = DETALLE.lola.conversacion.find((m) => m.de === "agente");

/**
 * 5. Cómo funciona (estilo diseno/vercel: cuadrícula de tres tarjetas finas).
 * Cada paso lleva una muestra pequeña del producto, abajo de la tarjeta:
 * 01 la entrada con tu correo, 02 el equipo que eliges y 03 un mensaje que
 * espera tu visto bueno (este se puede probar: no envía nada).
 */
export function ComoFunciona() {
  const muestras = [<MuestraEntrar key="entrar" />, <MuestraEquipo key="equipo" />, <MuestraVistoBueno key="visto" />];
  return (
    <Seccion id="como-funciona" etiquetadaPor="como-funciona-titulo">
      <header className="banda-cabeza">
        <Etiqueta>Cómo funciona</Etiqueta>
        <h2 id="como-funciona-titulo" className="t-seccion">
          Un equipo que trabaja contigo.
        </h2>
        <p className="t-intro">Sin instalar nada y sin aprender un sistema nuevo.</p>
      </header>

      <ol className="rejilla-tres">
        {PASOS.map(([titulo, texto], i) => (
          <li key={titulo} className="paso-v tarjeta-fina">
            <p className="etiqueta etiqueta--tenue" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="t-titulo">
              <span className="sr-only">Paso {i + 1}: </span>
              {titulo}
            </h3>
            <p className="t-cuerpo">{texto}</p>
            <div className="paso-v__muestra">{muestras[i]}</div>
          </li>
        ))}
      </ol>
    </Seccion>
  );
}

/** 01 · Así se ve la entrada: tu correo y un enlace, sin contraseña. Solo ilustra. */
function MuestraEntrar() {
  return (
    <div className="muestra muestra--relleno" aria-hidden="true">
      <p className="muestra__campo">Tu correo</p>
      <p className="muestra__boton">Enviarme el enlace</p>
      <p className="etiqueta etiqueta--tenue">Sin contraseña</p>
    </div>
  );
}

/** 02 · Eliges a quién: los cuatro agentes, cada uno con su área. Ejemplo con dos elegidos. */
function MuestraEquipo() {
  return (
    <ul className="muestra muestra-equipo" aria-hidden="true">
      {AGENTES_INFO.map((a, i) => (
        <li key={a.id} className="muestra-equipo__fila">
          <Personaje agente={a.id} avatar className="muestra-equipo__personaje" />
          <span className="muestra-equipo__nombre">{a.nombre}</span>
          <span className="etiqueta etiqueta--tenue">{a.area}</span>
          <span className={`muestra-equipo__marca${i < 2 ? " muestra-equipo__marca--si" : ""}`}>
            {i < 2 ? <Icono nombre="check" tam={12} /> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * 03 · La respuesta que Lola dejó lista para Mariana y que no sale sin tu
 * visto bueno. Muestra local (no envía nada): al darle el visto bueno cambia
 * a "Enviado"; "Ver de nuevo" la regresa al principio.
 */
function MuestraVistoBueno() {
  const [enviado, setEnviado] = useState(false);
  const acciones = useRef<HTMLDivElement>(null);
  const tocado = useRef(false);

  // El botón cambia (visto bueno ↔ ver de nuevo): el foco se queda en el que aparece
  useEffect(() => {
    if (tocado.current) acciones.current?.querySelector("button")?.focus();
  }, [enviado]);

  const cambiar = (valor: boolean) => {
    tocado.current = true;
    setEnviado(valor);
  };

  return (
    <div className="muestra visto-v" role="group" aria-label="Muestra: un mensaje que espera tu visto bueno">
      <p className="visto-v__burbuja visto-v__burbuja--otro">
        <span className="visto-v__quien">{PREGUNTA?.quien}</span>
        {PREGUNTA?.texto}
      </p>
      <p className={`visto-v__burbuja visto-v__burbuja--agente${enviado ? " visto-v__burbuja--enviada" : ""}`}>
        <span className="visto-v__quien">
          <Personaje agente="lola" avatar className="visto-v__personaje" />
          {enviado ? "Respuesta de Lola" : "Borrador de Lola"}
        </span>
        {RESPUESTA?.texto}
      </p>
      <div className="visto-v__acciones" ref={acciones} aria-live="polite">
        {enviado ? (
          <>
            <p className="visto-v__estado visto-v__estado--ok">
              <Icono nombre="check" tam={14} />
              Enviado con tu visto bueno
            </p>
            <Boton variante="fantasma" tam="chico" icono={<Icono nombre="repetir" tam={16} />} onClick={() => cambiar(false)}>
              Ver de nuevo
            </Boton>
          </>
        ) : (
          <>
            <p className="visto-v__estado">No sale hasta que lo apruebes</p>
            <Boton variante="fantasma" tam="chico" icono={<Icono nombre="check" tam={16} />} onClick={() => cambiar(true)}>
              Dar visto bueno
            </Boton>
          </>
        )}
      </div>
    </div>
  );
}
