import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { DETALLE } from "@/components/agentes/detalle";
import { PASOS } from "@/lib/contenido";

/** El mensaje que Lola deja listo en el ejemplo (detalle.ts), esperando tu visto bueno. */
const BORRADOR = DETALLE.lola.conversacion.find((m) => m.de === "agente")?.texto ?? "";

/**
 * 5. Cómo funciona (Grupo 4). Versión base: línea de tiempo vertical con los
 * tres pasos (números en Mono) y, en el último, una muestra del producto: un
 * mensaje que espera tu visto bueno.
 */
export function ComoFunciona() {
  return (
    <Seccion id="como-funciona" etiquetadaPor="como-funciona-titulo">
      <div className="columnas-asimetricas">
        <EncabezadoSeccion
          id="como-funciona-titulo"
          alineacion="izquierda"
          etiqueta="Cómo funciona"
          titulo="Un equipo que trabaja contigo"
          texto="Sin instalar nada y sin aprender un sistema nuevo."
          className="lg:sticky lg:top-[calc(var(--barra-h)+var(--spacing-48))] lg:!mb-0"
        />
        <ol className="relative flex flex-col gap-[var(--spacing-40)] border-l border-borde pl-[var(--spacing-32)]">
          {PASOS.map(([titulo, texto], i) => (
            <li key={titulo}>
              <Etiqueta tono="cielo">Paso {String(i + 1).padStart(2, "0")}</Etiqueta>
              <h3 className="t-titulo mt-[var(--spacing-8)]">{titulo}</h3>
              <p className="t-cuerpo mt-[var(--spacing-8)] max-w-[52ch]">{texto}</p>
              {i === PASOS.length - 1 ? (
                <div className="marco__panel mt-[var(--spacing-24)] max-w-[520px] p-[var(--spacing-16)]">
                  <p className="flex items-center gap-[var(--spacing-8)]">
                    <Icono nombre="reloj" tam={16} tono="cielo" />
                    <Etiqueta as="span">Lola · espera tu visto bueno</Etiqueta>
                  </p>
                  <p className="t-editorial mt-[var(--spacing-12)]">{BORRADOR}</p>
                  <p className="mt-[var(--spacing-16)] flex flex-wrap gap-[var(--spacing-8)]" aria-hidden="true">
                    <span className="pildora">Enviar</span>
                    <span className="pildora">Editar</span>
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </Seccion>
  );
}
