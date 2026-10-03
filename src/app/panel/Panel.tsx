"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { Arrow, Roll, TriIcon, TriSpinner } from "@/components/Buttons";
import { NavApp } from "@/components/app/NavApp";
import { ParticleShape } from "@/components/particles/ParticleShape";
import type { ShapeName } from "@/components/particles/shapes";
import { Reveal, SplitText } from "@/components/Reveal";
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

const COLORES = ["var(--color-bone-white)", "var(--color-bone-white)", "var(--color-bone-white)", "var(--color-silver-mist)", "var(--color-bone-white)", "var(--color-bone-white)", "var(--color-bone-white)", "var(--color-signal)"];

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

export function Panel({ email, conGoogle }: { email: string; conGoogle: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const googleDisponible = useGoogleDisponible();

  const [saludo, setSaludo] = useState("Hola.");
  const [remitente, setRemitente] = useState("");
  const [asunto, setAsunto] = useState("");
  const [contenido, setContenido] = useState("");
  const [destello, setDestello] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [vueltaResultado, setVueltaResultado] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [vueltaError, setVueltaError] = useState(0);
  const [figura, setFigura] = useState<ShapeName>("mail");
  const [historial, setHistorial] = useState<Guardado[] | null>(null);
  const [nuevos, setNuevos] = useState<Set<string>>(() => new Set());
  const [gmailCargando, setGmailCargando] = useState(false);
  const [gmailMensaje, setGmailMensaje] = useState<string | null>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);
  const idsPrevios = useRef<Set<string>>(new Set());
  const temporizador = useRef<number>();

  useEffect(() => {
    const hora = new Date().getHours();
    setSaludo(hora < 12 ? "Buenos días." : hora < 19 ? "Buenas tardes." : "Buenas noches.");
    return () => window.clearTimeout(temporizador.current);
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

  function mostrarError(mensaje: string) {
    setError(mensaje);
    setVueltaError((n) => n + 1);
  }

  function usarEjemplo(ejemplo: (typeof EJEMPLOS)[number]) {
    setRemitente(ejemplo.remitente);
    setAsunto(ejemplo.asunto);
    setContenido(ejemplo.contenido);
    setDestello((n) => n + 1);
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
      mostrarError("Escribe o pega el contenido del correo.");
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
      setVueltaResultado((n) => n + 1);
      // La constelación celebra con una palomita y regresa al sobre
      setFigura("check");
      window.clearTimeout(temporizador.current);
      temporizador.current = window.setTimeout(() => setFigura("mail"), 2400);
      cargarHistorial(true);
      requestAnimationFrame(() => {
        const el = resultadoRef.current;
        if (el && el.getBoundingClientRect().top > window.innerHeight * 0.7) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    } catch (err) {
      mostrarError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
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
        n === 0
          ? "No tienes correos nuevos sin leer."
          : `Listo: resumí ${n} correo${n === 1 ? "" : "s"}. Están en tu historial.`,
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

      <main className="mx-auto max-w-page px-6 pb-[96px] pt-[128px] lg:px-10 lg:pt-[168px]">
        <header className="max-w-[760px]">
          <Reveal as="p" className="eyebrow">
            Clara · Correo
          </Reveal>
          <SplitText as="h1" className="editorial mt-5 text-heading-lg" text={saludo} />
          <Reveal as="p" delay={200} className="mt-6 max-w-[560px] text-body text-silver">
            Pega un correo o elige un ejemplo. Atendel te dice de qué trata y qué conviene hacer.
          </Reveal>
        </header>

        {/* ---------- Modo de prueba ---------- */}
        <section
          id="probar"
          className="mt-[72px] grid grid-cols-1 gap-12 lg:mt-[120px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-20"
        >
          <div>
            <Reveal as="p" className="eyebrow">
              Agente de correo
            </Reveal>
            <Reveal as="h2" delay={80} className="editorial mt-4 text-heading">
              Resume un correo
            </Reveal>

            <Reveal delay={160} className="mt-8">
              <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ash">Ejemplos</p>
              <div className="mt-1 flex flex-wrap gap-x-7">
                {EJEMPLOS.map((ejemplo) => (
                  <button key={ejemplo.etiqueta} type="button" className="chip" onClick={() => usarEjemplo(ejemplo)}>
                    <TriIcon className="h-3 w-3" />
                    <Roll>{ejemplo.etiqueta}</Roll>
                  </button>
                ))}
              </div>
            </Reveal>

            <Reveal delay={240}>
              <form onSubmit={resumir} className="mt-10 space-y-9" noValidate>
                <Field
                  label="De"
                  name="remitente"
                  value={remitente}
                  onChange={setRemitente}
                  placeholder="Juan Pérez <juan@correo.com>"
                  maxLength={300}
                  flashKey={destello}
                />
                <Field
                  label="Asunto"
                  name="asunto"
                  value={asunto}
                  onChange={setAsunto}
                  placeholder="¿De qué trata?"
                  maxLength={300}
                  flashKey={destello}
                />
                <Field
                  label="Contenido"
                  name="contenido"
                  value={contenido}
                  onChange={setContenido}
                  placeholder="Pega aquí el texto del correo"
                  multiline
                  maxLength={5000}
                  flashKey={destello}
                />
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                  <button
                    key={vueltaError}
                    type="submit"
                    className={`btn-pill min-w-[228px] ${vueltaError ? "shake" : ""}`}
                    disabled={cargando}
                  >
                    {cargando ? (
                      <>
                        <TriSpinner />
                        <span>Procesando</span>
                      </>
                    ) : (
                      <>
                        <Roll>Resumir con IA</Roll>
                        <Arrow />
                      </>
                    )}
                  </button>
                  {hayTexto && !cargando ? (
                    <button type="button" className="btn-ghost swap-in" onClick={limpiar}>
                      <Roll>Limpiar</Roll>
                    </button>
                  ) : null}
                </div>
                {error ? (
                  <p
                    key={`e${vueltaError}`}
                    role="alert"
                    className="swap-in flex max-w-[520px] items-start gap-3 text-body text-saffron"
                  >
                    <TriIcon className="mt-1.5 h-3.5 w-3.5 shrink-0" />
                    {error}
                  </p>
                ) : null}
              </form>
            </Reveal>
          </div>

          <div className="lg:sticky lg:top-[110px] lg:self-start">
            <div className="relative mx-auto aspect-square w-full max-w-[260px] lg:max-w-[380px]">
              <ParticleShape
                shape={figura}
                busy={cargando}
                scrollLinked={false}
                colors={COLORES}
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div ref={resultadoRef} aria-live="polite" className="mt-4 min-h-[150px]">
              {resultado ? (
                <div key={vueltaResultado} className="stagger">
                  <p className="eyebrow" style={{ "--i": 0 } as CSSProperties}>
                    Resumen
                  </p>
                  <p
                    className="mt-3 break-words text-caption text-ash"
                    style={{ "--i": 1 } as CSSProperties}
                  >
                    {resultado.remitente} · {resultado.asunto}
                  </p>
                  <p className="mt-4 text-heading-2xs" style={{ "--i": 2 } as CSSProperties}>
                    {resultado.resumen}
                  </p>
                  {conSugerencia(resultado.accion) ? (
                    <p
                      className="mt-5 flex items-start gap-3 text-body text-bone"
                      style={{ "--i": 3 } as CSSProperties}
                    >
                      <Arrow className="mt-1.5 shrink-0 text-signal" />
                      {resultado.accion}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-center text-body text-ash">
                  {cargando ? "Leyendo el correo…" : "El resumen aparecerá aquí."}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ---------- Gmail ---------- */}
        <section id="gmail" className="mt-[96px] grid grid-cols-1 gap-8 lg:mt-[140px] lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal as="p" className="eyebrow">
              Gmail
            </Reveal>
            <Reveal as="h2" delay={80} className="editorial mt-4 text-heading">
              Tu bandeja de entrada
            </Reveal>
            <Reveal as="p" delay={160} className="mt-5 max-w-[480px] text-body text-silver">
              Conecta tu Gmail y Atendel resume tus correos sin leer. Solo lectura: nunca envía ni borra nada.
            </Reveal>
          </div>
          <Reveal delay={200} className="flex flex-col items-start justify-end gap-3">
            {conGoogle ? (
              <button type="button" className="btn-ghost" onClick={revisarGmail} disabled={gmailCargando}>
                {gmailCargando ? (
                  <>
                    <TriSpinner />
                    <span>Revisando</span>
                  </>
                ) : (
                  <>
                    <Roll>Revisar correo nuevo</Roll>
                    <Arrow />
                  </>
                )}
              </button>
            ) : googleDisponible ? (
              <button type="button" className="btn-ghost" onClick={conectarGoogle}>
                <Roll>Conectar Gmail</Roll>
                <Arrow />
              </button>
            ) : (
              <p className="eyebrow-plain flex items-center gap-2">
                <span className="h-2 w-2 rounded-full border border-ash" />
                Próximamente
              </p>
            )}
            {gmailMensaje ? (
              <p key={gmailMensaje} className="swap-in max-w-[440px] text-body text-silver">
                {gmailMensaje}
              </p>
            ) : null}
          </Reveal>
        </section>

        {/* ---------- Historial ---------- */}
        <section id="historial" className="mt-[96px] lg:mt-[140px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal as="p" className="eyebrow">
                Historial
              </Reveal>
              <Reveal as="h2" delay={80} className="editorial mt-4 text-heading">
                Lo que Atendel ya leyó
              </Reveal>
            </div>
            {historial && historial.length > 0 ? (
              <p className="eyebrow text-ash">
                {historial.length} {historial.length === 1 ? "resumen" : "resúmenes"}
              </p>
            ) : null}
          </div>

          <div className="mt-10 lg:mt-14">
            {historial === null ? (
              <p className="flex items-center gap-3 text-body text-ash">
                <TriSpinner />
                Cargando…
              </p>
            ) : historial.length === 0 ? (
              <p className="max-w-[460px] text-body text-ash">
                Todavía no hay resúmenes. Prueba con uno de los ejemplos de arriba.
              </p>
            ) : (
              <ul className="space-y-12 lg:space-y-16">
                {historial.map((item, i) => (
                  <li
                    key={item.id}
                    className="item-in grid gap-3 lg:grid-cols-[240px_1fr] lg:gap-12"
                    style={{ "--i": Math.min(i, 8) } as CSSProperties}
                  >
                    <div className="text-caption text-ash">
                      <p className="flex items-center gap-2 font-semibold uppercase tracking-[0.06em]">
                        {nuevos.has(item.id) ? (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-saffron" aria-label="Nuevo" />
                        ) : null}
                        {formatoFecha.format(new Date(item.creado_en))}
                      </p>
                      <p className="mt-1 break-words">{item.remitente}</p>
                    </div>
                    <div>
                      <h3 className="editorial text-heading-sm">{item.asunto}</h3>
                      <p className="mt-2 text-body font-light text-silver">{item.resumen}</p>
                      {conSugerencia(item.accion_sugerida) ? (
                        <p className="mt-3 flex items-start gap-3 text-body text-bone">
                          <Arrow className="mt-1.5 shrink-0 text-signal" />
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
