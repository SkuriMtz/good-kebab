import { Fragment, type ReactNode } from "react";

/** **negritas** dentro de una línea (sin HTML: todo se pinta como texto). */
function enLinea(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**") && parte.length > 4 ? (
      <strong key={i} className="font-semibold text-tinta">
        {parte.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{parte}</Fragment>
    ),
  );
}

const celdas = (linea: string) =>
  linea
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

/**
 * Pinta la respuesta de un agente: párrafos, listas, títulos cortos,
 * negritas y tablas (para lo que va a Excel). Nunca interpreta HTML.
 */
export function Texto({ texto }: { texto: string }) {
  const lineas = texto.split("\n");
  const bloques: ReactNode[] = [];
  let i = 0;
  while (i < lineas.length) {
    const linea = lineas[i];
    const limpia = linea.trim();
    if (!limpia) {
      i++;
      continue;
    }
    // Tabla
    if (limpia.startsWith("|")) {
      const filas: string[][] = [];
      while (i < lineas.length && lineas[i].trim().startsWith("|")) {
        if (!/^\|?[\s:|-]+\|?$/.test(lineas[i].trim())) filas.push(celdas(lineas[i]));
        i++;
      }
      const [cabeza, ...resto] = filas;
      bloques.push(
        <div key={`t${i}`} className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-[0.9375rem]">
            {cabeza ? (
              <thead>
                <tr className="border-b border-[var(--linea-fuerte)]">
                  {cabeza.map((c, j) => (
                    <th key={j} className="py-2 pr-4 text-[0.8125rem] font-semibold text-tenue">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {resto.map((f, k) => (
                <tr key={k} className="border-b border-[var(--linea)]">
                  {f.map((c, j) => (
                    <td key={j} className="py-2 pr-4 align-top">
                      {enLinea(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    // Lista
    const esViñeta = /^([-*•]|\d+[.)])\s+/;
    if (esViñeta.test(limpia)) {
      const items: string[] = [];
      const numerada = /^\d/.test(limpia);
      while (i < lineas.length && esViñeta.test(lineas[i].trim())) {
        items.push(lineas[i].trim().replace(esViñeta, ""));
        i++;
      }
      const Lista = numerada ? "ol" : "ul";
      bloques.push(
        <Lista key={`l${i}`} className={`flex flex-col gap-1.5 pl-5 ${numerada ? "list-decimal" : "list-[square]"}`}>
          {items.map((it, k) => (
            <li key={k} className="pl-1 marker:text-tenue">
              {enLinea(it)}
            </li>
          ))}
        </Lista>,
      );
      continue;
    }
    // Título corto
    if (/^#{1,4}\s/.test(limpia)) {
      bloques.push(
        <p key={`h${i}`} className="font-semibold text-tinta">
          {enLinea(limpia.replace(/^#{1,4}\s/, ""))}
        </p>,
      );
      i++;
      continue;
    }
    // Párrafo (líneas seguidas)
    const parrafo: string[] = [];
    while (
      i < lineas.length &&
      lineas[i].trim() &&
      !lineas[i].trim().startsWith("|") &&
      !esViñeta.test(lineas[i].trim()) &&
      !/^#{1,4}\s/.test(lineas[i].trim())
    ) {
      parrafo.push(lineas[i]);
      i++;
    }
    bloques.push(
      <p key={`p${i}`}>
        {parrafo.map((l, k) => (
          <Fragment key={k}>
            {k > 0 ? <br /> : null}
            {enLinea(l)}
          </Fragment>
        ))}
      </p>,
    );
  }
  return <div className="flex flex-col gap-3.5">{bloques}</div>;
}
