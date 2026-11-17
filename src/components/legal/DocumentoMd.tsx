import { Fragment, type ReactNode } from "react";

/**
 * Pinta un documento legal escrito en Markdown sencillo (el Aviso de
 * Privacidad del dueño), con diseño de documento: limpio, una columna de
 * lectura y un índice de las secciones. Entiende solo lo que usa el texto:
 * # título, ## subtítulo, ### secciones, párrafos que son todo **negritas**
 * (subtítulos), listas con - y con 1., tablas con |, --- y *cursivas*.
 * Todo se pinta como texto (nada de HTML crudo); los correos se vuelven enlaces.
 */

type Bloque =
  | { tipo: "h1"; texto: string }
  | { tipo: "sub"; texto: string }
  | { tipo: "h2"; texto: string; id: string }
  | { tipo: "h3"; texto: string }
  | { tipo: "p"; texto: string }
  | { tipo: "hr" }
  | { tipo: "ul"; items: string[] }
  | { tipo: "ol"; items: string[] }
  | { tipo: "tabla"; cabeza: string[]; filas: string[][] };

const celdas = (linea: string) =>
  linea
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

export function leerMd(texto: string): Bloque[] {
  const lineas = texto.split("\n");
  const bloques: Bloque[] = [];
  let seccion = 0;
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i].trimEnd();
    if (!l.trim()) continue;
    if (l.startsWith("### ")) bloques.push({ tipo: "h2", texto: l.slice(4), id: `seccion-${++seccion}` });
    else if (l.startsWith("## ")) bloques.push({ tipo: "sub", texto: l.slice(3) });
    else if (l.startsWith("# ")) bloques.push({ tipo: "h1", texto: l.slice(2) });
    else if (/^-{3,}$/.test(l.trim())) bloques.push({ tipo: "hr" });
    else if (l.startsWith("|")) {
      const filas: string[][] = [];
      while (i < lineas.length && lineas[i].trim().startsWith("|")) {
        if (!/^\|?\s*:?-{3,}/.test(lineas[i].trim())) filas.push(celdas(lineas[i]));
        i++;
      }
      i--;
      bloques.push({ tipo: "tabla", cabeza: filas[0] ?? [], filas: filas.slice(1) });
    } else if (/^- /.test(l) || /^\d+\. /.test(l)) {
      const ordenada = /^\d+\. /.test(l);
      const items: string[] = [];
      while (i < lineas.length && (ordenada ? /^\d+\. /.test(lineas[i]) : /^- /.test(lineas[i]))) {
        items.push(lineas[i].replace(ordenada ? /^\d+\. / : /^- /, "").trim());
        i++;
      }
      i--;
      bloques.push(ordenada ? { tipo: "ol", items } : { tipo: "ul", items });
    } else {
      // Un párrafo que es todo negritas y corto es un subtítulo (ej. "2.1. Datos de…")
      const solo = /^\*\*([^*]+)\*\*$/.exec(l.trim());
      if (solo && solo[1].length < 90) bloques.push({ tipo: "h3", texto: solo[1] });
      else bloques.push({ tipo: "p", texto: l.trim() });
    }
  }
  return bloques;
}

const CORREO = /([\w.+-]+@[\w-]+\.[\w.]+[a-z])/i;

/** **negritas**, *cursivas* y correos (como enlace). */
function enLinea(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) return <strong key={i}>{correos(parte.slice(2, -2))}</strong>;
    if (parte.startsWith("*") && parte.endsWith("*") && parte.length > 2) return <em key={i}>{correos(parte.slice(1, -1))}</em>;
    return <Fragment key={i}>{correos(parte)}</Fragment>;
  });
}

function correos(texto: string): ReactNode[] {
  return texto.split(CORREO).map((parte, i) =>
    i % 2 === 1 ? (
      <a key={i} href={`mailto:${parte}`}>
        {parte}
      </a>
    ) : (
      <Fragment key={i}>{parte}</Fragment>
    ),
  );
}

/** Las secciones (### …) con su id, para un índice de fuera. */
export const seccionesMd = (texto: string) =>
  leerMd(texto)
    .filter((b): b is Extract<Bloque, { tipo: "h2" }> => b.tipo === "h2")
    .map((b) => ({ id: b.id, titulo: b.texto }));

export function DocumentoMd({ texto, nota, soloCuerpo = false }: { texto: string; nota?: string; soloCuerpo?: boolean }) {
  const todos = leerMd(texto);
  // soloCuerpo: sin título, fecha ni índice (los pone la página); empieza en la primera sección
  const bloques = soloCuerpo ? todos.slice(Math.max(0, todos.findIndex((b) => b.tipo === "h2"))) : todos;
  const secciones = bloques.filter((b): b is Extract<Bloque, { tipo: "h2" }> => b.tipo === "h2");
  // Lo de antes de la primera sección es la cabecera; el índice va justo después
  const primera = bloques.findIndex((b) => b.tipo === "h2");

  return (
    <article className="doc-legal" aria-labelledby={soloCuerpo ? undefined : "doc-legal-titulo"}>
      {bloques.map((b, i) => (
        <Fragment key={i}>
          {!soloCuerpo && i === primera && secciones.length > 1 ? (
            <nav className="doc-legal__indice" aria-label="Índice">
              <p>Contenido</p>
              <ol>
                {secciones.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`}>{s.texto.replace(/^\d+\.\s*/, "")}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          {b.tipo === "h1" ? (
            <h1 id="doc-legal-titulo">{b.texto}</h1>
          ) : b.tipo === "sub" ? (
            <>
              <p className="doc-legal__marca">{b.texto}</p>
              {nota ? <p className="doc-legal__nota">{nota}</p> : null}
            </>
          ) : b.tipo === "h2" ? (
            <h2 id={b.id}>{b.texto}</h2>
          ) : b.tipo === "h3" ? (
            <h3>{enLinea(b.texto)}</h3>
          ) : b.tipo === "p" ? (
            <p>{enLinea(b.texto)}</p>
          ) : b.tipo === "hr" ? (
            <hr />
          ) : b.tipo === "ul" ? (
            <ul>
              {b.items.map((t, j) => (
                <li key={j}>{enLinea(t)}</li>
              ))}
            </ul>
          ) : b.tipo === "ol" ? (
            <ol>
              {b.items.map((t, j) => (
                <li key={j}>{enLinea(t)}</li>
              ))}
            </ol>
          ) : (
            <div className="doc-legal__tabla">
              <table>
                <thead>
                  <tr>
                    {b.cabeza.map((c, j) => (
                      <th key={j} scope="col">
                        {enLinea(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.filas.map((f, j) => (
                    <tr key={j}>
                      {f.map((c, k) => (
                        <td key={k}>{enLinea(c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Fragment>
      ))}
    </article>
  );
}
