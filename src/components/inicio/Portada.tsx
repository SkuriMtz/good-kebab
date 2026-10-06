import type { CSSProperties } from "react";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { FormularioLista } from "@/components/FormularioLista";
import { EnlaceFicha } from "@/components/agentes/BotonFicha";
import { Escena3D } from "@/components/escena3d/Escena3D";
import { AGENTES_INFO } from "@/lib/agentes";

const orden = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * 1. Portada (Grupo 1 · propuesta G1-T1: "Las cuatro esferas").
 *
 * Detrás de todo, fija, la escena 3D forma el logo de Atendel: cuatro esferas
 * de partículas, una por agente, muy tenues, girando lento detrás del halo.
 * Encima, sobrio y centrado: título, intro, el formulario de la lista y la
 * línea en Mono con lo que cuesta empezar.
 * Abajo, la "leyenda" de la escena: qué esfera es cada agente, en el mismo
 * orden que el logo (en celular, dos por dos, como la marca). Cada nombre
 * abre la ficha del agente.
 *
 * El recorte (clip-path) hace que la escena fija solo se vea dentro de la
 * portada; el contenido se desliza encima y la figura se queda (lección 8).
 */
export function Portada() {
  return (
    <section aria-labelledby="portada-titulo" className="portada seccion--portada con-halo">
      <Escena3D variante="portada" />
      <Halo y="44%" ancho="min(980px, 150vw)" className="portada__halo" />

      <div className="contenedor portada__contenido">
        <div className="portada__bloque" data-escena-centro="">
          <Etiqueta tono="cielo" className="portada__entra">
            Para clínicas, consultorios y estéticas
          </Etiqueta>
          <h1 id="portada-titulo" className="t-display portada__titulo portada__entra" style={orden(1)}>
            Tu recepción sigue contestando mientras tú atiendes
          </h1>
          <p className="t-intro portada__intro portada__entra" style={orden(2)}>
            Cuatro agentes de IA contestan tu WhatsApp, agendan y confirman citas, ordenan tu correo y le escriben a quien faltó a su
            cita. Lo importante no sale sin tu visto bueno.
          </p>
          <div className="portada__formulario portada__entra" style={orden(3)}>
            <FormularioLista centrado />
            <Etiqueta tono="tenue" className="portada__condiciones">
              Plan Free · Gratis · Entras con tu correo, sin contraseña
            </Etiqueta>
          </div>
        </div>

        <nav aria-label="Los cuatro agentes" className="portada__leyenda portada__entra" style={orden(4)}>
          <ul className="portada__agentes">
            {AGENTES_INFO.map((a) => (
              <li key={a.id}>
                <EnlaceFicha agente={a.id} className="portada__agente">
                  <span className="portada__punto" style={{ "--agente": `var(--agente-${a.id})` } as CSSProperties} aria-hidden="true" />
                  <span className="portada__nombre">{a.nombre}</span>
                  <span className="portada__area">{a.area}</span>
                </EnlaceFicha>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
