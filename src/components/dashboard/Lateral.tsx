"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Kbd } from "@/components/base/Kbd";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { TECLA_VISTA } from "./contenido";
import { MarcaAgente, MarcaConversacion } from "./Marcas";
import type { Destino, ElementoNav, EstadoAgente, GrupoLateral, IdVista } from "./tipos";

/** Un renglón que lleva a algún lado: enlace de verdad o botón (demo sin recargar). */
function Renglon({
  destino,
  className,
  actual,
  inactivo,
  alTocar,
  children,
}: {
  destino: Destino;
  className: string;
  actual?: boolean;
  inactivo?: boolean;
  alTocar?: () => void;
  children: ReactNode;
}) {
  if (inactivo) {
    return (
      <span className={className} aria-disabled="true">
        {children}
      </span>
    );
  }
  if (destino.href) {
    return (
      <Link href={destino.href} className={className} aria-current={actual ? "page" : undefined} onClick={alTocar}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={className}
      aria-current={actual ? "page" : undefined}
      onClick={() => {
        alTocar?.();
        destino.alElegir?.();
      }}
    >
      {children}
    </button>
  );
}

/**
 * El menú lateral: secciones, tus agentes y tus grupos. El mismo contenido
 * vive fijo a la izquierda en computadora y dentro del cajón en celular.
 * En computadora, al pasar el cursor, cada sección enseña su atajo (G y una letra).
 */
export function Lateral({
  nav,
  vista,
  agentes,
  grupos,
  nuevoGrupo,
  sinGrupos,
  pie,
  alTocar,
}: {
  nav: ElementoNav[];
  vista: IdVista;
  agentes: EstadoAgente[];
  grupos: GrupoLateral[];
  /** Cómo se crea un grupo (si se puede). */
  nuevoGrupo?: Destino;
  /** Qué decir si todavía no hay grupos. */
  sinGrupos?: string;
  pie?: ReactNode;
  /** Al elegir algo (el cajón se cierra). */
  alTocar?: () => void;
}) {
  // El lateral vive dos veces (fijo y en el cajón): ids propios para cada uno
  const id = useId().replace(/:/g, "");
  return (
    <div className="lateral">
      <nav aria-label="Secciones">
        <ul className="lateral__lista">
          {nav.map((n) => {
            const tecla = TECLA_VISTA[n.id];
            return (
              <li key={n.id}>
                <Renglon destino={n} className="lateral__nav" actual={n.id === vista} inactivo={n.pronto} alTocar={alTocar}>
                  <Icono nombre={n.icono} tam={16} />
                  <span className="lateral__nombre">{n.etiqueta}</span>
                  {n.pronto ? <Insignia tono="pronto">Pronto</Insignia> : null}
                  {n.contador ? <Insignia contador={n.contador} etiqueta={n.etiquetaContador} /> : null}
                  {tecla && !n.pronto ? (
                    <span className="lateral__atajo" aria-hidden="true">
                      <Kbd teclas={["G", tecla]} />
                    </span>
                  ) : null}
                </Renglon>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="lateral__seccion" aria-labelledby={`${id}-agentes`}>
        <h2 id={`${id}-agentes`} className="lateral__titulo">
          Tus agentes
        </h2>
        <ul className="lateral__lista">
          {agentes.map((a) => {
            const info = AGENTE_POR_ID[a.id];
            return (
              <li key={a.id}>
                <Renglon destino={a} className="lateral__agente" alTocar={alTocar}>
                  <MarcaAgente agente={a.id} apagado={Boolean(a.bloqueado)} />
                  <span className="lateral__agente-texto">
                    <span className="lateral__nombre">
                      {info.nombre}
                      <span className="lateral__area">{info.area}</span>
                    </span>
                    {a.bloqueado ? (
                      <span className="lateral__bloqueado">
                        <Icono nombre="candado" tam={16} />
                        {a.bloqueado}
                      </span>
                    ) : (
                      <PuntoEstado tono={a.tono} etiqueta={a.etiqueta} mostrarEtiqueta pulso={a.pulso} />
                    )}
                  </span>
                </Renglon>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="lateral__seccion" aria-labelledby={`${id}-grupos`}>
        <h2 id={`${id}-grupos`} className="lateral__titulo">
          Grupos
        </h2>
        {grupos.length ? (
          <ul className="lateral__lista">
            {grupos.map((g) => (
              <li key={g.id}>
                <Renglon destino={g} className="lateral__grupo" alTocar={alTocar}>
                  <MarcaConversacion agentes={g.agentes} />
                  <span className="lateral__nombre">{g.nombre}</span>
                  {g.sinLeer ? <Insignia contador={g.sinLeer} etiqueta={`${g.sinLeer} sin leer`} /> : null}
                </Renglon>
              </li>
            ))}
          </ul>
        ) : (
          <p className="lateral__vacio">{sinGrupos ?? "Todavía no tienes grupos."}</p>
        )}
        {nuevoGrupo ? (
          <Renglon destino={nuevoGrupo} className="lateral__nuevo" alTocar={alTocar}>
            <span className="lateral__mas" aria-hidden="true">
              <Icono nombre="mas" tam={16} />
            </span>
            Nuevo grupo
          </Renglon>
        ) : null}
      </section>

      {pie ? <div className="lateral__pie">{pie}</div> : null}
    </div>
  );
}
