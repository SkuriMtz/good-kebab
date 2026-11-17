"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Boton } from "@/components/base/Boton";
import { Campo, CampoCorreo } from "@/components/base/Campo";
import { Icono } from "@/components/base/Iconos";
import { useGoogleDisponible } from "@/components/useGoogleDisponible";
import { correoValido } from "@/lib/lista";
import { createClient } from "@/lib/supabase/client";
import { destinoSeguro, edadDe, leerFecha, soloDigitos } from "@/lib/acceso-formulario";
import { TIPOS_NEGOCIO } from "@/lib/tipos-negocio";
import { useIdioma } from "@/i18n/Idioma";
import { MarcoAcceso } from "./MarcoAcceso";
import { TURNSTILE_CLAVE, Turnstile, type ManijaTurnstile } from "./Turnstile";

type Modo = "entrar" | "crear";
const ESPERA = 60;

type Respuesta = { estado: number; datos: Record<string, unknown> };
/** POST de JSON a nuestras rutas; si no hay red, estado 0. */
async function enviarJson(ruta: string, cuerpo: unknown): Promise<Respuesta> {
  try {
    const r = await fetch(ruta, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
      credentials: "same-origin",
    });
    const datos = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return { estado: r.status, datos };
  } catch {
    return { estado: 0, datos: {} };
  }
}

/**
 * Entrar y crear cuenta: el mismo diseño y la misma mecánica.
 * Paso 1: correo (y, al crear, los datos opcionales y la casilla de los
 * Términos). Paso 2: el código de 6 dígitos que llegó al correo.
 * Con Google, directo. Los errores salen junto al campo o arriba, siempre
 * en español sencillo (nunca el texto técnico del servidor).
 */
