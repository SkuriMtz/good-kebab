"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Boton } from "@/components/base/Boton";
import { Campo } from "@/components/base/Campo";
import { Escribiendo } from "@/components/base/Escribiendo";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import type { CorreoResumido } from "./tipos";
import { MarcaAgente } from "./util";

/* =====================================================================
   CORREO CON CLARA: probar con un correo (pegado o de ejemplo) y la lista
   de lo que Clara ya leyó. En /panel resume de verdad (API); en /pruebalo
   las respuestas son de guion y no se llama a la IA.
   ===================================================================== */

export type CorreoPrueba = { etiqueta: string; remitente: string; asunto: string; contenido: string };
export type ResultadoCorreo = { asunto: string; remitente: string; resumen: string; accion: string };

const conSugerencia = (accion: string | null | undefined) => Boolean(accion && accion.trim().toLowerCase() !== "ninguna");

export function ProbarCorreo({
  ejemplos,
  resumir,
  nota,
}: {
  ejemplos: CorreoPrueba[];
  /** Devuelve el resumen o lanza un Error con el mensaje para la persona. */
  resumir: (datos: { remitente: string; asunto: string; contenido: string }) => Promise<ResultadoCorreo>;
  nota?: ReactNode;
}) {
  const [remitente, setRemitente] = useState("");
  const [asunto, setAsunto] = useState("");
  const [contenido, setContenido] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCorreo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);

  const hayTexto = Boolean(remitente || asunto || contenido);

  function usarEjemplo(e: CorreoPrueba) {
    setRemitente(e.remitente);
    setAsunto(e.asunto);
    setContenido(e.contenido);
    setError(null);
  }

  function limpiar() {
    setRemitente("");
    setAsunto("");
    setContenido("");
    setError(null);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (cargando) return;
    if (!contenido.trim()) {
      setError("Escribe o pega el contenido del correo.");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const r = await resumir({ remitente, asunto, contenido });
      setResultado(r);
      requestAnimationFrame(() => {
        const el = resultadoRef.current;
        if (el && el.getBoundingClientRect().top > window.innerHeight * 0.7) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section id="probar" className="tb-tarjeta tb-probar" aria-labelledby="tb-probar">
      <div className="tb-probar__forma">
        <h2 id="tb-probar" className="t-app-titulo">
          Resume un correo
        </h2>
        <p className="tb-texto-2 tb-probar__intro">Pega un correo o elige un ejemplo. Clara te dice de qué trata y qué conviene hacer.</p>

        <p className="tb-micro tb-probar__ejemplos-titulo">Ejemplos</p>
        <div className="tb-filtros">
          {ejemplos.map((e) => (
            <button key={e.etiqueta} type="button" className="tb-filtro" aria-pressed={asunto === e.asunto && contenido === e.contenido} onClick={() => usarEjemplo(e)}>
              {e.etiqueta}
            </button>
          ))}
        </div>

        <form onSubmit={enviar} className="tb-probar__campos" noValidate>
          <Campo etiqueta="De" name="remitente" value={remitente} alCambiar={setRemitente} placeholder="Juan Pérez <juan@correo.com>" maxLength={300} />
          <Campo etiqueta="Asunto" name="asunto" value={asunto} alCambiar={setAsunto} placeholder="¿De qué trata?" maxLength={300} />
          <Campo
            multilinea
            etiqueta="Contenido"
            name="contenido"
            value={contenido}
            alCambiar={setContenido}
            placeholder="Pega aquí el texto del correo"
            maxLength={5000}
            rows={5}
            error={error}
          />
          <div className="tb-probar__acciones">
            <Boton type="submit" tam="compacto" cargando={cargando} icono={<Icono nombre="rayo" />}>
              {cargando ? "Leyendo el correo…" : "Resumir con Clara"}
            </Boton>
            {hayTexto && !cargando ? (
              <Boton variante="fantasma" tam="compacto" onClick={limpiar}>
                Limpiar
              </Boton>
            ) : null}
          </div>
          {nota ? <p className="tb-probar__nota">{nota}</p> : null}
        </form>
      </div>

      <div ref={resultadoRef} className="tb-probar__resultado" aria-live="polite">
        {resultado ? (
          <div className="tb-resultado">
            <p className="tb-micro">Resumen de Clara</p>
            <p className="tb-resultado__de">
              {resultado.remitente || "Sin remitente"} · {resultado.asunto || "Sin asunto"}
            </p>
            <p className="tb-resultado__resumen">{resultado.resumen}</p>
            {conSugerencia(resultado.accion) ? (
              <p className="tb-sugerencia">
                <Icono nombre="flecha" tam={16} />
                <span>
                  <span className="tb-fuerte">Conviene:</span> {resultado.accion}
                </span>
              </p>
            ) : null}
          </div>
        ) : (
          <div className="tb-resultado tb-resultado--espera">
            <MarcaAgente agente="clara" tam={64} />
            {cargando ? <Escribiendo quien="Clara" conTexto /> : <p className="tb-texto-2">El resumen aparecerá aquí.</p>}
          </div>
        )}
      </div>
    </section>
  );
}

/** Lo que Clara ya leyó: una fila por correo, con su sugerencia. */
export function ListaCorreos({
  correos,
  cargando = false,
  vacio,
}: {
  correos: CorreoResumido[];
  cargando?: boolean;
  vacio: ReactNode;
}) {
  if (cargando) {
    return (
      <div className="tb-tarjeta tb-cargando" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="tb-cargando__fila">
            <span className="tb-cargando__linea tb-cargando__linea--corta" />
            <span className="tb-cargando__linea" />
          </div>
        ))}
        <span className="sr-only">Cargando el historial…</span>
      </div>
    );
  }
  if (!correos.length) return <>{vacio}</>;
  return (
    <ul className="tb-tarjeta tb-correos">
      {correos.map((c) => (
        <li key={c.id} className="tb-correo-fila">
          <div className="tb-correo-fila__lado">
            <span className="tb-correo-fila__cuando cifras" suppressHydrationWarning>
              {c.cuando}
            </span>
            {c.nuevo ? <Insignia tono="azul">Nuevo</Insignia> : null}
            {c.urgente ? <Insignia tono="atencion">Urgente</Insignia> : null}
          </div>
          <div className="tb-correo-fila__cuerpo">
            <p className="tb-correo-fila__asunto">{c.asunto || "Sin asunto"}</p>
            <p className="tb-correo-fila__de">{c.remitente || "Sin remitente"}</p>
            <p className="tb-correo-fila__resumen">{c.resumen}</p>
            {conSugerencia(c.sugerencia) ? (
              <p className="tb-sugerencia">
                <Icono nombre="flecha" tam={16} />
                <span>{c.sugerencia}</span>
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Gmail: conectar (solo lectura) o revisar correo nuevo. */
export function TarjetaGmail({
  conGoogle,
  googleDisponible,
  cargando,
  mensaje,
  alRevisar,
  alConectar,
}: {
  conGoogle: boolean;
  googleDisponible: boolean;
  cargando: boolean;
  mensaje: string | null;
  alRevisar: () => void;
  alConectar: () => void;
}) {
  return (
    <section id="gmail" className="tb-tarjeta tb-gmail" aria-labelledby="tb-gmail">
      <div className="tb-tarjeta__cabeza">
        <h2 id="tb-gmail" className="tb-tarjeta__titulo">
          Gmail
        </h2>
        {conGoogle ? (
          <Insignia tono="exito" conPunto>
            Conectado
          </Insignia>
        ) : googleDisponible ? (
          <Insignia>Sin conectar</Insignia>
        ) : (
          <Insignia tono="pronto">Pronto</Insignia>
        )}
      </div>
      <p className="tb-gmail__texto">
        Conecta tu Gmail y Clara resume tus correos sin leer. Solo lectura: nunca envía ni borra nada.
      </p>
      <div className="tb-gmail__accion">
        {conGoogle ? (
          <Boton variante="sutil" tam="compacto" bloque cargando={cargando} icono={<Icono nombre="repetir" />} onClick={alRevisar}>
            {cargando ? "Revisando…" : "Revisar correo nuevo"}
          </Boton>
        ) : googleDisponible ? (
          <Boton variante="sutil" tam="compacto" bloque icono={<Icono nombre="correo" />} onClick={alConectar}>
            Conectar Gmail
          </Boton>
        ) : null}
      </div>
      {mensaje ? (
        <p className="tb-gmail__mensaje" role="status">
          {mensaje}
        </p>
      ) : null}
    </section>
  );
}
