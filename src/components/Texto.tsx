import { Fragment, type ReactNode } from "react";

/** Con `suave`, cada palabra en su span (entra con un fundido la primera vez que aparece). */
function palabras(texto: string, suave: boolean): ReactNode {
  if (!suave) return texto;
  return texto.split(/(\s+)/).map((p, k) => (p && !/^\s+$/.test(p) ? <span key={k} className="t-palabra">{p}</span> : p));
}

/**
 * Enlaces [texto](/ruta) dentro de una línea: solo a rutas de Atendel (que
 * empiezan con "/", como /api/archivos/… o /panel?vista=pendientes). Un enlace
 * a otro sitio se queda como texto: así nadie mete enlaces raros en una respuesta.
 */
function conEnlaces(texto: string, suave: boolean): ReactNode[] {
  return texto.split(/(\[[^\]\n]{1,120}\]\(\/(?!\/)[^)\s]{0,300}\))/g).map((parte, i) => {
    const m = /^\[([^\]]+)\]\((\/[^)\s]*)\)$/.exec(parte);
    if (!m) return <Fragment key={i}>{enNegritas(parte, suave)}</Fragment>;
    const descarga = m[2].startsWith("/api/archivos/");
    return (
      <a key={i} href={m[2]} className={descarga ? "t-enlace t-enlace--archivo" : "t-enlace"} {...(descarga ? { download: true } : {})}>
        {enNegritas(m[1], suave)}
      </a>
    );
  });
}

function enLinea(texto: string, suave = false): ReactNode[] {
  return conEnlaces(texto, suave);
}

/** **negritas** dentro de una línea (sin HTML: todo se pinta como texto). */
function enNegritas(texto: string, suave = false): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**") && parte.length > 4 ? (
      <strong key={i} className="font-semibold text-tinta">
        {palabras(parte.slice(2, -2), suave)}
      </strong>
    ) : (
      <Fragment key={i}>{palabras(parte, suave)}</Fragment>
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
 * Con `suave` (mientras se escribe en vivo), las palabras nuevas entran con
 * un fundido; las llaves de cada bloque son estables para no repetirlo.
 */
export function Texto({ texto, suave = false }: { texto: string; suave?: boolean }) {
  const lineas = texto.split("\n");
  const bloques: ReactNode[] = [];
  let i = 0;
  while (i < lineas.length) {
    const linea = lineas[i];
    const limpia = linea.trim();
    const inicio = i;
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
        <div key={`t${inicio}`} className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-[0.9375rem]">
            {cabeza ? (
              <thead>
                <tr className="border-b border-[var(--c-filo-campo)]">
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
                <tr key={k} className="border-b border-[var(--c-velo-fuerte)]">
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
        <Lista key={`l${inicio}`} className={`flex flex-col gap-1.5 pl-5 ${numerada ? "list-decimal" : "list-[square]"}`}>
          {items.map((it, k) => (
            <li key={k} className="pl-1 marker:text-tenue">
              {enLinea(it, suave)}
            </li>
          ))}
        </Lista>,
      );
      continue;
    }
    // Título corto
    if (/^#{1,4}\s/.test(limpia)) {
      bloques.push(
        <p key={`h${inicio}`} className="font-semibold text-tinta">
          {enLinea(limpia.replace(/^#{1,4}\s/, ""), suave)}
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
      <p key={`p${inicio}`}>
        {parrafo.map((l, k) => (
          <Fragment key={k}>
            {k > 0 ? <br /> : null}
            {enLinea(l, suave)}
          </Fragment>
        ))}
      </p>,
    );
  }
  return <div className="flex flex-col gap-3.5">{bloques}</div>;
}
