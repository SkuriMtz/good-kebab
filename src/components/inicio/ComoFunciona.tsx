"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { DETALLE } from "@/components/agentes/detalle";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, IDS_AGENTES } from "@/lib/agentes";
import { PASOS } from "@/lib/contenido";
import { colorAgente, useRevelado } from "./QueEs";

/** El mensaje con el que Víctor le escribe a Paola en su ejemplo (detalle.ts): el que espera tu visto bueno. */
const PRIMERO_VICTOR = DETALLE.victor.conversacion.find((m) => m.de === "agente");
const MENSAJE = PRIMERO_VICTOR?.texto ?? "";
const HORA = PRIMERO_VICTOR?.hora ?? "";

type Estado = "pendiente" | "editando" | "enviando" | "enviado";

/**
 * La muestra del producto del paso 3: un mensaje que Víctor dejó listo y que
 * no sale sin tu visto bueno. Se puede tocar (guion local, no llama a la IA):
 * "Editar" abre el texto, "Aprobar y enviar" lo manda (con su estado de
 * cargando) y "Repetir ejemplo" lo deja como al principio.
 */
function VistoBueno() {
  const base = useId().replace(/:/g, "");
  const [estado, setEstado] = useState<Estado>("pendiente");
  const [texto, setTexto] = useState(MENSAJE);
  const [borrador, setBorrador] = useState(MENSAJE);
  const [anuncio, setAnuncio] = useState("");
  const campo = useRef<HTMLTextAreaElement>(null);
  const pie = useRef<HTMLDivElement>(null);
  const reloj = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(reloj.current), []);
  // El botón que se tocó desaparece: el foco pasa al que toma su lugar
  const enfocar = (accion: string) =>
    requestAnimationFrame(() => pie.current?.querySelector<HTMLButtonElement>(`[data-accion="${accion}"]`)?.focus());
  useEffect(() => {
    if (estado === "editando") campo.current?.focus();
    if (estado === "enviado") enfocar("repetir");
  }, [estado]);

  const enviar = () => {
    setEstado("enviando");
    setAnuncio("Enviando…");
    reloj.current = setTimeout(() => {
      setEstado("enviado");
      setAnuncio(`Mensaje enviado a Paola a las ${HORA}.`);
    }, 700);
  };
  const guardar = () => {
    const limpio = borrador.trim();
    if (!limpio) return;
    setTexto(limpio);
    setEstado("pendiente");
    setAnuncio("Cambios guardados. El mensaje sigue esperando tu visto bueno.");
    enfocar("aprobar");
  };
  const cancelar = () => {
    setBorrador(texto);
    setEstado("pendiente");
    enfocar("aprobar");
  };
  const reiniciar = () => {
    setTexto(MENSAJE);
    setBorrador(MENSAJE);
    setEstado("pendiente");
    setAnuncio("El mensaje vuelve a esperar tu visto bueno.");
    enfocar("aprobar");
  };

  const enviado = estado === "enviado";

  return (
    <div className="producto inf-visto" role="group" aria-labelledby={`${base}-quien`}>
      <div className="inf-visto__cabeza">
        <p className="inf-visto__quien t-app" id={`${base}-quien`}>
          <span className="marca-agente marca-agente--mini" style={colorAgente("victor")} aria-hidden="true">
            <Personaje agente="victor" avatar />
          </span>
          <span className="min-w-0">
            <span className="inf-nombre">Víctor</span> preparó un mensaje para Paola
          </span>
        </p>
        {enviado ? (
          <Insignia tono="exito" conPunto>
            Enviado
          </Insignia>
        ) : (
          <Insignia tono="atencion" conPunto>
            Espera tu visto bueno
          </Insignia>
        )}
      </div>

      <div className="inf-visto__cuerpo">
        <p className="inf-visto__contexto t-app-etiqueta">
          <Icono nombre="mensaje" tam={16} />
          WhatsApp · Paola preguntó por botox y no agendó
        </p>
        {estado === "editando" ? (
          <div className="inf-visto__editor">
            <label htmlFor={`${base}-campo`} className="t-app-etiqueta">
              Mensaje para Paola
            </label>
            <textarea
              id={`${base}-campo`}
              ref={campo}
              className="inf-visto__campo"
              value={borrador}
              maxLength={400}
              onChange={(e) => setBorrador(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelar();
                }
              }}
            />
          </div>
        ) : (
          <p className="inf-burbuja t-app">{texto}</p>
        )}
        {enviado ? (
          <p className="inf-visto__entrega t-app-etiqueta cifras">
            <time>{HORA}</time>
            <Icono nombre="check-doble" tam={16} titulo="Entregado" />
          </p>
        ) : null}
      </div>

      <div className="inf-visto__pie" ref={pie}>
        {estado === "editando" ? (
          <>
            <Boton variante="fantasma" tam="compacto" onClick={cancelar}>
              Cancelar
            </Boton>
            <Boton variante="sutil" tam="compacto" onClick={guardar} disabled={!borrador.trim()}>
              Guardar cambios
            </Boton>
          </>
        ) : enviado ? (
          <>
            <p className="inf-visto__aviso t-app">
              <Icono nombre="check-circulo" tam={16} />
              Salió a las {HORA}, con tu visto bueno.
            </p>
            <Boton
              variante="fantasma"
              tam="compacto"
              icono={<Icono nombre="repetir" tam={16} />}
              onClick={reiniciar}
              data-accion="repetir"
            >
              Repetir ejemplo
            </Boton>
          </>
        ) : (
          <>
            <Boton
              variante="sutil"
              tam="compacto"
              onClick={() => {
                setBorrador(texto);
                setEstado("editando");
              }}
              disabled={estado === "enviando"}
            >
              Editar
            </Boton>
            <Boton variante="principal" tam="compacto" onClick={enviar} cargando={estado === "enviando"} data-accion="aprobar">
              Aprobar y enviar
            </Boton>
          </>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
    </div>
  );
}

