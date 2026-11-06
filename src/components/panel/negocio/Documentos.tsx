"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type DragEvent, type FormEvent } from "react";
import { Giro, Icono } from "@/components/base/Iconos";
import type { Documento, EstadoAppPersona } from "@/lib/nucleo-tipos";
import { Enlace, Modal, Subtitulo, Tarjeta, Vacio, claseBoton, retrasoEscalon } from "../Piezas";
import { ACEPTA_DOCUMENTOS, EVENTO_DOCUMENTOS, mensajeDe, normalizarLink, useFuenteNegocio, validarArchivo, validarLink } from "./fuente";
import { abrirDrive, driveDisponible } from "./drive";
import { ESTADO_DOCUMENTO, TIPO_DOCUMENTO } from "./textos";

const formatoMx = new Intl.NumberFormat("es-MX");
const fechaDoc = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Mexico_City" });
/** Cada cuánto se vuelve a leer la lista mientras algo se está leyendo, y hasta cuándo. */
const CADA_MS = 2000;
const VECES = 90;

type Subiendo = { id: string; nombre: string };
type Aviso = { tono: "ok" | "error"; texto: string } | null;

/**
 * Documentos: lo que tu equipo consulta al contestar. Se sube arrastrando
 * o con el botón (PDF, DOCX, TXT o MD de hasta 10 MB, revisado también
 * aquí), con un link o desde Google Drive (si está conectada; si no, lleva
 * a Apps). La lista dice qué se está leyendo, qué está listo y qué falló,
 * y el límite del plan ("3 de 20").
 */
