"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Boton } from "@/components/base/Boton";
import { Buscador } from "@/components/base/Buscador";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Kbd } from "@/components/base/Kbd";
import { sinAcentos } from "./contenido";
import { MarcaConversacion } from "./Marcas";
import type { ElementoPaleta } from "./tipos";

/**
 * Paleta de comandos (⌘K / Ctrl K, "/" o el buscador de la barra): escribes
 * y saltas a una vista, un agente, una conversación o una acción.
 *
 * - <dialog> modal. En computadora flota arriba al centro (como la búsqueda
 *   de la barra, que crece hacia abajo); en celular ocupa la pantalla con
 *   "Cancelar" junto al campo, como la búsqueda del iPhone.
 * - Teclado: ↑ ↓ eligen, ↵ abre, Esc borra lo escrito y, vacío, cierra.
 *   El mouse también elige al pasar. Lo que dice "Pronto" se ve pero no se elige.
 * - Abierta con el teclado aparece al instante (algo que se usa cien veces
 *   al día no se anima); con el mouse o el dedo, un fundido de 0.2s.
 * - Combobox accesible: el campo apunta a la lista y al resultado activo.
 */

const ORDEN: ElementoPaleta["grupo"][] = ["Ir a", "Agentes", "Conversaciones", "Crear", "Preferencias"];

function puntaje(e: ElementoPaleta, q: string) {
  const nombre = sinAcentos(e.etiqueta);
  if (nombre.startsWith(q)) return 0;
  if (nombre.split(/\s+/).some((p) => p.startsWith(q))) return 1;
  if (nombre.includes(q)) return 2;
  const resto = sinAcentos(`${e.descripcion ?? ""} ${e.palabras ?? ""}`);
  return resto.includes(q) ? 3 : -1;
}

