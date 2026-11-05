"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Giro, Icono } from "@/components/base/Iconos";
import { useGoogleDisponible } from "@/components/useGoogleDisponible";
import { AvatarAgente } from "@/components/panel/Mensajes";
import { Enlace, Pildoras, Subtitulo, Tarjeta, TituloSeccion, Vacio, claseBoton } from "@/components/panel/Piezas";
import { ListaCorreos, Seccion } from "@/components/panel/Secciones";
import { partirRemitente } from "@/components/panel/remitente";
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
    etiqueta: "Cliente quiere cita",
    remitente: "Laura Méndez <laura.mendez@gmail.com>",
    asunto: "Quiero agendar una cita",
    contenido:
      "Hola, buenas tardes. Quisiera agendar una cita para la próxima semana, de preferencia el martes o jueves por la tarde después de las 5. ¿Tienen disponibilidad? También quería saber qué formas de pago aceptan. Gracias.",
  },
  {
    etiqueta: "Pregunta de precios",
    remitente: "Andrea Ruiz <andrea.ruiz@hotmail.com>",
    asunto: "Precio del paquete",
    contenido:
      "Hola! Vi su publicación en Instagram. ¿Cuánto cuesta el paquete de sesiones? ¿Tienen promoción este mes? Y cuántas sesiones se necesitan normalmente.",
  },
  {
    etiqueta: "Cancelación",
    remitente: "Roberto Salinas <rsalinas@empresa.com.mx>",
    asunto: "No podré ir mañana",
    contenido:
      "Buenos días, les escribo para avisar que no podré asistir a mi cita de mañana a las 10:00 am por un tema de trabajo. ¿Me podrían reprogramar para el viernes? Una disculpa por el aviso tan tarde.",
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
 * Correo con Clara, dentro del panel: resumir un correo pegado (o uno de
 * ejemplo), conectar o revisar Gmail (solo lectura) y el historial de lo que
 * ya leyó. La lógica es la de siempre; solo cambió la forma (la sección del
 * panel nuevo: columna de 768px, título en serif y tarjetas de borde fino).
 */
export function Panel({ conGoogle, de }: { conGoogle: boolean; /** ?de=: el historial solo con lo de ese remitente (como en Pendientes y Estadísticas). */ de?: string }) {
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
  // Solo se filtra lo que se muestra; la lectura del historial no cambia
  const visibles = historial && de ? historial.filter((h) => partirRemitente(h.remitente)?.nombre === de) : historial;

  return (
    <Seccion>
      <TituloSeccion
        titulo="Correo"
        texto="Pega un correo o elige un ejemplo. Clara te dice de qué trata y qué conviene hacer."
        acciones={
          <span className="pc-etiqueta-agente">
            <AvatarAgente agente="clara" tam={20} />
            Clara · Correo
          </span>
        }
      />

      {/* ---------- Modo de prueba ---------- */}
      <section id="probar" aria-labelledby="probar-titulo" className="pc-correo-prueba">
        <Tarjeta como="div" className="pc-formulario">
          <h2 id="probar-titulo" className="pc-formulario__titulo">
            Resume un correo
          </h2>
          <Pildoras
            etiqueta="Correos de ejemplo"
            activa=""
            alElegir={(id) => {
              const ejemplo = EJEMPLOS.find((e) => e.etiqueta === id);
              if (ejemplo) usarEjemplo(ejemplo);
            }}
            opciones={EJEMPLOS.map((e) => ({ id: e.etiqueta, etiqueta: e.etiqueta }))}
          />
          <form onSubmit={resumir} className="pc-formulario__campos" noValidate>
            <label className="pc-campo">
              <span className="pc-campo__etiqueta">De</span>
              <input className="pc-campo__entrada" name="remitente" value={remitente} onChange={(e) => setRemitente(e.target.value)} placeholder="Juan Pérez <juan@correo.com>" maxLength={300} />
            </label>
            <label className="pc-campo">
              <span className="pc-campo__etiqueta">Asunto</span>
              <input className="pc-campo__entrada" name="asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="¿De qué trata?" maxLength={300} />
            </label>
            <label className="pc-campo">
              <span className="pc-campo__etiqueta">Contenido</span>
              <textarea className="pc-campo__entrada pc-campo__entrada--largo" name="contenido" value={contenido} onChange={(e) => setContenido(e.target.value)} placeholder="Pega aquí el texto del correo" maxLength={5000} rows={6} />
            </label>
            <div className="pc-formulario__botones">
              <button type="submit" className={claseBoton("principal")} disabled={cargando} aria-busy={cargando || undefined}>
                {cargando ? <Giro /> : <Icono nombre="rayo" tam={16} />}
                {cargando ? "Leyendo el correo" : "Resumir con IA"}
              </button>
              {hayTexto && !cargando ? (
                <button type="button" className={claseBoton("fantasma")} onClick={limpiar}>
                  Limpiar
                </button>
              ) : null}
            </div>
            {error ? (
              <p role="alert" className="pc-error">
                {error}
              </p>
            ) : null}
          </form>
        </Tarjeta>

        <div ref={resultadoRef} aria-live="polite" className="pc-resultado">
          {resultado ? (
            <Tarjeta como="div" className="pc-resultado__tarjeta pc-entra">
              <p className="pc-resultado__quien">
                <AvatarAgente agente="clara" tam={24} />
                Resumen de Clara
              </p>
              <p className="pc-resultado__origen">
                {resultado.remitente} · {resultado.asunto}
              </p>
              <p className="pc-resultado__texto">{resultado.resumen}</p>
              {conSugerencia(resultado.accion) ? (
                <p className="pc-correo__accion">
                  <Icono nombre="flecha" tam={16} />
                  {resultado.accion}
                </p>
              ) : null}
            </Tarjeta>
          ) : cargando ? (
            <p className="pc-cargando" role="status">
              <Giro /> Clara está leyendo el correo…
            </p>
          ) : (
            <p className="pc-nota">El resumen aparece aquí: de qué trata el correo, qué tan urgente es y qué conviene contestar.</p>
          )}
        </div>
      </section>

      {/* ---------- Gmail ---------- */}
      <section id="gmail" aria-labelledby="gmail-titulo">
        <Subtitulo id="gmail-titulo">Tu bandeja de Gmail</Subtitulo>
        <Tarjeta como="div" className="pc-gmail">
          <Icono nombre="correo" tam={20} />
          <p className="pc-gmail__texto">Conecta tu Gmail y Clara resume tus correos sin leer. Solo lectura: nunca envía ni borra nada.</p>
          <div className="pc-gmail__accion">
            {conGoogle ? (
              <>
                <span className="pc-estado pc-estado--exito">Conectado</span>
                <button type="button" className={claseBoton("borde", true)} disabled={gmailCargando} onClick={revisarGmail}>
                  {gmailCargando ? <Giro /> : <Icono nombre="repetir" tam={16} />}
                  {gmailCargando ? "Revisando" : "Revisar correo nuevo"}
                </button>
              </>
            ) : googleDisponible ? (
              <button type="button" className={claseBoton("borde", true)} onClick={conectarGoogle}>
                Conectar Gmail
                <Icono nombre="flecha" tam={16} />
              </button>
            ) : (
              <span className="pc-estado pc-estado--neutro">Pronto</span>
            )}
          </div>
          {gmailMensaje ? (
            <p className="pc-gmail__mensaje" role="status">
              {gmailMensaje}
            </p>
          ) : null}
        </Tarjeta>
      </section>

      {/* ---------- Historial ---------- */}
      <section id="historial" aria-labelledby="historial-titulo">
        <Subtitulo
          id="historial-titulo"
          extra={
            <>
              {visibles && visibles.length > 0 ? <span className="cifras">{visibles.length}</span> : null}
              {de ? (
                <Enlace href="/panel?vista=correo#historial" className="pc-pildora pc-pildora--quitar" aria-label={`Quitar el filtro: ${de}`}>
                  De: {de}
                  <Icono nombre="cerrar" tam={14} />
                </Enlace>
              ) : null}
            </>
          }
        >
          Lo que Clara ya leyó
        </Subtitulo>
        {historial === null ? (
          <p className="pc-cargando" role="status" aria-label="Cargando el historial">
            <Giro /> Cargando el historial…
          </p>
        ) : de && historial.length > 0 && visibles?.length === 0 ? (
          <Vacio
            icono="correo"
            titulo={`Nada de ${de} en lo último que leyó Clara`}
            texto="Aquí se ven los 30 resúmenes más recientes."
            accion={
              <Enlace href="/panel?vista=correo#historial" className="pc-enlace">
                Ver todo el historial
              </Enlace>
            }
          />
        ) : historial.length === 0 ? (
          <Vacio
            icono="correo"
            titulo="Todavía no hay resúmenes"
            texto="Prueba con uno de los ejemplos de arriba o conecta tu Gmail: aquí se van guardando, con la fecha y lo que conviene hacer."
            accion={
              <button type="button" className={claseBoton("borde", true)} onClick={() => usarEjemplo(EJEMPLOS[0])}>
                Usar un ejemplo
              </button>
            }
          />
        ) : (
          <ListaCorreos
            correos={(visibles ?? historial).map((item) => ({
              id: item.id,
              remitente: partirRemitente(item.remitente)?.nombre ?? "Sin remitente",
              asunto: item.asunto || "(sin asunto)",
              resumen: item.resumen,
              fecha: formatoFecha.format(new Date(item.creado_en)),
              nuevo: nuevos.has(item.id),
              // La acción lleva a sus pendientes (los correos que piden lo mismo)
              accion: conSugerencia(item.accion_sugerida) ? (item.accion_sugerida ?? undefined) : undefined,
              hrefAccion: conSugerencia(item.accion_sugerida) ? `/panel?vista=pendientes&tipo=correos&accion=${encodeURIComponent(item.accion_sugerida ?? "")}` : undefined,
            }))}
          />
        )}
      </section>
    </Seccion>
  );
}
