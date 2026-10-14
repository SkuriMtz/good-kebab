"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Kbd } from "@/components/base/Kbd";
import { Pestanas } from "@/components/base/Pestanas";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { ChatDemo } from "@/components/ChatDemo";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import {
  ACTIVIDAD_DEMO,
  AVISOS_DEMO,
  CITAS_DEMO,
  CONSEJO_DEMO,
  CONVERSACIONES_DEMO,
  DESTACADOS_DEMO,
  ESTADO_AGENTES_DEMO,
  FACTURAS_DEMO,
  METRICAS_DEMO,
  NEGOCIO_DEMO,
  PENDIENTES_DEMO,
  POR_PAGAR_DEMO,
  USO_DEMO,
  USUARIA_DEMO,
} from "@/lib/demo-dashboard";
import { PLAN_POR_ID } from "@/lib/planes";
import { EncabezadoVista, TarjetaAgente } from "./Agentes";
import { Armazon, type AccionCrear } from "./Armazon";
import { Ayuda, Consejo, Metricas, Novedades, PieMinimo, ProximasCitas, TarjetaNegocio } from "./Columna";
import { NOVEDADES, fechaLarga, mesDe, renovacion, saludoPorHora } from "./contenido";
import { useTablero } from "./contexto";
import { MarcaAgente } from "./Marcas";
import { AgentesFijados, Bienvenida, CabezaBloque, ConversacionesRecientes, LineaTiempo, ListaDestacados, ListaPendientes, Vacio } from "./Resumen";
import type { Aviso, ElementoNav, IdVista } from "./tipos";

/**
 * /pruebalo: el dashboard completo con DATOS DE EJEMPLO de una clínica
 * estética. Cambia de vista sin recargar (la dirección cambia con
 * ?vista=…, así que atrás y adelante funcionan) y no llama a la IA: el
 * chat es el guion local de ChatDemo.
 */

const VISTAS_DEMO: IdVista[] = ["resumen", "conversaciones", "agentes", "correo"];
const NOMBRE_VISTA: Partial<Record<IdVista, string>> = {
  resumen: "Resumen",
  conversaciones: "Conversaciones",
  agentes: "Agentes",
  correo: "Correo",
};

const DatosDeEjemplo = () => <Insignia tono="neutra">Datos de ejemplo</Insignia>;

