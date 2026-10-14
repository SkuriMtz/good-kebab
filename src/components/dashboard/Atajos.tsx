"use client";

import { useEffect, useRef } from "react";
import { BotonIcono } from "@/components/base/Boton";
import { Kbd } from "@/components/base/Kbd";
import { gruposAtajos } from "./contenido";

/**
 * La hoja de atajos de teclado (tecla "?", o desde el menú de perfil y la
 * ayuda). Ventana modal centrada; Esc, el velo o ✕ la cierran.
 * No aparece en celular: ahí no hay teclado que enseñar.
 */
export function Atajos({ abierta, alCerrar, esMac }: { abierta: boolean; alCerrar: () => void; esMac: boolean }) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    else if (!abierta && d.open) d.close();
  }, [abierta]);

  return (
    <dialog
      ref={dialogo}
      className="atajos"
      aria-labelledby="atajos-titulo"
      onCancel={(e) => {
        e.preventDefault();
        alCerrar();
      }}
      onClose={() => {
        if (abierta) alCerrar();
      }}
    >
      <div className="paleta__velo" aria-hidden="true" onClick={alCerrar} />
      <div className="atajos__panel">
        <div className="atajos__cabeza">
          <div>
            <h2 id="atajos-titulo" className="t-app-titulo">
              Atajos de teclado
            </h2>
            <p className="atajos__intro">Muévete por Atendel sin soltar el teclado. Funcionan cuando no estás escribiendo.</p>
          </div>
          <BotonIcono etiqueta="Cerrar" icono="cerrar" onClick={alCerrar} />
        </div>
        <div className="atajos__grupos">
          {gruposAtajos(esMac ? "⌘" : "Ctrl").map((g) => (
            <section key={g.titulo} aria-labelledby={`atajos-${g.titulo}`}>
              <h3 id={`atajos-${g.titulo}`} className="atajos__titulo">
                {g.titulo}
              </h3>
              <dl className="atajos__lista">
                {g.atajos.map((a) => (
                  <div key={a.texto} className="atajos__fila">
                    <dt>{a.texto}</dt>
                    <dd>
                      {a.teclas.length > 1 && a.teclas[0] === "G" ? (
                        <span className="atajos__secuencia">
                          <Kbd>G</Kbd>
                          <span>luego</span>
                          <Kbd>{a.teclas[1]}</Kbd>
                        </span>
                      ) : (
                        <Kbd teclas={a.teclas} />
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </dialog>
  );
}
