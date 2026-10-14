"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Pestanas } from "@/components/base/Pestanas";
import type { ConversacionPanel, ResumenPanel } from "@/components/dashboard/ArmazonPanel";
import { Lienzo } from "@/components/dashboard/Armazon";
import { Ayuda, Consejos, Metricas, Novedades, ProximasCitas, TarjetaNegocio } from "@/components/dashboard/Columna";
import { ListaCorreos, ProbarCorreo, TarjetaGmail, type ResultadoCorreo } from "@/components/dashboard/Correo";
import { NOVEDADES } from "@/components/dashboard/novedades";
import { CabezaPendiente, CajaAprobacion, FilaDesplegable, VistaPrevia } from "@/components/dashboard/Pendientes";
import { AgentesFijados, Bienvenida, ConversacionesRecientes, EstadoVacio, LineaTiempo } from "@/components/dashboard/Resumen";
import type { Consejo, CorreoResumido, Evento } from "@/components/dashboard/tipos";
import { CabezaBloque, cuandoCorto, diaDe, horaDe, primerNombre, useSaludo } from "@/components/dashboard/util";
import { useGoogleDisponible } from "@/components/useGoogleDisponible";
import { AGENTES_INFO, AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";

type Guardado = ResumenPanel;

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

const conSugerencia = (accion: string | null) => Boolean(accion && accion.trim().toLowerCase() !== "ninguna");

/** Sugerencias que la persona ya marcó como hechas (solo en este navegador). */
const CLAVE_HECHOS = "atendel-panel-revisados";
function leerHechos(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_HECHOS) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function guardarHechos(ids: string[]) {
  try {
    localStorage.setItem(CLAVE_HECHOS, JSON.stringify(ids.slice(-200)));
  } catch {
    // Sin almacenamiento (modo privado): solo dura mientras la página esté abierta
  }
}

const aCorreo = (g: Guardado, nuevos?: Set<string>): CorreoResumido => ({
  id: g.id,
  remitente: g.remitente ?? "",
  asunto: g.asunto ?? "",
  resumen: g.resumen,
  sugerencia: g.accion_sugerida,
  cuando: `${diaDe(g.creado_en)} ${horaDe(g.creado_en)}`,
  nuevo: nuevos?.has(g.id),
});

/**
 * El panel con datos reales.
 * - "resumen": bienvenida, lo que Clara sugiere revisar, la actividad,
 *   agentes fijados, conversaciones recientes y la columna de la cuenta.
 * - "correo": el modo de prueba de Clara (pegar o elegir un ejemplo y
 *   resumirlo), Gmail (solo lectura) y el historial. Igual que antes.
 */
export function Panel({
  vista,
  email,
  nombre,
  conGoogle,
  planId,
  usados,
  activos,
  negocio,
  conversaciones,
  resumenes,
  totales,
}: {
  vista: "resumen" | "correo";
  email: string;
  nombre: string | null;
  conGoogle: boolean;
  planId: IdPlan;
  usados: number;
  activos: IdAgente[];
  negocio: string;
  conversaciones: ConversacionPanel[];
  resumenes: ResumenPanel[];
  totales: { conversaciones: number; resumenes: number };
}) {
  const plan = PLAN_POR_ID[planId];
  const supabase = useMemo(() => createClient(), []);
  const googleDisponible = useGoogleDisponible();
  const saludo = useSaludo();
  const [fecha, setFecha] = useState<Date | null>(null);
  useEffect(() => setFecha(new Date()), []);

  /* ---------- Correo: historial, Gmail y modo de prueba (lógica de siempre) ---------- */
  const [historial, setHistorial] = useState<Guardado[] | null>(null);
  const [nuevos, setNuevos] = useState<Set<string>>(() => new Set());
  const [gmailCargando, setGmailCargando] = useState(false);
  const [gmailMensaje, setGmailMensaje] = useState<string | null>(null);
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
    if (vista === "correo") cargarHistorial();
  }, [vista, cargarHistorial]);

  async function resumir(datos: { remitente: string; asunto: string; contenido: string }): Promise<ResultadoCorreo> {
    const res = await fetch("/api/agente-correo/prueba", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const r = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(r.error ?? "Algo salió mal. Intenta de nuevo.");
    cargarHistorial(true);
    return r as ResultadoCorreo;
  }

  async function revisarGmail() {
    setGmailCargando(true);
    setGmailMensaje(null);
    try {
      const res = await fetch("/api/agente-correo", { method: "POST" });
      const datos = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datos.error ?? "No se pudo revisar tu correo.");
      const n: number = datos.procesados ?? 0;
      setGmailMensaje(n === 0 ? "No tienes correos nuevos sin leer." : `Listo: resumí ${n} correo${n === 1 ? "" : "s"}. Están en tu historial.`);
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

  /* ---------- Resumen: lo que Clara sugiere revisar ---------- */
  const [hechos, setHechos] = useState<string[]>([]);
  useEffect(() => setHechos(leerHechos()), []);
  const porRevisar = resumenes.filter((r) => conSugerencia(r.accion_sugerida) && !hechos.includes(r.id));
  const [abierto, setAbierto] = useState<string | null>(null);
  useEffect(() => {
    setAbierto((a) => (a && porRevisar.some((r) => r.id === a) ? a : (porRevisar[0]?.id ?? null)));
    // Solo cuando cambia la lista
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [porRevisar.length]);
  const [pestana, setPestana] = useState("revisar");
  const [aviso, setAviso] = useState<string | null>(null);

  const marcarHecho = (r: ResumenPanel) => {
    const nuevosHechos = [...hechos, r.id];
    setHechos(nuevosHechos);
    guardarHechos(nuevosHechos);
    setAviso(`Marcaste «${r.asunto || "Correo sin asunto"}» como atendido.`);
  };

  const actividad = useMemo<Evento[]>(() => {
    const ahora = new Date();
    const deCorreos = resumenes.map((r) => ({
      cuando: r.creado_en,
      evento: {
        id: `r-${r.id}`,
        tipo: "caja" as const,
        dia: diaDe(r.creado_en, ahora),
        hora: horaDe(r.creado_en),
        agente: "clara" as const,
        titulo: `**Clara** resumió ${r.asunto ? `«${r.asunto}»` : "un correo"}${r.remitente ? ` de ${r.remitente.replace(/\s*<[^>]+>/, "")}` : ""}`,
        lineas: [{ texto: r.resumen }, ...(conSugerencia(r.accion_sugerida) ? [{ etiqueta: "Sugiere", texto: r.accion_sugerida as string }] : [])],
      },
    }));
    const deChats = conversaciones.map((c) => {
      const grupo = (c.participantes ?? []).length >= 2;
      return {
        cuando: c.actualizado_en,
        evento: {
          id: `c-${c.id}`,
          tipo: "simple" as const,
          dia: diaDe(c.actualizado_en, ahora),
          hora: horaDe(c.actualizado_en),
          agente: c.agente,
          icono: grupo ? ("usuarios" as const) : ("mensaje" as const),
          texto: grupo
            ? `Conversación en grupo **${c.titulo}** con ${(c.participantes ?? []).map((p) => AGENTE_POR_ID[p]?.nombre).filter(Boolean).join(", ")}`
            : `Conversación con **${AGENTE_POR_ID[c.agente].nombre}**: ${c.titulo}`,
        },
      };
    });
    return [...deCorreos, ...deChats]
      .sort((a, b) => (a.cuando < b.cuando ? 1 : -1))
      .slice(0, 20)
      .map((x) => x.evento);
  }, [resumenes, conversaciones]);

  /* ---------- Datos para el centro y la columna ---------- */
  const nombreCorto = nombre ? primerNombre(nombre) : null;
  const chatsDe = (id: IdAgente) => conversaciones.filter((c) => c.agente === id || (c.participantes ?? []).includes(id)).length;
  const sinNada = totales.resumenes === 0 && totales.conversaciones === 0;
  const negocioVisible = negocio && negocio !== "tu negocio" ? negocio : null;

  const consejos: Consejo[] = [
    ...(!conGoogle && googleDisponible
      ? [{ id: "gmail", texto: "Conecta tu **Gmail** y Clara resume tu bandeja sola, con permiso de solo lectura.", accion: "Conectar Gmail", href: "/panel?vista=correo#gmail" }]
      : []),
    ...(totales.resumenes === 0
      ? [{ id: "probar", texto: "Prueba a **Clara** con uno de los correos de ejemplo: te dice de qué trata y qué conviene hacer.", accion: "Resumir un correo", href: "/panel?vista=correo#probar" }]
      : []),
    ...(plan.id !== "free"
      ? [{ id: "grupo", texto: "Junta a tus agentes en un **grupo** y menciónalos con @ para pedirle algo a cada uno.", accion: "Ir a Conversaciones", href: "/panel/chat" }]
      : [{ id: "lola", texto: "Con **Atendel One** se suma Lola, que atiende tu WhatsApp y tus citas.", accion: "Ver planes", href: "/precios" }]),
  ].slice(0, 2);

  const pieNegocio =
    plan.id !== "max" ? (
      <Boton variante="sutil" tam="compacto" bloque href="/precios" flecha>
        Ver planes
      </Boton>
    ) : null;

  const columnaResumen = (
    <>
      <TarjetaNegocio negocio={negocioVisible ?? email} giro={negocioVisible ? email : undefined} plan={plan} usados={usados} fecha={fecha} pie={pieNegocio} />
      <ProximasCitas
        titulo=""
        total={0}
        citas={[]}
        vacio={
          <EstadoVacio
            plano
            icono="calendario"
            titulo="Todavía no hay citas aquí"
            texto="Cuando Lola lleve tu agenda, tus próximas citas aparecerán en esta lista."
            accion={<Insignia tono="pronto">Pronto</Insignia>}
          />
        }
      />
      <Metricas
        titulo="Tu cuenta"
        nota={fecha ? "este mes" : undefined}
        metricas={[
          { etiqueta: "Mensajes usados", valor: usados.toLocaleString("es-MX") },
          { etiqueta: "Correos resumidos", valor: totales.resumenes.toLocaleString("es-MX") },
          { etiqueta: "Conversaciones", valor: totales.conversaciones.toLocaleString("es-MX") },
          { etiqueta: "Agentes en tu equipo", valor: `${activos.length} de ${plan.agentes.length}` },
        ]}
      />
      <Consejos consejos={consejos} />
      <Novedades novedades={NOVEDADES} />
      <Ayuda contexto="Lo que ves aquí sale de tu cuenta: tu plan, tus conversaciones y los correos que Clara leyó." />
    </>
  );

  /* ---------- Vista Correo ---------- */
  if (vista === "correo") {
    const lista = historial?.map((g) => aCorreo(g, nuevos)) ?? [];
    return (
      <Lienzo
        etiquetaColumna="Tu correo"
        columna={
          <>
            <TarjetaGmail
              conGoogle={conGoogle}
              googleDisponible={googleDisponible}
              cargando={gmailCargando}
              mensaje={gmailMensaje}
              alRevisar={revisarGmail}
              alConectar={conectarGoogle}
            />
            <TarjetaNegocio negocio={negocioVisible ?? email} giro={negocioVisible ? email : undefined} plan={plan} usados={usados} fecha={fecha} />
            <Ayuda contexto="Clara solo lee: nunca envía ni borra correos sin ti." />
          </>
        }
      >
        <header className="tb-encabezado">
          <div className="tb-encabezado__sello">
            <span className="tb-texto-2">Clara · Correo</span>
          </div>
          <h1 className="t-app-titulo-grande">Correo</h1>
          <p className="tb-encabezado__texto">Pega un correo o elige un ejemplo. Atendel te dice de qué trata y qué conviene hacer.</p>
        </header>
        <ProbarCorreo ejemplos={EJEMPLOS} resumir={resumir} />
        <section id="historial" className="tb-bloque" aria-labelledby="tb-historial">
          <CabezaBloque id="tb-historial" titulo="Lo que Atendel ya leyó">
            {historial && historial.length > 0 ? (
              <span className="tb-texto-2">
                {historial.length} {historial.length === 1 ? "resumen" : "resúmenes"}
              </span>
            ) : null}
          </CabezaBloque>
          <ListaCorreos
            correos={lista}
            cargando={historial === null}
            vacio={
              <EstadoVacio
                agente="clara"
                titulo="Todavía no hay resúmenes"
                texto="Prueba con uno de los ejemplos de arriba o conecta tu Gmail: lo que Clara lea aparecerá aquí."
              />
            }
          />
        </section>
      </Lienzo>
    );
  }

  /* ---------- Vista Resumen ---------- */
  const textoResumen = sinNada ? (
    <>Tu equipo está listo. Empieza resumiendo un correo con Clara o escribiéndole a tu equipo.</>
  ) : (
    <>
      Clara ha resumido {totales.resumenes.toLocaleString("es-MX")} {totales.resumenes === 1 ? "correo" : "correos"} y llevas{" "}
      {usados.toLocaleString("es-MX")} de {plan.mensajesMes.toLocaleString("es-MX")} mensajes este mes.{" "}
      {porRevisar.length ? (
        <button type="button" className="tb-enlace tb-enlace--fuerte" onClick={() => setPestana("revisar")}>
          {porRevisar.length === 1 ? "Uno tiene algo que conviene hacer." : `${porRevisar.length} tienen algo que conviene hacer.`}
        </button>
      ) : (
        "No hay nada pendiente por revisar."
      )}
    </>
  );

  const pestanas = [
    {
      id: "revisar",
      etiqueta: (
        <>
          Por revisar
          {porRevisar.length ? <Insignia contador={porRevisar.length} solida etiqueta={`${porRevisar.length} por revisar`} /> : null}
        </>
      ),
      contenido: (
        <section className="tb-tarjeta tb-bandeja" aria-label="Lo que Clara sugiere revisar">
          <div className="tb-bandeja__cabeza">
            <div className="tb-bandeja__titulos">
              <p className="tb-bandeja__titulo">
                {porRevisar.length
                  ? `${porRevisar.length} ${porRevisar.length === 1 ? "correo tiene" : "correos tienen"} algo que conviene hacer`
                  : "Nada por revisar"}
              </p>
              <p className="tb-bandeja__nota">
                <Icono nombre="escudo" tam={16} />
                Clara solo sugiere: tú decides qué se hace.
              </p>
            </div>
          </div>
          <div className="tb-bandeja__aviso" role="status" aria-live="polite">
            {aviso ? (
              <p className="tb-aviso tb-aviso--exito">
                <Icono nombre="check-circulo" tam={16} />
                <span className="tb-aviso__texto">{aviso}</span>
              </p>
            ) : null}
          </div>
          {porRevisar.length ? (
            <ul>
              {porRevisar.map((r) => (
                <FilaDesplegable
                  key={r.id}
                  abierta={abierto === r.id}
                  alAlternar={() => setAbierto(abierto === r.id ? null : r.id)}
                  cabeza={
                    <CabezaPendiente
                      agente="clara"
                      titulo={r.asunto || "Correo sin asunto"}
                      detalle={`Clara · Correo${r.remitente ? ` · ${r.remitente.replace(/\s*<[^>]+>/, "")}` : ""}`}
                      hora={cuandoCorto(r.creado_en)}
                    />
                  }
                >
                  <div className="tb-detalle">
                    <VistaPrevia
                      vista={{ tipo: "resumen", de: r.remitente ?? "Sin remitente", asunto: r.asunto ?? "Sin asunto", resumen: r.resumen }}
                    />
                    <CajaAprobacion
                      estado={{ tono: "azul", texto: "Por revisar" }}
                      titulo="Clara sugiere"
                      detalle={r.accion_sugerida ?? ""}
                      acciones={
                        <>
                          <Boton variante="sutil" tam="compacto" icono={<Icono nombre="check" />} onClick={() => marcarHecho(r)}>
                            Ya lo atendí
                          </Boton>
                          <Boton variante="fantasma" tam="compacto" href="/panel?vista=correo#historial" flecha>
                            Ver en Correo
                          </Boton>
                        </>
                      }
                    />
                  </div>
                </FilaDesplegable>
              ))}
            </ul>
          ) : (
            <EstadoVacio
              plano
              agente="clara"
              titulo={totales.resumenes ? "Todo al día" : "Nada por revisar todavía"}
              texto="Cuando Clara resuma un correo que pida hacer algo, aparecerá aquí con su sugerencia."
              accion={
                <Boton variante="sutil" tam="compacto" href="/panel?vista=correo#probar" icono={<Icono nombre="correo" />}>
                  Resumir un correo
                </Boton>
              }
            />
          )}
        </section>
      ),
    },
    {
      id: "actividad",
      etiqueta: "Actividad",
      contenido: (
        <div className="tb-tarjeta tb-actividad">
          <LineaTiempo
            eventos={actividad}
            nombreTu={email}
            vacio={
              <EstadoVacio
                plano
                icono="reloj"
                titulo="Todavía no hay actividad"
                texto="Aquí verás, en orden, lo que hacen tus agentes: correos resumidos y conversaciones."
              />
            }
          />
        </div>
      ),
    },
  ];

  return (
    <Lienzo columna={columnaResumen}>
      <Bienvenida
        fecha={saludo?.fecha ?? null}
        saludo={`${saludo?.texto ?? "Hola"}${nombreCorto ? `, ${nombreCorto}` : ""}`}
        resumen={textoResumen}
        acciones={
          <>
            <Boton tam="compacto" href="/panel/chat" icono={<Icono nombre="mensaje" />}>
              Hablar con mi equipo
            </Boton>
            <Boton variante="sutil" tam="compacto" href="/panel?vista=correo#probar" icono={<Icono nombre="correo" />}>
              Resumir un correo
            </Boton>
          </>
        }
        equipo={{ agentes: activos }}
      />

      <section className="tb-bloque tb-tu-dia" aria-labelledby="tb-tu-dia">
        <CabezaBloque id="tb-tu-dia" titulo="Tu día" />
        <Pestanas etiqueta="Tu día" alineacion="izquierda" activa={pestana} alCambiar={setPestana} pestanas={pestanas} className="tb-pestanas" />
      </section>

      <AgentesFijados
        agentes={AGENTES_INFO.map((a) => {
          const permitido = plan.agentes.includes(a.id);
          const enEquipo = activos.includes(a.id);
          const chats = chatsDe(a.id);
          const datos = !enEquipo
            ? []
            : a.id === "clara"
              ? [`${totales.resumenes.toLocaleString("es-MX")} correos resumidos`]
              : [`${chats} ${chats === 1 ? "conversación" : "conversaciones"}`];
          return {
            id: a.id,
            nombre: a.nombre,
            area: a.area,
            abarca: a.abarca,
            lema: a.lema,
            estado: !permitido
              ? { tono: "neutro" as const, texto: `Con ${planMinimo(a.id).nombre}` }
              : enEquipo
                ? { tono: "exito" as const, texto: a.id === "clara" && conGoogle ? "Conectada a Gmail" : "En tu equipo" }
                : { tono: "neutro" as const, texto: "Fuera de tu equipo" },
            datos,
            apagado: !enEquipo,
            href: enEquipo ? `/panel/chat?agente=${a.id}` : "/panel/agentes",
          };
        })}
        accion={
          <Link href="/panel/agentes" className="tb-enlace">
            Ver tu equipo
          </Link>
        }
      />

      <ConversacionesRecientes
        conversaciones={conversaciones.slice(0, 5).map((c) => {
          const grupo = (c.participantes ?? []).length >= 2;
          return {
            id: c.id,
            nombre: grupo ? c.titulo : AGENTE_POR_ID[c.agente].nombre,
            agentes: grupo ? (c.participantes ?? []) : [c.agente],
            ultimo: grupo ? (c.participantes ?? []).map((p) => AGENTE_POR_ID[p]?.nombre).join(", ") : c.titulo,
            hora: cuandoCorto(c.actualizado_en),
            href: `/panel/chat?c=${c.id}`,
          };
        })}
        accion={
          <Link href="/panel/chat" className="tb-enlace">
            Ver todas
          </Link>
        }
        vacio={
          <EstadoVacio
            icono="conversaciones"
            titulo="Aún no hablas con tu equipo"
            texto="Escríbele a Clara o arma un grupo con tus agentes. Tus conversaciones aparecerán aquí."
            accion={
              <Boton variante="sutil" tam="compacto" href="/panel/chat" icono={<Icono nombre="mensaje" />}>
                Abrir el chat
              </Boton>
            }
          />
        }
      />
    </Lienzo>
  );
}
