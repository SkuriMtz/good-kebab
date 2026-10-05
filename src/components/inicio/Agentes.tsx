import { Check } from "@/components/Buttons";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { Pestanas } from "@/components/base/Pestanas";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { ConversacionEjemplo } from "@/components/agentes/ConversacionEjemplo";
import { Personaje } from "@/components/agentes/Personaje";
import { DETALLE } from "@/components/agentes/detalle";
import { AGENTES_INFO } from "@/lib/agentes";
import { planMinimo } from "@/lib/planes";

/**
 * 3. Los cuatro agentes (Grupo 3). Versión base: pestañas en píldora con el
 * personaje pequeño; cada pestaña muestra al agente, qué hace, su
 * conversación de ejemplo en un panel del producto y en qué plan está.
 */
export function Agentes() {
  const pestanas = AGENTES_INFO.map((a) => ({
    id: a.id,
    etiqueta: a.nombre,
    adorno: <Personaje agente={a.id} avatar />,
    contenido: (
      <div className="columnas-asimetricas">
        <div>
          <Personaje agente={a.id} className="h-24 w-24" />
          <Etiqueta tono="cielo" className="mt-[var(--spacing-16)]">
            {a.area} · {a.abarca}
          </Etiqueta>
          <h3 className="t-titulo mt-[var(--spacing-8)]">{a.nombre}</h3>
          <p className="t-intro mt-[var(--spacing-12)]">{a.lema}</p>
          <ul className="lista-check mt-[var(--spacing-24)]">
            {a.capacidades.map((c) => (
              <li key={c} className="t-editorial">
                <Check className="h-4 w-4" />
                {c}
              </li>
            ))}
          </ul>
          <p className="t-chico mt-[var(--spacing-24)]">Viene con {planMinimo(a.id).nombre}.</p>
          <Boton href={`/agentes#${a.id}`} variante="fantasma" flecha className="mt-[var(--spacing-24)]">
            Todo lo que hace {a.nombre}
          </Boton>
        </div>
        <MarcoNavegador
          titulo={`Conversación de ejemplo con ${a.nombre}`}
          pestanas={[{ etiqueta: `${a.nombre} · ${DETALLE[a.id].canal}`, activa: true }]}
          relleno
        >
          <ConversacionEjemplo agente={a.id} />
        </MarcoNavegador>
      </div>
    ),
  }));

  return (
    <Seccion id="agentes" etiquetadaPor="agentes-titulo">
      <EncabezadoSeccion
        id="agentes-titulo"
        etiqueta="Tu equipo"
        titulo="Cuatro agentes, un solo equipo"
        texto="Cada uno lleva un área de tu negocio: atención, correo, clientes y oficina. Elige uno para ver qué hace y cómo habla."
      />
      <Pestanas etiqueta="Los agentes de Atendel" pestanas={pestanas} />
    </Seccion>
  );
}
