"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Boton } from "@/components/base/Boton";
import { Escribiendo } from "@/components/base/Escribiendo";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { CabezaSeccion, CaraAgente, EncabezadoVista } from "@/components/dashboard/piezas";
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

/**
 * Vista Correo del panel (/panel?vista=correo): Clara resume un correo
 * pegado (o uno de ejemplo), revisa tu Gmail (solo lectura) y guarda el
 * historial. Toda la lógica es la de antes; cambia el acomodo: el
 * formulario a la izquierda y el resumen a la derecha, Gmail y el historial abajo.
 */
export function Panel({ email, conGoogle }: { email: string; conGoogle: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const googleDisponible = useGoogleDisponible();

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
    <div className="tb-vista">
      <EncabezadoVista
        titulo="Correo"
        texto="Clara lee tus correos y te dice de qué tratan y qué conviene hacer. Pega uno o elige un ejemplo."
      />

      {/* ---------- Modo de prueba ---------- */}
      <div className="tb-clara">
        <section id="probar" className="tb-caja tb-clara__forma" aria-labelledby="probar-titulo">
          <div className="tb-clara__cabeza">
            <CaraAgente id="clara" tam={32} />
            <div>
              <h2 id="probar-titulo" className="tb-clara__titulo">
                Resume un correo
              </h2>
              <p className="tb-clara__sub">Clara · Correo</p>
            </div>
          </div>

          <div className="tb-clara__ejemplos" role="group" aria-label="Correos de ejemplo">
            <span className="tb-clara__etiqueta">Ejemplos</span>
            {EJEMPLOS.map((ejemplo) => (
              <button key={ejemplo.etiqueta} type="button" className="tb-filtro tb-filtro--chico" onClick={() => usarEjemplo(ejemplo)}>
                {ejemplo.etiqueta}
              </button>
            ))}
          </div>

          <form onSubmit={resumir} className="tb-clara__campos" noValidate>
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
            <div className="tb-clara__acciones">
              <Boton type="submit" cargando={cargando} icono={<Icono nombre="rayo" />}>
                {cargando ? "Resumiendo" : "Resumir con IA"}
              </Boton>
              {hayTexto && !cargando ? (
                <Boton variante="fantasma" onClick={limpiar}>
                  Limpiar
                </Boton>
              ) : null}
            </div>
            {error ? (
              <p role="alert" className="tb-alerta">
                <Icono nombre="alerta" tam={16} />
                {error}
              </p>
            ) : null}
          </form>
        </section>

        <section className="tb-caja tb-clara__resultado" aria-labelledby="resultado-titulo">
          <div ref={resultadoRef} aria-live="polite">
            <h2 id="resultado-titulo" className="tb-clara__titulo">
              Resumen
            </h2>
            {resultado ? (
              <div className="tb-clara__listo">
                <p className="tb-clara__de">
                  {resultado.remitente} · {resultado.asunto}
                </p>
                <p className="tb-clara__resumen">{resultado.resumen}</p>
                {conSugerencia(resultado.accion) ? (
                  <p className="tb-correo__sugerencia">
                    <CaraAgente id="clara" tam={20} />
                    <span>
                      <span className="sr-only">Clara sugiere: </span>
                      {resultado.accion}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="tb-clara__espera">
                <CaraAgente id="clara" tam={64} />
                {cargando ? <Escribiendo quien="Clara" conTexto /> : <p>Aquí aparece de qué trata el correo y qué conviene hacer.</p>}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ---------- Gmail ---------- */}
      <section id="gmail" className="tb-caja tb-gmail" aria-labelledby="gmail-titulo">
        <Icono nombre="correo" tam={24} className="tb-gmail__icono" />
        <div className="tb-gmail__texto">
          <h2 id="gmail-titulo" className="tb-clara__titulo">
            Tu bandeja de Gmail
            {conGoogle ? (
              <Insignia tono="exito" conPunto>
                Conectada
              </Insignia>
            ) : null}
          </h2>
          <p className="tb-gmail__detalle">
            {conGoogle
              ? `Clara resume los correos sin leer de ${email}. Solo lectura: nunca envía ni borra nada.`
              : "Conecta tu Gmail y Clara resume tus correos sin leer. Solo lectura: nunca envía ni borra nada."}
          </p>
          {gmailMensaje ? (
            <p className="tb-gmail__mensaje" role="status">
              {gmailMensaje}
            </p>
          ) : null}
        </div>
        <div className="tb-gmail__accion">
          {conGoogle ? (
            <Boton variante="sutil" tam="compacto" cargando={gmailCargando} icono={<Icono nombre="repetir" />} onClick={revisarGmail}>
              {gmailCargando ? "Revisando" : "Revisar correo nuevo"}
            </Boton>
          ) : googleDisponible ? (
            <Boton variante="sutil" tam="compacto" flecha onClick={conectarGoogle}>
              Conectar Gmail
            </Boton>
          ) : (
            <Insignia tono="pronto">Pronto</Insignia>
          )}
        </div>
      </section>

      {/* ---------- Historial ---------- */}
      <section id="historial" aria-labelledby="historial-titulo" className="tb-bloque">
        <CabezaSeccion
          id="historial-titulo"
          titulo="Lo que Clara ya leyó"
          extra={
            historial && historial.length > 0 ? (
              <span className="tb-cabeza__cuenta cifras">
                {historial.length} {historial.length === 1 ? "resumen" : "resúmenes"}
              </span>
            ) : null
          }
        />
        <div className="tb-caja tb-caja--lista">
          {historial === null ? (
            <p className="tb-cargando" role="status">
              <Escribiendo quien="Clara" />
              Cargando tu historial…
            </p>
          ) : historial.length === 0 ? (
            <div className="tb-vacio">
              <Icono nombre="correo" tam={24} className="tb-vacio__icono" />
              <div className="tb-vacio__texto">
                <p className="tb-vacio__titulo">Todavía no hay resúmenes</p>
                <p className="tb-vacio__detalle">Prueba con uno de los ejemplos de arriba o conecta tu Gmail.</p>
              </div>
            </div>
          ) : (
            <ul className="tb-historial">
              {historial.map((item) => (
                <li key={item.id} className="tb-historial__fila">
                  <div className="tb-historial__meta">
                    <p className="tb-historial__fecha cifras">
                      {nuevos.has(item.id) ? <Insignia tono="azul">Nuevo</Insignia> : null}
                      {formatoFecha.format(new Date(item.creado_en))}
                    </p>
                    <p className="tb-historial__de">{item.remitente}</p>
                  </div>
                  <div className="tb-historial__cuerpo">
                    <h3 className="tb-historial__asunto">{item.asunto}</h3>
                    <p className="tb-historial__resumen">{item.resumen}</p>
                    {conSugerencia(item.accion_sugerida) ? (
                      <p className="tb-historial__accion">
                        <Icono nombre="flecha" tam={14} />
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
    </div>
  );
}
