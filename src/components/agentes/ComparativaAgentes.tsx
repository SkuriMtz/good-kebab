import { Icono } from "@/components/base/Iconos";
import { Personaje } from "./Personaje";
import { AGENTES_INFO } from "@/lib/agentes";
import { PLANES } from "@/lib/planes";

const cifra = new Intl.NumberFormat("es-MX");

/**
 * Tabla sobria de quién hace qué y en qué plan está cada agente: una fila
 * por agente (personaje, nombre y área), qué hace en una línea y una columna
 * por plan con palomita de contorno o raya. Abajo, los mensajes al mes de
 * cada plan. Todo sale de src/lib/agentes.ts y src/lib/planes.ts.
 * En celular se esconde la columna "Qué hace" (el área queda bajo el nombre).
 */
export function ComparativaAgentes({ enlaces = "ancla" }: { enlaces?: "ancla" | "pagina" }) {
  return (
    <div className="tabla-ag">
      <table>
        <caption className="sr-only">Qué hace cada agente y en qué plan de Atendel está</caption>
        <thead>
          <tr>
            <th scope="col">Agente</th>
            <th scope="col" className="tabla-ag__que">
              Qué hace
            </th>
            {PLANES.map((p) => (
              <th key={p.id} scope="col" className="tabla-ag__plan">
                <span className="tabla-ag__marca">Atendel</span>
                {p.nombre.replace("Atendel ", "")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {AGENTES_INFO.map((a) => (
            <tr key={a.id}>
              <th scope="row">
                <a href={enlaces === "ancla" ? `#${a.id}` : `/agentes/${a.id}`} className="tabla-ag__agente">
                  <span className="tabla-ag__personaje">
                    <Personaje agente={a.id} avatar />
                  </span>
                  <span className="tabla-ag__nombre">
                    <span>{a.nombre}</span>
                    <span className="tabla-ag__area">{a.area}</span>
                  </span>
                </a>
              </th>
              <td className="tabla-ag__que">{a.lema}</td>
              {PLANES.map((p) => {
                const incluido = p.agentes.includes(a.id);
                return (
                  <td key={p.id} className="tabla-ag__plan" data-incluido={incluido ? "true" : "false"}>
                    {incluido ? <Icono nombre="check-circulo" tam={20} /> : <span aria-hidden="true">—</span>}
                    <span className="sr-only">{incluido ? "Incluido" : "No incluido"}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="tabla-ag__pie">
              Mensajes al mes en el chat
            </th>
            <td className="tabla-ag__que" aria-hidden="true" />
            {PLANES.map((p) => (
              <td key={p.id} className="tabla-ag__plan cifras">
                {cifra.format(p.mensajesMes)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
