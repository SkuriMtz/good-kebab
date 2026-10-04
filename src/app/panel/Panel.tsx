"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Arrow, claseBoton, Spinner } from "@/components/Buttons";
import { NavApp } from "@/components/app/NavApp";
import { Personaje } from "@/components/agentes/Personaje";
import { Field } from "@/components/ui/Field";
import { useGoogleDisponible } from "@/components/useGoogleDisponible";
import { createClient } from "@/lib/supabase/client";

type Resultado = { asunto: string; remitente: string; resumen: string; accion: string };

type Guardado = {
  id: string;
  remitente: string | null;
  asunto: string | null;
  resumen: string;
  accion_sugerida: string | null;
  creado_en: string;
};

// Correos de ejemplo para probar sin tener que escribir uno
const EJEMPLOS = [
  {
    etiqueta: "Paciente quiere cita",
    remitente: "Laura Méndez <laura.mendez@gmail.com>",
    asunto: "Cita para limpieza dental",
    contenido:
      "Hola, buenas tardes. Quisiera agendar una limpieza dental para la próxima semana, de preferencia el martes o jueves por la tarde después de las 5. ¿Tienen disponibilidad? También quería saber si aceptan seguro de gastos médicos. Gracias.",
  },
  {
    etiqueta: "Pregunta de precios",
    remitente: "Andrea Ruiz <andrea.ruiz@hotmail.com>",
    asunto: "Precio de depilación láser",
    contenido:
      "Hola! Vi su publicación en Instagram. ¿Cuánto cuesta el paquete de depilación láser de piernas completas? ¿Tienen promoción este mes? Y cuántas sesiones se necesitan normalmente.",
  },
  {
    etiqueta: "Cancelación",
    remitente: "Roberto Salinas <rsalinas@empresa.com.mx>",
    asunto: "No podré ir mañana",
    contenido:
      "Buenos días, les escribo para avisar que no podré asistir a mi consulta de mañana a las 10:00 am por un tema de trabajo. ¿Me podrían reprogramar para el viernes? Una disculpa por el aviso tan tarde.",
  },
];

const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const conSugerencia = (accion: string | null) => Boolean(accion && accion.trim().toLowerCase() !== "ninguna");

