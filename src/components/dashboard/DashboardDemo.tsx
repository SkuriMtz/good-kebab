"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import type { ElementoMenu } from "@/components/base/Menu";
import { AGENTES_INFO } from "@/lib/agentes";
import {
  AGENDA_HOY_DEMO,
  CITAS_DEMO,
  CORREOS_DEMO,
  ESTADO_AGENTES_DEMO,
  GRUPOS_DEMO,
  USUARIO_DEMO,
  avisosDemo,
  datosDemo,
  type VistaDemo,
} from "@/lib/demo-dashboard";
import type { IdPestana } from "./ActividadEquipo";
import { Armazon } from "./Armazon";
import type { ResultadoBusqueda } from "./BuscadorGlobal";
import type { ElementoNav } from "./Lateral";
import { Resumen } from "./Resumen";
import { VistaAgentes, VistaCitas, VistaConversaciones, VistaCorreo } from "./VistasDemo";

/*
 * El dashboard completo de /pruebalo con datos de ejemplo. Las vistas
 * cambian aquí mismo, sin recargar (y la dirección guarda #vista para poder
 * regresar o compartirla). Nada llama a la IA: el chat es el guion local.
 */

const VISTAS: VistaDemo[] = ["resumen", "conversaciones", "agentes", "citas", "correo"];
const TITULO: Record<VistaDemo, string> = {
  resumen: "Resumen",
  conversaciones: "Conversaciones",
  agentes: "Agentes",
  citas: "Citas",
  correo: "Correo",
};

