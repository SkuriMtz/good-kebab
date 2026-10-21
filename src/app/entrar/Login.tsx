"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { PERSONAJES, Personaje } from "@/components/agentes/Personaje";
import { Boton } from "@/components/base/Boton";
import { CampoCorreo } from "@/components/base/Campo";
import { Icono } from "@/components/base/Iconos";
import { PuntoEstado } from "@/components/base/PuntoEstado";
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

/** Los cuatro agentes encimados, como los avatares de un equipo (son los cuatro círculos del logo). */
function Equipo() {
  return (
    <ul className="entrar__equipo" aria-hidden="true">
      {AGENTES_INFO.map((a) => (
        <li key={a.id} className="marca-agente marca-agente--chica entrar__miembro" style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}>
          <Personaje agente={a.id} avatar />
        </li>
      ))}
    </ul>
  );
}

/**
 * Entrar con un link al correo (sin contraseña) o con Google si está
 * disponible. Mismo lenguaje que el panel: columna angosta y centrada,
 * tarjeta sólida con borde de 1px y radio de 16px, un solo botón azul.
 * La lógica de inicio de sesión (Supabase) es la de siempre; solo cambió
 * cómo se ve.
 */
export function Login({ errorInicial }: { errorInicial: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const google = useGoogleDisponible();
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const [hora, setHora] = useState("");
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
      setHora(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }));
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
    <section className="entrar" aria-labelledby="entrar-titulo">
      <div className="entrar__columna">
        <Equipo />

        <div aria-live="polite">
          {!enviado ? (
            <div key="formulario">
              <h1 id="entrar-titulo" className="entrar__titulo">
                Entra a Atendel
              </h1>
              <p className="entrar__sub">Te mandamos un link a tu correo para entrar. Sin contraseñas.</p>

              <div className="entrar__tarjeta">
                <form onSubmit={enviar} className="entrar__formulario">
                  <CampoCorreo name="email" value={email} alCambiar={setEmail} required disabled={estado === "enviando"} />
                  <Boton type="submit" variante="principal" tam="grande" bloque cargando={estado === "enviando"}>
                    {estado === "enviando" ? "Enviando" : "Enviarme el link"}
                  </Boton>
                  {google ? (
                    <>
                      <p className="entrar__o" aria-hidden="true">
                        <span>o</span>
                      </p>
                      <Boton type="button" variante="sutil" tam="grande" bloque onClick={entrarConGoogle}>
                        Continuar con Google
                      </Boton>
                    </>
                  ) : null}
                  {error ? (
                    <p role="alert" className="entrar__error">
                      <Icono nombre="alerta" tam={16} />
                      <span>{error}</span>
                    </p>
                  ) : null}
                </form>
              </div>

              <p className="entrar__nota">
                ¿Primera vez? Tu cuenta se crea sola al entrar, con el plan Free.{" "}
                <Link href="/precios" className="entrar__enlace">
                  Ver los planes
                </Link>
              </p>
            </div>
          ) : (
            <div key="enviado">
              <h1 id="entrar-titulo" className="entrar__titulo">
                Revisa tu correo
              </h1>
              <p className="entrar__sub">
                Te mandamos un link a <strong className="entrar__correo">{email}</strong>
              </p>

              <div className="entrar__tarjeta">
                <p className="entrar__estado">
                  <PuntoEstado tono="exito" etiqueta="Link enviado" mostrarEtiqueta />
                  {hora ? <span className="entrar__hora">{hora}</span> : null}
                </p>
                <ol className="entrar__pasos">
                  <li>
                    <span className="entrar__paso" aria-hidden="true">
                      1
                    </span>
                    Abre el correo que te acabamos de mandar.
                  </li>
                  <li>
                    <span className="entrar__paso" aria-hidden="true">
                      2
                    </span>
                    Toca el link en este mismo navegador y ya estás adentro.
                  </li>
                </ol>
                <p className="entrar__ayuda">¿No llega? Revisa Spam o Promociones. Puede tardar un par de minutos.</p>
              </div>

              <p className="entrar__nota">
                ¿Te equivocaste de correo?{" "}
                <button type="button" className="entrar__enlace" onClick={() => setEstado("idle")}>
                  Usar otro correo
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
