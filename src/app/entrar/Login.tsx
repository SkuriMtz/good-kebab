"use client";

import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Boton } from "@/components/base/Boton";
import { CampoCorreo } from "@/components/base/Campo";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Icono } from "@/components/base/Iconos";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { PERSONAJES, Personaje } from "@/components/agentes/Personaje";
import { useGoogleDisponible } from "@/components/useGoogleDisponible";
import { AGENTES_INFO } from "@/lib/agentes";
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

/** Los cuatro agentes, juntos como una fila de avatares: el equipo que te espera adentro. */
function Equipo() {
  return (
    <ul className="entrar__equipo" aria-hidden="true">
      {AGENTES_INFO.map((a, i) => (
        <li
          key={a.id}
          className="marca-agente marca-agente--chica entrar__miembro"
          style={{ "--agente": PERSONAJES[a.id].color, "--i": i } as CSSProperties}
        >
          <Personaje agente={a.id} avatar />
        </li>
      ))}
    </ul>
  );
}

/**
 * Entrar con un link al correo (sin contraseña) o con Google si está disponible.
 * Una sola columna, centrada: el equipo, el título, la tarjeta con el correo y
 * una nota de qué pasa la primera vez. La lógica de Supabase es la de siempre.
 */
export function Login({ errorInicial }: { errorInicial: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const google = useGoogleDisponible();
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const [error, setError] = useState<string | null>(
    errorInicial ? "No se pudo iniciar sesión. Pide un link nuevo y ábrelo en este mismo navegador." : null,
  );

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
    <section className="entrar con-halo" aria-labelledby="entrar-titulo">
      <Halo y="24%" ancho="min(720px, 140vw)" suave />
      <div className="entrar__columna" aria-live="polite">
        <Equipo />

        {!enviado ? (
          <div key="formulario" className="entrar__paso">
            <h1 id="entrar-titulo" className="t-seccion entrar__titulo">
              Entra a Atendel
            </h1>
            <p className="t-cuerpo entrar__intro">Te mandamos un link a tu correo para entrar. Sin contraseñas.</p>

            <TarjetaVidrio relleno="ninguno" className="entrar__tarjeta">
              <form onSubmit={enviar} className="entrar__form" noValidate={false}>
                {error ? (
                  <div role="alert" className="entrar__aviso">
                    <Icono nombre="alerta" tam={16} className="entrar__aviso-icono" />
                    <p>{error}</p>
                  </div>
                ) : null}
                <CampoCorreo
                  name="email"
                  value={email}
                  alCambiar={setEmail}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  required
                />
                <Boton type="submit" tam="grande" bloque cargando={estado === "enviando"}>
                  {estado === "enviando" ? "Enviando…" : "Enviarme el link"}
                </Boton>
                {google ? (
                  <>
                    <p className="entrar__o">
                      <span>o</span>
                    </p>
                    <Boton type="button" variante="fantasma" tam="grande" bloque onClick={entrarConGoogle}>
                      Continuar con Google
                    </Boton>
                  </>
                ) : null}
              </form>
            </TarjetaVidrio>

            <p className="entrar__nota">
              ¿Es tu primera vez? Con ese mismo link se crea tu cuenta en el plan Free.
            </p>
          </div>
        ) : (
          <div key="enviado" className="entrar__paso">
            <Etiqueta tono="cielo" className="entrar__sello">
              Link enviado
            </Etiqueta>
            <h1 id="entrar-titulo" className="t-seccion entrar__titulo">
              Revisa tu correo
            </h1>
            <p className="t-cuerpo entrar__intro">
              Te mandamos un link a <strong className="entrar__correo">{email.trim()}</strong>. Ábrelo en este mismo navegador
              para entrar.
            </p>

            <TarjetaVidrio relleno="ninguno" className="entrar__tarjeta">
              <ol className="entrar__pasos">
                <li>
                  <span className="entrar__num">1</span>
                  Abre el correo que te acabamos de mandar.
                </li>
                <li>
                  <span className="entrar__num">2</span>
                  Toca el link y entras directo al chat con tu equipo.
                </li>
              </ol>
              <p className="entrar__ayuda">¿No llega? Revisa Spam o Promociones. Puede tardar un par de minutos.</p>
              <Boton type="button" variante="fantasma" bloque onClick={() => setEstado("idle")} icono={<Icono nombre="flecha-izquierda" tam={16} />}>
                Usar otro correo
              </Boton>
            </TarjetaVidrio>
          </div>
        )}
      </div>
    </section>
  );
}
