import type { CSSProperties } from "react";
import Link from "next/link";
import { Check } from "@/components/Buttons";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";
import { PLANES } from "@/lib/planes";

/**
 * 8. Precios (Grupo 5). Versión base: tres tarjetas de vidrio con los planes
 * de src/lib/planes.ts (sin cambiar precios ni condiciones). Free es el único
 * disponible hoy: va destacada (borde #8c93fb) y con el botón principal; One y
 * Max, sin precio publicado, invitan a la lista de espera con botón fantasma.
 */
export function Precios() {
  return (
    <Seccion id="precios" etiquetadaPor="precios-titulo">
      <EncabezadoSeccion
        id="precios-titulo"
        etiqueta="Planes"
        titulo="Empieza gratis con Clara y suma al equipo cuando lo necesites"
      />
      <ul className="grid gap-[var(--spacing-24)] lg:grid-cols-3">
        {PLANES.map((p) => {
          const disponible = p.id === "free";
          return (
            <TarjetaVidrio key={p.id} as="li" destacada={disponible} className="flex flex-col">
              <div className="flex items-center justify-between gap-[var(--spacing-12)]">
                <Etiqueta tono={disponible ? "cielo" : "cuerpo"}>Atendel · {p.nivel}</Etiqueta>
                <ul className="flex -space-x-2" aria-label={`Agentes: ${p.agentes.map((a) => AGENTE_POR_ID[a].nombre).join(", ")}`}>
                  {p.agentes.map((a) => (
                    <li
                      key={a}
                      className="marca-agente marca-agente--mini ring-2 ring-[var(--c-fondo)]"
                      style={{ "--agente": PERSONAJES[a].color } as CSSProperties}
                    >
                      <Personaje agente={a} avatar />
                    </li>
                  ))}
                </ul>
              </div>
              <h3 className="t-titulo mt-[var(--spacing-16)]">{p.nombre}</h3>
              <p className="t-seccion mt-[var(--spacing-8)]">{p.precio ?? "Próximamente"}</p>
              <p className="t-cuerpo mt-[var(--spacing-8)]">{p.resumen}</p>
              <ul className="lista-check mt-[var(--spacing-24)]">
                {p.incluye.map((x) => (
                  <li key={x} className="t-editorial">
                    <Check className="h-4 w-4" />
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-[var(--spacing-32)]">
                {disponible ? (
                  <Boton href="/entrar" bloque>
                    Empieza gratis
                  </Boton>
                ) : (
                  <Boton href="#lista" variante="fantasma" bloque>
                    Avísame cuando abra
                  </Boton>
                )}
              </div>
            </TarjetaVidrio>
          );
        })}
      </ul>
      <p className="t-chico mx-auto mt-[var(--spacing-24)] max-w-[640px] text-center">
        Todos los planes: entras con tu correo, sin contraseña · funciona en celular y computadora · cada negocio ve solo lo suyo.{" "}
        <Link href="/precios" className="enlace">
          Comparar planes
        </Link>
      </p>
    </Seccion>
  );
}
