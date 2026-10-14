"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChatDemo } from "@/components/ChatDemo";
import { AGENTE_POR_ID, AGENTES_INFO } from "@/lib/agentes";
import {
  AGENTES_LATERAL_DEMO,
  AVISOS_DEMO,
  CITAS_DEMO,
  CONVERSACIONES_DEMO,
  CORREOS_DEMO,
  DESTACADOS_DEMO,
  EVENTOS_DEMO,
  GRUPOS_DEMO,
  NAV_DEMO,
  NEGOCIO_DEMO,
  PARA_TI_DEMO,
  PENDIENTES_DEMO,
  PLAN_DEMO,
  USO_DEMO,
  USUARIO_DEMO,
  agentesFijadosDemo,
  esVistaDemo,
  estadisticasDemo,
  indiceDemo,
  semanaDemo,
} from "@/lib/demo-dashboard";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import type { ElementoMenu } from "@/components/base/Menu";
import { Actividad } from "./Actividad";
import { Armazon } from "./Armazon";
import { Bienvenida } from "./Bienvenida";
import { Ayuda, Columna, EstaSemana, ParaTi, ProximasCitas, TarjetaNegocio } from "./Columna";
import { AgentesFijados, ConversacionesRecientes } from "./Fijados";
import type { Momento } from "./momento";
import { Cara } from "./Caras";
import { Destinable } from "./Navegacion";
import { EncabezadoVista, FilaCorreo, TarjetaAgente } from "./Vistas";
import { Vacio } from "./Vacio";
import type { Destino, IdPestanaActividad, IdSeccion } from "./tipos";

const TITULOS: Record<IdSeccion, string> = {
  resumen: "Resumen",
  conversaciones: "Conversaciones",
  agentes: "Agentes",
  citas: "Citas",
  correo: "Correo",
  clientes: "Clientes",
  reportes: "Reportes",
  configuracion: "Configuración",
};

const PRIMERA = ["", "Un mensaje espera", "Dos mensajes esperan", "Tres mensajes esperan"];

/**
 * /pruebalo: el dashboard completo con los datos de ejemplo de una clínica.
 * Cambiar de sección no recarga la página: cambia la vista y la dirección
 * (?vista=…), así funcionan el botón de atrás y los enlaces directos. El
 * chat es el ChatDemo de siempre (guion local: no llama a la IA).
 */
