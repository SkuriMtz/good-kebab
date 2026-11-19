import { Personaje } from "./Personaje";
import { agentesDe, t, type Idioma } from "@/i18n";

/**
 * Los cuatro agentes de pie, uno junto a otro (el encabezado de /agentes).
 * Sin cajas: cada personaje sobre el fondo, con su nombre y su área; al pasar
 * el cursor aparece detrás un vidrio y el personaje se asoma. Sus ojos siguen
 * al cursor. Cada uno lleva a su sección, más abajo en la misma página.
 */
export function TarjetasAgentes({ idioma = "es" }: { idioma?: Idioma }) {
  const P = t(idioma).paginaAgentes;
  return (
    <ul className="elenco">
      {agentesDe(idioma).map((a) => (
        <li key={a.id}>
          <a href={`#${a.id}`} className="elenco__agente">
            <Personaje agente={a.id} className="elenco__personaje" />
            <span className="elenco__nombre">{a.nombre}</span>
            <span className="etiqueta etiqueta--cielo">{a.area}</span>
            <span className="elenco__abarca">{a.abarca}</span>
            <span className="elenco__ver" aria-hidden="true">
              {P.verFicha}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
