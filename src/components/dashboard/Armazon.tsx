"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { BotonIcono } from "@/components/base/Boton";
import { Cajon } from "@/components/base/Cajon";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Menu, type ElementoMenu } from "@/components/base/Menu";
import { Marca } from "@/components/Logo";
import { Escena } from "@/components/escena/Escena";
import { ponerTema } from "@/lib/tema";
import { Avisos } from "./Avisos";
import { BuscadorDashboard } from "./BuscadorDashboard";
import { Lateral } from "./Lateral";
import { Accionable } from "./Piezas";
import type { Accion, AgenteLateral, Aviso, ElementoNav, GrupoLateral, IdVista, ResultadoBusqueda, Usuario } from "./tipos";
import { useTema } from "./useTema";

export type PropsArmazon = {
  /** Nombre de la vista actual, junto al logo ("Atendel / Resumen"). */
  seccion: string;
  /** A dónde lleva el logo (el resumen). */
  inicio: Accion;
  /** Franja de arriba (en /pruebalo: "Datos de ejemplo"). */
  aviso?: ReactNode;
  nav: ElementoNav[];
  activa: IdVista;
  agentes: AgenteLateral[];
  accionAgentes?: ReactNode;
  grupos: GrupoLateral[];
  accionGrupos?: ReactNode;
  vacioGrupos?: ReactNode;
  indice: ResultadoBusqueda[];
  crear: ElementoMenu[];
  avisos: Aviso[];
  alLeerAvisos?: () => void;
  ahora: Date | null;
  usuario: Usuario;
  /** Perfil, Configuración, Plan y facturación, Mi negocio. */
  perfil: ElementoMenu[];
  /** Cerrar sesión (o salir de la demostración). */
  salir: ElementoMenu;
  /** El botón de conversaciones de la barra (con un punto si hay sin leer). */
  conversaciones?: Accion & { sinLeer?: number };
  /** Al pie del lateral: una línea con el uso del plan. */
  pieLateral?: ReactNode;
  /** Vista de pantalla completa (el chat): sin márgenes ni pie. */
  completo?: boolean;
  children: ReactNode;
};

/**
 * El armazón del dashboard (estructura del dashboard de GitHub, acabado de
 * Apple): barra superior fija y translúcida, menú lateral (cajón en
 * celular), el contenido y un pie mínimo. Todo dentro de `.producto`, así
 * los componentes de la base toman los colores, la letra y los radios del
 * producto en oscuro y en claro.
 */
export function Armazon(props: PropsArmazon) {
  const { seccion, inicio, aviso, nav, activa, agentes, accionAgentes, grupos, accionGrupos, vacioGrupos, pieLateral, completo = false, children } = props;
  const [cajon, setCajon] = useState(false);

  // En celular, elegir algo del cajón lo cierra (el cambio de vista se ve detrás)
  const alTocarCajon = (e: MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest("a[href], button");
    if (el && el.getAttribute("aria-disabled") !== "true" && !el.closest(".dash-lateral__cabeza")) setCajon(false);
  };

  const lateral = (
    <Lateral
      nav={nav}
      activa={activa}
      agentes={agentes}
      accionAgentes={accionAgentes}
      grupos={grupos}
      accionGrupos={accionGrupos}
      vacioGrupos={vacioGrupos}
      pie={pieLateral}
    />
  );

  return (
    <div className={`producto dash${completo ? " dash--completo" : ""}`}>
      {/* Los fragmentos de fondo, discretos (sin figura: solo polvo) */}
      <Escena />
      <a href="#contenido" className="dash-saltar">
        Saltar al contenido
      </a>
      {aviso}
      <BarraSuperior {...props} abrirCajon={() => setCajon(true)} cajonAbierto={cajon} />

      <div className={`dash-cuerpo${completo ? " dash-cuerpo--completo" : ""}`}>
        <aside className="dash-lateral" aria-label="Menú de Atendel">
          {lateral}
        </aside>
        <main id="contenido" tabIndex={-1} className={`dash-principal${completo ? " dash-principal--completo" : ""}`}>
          {children}
          {completo ? null : <Pie />}
        </main>
      </div>

      <Cajon abierto={cajon} alCerrar={() => setCajon(false)} etiqueta="Menú de Atendel" cabeza={<LogoBarra inicio={inicio} seccion={seccion} />}>
        <div onClickCapture={alTocarCajon}>{lateral}</div>
      </Cajon>
    </div>
  );
}

function LogoBarra({ inicio, seccion }: { inicio: Accion; seccion: string }) {
  return (
    <span className="dash-miga">
      <Accionable accion={inicio} className="dash-logo" etiqueta="Atendel: ir al inicio">
        <Marca className="dash-logo__marca" />
      </Accionable>
      <span className="dash-miga__seccion">{seccion}</span>
    </span>
  );
}