export function DashboardDemo({
  m,
  vistaInicial,
  pestanaInicial,
  conInicial,
}: {
  m: Momento;
  vistaInicial: IdSeccion;
  pestanaInicial: IdPestanaActividad;
  conInicial: string | null;
}) {
  const router = useRouter();
  const [vista, setVista] = useState<IdSeccion>(vistaInicial);
  const [pestana, setPestana] = useState<IdPestanaActividad>(pestanaInicial);
  const [con, setCon] = useState<string | null>(conInicial);
  const [pendientes, setPendientes] = useState(PENDIENTES_DEMO.length);

  const ir = useCallback(
    (d: Destino) => {
      if ("href" in d) {
        router.push(d.href);
        return;
      }
      const q = new URLSearchParams();
      if (d.vista !== "resumen") q.set("vista", d.vista);
      if (d.con) q.set("con", d.con);
      if (d.pestana && d.pestana !== "actividad") q.set("pestana", d.pestana);
      const texto = q.toString();
      window.history.pushState(null, "", texto ? `?${texto}` : window.location.pathname);
      setVista(d.vista);
      setCon(d.con ?? null);
      if (d.pestana) setPestana(d.pestana);
      // Una vista nueva empieza arriba; si pidió una pestaña, baja hasta la actividad
      requestAnimationFrame(() => {
        const destino = d.pestana ? document.getElementById("dash-actividad") : null;
        if (destino) destino.scrollIntoView({ block: "start" });
        else window.scrollTo({ top: 0 });
        document.getElementById("contenido")?.focus({ preventScroll: true });
      });
    },
    [router],
  );

  // Atrás y adelante del navegador
  useEffect(() => {
    const alVolver = () => {
      const p = new URLSearchParams(window.location.search);
      const v = p.get("vista");
      setVista(esVistaDemo(v) ? v : "resumen");
      setCon(p.get("con"));
      const t = p.get("pestana");
      setPestana(t === "pendientes" || t === "destacados" ? t : "actividad");
    };
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);

  const acciones: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Acciones rápidas" },
    { id: "conversacion", etiqueta: "Nueva conversación", icono: "mensaje", alElegir: () => ir({ vista: "conversaciones" }) },
    { id: "cita", etiqueta: "Agendar cita", icono: "calendario", pronto: true },
    { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "Se arma desde Conversaciones", icono: "usuarios", alElegir: () => ir({ vista: "conversaciones" }) },
    { id: "importar", etiqueta: "Importar contactos", icono: "clientes", pronto: true },
  ];

  const perfil = {
    antes: [
      { id: "perfil", etiqueta: "Perfil", icono: "perfil", pronto: true },
      { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
      { id: "plan", etiqueta: "Plan y facturación", descripcion: PLAN_DEMO.nombre, icono: "facturacion", alElegir: () => ir({ vista: "agentes" }) },
      { id: "negocio", etiqueta: "Mi negocio", descripcion: NEGOCIO_DEMO.nombre, icono: "negocio", pronto: true },
    ] satisfies ElementoMenu[],
    salir: { id: "salir", etiqueta: "Salir del ejemplo", icono: "cerrar-sesion", href: "/" } satisfies ElementoMenu,
  };

  const nav = NAV_DEMO;
  const nombre = USUARIO_DEMO.nombre.split(" ")[0];

  return (
    <Armazon
      seccion={vista}
      titulo={TITULOS[vista]}
      nav={nav}
      agentes={AGENTES_LATERAL_DEMO}
      grupos={GRUPOS_DEMO}
      usuario={USUARIO_DEMO}
      avisos={AVISOS_DEMO}
      acciones={acciones}
      perfil={perfil}
      indice={indiceDemo()}
      ir={ir}
      inicio={{ vista: "resumen" }}
      todo={{ vista: "resumen", pestana: "actividad" }}
      demo
      app={vista === "conversaciones"}
      pieLateral={
        <div className="dash-invitacion">
          <p className="dash-invitacion__titulo">Esto es un ejemplo</p>
          <p className="dash-invitacion__texto">Una clínica ficticia y sus datos. Entra con tu correo para trabajar con los tuyos.</p>
          <Destinable destino={{ href: "/entrar" }} className="dash-cabeza__enlace">
            Entrar con mi correo
            <Icono nombre="chevron-derecha" tam={16} />
          </Destinable>
        </div>
      }
    >
      {vista === "resumen" ? (
        <div className="dash-contenido">
          <div className="dash-resumen">
            <div className="dash-centro">
              <Bienvenida
                demo
                fecha={m.fecha}
                saludo={`${m.saludo}, ${nombre}`}
                texto={
                  <>
                    Esta mañana tu equipo agendó a una paciente nueva, confirmó 10 de las 12 citas de mañana y resumió 23 correos.{" "}
                    {pendientes ? `${PRIMERA[pendientes] ?? `${pendientes} mensajes esperan`} tu visto bueno.` : "Ya revisaste todo lo que esperaba tu visto bueno."}
                  </>
                }
                acciones={
                  pendientes ? (
                    <>
                      <Boton tam="compacto" icono={<Icono nombre="check-doble" />} onClick={() => ir({ vista: "resumen", pestana: "pendientes" })}>
                        Revisar lo pendiente
                      </Boton>
                      <Boton variante="sutil" tam="compacto" icono={<Icono nombre="mensaje" />} onClick={() => ir({ vista: "conversaciones" })}>
                        Nueva conversación
                      </Boton>
                    </>
                  ) : (
                    <Boton tam="compacto" icono={<Icono nombre="mensaje" />} onClick={() => ir({ vista: "conversaciones" })}>
                      Nueva conversación
                    </Boton>
                  )
                }
                cifras={estadisticasDemo()}
              />
              <div id="dash-actividad" className="dash-ancla">
                <Actividad
                  eventos={EVENTOS_DEMO}
                  pendientes={PENDIENTES_DEMO}
                  destacados={DESTACADOS_DEMO}
                  pestana={pestana}
                  alCambiarPestana={setPestana}
                  alCambiarPendientes={setPendientes}
                  interactivo
                  nombreTu={USUARIO_DEMO.nombre}
                  vacios={{
                    actividad: <Vacio agente="lola" titulo="Sin actividad de este agente" texto="Prueba con «Todos los agentes»." compacto />,
                    pendientes: (
                      <Vacio
                        agente="victor"
                        titulo="Nada espera tu visto bueno"
                        texto="Cuando un agente prepare un mensaje que necesite tu permiso, lo verás aquí antes de que salga."
                      />
                    ),
                    destacados: <Vacio agente="clara" titulo="Nada destacado" texto="Tus agentes marcan aquí lo que no se te puede pasar." />,
                  }}
                />
              </div>
              <AgentesFijados agentes={agentesFijadosDemo()} todos={{ vista: "agentes" }} />
              <ConversacionesRecientes conversaciones={CONVERSACIONES_DEMO} todas={{ vista: "conversaciones" }} vacio={null} />
            </div>
            <Columna>
              <TarjetaNegocio
                nombre={NEGOCIO_DEMO.nombre}
                giro={NEGOCIO_DEMO.giro}
                plan={PLAN_DEMO.nombre}
                usados={USO_DEMO}
                limite={PLAN_DEMO.mensajesMes}
                mes={m.mes}
                renueva={m.renueva}
                enlace={{ etiqueta: "Ver tu plan y tu equipo", destino: { vista: "agentes" } }}
              />
              <ProximasCitas citas={CITAS_DEMO} resumen="Mañana · 10 de 12 confirmadas" vacio={null} />
              <EstaSemana titulo="conversaciones atendidas" unidad="conversaciones" dias={semanaDemo(m)} />
              <ParaTi items={PARA_TI_DEMO} />
              <Ayuda texto="Arriba ves tu día en tres cifras; abajo, lo que hizo cada agente. Lo que necesita tu permiso queda en «Espera tu visto bueno»: nada sale sin que lo apruebes." />
            </Columna>
          </div>
        </div>
      ) : null}

      {vista === "conversaciones" ? (
        <div className="dash-app">
          <div className="dash-app__nota">
            <h1 className="sr-only">Conversaciones</h1>
            <Insignia>Datos de ejemplo</Insignia>
            <p>Usa @ para mencionar o / para una acción. Las respuestas son de ejemplo.</p>
          </div>
          <ChatDemo key={con ?? "todas"} completa />
        </div>
      ) : null}

      {vista === "agentes" ? (
        <div className="dash-contenido dash-vista">
          <EncabezadoVista
            etiqueta={
              <>
                {PLAN_DEMO.nombre} <Insignia className="dash-ejemplo-movil">Datos de ejemplo</Insignia>
              </>
            }
            titulo="Tu equipo"
            texto="Con Atendel Max trabajas con los cuatro y eliges quién está en tu equipo; solo ellos aparecen en el chat."
          />
          <ul className="dash-agentes">
            {AGENTES_INFO.map((a) => {
              const lat = AGENTES_LATERAL_DEMO.find((x) => x.id === a.id);
              return (
                <TarjetaAgente
                  key={a.id}
                  id={a.id}
                  enEquipo
                  estado={lat ? { tono: lat.tono, etiqueta: lat.estado, pulso: lat.pulso } : undefined}
                  acciones={
                    <>
                      <Boton variante="fantasma" tam="compacto" href={`/agentes?ficha=${a.id}`}>
                        Ver ficha
                      </Boton>
                      <Boton variante="sutil" tam="compacto" icono={<Icono nombre="mensaje" />} onClick={() => ir({ vista: "conversaciones", con: a.id })}>
                        Hablar con {AGENTE_POR_ID[a.id].nombre}
                      </Boton>
                    </>
                  }
                />
              );
            })}
          </ul>
        </div>
      ) : null}

      {vista === "correo" ? (
        <div className="dash-contenido dash-vista">
          <EncabezadoVista
            etiqueta={
              <>
                Clara · Correo <Insignia className="dash-ejemplo-movil">Datos de ejemplo</Insignia>
              </>
            }
            titulo="Correo"
            texto="Clara lee tu bandeja y te dice de qué trata cada correo y qué conviene hacer. Aquí ves un ejemplo; en tu panel resume tus correos de verdad."
          />
          <div className="dash-correo-vista">
            <section aria-labelledby="dash-correos">
              <div className="dash-cabeza">
                <h2 id="dash-correos" className="dash-cabeza__titulo">
                  Lo que Clara leyó hoy
                </h2>
                <span className="dash-columna__nota cifras">{CORREOS_DEMO.length} resúmenes</span>
              </div>
              <ul className="dash-lista dash-correos">
                {CORREOS_DEMO.map((c) => (
                  <FilaCorreo key={c.id} correo={c} />
                ))}
              </ul>
            </section>
            <aside className="dash-nota" aria-labelledby="dash-nota-clara">
              <Cara agente="clara" tam="chica" />
              <h2 id="dash-nota-clara" className="dash-nota__titulo">
                En tu panel, con tu correo
              </h2>
              <p className="dash-nota__texto">
                Pegas un correo y Clara lo resume, o conectas tu Gmail y resume los que no has leído. Es solo lectura: nunca envía ni borra nada.
              </p>
              <Boton variante="sutil" tam="compacto" href="/entrar" flecha>
                Probar con mi correo
              </Boton>
            </aside>
          </div>
        </div>
      ) : null}
    </Armazon>
  );
}