/**
 * 5. Cómo funciona (Grupo 4 · propuesta T1). Encabezado centrado (el bloque
 * de encabezado de GitHub) y una línea de tiempo vertical en una columna de
 * lectura, como la conversación de un pull request: cada paso es un nodo con
 * su número en Mono, unidos por un hilo de 1px. El paso 2 enseña a los cuatro
 * agentes que puedes elegir; el paso 3 termina en la muestra del producto: un
 * mensaje que espera tu visto bueno (el único botón principal de la pantalla).
 */
export function ComoFunciona() {
  const lista = useRef<HTMLOListElement>(null);
  useRevelado(lista);

  return (
    <Seccion id="como-funciona" etiquetadaPor="como-funciona-titulo">
      <EncabezadoSeccion
        id="como-funciona-titulo"
        etiqueta="Cómo funciona"
        titulo="Un equipo que trabaja contigo"
        texto="Sin instalar nada y sin aprender un sistema nuevo. Tres pasos y ya están trabajando."
      />
      <ol ref={lista} className="inf-pasos">
        {PASOS.map(([titulo, texto], i) => {
          const ultimo = i === PASOS.length - 1;
          return (
            <li
              key={titulo}
              className={`inf-paso inf-pieza${ultimo ? " inf-paso--ultimo" : ""}`}
              style={{ "--i": i } as CSSProperties}
            >
              <Etiqueta as="span" tono="cuerpo" className="inf-paso__nodo" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </Etiqueta>
              <div className="min-w-0">
                <h3 className="t-titulo inf-paso__titulo">
                  <span className="sr-only">Paso {i + 1}: </span>
                  {titulo}
                </h3>
                <p className="t-cuerpo inf-paso__texto">{texto}</p>
                {i === 1 ? (
                  <ul className="inf-agentes" aria-label="Los agentes que puedes elegir">
                    {IDS_AGENTES.map((a) => (
                      <li key={a} className="inf-agente">
                        <span className="marca-agente marca-agente--mini" style={colorAgente(a)} aria-hidden="true">
                          <Personaje agente={a} avatar />
                        </span>
                        {AGENTE_POR_ID[a].nombre}
                        <Etiqueta as="span">{AGENTE_POR_ID[a].area}</Etiqueta>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {ultimo ? <VistoBueno /> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Seccion>
  );
}