function BarraSuperior({
  seccion,
  inicio,
  indice,
  crear,
  avisos,
  alLeerAvisos,
  ahora,
  usuario,
  perfil,
  salir,
  conversaciones,
  abrirCajon,
  cajonAbierto,
}: PropsArmazon & { abrirCajon: () => void; cajonAbierto: boolean }) {
  const tema = useTema();
  const [buscando, setBuscando] = useState(false);
  const campoMovil = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (buscando) campoMovil.current?.focus();
  }, [buscando]);

  const elementosPerfil: ElementoMenu[] = [
    ...perfil,
    { tipo: "separador" },
    {
      id: "tema",
      etiqueta: tema === "oscuro" ? "Modo claro" : "Modo oscuro",
      descripcion: tema === "oscuro" ? "Ahora estás en modo oscuro" : "Ahora estás en modo claro",
      icono: tema === "oscuro" ? "sol" : "luna",
      alElegir: () => ponerTema(tema === "oscuro" ? "claro" : "oscuro"),
    },
    { tipo: "separador" },
    salir,
  ];

  return (
    <header className="dash-barra">
      <div className="dash-barra__inicio">
        <BotonIcono etiqueta="Abrir el menú" icono="barra-lateral" className="dash-barra__cajon" onClick={abrirCajon} aria-expanded={cajonAbierto} />
        <LogoBarra inicio={inicio} seccion={seccion} />
      </div>

      <div className="dash-barra__fin">
        <BuscadorDashboard indice={indice} placeholder="Escribe / para buscar" className="dash-barra__buscador" />
        <BotonIcono etiqueta="Buscar" icono="buscar" className="dash-barra__lupa" onClick={() => setBuscando(true)} aria-expanded={buscando} />
        <span className="dash-barra__division" aria-hidden="true" />
        <Menu
          etiqueta="Crear"
          aspecto="libre"
          alineacion="fin"
          claseDisparador="dash-crear"
          disparador={
            <>
              <Icono nombre="mas" tam={16} />
              <Icono nombre="chevron" tam={16} className="dash-crear__chevron" />
            </>
          }
          elementos={crear}
        />
        <Avisos avisos={avisos} ahora={ahora} alLeerTodos={alLeerAvisos} />
        {conversaciones ? <BotonConversaciones accion={conversaciones} /> : null}
        <Menu
          etiqueta="Tu cuenta"
          aspecto="avatar"
          alineacion="fin"
          className="dash-barra__perfil"
          disparador={<Avatar nombre={usuario.nombre} src={usuario.foto} tam={32} />}
          encabezado={{ nombre: usuario.nombre, correo: usuario.correo, foto: usuario.foto, estado: usuario.estado }}
          elementos={elementosPerfil}
        />
      </div>

      {buscando ? (
        <div className="dash-barra__busqueda">
          <BuscadorDashboard ref={campoMovil} indice={indice} atajo={false} alElegir={() => setBuscando(false)} className="dash-barra__busqueda-campo" />
          <button type="button" className="dash-enlace" onClick={() => setBuscando(false)}>
            Cancelar
          </button>
        </div>
      ) : null}
    </header>
  );
}

/** Conversaciones en la barra (como la bandeja): botón de ícono con borde y un punto si hay sin leer. */
function BotonConversaciones({ accion }: { accion: Accion & { sinLeer?: number } }) {
  const etiqueta = accion.sinLeer ? `Conversaciones: ${accion.sinLeer} sin leer` : "Conversaciones";
  if (accion.href) {
    return (
      <Link href={accion.href} className="boton-icono boton-icono--capa boton-icono--compacto dash-barra__icono dash-barra__conv" aria-label={etiqueta} title="Conversaciones">
        <Icono nombre="conversaciones" tam={20} />
        {accion.sinLeer ? <Insignia punto tono="azul" sobre /> : null}
      </Link>
    );
  }
  return <BotonIcono etiqueta="Conversaciones" icono="conversaciones" punto={Boolean(accion.sinLeer)} etiquetaContador={etiqueta} onClick={accion.alElegir} className="dash-barra__conv" />;
}

const UTILIDAD = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/agentes", etiqueta: "Agentes" },
  { href: "/precios", etiqueta: "Precios" },
  { href: "/preguntas", etiqueta: "Preguntas" },
  { href: "/preguntas#seguridad", etiqueta: "Tus datos" },
];

/** Pie mínimo, como el del dashboard de GitHub: marca, enlaces de utilidad y el modo. */
function Pie() {
  const tema = useTema();
  return (
    <footer className="dash-pie">
      <span className="dash-pie__marca">
        <Marca className="dash-pie__logo" />
        <span>© {new Date().getFullYear()} Atendel</span>
      </span>
      <nav aria-label="Enlaces de utilidad">
        <ul className="dash-pie__enlaces">
          {UTILIDAD.map((u) => (
            <li key={u.href}>
              <Link href={u.href}>{u.etiqueta}</Link>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => ponerTema(tema === "oscuro" ? "claro" : "oscuro")}>
              {tema === "oscuro" ? "Modo claro" : "Modo oscuro"}
            </button>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
