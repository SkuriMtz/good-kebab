import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { FormularioLista } from "@/components/FormularioLista";
import { Escena3D } from "@/components/escena3d/Escena3D";

/**
 * 1. Portada (Grupo 1). Versión base: fondo #000, la escena 3D de partículas
 * como atmósfera fija detrás (brillo bajo; en modo claro solo el halo), el
 * halo morado detrás del título, título display, intro de 18px, el
 * formulario en línea y la línea en Mono con lo que cuesta empezar.
 * El recorte (clip-path) hace que la escena fija solo se vea dentro de la portada.
 */
export function Portada() {
  return (
    <section
      aria-labelledby="portada-titulo"
      className="seccion--portada con-halo relative flex min-h-[calc(100svh-var(--barra-h))] items-center [clip-path:inset(0)]"
    >
      <Escena3D tenue />
      <Halo y="40%" ancho="min(1040px, 150vw)" className="z-0" />
      <div className="contenedor relative z-[1] flex flex-col items-center py-[var(--spacing-96)] text-center">
        <Etiqueta tono="cielo">Para clínicas, consultorios y estéticas</Etiqueta>
        <h1 id="portada-titulo" className="t-display mt-[var(--spacing-24)] max-w-[15ch]">
          Que ningún cliente se quede sin respuesta
        </h1>
        <p className="t-intro mt-[var(--spacing-24)]">
          Cuatro agentes de IA atienden tu WhatsApp y tus citas, ordenan tu correo, traen de regreso a tus clientes y hacen el trabajo
          de oficina. Lo importante no sale sin tu visto bueno.
        </p>
        <FormularioLista centrado className="mt-[var(--spacing-40)]" />
        <Etiqueta tono="tenue" className="mt-[var(--spacing-24)]">
          Plan Free · Gratis · Entras con tu correo, sin contraseña
        </Etiqueta>
      </div>
    </section>
  );
}
