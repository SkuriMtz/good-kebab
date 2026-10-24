import Link from "next/link";
import { GrupoPreguntas, NoEstaTuPregunta, TEMAS_INICIO } from "@/components/Preguntas";
import { Icono } from "@/components/base/Iconos";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { IndiceTemas } from "@/app/preguntas/IndiceTemas";

/**
 * 9. Preguntas frecuentes (Grupo 5). Dos columnas, como la documentación de
 * GitHub: a la izquierda el título y los temas (fijos al bajar en
 * computadora, con el tema que lees marcado); a la derecha las PREGUNTAS
 * agrupadas por tema, en acordeón. La primera empieza abierta.
 */
export function PreguntasInicio() {
  return (
    <Seccion id="preguntas" etiquetadaPor="preguntas-titulo" fondo="fondo-2">
      <div className="faq-doble">
        <div className="faq-doble__lado">
          <EncabezadoSeccion
            id="preguntas-titulo"
            alineacion="izquierda"
            etiqueta="Posibles preguntas"
            titulo="Lo que quizá te preguntes"
            className="faq-doble__encabezado"
          />
          <IndiceTemas
            etiqueta="Temas de las preguntas"
            entradas={TEMAS_INICIO.map((t) => ({ id: t.id, nombre: t.nombre, cuenta: t.preguntas.length }))}
          />
          <div className="faq-doble__pie">
            <Link href="/preguntas" className="enlace-flecha">
              Todas las preguntas
              <Icono nombre="chevron-derecha" tam={16} />
            </Link>
            <NoEstaTuPregunta />
          </div>
        </div>
        <div className="faq-doble__preguntas">
          {TEMAS_INICIO.map((t, i) => (
            <GrupoPreguntas key={t.id} tema={t} abiertaInicial={i === 0 ? 0 : null} />
          ))}
        </div>
      </div>
    </Seccion>
  );
}