export function DocumentosNegocio({ max }: { /** Cuántos documentos deja el plan. */ max: number }) {
  const fuente = useFuenteNegocio();
  const id = useId();
  const [docs, setDocs] = useState<Documento[] | null>(null);
  const [cargaError, setCargaError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<Subiendo[]>([]);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [erroresArchivo, setErroresArchivo] = useState<string[]>([]);
  const [encima, setEncima] = useState(false);
  const [link, setLink] = useState("");
  const [errorLink, setErrorLink] = useState<string | null>(null);
  const [agregandoLink, setAgregandoLink] = useState(false);
  const [porBorrar, setPorBorrar] = useState<Documento | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [drive, setDrive] = useState<EstadoAppPersona | null | undefined>(undefined);
  const [eligiendoDrive, setEligiendoDrive] = useState(false);
  const [intento, setIntento] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);
  const capas = useRef(0);
  const vueltas = useRef(0);

  const cargar = useCallback(async () => {
    try {
      const lista = await fuente.listarDocumentos();
      setDocs(lista);
      setCargaError(null);
    } catch (e) {
      setCargaError(mensajeDe(e, "No se pudieron leer tus documentos."));
    }
  }, [fuente]);

  useEffect(() => {
    void cargar();
  }, [cargar, intento]);

  // Drive: el botón abre el selector solo si está conectada
  useEffect(() => {
    let vivo = true;
    fuente
      .listarApps()
      .then((apps) => vivo && setDrive(apps.find((a) => a.id === "google_drive") ?? null))
      .catch(() => vivo && setDrive(null));
    return () => {
      vivo = false;
    };
  }, [fuente]);

  // El "+" del chat subió algo: se vuelve a leer
  useEffect(() => {
    const otraVez = () => void cargar();
    window.addEventListener(EVENTO_DOCUMENTOS, otraVez);
    return () => window.removeEventListener(EVENTO_DOCUMENTOS, otraVez);
  }, [cargar]);

  // Mientras algo se está leyendo, la lista se vuelve a pedir cada 2 s (con tope)
  const leyendo = docs?.some((d) => d.estado === "procesando") ?? false;
  useEffect(() => {
    if (!leyendo) {
      vueltas.current = 0;
      return;
    }
    if (vueltas.current >= VECES) return;
    const t = window.setTimeout(() => {
      vueltas.current += 1;
      void cargar();
    }, CADA_MS);
    return () => window.clearTimeout(t);
  }, [leyendo, docs, cargar]);

  // El aviso de "Listo" se va solo (los errores se quedan hasta el siguiente intento)
  useEffect(() => {
    if (aviso?.tono !== "ok") return;
    const t = window.setTimeout(() => setAviso(null), 4000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const total = (docs?.length ?? 0) + subiendo.length;
  const lleno = total >= max;

  const subir = async (archivos: File[]) => {
    if (!archivos.length) return;
    setAviso(null);
    const malos: string[] = [];
    const buenos: File[] = [];
    for (const a of archivos) {
      const error = validarArchivo(a);
      if (error) malos.push(error);
      else buenos.push(a);
    }
    const cupo = Math.max(0, max - total);
    if (buenos.length > cupo) {
      malos.push(cupo === 0 ? `Ya tienes ${max} documentos, el máximo de tu plan. Borra uno para subir otro.` : `Solo caben ${cupo} más en tu plan: se suben los primeros.`);
      buenos.splice(cupo);
    }
    setErroresArchivo(malos);
    if (!buenos.length) return;

    const listos: string[] = [];
    for (const a of buenos) {
      const temp = { id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, nombre: a.name };
      setSubiendo((s) => [...s, temp]);
      try {
        const doc = await fuente.subirArchivo(a);
        setDocs((d) => [doc, ...(d ?? []).filter((x) => x.id !== doc.id)]);
        listos.push(a.name);
      } catch (e) {
        malos.push(`«${a.name}»: ${mensajeDe(e, "no se pudo subir.")}`);
        setErroresArchivo([...malos]);
      } finally {
        setSubiendo((s) => s.filter((x) => x.id !== temp.id));
      }
    }
    if (listos.length) setAviso({ tono: "ok", texto: listos.length === 1 ? `Listo: «${listos[0]}» se subió. Lo verá tu equipo en sus respuestas.` : `Listo: se subieron ${listos.length} documentos. Los verá tu equipo en sus respuestas.` });
  };

  const agregarLink = async (e: FormEvent) => {
    e.preventDefault();
    if (agregandoLink) return;
    const error = validarLink(link);
    if (error) {
      setErrorLink(error);
      return;
    }
    if (lleno) {
      setErrorLink(`Ya tienes ${max} documentos, el máximo de tu plan. Borra uno para agregar otro.`);
      return;
    }
    setAgregandoLink(true);
    setErrorLink(null);
    try {
      const doc = await fuente.agregarLink(normalizarLink(link));
      setDocs((d) => [doc, ...(d ?? []).filter((x) => x.id !== doc.id)]);
      setLink("");
      setAviso({ tono: "ok", texto: `Listo: tu equipo va a leer ${doc.nombre}.` });
    } catch (err) {
      setErrorLink(mensajeDe(err, "No se pudo agregar el link."));
    } finally {
      setAgregandoLink(false);
    }
  };

  const borrar = async () => {
    const d = porBorrar;
    if (!d || borrando) return;
    setBorrando(true);
    try {
      await fuente.borrarDocumento(d.id);
      setDocs((l) => (l ?? []).filter((x) => x.id !== d.id));
      setPorBorrar(null);
      setAviso({ tono: "ok", texto: `Se borró «${d.nombre}».` });
    } catch (e) {
      setPorBorrar(null);
      setAviso({ tono: "error", texto: mensajeDe(e, "No se pudo borrar el documento.") });
    } finally {
      setBorrando(false);
    }
  };

  const elegirDeDrive = async () => {
    if (eligiendoDrive) return;
    setEligiendoDrive(true);
    setAviso(null);
    try {
      const { documentos: nuevos, fallidos } = await abrirDrive(fuente);
      if (nuevos.length) setDocs((d) => [...nuevos, ...(d ?? []).filter((x) => !nuevos.some((n) => n.id === x.id))]);
      const noSe = fallidos > 0 ? ` ${fallidos === 1 ? "Un archivo no se pudo leer" : `${fallidos} archivos no se pudieron leer`} (Drive solo deja leer Docs, Hojas, PDF y texto).` : "";
      if (nuevos.length) setAviso({ tono: fallidos ? "error" : "ok", texto: `${nuevos.length === 1 ? `Listo: «${nuevos[0].nombre}» se agregó desde Drive.` : `Listo: se agregaron ${nuevos.length} archivos de Drive.`}${noSe}` });
      else if (fallidos) setAviso({ tono: "error", texto: `No se pudo agregar lo que elegiste.${noSe}` });
    } catch (e) {
      setAviso({ tono: "error", texto: mensajeDe(e, "No se pudo abrir Google Drive.") });
    } finally {
      setEligiendoDrive(false);
    }
  };

  const alSoltar = (e: DragEvent) => {
    e.preventDefault();
    capas.current = 0;
    setEncima(false);
    if (lleno) {
      setErroresArchivo([`Ya tienes ${max} documentos, el máximo de tu plan. Borra uno para subir otro.`]);
      return;
    }
    void subir([...e.dataTransfer.files]);
  };

  const conDrive = drive?.estado === "conectada" && driveDisponible();
  const hrefApps = `${fuente.base}?vista=negocio&tab=apps`;
  const ayudaZona = `${id}-zona-ayuda`;
  const errorZona = `${id}-zona-error`;

  return (
    <>
      {/* ---------- Subir ---------- */}
      <section aria-labelledby={`${id}-subir`} className="pc-docs__agregar">
        <h2 id={`${id}-subir`} className="pc-oculto">
          Agregar documentos
        </h2>
        <div
          className="pc-zona pc-entra"
          style={{ "--d": "0ms" } as CSSProperties}
          data-encima={encima ? "" : undefined}
          data-lleno={lleno ? "" : undefined}
          onDragEnter={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            capas.current += 1;
            setEncima(true);
          }}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = lleno ? "none" : "copy";
          }}
          onDragLeave={() => {
            capas.current = Math.max(0, capas.current - 1);
            if (capas.current === 0) setEncima(false);
          }}
          onDrop={alSoltar}
        >
          <span className="pc-zona__icono" aria-hidden="true">
            <Icono nombre="subir" tam={20} />
          </span>
          <p className="pc-zona__titulo">{encima ? "Suéltalo para subirlo" : "Arrastra aquí un archivo"}</p>
          <p id={ayudaZona} className="pc-zona__ayuda">
            PDF, DOCX, TXT o MD de hasta 10 MB: tu lista de precios, tus políticas, un menú o un manual.
          </p>
          <div className="pc-zona__botones">
            <button
              type="button"
              className={claseBoton("principal", true)}
              onClick={() => entrada.current?.click()}
              disabled={lleno}
              aria-describedby={`${ayudaZona}${erroresArchivo.length ? ` ${errorZona}` : ""}`}
            >
              <Icono nombre="subir" tam={16} />
              Elegir archivo
            </button>
            {conDrive ? (
              <button type="button" className={claseBoton("borde", true)} onClick={elegirDeDrive} disabled={lleno || eligiendoDrive} aria-busy={eligiendoDrive || undefined}>
                {eligiendoDrive ? <Giro /> : <Icono nombre="documento" tam={16} />}
                Elegir de Google Drive
              </button>
            ) : drive !== undefined ? (
              <Enlace href={hrefApps} className={claseBoton("borde", true)} title="Primero conecta Google Drive en Apps">
                <Icono nombre="documento" tam={16} />
                Elegir de Google Drive
              </Enlace>
            ) : null}
          </div>
          <input
            ref={entrada}
            type="file"
            className="pc-oculto"
            accept={ACEPTA_DOCUMENTOS}
            multiple
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const archivos = [...(e.target.files ?? [])];
              e.target.value = "";
              void subir(archivos);
            }}
          />
          {drive !== undefined && !conDrive ? <p className="pc-zona__nota">Para elegir de Drive, primero conecta Google Drive en Apps.</p> : null}
        </div>
        {erroresArchivo.length ? (
          <ul id={errorZona} className="pc-docs__errores" role="alert">
            {erroresArchivo.map((t) => (
              <li key={t} className="pc-error">
                <Icono nombre="alerta" tam={14} />
                {t}
              </li>
            ))}
          </ul>
        ) : null}

        <form className="pc-link pc-entra" style={{ "--d": `${retrasoEscalon(1)}ms` } as CSSProperties} onSubmit={agregarLink} noValidate>
          <label htmlFor={`${id}-link`} className="pc-link__etiqueta">
            Agregar un link
          </label>
          <p id={`${id}-link-ayuda`} className="pc-link__ayuda">
            Una página pública, como tus precios o tus preguntas frecuentes. Tu equipo la lee una vez.
          </p>
          <div className="pc-link__fila">
            <span className="pc-link__campo">
              <Icono nombre="enlace" tam={16} />
              <input
                id={`${id}-link`}
                className="pc-campo__entrada"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://tusitio.com/precios"
                value={link}
                maxLength={2000}
                disabled={lleno}
                aria-invalid={errorLink ? true : undefined}
                aria-describedby={`${id}-link-ayuda${errorLink ? ` ${id}-link-error` : ""}`}
                onChange={(e) => {
                  setLink(e.target.value);
                  if (errorLink) setErrorLink(null);
                }}
              />
            </span>
            <button type="submit" className={claseBoton("borde")} disabled={agregandoLink || lleno || !link.trim()} aria-busy={agregandoLink || undefined}>
              {agregandoLink ? <Giro /> : null}
              {agregandoLink ? "Agregando…" : "Agregar"}
            </button>
          </div>
          {errorLink ? (
            <p id={`${id}-link-error`} className="pc-error pc-link__error" role="alert">
              <Icono nombre="alerta" tam={14} />
              {errorLink}
            </p>
          ) : null}
        </form>
      </section>

      {/* ---------- La lista ---------- */}
      <section aria-labelledby={`${id}-lista`}>
        <Subtitulo
          id={`${id}-lista`}
          extra={
            docs ? (
              <span className="pc-docs__limite cifras" data-lleno={lleno ? "" : undefined}>
                {formatoMx.format(total)} de {formatoMx.format(max)}
                <span className="pc-oculto"> documentos que deja tu plan</span>
              </span>
            ) : null
          }
        >
          Tus documentos
        </Subtitulo>
        <p className="pc-oculto" role="status" aria-live="polite">
          {aviso?.tono === "ok" ? aviso.texto : ""}
        </p>
        {aviso ? (
          <p className={`pc-docs__aviso${aviso.tono === "error" ? " pc-docs__aviso--error" : ""}`} role={aviso.tono === "error" ? "alert" : undefined} aria-hidden={aviso.tono === "ok" ? true : undefined}>
            <Icono nombre={aviso.tono === "ok" ? "check-circulo" : "alerta"} tam={16} />
            {aviso.texto}
          </p>
        ) : null}

        {cargaError ? (
          <Vacio
            icono="alerta"
            titulo="No se pudieron leer tus documentos"
            texto={cargaError}
            accion={
              <button type="button" className={claseBoton("borde", true)} onClick={() => setIntento((n) => n + 1)}>
                <Icono nombre="repetir" tam={16} />
                Intentar de nuevo
              </button>
            }
          />
        ) : docs === null ? (
          <p className="pc-cargando" role="status">
            <Giro /> Cargando tus documentos…
          </p>
        ) : docs.length === 0 && subiendo.length === 0 ? (
          <Vacio icono="documento" titulo="Todavía no hay documentos" texto="Sube tu lista de precios, tus políticas o lo que más te preguntan. Tu equipo los consulta para contestar con tus datos." />
        ) : (
          <Tarjeta como="div" className="pc-lista-tarjeta">
            <ul className="pc-filas pc-docs" aria-busy={leyendo || subiendo.length > 0 || undefined}>
              {subiendo.map((s) => (
                <li key={s.id} className="pc-doc pc-entra">
                  <span className="pc-doc__icono" aria-hidden="true">
                    <Giro />
                  </span>
                  <span className="pc-doc__textos">
                    <span className="pc-doc__nombre">{s.nombre}</span>
                    <span className="pc-doc__detalle">Subiendo…</span>
                  </span>
                </li>
              ))}
              {docs.map((d, i) => (
                <FilaDocumento key={d.id} doc={d} indice={i} alBorrar={() => setPorBorrar(d)} />
              ))}
            </ul>
          </Tarjeta>
        )}
        {lleno && docs ? (
          <p className="pc-nota">
            Llegaste al máximo de tu plan. Borra uno para subir otro, o{" "}
            <Enlace href="/precios" className="pc-enlace">
              mira los planes
            </Enlace>
            .
          </p>
        ) : null}
      </section>

      <Modal
        abierto={porBorrar !== null}
        alCerrar={() => !borrando && setPorBorrar(null)}
        titulo="¿Borrar este documento?"
        descripcion={porBorrar ? `«${porBorrar.nombre}» se borra para siempre y tu equipo ya no lo usará al contestar.` : undefined}
        pie={
          <>
            <button type="button" className={claseBoton("fantasma")} onClick={() => setPorBorrar(null)} disabled={borrando}>
              Cancelar
            </button>
            <button type="button" className={claseBoton("principal")} onClick={borrar} disabled={borrando} aria-busy={borrando || undefined}>
              {borrando ? <Giro /> : <Icono nombre="basura" tam={16} />}
              {borrando ? "Borrando…" : "Borrar"}
            </button>
          </>
        }
      >
        <p className="pc-modal__nota">Si lo necesitas otra vez, lo vuelves a subir.</p>
      </Modal>
    </>
  );
}

