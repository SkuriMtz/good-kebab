"use client";

import { useEffect, useRef, useState } from "react";
import { BotonIcono } from "@/components/base/Boton";
import { FormularioLista } from "@/components/FormularioLista";
import { EVENTO_LISTA } from "@/lib/inicio";

/**
 * La lista de espera en una ventana (la misma de las fichas de los agentes:
 * <dialog> nativo, se cierra con la ✕, con Escape o tocando afuera, y el
 * foco no se sale). La abre cualquier "Únete a la lista" de la página.
 */
export function DialogoLista() {
  const ref = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-lista", "");
    const abrir = () => setAbierto(true);
    window.addEventListener(EVENTO_LISTA, abrir);
    return () => {
      html.removeAttribute("data-lista");
      window.removeEventListener(EVENTO_LISTA, abrir);
    };
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto) {
      delete d.dataset.cerrando;
      if (!d.open) d.showModal();
      return;
    }
    if (d.open) {
      d.dataset.cerrando = "true";
      const t = window.setTimeout(() => {
        d.close();
        delete d.dataset.cerrando;
      }, 150);
      return () => window.clearTimeout(t);
    }
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="ficha ficha--lista"
      aria-labelledby="dialogo-lista-titulo"
      onCancel={(e) => {
        e.preventDefault();
        setAbierto(false);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setAbierto(false);
      }}
    >
      <div className="ficha__caja vidrio vidrio--frost dialogo-lista">
        <header className="dialogo-lista__cabeza">
          <h2 id="dialogo-lista-titulo" className="dialogo-lista__titulo">
            Únete a la lista
          </h2>
          <BotonIcono etiqueta="Cerrar" icono="cerrar" tam="normal" className="ficha__cerrar" onClick={() => setAbierto(false)} />
        </header>
        <p className="dialogo-lista__texto">Déjanos tu correo y te avisamos cuando abramos tu lugar en Atendel.</p>
        <FormularioLista />
      </div>
    </dialog>
  );
}
