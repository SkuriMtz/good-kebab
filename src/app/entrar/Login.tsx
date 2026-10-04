"use client";

import { useMemo, useState, type FormEvent } from "react";
import { claseBoton, Spinner } from "@/components/Buttons";
import { MarcasAgentes } from "@/components/agentes/MarcasAgentes";
import { Field } from "@/components/ui/Field";
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

/** Entrar con un link al correo (sin contraseña) o con Google si está disponible. */
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

  return (
    <section className="contenedor dos-columnas pb-[var(--spacing-96)] pt-[var(--spacing-36)] lg:pt-[var(--spacing-96)]">
      <div className="w-full max-w-[520px]" aria-live="polite">
        {estado !== "enviado" ? (
          <div key="formulario">
            <p className="t-etiqueta">Entrar</p>
            <h1 className="t-display mt-[var(--spacing-18)]">Entra a Atendel.</h1>
            <p className="t-editorial mt-[var(--spacing-18)] max-w-[420px]">
              Escribe tu correo y te mandamos un link para entrar. Sin contraseñas.
            </p>
            <form onSubmit={enviar} className="mt-[var(--spacing-36)] flex flex-col gap-[var(--spacing-18)]">
              <Field
                label="Tu correo"
                name="email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="tu@correo.com"
                autoComplete="email"
                inputMode="email"
                required
              />
              <button type="submit" className={`${claseBoton("primario", "grande")} w-full`} disabled={estado === "enviando"}>
                {estado === "enviando" ? (
                  <>
                    <Spinner />
                    Enviando
                  </>
                ) : (
                  "Enviarme el link"
                )}
              </button>
              {google ? (
                <button type="button" className={`${claseBoton("suave", "grande")} w-full`} onClick={entrarConGoogle}>
                  Continuar con Google
                </button>
              ) : null}
              {error ? (
                <p role="alert" className="flex items-start gap-2 text-[0.9375rem] text-error">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 4.8v3.6M8 10.9v.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  {error}
                </p>
              ) : null}
            </form>
          </div>
        ) : (
          <div key="enviado">
            <p className="t-etiqueta">Link enviado</p>
            <h1 className="t-display mt-[var(--spacing-18)]">Revisa tu correo.</h1>
            <p className="t-cuerpo mt-4">
              Te mandamos un link a <span className="font-semibold text-tinta">{email}</span>. Ábrelo en este mismo navegador
              para entrar.
            </p>
            <p className="t-chico mt-3">¿No llega? Revisa Spam o Promociones. Puede tardar un par de minutos.</p>
            <button type="button" className={`${claseBoton("texto")} mt-6`} onClick={() => setEstado("idle")}>
              Usar otro correo
            </button>
          </div>
        )}
      </div>
      <div className="mx-auto hidden w-full max-w-[420px] lg:mr-0 lg:block">
        <MarcasAgentes />
      </div>
    </section>
  );
}
