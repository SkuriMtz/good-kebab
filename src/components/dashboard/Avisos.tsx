"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { Boton, BotonIcono } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { MarcaAgente } from "./Marcas";
import type { Aviso } from "./tipos";

/**
 * Avisos de la campana. La lista es la misma en computadora (ventana que
 * cae desde la campana) y en celular (hoja que sube desde abajo).
 */
export function ListaAvisos({ avisos, alElegir, vacio }: { avisos: Aviso[]; alElegir: (a: Aviso) => void; vacio?: ReactNode }) {
  if (!avisos.length) {
    return (
      <div className="avisos__vacio">
        <Icono nombre="check-circulo" tam={24} />
        <p className="t-app-mediano">Estás al día</p>
        <p>{vacio ?? "Cuando un agente necesite algo de ti, te avisa aquí."}</p>
      </div>
    );
  }
  return (
    <ul className="avisos__lista">
      {avisos.map((a) => {
        const contenido = (
          <>
            {a.agente ? <MarcaAgente agente={a.agente} tam="mini" /> : <span className="avisos__icono"><Icono nombre="campana" tam={16} /></span>}
            <span className="avisos__texto">
              <span>{a.texto}</span>
              <span className="avisos__cuando cifras">{a.cuando}</span>
            </span>
            {a.nuevo ? <span className="avisos__nuevo" aria-label="Nuevo" /> : null}
          </>
        );
        return (
          <li key={a.id}>
            {a.href ? (
              <Link href={a.href} className="avisos__fila" data-nuevo={a.nuevo || undefined} onClick={() => alElegir(a)}>
                {contenido}
              </Link>
            ) : (
              <button type="button" className="avisos__fila" data-nuevo={a.nuevo || undefined} onClick={() => alElegir(a)}>
                {contenido}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** La campana con su ventana (computadora). Clic afuera y Esc la cierran; el foco vuelve a la campana. */
export function CampanaAvisos({
  abierta,
  alCambiar,
  avisos,
  alElegir,
  alLeerTodos,
  vacio,
}: {
  abierta: boolean;
  alCambiar: (v: boolean) => void;
  avisos: Aviso[];
  alElegir: (a: Aviso) => void;
  alLeerTodos: () => void;
  vacio?: ReactNode;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const nuevos = avisos.filter((a) => a.nuevo).length;

  useEffect(() => {
    if (!abierta) return;
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) alCambiar(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      alCambiar(false);
      boton.current?.focus();
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierta, alCambiar]);

  return (
    <div
      ref={raiz}
      className="menu menu--fin"
      onBlur={(e) => {
        if (abierta && e.relatedTarget && !raiz.current?.contains(e.relatedTarget as Node)) alCambiar(false);
      }}
    >
      <BotonIcono
        ref={boton}
        etiqueta="Avisos"
        icono="campana"
        contador={nuevos}
        etiquetaContador={nuevos ? `${nuevos} sin leer` : undefined}
        aria-expanded={abierta}
        aria-haspopup="dialog"
        onClick={(e) => {
          alCambiar(!abierta);
          // Con el teclado, el foco entra a la ventana
          if (!abierta && e.detail === 0) requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("a, button")?.focus());
        }}
      />
      <div
        ref={panel}
        role="dialog"
        aria-label="Avisos"
        className="menu__panel avisos"
        data-abierto={abierta ? "true" : undefined}
      >
        <div className="avisos__cabeza">
          <p className="t-app-mediano">Avisos</p>
          {nuevos ? (
            <Boton variante="fantasma" tam="compacto" onClick={alLeerTodos}>
              Marcar como leídos
            </Boton>
          ) : null}
        </div>
        <ListaAvisos avisos={avisos} vacio={vacio} alElegir={(a) => {
          alElegir(a);
          alCambiar(false);
        }} />
      </div>
    </div>
  );
}
