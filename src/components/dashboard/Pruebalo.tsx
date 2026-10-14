"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChatDemo } from "@/components/ChatDemo";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import type { ElementoMenu } from "@/components/base/Menu";
import { Pestanas } from "@/components/base/Pestanas";
import { AGENTES_INFO, AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import {
  DEMO_ACTIVIDAD,
  DEMO_CITAS,
  DEMO_CONSEJOS,
  DEMO_CONVERSACIONES,
  DEMO_CORREOS,
  DEMO_CORREOS_PRUEBA,
  DEMO_DATOS_AGENTE,
  DEMO_DESTACADOS,
  DEMO_GRUPOS,
  DEMO_METRICAS,
  DEMO_NEGOCIO,
  DEMO_PENDIENTES,
  DEMO_PLAN,
  DEMO_USUARIO,
} from "@/lib/demo-dashboard";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";
import { PLAN_POR_ID } from "@/lib/planes";
import { VistaAgentes } from "./Agentes";
import { Armazon, coincide, Lienzo } from "./Armazon";
import { Ayuda, Consejos, Metricas, Novedades, ProximasCitas, TarjetaNegocio } from "./Columna";
import { ListaCorreos, ProbarCorreo } from "./Correo";
import { NOVEDADES } from "./novedades";
import { BandejaPendientes, type Aviso } from "./Pendientes";
import { AgentesFijados, Bienvenida, ConversacionesRecientes, Destacados, EstadoVacio, Filtros, LineaTiempo } from "./Resumen";
import type { AgenteLateral, ElementoLateral, Evento, GrupoResultados, Pendiente } from "./tipos";
import { CabezaBloque, primerNombre, useSaludo } from "./util";

/* =====================================================================
   /pruebalo: el dashboard completo con DATOS DE EJEMPLO de una clínica.
   Las vistas (Resumen, Conversaciones, Agentes, Correo) cambian aquí
   mismo, sin recargar; la dirección guarda la vista (#conversaciones…)
   para que "atrás" funcione. Nada sale de verdad y no se llama a la IA.
   ===================================================================== */

type IdVista = "resumen" | "conversaciones" | "agentes" | "correo";
type IdPestana = "pendientes" | "actividad" | "destacados";
type FiltroActividad = "todos" | IdAgente | "relevos";

const VISTAS: IdVista[] = ["resumen", "conversaciones", "agentes", "correo"];
const NOMBRE_VISTA: Record<IdVista, string> = {
  resumen: "Resumen",
  conversaciones: "Conversaciones",
  agentes: "Agentes",
  correo: "Correo",
};
const plan = PLAN_POR_ID[DEMO_PLAN.id];
const NOTA_EJEMPLO = "Datos de ejemplo: Clínica Alba, sus pacientes y sus números no son reales. Aquí nada se envía de verdad.";

const horaAhora = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
const sinNegritas = (t: string) => t.replace(/\*\*/g, "");

export function PruebaloDashboard() {
  const [vista, setVista] = useState<IdVista>("resumen");
  const [pestana, setPestana] = useState<IdPestana>("pendientes");
  const [pendientes, setPendientes] = useState<Pendiente[]>(DEMO_PENDIENTES);
  const [abierto, setAbierto] = useState<string | null>(DEMO_PENDIENTES[0].id);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [hechos, setHechos] = useState<Evento[]>([]);
  const [filtro, setFiltro] = useState<FiltroActividad>("todos");
  const [fijados, setFijados] = useState<string[]>(["d1"]);
  const [elegidos, setElegidos] = useState<IdAgente[]>([...plan.agentes]);
  const [guardando, setGuardando] = useState<IdAgente | null>(null);
  const [errorEquipo, setErrorEquipo] = useState<string | null>(null);
  const [fecha, setFecha] = useState<Date | null>(null);
  const saludo = useSaludo();
  const nombre = primerNombre(DEMO_USUARIO.nombre);

  useEffect(() => setFecha(new Date()), []);
  const [chatVisto, setChatVisto] = useState(false);
  useEffect(() => {
    if (vista === "conversaciones") setChatVisto(true);
  }, [vista]);

  /* ---------- Vista en la dirección (#agentes), con "atrás" ---------- */
  useEffect(() => {
    const leer = () => {
      const h = window.location.hash.slice(1) as IdVista;
      if (!h || h === "resumen") setVista("resumen");
      else if (VISTAS.includes(h)) setVista(h);
    };
    leer();
    window.addEventListener("popstate", leer);
    return () => window.removeEventListener("popstate", leer);
  }, []);

  const ir = useCallback((v: IdVista) => {
    setVista((actual) => {
      if (actual !== v) {
        window.history.pushState(null, "", v === "resumen" ? window.location.pathname : `#${v}`);
        window.scrollTo({ top: 0 });
      }
      return v;
    });
  }, []);

  const irAPestana = useCallback(
    (p: IdPestana, pendiente?: string) => {
      ir("resumen");
      setPestana(p);
      if (pendiente) setAbierto(pendiente);
      window.requestAnimationFrame(() => document.getElementById("tb-tu-dia")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    },
    [ir],
  );

  /* ---------- Lo que espera tu visto bueno ---------- */
  const aprobar = (p: Pendiente) => {
    setEnviando(p.id);
    setAviso(null);
    window.setTimeout(() => {
      const i = pendientes.findIndex((x) => x.id === p.id);
      const resto = pendientes.filter((x) => x.id !== p.id);
      setPendientes(resto);
      setAbierto(resto[Math.min(i, resto.length - 1)]?.id ?? null);
      const programado = p.caja.accion.toLowerCase().includes("programar");
      setHechos((h) => [
        {
          id: `hecho-${p.id}`,
          tipo: "simple",
          dia: "Hoy",
          hora: horaAhora(),
          agente: "tu",
          icono: "check",
          texto: `**Tú** ${p.caja.hecho}`,
          insignia: { tono: "exito", texto: programado ? "Programado" : "Enviado" },
        },
        ...h,
      ]);
      setAviso({
        tono: "exito",
        texto: programado ? `**Programado.** ${AGENTE_POR_ID[p.agente].nombre} lo manda a la hora indicada.` : `**Enviado.** Queda en la actividad de hoy.`,
        accion: { etiqueta: "Ver actividad", alElegir: () => setPestana("actividad") },
      });
      setEnviando(null);
    }, 900);
  };

  const descartar = (p: Pendiente) => {
    const i = pendientes.findIndex((x) => x.id === p.id);
    const resto = pendientes.filter((x) => x.id !== p.id);
    setPendientes(resto);
    setAbierto(resto[Math.min(i, resto.length - 1)]?.id ?? null);
    setAviso({
      tono: "neutro",
      texto: `Descartaste «${p.titulo}». No se envió nada.`,
      accion: {
        etiqueta: "Deshacer",
        alElegir: () => {
          setPendientes((actual) => {
            if (actual.some((x) => x.id === p.id)) return actual;
            const copia = [...actual];
            copia.splice(i, 0, p);
            return copia;
          });
          setAbierto(p.id);
          setAviso(null);
        },
      },
    });
  };

  const guardarTexto = (id: string, texto: string) => {
    setPendientes((ps) => ps.map((p) => (p.id === id && "texto" in p.vista ? { ...p, vista: { ...p.vista, texto } as Pendiente["vista"] } : p)));
    setAviso({ tono: "exito", texto: "**Guardaste tus cambios.** Revisa y apruébalo cuando quieras." });
  };

  const reiniciar = () => {
    setPendientes(DEMO_PENDIENTES);
    setAbierto(DEMO_PENDIENTES[0].id);
    setHechos([]);
    setAviso(null);
  };

  /* ---------- Agentes (equipo, solo en este navegador) ---------- */
  const alternar = (id: IdAgente) => {
    if (guardando) return;
    const esta = elegidos.includes(id);
    if (esta && elegidos.length === 1) {
      setErrorEquipo("Tu equipo necesita al menos un agente.");
      return;
    }
    setErrorEquipo(null);
    setGuardando(id);
    window.setTimeout(() => {
      setElegidos((e) => (esta ? e.filter((x) => x !== id) : [...e, id]));
      setGuardando(null);
    }, 400);
  };
  const verFicha = (id: IdAgente) => window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: id }));

  /* ---------- Datos derivados ---------- */
  const actividad = useMemo(() => [...hechos, ...DEMO_ACTIVIDAD], [hechos]);
  const actividadFiltrada = actividad.filter((e) => {
    if (filtro === "todos") return true;
    if (filtro === "relevos") return e.tipo === "relevo";
    if (e.tipo === "relevo") return e.de === filtro || e.a === filtro;
    return e.agente === filtro;
  });
  const pendienteDe = (id: IdAgente) => pendientes.some((p) => p.agente === id);

  const agentesLateral: AgenteLateral[] = AGENTES_INFO.map((a) => {
    const enEquipo = elegidos.includes(a.id);
    const base = { id: a.id, nombre: a.nombre, alElegir: () => ir("agentes") };
    if (!enEquipo) return { ...base, estado: "Fuera de tu equipo", tono: "neutro" as const, apagado: true };
    if (a.id === "lola") return { ...base, estado: "Contestando un WhatsApp", tono: "azul" as const, pulso: true };
    if (pendienteDe(a.id)) return { ...base, estado: "Espera tu visto bueno", tono: "atencion" as const };
    return { ...base, estado: "Al día", tono: "exito" as const };
  });

  const navegacion: ElementoLateral[] = [
    { id: "resumen", etiqueta: "Resumen", icono: "inicio", alElegir: () => ir("resumen") },
    { id: "conversaciones", etiqueta: "Conversaciones", icono: "conversaciones", contador: 3, etiquetaContador: "3 mensajes sin leer", alElegir: () => ir("conversaciones") },
    { id: "agentes", etiqueta: "Agentes", icono: "agentes", alElegir: () => ir("agentes") },
    { id: "citas", etiqueta: "Citas", icono: "calendario", pronto: true },
    { id: "correo", etiqueta: "Correo", icono: "correo", alElegir: () => ir("correo") },
    { id: "clientes", etiqueta: "Clientes", icono: "clientes", pronto: true },
    { id: "reportes", etiqueta: "Reportes", icono: "grafica", pronto: true },
    { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
  ];

  const crear: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Crear" },
    { id: "conversacion", etiqueta: "Nueva conversación", icono: "mensaje", descripcion: "Con uno de tus agentes", alElegir: () => ir("conversaciones") },
    { id: "cita", etiqueta: "Agendar cita", icono: "calendario", pronto: true },
    { id: "grupo", etiqueta: "Nuevo grupo", icono: "usuarios", descripcion: "Desde Conversaciones", alElegir: () => ir("conversaciones") },
    { id: "importar", etiqueta: "Importar contactos", icono: "clientes", pronto: true },
  ];

  const avisos: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: pendientes.length ? "Esperan tu visto bueno" : "Avisos" },
    ...pendientes.map<ElementoMenu>((p) => ({
      id: `aviso-${p.id}`,
      etiqueta: p.titulo,
      descripcion: `${AGENTE_POR_ID[p.agente].nombre} · ${p.hora}`,
      icono: "reloj",
      alElegir: () => irAPestana("pendientes", p.id),
    })),
    { tipo: "separador" },
    { id: "aviso-cita", etiqueta: "Lola agendó a Sofía Ramírez", descripcion: "Viernes 10:00 · primera limpieza facial", icono: "calendario", alElegir: () => irAPestana("actividad") },
    { id: "aviso-chat", etiqueta: "Clara te escribió en el chat", descripcion: "Llegó la factura de CFE", icono: "mensaje", alElegir: () => ir("conversaciones") },
    { tipo: "separador" },
    { id: "aviso-todo", etiqueta: "Ver toda la actividad", icono: "flecha", alElegir: () => irAPestana("actividad") },
  ];

  const buscar = (q: string): GrupoResultados[] => [
    {
      titulo: "Espera tu visto bueno",
      elementos: pendientes
        .filter((p) => coincide(`${p.titulo} ${p.detalle}`, q))
        .map((p) => ({ id: `p-${p.id}`, etiqueta: p.titulo, detalle: p.detalle, agente: p.agente, alElegir: () => irAPestana("pendientes", p.id) })),
    },
    {
      titulo: "Próximas citas",
      elementos: DEMO_CITAS.citas
        .filter((c) => coincide(`${c.nombre} ${c.servicio}`, q))
        .map((c) => ({ id: `c-${c.nombre}`, etiqueta: `${c.nombre} · ${c.hora}`, detalle: `${c.servicio} · ${c.estado.texto}`, icono: "calendario" as const, alElegir: () => ir("resumen") })),
    },
    {
      titulo: "Conversaciones",
      elementos: DEMO_CONVERSACIONES.filter((c) => coincide(`${c.nombre} ${c.ultimo}`, q)).map((c) => ({
        id: `ch-${c.id}`,
        etiqueta: c.nombre,
        detalle: c.ultimo,
        agente: c.agentes[0],
        alElegir: () => ir("conversaciones"),
      })),
    },
    {
      titulo: "Actividad",
      elementos: actividad
        .filter((e) => coincide(e.tipo === "caja" ? e.titulo : e.texto, q))
        .map((e) => ({
          id: `a-${e.id}`,
          etiqueta: sinNegritas(e.tipo === "caja" ? e.titulo : e.texto),
          detalle: `${e.dia} · ${e.hora}`,
          agente: e.tipo === "relevo" ? e.de : e.agente === "tu" ? undefined : e.agente,
          icono: "check" as const,
          alElegir: () => irAPestana("actividad"),
        })),
    },
    {
      titulo: "Correo",
      elementos: DEMO_CORREOS.filter((c) => coincide(`${c.remitente} ${c.asunto} ${c.resumen}`, q)).map((c) => ({
        id: `m-${c.id}`,
        etiqueta: `${c.remitente} · ${c.asunto}`,
        detalle: c.resumen,
        icono: "correo" as const,
        alElegir: () => ir("correo"),
      })),
    },
    {
      titulo: "Agentes",
      elementos: AGENTES_INFO.filter((a) => coincide(`${a.nombre} ${a.area} ${a.abarca}`, q)).map((a) => ({
        id: `ag-${a.id}`,
        etiqueta: a.nombre,
        detalle: `${a.area} · ${a.abarca}`,
        agente: a.id,
        alElegir: () => ir("agentes"),
      })),
    },
  ];

  /* ---------- Columna derecha (Resumen) ---------- */
  const pieNegocio = (
    <Boton variante="sutil" tam="compacto" bloque href="/entrar" flecha>
      Usar Atendel en mi negocio
    </Boton>
  );
  const columna = (
    <>
      <TarjetaNegocio negocio={DEMO_NEGOCIO.nombre} giro={DEMO_NEGOCIO.giro} plan={plan} usados={DEMO_PLAN.usados} fecha={fecha} pie={pieNegocio} />
      <ProximasCitas titulo={DEMO_CITAS.titulo} total={DEMO_CITAS.total} citas={DEMO_CITAS.citas} />
      <Metricas titulo="Esta semana" nota="vs. la anterior" metricas={DEMO_METRICAS} />
      <Consejos
        consejos={DEMO_CONSEJOS.map((c) => ({ ...c, alElegir: () => ir("conversaciones") }))}
      />
      <Novedades novedades={NOVEDADES} />
      <Ayuda contexto="Todo lo que ves aquí es un ejemplo. Para usarlo con tu negocio, entra con tu correo: no necesitas contraseña." />
    </>
  );

  /* ---------- Pestañas del centro ---------- */
  const vacioPendientes = (
    <EstadoVacio
      plano
      icono="check-circulo"
      titulo="Todo al día"
      texto="Tus agentes te avisan aquí cuando preparen algo que necesite tu permiso."
      accion={
        <Boton variante="sutil" tam="compacto" icono={<Icono nombre="repetir" />} onClick={reiniciar}>
          Volver a cargar el ejemplo
        </Boton>
      }
    />
  );

  const pestanas = [
    {
      id: "pendientes",
      etiqueta: (
        <>
          Espera tu visto bueno
          {pendientes.length ? <Insignia contador={pendientes.length} solida etiqueta={`${pendientes.length} pendientes`} /> : null}
        </>
      ),
      contenido: (
        <BandejaPendientes
          pendientes={pendientes}
          abierto={abierto}
          alAbrir={setAbierto}
          enviando={enviando}
          alAprobar={aprobar}
          alDescartar={descartar}
          alGuardarTexto={guardarTexto}
          aviso={aviso}
          nombreTu={DEMO_USUARIO.nombre}
          vacio={vacioPendientes}
          cabeza={<span className="tb-texto-2 tb-solo-escritorio">Más recientes primero</span>}
        />
      ),
    },
    {
      id: "actividad",
      etiqueta: "Actividad",
      contenido: (
        <div className="tb-tarjeta tb-actividad">
          <Filtros<FiltroActividad>
            etiqueta="Filtrar la actividad"
            activo={filtro}
            alCambiar={setFiltro}
            opciones={[
              { id: "todos", etiqueta: "Todo" },
              ...AGENTES_INFO.map((a) => ({ id: a.id as FiltroActividad, etiqueta: a.nombre, agente: a.id })),
              { id: "relevos", etiqueta: "Relevos", icono: "flecha" as const },
            ]}
          />
          <LineaTiempo
            eventos={actividadFiltrada}
            nombreTu={DEMO_USUARIO.nombre}
            vacio={<EstadoVacio plano icono="reloj" titulo="Nada por aquí todavía" texto="Cuando este agente haga algo, lo verás en esta línea de tiempo." />}
          />
        </div>
      ),
    },
    {
      id: "destacados",
      etiqueta: "Destacados",
      contenido: <Destacados destacados={DEMO_DESTACADOS} fijados={fijados} alFijar={(id) => setFijados((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))} />,
    },
  ];

  const resumen = (
    <Lienzo columna={columna} nota={NOTA_EJEMPLO}>
      <Bienvenida
        fecha={saludo?.fecha ?? null}
        saludo={`${saludo?.texto ?? "Hola"}, ${nombre}`}
        ejemplo
        resumen={
          <>
            Desde ayer tus agentes hicieron {actividad.length} cosas por Clínica Alba.{" "}
            {pendientes.length ? (
              <>
                <button type="button" className="tb-enlace tb-enlace--fuerte" onClick={() => irAPestana("pendientes")}>
                  {pendientes.length === 1 ? "Una espera" : `${pendientes.length} esperan`} tu visto bueno
                </button>{" "}
                antes de salir.
              </>
            ) : (
              "Todo lo que prepararon ya tiene tu visto bueno."
            )}
          </>
        }
        acciones={
          <>
            <Boton variante="sutil" tam="compacto" icono={<Icono nombre="mensaje" />} onClick={() => ir("conversaciones")}>
              Habla con tu equipo
            </Boton>
            <Boton
              variante="fantasma"
              tam="compacto"
              icono={<Icono nombre="calendario" />}
              onClick={() => document.getElementById("tb-citas")?.scrollIntoView({ behavior: "smooth", block: "center" })}
            >
              Ver la agenda de mañana
            </Boton>
          </>
        }
        equipo={{ agentes: elegidos, escribe: elegidos.includes("lola") ? { agente: "lola", texto: "Lola contesta un WhatsApp" } : undefined }}
      />

      <section className="tb-bloque tb-tu-dia" aria-labelledby="tb-tu-dia">
        <CabezaBloque id="tb-tu-dia" titulo="Tu día" />
        <Pestanas
          etiqueta="Tu día"
          alineacion="izquierda"
          activa={pestana}
          alCambiar={(id) => setPestana(id as IdPestana)}
          pestanas={pestanas}
          className="tb-pestanas"
        />
      </section>

      <AgentesFijados
        agentes={AGENTES_INFO.map((a) => {
          const enEquipo = elegidos.includes(a.id);
          const lateral = agentesLateral.find((x) => x.id === a.id)!;
          return {
            id: a.id,
            nombre: a.nombre,
            area: a.area,
            abarca: a.abarca,
            lema: a.lema,
            estado: { tono: lateral.tono, texto: lateral.estado },
            datos: enEquipo ? DEMO_DATOS_AGENTE[a.id] : [],
            apagado: !enEquipo,
            alElegir: () => ir("agentes"),
          };
        })}
        accion={
          <button type="button" className="tb-enlace" onClick={() => ir("agentes")}>
            Ver tu equipo
          </button>
        }
      />

      <ConversacionesRecientes
        conversaciones={DEMO_CONVERSACIONES.map((c) => ({ ...c, alElegir: () => ir("conversaciones") }))}
        accion={
          <button type="button" className="tb-enlace" onClick={() => ir("conversaciones")}>
            Ver todas
          </button>
        }
        vacio={null}
      />
    </Lienzo>
  );

  const conversaciones = (
    <Lienzo nota={NOTA_EJEMPLO}>
      <header className="tb-encabezado">
        <h1 className="t-app-titulo-grande">Conversaciones</h1>
        <p className="tb-encabezado__texto">Escríbeles, usa @ para mencionar o / para una acción. Las respuestas son de ejemplo: aquí no se llama a la IA.</p>
      </header>
      <div className="tb-chat">
        <ChatDemo completa />
      </div>
    </Lienzo>
  );

  const agentes = (
    <Lienzo
      nota={NOTA_EJEMPLO}
      etiquetaColumna="Tu plan"
      columna={
        <>
          <TarjetaNegocio negocio={DEMO_NEGOCIO.nombre} giro={DEMO_NEGOCIO.giro} plan={plan} usados={DEMO_PLAN.usados} fecha={fecha} />
          <section className="tb-tarjeta tb-incluye" aria-labelledby="tb-incluye">
            <h2 id="tb-incluye" className="tb-tarjeta__titulo">
              Qué incluye {plan.nombre}
            </h2>
            <ul className="tb-incluye__lista">
              {plan.incluye.map((i) => (
                <li key={i}>
                  <Icono nombre="check" tam={16} />
                  {i}
                </li>
              ))}
            </ul>
            <p className="tb-texto-2">Tu plan lo cambia el equipo de Atendel; aquí solo eliges quién trabaja contigo.</p>
          </section>
        </>
      }
    >
      <VistaAgentes
        plan={plan}
        elegidos={elegidos}
        libre
        guardando={guardando}
        error={errorEquipo}
        alAlternar={alternar}
        hablar={() => ({ alElegir: () => ir("conversaciones") })}
        verFicha={verFicha}
        ejemplo
      />
    </Lienzo>
  );

  const correo = (
    <Lienzo
      nota={NOTA_EJEMPLO}
      etiquetaColumna="Tu correo"
      columna={
        <>
          <section className="tb-tarjeta tb-gmail" aria-labelledby="tb-gmail-demo">
            <div className="tb-tarjeta__cabeza">
              <h2 id="tb-gmail-demo" className="tb-tarjeta__titulo">
                Gmail
              </h2>
              <Insignia>En tu panel</Insignia>
            </div>
            <p className="tb-gmail__texto">En tu panel, Clara lee tu Gmail con permiso de solo lectura y resume lo nuevo. Nunca envía ni borra nada sin ti.</p>
            <div className="tb-gmail__accion">
              <Boton variante="sutil" tam="compacto" bloque href="/entrar" flecha>
                Entrar a mi panel
              </Boton>
            </div>
          </section>
          <Ayuda contexto="En el ejemplo, Clara solo resume los tres correos de muestra. Con tu cuenta resume los tuyos." />
        </>
      }
    >
      <header className="tb-encabezado">
        <div className="tb-encabezado__sello">
          <span className="tb-texto-2">Clara · Correo</span>
          <Insignia>Datos de ejemplo</Insignia>
        </div>
        <h1 className="t-app-titulo-grande">Correo</h1>
        <p className="tb-encabezado__texto">Clara lee tu bandeja, te dice qué es urgente y deja listas las respuestas para tu visto bueno.</p>
      </header>
      <ProbarCorreo
        ejemplos={DEMO_CORREOS_PRUEBA}
        nota="En el ejemplo las respuestas son de guion: no se llama a la IA."
        resumir={async ({ remitente, asunto, contenido }) => {
          const muestra = DEMO_CORREOS_PRUEBA.find((e) => e.contenido.trim() === contenido.trim());
          await new Promise((r) => window.setTimeout(r, 1100));
          if (!muestra) throw new Error("En el ejemplo, Clara solo resume los tres correos de muestra. Entra a Atendel para resumir los tuyos.");
          return { remitente: remitente || muestra.remitente, asunto: asunto || muestra.asunto, ...muestra.resultado };
        }}
      />
      <section className="tb-bloque" aria-labelledby="tb-leyo">
        <CabezaBloque id="tb-leyo" titulo="Lo que Clara leyó hoy">
          <span className="tb-texto-2">{DEMO_CORREOS.length} correos</span>
        </CabezaBloque>
        <ListaCorreos correos={DEMO_CORREOS} vacio={null} />
      </section>
    </Lienzo>
  );

  return (
    <Armazon
      seccion={NOMBRE_VISTA[vista]}
      ejemplo
      inicio={{ href: "/" }}
      navegacion={navegacion}
      activa={vista}
      agentes={agentesLateral}
      grupos={DEMO_GRUPOS.map((g) => ({ ...g, alElegir: () => ir("conversaciones") }))}
      nuevoGrupo={{ etiqueta: "Nuevo grupo", alElegir: () => ir("conversaciones") }}
      usuario={DEMO_USUARIO}
      perfil={[
        { id: "perfil", etiqueta: "Perfil", icono: "perfil", pronto: true },
        { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
        { id: "plan", etiqueta: "Plan y facturación", icono: "facturacion", descripcion: plan.nombre, alElegir: () => ir("agentes") },
        { id: "negocio", etiqueta: "Mi negocio", icono: "negocio", pronto: true },
      ]}
      salir={{ etiqueta: "Cerrar sesión", descripcion: "Sales del ejemplo", href: "/" }}
      crear={crear}
      avisos={{ elementos: avisos, sinLeer: pendientes.length }}
      buscar={buscar}
      pieCajon={<p className="tb-cajon-nota">{NOTA_EJEMPLO}</p>}
    >
      {vista === "resumen" ? resumen : vista === "agentes" ? agentes : vista === "correo" ? correo : null}
      {/* El chat se queda montado después de abrirlo: al volver, la conversación sigue donde la dejaste */}
      {chatVisto ? <div hidden={vista !== "conversaciones"}>{conversaciones}</div> : null}
    </Armazon>
  );
}
