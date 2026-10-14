"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Pestanas } from "@/components/base/Pestanas";
import { EncabezadoVista } from "@/components/dashboard/Agentes";
import { Ayuda, Consejo, Metricas, Novedades, PieMinimo, ProximasCitas, TarjetaNegocio } from "@/components/dashboard/Columna";
import { NOVEDADES, fechaLarga, haceCuanto, mesDe, renovacion, saludoPorHora } from "@/components/dashboard/contenido";
import { MarcaAgente } from "@/components/dashboard/Marcas";
import {
  AgentesFijados,
  Bienvenida,
  CabezaBloque,
  Cargando,
  ConversacionesRecientes,
  LineaTiempo,
  ListaDestacados,
  Vacio,
} from "@/components/dashboard/Resumen";
import { agentesDe, nombreConversacion, useDatosPanel } from "@/components/dashboard/TableroPanel";
import type { DiaActividad, Evento } from "@/components/dashboard/tipos";
import { Field } from "@/components/ui/Field";
import { useGoogleDisponible } from "@/components/useGoogleDisponible";
import { AGENTE_POR_ID, AGENTES_INFO } from "@/lib/agentes";
import { planMinimo } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";

type Resultado = { asunto: string; remitente: string; resumen: string; accion: string };

export type Guardado = {
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

/** "Laura Méndez <laura@…>" → "Laura Méndez" */
const soloNombre = (remitente: string | null) => (remitente ?? "").replace(/\s*<[^>]*>/, "").trim() || "alguien";

const horaDe = (iso: string) => new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

function diaDe(iso: string, ahora: Date) {
  const d = new Date(iso);
  if (d.toDateString() === ahora.toDateString()) return "Hoy";
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (d.toDateString() === ayer.toDateString()) return "Ayer";
  const texto = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toLocaleUpperCase("es-MX") + texto.slice(1).replace(",", "");
}

/**
 * El panel con datos reales. Dos vistas dentro del mismo armazón:
 * - Resumen: bienvenida, actividad (lo que Clara resumió), agentes fijados,
 *   conversaciones recientes y la columna de tu plan.
 * - Correo (?vista=correo): resumir un correo (o uno de ejemplo), Gmail e
 *   historial. Las mismas funciones de siempre, en el lenguaje del dashboard.
 * `historialInicial` es solo para pruebas (vista previa sin sesión).
 */
export function Panel({
  email,
  conGoogle,
  vista = "resumen",
  historialInicial,
}: {
  email: string;
  conGoogle: boolean;
  vista?: "resumen" | "correo";
  historialInicial?: Guardado[];
}) {
  const datos = useDatosPanel();
  const supabase = useMemo(() => createClient(), []);
  const googleDisponible = useGoogleDisponible();

  const [ahora, setAhora] = useState<Date | null>(null);
  const [remitente, setRemitente] = useState("");
  const [asunto, setAsunto] = useState("");
  const [contenido, setContenido] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<Guardado[] | null>(historialInicial ?? null);
  const [nuevos, setNuevos] = useState<Set<string>>(() => new Set());
  const [gmailCargando, setGmailCargando] = useState(false);
  const [gmailMensaje, setGmailMensaje] = useState<string | null>(null);
  const [pestana, setPestana] = useState("actividad");
  const resultadoRef = useRef<HTMLDivElement>(null);
  const idsPrevios = useRef<Set<string>>(new Set());

  useEffect(() => {
    setAhora(new Date());
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
    if (historialInicial) return;
    cargarHistorial();
  }, [cargarHistorial, historialInicial]);

  // Al llegar con #historial (desde un aviso), se baja hasta el historial
  useEffect(() => {
    if (vista !== "correo" || historial === null || window.location.hash !== "#historial") return;
    document.getElementById("historial")?.scrollIntoView({ block: "start" });
  }, [vista, historial]);

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
      const datosRes = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datosRes.error ?? "Algo salió mal. Intenta de nuevo.");
      setResultado(datosRes as Resultado);
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
      const datosRes = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datosRes.error ?? "No se pudo revisar tu correo.");
      const n: number = datosRes.procesados ?? 0;
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

  /* ---------- Datos para el Resumen ---------- */
  const { plan, usados, activos, conversaciones } = datos;
  const primerAgente = activos[0] ?? "clara";
  const tieneNombre = Boolean(datos.nombre) && !datos.nombre.includes("@") && datos.nombre !== email.split("@")[0];
  const saludo = `${ahora ? saludoPorHora(ahora) : "Hola"}${tieneNombre ? `, ${datos.nombre.split(/\s+/)[0]}` : ""}`;
  const totalResumenes = historial ? `${historial.length}${historial.length >= 30 ? "+" : ""}` : "…";

  const dias: DiaActividad[] = useMemo(() => {
    if (!historial || !ahora) return [];
    const grupos = new Map<string, Evento[]>();
    for (const g of historial.slice(0, 12)) {
      const dia = diaDe(g.creado_en, ahora);
      const evento: Evento = {
        id: g.id,
        agente: "clara",
        tipo: "correo",
        texto: `resumió el correo de ${soloNombre(g.remitente)}${g.asunto ? `: «${g.asunto}»` : ""}`,
        hora: horaDe(g.creado_en),
        insignia: nuevos.has(g.id) ? { tono: "azul", texto: "Nuevo" } : undefined,
        detalle: {
          tipo: "lista",
          renglones: [
            { marca: "Resumen", tono: "neutra", texto: g.resumen },
            ...(conSugerencia(g.accion_sugerida) ? [{ marca: "Qué hacer", tono: "azul" as const, texto: g.accion_sugerida as string }] : []),
          ],
        },
      };
      grupos.set(dia, [...(grupos.get(dia) ?? []), evento]);
    }
    return Array.from(grupos, ([dia, eventos]) => ({ dia, eventos }));
  }, [historial, ahora, nuevos]);

  const destacados = (historial ?? [])
    .filter((g) => conSugerencia(g.accion_sugerida))
    .slice(0, 6)
    .map((g) => ({
      id: g.id,
      agente: "clara" as const,
      marca: "Qué hacer",
      tono: "azul" as const,
      texto: `${g.asunto ? `${g.asunto}: ` : ""}${g.accion_sugerida}`,
      cuando: ahora ? haceCuanto(g.creado_en, ahora) : "",
    }));

  const consejoAgente = activos.length ? activos[(ahora?.getDate() ?? 0) % activos.length] : "clara";
  const consejo = AGENTE_POR_ID[consejoAgente];

  /* =================================================================
     Vista Correo
     ================================================================= */
  if (vista === "correo") {
    return (
      <div className="vista">
        <EncabezadoVista
          titulo="Correo"
          texto="Pega un correo o elige un ejemplo. Clara te dice de qué trata y qué conviene hacer."
        />

        <section id="probar" className="correo" aria-labelledby="probar-titulo">
          <div className="tarjeta-app correo__form">
            <h2 id="probar-titulo" className="t-app-titulo">
              Resume un correo
            </h2>
            <p className="correo__etiqueta" id="ejemplos-titulo">
              Ejemplos
            </p>
            <div className="correo__ejemplos" role="group" aria-labelledby="ejemplos-titulo">
              {EJEMPLOS.map((ejemplo) => (
                <Boton key={ejemplo.etiqueta} variante="sutil" tam="compacto" onClick={() => usarEjemplo(ejemplo)}>
                  {ejemplo.etiqueta}
                </Boton>
              ))}
            </div>

            <form onSubmit={resumir} className="correo__campos" noValidate>
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
              <div className="correo__acciones">
                <Boton type="submit" variante="principal" cargando={cargando} icono={<Icono nombre="rayo" tam={16} />}>
                  {cargando ? "Procesando" : "Resumir con IA"}
                </Boton>
                {hayTexto && !cargando ? (
                  <Boton variante="fantasma" onClick={limpiar}>
                    Limpiar
                  </Boton>
                ) : null}
              </div>
              {error ? (
                <p role="alert" className="correo__error">
                  <Icono nombre="alerta" tam={16} />
                  {error}
                </p>
              ) : null}
            </form>
          </div>

          <div ref={resultadoRef} aria-live="polite" className="tarjeta-app correo__resultado" data-lleno={resultado ? "true" : undefined}>
            {resultado ? (
              <>
                <div className="correo__resultado-cabeza">
                  <MarcaAgente agente="clara" />
                  <p className="t-app-mediano">Resumen</p>
                </div>
                <p className="correo__de">
                  {resultado.remitente} · {resultado.asunto}
                </p>
                <p className="correo__resumen">{resultado.resumen}</p>
                {conSugerencia(resultado.accion) ? (
                  <p className="correo__accion">
                    <Icono nombre="flecha" tam={16} />
                    {resultado.accion}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="correo__espera">
                <MarcaAgente agente="clara" tam="grande" />
                <p className="t-app-mediano">{cargando ? "Clara está leyendo el correo…" : "El resumen aparecerá aquí"}</p>
                <p>{cargando ? "Tarda unos segundos." : "De qué trata, qué tan urgente es y qué conviene hacer."}</p>
              </div>
            )}
          </div>
        </section>

        <section id="gmail" className="tarjeta-app gmail" aria-labelledby="gmail-titulo">
          <div className="gmail__texto">
            <h2 id="gmail-titulo" className="t-app-mediano">
              Tu bandeja de Gmail
            </h2>
            <p>Conecta tu Gmail y Clara resume tus correos sin leer. Solo lectura: nunca envía ni borra nada.</p>
          </div>
          <div className="gmail__accion">
            {conGoogle ? (
              <Boton variante="sutil" tam="compacto" cargando={gmailCargando} onClick={revisarGmail} flecha={!gmailCargando}>
                {gmailCargando ? "Revisando" : "Revisar correo nuevo"}
              </Boton>
            ) : googleDisponible ? (
              <Boton variante="sutil" tam="compacto" onClick={conectarGoogle} flecha>
                Conectar Gmail
              </Boton>
            ) : (
              <Insignia tono="pronto">Próximamente</Insignia>
            )}
            {gmailMensaje ? (
              <p className="gmail__mensaje" role="status">
                {gmailMensaje}
              </p>
            ) : null}
          </div>
        </section>

        <section id="historial" className="bloque" aria-labelledby="historial-titulo">
          <CabezaBloque
            id="historial-titulo"
            titulo="Lo que Clara ya leyó"
            extra={
              historial && historial.length > 0 ? (
                <span className="bloque__cuenta cifras">
                  {historial.length} {historial.length === 1 ? "resumen" : "resúmenes"}
                </span>
              ) : undefined
            }
          />
          {historial === null ? (
            <Cargando etiqueta="Cargando tu historial…" />
          ) : historial.length === 0 ? (
            <Vacio agente="clara" titulo="Todavía no hay resúmenes" texto="Prueba con uno de los ejemplos de arriba: Clara lo resume en unos segundos." />
          ) : (
            <ul className="lista-caja">
              {historial.map((item) => (
                <li key={item.id} className="historial">
                  <div className="historial__meta">
                    <p className="historial__fecha cifras" suppressHydrationWarning>
                      {nuevos.has(item.id) ? <Insignia tono="azul">Nuevo</Insignia> : null}
                      {formatoFecha.format(new Date(item.creado_en))}
                    </p>
                    <p className="historial__de">{item.remitente}</p>
                  </div>
                  <div className="historial__cuerpo">
                    <h3 className="t-app-mediano">{item.asunto}</h3>
                    <p className="historial__resumen">{item.resumen}</p>
                    {conSugerencia(item.accion_sugerida) ? (
                      <p className="correo__accion">
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
        <PieMinimo />
      </div>
    );
  }

  /* =================================================================
     Vista Resumen
     ================================================================= */
  const recientes = conversaciones.slice(0, 5).map((c) => {
    const ag = agentesDe(c);
    return {
      id: c.id,
      nombre: nombreConversacion(c),
      agentes: ag,
      vistaPrevia:
        ag.length > 1
          ? `Grupo con ${ag.map((a) => AGENTE_POR_ID[a].nombre).join(", ")}`
          : `${AGENTE_POR_ID[c.agente].nombre} · ${AGENTE_POR_ID[c.agente].area}`,
      cuando: ahora ? haceCuanto(c.actualizado_en, ahora) : "",
      href: `/panel/chat?c=${c.id}`,
    };
  });

  return (
    <div className="resumen">
      <div className="resumen__centro">
        <Bienvenida
          fecha={ahora ? fechaLarga(ahora) : "Hoy"}
          marca={<Insignia tono="azul">{plan.nombre}</Insignia>}
          saludo={saludo}
          equipo={activos.map((id) => ({ id, etiqueta: "en tu equipo" }))}
          resumen={
            historial && historial.length ? (
              <>
                Clara lleva {totalResumenes} correos resumidos y este mes van {usados.toLocaleString("es-MX")} de{" "}
                {plan.mensajesMes.toLocaleString("es-MX")} mensajes con tu equipo.
              </>
            ) : (
              <>
                Tu equipo está listo: pégale un correo a Clara para ver qué te sugiere
                {primerAgente === "clara" ? " o pregúntale lo que necesites en el chat" : `, o escríbele a ${AGENTE_POR_ID[primerAgente].nombre} en el chat`}.
                Este mes van {usados.toLocaleString("es-MX")} de {plan.mensajesMes.toLocaleString("es-MX")} mensajes.
              </>
            )
          }
          acciones={
            <>
              <Boton variante="principal" tam="compacto" href="/panel/chat" icono={<Icono nombre="mensaje" tam={16} />}>
                Hablar con mi equipo
              </Boton>
              <Boton variante="sutil" tam="compacto" href="/panel?vista=correo" icono={<Icono nombre="correo" tam={16} />}>
                Resumir un correo
              </Boton>
            </>
          }
        />

        <section className="bloque bloque--pestanas" aria-labelledby="actividad-titulo">
          <h2 id="actividad-titulo" className="sr-only">
            Lo que hizo tu equipo
          </h2>
          <Pestanas
            etiqueta="Lo que hizo tu equipo"
            alineacion="izquierda"
            activa={pestana}
            alCambiar={setPestana}
            classNamePanel="bloque__panel"
            pestanas={[
              {
                id: "actividad",
                etiqueta: "Actividad",
                contenido:
                  historial === null || !ahora ? (
                    <Cargando etiqueta="Cargando la actividad…" />
                  ) : (
                    <LineaTiempo
                      dias={dias}
                      vacio={
                        <Vacio
                          agente="clara"
                          titulo="Todavía no hay actividad"
                          texto="Cuando Clara resuma un correo, aquí verás qué hizo, cuándo y qué te sugiere."
                          accion={
                            <Boton variante="sutil" tam="compacto" href="/panel?vista=correo" flecha>
                              Probar con un correo de ejemplo
                            </Boton>
                          }
                        />
                      }
                    />
                  ),
              },
              {
                id: "visto-bueno",
                etiqueta: "Espera tu visto bueno",
                contenido: (
                  <Vacio
                    icono="check-circulo"
                    pronto
                    titulo="Nada espera tu visto bueno"
                    texto="Muy pronto, cuando un agente prepare algo que necesite tu permiso antes de salir (un mensaje para tus clientes, una respuesta), lo revisas y lo apruebas aquí."
                  />
                ),
              },
              {
                id: "destacados",
                etiqueta: "Destacados",
                contenido:
                  historial === null ? (
                    <Cargando />
                  ) : (
                    <ListaDestacados
                      destacados={destacados}
                      vacio={<Vacio icono="estrella" titulo="Nada urgente por ahora" texto="Aquí aparecen los correos que piden algo de ti, con lo que Clara sugiere hacer." />}
                    />
                  ),
              },
            ]}
          />
        </section>

        <section className="bloque" aria-labelledby="fijados-titulo">
          <CabezaBloque id="fijados-titulo" titulo="Agentes fijados" ver={{ etiqueta: "Ver todos", href: "/panel/agentes" }} />
          <AgentesFijados
            agentes={AGENTES_INFO.map((a) => {
              const enPlan = plan.agentes.includes(a.id);
              const activo = activos.includes(a.id);
              if (!enPlan) return { id: a.id, tono: "neutro" as const, estado: "", bloqueado: `Con ${planMinimo(a.id).nombre}`, href: "/precios" };
              if (!activo) return { id: a.id, tono: "neutro" as const, estado: "Fuera de tu equipo", href: "/panel/agentes" };
              return {
                id: a.id,
                tono: "exito" as const,
                estado: a.id === "clara" ? (conGoogle ? "Conectada a tu Gmail" : "Lista para tu correo") : "Lista en el chat",
                dato: a.id === "clara" && historial?.length ? `${totalResumenes} resúmenes` : undefined,
                href: `/panel/chat?agente=${a.id}`,
              };
            })}
          />
        </section>

        <section className="bloque" aria-labelledby="recientes-titulo">
          <CabezaBloque
            id="recientes-titulo"
            titulo="Conversaciones recientes"
            ver={conversaciones.length ? { etiqueta: "Ver todas", href: "/panel/chat" } : undefined}
          />
          <ConversacionesRecientes
            conversaciones={recientes}
            vacio={
              <Vacio
                agente={primerAgente}
                titulo="Todavía no hablas con tu equipo"
                texto={`Pídele algo a ${AGENTE_POR_ID[primerAgente].nombre}, por ejemplo: «${AGENTE_POR_ID[primerAgente].sugerencias[0]}».`}
                accion={
                  <Boton variante="sutil" tam="compacto" href={`/panel/chat?agente=${primerAgente}`} flecha>
                    Empezar una conversación
                  </Boton>
                }
              />
            }
          />
        </section>
      </div>

      <aside className="resumen__columna" aria-label="Tu negocio y tu plan">
        <TarjetaNegocio
          negocio={datos.negocio === "tu negocio" ? "Tu negocio" : datos.negocio}
          detalle={email}
          plan={plan.nombre}
          usados={usados}
          limite={plan.mensajesMes}
          mes={ahora ? mesDe(ahora) : "este mes"}
          renueva={ahora ? renovacion(ahora) : "inicio de mes"}
          enlace={{ etiqueta: "Tu plan y tu equipo", href: "/panel/agentes" }}
        />
        <ProximasCitas
          citas={[]}
          nota={<Insignia tono="pronto">Pronto</Insignia>}
          vacio={
            <p className="columna__vacio">
              <Icono nombre="calendario" tam={16} />
              Cuando Lola lleve tu agenda, aquí verás tus próximas citas y quién falta por confirmar.
            </p>
          }
        />
        <Metricas
          titulo="Tu equipo en números"
          metricas={[
            { id: "mensajes", etiqueta: "Mensajes del mes", valor: usados.toLocaleString("es-MX"), nota: `de ${plan.mensajesMes.toLocaleString("es-MX")}` },
            { id: "conversaciones", etiqueta: "Conversaciones", valor: `${conversaciones.length}${conversaciones.length >= 60 ? "+" : ""}`, nota: "en total" },
            { id: "correos", etiqueta: "Correos resumidos", valor: totalResumenes, nota: "por Clara" },
          ]}
        />
        <Consejo agente={consejoAgente} texto={consejo.sugerencias[0]} accion={{ etiqueta: `Pedírselo a ${consejo.nombre}`, href: `/panel/chat?agente=${consejoAgente}` }} />
        <Novedades novedades={NOVEDADES} />
        <Ayuda />
        <PieMinimo />
      </aside>
    </div>
  );
}