export function TableroDemo() {
  const [vista, setVista] = useState<IdVista>("resumen");
  const [pestana, setPestana] = useState("actividad");
  const [aprobados, setAprobados] = useState<Set<string>>(() => new Set());
  const [leidos, setLeidos] = useState<Set<string>>(() => new Set());
  const [ahora, setAhora] = useState<Date | null>(null);
  const [pedidoChat, setPedidoChat] = useState(0);
  const chatPendiente = useRef<{ nombre?: string; grupo?: boolean } | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const pestanasRef = useRef<HTMLElement>(null);

  // La vista sale de la dirección (?vista=…) para que atrás/adelante funcionen
  useEffect(() => {
    const leer = () => {
      const v = new URLSearchParams(window.location.search).get("vista") as IdVista | null;
      setVista(v && VISTAS_DEMO.includes(v) ? v : "resumen");
    };
    leer();
    setAhora(new Date());
    window.addEventListener("popstate", leer);
    return () => window.removeEventListener("popstate", leer);
  }, []);

  const irA = useCallback((v: IdVista) => {
    setVista(v);
    const url = v === "resumen" ? "/pruebalo" : `/pruebalo?vista=${v}`;
    if (window.location.pathname + window.location.search !== url) window.history.pushState(null, "", url);
    window.scrollTo({ top: 0 });
  }, []);

  /** Abre Conversaciones y, si se pide, el chat de un agente o el "Nuevo grupo" del chat de demostración. */
  const abrirChat = useCallback(
    (nombre?: string, grupo = false) => {
      chatPendiente.current = { nombre, grupo };
      setPedidoChat((n) => n + 1);
      irA("conversaciones");
    },
    [irA],
  );

  // Cuando el chat ya está en pantalla, se abre la conversación pedida
  useEffect(() => {
    if (vista !== "conversaciones" || !chatPendiente.current) return;
    const pedido = chatPendiente.current;
    chatPendiente.current = null;
    const id = requestAnimationFrame(() => {
      const raiz = chatRef.current;
      if (!raiz) return;
      if (pedido.grupo) {
        raiz.querySelector<HTMLButtonElement>(".chat-app__nuevo")?.click();
        return;
      }
      if (!pedido.nombre) return;
      const boton = Array.from(raiz.querySelectorAll<HTMLButtonElement>(".chat-app__conv")).find(
        (b) => b.querySelector(".font-semibold")?.textContent?.trim() === pedido.nombre,
      );
      boton?.click();
    });
    return () => cancelAnimationFrame(id);
  }, [vista, pedidoChat]);

  const verPendientes = useCallback(() => {
    irA("resumen");
    setPestana("visto-bueno");
    requestAnimationFrame(() => {
      const el = pestanasRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      el.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus({ preventScroll: true });
    });
  }, [irA]);

  const nombreDe = (id: IdAgente) => AGENTE_POR_ID[id].nombre;
  const pendientesVivos = PENDIENTES_DEMO.filter((p) => !aprobados.has(p.id)).length;
  const sinLeerChats = CONVERSACIONES_DEMO.reduce((n, c) => n + (c.sinLeer ?? 0), 0);
  const plan = PLAN_POR_ID[NEGOCIO_DEMO.plan];

  /* ---------- Navegación ---------- */
  const nav: ElementoNav[] = [
    { id: "resumen", etiqueta: "Resumen", icono: "inicio", alElegir: () => irA("resumen") },
    {
      id: "conversaciones",
      etiqueta: "Conversaciones",
      icono: "conversaciones",
      alElegir: () => irA("conversaciones"),
      contador: sinLeerChats,
      etiquetaContador: `${sinLeerChats} sin leer`,
    },
    { id: "agentes", etiqueta: "Agentes", icono: "agentes", alElegir: () => irA("agentes") },
    { id: "citas", etiqueta: "Citas", icono: "calendario", pronto: true },
    { id: "correo", etiqueta: "Correo", icono: "correo", alElegir: () => irA("correo") },
    { id: "clientes", etiqueta: "Clientes", icono: "clientes", pronto: true },
    { id: "reportes", etiqueta: "Reportes", icono: "grafica", pronto: true },
    { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
  ];

  const agentes = AGENTES_INFO.map((a) => ({
    id: a.id,
    tono: ESTADO_AGENTES_DEMO[a.id].tono,
    etiqueta: ESTADO_AGENTES_DEMO[a.id].etiqueta,
    pulso: ESTADO_AGENTES_DEMO[a.id].pulso,
    alElegir: () => abrirChat(a.nombre),
  }));

  const grupos = CONVERSACIONES_DEMO.filter((c) => c.agentes.length > 1).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    agentes: c.agentes,
    sinLeer: c.sinLeer,
    alElegir: () => abrirChat(c.nombre),
  }));

  const crear: AccionCrear[] = [
    { id: "conversacion", etiqueta: "Nueva conversación", icono: "mensaje", atajo: ["N"], alElegir: () => abrirChat() },
    { id: "cita", etiqueta: "Agendar cita", icono: "calendario", descripcion: "Se la pides a Lola en el chat", alElegir: () => abrirChat("Lola") },
    { id: "grupo", etiqueta: "Nuevo grupo", icono: "usuarios", descripcion: "Junta a dos o más agentes", alElegir: () => abrirChat(undefined, true) },
    { id: "importar", etiqueta: "Importar contactos", icono: "clientes", pronto: true },
  ];

  const destinoAviso: Record<string, () => void> = {
    n1: verPendientes,
    n2: verPendientes,
    n3: () => abrirChat("Clara"),
    n4: () => abrirChat("Lola"),
    n5: () => abrirChat("Cierre de mes"),
  };
  const avisos: Aviso[] = AVISOS_DEMO.map((a) => ({ ...a, nuevo: a.nuevo && !leidos.has(a.id) }));

  const conversaciones = CONVERSACIONES_DEMO.map((c) => ({ ...c, alElegir: () => abrirChat(c.nombre) }));
  const conversacionesPaleta = useMemo(
    () =>
      CONVERSACIONES_DEMO.map((c) => ({
        id: `conv-${c.id}`,
        grupo: "Conversaciones" as const,
        etiqueta: c.nombre,
        descripcion: c.vistaPrevia,
        agentes: c.agentes,
        alElegir: () => abrirChat(c.nombre),
      })),
    [abrirChat],
  );

  /* ---------- Vistas ---------- */
  const fecha = ahora ? fechaLarga(ahora) : "Hoy";
  const saludo = `${ahora ? saludoPorHora(ahora) : "Hola"}, ${USUARIA_DEMO.primerNombre}`;

  const resumen = (
    <div className="resumen">
      <div className="resumen__centro">
        <Bienvenida
          fecha={fecha}
          marca={<DatosDeEjemplo />}
          saludo={saludo}
          equipo={AGENTES_INFO.map((a) => ({ id: a.id, etiqueta: ESTADO_AGENTES_DEMO[a.id].etiqueta }))}
          resumen={
            <>
              Desde ayer, Lola agendó a Sofía Ramírez y confirmó 10 de las 12 citas de mañana; Clara resumió 23 correos.{" "}
              {pendientesVivos
                ? `${pendientesVivos === 1 ? "Hay 1 mensaje" : `Hay ${pendientesVivos} mensajes`} esperando tu visto bueno.`
                : "Ya revisaste todo lo que esperaba tu visto bueno."}
            </>
          }
          acciones={
            <>
              <Boton variante="principal" tam="compacto" icono={<Icono nombre="check-circulo" tam={16} />} onClick={verPendientes} disabled={!pendientesVivos}>
                {pendientesVivos ? `Revisar ${pendientesVivos === 1 ? "1 pendiente" : `${pendientesVivos} pendientes`}` : "Todo revisado"}
              </Boton>
              <Boton variante="sutil" tam="compacto" icono={<Icono nombre="mensaje" tam={16} />} onClick={() => abrirChat()}>
                Nueva conversación
                <Kbd className="boton-kbd">N</Kbd>
              </Boton>
            </>
          }
        />

        <section ref={pestanasRef} className="bloque bloque--pestanas" aria-labelledby="actividad-titulo">
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
              { id: "actividad", etiqueta: "Actividad", contenido: <LineaTiempo dias={ACTIVIDAD_DEMO} /> },
              {
                id: "visto-bueno",
                etiqueta: (
                  <span className="pestana-con-contador">
                    Espera tu visto bueno
                    {pendientesVivos ? <Insignia tono="atencion" contador={pendientesVivos} etiqueta={`${pendientesVivos} pendientes`} /> : null}
                  </span>
                ),
                contenido: (
                  <ListaPendientes
                    pendientes={PENDIENTES_DEMO}
                    aprobados={aprobados}
                    alAprobar={(id) => setAprobados((s) => new Set(s).add(id))}
                    alDeshacer={(id) =>
                      setAprobados((s) => {
                        const n = new Set(s);
                        n.delete(id);
                        return n;
                      })
                    }
                    alEditar={(p) => abrirChat(nombreDe(p.agente))}
                  />
                ),
              },
              { id: "destacados", etiqueta: "Destacados", contenido: <ListaDestacados destacados={DESTACADOS_DEMO} /> },
            ]}
          />
        </section>

        <section className="bloque" aria-labelledby="fijados-titulo">
          <CabezaBloque id="fijados-titulo" titulo="Agentes fijados" ver={{ etiqueta: "Ver todos", alElegir: () => irA("agentes") }} />
          <AgentesFijados
            agentes={AGENTES_INFO.map((a) => ({
              id: a.id,
              tono: ESTADO_AGENTES_DEMO[a.id].tono,
              estado: ESTADO_AGENTES_DEMO[a.id].etiqueta,
              pulso: ESTADO_AGENTES_DEMO[a.id].pulso,
              dato: ESTADO_AGENTES_DEMO[a.id].hoy,
              alElegir: () => abrirChat(a.nombre),
            }))}
          />
        </section>

        <section className="bloque" aria-labelledby="recientes-titulo">
          <CabezaBloque id="recientes-titulo" titulo="Conversaciones recientes" ver={{ etiqueta: "Ver todas", alElegir: () => irA("conversaciones") }} />
          <ConversacionesRecientes conversaciones={conversaciones.slice(0, 5)} />
        </section>
      </div>

      <aside className="resumen__columna" aria-label="Tu negocio y tu día">
        <TarjetaNegocio
          negocio={NEGOCIO_DEMO.nombre}
          detalle={NEGOCIO_DEMO.giro}
          plan={plan.nombre}
          usados={USO_DEMO}
          limite={plan.mensajesMes}
          mes={ahora ? mesDe(ahora) : "este mes"}
          renueva={ahora ? renovacion(ahora) : "inicio de mes"}
          enlace={{ etiqueta: "Ver planes y precios", href: "/precios" }}
        />
        <ProximasCitas citas={CITAS_DEMO} nota={<span className="columna__nota-cabeza">Las lleva Lola</span>} />
        <Metricas titulo="Septiembre en números" metricas={METRICAS_DEMO} nota="Contra agosto, del reporte que armó Iris." />
        <Consejo agente={CONSEJO_DEMO.agente} texto={CONSEJO_DEMO.texto} accion={{ etiqueta: "Pedírselo a Víctor", alElegir: () => abrirChat("Víctor") }} />
        <Novedades novedades={NOVEDADES} />
        <Ayuda />
        <PieMinimo />
      </aside>
    </div>
  );

  const vistaAgentes = (
    <div className="vista">
      <EncabezadoVista
        titulo="Agentes"
        texto={`Tu equipo en ${plan.nombre}: los cuatro trabajan para ${NEGOCIO_DEMO.nombre}.`}
        extra={<DatosDeEjemplo />}
      />
      <ul className="fichas">
        {AGENTES_INFO.map((a) => {
          const e = ESTADO_AGENTES_DEMO[a.id];
          return (
            <TarjetaAgente
              key={a.id}
              agente={a.id}
              estado={
                <>
                  <PuntoEstado tono={e.tono} etiqueta={e.etiqueta} mostrarEtiqueta pulso={e.pulso} />
                  <span className="cifras">{e.hoy}</span>
                </>
              }
              acciones={
                <>
                  <Boton variante="sutil" tam="compacto" icono={<Icono nombre="mensaje" tam={16} />} onClick={() => abrirChat(a.nombre)}>
                    Hablar con {a.nombre}
                  </Boton>
                  <Boton variante="fantasma" tam="compacto" href={`/agentes#${a.id}`}>
                    Su ficha
                  </Boton>
                </>
              }
            />
          );
        })}
      </ul>
      <PieMinimo />
    </div>
  );

  const vistaCorreo = (
    <div className="vista">
      <EncabezadoVista titulo="Correo" texto="Clara lee tu bandeja y te dice qué importa, qué se paga y qué puede esperar." extra={<DatosDeEjemplo />} />
      <div className="correo-demo">
        <section className="tarjeta-app" aria-labelledby="correo-hoy">
          <div className="correo-demo__cabeza">
            <MarcaAgente agente="clara" />
            <div>
              <h2 id="correo-hoy" className="t-app-mediano">
                Hoy llegaron 23 correos
              </h2>
              <p className="correo-demo__sub">Resumen de Clara · 08:41</p>
            </div>
          </div>
          <ListaDestacados destacados={DESTACADOS_DEMO} />
          <p className="correo-demo__resto">Los otros 20 son promociones y avisos; no necesitan nada.</p>
        </section>

        <section className="tarjeta-app" aria-labelledby="correo-facturas">
          <h2 id="correo-facturas" className="t-app-mediano">
            Facturas y pagos del mes
          </h2>
          <table className="tabla-app">
            <caption className="sr-only">Facturas y pagos que Clara encontró en el correo</caption>
            <thead>
              <tr>
                <th scope="col">De</th>
                <th scope="col">Cuándo</th>
                <th scope="col" className="tabla-app__monto">
                  Monto
                </th>
              </tr>
            </thead>
            <tbody>
              {FACTURAS_DEMO.map((f) => (
                <tr key={f.id}>
                  <th scope="row">{f.concepto}</th>
                  <td>{f.cuando}</td>
                  <td className="tabla-app__monto cifras" data-tipo={f.tipo}>
                    {f.monto}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2}>
                  Por pagar
                </th>
                <td className="tabla-app__monto cifras">{POR_PAGAR_DEMO}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <Vacio
          agente="clara"
          titulo="Con tu correo de verdad"
          texto="En tu panel pegas cualquier correo para que Clara lo resuma, o conectas tu Gmail (solo lectura: nunca envía ni borra nada)."
          accion={
            <Boton variante="sutil" tam="compacto" href="/entrar" flecha>
              Probarlo con mi correo
            </Boton>
          }
        />
      </div>
      <PieMinimo />
    </div>
  );

  const contenido =
    vista === "conversaciones" ? (
      <div ref={chatRef} className="tablero__chat">
        <div className="chat-aviso">
          <h1 className="sr-only">Conversaciones</h1>
          <p>
            <span className="chat-aviso__largo">Escríbeles, usa @ para mencionar o / para una acción. </span>
            Demostración: las respuestas son de ejemplo.
          </p>
        </div>
        <ChatDemo completa />
      </div>
    ) : vista === "agentes" ? (
      vistaAgentes
    ) : vista === "correo" ? (
      vistaCorreo
    ) : (
      resumen
    );

  return (
    <Armazon
      vista={vista}
      seccion={NOMBRE_VISTA[vista] ?? "Resumen"}
      inicio="/"
      marcaBarra={<Insignia tono="neutra">Demostración</Insignia>}
      nav={nav}
      agentes={agentes}
      grupos={grupos}
      nuevoGrupo={{ alElegir: () => abrirChat(undefined, true) }}
      pieLateral={<PieDemo />}
      usuario={{ nombre: USUARIA_DEMO.nombre, correo: USUARIA_DEMO.correo, estado: { tono: "exito", etiqueta: `${plan.nombre} · ejemplo` } }}
      perfil={[
        { id: "perfil", etiqueta: "Perfil", icono: "perfil", pronto: true },
        { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
        { id: "plan", etiqueta: "Plan y facturación", icono: "facturacion", descripcion: "Ver planes y precios", href: "/precios" },
        { id: "negocio", etiqueta: "Mi negocio", icono: "negocio", pronto: true },
      ]}
      salir={{ etiqueta: "Salir de la demostración", href: "/" }}
      crear={crear}
      avisos={avisos}
      alElegirAviso={(a) => {
        setLeidos((s) => new Set(s).add(a.id));
        destinoAviso[a.id]?.();
      }}
      alLeerAvisos={() => setLeidos(new Set(AVISOS_DEMO.map((a) => a.id)))}
      conversacionesPaleta={conversacionesPaleta}
      chat={vista === "conversaciones"}
    >
      {contenido}
    </Armazon>
  );
}

/** Al pie del lateral: qué es esto y cómo pasar a lo real. */
function PieDemo() {
  const { esMac } = useTablero();
  return (
    <div className="pie-demo">
      <p className="pie-demo__titulo">
        <Icono nombre="alerta" tam={16} />
        Estás en una demostración
      </p>
      <p>Todo lo que ves son datos de ejemplo y el chat no usa la IA. En tu panel, el equipo trabaja con tu correo de verdad.</p>
      <Boton variante="sutil" tam="compacto" bloque href="/entrar">
        Crear mi cuenta
      </Boton>
      <p className="pie-demo__tecla">
        <Kbd teclas={[esMac ? "⌘" : "Ctrl", "K"]} /> para ir a cualquier parte
      </p>
    </div>
  );
}
