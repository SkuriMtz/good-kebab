"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent, type TextareaHTMLAttributes } from "react";
import { Giro, Icono } from "@/components/base/Iconos";
import { CAMPOS_PERFIL, MAX_CAMPO_PERFIL, type CampoPerfil, type PerfilNegocio } from "@/lib/nucleo-tipos";
import { Modal, Odometro, Tarjeta, Vacio, claseBoton, retrasoEscalon } from "../Piezas";
import { mensajeDe, perfilCompleto, useFuenteNegocio, type CambiosPerfil } from "./fuente";
import { INFO_CAMPO, camposLlenos, porcentajePerfil } from "./textos";

type Valores = Record<CampoPerfil, string>;

const valoresDe = (p: PerfilNegocio): Valores => Object.fromEntries(CAMPOS_PERFIL.map((c) => [c, p[c] ?? ""])) as Valores;
const cambiosDe = (antes: Valores, ahora: Valores): CambiosPerfil => Object.fromEntries(CAMPOS_PERFIL.filter((c) => antes[c] !== ahora[c]).map((c) => [c, ahora[c]]));
const formatoMx = new Intl.NumberFormat("es-MX");
const fechaGuardado = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** El borrador de la pestaña: si se va con atrás o se recarga, lo escrito no se pierde. */
const claveBorrador = (base: string) => `atendel-borrador-perfil:${base}`;
function leerBorrador(base: string): Valores | null {
  try {
    const t = window.sessionStorage.getItem(claveBorrador(base));
    if (!t) return null;
    const d = JSON.parse(t) as Partial<Valores>;
    return Object.fromEntries(CAMPOS_PERFIL.map((c) => [c, typeof d[c] === "string" ? d[c]!.slice(0, MAX_CAMPO_PERFIL) : ""])) as Valores;
  } catch {
    return null;
  }
}
function escribirBorrador(base: string, v: Valores | null) {
  try {
    if (v) window.sessionStorage.setItem(claveBorrador(base), JSON.stringify(v));
    else window.sessionStorage.removeItem(claveBorrador(base));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

/**
 * Pide confirmación antes de salir con cambios sin guardar: al recargar o
 * cerrar la pestaña (beforeunload) y al picar un enlace (menú, pestañas…).
 * El clic se detiene antes que nadie (captura en document) y, si la persona
 * confirma, se repite tal cual (con su transición y su navegación).
 */
function useConfirmarSalida(activo: boolean) {
  const [destino, setDestino] = useState<HTMLAnchorElement | null>(null);
  const deja = useRef(false);

  useEffect(() => {
    if (!activo) return;
    const antes = (e: BeforeUnloadEvent) => {
      if (deja.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const clic = (e: MouseEvent) => {
      if (deja.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      const aqui = new URL(window.location.href);
      // Solo cambia el # (saltar al contenido): no es salir
      if (url.origin === aqui.origin && url.pathname === aqui.pathname && url.search === aqui.search) return;
      e.preventDefault();
      e.stopPropagation();
      setDestino(a);
    };
    window.addEventListener("beforeunload", antes);
    document.addEventListener("click", clic, true);
    return () => {
      window.removeEventListener("beforeunload", antes);
      document.removeEventListener("click", clic, true);
    };
  }, [activo]);

  /** Sigue al enlace que se detuvo (cuando el modal ya se cerró y lo de atrás ya no está inerte). */
  const seguir = useCallback(() => {
    const a = destino;
    setDestino(null);
    if (!a) return;
    window.setTimeout(() => {
      deja.current = true;
      a.click();
      deja.current = false;
    }, 0);
  }, [destino]);

  return { destino, cancelar: () => setDestino(null), seguir };
}

/** Un textarea que crece con lo que se escribe (sin barra de desplazamiento propia). */
function CampoQueCrece(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [props.value]);
  return <textarea ref={ref} rows={2} {...props} />;
}

/**
 * Perfil: lo que tu equipo sabe de tu negocio. Un campo por tema (etiqueta
 * visible, una línea de ayuda y un ejemplo neutro), con su cuenta de
 * caracteres; "Guardar" con su estado de cargando y un "Guardado" que se
 * va solo; y arriba, el medidor con el porcentaje de temas llenos.
 */
export function PerfilNegocioVista() {
  const fuente = useFuenteNegocio();
  const id = useId();
  const [guardadoBase, setGuardadoBase] = useState<PerfilNegocio | null>(null);
  const [valores, setValores] = useState<Valores | null>(null);
  const [cargaError, setCargaError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardadoN, setGuardadoN] = useState(0);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [errores, setErrores] = useState<Partial<Record<CampoPerfil, string>>>({});
  const [recuperado, setRecuperado] = useState(false);
  const [intento, setIntento] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // Leer el perfil (y lo que quedó sin guardar en esta pestaña)
  useEffect(() => {
    let vivo = true;
    setCargaError(null);
    fuente
      .leerPerfil()
      .then((p) => {
        if (!vivo) return;
        const base = perfilCompleto(p);
        const borrador = leerBorrador(fuente.base);
        const delServidor = valoresDe(base);
        const distinto = borrador && CAMPOS_PERFIL.some((c) => borrador[c] !== delServidor[c]);
        setGuardadoBase(base);
        setValores(distinto ? borrador : delServidor);
        setRecuperado(Boolean(distinto));
        if (!distinto) escribirBorrador(fuente.base, null);
      })
      .catch((e) => vivo && setCargaError(mensajeDe(e, "No se pudo leer tu perfil.")));
    return () => {
      vivo = false;
    };
  }, [fuente, intento]);

  const delServidor = guardadoBase ? valoresDe(guardadoBase) : null;
  const sucio = Boolean(valores && delServidor && CAMPOS_PERFIL.some((c) => valores[c] !== delServidor[c]));
  const salida = useConfirmarSalida(sucio);

  // El "Guardado" se va solo
  useEffect(() => {
    if (!guardadoN) return;
    const t = window.setTimeout(() => setGuardadoN(0), 2600);
    return () => window.clearTimeout(t);
  }, [guardadoN]);

  const cambiar = (c: CampoPerfil, v: string) => {
    setValores((antes) => {
      if (!antes) return antes;
      const nuevos = { ...antes, [c]: v.slice(0, MAX_CAMPO_PERFIL) };
      escribirBorrador(fuente.base, nuevos);
      return nuevos;
    });
    if (errores[c]) setErrores((e) => ({ ...e, [c]: undefined }));
    setErrorGuardar(null);
  };

  const guardar = useCallback(async (): Promise<boolean> => {
    if (!valores || !delServidor || guardando) return false;
    const cambios = cambiosDe(delServidor, valores);
    if (!Object.keys(cambios).length) return true;
    // Lo mismo que revisa la base, aquí también
    const largos = CAMPOS_PERFIL.filter((c) => valores[c].length > MAX_CAMPO_PERFIL);
    if (largos.length) {
      setErrores(Object.fromEntries(largos.map((c) => [c, `Máximo ${formatoMx.format(MAX_CAMPO_PERFIL)} caracteres.`])));
      formRef.current?.querySelector<HTMLTextAreaElement>(`#${CSS.escape(`${id}-${largos[0]}`)}`)?.focus();
      return false;
    }
    setGuardando(true);
    setErrorGuardar(null);
    try {
      const p = perfilCompleto(await fuente.guardarPerfil(cambios));
      setGuardadoBase(p);
      setValores(valoresDe(p));
      escribirBorrador(fuente.base, null);
      setRecuperado(false);
      setGuardadoN((n) => n + 1);
      return true;
    } catch (e) {
      const campo = (e as { campo?: string }).campo;
      if (campo && (CAMPOS_PERFIL as readonly string[]).includes(campo)) {
        setErrores({ [campo]: mensajeDe(e) });
        formRef.current?.querySelector<HTMLTextAreaElement>(`#${CSS.escape(`${id}-${campo}`)}`)?.focus();
      } else setErrorGuardar(mensajeDe(e, "No se pudo guardar. Intenta de nuevo."));
      return false;
    } finally {
      setGuardando(false);
    }
  }, [valores, delServidor, guardando, fuente, id]);

  // ⌘S / Ctrl S guarda (el navegador ya no intenta guardar la página)
  useEffect(() => {
    if (!sucio) return;
    const tecla = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void guardar();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [sucio, guardar]);

  const descartar = () => {
    if (!delServidor) return;
    setValores(delServidor);
    setErrores({});
    setErrorGuardar(null);
    setRecuperado(false);
    escribirBorrador(fuente.base, null);
  };

  if (cargaError) {
    return (
      <Vacio
        icono="alerta"
        titulo="No se pudo leer tu perfil"
        texto={cargaError}
        accion={
          <button type="button" className={claseBoton("borde", true)} onClick={() => setIntento((n) => n + 1)}>
            <Icono nombre="repetir" tam={16} />
            Intentar de nuevo
          </button>
        }
      />
    );
  }
  if (!valores || !guardadoBase) {
    return (
      <p className="pc-cargando" role="status">
        <Giro /> Cargando tu perfil…
      </p>
    );
  }

  // El medidor cuenta lo GUARDADO: es lo que tu equipo ya sabe
  const llenos = camposLlenos(guardadoBase);
  const pct = porcentajePerfil(guardadoBase);

  return (
    <>
      <Tarjeta como="section" className="pc-medidor" indice={0} etiqueta="Qué tanto conoce tu equipo tu negocio">
        <div className="pc-medidor__fila">
          <h2 id={`${id}-medidor`} className="pc-medidor__titulo">
            Qué tanto conoce tu equipo tu negocio
          </h2>
          <Odometro valor={pct} formato={(n) => `${n} %`} className="pc-medidor__pct" />
        </div>
        <div className="pc-barra pc-medidor__barra" role="progressbar" aria-labelledby={`${id}-medidor`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${pct} %: ${llenos} de ${CAMPOS_PERFIL.length} temas`}>
          <span className="pc-barra__lleno" style={{ "--v": pct / 100 } as CSSProperties} />
        </div>
        <p className="pc-medidor__detalle">
          {llenos === CAMPOS_PERFIL.length
            ? "Tu equipo ya sabe lo esencial. Actualízalo cuando algo cambie."
            : `${llenos} de ${CAMPOS_PERFIL.length} temas. Lola, Clara, Víctor e Iris usan lo que guardes aquí al contestar.`}
        </p>
      </Tarjeta>

      {recuperado ? (
        <p className="pc-nota pc-perfil__recuperado" role="status">
          <Icono nombre="repetir" tam={16} />
          Recuperamos lo que escribiste y no se guardó.
        </p>
      ) : null}

      <form
        ref={formRef}
        className="pc-perfil"
        noValidate
        aria-label="Tu perfil"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void guardar();
        }}
      >
        {CAMPOS_PERFIL.map((c, i) => {
          const info = INFO_CAMPO[c];
          const v = valores[c];
          const cerca = v.length >= MAX_CAMPO_PERFIL * 0.9;
          const error = errores[c];
          const campoId = `${id}-${c}`;
          return (
            <div key={c} className="pc-perfil__campo pc-entra" style={{ "--d": `${retrasoEscalon(i + 1)}ms` } as CSSProperties}>
              <div className="pc-perfil__textos">
                <label htmlFor={campoId} className="pc-perfil__etiqueta">
                  {info.etiqueta}
                </label>
                <p id={`${campoId}-ayuda`} className="pc-perfil__ayuda">
                  {info.ayuda}
                </p>
              </div>
              <div className="pc-perfil__entrada">
                <CampoQueCrece
                  id={campoId}
                  name={c}
                  className="pc-campo__entrada pc-perfil__texto"
                  value={v}
                  placeholder={info.ejemplo}
                  maxLength={MAX_CAMPO_PERFIL}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={`${campoId}-ayuda ${campoId}-cuenta${error ? ` ${campoId}-error` : ""}`}
                  onChange={(e) => cambiar(c, e.target.value)}
                />
                <div className="pc-perfil__pie">
                  {error ? (
                    <p id={`${campoId}-error`} className="pc-error pc-perfil__error" role="alert">
                      <Icono nombre="alerta" tam={14} />
                      {error}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span id={`${campoId}-cuenta`} className="pc-perfil__cuenta cifras" data-cerca={cerca ? "" : undefined}>
                    <span className="pc-oculto">Llevas </span>
                    {formatoMx.format(v.length)} / {formatoMx.format(MAX_CAMPO_PERFIL)}
                    <span className="pc-oculto"> caracteres</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="pc-perfil__guardar" data-sucio={sucio ? "" : undefined}>
          <p className="pc-perfil__estado" aria-live="polite">
            {guardadoN ? (
              <span key={guardadoN} className="pc-perfil__guardado">
                <Icono nombre="check" tam={16} trazo={2} />
                Guardado
              </span>
            ) : errorGuardar ? (
              <span className="pc-error" role="alert">
                {errorGuardar}
              </span>
            ) : sucio ? (
              "Tienes cambios sin guardar"
            ) : guardadoBase.actualizado_en ? (
              `Guardado el ${fechaGuardado.format(new Date(guardadoBase.actualizado_en))}`
            ) : (
              "Todavía no guardas nada"
            )}
          </p>
          <div className="pc-perfil__botones">
            {sucio && !guardando ? (
              <button type="button" className={claseBoton("fantasma")} onClick={descartar}>
                Descartar
              </button>
            ) : null}
            <button type="submit" className={claseBoton("principal")} disabled={!sucio || guardando} aria-busy={guardando || undefined} aria-keyshortcuts="Meta+S Control+S">
              {guardando ? <Giro /> : null}
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </form>

      <Modal
        abierto={salida.destino !== null}
        alCerrar={salida.cancelar}
        titulo="¿Salir sin guardar?"
        descripcion="Cambiaste tu perfil y todavía no se guarda. Tu equipo sigue usando lo de antes."
        pie={
          <>
            <button
              type="button"
              className={claseBoton("fantasma")}
              onClick={() => {
                escribirBorrador(fuente.base, null);
                salida.seguir();
              }}
            >
              Salir sin guardar
            </button>
            <button
              type="button"
              className={claseBoton("principal")}
              disabled={guardando}
              onClick={async () => {
                if (await guardar()) salida.seguir();
                else salida.cancelar();
              }}
            >
              {guardando ? <Giro /> : null}
              Guardar y salir
            </button>
          </>
        }
      >
        <p className="pc-modal__nota">Si sales, lo que escribiste se pierde.</p>
      </Modal>
    </>
  );
}