function FilaDocumento({ doc, indice, alBorrar }: { doc: Documento; indice: number; alBorrar: () => void }) {
  const tipo = TIPO_DOCUMENTO[doc.tipo] ?? TIPO_DOCUMENTO.txt;
  const estado = ESTADO_DOCUMENTO[doc.estado] ?? ESTADO_DOCUMENTO.listo;
  const detalle = [tipo.etiqueta, doc.caracteres > 0 ? `${formatoMx.format(doc.caracteres)} caracteres` : null, fechaDoc.format(new Date(doc.creado_en))].filter(Boolean).join(" · ");
  return (
    <li className="pc-doc pc-entra" style={{ "--d": `${retrasoEscalon(indice + 2)}ms` } as CSSProperties}>
      <span className="pc-doc__icono" aria-hidden="true">
        <Icono nombre={tipo.icono} tam={18} />
      </span>
      <span className="pc-doc__textos">
        {doc.url && (doc.tipo === "link" || doc.tipo === "drive" || doc.tipo === "notion") ? (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="pc-doc__nombre pc-doc__nombre--enlace" title={doc.nombre}>
            {doc.nombre}
            <span className="pc-oculto"> (se abre en otra pestaña)</span>
          </a>
        ) : (
          <span className="pc-doc__nombre" title={doc.nombre}>
            {doc.nombre}
          </span>
        )}
        <span className="pc-doc__detalle">{detalle}</span>
        {doc.estado === "error" && doc.error ? <span className="pc-doc__error">{doc.error}</span> : null}
      </span>
      <span className={`pc-estado pc-estado--${estado.tono}`}>
        {doc.estado === "procesando" ? <span className="pc-doc__leyendo" aria-hidden="true" /> : null}
        {estado.etiqueta}
      </span>
      <button type="button" className="pc-icono pc-doc__borrar" onClick={alBorrar} aria-label={`Borrar «${doc.nombre}»`} title="Borrar">
        <Icono nombre="basura" tam={16} />
      </button>
    </li>
  );
}
