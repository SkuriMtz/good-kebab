import type { CSSProperties } from "react";
import Link from "next/link";
import { FormularioLista } from "@/components/FormularioLista";
import { Personaje } from "@/components/agentes/Personaje";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Seccion } from "@/components/base/Seccion";
import { IDS_AGENTES } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

/**
 * 10. CTA final (Grupo 5). El momento protagonista del cierre: el equipo
 * (los cuatro personajes) sobre el halo, un titular grande y concreto, y el
 * mismo FormularioLista de la portada. Su id "lista" es el destino de los
 * botones "Avísame cuando abra" de los planes.
 */
export function CtaFinal() {
  return (
    <Seccion id="lista" etiquetadaPor="lista-titulo" halo fondo="portada" className="cta-final">
      <Halo y="46%" ancho="min(880px, 120vw)" />
      <div className="cta-final__centro">
        <ul className="cta-final__equipo" aria-label="Lola, Clara, Víctor e Iris">
          {IDS_AGENTES.map((a) => (
            <li
              key={a}
              className="marca-agente marca-agente--grande"
              style={{ "--agente": PERSONAJES[a].color } as CSSProperties}
            >
              <Personaje agente={a} avatar />
            </li>
          ))}
        </ul>
        <Etiqueta tono="cielo">Lista de espera</Etiqueta>
        <h2 id="lista-titulo" className="t-display cta-final__titulo">
          Aparta el lugar de tu negocio.
        </h2>
        <p className="t-intro cta-final__texto">
          Déjanos tu correo y te avisamos cuando abramos tu lugar. Mientras, platica con Lola, Clara, Víctor e Iris en
          Pruébalo.
        </p>
        <FormularioLista centrado className="cta-final__formulario" />
        <p className="t-chico cta-final__duda">
          ¿Tienes una duda antes de anotarte?{" "}
          <Link href="/contacto" className="enlace">
            Escríbenos
          </Link>
        </p>
      </div>
    </Seccion>
  );
}
