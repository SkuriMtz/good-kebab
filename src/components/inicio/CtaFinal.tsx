import { FormularioLista } from "@/components/FormularioLista";
import { Halo } from "@/components/base/Halo";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";

/**
 * 10. CTA final (Grupo 5). Versión base: repite el formulario de la portada
 * con otro título, sobre un halo suave. Su id "lista" es el destino de los
 * botones "Avísame cuando abra" de los planes.
 */
export function CtaFinal() {
  return (
    <Seccion id="lista" etiquetadaPor="lista-titulo" halo>
      <Halo y="55%" suave />
      <EncabezadoSeccion
        id="lista-titulo"
        etiqueta="Lista de espera"
        titulo="Tus clientes ya te escriben. Atendel te ayuda a contestarles."
        texto="Déjanos tu correo y te avisamos cuando abramos tu lugar. Mientras, puedes probar a los agentes."
      />
      <FormularioLista centrado />
    </Seccion>
  );
}