const NAV: ElementoNav[] = [
  { id: "resumen", etiqueta: "Resumen", icono: "inicio" },
  { id: "conversaciones", etiqueta: "Conversaciones", icono: "conversaciones", contador: 3 },
  { id: "agentes", etiqueta: "Agentes", icono: "agentes" },
  { id: "citas", etiqueta: "Citas", icono: "calendario" },
  { id: "correo", etiqueta: "Correo", icono: "correo" },
  { id: "clientes", etiqueta: "Clientes", icono: "clientes", pronto: true },
  { id: "reportes", etiqueta: "Reportes", icono: "grafica", pronto: true },
  { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
];

export function DashboardDemo() {
  const [vista, setVista] = useState<VistaDemo>("resumen");
  const [pestana, setPestana] = useState<IdPestana>("actividad");
  const [avisosLeidos, setAvisosLeidos] = useState(false);

  // #conversaciones, #citas… en la dirección: abre esa vista
  useEffect(() => {
    const leer = () => {
      const h = window.location.hash.slice(1) as VistaDemo;
      if (VISTAS.includes(h)) setVista(h);
    };
    leer();
    window.addEventListener("hashchange", leer);
    return () => window.removeEventListener("hashchange", leer);
  }, []);

  const ir = useCallback((v: VistaDemo) => {
    setVista(v);
    const url = v === "resumen" ? window.location.pathname : `#${v}`;
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0 });
  }, []);

  const verPendientes = useCallback(() => {
    setVista("resumen");
    setPestana("pendientes");
    window.history.replaceState(null, "", window.location.pathname);
    // Después de pintar el resumen, se acerca a la pestaña
    window.setTimeout(() => document.getElementById("actividad")?.scrollIntoView({ block: "start" }), 50);
  }, []);

  const datos = useMemo(() => datosDemo({ ir, verPendientes }), [ir, verPendientes]);

  const menuCrear: ElementoMenu[] = useMemo(
    () => [
      { tipo: "titulo", etiqueta: "Crear" },
      { id: "conversacion", etiqueta: "Nueva conversación", icono: "mensaje", alElegir: () => ir("conversaciones") },
      { id: "cita", etiqueta: "Agendar cita", descripcion: "Pídesela a Lola en el chat", icono: "calendario", alElegir: () => ir("conversaciones") },
      { id: "grupo", etiqueta: "Nuevo grupo", descripcion: "Desde la lista de chats", icono: "usuarios", alElegir: () => ir("conversaciones") },
      { id: "importar", etiqueta: "Importar contactos", icono: "clientes", pronto: true },
    ],
    [ir],
  );

  const menuPerfil: ElementoMenu[] = useMemo(
    () => [
      { id: "perfil", etiqueta: "Perfil", icono: "perfil", pronto: true },
      { id: "configuracion", etiqueta: "Configuración", icono: "ajustes", pronto: true },
      { id: "plan", etiqueta: "Plan y facturación", icono: "facturacion", alElegir: () => ir("agentes") },
      { id: "negocio", etiqueta: "Mi negocio", icono: "negocio", pronto: true },
      { tipo: "separador" },
      { id: "salir", etiqueta: "Salir de la demostración", icono: "cerrar-sesion", href: "/" },
    ],
    [ir],
  );

  const busqueda: ResultadoBusqueda[] = useMemo(
    () => [
      ...VISTAS.map((v) => ({ id: `v-${v}`, grupo: "Vistas", etiqueta: TITULO[v], icono: "flecha" as const, accion: { etiqueta: TITULO[v], alElegir: () => ir(v) } })),
      ...AGENTES_INFO.map((a) => ({
        id: `a-${a.id}`,
        grupo: "Agentes",
        etiqueta: a.nombre,
        detalle: `${a.area} · ${a.abarca}`,
        agentes: [a.id],
        accion: { etiqueta: a.nombre, alElegir: () => ir("agentes") },
      })),
      ...[...AGENDA_HOY_DEMO, ...CITAS_DEMO.filter((c) => c.dia === "Mañana")].map((c) => ({
        id: `c-${c.id}`,
        grupo: "Citas",
        etiqueta: c.cliente,
        detalle: `${c.dia} ${c.hora} · ${c.servicio}`,
        icono: "calendario" as const,
        accion: { etiqueta: c.cliente, alElegir: () => ir("citas") },
      })),
      ...GRUPOS_DEMO.map((g) => ({
        id: `g-${g.id}`,
        grupo: "Conversaciones",
        etiqueta: g.nombre,
        detalle: "Grupo",
        agentes: g.agentes,
        accion: { etiqueta: g.nombre, alElegir: () => ir("conversaciones") },
      })),
      ...CORREOS_DEMO.map((m) => ({
        id: `m-${m.id}`,
        grupo: "Correos",
        etiqueta: m.asunto,
        detalle: m.remitente,
        icono: "correo" as const,
        accion: { etiqueta: m.asunto, alElegir: () => ir("correo") },
      })),
    ],
    [ir],
  );

  const avisos = useMemo(() => avisosDemo(ir, verPendientes), [ir, verPendientes]);

  return (
    <Armazon
      seccion={TITULO[vista]}
      inicio={{ etiqueta: "Resumen", alElegir: () => ir("resumen") }}
      nav={NAV}
      activo={vista}
      alNavegar={(id) => ir(id as VistaDemo)}
      agentes={AGENTES_INFO.map((a) => ({ id: a.id, ...ESTADO_AGENTES_DEMO[a.id], accion: { etiqueta: a.nombre, alElegir: () => ir("agentes") } }))}
      grupos={GRUPOS_DEMO.map((g) => ({ ...g, accion: { etiqueta: g.nombre, alElegir: () => ir("conversaciones") } }))}
      grupoNuevo={{ accion: { etiqueta: "Nuevo grupo", alElegir: () => ir("conversaciones") } }}
      usuario={{ nombre: USUARIO_DEMO.nombre, correo: USUARIO_DEMO.correo, estado: USUARIO_DEMO.estado }}
      menuPerfil={menuPerfil}
      menuCrear={menuCrear}
      avisos={avisos}
      avisosSinLeer={avisosLeidos ? 0 : 3}
      alLeerAvisos={() => setAvisosLeidos(true)}
      busqueda={busqueda}
      aviso={
        <div className="tb-aviso" role="note">
          <Icono nombre="rayo" tam={16} className="tb-aviso__icono" />
          <p className="tb-aviso__texto">
            <strong>Estás viendo una demostración.</strong> Clínica Alma y sus números son de ejemplo: nada se envía ni se guarda.
          </p>
          <Boton href="/entrar" variante="sutil" tam="compacto" flecha className="tb-aviso__boton">
            Probar con mi negocio
          </Boton>
        </div>
      }
    >
      {vista === "resumen" ? (
        <Resumen
          datos={datos}
          pestana={pestana}
          alCambiarPestana={setPestana}
          verEquipo={{ etiqueta: "Ver tu equipo", alElegir: () => ir("agentes") }}
          verAgenda={{ etiqueta: "Ver agenda", alElegir: () => ir("citas") }}
        />
      ) : vista === "conversaciones" ? (
        <VistaConversaciones />
      ) : vista === "agentes" ? (
        <VistaAgentes ir={ir} />
      ) : vista === "citas" ? (
        <VistaCitas ir={ir} />
      ) : (
        <VistaCorreo />
      )}
    </Armazon>
  );
}
