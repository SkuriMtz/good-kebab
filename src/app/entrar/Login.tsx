"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Arrow, Roll, TriSpinner } from "@/components/Buttons";
import { Nav } from "@/components/Nav";
import { ParticleShape } from "@/components/particles/ParticleShape";
import { Reveal, SplitText } from "@/components/Reveal";
import { Field } from "@/components/ui/Field";
import { useGoogleDisponible } from "@/components/useGoogleDisponible";
import { createClient } from "@/lib/supabase/client";

const SECCIONES = [
  { href: "/#agentes", label: "Agentes" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#seguridad", label: "Seguridad" },
];
const COLORES = ["#8052ff", "#8052ff", "#a98bff", "#4d7cff", "#1fc7a4", "#f29d0a"];

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

export function Login({ errorInicial }: { errorInicial: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const google = useGoogleDisponible();
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const [error, setError] = useState<string | null>(
    errorInicial ? "No se pudo iniciar sesión. Pide un link nuevo y ábrelo en este mismo navegador." : null,
  );
  const [intento, setIntento] = useState(0);

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
      setIntento((n) => n + 1);
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
    <>
      <Nav items={SECCIONES} />
      <main className="mx-auto grid min-h-[100svh] max-w-page grid-cols-1 items-center gap-12 px-6 pb-16 pt-[128px] lg:grid-cols-2 lg:gap-20 lg:px-10 lg:pt-[72px]">
        <div aria-live="polite">
          {estado !== "enviado" ? (
            <div key="formulario">
              <Reveal as="p" className="eyebrow text-saffron">
                Entrar
              </Reveal>
              <SplitText as="h1" className="mt-5 text-heading-lg" text="Entra a Atendel." />
              <Reveal as="p" delay={200} className="mt-6 max-w-[440px] text-body text-silver">
                Escribe tu correo y te mandamos un link para entrar. Sin contraseñas.
              </Reveal>
              <Reveal delay={320}>
                <form onSubmit={enviar} className="mt-10 max-w-[440px] space-y-8">
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
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    <button
                      key={intento}
                      type="submit"
                      className={`btn-pill min-w-[236px] ${intento ? "shake" : ""}`}
                      disabled={estado === "enviando"}
                    >
                      {estado === "enviando" ? (
                        <>
                          <TriSpinner />
                          <span>Enviando</span>
                        </>
                      ) : (
                        <>
                          <Roll>Enviarme el link</Roll>
                          <Arrow />
                        </>
                      )}
                    </button>
                    {google ? (
                      <button type="button" className="btn-ghost" onClick={entrarConGoogle}>
                        <Roll>Continuar con Google</Roll>
                      </button>
                    ) : null}
                  </div>
                  {error ? (
                    <p key={`e${intento}`} role="alert" className="swap-in flex items-start gap-3 text-body text-saffron">
                      <svg className="mt-1.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 2 20.66 17H3.34Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                      </svg>
                      {error}
                    </p>
                  ) : null}
                </form>
              </Reveal>
            </div>
          ) : (
            <div key="enviado" className="swap-in">
              <p className="eyebrow text-saffron">Link enviado</p>
              <h1 className="mt-5 text-heading-lg">Revisa tu correo.</h1>
              <p className="mt-6 max-w-[460px] text-body text-silver">
                Te mandamos un link a <span className="font-normal text-bone">{email}</span>. Ábrelo en este mismo
                navegador para entrar.
              </p>
              <p className="mt-4 max-w-[460px] text-body text-ash">
                ¿No llega? Revisa Spam o Promociones. Puede tardar un par de minutos.
              </p>
              <button type="button" className="btn-ghost mt-8" onClick={() => setEstado("idle")}>
                <Roll>Usar otro correo</Roll>
              </button>
            </div>
          )}
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[300px] lg:max-w-[520px]">
          <ParticleShape
            shape={estado === "enviado" ? "check" : "mail"}
            busy={estado === "enviando"}
            scrollLinked={false}
            colors={COLORES}
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </main>
    </>
  );
}
