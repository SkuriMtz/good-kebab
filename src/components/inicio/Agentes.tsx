import Link from "next/link";
import { BotonFicha } from "@/components/agentes/BotonFicha";
import { Personaje } from "@/components/agentes/Personaje";
import { claseBotonBase } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { Seccion } from "@/components/base/Seccion";
import { AGENTES_INFO } from "@/lib/agentes";

/**
 * 3. Los cuatro agentes (estilo diseno/vercel, "Feature Card Grid"):
 * tarjetas finas de dos en dos. Cada una con su personaje, su área en Mono,
 * su nombre a 30px, lo que hace en una línea y una muestra pequeña del
 * producto: lo que le puedes pedir, escrito en la caja del chat (sale de
 * las sugerencias reales de src/lib/agentes.ts). Abre su ficha o su página.
 */
export function Agentes() {
  return (
    <Seccion id="agentes" etiquetadaPor="agentes-titulo">
      <header className="banda-cabeza">
        <Etiqueta>Tu equipo</Etiqueta>
        <h2 id="agentes-titulo" className="t-seccion">
          Cuatro agentes, cada uno con su trabajo.
        </h2>
        <p className="t-intro">
          Uno contesta WhatsApp y agenda, otra lleva tu correo, otro trae de regreso a tus clientes y otra hace el trabajo
          de oficina. Les escribes como a una persona.
        </p>
      </header>

      <ul className="rejilla-agentes">
        {AGENTES_INFO.map((a) => (
          <li key={a.id} className="tarjeta-agente tarjeta-fina">
            <div className="tarjeta-agente__cabeza">
              <Personaje agente={a.id} avatar className="tarjeta-agente__personaje" />
              <Etiqueta as="span" tono="tenue">
                {a.area} · {a.abarca}
              </Etiqueta>
            </div>
            <h3 className="t-titulo">{a.nombre}</h3>
            <p className="t-cuerpo tarjeta-agente__lema">{a.lema}</p>

            <div className="tarjeta-agente__muestra muestra">
              <p className="tarjeta-agente__para etiqueta etiqueta--tenue">Pídele a {a.nombre}</p>
              <p className="tarjeta-agente__pide">{a.sugerencias[0]}</p>
              <span className="tarjeta-agente__enviar" aria-hidden="true">
                <Icono nombre="enviar" tam={16} />
              </span>
            </div>

            <div className="tarjeta-agente__acciones">
              <BotonFicha agente={a.id} className={claseBotonBase("fantasma", "chico")}>
                Ver su ficha
              </BotonFicha>
              <Link href={`/agentes/${a.id}`} className="enlace-flecha">
                Todo lo que hace
                <Icono nombre="chevron-derecha" tam={16} />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}
