"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Buscador } from "@/components/base/Buscador";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import type { IdAgente } from "@/lib/agentes";
import { CarasAgentes } from "./piezas";
import type { Accion } from "./tipos";

export type ResultadoBusqueda = {
  id: string;
  /** "Vistas", "Agentes", "Citas", "Conversaciones"… */
  grupo: string;
  etiqueta: string;
  detalle?: string;
  icono?: NombreIcono;
  agentes?: IdAgente[];
  accion: Accion;
};

const normal = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es-MX")
    .trim();

/**
 * El buscador redondo de la barra (atajo "/") con sus resultados abajo:
 * busca en lo que hay en el dashboard (vistas, agentes, citas, chats).
 * ↓ entra a los resultados, ↑ ↓ los recorren, Enter abre, Esc regresa al campo.
 */
export function BuscadorGlobal({
  resultados,
  placeholder,
  atajo = true,
  enfocar = false,
  alTerminar,
}: {
  resultados: ResultadoBusqueda[];
  placeholder: string;
  atajo?: boolean;
  /** Enfoca el campo al aparecer (la búsqueda del celular). */
  enfocar?: boolean;
  alTerminar?: () => void;
}) {
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (enfocar) campo.current?.focus();
  }, [enfocar]);

  const hallados = useMemo(() => {
    const t = normal(q);
    if (!t) return [];
    return resultados.filter((r) => normal(`${r.etiqueta} ${r.detalle ?? ""} ${r.grupo}`).includes(t)).slice(0, 8);
  }, [q, resultados]);

  // Clic afuera: se cierran los resultados
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  const elegido = () => {
    setQ("");
    setAbierto(false);
    alTerminar?.();
  };

  const teclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(lista.current?.querySelectorAll<HTMLElement>("[data-resultado]") ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      if (!items.length) return;
      e.preventDefault();
      setAbierto(true);
      items[i < 0 ? 0 : Math.min(items.length - 1, i + 1)]?.focus();
    } else if (e.key === "ArrowUp" && i >= 0) {
      e.preventDefault();
      if (i === 0) campo.current?.focus();
      else items[i - 1]?.focus();
    } else if (e.key === "Escape" && i >= 0) {
      e.preventDefault();
      campo.current?.focus();
    }
  };

  const mostrar = abierto && q.trim().length > 0;
  let grupoPrevio = "";

  return (
    <div
      ref={raiz}
      className="tb-busqueda"
      onKeyDown={teclear}
      onFocus={() => setAbierto(true)}
      onBlur={(e) => {
        if (!raiz.current?.contains(e.relatedTarget as Node)) setAbierto(false);
      }}
    >
      <Buscador
        ref={campo}
        etiqueta="Buscar en Atendel"
        placeholder={placeholder}
        tam="compacto"
        atajo={atajo}
        valor={q}
        alCambiar={(v) => {
          setQ(v);
          setAbierto(true);
        }}
        alBuscar={() => {
          const primero = lista.current?.querySelector<HTMLElement>("[data-resultado]");
          primero?.click();
        }}
      />
      <div className="tb-busqueda__panel" data-abierto={mostrar ? "true" : undefined}>
        <p className="sr-only" aria-live="polite">
          {mostrar ? `${hallados.length} ${hallados.length === 1 ? "resultado" : "resultados"}` : ""}
        </p>
        {mostrar && hallados.length === 0 ? (
          <p className="tb-busqueda__nada">
            Nada con «{q.trim()}». Prueba con el nombre de un agente, de un cliente o de un chat.
          </p>
        ) : null}
        <ul ref={lista} className="tb-busqueda__lista">
          {mostrar
            ? hallados.map((r) => {
                const titulo = r.grupo !== grupoPrevio ? r.grupo : null;
                grupoPrevio = r.grupo;
                const dentro = (
                  <>
                    {r.agentes?.length ? <CarasAgentes ids={r.agentes} tam={24} /> : <Icono nombre={r.icono ?? "flecha"} tam={16} className="tb-busqueda__icono" />}
                    <span className="tb-busqueda__texto">
                      <span className="tb-busqueda__etiqueta">{r.etiqueta}</span>
                      {r.detalle ? <span className="tb-busqueda__detalle">{r.detalle}</span> : null}
                    </span>
                    <Icono nombre="chevron-derecha" tam={14} className="tb-busqueda__ir" />
                  </>
                );
                return (
                  <li key={r.id}>
                    {titulo ? <p className="tb-busqueda__grupo">{titulo}</p> : null}
                    {r.accion.href ? (
                      <Link href={r.accion.href} className="tb-busqueda__resultado" data-resultado="" onClick={elegido}>
                        {dentro}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="tb-busqueda__resultado"
                        data-resultado=""
                        onClick={() => {
                          r.accion.alElegir?.();
                          elegido();
                        }}
                      >
                        {dentro}
                      </button>
                    )}
                  </li>
                );
              })
            : null}
        </ul>
      </div>
    </div>
  );
}
