"use client";

import { useIdioma } from "@/i18n/Idioma";
import { BotonLista } from "./BotonLista";

/**
 * El cierre del inicio al final de las demás páginas (apps, agentes, precios…): «Tu negocio ya
 * tiene quién atienda. Deja que Atendel lo haga.» (en inglés, «Let Atendel handle it.») y el
 * botón de la lista. Sin la marca de fragmentos: estas páginas no tienen las figuras de fondo
 * del inicio y ahí se veía rara.
 */
export function CierreMarca() {
  const { d } = useIdioma();
  return (
    <section className="cierre-marca" aria-labelledby="cierre-marca-titulo">
      <div className="cierre-marca__centro">
        <h2 id="cierre-marca-titulo" className="cierre-marca__texto">
          {d.inicio.cierre.linea1}
          <br />
          {d.inicio.cierre.linea2}
        </h2>
        <BotonLista />
      </div>
    </section>
  );
}
