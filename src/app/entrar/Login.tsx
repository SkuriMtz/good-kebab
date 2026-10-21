"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Marca } from "@/components/Logo";
import { Boton } from "@/components/base/Boton";
import { CampoCorreo } from "@/components/base/Campo";
import { Halo } from "@/components/base/Halo";
import { Icono } from "@/components/base/Iconos";
import { useGoogleDisponible } from "@/components/useGoogleDisponible";
import { createClient } from "@/lib/supabase/client";

function traducirError(error: { message: string; code?: string }) {
  const texto = `${error.code ?? ""} ${error.message}`;
  if (/rate|seconds|segundos/i.test(texto)) {
    return "Pediste varios links seguidos. Espera un minuto y vuelve a intentar.";
  }
  if (/invalid|email/i.test(texto)) {
    return "Ese correo no parece válido. Revisa que esté bien escrito.";
  }
  return `No se pudo enviar el link: ${error.message}`;
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
    setEstado("enviando");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setEstado("idle");
      setError(traducirError(error));
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

        <div className="acceso__tarjeta" aria-live="polite">
          {!enviado ? (
            <form key="formulario" onSubmit={enviar} className="acceso__formulario">
              <CampoCorreo
                ref={correoRef}
                etiqueta="Correo electrónico"
                name="email"
                value={email}
                alCambiar={setEmail}
                required
                ayuda="Te mandamos un link para entrar. Sin contraseña."
              />
              <Boton type="submit" variante="principal" tam="grande" bloque cargando={estado === "enviando"}>
                {estado === "enviando" ? "Enviando" : "Enviarme el link"}
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
            <div key="enviado" className="acceso__enviado">
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
