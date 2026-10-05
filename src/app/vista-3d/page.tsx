import type { Metadata } from "next";
import { BotonLink } from "@/components/Buttons";
import { Sitio } from "@/components/Sitio";
import { Aparece } from "@/components/escena3d/Aparece";

export const metadata: Metadata = { title: "Vista previa 3D", robots: { index: false, follow: false } };

type Lado = "izquierda" | "derecha" | "centro";

/**
 * Un tramo de la historia: ocupa `alto` de la pantalla y pone el texto del
 * lado contrario a la figura (zigzag de Dala). Sin texto, es un respiro donde
 * solo se ve la escena.
 */
function Tramo({ lado, alto, hero, children }: { lado?: Lado; alto: number; hero?: boolean; children?: React.ReactNode }) {
  return (
    <section className={`contenedor h3d ${lado ? `h3d--${lado}` : ""}`} style={{ minHeight: `${alto}vh` }}>
      {children ? <Aparece className={`h3d__col ${hero ? "h3d__col--hero" : ""}`}>{children}</Aparece> : null}
    </section>
  );
}

/**
 * Vista previa de la escena 3D con el estilo de diseno/design.md (Dala):
 * negro puro, titulares grandes de peso 400 con tracking -0.04em, párrafos
 * de peso 200, etiqueta en ámbar y un solo botón violeta por vista.
 * [data-historia] marca el tramo de la página que maneja la escena.
 */
export default function Vista3D() {
  return (
    <Sitio fondo="3d">
      <div data-historia="">
        {/* 1. Logo a la derecha */}
        <Tramo lado="izquierda" alto={100} hero>
          <p className="t-etiqueta">Agentes de IA para tu negocio</p>
          <h1 className="t-display t-display--enorme mt-[var(--spacing-18)]">Tu negocio, atendido.</h1>
          <p className="t-cuerpo mt-[var(--spacing-24)] max-w-[480px]">
            Cuatro agentes que contestan tu WhatsApp, agendan tus citas, ordenan tu correo y hacen el trabajo de oficina.
          </p>
          <div className="mt-[var(--spacing-30)]">
            <BotonLink href="/pruebalo">Pruébalo</BotonLink>
          </div>
        </Tramo>
        <Tramo alto={60} />

        {/* 2–3. El cerebro a la izquierda */}
        <Tramo lado="derecha" alto={120}>
          <p className="t-etiqueta">Qué es Atendel</p>
          <h2 className="t-display mt-[var(--spacing-18)]">Un equipo que piensa contigo</h2>
          <p className="t-cuerpo mt-[var(--spacing-24)]">
            Atendel es un equipo de cuatro agentes de inteligencia artificial para clínicas, consultorios y estéticas.
          </p>
          <p className="t-cuerpo mt-[var(--spacing-12)]">Les hablas como a una persona y te entregan el trabajo hecho.</p>
        </Tramo>
        <Tramo alto={80} />

        {/* 4–5. El caos */}
        <Tramo lado="izquierda" alto={90}>
          <h2 className="t-seccion">Mensajes sin contestar.</h2>
          <p className="t-cuerpo mt-[var(--spacing-18)]">Mientras atiendes a alguien, otros te escriben y se quedan esperando.</p>
        </Tramo>
        <Tramo lado="derecha" alto={90}>
          <h2 className="t-seccion">Citas perdidas. Correos acumulados.</h2>
          <p className="t-cuerpo mt-[var(--spacing-18)]">El día se va en pendientes y lo importante queda para después.</p>
        </Tramo>

        {/* 6. Se juntan al centro */}
        <Tramo lado="centro" alto={120}>
          <h2 className="t-seccion">Todo, en un solo lugar.</h2>
        </Tramo>

        {/* 7. La burbuja de chat a la izquierda */}
        <Tramo lado="derecha" alto={130}>
          <p className="t-etiqueta">Lola · Atención</p>
          <h2 className="t-display mt-[var(--spacing-18)]">Contesta por ti</h2>
          <p className="t-cuerpo mt-[var(--spacing-24)]">
            Responde tu WhatsApp con tus precios y horarios, a cualquier hora, con el tono de tu negocio.
          </p>
        </Tramo>

        {/* 8. El calendario a la derecha */}
        <Tramo lado="izquierda" alto={130}>
          <p className="t-etiqueta">Tu agenda</p>
          <h2 className="t-display mt-[var(--spacing-18)]">En orden, sin esfuerzo</h2>
          <p className="t-cuerpo mt-[var(--spacing-24)]">
            Agenda, <em>confirma</em> y <em>recuerda</em> cada cita. Tú solo apruebas lo importante.
          </p>
          <div className="mt-[var(--spacing-30)]">
            <BotonLink href="/precios">Ver planes</BotonLink>
          </div>
        </Tramo>
      </div>
    </Sitio>
  );
}
