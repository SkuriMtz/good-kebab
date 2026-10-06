import { Etiqueta } from "@/components/base/Etiqueta";
import { FormularioLista } from "@/components/FormularioLista";
import { CampoMensajes } from "@/components/escena3d/CampoMensajes";

/**
 * 1. Portada (Grupo 1 · propuesta G1-T2: "los mensajes sin contestar").
 *
 * Detrás, fijo, un campo de partículas dispersas y lejanas: los mensajes que
 * nadie ha contestado. Al bajar, se ordenan en renglones detrás del halo,
 * como una bandeja ya atendida, mientras el título y el formulario suben y
 * la siguiente sección tapa el fondo. Solo se mueve el contenido.
 *
 * Un solo protagonista: el título sobre el halo. La escena es atmósfera
 * (brillo bajo); con movimiento reducido o sin WebGL queda solo el halo.
 * El recorte (clip-path) hace que la capa fija solo se vea dentro de la portada.
 */
export function Portada() {
  return (
    <section aria-labelledby="portada-titulo" className="portada seccion--portada con-halo">
      <CampoMensajes />
      <div className="contenedor portada__contenido">
        <Etiqueta tono="cielo" className="portada__entra">
          Para clínicas, consultorios y estéticas
        </Etiqueta>
        <h1 id="portada-titulo" className="t-display portada__titulo portada__entra">
          Que ningún cliente se quede sin respuesta
        </h1>
        <p className="t-intro portada__intro portada__entra">
          Cuatro agentes de IA atienden tu WhatsApp y tus citas, ordenan tu correo, traen de regreso a tus clientes y hacen el trabajo
          de oficina. Lo importante no sale sin tu visto bueno.
        </p>
        <FormularioLista centrado className="portada__formulario portada__entra" />
        <Etiqueta tono="tenue" className="portada__condiciones portada__entra">
          Plan Free gratis, con Clara · Entras con tu correo, sin contraseña
        </Etiqueta>
      </div>
    </section>
  );
}
