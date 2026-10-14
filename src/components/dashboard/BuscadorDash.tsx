"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Buscador } from "@/components/base/Buscador";
import { Icono } from "@/components/base/Iconos";
import { Cara } from "./Caras";
import { Destinable } from "./Navegacion";
import type { ResultadoBusqueda } from "./tipos";

const normal = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es-MX");

const ORDEN: ResultadoBusqueda["grupo"][] = ["Secciones", "Agentes", "Conversaciones", "Citas", "Actividad"];

/**
 * El buscador redondo de la barra (componente Buscador de la base) con sus
 * resultados de verdad: busca entre las secciones, los agentes, los grupos,
 * las citas y la actividad que hay en la pantalla. Enter abre el primero;
 * ↓ entra a la lista y ↑ ↓ la recorren; Esc borra (lo hace el Buscador).
 * Atajo "/" desde cualquier parte (solo en el buscador de escritorio).
 */
export function BuscadorDash({
  indice,
  atajo = true,
  alElegir,
  className = "",
}: {
  indice: ResultadoBusqueda[];
  atajo?: boolean;
  /** Después de elegir (ej. cerrar la búsqueda del celular). */
  alElegir?: () => void;
  className?: string;
}) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");

  const resultados = useMemo(() => {
    const q = normal(texto.trim());
    if (!q) return [];
    const palabras = q.split(/\s+/);
    return indice
      .filter((r) => {
        const fuente = normal(`${r.titulo} ${r.detalle ?? ""} ${r.grupo}`);
        return palabras.every((p) => fuente.includes(p));
      })
      .sort((a, b) => ORDEN.indexOf(a.grupo) - ORDEN.indexOf(b.grupo))
      .slice(0, 8);
  }, [indice, texto]);

  const grupos = ORDEN.map((g) => ({ grupo: g, items: resultados.filter((r) => r.grupo === g) })).filter((g) => g.items.length);
  const visible = abierto && texto.trim().length > 0;

  const terminar = () => {
    setTexto("");
    setAbierto(false);
    (document.activeElement as HTMLElement | null)?.blur();
    alElegir?.();
  };

  const opciones = () => Array.from(raiz.current?.querySelectorAll<HTMLElement>("[data-resultado]") ?? []);

  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const lista = opciones();
    const i = lista.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" && lista.length) {
      e.preventDefault();
      lista[i < 0 ? 0 : Math.min(i + 1, lista.length - 1)]?.focus();
    } else if (e.key === "ArrowUp" && i >= 0) {
      e.preventDefault();
      if (i === 0) raiz.current?.querySelector<HTMLInputElement>("input")?.focus();
      else lista[i - 1]?.focus();
    } else if (e.key === "Escape" && i >= 0) {
      e.preventDefault();
      raiz.current?.querySelector<HTMLInputElement>("input")?.focus();
    }
  };

  return (
    <div
      ref={raiz}
      className={`dash-busqueda ${className}`}
      onFocus={() => setAbierto(true)}
      onBlur={(e) => {
        if (!raiz.current?.contains(e.relatedTarget as Node)) setAbierto(false);
      }}
      onKeyDown={alTeclear}
    >
      <Buscador
        etiqueta="Buscar en Atendel"
        placeholder="Busca citas, chats o agentes"
        tam="compacto"
        valor={texto}
        alCambiar={(v) => {
          setTexto(v);
          setAbierto(true);
        }}
        alBuscar={() => opciones()[0]?.click()}
        atajo={atajo}
      />
      <div
        id={`${id}-resultados`}
        className="dash-flotante dash-busqueda__panel"
        data-abierto={visible ? "true" : undefined}
        aria-label="Resultados de la búsqueda"
        role="region"
      >
        <p className="sr-only" aria-live="polite">
          {visible ? (resultados.length ? `${resultados.length} resultados` : "Sin resultados") : ""}
        </p>
        {resultados.length ? (
          grupos.map((g) => (
            <div key={g.grupo} className="dash-busqueda__grupo">
              <p className="dash-busqueda__titulo">{g.grupo}</p>
              <ul>
                {g.items.map((r) => (
                  <li key={r.id}>
                    <Destinable destino={r.destino} className="dash-resultado" data-resultado="" alIr={terminar}>
                      {r.agente ? <Cara agente={r.agente} /> : <Icono nombre={r.icono ?? "flecha"} tam={16} className="dash-resultado__icono" />}
                      <span className="dash-resultado__texto">
                        <span className="dash-resultado__titulo">{r.titulo}</span>
                        {r.detalle ? <span className="dash-resultado__detalle">{r.detalle}</span> : null}
                      </span>
                      <Icono nombre="chevron-derecha" tam={16} className="dash-resultado__ir" />
                    </Destinable>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div className="dash-busqueda__vacio">
            <p className="dash-vacio__titulo">Nada con «{texto.trim()}»</p>
            <p className="dash-vacio__texto">Prueba con el nombre de un paciente, un agente o una sección.</p>
          </div>
        )}
      </div>
    </div>
  );
}
