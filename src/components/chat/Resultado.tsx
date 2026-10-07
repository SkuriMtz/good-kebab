"use client";

import { Boton } from "@/components/base/Boton";
import { Giro, Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { Caras } from "./Piezas";
import { TEXTO_ESTADO, type Resultado as TipoResultado } from "./guion";

/**
 * Panel "Resultado": junto a la conversación, lo que el agente dejó hecho
 * (la cita en tu agenda, la bandeja resumida, el mensaje que espera tu visto
 * bueno, el reporte). Tres estados: vacío (todavía no termina nada), trabajando
 * (el agente está escribiendo) y listo. Cuando cambia, el contenido nuevo entra
 * con un fundido corto (solo transform y opacity).
 */
export function Resultado({
  resultado,
  agente,
  trabajando = false,
  ladoTu,
  onAprobar,
  onRepetir,
  className = "",
  id,
}: {
  resultado: TipoResultado | null;
  /** De quién se espera el resultado (para el estado vacío y "trabajando"). */
  agente: IdAgente;
  trabajando?: boolean;
  /** Sello del panel ("Tu agenda", "Así lo ves tú"). */
  ladoTu?: string;
  /** Si el resultado espera visto bueno: qué pasa al darlo. */
  onAprobar?: () => void;
  onRepetir?: () => void;
  className?: string;
  id?: string;
}) {
  const quien = AGENTE_POR_ID[trabajando ? agente : (resultado?.agente ?? agente)];
  const estado = trabajando ? "trabajando" : (resultado?.estado ?? "vacio");

  return (
    <section className={`resultado ${className}`} aria-labelledby={id ? `${id}-titulo` : undefined} id={id}>
      <header className="resultado__cabeza">
        <h3 id={id ? `${id}-titulo` : undefined} className="etiqueta">
          {ladoTu ?? "Resultado"}
        </h3>
        <p className="resultado__estado" data-estado={estado} aria-live="polite">
          {estado === "trabajando" ? (
            <>
              <Giro className="resultado__giro" />
              {quien.nombre} trabajando
            </>
          ) : estado === "vacio" ? (
            "Sin resultados"
          ) : (
            <>
              <Icono nombre={estado === "listo" ? "check-circulo" : "reloj"} tam={16} />
              {TEXTO_ESTADO[estado]}
            </>
          )}
        </p>
      </header>

      <div className="resultado__cuerpo">
        {resultado ? (
          <Tarjeta key={`${resultado.sello}-${resultado.titulo}-${resultado.cita?.hora ?? ""}`} r={resultado} atenuada={trabajando} />
        ) : (
          <Vacio agente={agente} trabajando={trabajando} />
        )}
      </div>

      {(resultado?.estado === "aprobar" && onAprobar && !trabajando) || onRepetir ? (
        <footer className="resultado__pie">
          {resultado?.estado === "aprobar" && onAprobar && !trabajando ? (
            <Boton variante="sutil" tam="chico" icono={<Icono nombre="check" tam={16} />} onClick={onAprobar}>
              Dar visto bueno
            </Boton>
          ) : null}
          {onRepetir ? (
            <Boton variante="fantasma" tam="chico" className="boton--solo-texto" onClick={onRepetir} disabled={trabajando}>
              Ver de nuevo
            </Boton>
          ) : null}
        </footer>
      ) : null}
    </section>
  );
}

function Vacio({ agente, trabajando }: { agente: IdAgente; trabajando: boolean }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <div className="resultado__vacio" data-trabajando={trabajando ? "" : undefined}>
      <Caras agentes={[agente]} tam="normal" />
      <p className="resultado__vacio-titulo">
        {trabajando ? `${info.nombre} está en eso` : `Aquí aparece lo que ${info.nombre} deja hecho`}
      </p>
      <p className="resultado__vacio-texto">La cita en tu agenda, el correo resumido o el reporte, en cuanto termina.</p>
      <span className="resultado__renglon" aria-hidden="true" />
      <span className="resultado__renglon resultado__renglon--corto" aria-hidden="true" />
    </div>
  );
}

function Tarjeta({ r, atenuada }: { r: TipoResultado; atenuada: boolean }) {
  const info = AGENTE_POR_ID[r.agente];
  return (
    <div className="resultado__tarjeta" data-atenuada={atenuada ? "" : undefined}>
      <p className="etiqueta etiqueta--tenue">{r.sello}</p>

      {r.cita ? (
        <div className="resultado__cita">
          <p className="resultado__fecha">
            <span className="resultado__fecha-dia">{r.cita.dia}</span>
            <span className="resultado__fecha-hora">{r.cita.hora}</span>
          </p>
          <div className="min-w-0">
            <p className="resultado__titulo">{r.titulo}</p>
            {r.sub ? <p className="resultado__sub">{r.sub}</p> : null}
          </div>
        </div>
      ) : (
        <div>
          <p className="resultado__titulo">{r.titulo}</p>
          {r.sub ? <p className="resultado__sub">{r.sub}</p> : null}
        </div>
      )}

      {r.lista ? (
        <ul className="resultado__lista">
          {r.lista.map((x) => (
            <li key={`${x.marca}-${x.texto}`} data-fuerte={x.fuerte ? "" : undefined}>
              <span className="resultado__marca">{x.marca}</span>
              <span>{x.texto}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {r.tabla ? (
        <table className="resultado__tabla">
          <thead>
            <tr>
              {r.tabla.columnas.map((c, i) => (
                <th key={`${c}-${i}`} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.tabla.filas.map((f) => (
              <tr key={f[0]}>
                {f.map((c, i) =>
                  i === 0 ? (
                    <th key={i} scope="row">
                      {c}
                    </th>
                  ) : (
                    <td key={i}>{c}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
          {r.tabla.pie ? (
            <tfoot>
              <tr>
                <th scope="row">{r.tabla.pie[0]}</th>
                <td colSpan={r.tabla.columnas.length - 1}>{r.tabla.pie[1]}</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      ) : null}

      {r.borrador ? (
        <figure className="resultado__borrador">
          <figcaption className="etiqueta etiqueta--tenue">Mensaje por enviar</figcaption>
          <blockquote>{r.borrador}</blockquote>
        </figure>
      ) : null}

      {r.archivo ? (
        <p className="resultado__archivo">
          <Icono nombre="documento" tam={20} tono="cielo" />
          <span className="min-w-0">
            <span className="resultado__archivo-nombre">{r.archivo.nombre}</span>
            <span className="resultado__archivo-tipo">{r.archivo.tipo}</span>
          </span>
        </p>
      ) : null}

      {r.filas ? (
        <ul className="resultado__filas">
          {r.filas.map((f) => (
            <li key={f.texto}>
              <Icono nombre={f.icono} tam={16} tono="cuerpo" />
              <span>{f.texto}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="resultado__firma">
        <Caras agentes={[r.agente]} tam="chica" />
        <span>
          Lo hizo <strong>{info.nombre}</strong> · {info.area}
        </span>
      </p>
    </div>
  );
}
