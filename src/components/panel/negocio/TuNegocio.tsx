"use client";

import { MAX_DOCUMENTOS_POR_PLAN } from "@/lib/nucleo-tipos";
import type { IdPlan } from "@/lib/planes";
import { Pildoras, TituloSeccion } from "../Piezas";
import { Seccion } from "../Secciones";
import { AppsNegocio } from "./Apps";
import { DocumentosNegocio } from "./Documentos";
import { useFuenteNegocio } from "./fuente";
import { PerfilNegocioVista } from "./Perfil";

export const PESTANAS_NEGOCIO = ["perfil", "documentos", "apps"] as const;
export type PestanaNegocio = (typeof PESTANAS_NEGOCIO)[number];
export const pestanaDe = (v: string | null | undefined): PestanaNegocio => ((PESTANAS_NEGOCIO as readonly string[]).includes(v ?? "") ? (v as PestanaNegocio) : "perfil");

const ETIQUETAS: Record<PestanaNegocio, string> = { perfil: "Perfil", documentos: "Documentos", apps: "Apps conectadas" };

/**
 * Tu negocio (?vista=negocio&tab=perfil|documentos|apps): lo que tu equipo
 * sabe de tu negocio y las apps a las que puede entrar. Las pestañas son
 * enlaces (la dirección cambia y atrás funciona). Los datos salen de la
 * fuente: la API real en /panel y el ejemplo de Estudio Luna en /pruebalo.
 */
export function TuNegocio({ tab, plan, conectada }: { tab: PestanaNegocio; plan: IdPlan; conectada?: string | null }) {
  const fuente = useFuenteNegocio();
  const href = (t: PestanaNegocio) => `${fuente.base}?vista=negocio&tab=${t}`;
  return (
    <Seccion>
      <TituloSeccion
        titulo="Tu negocio"
        texto="Lo que tu equipo sabe de tu negocio y las apps a las que puede entrar."
        acciones={fuente.demo ? <span className="pc-estado pc-estado--azul">Datos de ejemplo</span> : undefined}
      />
      <div className="pc-filtros">
        <Pildoras etiqueta="Partes de Tu negocio" activa={tab} opciones={PESTANAS_NEGOCIO.map((t) => ({ id: t, etiqueta: ETIQUETAS[t], href: href(t) }))} />
      </div>
      {/* Cada pestaña entra de nuevo (key): su entrada escalonada vuelve a correr */}
      <div key={tab} className="pc-negocio" id="pc-negocio-panel">
        {tab === "perfil" ? <PerfilNegocioVista /> : tab === "documentos" ? <DocumentosNegocio max={MAX_DOCUMENTOS_POR_PLAN[plan]} /> : <AppsNegocio conectada={conectada} />}
      </div>
    </Seccion>
  );
}

