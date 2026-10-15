import { BotonFicha } from "./BotonFicha";
import { Personaje } from "./Personaje";
import { AGENTES_INFO } from "@/lib/agentes";

/**
 * Los cuatro agentes de pie, uno junto a otro (el encabezado de /agentes).
 * Sin cajas: cada personaje sobre el fondo, con su nombre y su área; al pasar
 * el cursor aparece detrás un vidrio y el personaje se asoma. Sus ojos siguen
 * al cursor. Cada uno abre su ficha.
 */
export function TarjetasAgentes() {
  return (
    <ul className="elenco">
      {AGENTES_INFO.map((a) => (
        <li key={a.id}>
          <BotonFicha agente={a.id} className="elenco__agente" ariaLabel={`${a.nombre}, ${a.area}: ver su ficha`}>
            <Personaje agente={a.id} className="elenco__personaje" />
            <span className="elenco__nombre">{a.nombre}</span>
            <span className="etiqueta etiqueta--cielo">{a.area}</span>
            <span className="elenco__abarca">{a.abarca}</span>
            <span className="elenco__ver" aria-hidden="true">
              Ver su ficha
            </span>
          </BotonFicha>
        </li>
      ))}
    </ul>
  );
}