export function FormularioAcceso({ modo, errorInicial = false }: { modo: Modo; errorInicial?: boolean }) {
  const { d } = useIdioma();
  const A = d.acceso;
  const M = A[modo];
  const E = A.errores;
  const crear = modo === "crear";
  const supabase = useMemo(() => createClient(), []);
  const google = useGoogleDisponible();

  const [paso, setPaso] = useState<1 | 2>(1);
  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [nacimiento, setNacimiento] = useState("");
  const [negocio, setNegocio] = useState("");
  const [tipo, setTipo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [trampa, setTrampa] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [espera, setEspera] = useState(0);
  const [errores, setErrores] = useState<Partial<Record<"correo" | "nacimiento" | "telefono" | "acepta" | "codigo", string>>>({});
  const [aviso, setAviso] = useState<string | null>(errorInicial ? A.noInicio : null);
  const [info, setInfo] = useState<string | null>(null);

  const correoRef = useRef<HTMLInputElement>(null);
  const nacRef = useRef<HTMLInputElement>(null);
  const telRef = useRef<HTMLInputElement>(null);
  const aceptaRef = useRef<HTMLInputElement>(null);
  const codigoRef = useRef<HTMLInputElement>(null);
  const turnstile = useRef<ManijaTurnstile>(null);
  const vieneDelPaso2 = useRef(false);

  // Al cambiar de paso, el foco va al campo que toca
  useEffect(() => {
    if (paso === 2) {
      vieneDelPaso2.current = true;
      codigoRef.current?.focus();
    } else if (vieneDelPaso2.current) {
      vieneDelPaso2.current = false;
      correoRef.current?.focus();
    }
  }, [paso]);

  // Cuenta regresiva del reenvío
  useEffect(() => {
    if (espera <= 0) return;
    const id = window.setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [espera]);

  function limpiar(campo: keyof typeof errores) {
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
  }

  function mensajeDeEstado(r: Respuesta) {
    if (r.estado === 0) return E.sinConexion;
    if (r.estado === 429) return E.muchos;
    if (r.estado === 503) return E.servicio;
    return E.noSeEnvio;
  }

  /** Pide el código. `reenvio` no revisa de nuevo el formulario (ya se revisó). */
  async function pedirCodigo(reenvio: boolean) {
    if (enviando) return;
    setAviso(null);
    setInfo(null);
    if (!reenvio) {
      const e: typeof errores = {};
      let primero: HTMLElement | null = null;
      const marcar = (campo: keyof typeof errores, texto: string, el: HTMLElement | null) => {
        e[campo] = texto;
        primero ??= el;
      };
      if (!correo.trim()) marcar("correo", E.escribeCorreo, correoRef.current);
      else if (!correoValido(correo)) marcar("correo", E.revisaCorreo, correoRef.current);
      if (crear) {
        if (nacimiento) {
          const edad = edadDe(nacimiento);
          if (!leerFecha(nacimiento) || edad === null) {
            setAbierto(true);
            marcar("nacimiento", E.fechaInvalida, nacRef.current);
          } else if (edad < 18) {
            setAbierto(true);
            marcar("nacimiento", E.menor, nacRef.current);
          }
        }
        if (telefono && telefono.replace(/\D/g, "").length < 8) {
          setAbierto(true);
          marcar("telefono", E.telefono, telRef.current);
        }
        if (!acepta) marcar("acepta", E.aceptar, aceptaRef.current);
      }
      if (Object.keys(e).length) {
        setErrores(e);
        // Los campos del bloque desplegable necesitan un cuadro para existir antes de enfocarlos
        window.setTimeout(() => (primero as HTMLElement | null)?.focus(), 0);
        return;
      }
      setErrores({});
    }
    if (TURNSTILE_CLAVE && !token) {
      setAviso(E.verificacion);
      return;
    }
    setEnviando(true);
    const datos = crear
      ? Object.fromEntries(
          Object.entries({
            nombre: nombre.trim(),
            nacimiento,
            negocio: negocio.trim(),
            tipo,
            telefono: telefono.trim(),
          }).filter(([, v]) => v),
        )
      : undefined;
    const r = await enviarJson("/api/acceso/codigo", {
      correo: correo.trim(),
      modo,
      ...(datos && Object.keys(datos).length ? { datos } : {}),
      ...(crear ? { acepta } : {}),
      sitio_web: trampa,
      ...(token ? { turnstile: token } : {}),
    });
    setEnviando(false);
    turnstile.current?.reiniciar();
    if (r.estado === 200 && r.datos.ok === true) {
      setCodigo("");
      setErrores({});
      setEspera(ESPERA);
      if (reenvio) setInfo(A.paso2.reenviado);
      setPaso(2);
      return;
    }
    if (r.estado === 400) {
      const campo = r.datos.campo;
      if (campo === "correo") {
        setPaso(1);
        setErrores({ correo: E.revisaCorreo });
        return;
      }
      if (campo === "nacimiento") {
        setAbierto(true);
        setPaso(1);
        setErrores({ nacimiento: E.menor });
        return;
      }
      if (campo === "telefono") {
        setAbierto(true);
        setPaso(1);
        setErrores({ telefono: E.telefono });
        return;
      }
      if (campo === "acepta") {
        setPaso(1);
        setErrores({ acepta: E.aceptar });
        return;
      }
      setAviso(E.noSeEnvio);
      return;
    }
    setAviso(mensajeDeEstado(r));
  }

  async function verificar(valor: string) {
    if (verificando) return;
    if (valor.length < 6) {
      setErrores({ codigo: E.codigoIncompleto });
      return;
    }
    setVerificando(true);
    setAviso(null);
    setErrores({});
    const r = await enviarJson("/api/acceso/verificar", { correo: correo.trim(), codigo: valor });
    if (r.estado === 200 && r.datos.ok === true) {
      // Navegación completa: así el servidor lee las cookies nuevas
      window.location.assign(destinoSeguro(r.datos.destino));
      return;
    }
    setVerificando(false);
    setCodigo("");
    if (r.estado === 400) setErrores({ codigo: E.codigoMal });
    else setAviso(r.estado === 429 ? E.muchos : r.estado === 0 ? E.sinConexion : E.servicio);
    codigoRef.current?.focus();
  }

  async function conGoogle() {
    setAviso(null);
    if (crear) {
      if (!acepta) {
        setErrores({ acepta: E.aceptar });
        aceptaRef.current?.focus();
        return;
      }
      const r = await enviarJson("/api/acceso/acepto", { acepta: true });
      if (r.estado !== 200) {
        setAviso(mensajeDeEstado(r));
        return;
      }
    }
    // Al entrar solo se pide lo básico (correo y nombre); Gmail se pide aparte al conectarlo.
    const { error } = await supabase.auth
      .signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } })
      .catch(() => ({ error: new Error("red") }));
    if (error) setAviso(E.google);
  }

  function alEnviar(ev: FormEvent) {
    ev.preventDefault();
    if (paso === 1) void pedirCodigo(false);
    else void verificar(codigo);
  }

  const idAviso = "acceso-aviso";
  return (
    <MarcoAcceso
      titulo={paso === 1 ? M.titulo : A.paso2.titulo}
      texto={paso === 1 ? M.texto : undefined}
      notaPrivada
      pie={
        paso === 1 ? (
          <p>
            {M.pregunta}{" "}
            <Link href={M.href} className="acc__enlace">
              {M.enlace}
            </Link>
          </p>
        ) : null
      }
    >
      {aviso ? (
        <div role="alert" id={idAviso} className="acc__aviso">
          <Icono nombre="alerta" tam={16} className="acc__aviso-icono" />
          <p>{aviso}</p>
        </div>
      ) : null}

      <form noValidate onSubmit={alEnviar} className="acc__formulario" aria-label={paso === 1 ? M.formulario : A.paso2.titulo}>
        {paso === 1 ? (
          <>
            <CampoCorreo
              ref={correoRef}
              etiqueta={A.correo}
              name="email"
              value={correo}
              alCambiar={(v) => {
                setCorreo(v);
                limpiar("correo");
              }}
              error={errores.correo}
              readOnly={enviando}
              required
              autoFocus={false}
              enterKeyHint="next"
            />

            {crear ? (
              <details className="acc__mas" open={abierto} onToggle={(e) => setAbierto(e.currentTarget.open)}>
                <summary>
                  <span>{A.opcionales}</span>
                  <Icono nombre="chevron" tam={16} className="acc__mas-flecha" />
                </summary>
                <div className="acc__mas-campos">
                  <Campo etiqueta={A.nombre} name="nombre" value={nombre} alCambiar={setNombre} autoComplete="name" maxLength={120} />
                  <Campo
                    ref={nacRef}
                    etiqueta={A.nacimiento}
                    name="nacimiento"
                    type="date"
                    placeholder=" "
                    value={nacimiento}
                    alCambiar={(v) => {
                      setNacimiento(v);
                      limpiar("nacimiento");
                    }}
                    max={new Date().toISOString().slice(0, 10)}
                    autoComplete="bday"
                    error={errores.nacimiento}
                  />
                  <Campo etiqueta={A.negocio} name="negocio" value={negocio} alCambiar={setNegocio} autoComplete="organization" maxLength={160} />
                  <div className="entrada entrada--flota">
                    <div className="entrada__caja">
                      <select
                        id="acceso-tipo"
                        name="tipo"
                        className="entrada__control acc__select"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                      >
                        <option value="">{A.tipoVacio}</option>
                        {TIPOS_NEGOCIO.map((g) => (
                          <optgroup key={g.grupo} label={g.grupo}>
                            {g.tipos.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nombre}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <label htmlFor="acceso-tipo" className="entrada__etiqueta">
                        {A.tipo}
                      </label>
                      <Icono nombre="chevron" tam={16} className="acc__select-flecha" />
                    </div>
                  </div>
                  <Campo
                    ref={telRef}
                    etiqueta={A.telefono}
                    name="telefono"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={telefono}
                    alCambiar={(v) => {
                      setTelefono(v);
                      limpiar("telefono");
                    }}
                    maxLength={30}
                    error={errores.telefono}
                  />
                </div>
              </details>
            ) : null}

            {crear ? (
              <div className="acc__casilla-grupo">
                <label className="acc__casilla">
                  <input
                    ref={aceptaRef}
                    type="checkbox"
                    name="acepta"
                    checked={acepta}
                    required
                    aria-invalid={errores.acepta ? true : undefined}
                    aria-describedby={errores.acepta ? "acceso-acepta-error" : undefined}
                    onChange={(e) => {
                      setAcepta(e.target.checked);
                      limpiar("acepta");
                    }}
                  />
                  <span className="acc__casilla-caja" aria-hidden="true">
                    <Icono nombre="check" tam={14} />
                  </span>
                  <span>
                    {A.aceptoAntes}
                    <Link href="/terminos" className="acc__enlace" target="_blank">
                      {A.terminos}
                    </Link>
                    {A.aceptoY}
                    <Link href="/privacidad" className="acc__enlace" target="_blank">
                      {A.privacidad}
                    </Link>
                  </span>
                </label>
                {errores.acepta ? (
                  <p id="acceso-acepta-error" className="acc__error-campo">
                    <Icono nombre="alerta" tam={16} />
                    <span role="alert">{errores.acepta}</span>
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Campo trampa: las personas y los lectores de pantalla no lo ven; un robot lo llena */}
            <div className="acc__trampa" aria-hidden="true">
              <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" value={trampa} onChange={(e) => setTrampa(e.target.value)} />
            </div>

            <Turnstile ref={turnstile} alToken={setToken} etiqueta={A.seguridad} />

            <Boton type="submit" variante="principal" tam="grande" bloque cargando={enviando}>
              {enviando ? A.enviando : A.siguiente}
            </Boton>
            {google ? (
              <>
                <p className="acc__o">
                  <span>{A.o}</span>
                </p>
                <Boton variante="fantasma" tam="grande" bloque onClick={conGoogle}>
                  {A.google}
                </Boton>
              </>
            ) : null}
          </>
        ) : (
          <>
            <p className="acc__texto acc__texto--paso">
              {A.paso2.mandamos}
              <strong className="acc__correo">{correo.trim()}</strong>
            </p>
            <Campo
              ref={codigoRef}
              etiqueta={A.paso2.codigo}
              name="codigo"
              className="acc__codigo"
              value={codigo}
              alCambiar={(v) => {
                const limpio = soloDigitos(v);
                setCodigo(limpio);
                limpiar("codigo");
                if (limpio.length === 6) void verificar(limpio);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              enterKeyHint="done"
              readOnly={verificando}
              required
              error={errores.codigo}
            />
            {info && !errores.codigo ? (
              <p role="status" className="acc__info">
                {info}
              </p>
            ) : null}
            <Boton type="submit" variante="principal" tam="grande" bloque cargando={verificando}>
              {verificando ? A.paso2.verificando : A.siguiente}
            </Boton>
            <Turnstile ref={turnstile} alToken={setToken} etiqueta={A.seguridad} />
            <div className="acc__acciones">
              <button
                type="button"
                className="acc__enlace-boton"
                disabled={espera > 0 || enviando || verificando}
                onClick={() => void pedirCodigo(true)}
              >
                {espera > 0 ? A.paso2.reenviarEn(espera) : A.paso2.reenviar}
              </button>
              <button
                type="button"
                className="acc__enlace-boton"
                onClick={() => {
                  setPaso(1);
                  setCodigo("");
                  setErrores({});
                  setAviso(null);
                  setInfo(null);
                }}
              >
                {A.paso2.otroCorreo}
              </button>
            </div>
            <p className="acc__pista">{A.paso2.enlace}</p>
          </>
        )}
      </form>
    </MarcoAcceso>
  );
}
