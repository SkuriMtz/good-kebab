"use client";

import { useEffect, useState } from "react";
import { BotonAccion, DatosDeEjemplo } from "./piezas";
import type { Bienvenida as DatosBienvenida } from "./tipos";

/** "Buenos días" / "Buenas tardes" / "Buenas noches" según la hora de quien mira. */
function saludoPorHora(h: number) {
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

/**
 * La tarjeta grande de arriba: el día, el saludo, lo que pasó y las acciones.
 * A la derecha, tres cifras del día. El saludo se calcula con la hora del
 * navegador (aparece con un fundido corto al cargar, sin brincar).
 */
export function Bienvenida({ datos, ejemplo, pendientesVivos }: { datos: DatosBienvenida; ejemplo: boolean; pendientesVivos?: number }) {
  const [saludo, setSaludo] = useState<string | null>(null);
  useEffect(() => setSaludo(saludoPorHora(new Date().getHours())), []);

  const [principal, ...otras] = datos.acciones;
  return (
    <section className="tb-caja tb-bienvenida" aria-labelledby="bienvenida-titulo">
      <div className="tb-bienvenida__rejilla">
      <div className="tb-bienvenida__texto">
        <p className="tb-bienvenida__fecha">
          <span>{datos.fecha}</span>
          {ejemplo ? <DatosDeEjemplo /> : null}
        </p>
        <h1 id="bienvenida-titulo" className="t-app-saludo tb-bienvenida__saludo" data-listo={saludo ? "true" : undefined}>
          {saludo ?? "Hola"}
          {datos.nombre ? `, ${datos.nombre}` : ""}
        </h1>
        <p className="tb-bienvenida__resumen">{datos.resumen}</p>
        <div className="tb-bienvenida__acciones">
          {principal ? <BotonAccion accion={principal} variante="principal" /> : null}
          {otras.map((a) => (
            <BotonAccion key={a.etiqueta} accion={a} variante="sutil" />
          ))}
        </div>
      </div>
      {datos.hoy.length ? (
        <dl className="tb-bienvenida__hoy" aria-label="Hoy">
          {datos.hoy.map((h, i) => {
            // La cifra de pendientes baja en vivo cuando apruebas algo
            const valor = i === datos.hoy.length - 1 && pendientesVivos !== undefined ? String(pendientesVivos) : h.valor;
            return (
              <div key={h.etiqueta} className="tb-bienvenida__cifra">
                <dt className="tb-bienvenida__etiqueta">{h.etiqueta}</dt>
                <dd className="tb-bienvenida__valor">{valor}</dd>
              </div>
            );
          })}
        </dl>
      ) : null}
      </div>
    </section>
  );
}
