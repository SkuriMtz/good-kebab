"use client";

import { forwardRef, useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Buscador } from "@/components/base/Buscador";
import { Icono } from "@/components/base/Iconos";
import { sinAcentos } from "./nombres";
import { Accionable, MarcaAgente } from "./Piezas";
import type { ResultadoBusqueda } from "./tipos";
import { usePopover } from "@/components/base/Popover";

const MAX = 8;

/** Marca en negritas lo que coincide con la búsqueda ("vic" en "Víctor"). */
function resaltar(texto: string, q: string): ReactNode {
  const nq = sinAcentos(q);
  if (!nq) return texto;
  const chars = Array.from(texto);
  const plano = chars.map((c) => c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("es-MX").charAt(0) || c).join("");
  const i = plano.indexOf(nq);
  if (i < 0) return texto;
  return (
    <>
      {chars.slice(0, i).join("")}
      <mark className="dash-busca__marca">{chars.slice(i, i + nq.length).join("")}</mark>
      {chars.slice(i + nq.length).join("")}
    </>
  );
}

/**
 * El buscador de la barra (la píldora con "/"): busca en lo que hay en
 * pantalla (agentes, conversaciones, citas, secciones) y muestra los
 * resultados agrupados en un panel flotante. ↓ entra a los resultados,
 * ↑ ↓ los recorren, Enter abre el primero, Esc borra o cierra.
 */
export const BuscadorDashboard = forwardRef<
  HTMLInputElement,
  { indice: ResultadoBusqueda[]; placeholder?: string; atajo?: boolean; alElegir?: () => void; className?: string }
>(function BuscadorDashboard({ indice, placeholder = "Busca…", atajo = true, alElegir, className = "" }, ref) {
  const [q, setQ] = useState("");
  const { abierto, setAbierto, cerrar, raiz, alSalirFoco } = usePopover();
  const idPanel = `${useId().replace(/:/g, "")}-resultados`;

  const resultados = useMemo(() => {
    const nq = sinAcentos(q);
    if (!nq) return [];
    return indice.filter((r) => sinAcentos(`${r.titulo} ${r.detalle ?? ""} ${r.claves ?? ""}`).includes(nq)).slice(0, MAX);
  }, [q, indice]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, ResultadoBusqueda[]>();
    resultados.forEach((r) => mapa.set(r.grupo, [...(mapa.get(r.grupo) ?? []), r]));
    return Array.from(mapa.entries());
  }, [resultados]);

  const terminar = () => {
    setQ("");
    cerrar(false);
    alElegir?.();
  };

  const elegir = (r: ResultadoBusqueda | undefined) => {
    if (!r) return;
    if (r.alElegir) r.alElegir();
    else if (r.href) {
      // Enter en el campo: navega como si se hubiera hecho clic en el primero
      raiz.current?.querySelector<HTMLElement>(".dash-busca__resultado")?.click();
    }
    terminar();
  };

  const opciones = () => Array.from(raiz.current?.querySelectorAll<HTMLElement>(".dash-busca__resultado") ?? []);

  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const lista = opciones();
    if (!lista.length) return;
    e.preventDefault();
    const i = lista.indexOf(document.activeElement as HTMLElement);
    if (i < 0) {
      (e.key === "ArrowDown" ? lista[0] : lista[lista.length - 1]).focus();
      return;
    }
    const j = e.key === "ArrowDown" ? i + 1 : i - 1;
    if (j < 0) raiz.current?.querySelector<HTMLInputElement>("input")?.focus();
    else lista[Math.min(j, lista.length - 1)].focus();
  };

  const mostrar = abierto && Boolean(q.trim());

  return (
    <div ref={raiz} className={`dash-busca menu ${className}`} onKeyDown={alTeclear} onBlur={alSalirFoco} onFocus={() => q.trim() && setAbierto(true)}>
      <Buscador
        ref={ref}
        etiqueta="Buscar en Atendel"
        placeholder={placeholder}
        tam="compacto"
        atajo={atajo}
        valor={q}
        alCambiar={(v) => {
          setQ(v);
          setAbierto(Boolean(v.trim()));
        }}
        alBuscar={() => elegir(resultados[0])}
        className="dash-busca__campo"
      />
      <p className="sr-only" aria-live="polite">
        {q.trim() ? (resultados.length ? `${resultados.length} resultados` : "Sin resultados") : ""}
      </p>
      <div id={idPanel} className="menu__panel dash-busca__panel" data-abierto={mostrar ? "true" : undefined} aria-label="Resultados de la búsqueda" role="region">
        {grupos.length ? (
          grupos.map(([grupo, lista]) => (
            <div key={grupo} className="dash-busca__grupo">
              <p className="menu__titulo">{grupo}</p>
              <ul>
                {lista.map((r) => (
                  <li key={r.id}>
                    <Accionable
                      accion={{
                        href: r.href,
                        alElegir: () => {
                          r.alElegir?.();
                          terminar();
                        },
                      }}
                      className="menu__elemento dash-busca__resultado"
                    >
                      {r.agente ? <MarcaAgente id={r.agente} tam={24} /> : <Icono nombre={r.icono ?? "buscar"} tam={16} />}
                      <span className="menu__texto">
                        <span>{resaltar(r.titulo, q)}</span>
                        {r.detalle ? <span className="menu__descripcion">{r.detalle}</span> : null}
                      </span>
                    </Accionable>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="dash-busca__nada">
            Nada con «{q.trim()}». Prueba con el nombre de un agente, de un cliente o de una sección.
          </p>
        )}
      </div>
    </div>
  );
});
