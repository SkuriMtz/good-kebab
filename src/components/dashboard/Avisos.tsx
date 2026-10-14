"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BotonIcono } from "@/components/base/Boton";
import { Avatar } from "@/components/base/Avatar";
import { Cara } from "./Caras";
import { Destinable } from "./Navegacion";
import type { Aviso, Destino } from "./tipos";

/**
 * La campana: avisos de los agentes (lo que espera tu visto bueno, una
 * factura por vencer, alguien que no confirmó). Es una ventanita que flota
 * desde la campana (misma piel que los menús de la base: radio 14, borde,
 * sombra suave y vidrio); se cierra con clic afuera, Esc (el foco vuelve a
 * la campana) o al elegir un aviso. "Marcar todo como leído" funciona aquí
 * mismo. Sin avisos, lo dice con calma.
 */
export function Avisos({ avisos, todo }: { avisos: Aviso[]; todo: Destino }) {
  const [abierto, setAbierto] = useState(false);
  const [leidos, setLeidos] = useState<Set<string>>(() => new Set(avisos.filter((a) => a.leido).map((a) => a.id)));
  const raiz = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const porTeclado = useRef(false);
  const id = useId().replace(/:/g, "");
  const sinLeer = useMemo(() => avisos.filter((a) => !leidos.has(a.id)).length, [avisos, leidos]);

  const cerrar = (devolverFoco: boolean) => {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  };

  useEffect(() => {
    if (!abierto) return;
    // Con teclado, el foco entra al primer aviso; con el mouse, al panel
    const primero = panel.current?.querySelector<HTMLElement>("[data-aviso]");
    if (porTeclado.current && primero) primero.focus();
    else panel.current?.focus();
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      cerrar(true);
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const marcar = (idAviso: string) => setLeidos((s) => new Set(s).add(idAviso));

  // Flechas ↑ ↓ entre los avisos
  const alTeclear = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const lista = Array.from(panel.current?.querySelectorAll<HTMLElement>("[data-aviso]") ?? []);
    if (!lista.length) return;
    e.preventDefault();
    const i = lista.indexOf(document.activeElement as HTMLElement);
    const n = e.key === "ArrowDown" ? (i + 1) % lista.length : (i - 1 + lista.length) % lista.length;
    lista[i < 0 ? 0 : n]?.focus();
  };

  return (
    <div
      ref={raiz}
      className="dash-avisos"
      onBlur={(e) => {
        if (abierto && e.relatedTarget && !raiz.current?.contains(e.relatedTarget as Node)) setAbierto(false);
      }}
    >
      <BotonIcono
        ref={boton}
        etiqueta="Avisos"
        icono="campana"
        contador={sinLeer}
        etiquetaContador={sinLeer ? `${sinLeer} sin leer` : undefined}
        anillo="var(--c-fondo)"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls={`${id}-avisos`}
        onClick={(e) => {
          porTeclado.current = e.detail === 0;
          setAbierto((v) => !v);
        }}
      />
      <div
        ref={panel}
        id={`${id}-avisos`}
        role="dialog"
        aria-labelledby={`${id}-titulo`}
        tabIndex={-1}
        className="dash-flotante dash-flotante--fin dash-avisos__panel"
        data-abierto={abierto ? "true" : undefined}
        onKeyDown={alTeclear}
      >
        <div className="dash-avisos__cabeza">
          <h2 id={`${id}-titulo`} className="dash-avisos__titulo">
            Avisos
          </h2>
          {sinLeer > 0 ? (
            <button type="button" className="dash-texto-boton" onClick={() => setLeidos(new Set(avisos.map((a) => a.id)))}>
              Marcar todo como leído
            </button>
          ) : null}
        </div>
        {avisos.length ? (
          <ul className="dash-avisos__lista">
            {avisos.map((a) => {
              const nuevo = !leidos.has(a.id);
              return (
                <li key={a.id}>
                  <Destinable
                    destino={a.destino}
                    className="dash-aviso"
                    data-aviso=""
                    data-nuevo={nuevo ? "" : undefined}
                    alIr={() => {
                      marcar(a.id);
                      setAbierto(false);
                    }}
                  >
                    {a.agente ? <Cara agente={a.agente} /> : <Avatar nombre="Atendel" tam={28} />}
                    <span className="dash-aviso__texto">
                      <span className="dash-aviso__titulo">{a.titulo}</span>
                      {a.detalle ? <span className="dash-aviso__detalle">{a.detalle}</span> : null}
                      <span className="dash-aviso__cuando cifras">{a.cuando}</span>
                    </span>
                    {nuevo ? <span className="dash-aviso__punto" aria-label="Sin leer" role="img" /> : null}
                  </Destinable>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="dash-avisos__vacio">
            <p className="dash-vacio__titulo">No tienes avisos</p>
            <p className="dash-vacio__texto">Cuando un agente necesite tu visto bueno o algo se te pueda pasar, te avisamos aquí.</p>
          </div>
        )}
        <div className="dash-avisos__pie">
          <Destinable destino={todo} className="dash-texto-boton" alIr={() => setAbierto(false)}>
            Ver toda la actividad
          </Destinable>
        </div>
      </div>
    </div>
  );
}
