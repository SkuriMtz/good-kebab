import type { Entrega as Datos, Fila } from "./datos";

/** Etiqueta pequeña del papel (tipo crédito). */
function Rotulo({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-cond text-[0.9375rem] uppercase leading-none tracking-[0.04em] text-papel-gris ${className}`}>
      {children}
    </p>
  );
}

function Palomita({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-3 w-3 shrink-0 ${className}`} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6.4 4.8 9 10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

/** Lo que va en la columna derecha si es corto; si es largo (o una cita), va abajo. */
const vaAbajo = (c?: string) => !!c && (c.startsWith("“") || c.length > 22);

function Filas({ filas, marcas }: { filas: Fila[]; marcas?: boolean }) {
  return (
    <ul className="border-t border-papel-linea">
      {filas.map((f) => (
        <li key={f.a + (f.b ?? "")} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-papel-linea py-2.5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium">
              {f.alerta ? <span className="h-1.5 w-1.5 shrink-0 bg-papel-rojo" aria-hidden="true" /> : null}
              {f.a}
            </p>
            {f.b ? <p className="mt-0.5 text-papel-gris">{f.b}</p> : null}
            {f.nivel !== undefined ? (
              <span className="mt-2 block h-[3px] w-full max-w-[220px] bg-papel-linea" aria-hidden="true">
                <span
                  className={`block h-full ${f.alerta ? "bg-papel-rojo" : "bg-papel-tinta"}`}
                  style={{ width: `${Math.round(f.nivel * 100)}%` }}
                />
              </span>
            ) : null}
            {vaAbajo(f.c) ? (
              f.c!.startsWith("“") ? (
                <p className="mt-1.5 border-l border-papel-tinta pl-3 italic">{f.c}</p>
              ) : (
                <p className={`mt-1.5 font-medium ${f.alerta ? "text-papel-rojo" : ""}`}>→ {f.c}</p>
              )
            ) : null}
          </div>
          {marcas && f.etiqueta ? (
            <span
              className={`self-start whitespace-nowrap border px-2 py-1 font-cond text-[0.875rem] uppercase leading-none tracking-[0.04em] ${
                f.alerta ? "border-papel-rojo text-papel-rojo" : "border-papel-linea text-papel-tinta"
              }`}
            >
              {f.etiqueta}
            </span>
          ) : f.c && !vaAbajo(f.c) ? (
            <span className={`self-start whitespace-nowrap text-right font-medium ${f.alerta ? "text-papel-rojo" : ""}`}>
              {f.c}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * Lo que entrega cada agente, "impreso" en papel claro.
 * Cada tipo de tarea tiene su propia forma: chat, tabla, agenda…
 */
export function Entrega({ datos }: { datos: Datos }) {
  switch (datos.tipo) {
    case "chat":
      return (
        <div>
          <Rotulo>{datos.titulo}</Rotulo>
          <ol className="mt-3 flex flex-col gap-2">
            {datos.mensajes.map((m, i) =>
              m.de === "nota" ? (
                <li key={i} className="mt-1 flex items-start gap-2 border-t border-papel-linea pt-2.5 font-medium">
                  <Palomita className="mt-1 text-papel-rojo" />
                  {m.texto}
                </li>
              ) : (
                <li
                  key={i}
                  className={`max-w-[86%] px-3 py-2 ${
                    m.de === "cliente"
                      ? "self-start border border-papel-linea bg-white"
                      : "self-end bg-papel-tinta text-papel"
                  }`}
                >
                  {m.quien ? <span className="mb-0.5 block text-[0.8125rem] font-medium text-papel-gris">@{m.quien}</span> : null}
                  {m.texto}
                  {m.hora ? (
                    <span className={`ml-2 text-[0.75rem] tabular-nums ${m.de === "cliente" ? "text-papel-gris" : "text-white/60"}`}>
                      {m.hora}
                    </span>
                  ) : null}
                </li>
              ),
            )}
          </ol>
        </div>
      );

    case "filas":
      return (
        <div>
          <Rotulo>{datos.titulo}</Rotulo>
          <div className="mt-3">
            <Filas filas={datos.filas} marcas={datos.marcas} />
          </div>
          {datos.pie ? <p className="mt-3 text-papel-gris">{datos.pie}</p> : null}
        </div>
      );

    case "tabla":
      return (
        <div>
          <Rotulo>{datos.titulo}</Rotulo>
          <table className="mt-3 w-full border-collapse text-left tabular-nums">
            <thead>
              <tr className="border-b border-papel-tinta">
                {datos.columnas.map((c) => (
                  <th key={c} scope="col" className="pb-1.5 font-cond text-[0.875rem] font-normal uppercase tracking-[0.04em] text-papel-gris">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.filas.map((f, i) => (
                <tr
                  key={f[0]}
                  className={`border-b border-papel-linea ${i === datos.destacar ? "bg-white font-medium" : ""}`}
                >
                  {f.map((celda, j) => (
                    <td key={j} className={`py-2 ${j === 0 ? "pl-0" : ""} ${i === datos.destacar && j === 0 ? "text-papel-rojo" : ""}`}>
                      {i === datos.destacar && j === 0 ? `→ ${celda}` : celda}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3">{datos.pie}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {datos.archivos.map((a) => (
              <li key={a} className="inline-flex items-center gap-2 border border-papel-linea bg-white px-2.5 py-1.5 text-[0.8125rem]">
                <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 1.5h5.5L11 4v8.5H3z M8.5 1.5V4H11" stroke="currentColor" strokeWidth="1" />
                </svg>
                {a}
              </li>
            ))}
          </ul>
        </div>
      );

    case "barras": {
      const max = Math.max(...datos.barras.map((b) => b.valor));
      return (
        <div>
          <Rotulo>{datos.titulo}</Rotulo>
          <ul className="mt-3 flex flex-col gap-2">
            {datos.barras.map((b) => (
              <li key={b.a} className="grid grid-cols-[112px_minmax(0,1fr)_68px] items-center gap-3 sm:grid-cols-[130px_minmax(0,1fr)_76px]">
                <span className="truncate">{b.a}</span>
                <span className="block h-3 bg-papel-linea" aria-hidden="true">
                  <span
                    className={`barra block h-full ${b.alerta ? "bg-papel-rojo" : "bg-papel-tinta"}`}
                    style={{ width: `${(b.valor / max) * 100}%` }}
                  />
                </span>
                <span className="text-right tabular-nums">{b.texto}</span>
              </li>
            ))}
          </ul>
          <ol className="mt-4 border-t border-papel-linea">
            {datos.notas.map((n, i) => (
              <li key={n} className="flex gap-3 border-b border-papel-linea py-2">
                <span className="font-cond text-[0.9375rem] leading-[1.35] text-papel-gris">{i + 1}</span>
                {n}
              </li>
            ))}
          </ol>
        </div>
      );
    }

    case "agenda":
      return (
        <div>
          <Rotulo>{datos.titulo}</Rotulo>
          <ol className="mt-3 border-t border-papel-linea">
            {datos.citas.map((c) => (
              <li key={c.quien} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-papel-linea py-2.5">
                <span className="font-cond text-[1.25rem] leading-none tabular-nums">{c.hora}</span>
                <span className="min-w-0">
                  <span className="font-medium">{c.quien}</span>
                  <span className="text-papel-gris"> · {c.que}</span>
                </span>
                {c.antes ? (
                  <span className="whitespace-nowrap text-[0.8125rem] text-papel-rojo">
                    antes <s className="tabular-nums">{c.antes}</s>
                  </span>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ol>
          <p className="mt-3 flex items-center gap-2 text-papel-gris">
            <Palomita className="text-papel-tinta" />
            {datos.pie}
          </p>
        </div>
      );

    case "cifras":
      return (
        <div>
          <Rotulo>{datos.titulo}</Rotulo>
          <dl
            className={`mt-3 grid gap-px border border-papel-linea bg-papel-linea ${
              datos.cifras.length === 4 ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            {datos.cifras.map((c) => (
              <div key={c.a} className="bg-papel px-3 py-2.5">
                <dt className="text-[0.8125rem] text-papel-gris">{c.a}</dt>
                <dd className="mt-1 font-serif text-[clamp(1.375rem,2.4vw,1.875rem)] italic leading-none tabular-nums">
                  {c.valor}
                </dd>
                {c.nota ? <dd className="mt-1 text-[0.8125rem] text-papel-gris">{c.nota}</dd> : null}
              </div>
            ))}
          </dl>
          {datos.filas ? (
            <div className="mt-4">
              <p className="mb-2 font-medium text-papel-rojo">{datos.subtitulo}</p>
              <Filas filas={datos.filas} />
            </div>
          ) : null}
          <p className="mt-3">{datos.pie}</p>
        </div>
      );

    case "ficha":
      return (
        <div>
          <Rotulo>Cliente</Rotulo>
          <p className="mt-2 font-serif text-[1.75rem] italic leading-none">{datos.nombre}</p>
          <p className="mt-1.5 text-papel-gris">{datos.detalle}</p>
          <dl className="mt-3 border-t border-papel-linea">
            {datos.campos.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 border-b border-papel-linea py-2">
                <dt className="text-papel-gris">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 border-l-2 border-papel-rojo pl-3 font-medium">{datos.sugerencia}</p>
          <p className="mt-3 text-[0.8125rem] text-papel-gris">También sin volver: {datos.otros.join(" · ")}</p>
        </div>
      );

    case "documento":
      return (
        <div>
          <div className="mx-auto max-w-[400px] border border-papel-linea bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.04),0_14px_30px_-18px_rgba(0,0,0,0.35)]">
            <p className="text-center font-serif text-[1.375rem] italic leading-tight">{datos.titulo}</p>
            <p className="mt-1 text-center text-[0.8125rem] uppercase tracking-[0.08em] text-papel-gris">{datos.subtitulo}</p>
            <dl className="mt-4 text-[0.8125rem]">
              {datos.campos.map(([k, v]) => (
                <div key={k} className="flex gap-2 border-b border-dotted border-papel-linea py-1.5">
                  <dt className="w-[76px] shrink-0 text-papel-gris">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-papel-gris">{datos.texto}</p>
            <div className="mt-6 flex items-end justify-between gap-4">
              <span className="block h-px flex-1 bg-papel-tinta" />
              <span className="text-[0.75rem] text-papel-gris">Firma de la paciente</span>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-2">
            <Palomita className="text-papel-rojo" />
            {datos.extra}
          </p>
        </div>
      );

    case "propuesta":
      return (
        <div>
          <Rotulo>Propuesta</Rotulo>
          <p className="mt-2 font-serif text-[1.875rem] italic leading-none">“{datos.titulo}”</p>
          <dl className="mt-4 border-t border-papel-linea">
            {datos.campos.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 border-b border-papel-linea py-2">
                <dt className="text-papel-gris">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="bg-papel-tinta px-4 py-2 text-[0.8125rem] font-medium uppercase tracking-[0.05em] text-papel">
              {datos.acciones[0]}
            </span>
            <span className="border border-papel-tinta px-4 py-2 text-[0.8125rem] font-medium uppercase tracking-[0.05em]">
              {datos.acciones[1]}
            </span>
            <span className="text-[0.8125rem] text-papel-gris">{datos.nota}</span>
          </div>
        </div>
      );

    case "encuesta": {
      const max = Math.max(...datos.reparto.map(([, n]) => n), 1);
      return (
        <div>
          <Rotulo>Encuesta de la semana</Rotulo>
          <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-5">
            <p>
              <span className="block font-serif text-[3.5rem] italic leading-[0.8]">{datos.calificacion}</span>
              <span className="mt-2 block text-[0.8125rem] text-papel-gris">de 5 · {datos.respuestas} respuestas</span>
            </p>
            <ul className="flex flex-col gap-1">
              {datos.reparto.map(([estrellas, n]) => (
                <li key={estrellas} className="grid grid-cols-[14px_minmax(0,1fr)_22px] items-center gap-2 text-[0.8125rem] tabular-nums">
                  <span className="text-papel-gris">{estrellas}</span>
                  <span className="block h-2 bg-papel-linea" aria-hidden="true">
                    <span className="barra block h-full bg-papel-tinta" style={{ width: `${(n / max) * 100}%` }} />
                  </span>
                  <span className="text-right">{n}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 border-y border-papel-linea py-2.5">
            <p className="flex items-center gap-2 font-medium">
              <span className="h-1.5 w-1.5 shrink-0 bg-papel-rojo" aria-hidden="true" />
              Queja · {datos.alerta.quien}
            </p>
            <p className="mt-0.5 text-papel-gris">{datos.alerta.texto}</p>
          </div>
          <p className="mt-3 flex items-center gap-2">
            <Palomita />
            {datos.pie}
          </p>
        </div>
      );
    }
  }
}
