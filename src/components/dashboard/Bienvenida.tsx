import type { ReactNode } from "react";
import { Insignia } from "@/components/base/Insignia";
import type { Estadistica } from "./tipos";

/**
 * La tarjeta de bienvenida: el único momento protagonista del Resumen.
 * Fecha, saludo según la hora (calculado en el servidor con la hora de
 * México), lo que pasó hoy en una frase, las acciones (un solo botón
 * principal) y el día en tres cifras, separadas por filos de 1px.
 */
export function Bienvenida({
  fecha,
  saludo,
  texto,
  acciones,
  cifras,
  demo = false,
}: {
  fecha: string;
  saludo: string;
  texto: ReactNode;
  acciones: ReactNode;
  cifras: Estadistica[];
  demo?: boolean;
}) {
  return (
    <section className="dash-bienvenida" aria-labelledby="dash-saludo">
      <div className="dash-bienvenida__principal">
        <p className="dash-bienvenida__fecha">
          <time>{fecha}</time>
          {demo ? <Insignia className="dash-ejemplo-movil">Datos de ejemplo</Insignia> : null}
        </p>
        <h1 id="dash-saludo" className="dash-bienvenida__saludo">
          {saludo}
        </h1>
        <p className="dash-bienvenida__texto">{texto}</p>
        <div className="dash-bienvenida__acciones">{acciones}</div>
      </div>
      {cifras.length ? (
        <dl className="dash-cifras">
          {cifras.map((c) => (
            <div key={c.etiqueta} className="dash-cifras__item">
              <dt className="dash-cifras__etiqueta">{c.etiqueta}</dt>
              <dd className="dash-cifras__valor">{c.valor}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
