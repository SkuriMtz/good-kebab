import Link from "next/link";
import { FormularioLista } from "@/components/FormularioLista";
import { Revela } from "@/components/escena/Revela";
import { AGENTES_INFO } from "@/lib/agentes";
import { PRUEBALO } from "@/lib/contenido";
import { PLANES } from "@/lib/planes";

// La línea en Mono de lo que cuesta empezar: sale de los datos reales del plan Free
const FREE = PLANES.find((p) => p.id === "free")!;
const CONDICIONES = [FREE.nombre, FREE.precio ?? "", `${FREE.mensajesMes} mensajes al mes`, "Entras con tu correo"].filter(Boolean);

/**
 * 1. Portada · muestra M3, "Tres zonas" (como la composición del hero de Vercel).
 * - Izquierda: el titular enorme, que sube línea por línea (como la v7).
 * - Centro: un hueco a propósito. Ahí se acomoda la figura de triangulitos
 *   del fondo (data-escena="tresZonas"): una burbuja de chat que, al bajar,
 *   se deshace y se vuelve el globo de la sección de agentes.
 * - Derecha: la pila de etiquetas en Mono con los 4 agentes y lo que hace
 *   cada uno (en claro, un panel de "registro" con palomitas verdes).
 * Debajo: el formulario de la lista con el único botón azul de la pantalla.
 * Oscuro = negro puro y texto que flota; claro = #fafafa, líneas finas.
 */
export function Portada() {
  return (
    <section aria-labelledby="portada-titulo" className="m3 m3-portada" data-escena="tresZonas">
      <div className="m3-contenedor">
        <div className="m3-zonas">
          <Revela className="m3-zona m3-zona--titulo">
            <p className="m3-etiqueta">Para clínicas, consultorios y estéticas</p>
            <h1 id="portada-titulo" className="m3-titular">
              Que ningún cliente se quede sin respuesta
            </h1>
          </Revela>

          <div className="m3-zona m3-zona--figura" aria-hidden="true" />

          <Revela className="m3-zona m3-zona--registro">
            <p className="m3-registro__cabeza">
              <span>Tu equipo</span>
              <span>4 agentes</span>
            </p>
            <ul className="m3-registro__lista">
              {AGENTES_INFO.map((a) => (
                <li key={a.id} className="m3-registro__fila">
                  <span className="m3-registro__check" aria-hidden="true">
                    ✓
                  </span>
                  <span className="m3-registro__nombre">{a.nombre}</span>
                  <span className="m3-registro__que">{a.abarca}</span>
                </li>
              ))}
            </ul>
            <p className="m3-registro__pie">Lo importante no sale sin tu visto bueno.</p>
          </Revela>
        </div>

        <div className="m3-portada__accion">
          <FormularioLista conSecundario={false} className="m3-portada__formulario" />
          <p className="m3-portada__condiciones m3-etiqueta">
            {CONDICIONES.map((c, i) => (
              <span key={c}>
                {i > 0 ? <span aria-hidden="true"> · </span> : null}
                {c}
              </span>
            ))}
          </p>
          <Link href={PRUEBALO.href} className="m3-enlace">
            O prueba los agentes con datos de ejemplo <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
