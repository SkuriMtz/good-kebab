import { BotonFicha } from "./BotonFicha";
import { Personaje } from "./Personaje";
import { AGENTES_INFO } from "@/lib/agentes";

/**
 * Los cuatro agentes juntos, de pie, como el retrato del equipo: su
 * personaje, su nombre y su área en Mono. Sin cajas: flotan sobre el halo.
 * Cada uno abre su ficha (en celular se tocan; con mouse se asoman un poco).
 */
export function TarjetasAgentes() {
  return (
    <ul className="equipo-ag" aria-label="Los cuatro agentes">
      {AGENTES_INFO.map((a) => (
        <li key={a.id}>
          <BotonFicha agente={a.id} className="equipo-ag__boton" ariaLabel={`${a.nombre}, ${a.area}: ver su ficha`}>
            <Personaje agente={a.id} className="equipo-ag__personaje" />
            <span className="equipo-ag__nombre">{a.nombre}</span>
            <span className="etiqueta etiqueta--tenue">{a.area}</span>
          </BotonFicha>
        </li>
      ))}
    </ul>
  );
}