export function Paleta({
  abierta,
  conTeclado,
  alCerrar,
  elementos,
  esMac,
}: {
  abierta: boolean;
  /** Se abrió con el teclado: sin animación. */
  conTeclado: boolean;
  alCerrar: () => void;
  elementos: ElementoPaleta[];
  esMac: boolean;
}) {
  const base = useId().replace(/:/g, "");
  const idLista = `${base}-lista`;
  const dialogo = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const previo = useRef<HTMLElement | null>(null);
  const [consulta, setConsulta] = useState("");
  const [activo, setActivo] = useState(0);

  const q = sinAcentos(consulta);
  const grupos = useMemo(() => {
    const visibles = q
      ? elementos
          .map((e) => ({ e, p: puntaje(e, q) }))
          .filter((x) => x.p >= 0)
          .sort((a, b) => a.p - b.p)
          .map((x) => x.e)
      : elementos;
    return ORDEN.map((g) => {
      let items = visibles.filter((e) => e.grupo === g);
      if (!q && g === "Conversaciones") items = items.slice(0, 4);
      return { grupo: g, items };
    }).filter((g) => g.items.length);
  }, [elementos, q]);

  const planos = useMemo(() => grupos.flatMap((g) => g.items), [grupos]);
  const elegibles = useMemo(() => planos.filter((e) => !e.pronto), [planos]);
  const actual = elegibles[Math.min(activo, Math.max(elegibles.length - 1, 0))];
  const idDe = (e: ElementoPaleta) => `${base}-op-${e.id}`;

  // Abrir y cerrar el <dialog>
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierta && !d.open) {
      previo.current = document.activeElement as HTMLElement | null;
      setConsulta("");
      setActivo(0);
      d.showModal();
      requestAnimationFrame(() => campo.current?.focus());
    } else if (!abierta && d.open) {
      d.close();
      const volver = previo.current;
      previo.current = null;
      if (volver && document.contains(volver)) volver.focus({ preventScroll: true });
    }
  }, [abierta]);

  // Al escribir, el primero vuelve a estar elegido
  useEffect(() => setActivo(0), [q]);

  // El campo es un combobox que apunta a la lista y al resultado elegido
  useEffect(() => {
    const c = campo.current;
    if (!c) return;
    c.setAttribute("role", "combobox");
    c.setAttribute("aria-expanded", "true");
    c.setAttribute("aria-controls", idLista);
    c.setAttribute("aria-autocomplete", "list");
    if (actual) c.setAttribute("aria-activedescendant", idDe(actual));
    else c.removeAttribute("aria-activedescendant");
  });

  // El elegido siempre a la vista
  useEffect(() => {
    if (!actual) return;
    document.getElementById(idDe(actual))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual?.id]);

  const elegir = (e: ElementoPaleta | undefined) => {
    if (!e || e.pronto) return;
    previo.current = null; // la acción decide a dónde va el foco
    alCerrar();
    e.alElegir?.();
  };

  const alTeclear = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      if (!elegibles.length) return;
      const i = elegibles.indexOf(actual);
      const n = ev.key === "ArrowDown" ? (i + 1) % elegibles.length : (i - 1 + elegibles.length) % elegibles.length;
      setActivo(n);
    } else if (ev.key === "Escape") {
      // El buscador borra lo escrito; si ya estaba vacío, se cierra
      if (!consulta) {
        ev.preventDefault();
        alCerrar();
      }
    }
  };

  return (
    <dialog
      ref={dialogo}
      className="paleta"
      aria-label="Buscar y saltar"
      data-instantanea={conTeclado ? "true" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        alCerrar();
      }}
      onClose={() => {
        if (abierta) alCerrar();
      }}
    >
      <div className="paleta__velo" aria-hidden="true" onClick={alCerrar} />
      <div className="paleta__panel" onKeyDown={alTeclear}>
        <div className="paleta__cabeza">
          <Buscador
            ref={campo}
            etiqueta="Busca una vista, un agente o una conversación"
            placeholder="Busca o salta a…"
            valor={consulta}
            alCambiar={setConsulta}
            alBuscar={() => elegir(actual)}
            atajo={false}
            className="paleta__buscador"
          />
          <Boton variante="fantasma" tam="compacto" className="paleta__cancelar" onClick={alCerrar}>
            Cancelar
          </Boton>
        </div>

        <div ref={lista} id={idLista} role="listbox" aria-label="Resultados" className="paleta__lista">
          {grupos.map((g) => (
            <div key={g.grupo} role="group" aria-labelledby={`${base}-g-${g.grupo}`} className="paleta__grupo">
              <p id={`${base}-g-${g.grupo}`} className="paleta__titulo" role="presentation">
                {g.grupo}
              </p>
              {g.items.map((e) => {
                const elegido = actual?.id === e.id;
                return (
                  <div
                    key={e.id}
                    id={idDe(e)}
                    role="option"
                    aria-selected={elegido}
                    aria-disabled={e.pronto || undefined}
                    className="paleta__opcion"
                    onPointerMove={() => {
                      if (e.pronto || elegido) return;
                      setActivo(elegibles.indexOf(e));
                    }}
                    onClick={() => elegir(e)}
                  >
                    <span className="paleta__icono">
                      {e.agentes?.length ? <MarcaConversacion agentes={e.agentes} /> : e.icono ? <Icono nombre={e.icono} tam={16} /> : null}
                    </span>
                    <span className="paleta__texto">
                      <span className="paleta__etiqueta">{e.etiqueta}</span>
                      {e.descripcion ? <span className="paleta__descripcion">{e.descripcion}</span> : null}
                    </span>
                    <span className="paleta__extra">
                      {e.pronto ? <Insignia tono="pronto">Pronto</Insignia> : null}
                      {e.atajo?.length ? <Kbd teclas={e.atajo} className="paleta__atajo" /> : null}
                      {elegido ? (
                        <span className="paleta__enter" aria-hidden="true">
                          <Kbd>↵</Kbd>
                        </span>
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
          {!planos.length ? (
            <div className="paleta__vacio" role="status">
              <Icono nombre="buscar" tam={20} />
              <p className="t-app-mediano">Nada con «{consulta.trim()}»</p>
              <p>Prueba con el nombre de un agente, de una vista o de una conversación.</p>
            </div>
          ) : null}
        </div>

        <div className="paleta__pie" aria-hidden="true">
          <span>
            <Kbd teclas={["↑", "↓"]} /> moverte
          </span>
          <span>
            <Kbd>↵</Kbd> abrir
          </span>
          <span>
            <Kbd>Esc</Kbd> cerrar
          </span>
          <span className="paleta__pie-fin">
            <Kbd teclas={[esMac ? "⌘" : "Ctrl", "K"]} /> abre esto desde cualquier parte
          </span>
        </div>
      </div>
    </dialog>
  );
}