/** Correo con Clara: resumir un correo (o uno de ejemplo), Gmail e historial. */
export function Panel({ email, conGoogle }: { email: string; conGoogle: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const googleDisponible = useGoogleDisponible();

  const [saludo, setSaludo] = useState("Hola.");
  const [remitente, setRemitente] = useState("");
  const [asunto, setAsunto] = useState("");
  const [contenido, setContenido] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<Guardado[] | null>(null);
  const [nuevos, setNuevos] = useState<Set<string>>(() => new Set());
  const [gmailCargando, setGmailCargando] = useState(false);
  const [gmailMensaje, setGmailMensaje] = useState<string | null>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);
  const idsPrevios = useRef<Set<string>>(new Set());

  useEffect(() => {
    const hora = new Date().getHours();
    setSaludo(hora < 12 ? "Buenos días." : hora < 19 ? "Buenas tardes." : "Buenas noches.");
  }, []);

  // RLS se encarga de que solo regresen los resúmenes del negocio de quien inició sesión
  const cargarHistorial = useCallback(
    async (marcarNuevos = false) => {
      const { data } = await supabase
        .from("resumenes_correo")
        .select("id, remitente, asunto, resumen, accion_sugerida, creado_en")
        .order("creado_en", { ascending: false })
        .limit(30);
      const lista: Guardado[] = data ?? [];
      if (marcarNuevos) {
        setNuevos(new Set(lista.filter((g) => !idsPrevios.current.has(g.id)).map((g) => g.id)));
      }
      idsPrevios.current = new Set(lista.map((g) => g.id));
      setHistorial(lista);
    },
    [supabase],
  );

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  function usarEjemplo(ejemplo: (typeof EJEMPLOS)[number]) {
    setRemitente(ejemplo.remitente);
    setAsunto(ejemplo.asunto);
    setContenido(ejemplo.contenido);
    setError(null);
  }

  function limpiar() {
    setRemitente("");
    setAsunto("");
    setContenido("");
    setError(null);
  }

  async function resumir(e: FormEvent) {
    e.preventDefault();
    if (cargando) return;
    if (!contenido.trim()) {
      setError("Escribe o pega el contenido del correo.");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/agente-correo/prueba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remitente, asunto, contenido }),
      });
      const datos = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datos.error ?? "Algo salió mal. Intenta de nuevo.");
      setResultado(datos as Resultado);
      cargarHistorial(true);
      requestAnimationFrame(() => {
        const el = resultadoRef.current;
        if (el && el.getBoundingClientRect().top > window.innerHeight * 0.7) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function revisarGmail() {
    setGmailCargando(true);
    setGmailMensaje(null);
    try {
      const res = await fetch("/api/agente-correo", { method: "POST" });
      const datos = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datos.error ?? "No se pudo revisar tu correo.");
      const n: number = datos.procesados ?? 0;
      setGmailMensaje(
        n === 0 ? "No tienes correos nuevos sin leer." : `Listo: resumí ${n} correo${n === 1 ? "" : "s"}. Están en tu historial.`,
      );
      cargarHistorial(true);
    } catch (err) {
      setGmailMensaje(err instanceof Error ? err.message : "No se pudo revisar tu correo.");
    } finally {
      setGmailCargando(false);
    }
  }

  async function conectarGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Solo lectura de Gmail: nunca se pide permiso de enviar o borrar
        scopes: "https://www.googleapis.com/auth/gmail.readonly",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  const hayTexto = Boolean(remitente || asunto || contenido);

  return (
    <>
      <NavApp email={email} />

      <main className="contenedor pb-24 pt-10 sm:pt-12 lg:pt-16">
        <header className="max-w-[760px]">
          <p className="pill">Clara · Correo</p>
          <h1 className="t-display mt-4 !text-[clamp(2.25rem,1.6rem+2.6vw,3.5rem)]">{saludo}</h1>
          <p className="t-editorial mt-4 max-w-[560px]">
            Pega un correo o elige un ejemplo. Atendel te dice de qué trata y qué conviene hacer.
          </p>
        </header>

        {/* ---------- Modo de prueba ---------- */}
        <section id="probar" className="mt-10 grid grid-cols-1 gap-6 lg:mt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="tarjeta !p-6 sm:!p-8">
            <p className="t-etiqueta">Agente de correo</p>
            <h2 className="t-titulo mt-1">Resume un correo</h2>

            <p className="mt-6 text-[0.875rem] font-medium">Ejemplos</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EJEMPLOS.map((ejemplo) => (
                <button key={ejemplo.etiqueta} type="button" className="chip" onClick={() => usarEjemplo(ejemplo)}>
                  {ejemplo.etiqueta}
                </button>
              ))}
            </div>

            <form onSubmit={resumir} className="mt-6 flex flex-col gap-5" noValidate>
              <Field
                label="De"
                name="remitente"
                value={remitente}
                onChange={setRemitente}
                placeholder="Juan Pérez <juan@correo.com>"
                maxLength={300}
              />
              <Field label="Asunto" name="asunto" value={asunto} onChange={setAsunto} placeholder="¿De qué trata?" maxLength={300} />
              <Field
                label="Contenido"
                name="contenido"
                value={contenido}
                onChange={setContenido}
                placeholder="Pega aquí el texto del correo"
                multiline
                maxLength={5000}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className={claseBoton("primario", "grande")} disabled={cargando}>
                  {cargando ? (
                    <>
                      <Spinner />
                      Procesando
                    </>
                  ) : (
                    "Resumir con IA"
                  )}
                </button>
                {hayTexto && !cargando ? (
                  <button type="button" className={claseBoton("texto", "grande")} onClick={limpiar}>
                    Limpiar
                  </button>
                ) : null}
              </div>
              {error ? (
                <p role="alert" className="text-[0.9375rem] text-error">
                  {error}
                </p>
              ) : null}
            </form>
          </div>

          <div className="lg:sticky lg:top-[calc(var(--barra-h)+24px)] lg:self-start">
            <div
              ref={resultadoRef}
              aria-live="polite"
              className="panel-color en-acento"
              style={{ "--acento": "var(--agente-clara)" } as CSSProperties}
            >
              <div className="tarjeta mockup min-h-[240px]">
                {resultado ? (
                  <>
                    <p className="t-etiqueta">Resumen</p>
                    <p className="t-chico mt-2 break-words">
                      {resultado.remitente} · {resultado.asunto}
                    </p>
                    <p className="mt-4 text-[1.125rem] font-semibold leading-snug tracking-[-0.01em]">{resultado.resumen}</p>
                    {conSugerencia(resultado.accion) ? (
                      <p className="mt-4 flex items-start gap-2 text-tinta">
                        <Arrow className="mt-1 text-enlace" />
                        {resultado.accion}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <div className="flex min-h-[190px] flex-col items-center justify-center gap-3 text-center">
                    <span className="marca-agente marca-agente--grande" style={{ "--agente": "var(--agente-clara)" } as CSSProperties}>
                      <Personaje agente="clara" avatar />
                    </span>
                    <p className="t-cuerpo flex items-center gap-2">
                      {cargando ? <Spinner /> : null}
                      {cargando ? "Leyendo el correo…" : "El resumen aparecerá aquí."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Gmail ---------- */}
        <section id="gmail" className="mt-6 lg:mt-8">
          <div className="tarjeta flex flex-col gap-5 !p-6 sm:!p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="t-etiqueta">Gmail</p>
              <h2 className="t-titulo mt-1">Tu bandeja de entrada</h2>
              <p className="t-cuerpo mt-2 max-w-[480px]">
                Conecta tu Gmail y Atendel resume tus correos sin leer. Solo lectura: nunca envía ni borra nada.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              {conGoogle ? (
                <button type="button" className={claseBoton("suave")} onClick={revisarGmail} disabled={gmailCargando}>
                  {gmailCargando ? (
                    <>
                      <Spinner />
                      Revisando
                    </>
                  ) : (
                    <>
                      Revisar correo nuevo
                      <Arrow />
                    </>
                  )}
                </button>
              ) : googleDisponible ? (
                <button type="button" className={claseBoton("suave")} onClick={conectarGoogle}>
                  Conectar Gmail
                  <Arrow />
                </button>
              ) : (
                <p className="pill">Próximamente</p>
              )}
              {gmailMensaje ? <p className="t-chico max-w-[360px] md:text-right">{gmailMensaje}</p> : null}
            </div>
          </div>
        </section>

        {/* ---------- Historial ---------- */}
        <section id="historial" className="mt-16 lg:mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="t-etiqueta">Historial</p>
              <h2 className="t-seccion mt-2 !text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)]">Lo que Atendel ya leyó</h2>
            </div>
            {historial && historial.length > 0 ? (
              <p className="t-chico">
                {historial.length} {historial.length === 1 ? "resumen" : "resúmenes"}
              </p>
            ) : null}
          </div>

          <div className="mt-6">
            {historial === null ? (
              <p className="t-cuerpo flex items-center gap-2">
                <Spinner />
                Cargando…
              </p>
            ) : historial.length === 0 ? (
              <p className="t-cuerpo max-w-[460px]">Todavía no hay resúmenes. Prueba con uno de los ejemplos de arriba.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {historial.map((item) => (
                  <li key={item.id} className="tarjeta grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
                    <div className="t-chico">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {nuevos.has(item.id) ? <span className="pill pill--azul !px-2 !py-0 !text-[0.75rem]">Nuevo</span> : null}
                        {formatoFecha.format(new Date(item.creado_en))}
                      </p>
                      <p className="mt-1 break-words">{item.remitente}</p>
                    </div>
                    <div>
                      <h3 className="text-[1.0625rem] font-semibold tracking-[-0.01em]">{item.asunto}</h3>
                      <p className="t-cuerpo mt-1">{item.resumen}</p>
                      {conSugerencia(item.accion_sugerida) ? (
                        <p className="mt-2 flex items-start gap-2 text-tinta">
                          <Arrow className="mt-1 text-enlace" />
                          {item.accion_sugerida}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
