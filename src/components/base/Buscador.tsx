"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Icono } from "./Iconos";
import { Kbd } from "./Kbd";

/**
 * Buscador redondo del dashboard (estilo en globals.css, ".buscador").
 * - Píldora de 36px (32px en "compacto"), lupa a la izquierda, borde sutil y
 *   un tinte apenas visible; al enfocar se vuelve superficie con anillo azul.
 * - Atajo "/": desde cualquier parte de la página (si no estás escribiendo
 *   en otro campo) enfoca el buscador. Se muestra como <Kbd>/</Kbd> mientras
 *   está vacío y sin foco; en pantallas táctiles no se muestra.
 *   Usa `atajo` en UN solo buscador por página.
 * - Esc: si hay texto, lo borra; si no, suelta el foco. El botón ✕ borra.
 * - Enter: `alBuscar(valor)` (es un formulario role="search").
 * - Texto a 16px en táctil (sin zoom en iPhone) y 14px con mouse.
 * Funciona libre (`inicial`) o controlado (`valor` + `alCambiar`).
 */

export type PropsBuscador = {
  /** Nombre del campo para lectores de pantalla (ej. "Buscar en Atendel"). */
  etiqueta: string;
  placeholder?: string;
  valor?: string;
  inicial?: string;
  alCambiar?: (valor: string) => void;
  alBuscar?: (valor: string) => void;
  /** Activa el atajo "/" (por defecto, sí). */
  atajo?: boolean;
  tam?: "normal" | "compacto";
  deshabilitado?: boolean;
  name?: string;
  className?: string;
};

export const Buscador = forwardRef<HTMLInputElement, PropsBuscador>(function Buscador(
  {
    etiqueta,
    placeholder = "Buscar",
    valor: valorControlado,
    inicial = "",
    alCambiar,
    alBuscar,
    atajo = true,
    tam = "normal",
    deshabilitado = false,
    name,
    className = "",
  },
  ref,
) {
  const id = useId();
  const campo = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => campo.current as HTMLInputElement);
  const [libre, setLibre] = useState(inicial);
  const valor = valorControlado ?? libre;

  const cambiar = (v: string) => {
    if (valorControlado === undefined) setLibre(v);
    alCambiar?.(v);
  };

  // Atajo "/" para enfocar (no se anima: es una acción de teclado)
  useEffect(() => {
    if (!atajo || deshabilitado) return;
    const alTeclear = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      campo.current?.focus();
      campo.current?.select();
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [atajo, deshabilitado]);

  const alTeclearCampo = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    if (valor) cambiar("");
    else campo.current?.blur();
  };

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alBuscar?.(valor.trim());
  };

  return (
    <form role="search" className={`buscador${tam === "compacto" ? " buscador--compacto" : ""} ${className}`} onSubmit={enviar}>
      <label htmlFor={id} className="sr-only">
        {etiqueta}
      </label>
      <Icono nombre="buscar" tam={16} className="buscador__icono" />
      <input
        ref={campo}
        id={id}
        name={name}
        type="search"
        className="buscador__campo"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
        onKeyDown={alTeclearCampo}
        disabled={deshabilitado}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        aria-keyshortcuts={atajo ? "/" : undefined}
      />
      <span className="buscador__fin">
        {valor ? (
          <button
            type="button"
            className="buscador__borrar"
            aria-label="Borrar la búsqueda"
            onClick={() => {
              cambiar("");
              campo.current?.focus();
            }}
          >
            <Icono nombre="cerrar" tam={14} />
          </button>
        ) : atajo ? (
          <span className="buscador__atajo" aria-hidden="true">
            <Kbd>/</Kbd>
          </span>
        ) : null}
      </span>
    </form>
  );
});
