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

/** Este error es del correo escrito: va junto al campo, no en el aviso de arriba. */
const CORREO_NO_VALIDO = "Ese correo no parece válido. Revisa que esté bien escrito.";

/** Lo que dice Supabase, en español y con qué hacer (nunca el texto técnico en inglés). */
function traducirError(error: { message: string; code?: string }) {
  const texto = `${error.code ?? ""} ${error.message}`;
  if (/rate|seconds|segundos/i.test(texto)) {
    return "Pediste varios links seguidos. Espera un minuto y vuelve a intentar.";
  }
  if (/fetch|network|conex/i.test(texto)) {
    return "No hay conexión. Revisa tu internet e intenta de nuevo.";
  }
  if (/invalid|email/i.test(texto)) {
    return CORREO_NO_VALIDO;
  }
  return "No se pudo enviar el link. Intenta de nuevo en un momento.";
}

/**
 * Entrar con un link al correo (sin contraseña) o con Google si está disponible.
 * Presentación como la página de inicio de sesión de GitHub (solo el estilo):
 * la marca arriba, el título, un aviso de error encima de la tarjeta, la
 * tarjeta centrada con el formulario y, abajo, una nota para quien entra por
 * primera vez. La lógica de Supabase es la de siempre.
 */
export function Login({ errorInicial }: { errorInicial: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const google = useGoogleDisponible();
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const [error, setError] = useState<string | null>(
    errorInicial ? "No se pudo iniciar sesión. Pide un link nuevo y ábrelo en este mismo navegador." : null,
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
    const problema = !email.trim()
      ? "Escribe tu correo para mandarte el link."
      : !correoValido(email)
        ? "Revisa tu correo: parece que le falta algo (por ejemplo, nombre@negocio.com)."
        : null;
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
      const texto = traducirError(error);
      if (texto === CORREO_NO_VALIDO) {
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
        <Link href="/" className="acceso__marca" aria-label="Atendel, inicio">
          <Marca className="acceso__marca-svg" />
        </Link>
        <h1 id="acceso-titulo" ref={tituloRef} tabIndex={-1} className="acceso__titulo">
          {enviado ? "Revisa tu correo" : "Entra a Atendel"}
        </h1>

        {error && !enviado ? (
          <div role="alert" className="acceso__aviso">
            <Icono nombre="alerta" tam={16} className="acceso__aviso-icono" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="acceso__tarjeta">
          {!enviado ? (
            <form key="formulario" noValidate onSubmit={enviar} className="acceso__formulario" aria-label="Entrar con tu correo">
              <CampoCorreo
                ref={correoRef}
                etiqueta="Correo electrónico"
                name="email"
                value={email}
                alCambiar={(v) => {
                  setEmail(v);
                  if (errorCampo) setErrorCampo(null);
                }}
                error={errorCampo}
                readOnly={estado === "enviando"}
                required
                ayuda="Te mandamos un link para entrar. Sin contraseña."
              />
              <Boton type="submit" variante="principal" tam="grande" bloque cargando={estado === "enviando"}>
                {estado === "enviando" ? "Enviando…" : "Enviarme el link"}
              </Boton>
              {google ? (
                <>
                  <p className="acceso__o">
                    <span>o</span>
                  </p>
                  <Boton variante="sutil" tam="grande" bloque onClick={entrarConGoogle}>
                    Continuar con Google
                  </Boton>
                </>
              ) : null}
            </form>
          ) : (
            <div key="enviado" role="status" className="acceso__enviado">
              <p className="acceso__sello">
                <Icono nombre="correo" tam={16} />
                Link enviado
              </p>
              <p className="acceso__texto">
                Te mandamos un link a <strong className="acceso__correo">{email}</strong>. Ábrelo en este mismo navegador
                para entrar.
              </p>
              <p className="acceso__pista">¿No llega? Revisa Spam o Promociones. Puede tardar un par de minutos.</p>
              <Boton variante="fantasma" tam="grande" bloque onClick={() => setEstado("idle")}>
                Usar otro correo
              </Boton>
            </div>
          )}
        </div>

        <p className="acceso__nota">
          ¿Primera vez? Escribe tu correo y tu cuenta se crea al entrar, con el plan Free.{" "}
          <Link href="/precios" className="acceso__enlace">
            Ver los planes
          </Link>
        </p>
      </div>
    </section>
  );
}
