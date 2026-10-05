import type { Metadata } from "next";
import { Sitio } from "@/components/Sitio";

export const metadata: Metadata = { title: "Vista previa 3D", robots: { index: false, follow: false } };

/**
 * Vista previa de la escena 3D mientras se construye por fases.
 * Fase 1: solo la figura de la portada (el logo) y los tetraedros flotantes.
 * La página es alta para poder bajar y ver el parallax.
 */
export default function Vista3D() {
  return (
    <Sitio fondo="3d">
      <section className="contenedor flex min-h-[300svh] items-start pt-[var(--spacing-36)]">
        <p className="t-etiqueta">Fase 1 · Vista previa de la escena 3D</p>
      </section>
    </Sitio>
  );
}
