"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Marca } from "@/components/Logo";
import { Boton } from "@/components/base/Boton";
import { CampoCorreo } from "@/components/base/Campo";
import { Halo } from "@/components/base/Halo";
import { Icono } from "@/components/base/Iconos";
import { useGoogleDisponible } from "@/components/useGoogleDisponible";
import { correoValido } from "@/lib/lista";
import { createClient } from "@/lib/supabase/client";
import type { Diccionario } from "@/i18n";
import { useIdioma } from "@/i18n/Idioma";

/** Lo que dice Supabase, en el idioma de la página y con qué hacer (nunca el texto técnico). */
function traducirError(error: { message: string; code?: string }, E: Diccionario["entrar"]) {
  const texto = `${error.code ?? ""} ${error.message}`;
  if (/rate|seconds|segundos/i.test(texto)) return E.variosLinks;
  if (/fetch|network|conex/i.test(texto)) return E.sinConexion;
  if (/invalid|email/i.test(texto)) return E.correoNoValido;
  return E.noSeEnvio;
}

/**
 * Entrar con un link al correo (sin contraseña) o con Google si está disponible.
 * Presentación como la página de inicio de sesión de GitHub (solo el estilo):
 * la marca arriba, el título, un aviso de error encima de la tarjeta, la
 * tarjeta centrada con el formulario y, abajo, una nota para quien entra por
 * primera vez. La lógica de Supabase es la de siempre.
 */
export function Login({ errorInicial }: { errorInicial: boolean }) {
  const { d } = useIdioma();
  const E = d.entrar;
  const supabase = useMemo(() => createClient(), []);
  const google = useGoogleDisponible();
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const [error, setError] = useState<string | null>(
    errorInicial ? E.noInicio : null,
  );
  /** Error del correo escrito: se muestra junto al campo (aria-invalid y aria-describedby los pone Campo). */
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const correoRef = useRef<HTMLInputElement>(null);
  const venimosDeEnviado = useRef(false);

  // Al cambiar de paso, el foco va a lo nuevo (el título del aviso, o el correo al volver)
  useEffect(() => {
    if (estado === "enviado") {
      venimosDeEnviado.current = true;
      tituloRef.current?.focus();
    } else if (estado === "idle" && venimosDeEnviado.current) {
      venimosDeEnviado.current = false;
      correoRef.current?.focus();
    }
  }, [estado]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (estado === "enviando") return;
    // Se revisa aquí, en español, antes de pedir el link (sin el globo del navegador)
    const problema = !email.trim() ? E.escribeCorreo : !correoValido(email) ? E.revisaCorreo : null;
    if (problema) {
      setError(null);
      setErrorCampo(problema);
      correoRef.current?.focus();
      return;
    }
    setEstado("enviando");
    setError(null);
    setErrorCampo(null);
    // Si algo truena (sin red, sin servicio), el botón no se queda girando: vuelve con un aviso
    const { error } = await supabase.auth
      .signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      .catch((e: unknown) => ({ error: { message: e instanceof Error ? e.message : "fetch" } }));
    if (error) {
      setEstado("idle");
      const texto = traducirError(error, E);
      if (texto === E.correoNoValido) {
        setErrorCampo(texto);
        correoRef.current?.focus();
      } else {
        setError(texto);
      }
    } else {
      setEstado("enviado");
    }
  }

  async function entrarConGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Solo lectura de Gmail: nunca se pide permiso de enviar o borrar
        scopes: "https://www.googleapis.com/auth/gmail.readonly",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  const enviado = estado === "enviado";

  return (
    <section className="acceso con-halo" aria-labelledby="acceso-titulo">
      <Halo suave y="32%" />
      <div className="acceso__columna">
        <Link href="/" className="acceso__marca" aria-label={E.inicio}>
          <Marca className="acceso__marca-svg" />
        </Link>
        <h1 id="acceso-titulo" ref={tituloRef} tabIndex={-1} className="acceso__titulo">
          {enviado ? E.tituloEnviado : E.titulo}
        </h1>

        {error && !enviado ? (
          <div role="alert" className="acceso__aviso">
            <Icono nombre="alerta" tam={16} className="acceso__aviso-icono" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="acceso__tarjeta">
          {!enviado ? (
            <form key="formulario" noValidate onSubmit={enviar} className="acceso__formulario" aria-label={E.formulario}>
              <CampoCorreo
                ref={correoRef}
                etiqueta={E.correo}
                name="email"
                value={email}
                alCambiar={(v) => {
                  setEmail(v);
                  if (errorCampo) setErrorCampo(null);
                }}
                error={errorCampo}
                readOnly={estado === "enviando"}
                required
                ayuda={E.ayuda}
              />
              <Boton type="submit" variante="principal" tam="grande" bloque cargando={estado === "enviando"}>
                {estado === "enviando" ? E.enviando : E.enviar}
              </Boton>
              {google ? (
                <>
                  <p className="acceso__o">
                    <span>{E.o}</span>
                  </p>
                  <Boton variante="sutil" tam="grande" bloque onClick={entrarConGoogle}>
                    {E.google}
                  </Boton>
                </>
              ) : null}
            </form>
          ) : (
            <div key="enviado" role="status" className="acceso__enviado">
              <p className="acceso__sello">
                <Icono nombre="correo" tam={16} />
                {E.linkEnviado}
              </p>
              <p className="acceso__texto">
                {E.mandamosA}
                <strong className="acceso__correo">{email}</strong>
                {E.abrelo}
              </p>
              <p className="acceso__pista">{E.noLlega}</p>
              <Boton variante="fantasma" tam="grande" bloque onClick={() => setEstado("idle")}>
                {E.otroCorreo}
              </Boton>
            </div>
          )}
        </div>

        <p className="acceso__nota">
          {E.primeraVez}{" "}
          <Link href="/precios" className="acceso__enlace">
            {E.verPlanes}
          </Link>
        </p>
      </div>
    </section>
  );
}
