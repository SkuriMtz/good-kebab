import Link from "next/link";
import { Preguntas } from "@/components/Preguntas";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { PREGUNTAS } from "@/lib/contenido";

/** 9. Preguntas frecuentes (Grupo 5). Versión base: el acordeón con PREGUNTAS. */
export function PreguntasInicio() {
  return (
    <Seccion id="preguntas" etiquetadaPor="preguntas-titulo" ancho="angosto">
      <EncabezadoSeccion id="preguntas-titulo" etiqueta="Preguntas" titulo="Lo que más nos preguntan" />
      <Preguntas preguntas={PREGUNTAS} />
      <p className="mt-[var(--spacing-24)]">
        <Link href="/preguntas" className="enlace">
          Todas las preguntas y cómo cuidamos tus datos
        </Link>
      </p>
    </Seccion>
  );
}
