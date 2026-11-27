"use client";

import { useIdioma } from "@/i18n/Idioma";
import { BotonLista } from "./BotonLista";
import { fraseCierre, type PaginaCierre } from "./frasesCierre";

/**
 * El cierre del inicio al final de las demás páginas (apps, agentes, precios…): una frase que
 * cambia según la página (frasesCierre.ts; sin página, la del inicio: «Tu negocio ya tiene
 * quién atienda.»), «Deja que Atendel lo haga.» (en inglés, «Let Atendel handle it.») y el
 * botón de la lista. Sin la marca de fragmentos: estas páginas no tienen las figuras de fondo
 * del inicio y ahí se veía rara.
 */
export function CierreMarca({ pagina }: { pagina?: PaginaCierre }) {
  const { idioma, d } = useIdioma();
  const linea1 = (pagina && fraseCierre(idioma, pagina)) || d.inicio.cierre.linea1;
  return (
    <section className="cierre-marca" aria-labelledby="cierre-marca-titulo">
      <div className="cierre-marca__centro">
        <h2 id="cierre-marca-titulo" className="cierre-marca__texto">
          {linea1}
          <br />
          {d.inicio.cierre.linea2}
        </h2>
        <BotonLista />
      </div>
    </section>
  );
}
