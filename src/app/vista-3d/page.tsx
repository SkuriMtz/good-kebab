import type { Metadata } from "next";
import { Sitio } from "@/components/Sitio";

export const metadata: Metadata = { title: "Vista previa 3D", robots: { index: false, follow: false } };

/** Un bloque de texto provisional (el definitivo va en la fase 3). */
function Provisional({ lado, alto, children }: { lado: "izquierda" | "derecha" | "centro" | "ninguno"; alto: number; children?: React.ReactNode }) {
  const pos = lado === "derecha" ? "lg:ml-auto lg:mr-[6%]" : lado === "izquierda" ? "lg:ml-[6%]" : "mx-auto text-center";
  return (
    <div className="contenedor flex items-center" style={{ minHeight: `${alto}vh` }}>
      {lado === "ninguno" ? null : <div className={`max-w-[420px] ${pos}`}>{children}</div>}
    </div>
  );
}

/**
 * Vista previa de la escena 3D mientras se construye por fases.
 * Fase 2: la historia completa de figuras ligada al scroll, con texto provisional.
 * [data-historia] marca el tramo de la página que maneja la escena.
 */
export default function Vista3D() {
  return (
    <Sitio fondo="3d">
      <div data-historia="">
        <Provisional lado="izquierda" alto={100}>
          <p className="t-etiqueta">Fase 2 · texto provisional</p>
          <h1 className="t-display mt-[var(--spacing-18)]">Portada</h1>
          <p className="t-cuerpo mt-[var(--spacing-18)]">El logo a la derecha, girando lento. Baja para empezar.</p>
        </Provisional>
        <Provisional lado="ninguno" alto={60} />
        <Provisional lado="derecha" alto={120}>
          <h2 className="t-seccion">Qué es Atendel</h2>
          <p className="t-cuerpo mt-[var(--spacing-18)]">La cámara se acerca; la figura se va a la izquierda y se deshace por abajo.</p>
        </Provisional>
        <Provisional lado="ninguno" alto={80} />
        <Provisional lado="centro" alto={90}>
          <p className="t-sub">Mensajes sin contestar.</p>
          <p className="t-cuerpo mt-[var(--spacing-12)]">El problema: partículas en desorden por toda la pantalla.</p>
        </Provisional>
        <Provisional lado="centro" alto={90}>
          <p className="t-sub">Citas perdidas. Correos acumulados.</p>
        </Provisional>
        <Provisional lado="ninguno" alto={120} />
        <Provisional lado="derecha" alto={130}>
          <h2 className="t-seccion">La solución</h2>
          <p className="t-cuerpo mt-[var(--spacing-18)]">La burbuja de chat, inclinada, a la izquierda.</p>
        </Provisional>
        <Provisional lado="izquierda" alto={130}>
          <h2 className="t-seccion">Tu agenda, en orden</h2>
          <p className="t-cuerpo mt-[var(--spacing-18)]">El calendario a la derecha.</p>
        </Provisional>
      </div>
    </Sitio>
  );
}
