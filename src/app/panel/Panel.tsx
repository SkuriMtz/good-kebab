"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Avatar } from "@/components/base/Avatar";
import { Boton } from "@/components/base/Boton";
import { Escribiendo } from "@/components/base/Escribiendo";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { CabezaBloque, MarcaAgente, Vacio } from "@/components/dashboard/Piezas";
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
const sinCorreo = (remitente: string | null) => (remitente ?? "").replace(/<.*>/, "").trim() || "Sin remitente";

/**
 * Correo con Clara, dentro del panel: resumir un correo pegado (o uno de
 * ejemplo), conectar o revisar Gmail (solo lectura) y el historial de lo que
 * ya leyó. La lógica es la de siempre; solo cambió la forma.
 */
export function Panel({ conGoogle }: { conGoogle: boolean }) {
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
    <div className="dash-pagina dash-vista">
      <header className="dash-vista__cabeza">
        <div>
          <h1 className="t-app-titulo-grande">Correo</h1>
          <p className="dash-vista__texto">Pega un correo o elige un ejemplo. Clara te dice de qué trata y qué conviene hacer.</p>
        </div>
        <span className="dash-vista__agente">
          <MarcaAgente id="clara" tam={24} />
          Clara · Correo
        </span>
      </header>

      {/* ---------- Modo de prueba ---------- */}
      <section id="probar" className="dash-clara" aria-labelledby="probar-titulo">
        <div className="dash-tarjeta dash-clara__form">
          <h2 id="probar-titulo" className="t-app-titulo">
            Resume un correo
          </h2>
          <div>
            <p className="t-app-etiqueta">Ejemplos</p>
            <div className="dash-clara__ejemplos dash-clara__ejemplos--arriba">
              {EJEMPLOS.map((ejemplo) => (
                <button key={ejemplo.etiqueta} type="button" className="dash-chip" onClick={() => usarEjemplo(ejemplo)}>
                  {ejemplo.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={resumir} className="dash-clara__campos" noValidate>
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
            <div className="dash-clara__botones">
              <Boton type="submit" cargando={cargando} icono={<Icono nombre="rayo" tam={16} />}>
                {cargando ? "Leyendo el correo" : "Resumir con IA"}
              </Boton>
              {hayTexto && !cargando ? (
                <Boton variante="fantasma" onClick={limpiar}>
                  Limpiar
                </Boton>
              ) : null}
            </div>
            {error ? (
              <p role="alert" className="dash-clara__error">
                {error}
              </p>
            ) : null}
          </form>
        </div>

        <div ref={resultadoRef} aria-live="polite" className={`dash-tarjeta dash-clara__resultado${resultado ? "" : " dash-clara__resultado--vacio"}`}>
          {resultado ? (
            <>
              <p className="dash-clara__quien">
                <MarcaAgente id="clara" tam={24} />
                Resumen de Clara
              </p>
              <p className="dash-nota dash-clara__origen">
                {resultado.remitente} · {resultado.asunto}
              </p>
              <p className="dash-clara__resumen">{resultado.resumen}</p>
              {conSugerencia(resultado.accion) ? (
                <p className="dash-clara__sugerencia">
                  <Icono nombre="flecha" tam={16} />
                  {resultado.accion}
                </p>
              ) : null}
            </>
          ) : cargando ? (
            <>
              <MarcaAgente id="clara" tam={64} />
              <Escribiendo quien="Clara" conTexto />
            </>
          ) : (
            <Vacio compacto agente="clara" titulo="El resumen aparecerá aquí" texto="De qué trata el correo, qué tan urgente es y qué conviene contestar." />
          )}
        </div>
      </section>

      {/* ---------- Gmail ---------- */}
      <section id="gmail" className="dash-tarjeta dash-gmail" aria-labelledby="gmail-titulo">
        <div className="dash-gmail__texto">
          <Icono nombre="correo" tam={24} className="dash-gmail__icono" />
          <div>
            <h2 id="gmail-titulo" className="t-app-mediano">
              Tu bandeja de Gmail
            </h2>
            <p className="dash-gmail__explica">Conecta tu Gmail y Clara resume tus correos sin leer. Solo lectura: nunca envía ni borra nada.</p>
          </div>
        </div>
        <div className="dash-gmail__accion">
          {conGoogle ? (
            <>
              <Insignia tono="exito" conPunto>
                Conectado
              </Insignia>
              <Boton variante="sutil" tam="compacto" cargando={gmailCargando} onClick={revisarGmail} icono={<Icono nombre="repetir" tam={16} />}>
                {gmailCargando ? "Revisando" : "Revisar correo nuevo"}
              </Boton>
            </>
          ) : googleDisponible ? (
            <Boton variante="sutil" tam="compacto" onClick={conectarGoogle} flecha>
              Conectar Gmail
            </Boton>
          ) : (
            <Insignia tono="pronto">Pronto</Insignia>
          )}
          {gmailMensaje ? (
            <p className="dash-nota dash-gmail__mensaje" role="status">
              {gmailMensaje}
            </p>
          ) : null}
        </div>
      </section>

      {/* ---------- Historial ---------- */}
      <section id="historial" aria-labelledby="historial-titulo" className="dash-bloque">
        <CabezaBloque
          id="historial-titulo"
          titulo="Lo que Clara ya leyó"
          extra={historial && historial.length > 0 ? <span className="dash-grupo-titulo__cuenta cifras">{historial.length}</span> : null}
        />
        {historial === null ? (
          <div className="dash-lista dash-lista--borde" aria-busy="true" aria-label="Cargando el historial">
            {[0, 1, 2].map((i) => (
              <div key={i} className="dash-historial__fila">
                <span className="dash-esqueleto dash-esqueleto--corto" />
                <span className="dash-historial__esqueleto">
                  <span className="dash-esqueleto" />
                  <span className="dash-esqueleto dash-esqueleto--corto" />
                </span>
              </div>
            ))}
          </div>
        ) : historial.length === 0 ? (
          <Vacio
            icono="correo"
            titulo="Todavía no hay resúmenes"
            texto="Prueba con uno de los ejemplos de arriba o conecta tu Gmail: aquí se van guardando, con la fecha y lo que conviene hacer."
            accion={
              <Boton variante="sutil" tam="compacto" onClick={() => usarEjemplo(EJEMPLOS[0])}>
                Usar un ejemplo
              </Boton>
            }
          />
        ) : (
          <ul className="dash-lista dash-lista--borde">
            {historial.map((item) => (
              <li key={item.id} className="dash-historial__fila">
                <div className="dash-historial__quien">
                  <span className="dash-historial__remitente">
                    <Avatar nombre={sinCorreo(item.remitente)} tam={24} />
                    <span>{sinCorreo(item.remitente)}</span>
                  </span>
                  <span className="dash-historial__fecha cifras">
                    {formatoFecha.format(new Date(item.creado_en))}
                    {nuevos.has(item.id) ? <Insignia tono="azul">Nuevo</Insignia> : null}
                  </span>
                </div>
                <div className="dash-historial__cuerpo">
                  <h3 className="dash-historial__asunto">{item.asunto || "(sin asunto)"}</h3>
                  <p className="dash-historial__resumen">{item.resumen}</p>
                  {conSugerencia(item.accion_sugerida) ? (
                    <p className="dash-clara__sugerencia dash-historial__sugerencia">
                      <Icono nombre="flecha" tam={16} />
                      {item.accion_sugerida}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
