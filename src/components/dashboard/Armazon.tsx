"use client";

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { Boton, BotonIcono } from "@/components/base/Boton";
import { Cajon } from "@/components/base/Cajon";
import { Icono } from "@/components/base/Iconos";
import { Menu, type ElementoMenu } from "@/components/base/Menu";
import { usePopover } from "@/components/base/Popover";
import { Marca } from "@/components/Logo";
import { ponerTema } from "@/lib/tema";
import { Avisos } from "./Avisos";
import { BuscadorDashboard } from "./BuscadorDashboard";
import { Fragmentos } from "./Fragmentos";
import { Lateral, Novedades } from "./Lateral";
import { Accionable, Dona } from "./Piezas";
import type { Accion, Aviso, ElementoNav, IdVista, NovedadLateral, PasoInicio, ResultadoBusqueda, Usuario } from "./tipos";
import { useTema } from "./useTema";
import "@/estilos/panel.css";

export type PropsArmazon = {
  /** A dónde lleva el logo (el inicio). */
  inicio: Accion;
  /** Franja de arriba (en /pruebalo: "Datos de ejemplo"). */
  aviso?: ReactNode;
  nav: ElementoNav[];
  activa: IdVista;
  /** El negocio de la barra: su nombre, el nombre corto del plan ("Max") y lo que abre su ▾. */
  negocio: { nombre: string; plan: string; menu: ElementoMenu[] };
  /** "Primeros pasos" (el círculo de avance). Con todo listo, no se muestra. */
  pasos: PasoInicio[];
  /** "Mejorar plan": solo lleva a ver los planes (nadie cambia su plan desde aquí). */
  mejorar?: Accion;
  ayuda: ElementoMenu[];
  novedades: NovedadLateral[];
  version?: string;
  /** El uso del plan, al pie del menú. */
  uso?: ReactNode;
  indice: ResultadoBusqueda[];
  crear: ElementoMenu[];
  avisos: Aviso[];
  alLeerAvisos?: () => void;
  ahora: Date | null;
  usuario: Usuario;
  /** Mis agentes, Plan y facturación… */
  perfil: ElementoMenu[];
  /** Cerrar sesión (o salir de la demostración). */
  salir: ElementoMenu;
  /** El botón de chat flotante (abajo a la derecha). Sin esto, no se pinta. */
  chat?: Accion;
  /** Vista de pantalla completa (el chat): sin márgenes. */
  completo?: boolean;
  /** Antes de que un enlace navegue (el panel lo usa para la transición entre vistas). */
  alNavegar?: (e: MouseEvent<HTMLDivElement>) => void;
  children: ReactNode;
};

const CLAVE_ENCOGIDO = "atendel-panel-menu-encogido";
const ANCHO_ESCRITORIO = "(min-width: 1280px)";

/**
 * El armazón del panel: barra de arriba (logo, negocio y plan, buscador al
 * centro, primeros pasos, avisos, ayuda, mejorar plan y tu cuenta), el menú
 * lateral (riel de íconos en tableta, cajón en celular), el lienzo gris
 * con sus fragmentos y el botón de chat flotante. Todo dentro de
 * `.producto`: la base toma los colores y la letra del producto en los dos
 * modos.
 */
export function Armazon(props: PropsArmazon) {
  const { inicio, aviso, nav, activa, novedades, version, uso, chat, completo = false, alNavegar, children } = props;
  const [cajon, setCajon] = useState(false);
  const [encogido, setEncogido] = useState(false);
  /** ¿Hay lugar para el menú completo? (escritorio: el botón lo encoge; si no, abre el cajón). */
  const [escritorio, setEscritorio] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CLAVE_ENCOGIDO) === "1") setEncogido(true);
    } catch {
      /* sin almacenamiento: abierto */
    }
    const consulta = window.matchMedia(ANCHO_ESCRITORIO);
    const alCambiar = () => setEscritorio(consulta.matches);
    alCambiar();
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  // En escritorio, el botón encoge el menú a sus íconos; en tableta y celular abre el cajón
  const alternarMenu = () => {
    if (window.matchMedia(ANCHO_ESCRITORIO).matches) {
      setEncogido((v) => {
        try {
          window.localStorage.setItem(CLAVE_ENCOGIDO, v ? "0" : "1");
        } catch {
          /* sin almacenamiento: solo ahora */
        }
        return !v;
      });
    } else {
      setCajon(true);
    }
  };

  // Elegir algo del cajón lo cierra (el cambio de vista se ve detrás)
  const alTocarCajon = (e: MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest("a[href], button");
    if (el && el.getAttribute("aria-disabled") !== "true" && !el.classList.contains("pnl-nav__abrir")) setCajon(false);
  };

  const pie = (
    <>
      <Novedades novedades={novedades} />
      {uso}
      {version ? <p className="pnl-version">Atendel · versión {version}</p> : null}
    </>
  );

  return (
    <div className="producto dash pnl" data-encogido={encogido ? "true" : undefined} onClickCapture={alNavegar}>
      <Fragmentos cantidad={14} semilla={4} tamMin={10} tamMax={26} className="pnl-fondo pnl-frag--quieto" />
      <a href="#contenido" className="dash-saltar">
        Saltar al contenido
      </a>
      {aviso}
      <BarraSuperior {...props} alternarMenu={alternarMenu} cajonAbierto={cajon} encogido={encogido} escritorio={escritorio} />

      <div className="pnl-cuerpo">
        <aside className="pnl-lateral" aria-label="Menú de Atendel">
          <Lateral nav={nav} activa={activa} pie={pie} />
        </aside>
        <main id="contenido" tabIndex={-1} className={`pnl-principal${completo ? " pnl-principal--completo" : ""}`}>
          {children}
        </main>
      </div>

      {chat && !completo ? (
        <Accionable accion={chat} className="pnl-flotante" etiqueta="Hablar con tu equipo">
          <Icono nombre="conversaciones" tam={24} />
        </Accionable>
      ) : null}

      <Cajon
        abierto={cajon}
        alCerrar={() => setCajon(false)}
        etiqueta="Menú de Atendel"
        cabeza={
          // El logo lleva al inicio y cierra el cajón (también si ya estás en el inicio)
          <span onClickCapture={() => setCajon(false)}>
            <Logo inicio={inicio} />
          </span>
        }
      >
        <div onClickCapture={alTocarCajon}>
          <Lateral nav={nav} activa={activa} pie={pie} />
        </div>
      </Cajon>
    </div>
  );
}

function Logo({ inicio }: { inicio: Accion }) {
  return (
    <Accionable accion={inicio} className="pnl-logo" etiqueta="Atendel: ir al inicio">
      <Marca className="pnl-logo__marca" />
      <span className="pnl-logo__nombre" aria-hidden="true">
        Atendel
      </span>
    </Accionable>
  );
}

function BarraSuperior({
  inicio,
  negocio,
  pasos,
  mejorar,
  ayuda,
  indice,
  crear,
  avisos,
  alLeerAvisos,
  ahora,
  usuario,
  perfil,
  salir,
  chat,
  completo,
  alternarMenu,
  cajonAbierto,
  encogido,
  escritorio,
}: PropsArmazon & { alternarMenu: () => void; cajonAbierto: boolean; encogido: boolean; escritorio: boolean }) {
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
    <header className="pnl-barra">
      <div className="pnl-barra__inicio">
        {/* En escritorio encoge el menú (botón de dos estados); en tableta y celular abre el cajón */}
        <BotonIcono
          etiqueta={escritorio ? "Encoger el menú a íconos" : "Abrir el menú"}
          icono="barra-lateral"
          onClick={alternarMenu}
          aria-pressed={escritorio ? encogido : undefined}
          aria-expanded={escritorio ? undefined : cajonAbierto}
          aria-haspopup={escritorio ? undefined : "dialog"}
        />
        <Logo inicio={inicio} />
        <span className="pnl-barra__division" aria-hidden="true" />
        <Menu
          etiqueta={`${negocio.nombre}: tu plan`}
          aspecto="libre"
          claseDisparador="pnl-negocio pnl-picable"
          disparador={
            <>
              <Avatar nombre={negocio.nombre} tam={24} />
              <span className="pnl-negocio__nombre">{negocio.nombre}</span>
              <span className="pnl-negocio__plan">
                {negocio.plan}
                <Icono nombre="chevron" tam={16} />
              </span>
            </>
          }
          elementos={negocio.menu}
        />
      </div>

      <div className="pnl-barra__centro">
        <BuscadorDashboard indice={indice} placeholder="Busca agentes, chats, correos o secciones" className="pnl-barra__buscador" />
        <BotonIcono etiqueta="Buscar" icono="buscar" className="pnl-barra__lupa" onClick={() => setBuscando(true)} aria-expanded={buscando} />
      </div>

      <div className="pnl-barra__fin">
        <PrimerosPasos pasos={pasos} />
        <Menu
          etiqueta="Nuevo"
          aspecto="libre"
          alineacion="fin"
          className="pnl-barra__nuevo"
          claseDisparador="pnl-nuevo pnl-picable"
          disparador={
            <>
              <Icono nombre="mas" tam={16} />
              <span className="pnl-nuevo__texto">Nuevo</span>
            </>
          }
          elementos={crear}
        />
        {chat && !completo ? (
          <Accionable accion={chat} className="boton-icono boton-icono--capa boton-icono--compacto pnl-barra__chat" etiqueta="Hablar con tu equipo">
            <Icono nombre="conversaciones" tam={20} />
          </Accionable>
        ) : null}
        <Avisos avisos={avisos} ahora={ahora} alLeerTodos={alLeerAvisos} />
        <Menu etiqueta="Ayuda" aspecto="icono" alineacion="fin" className="pnl-barra__ayuda" disparador={<Icono nombre="ayuda" tam={20} />} elementos={ayuda} />
        {mejorar?.href ? (
          <Boton variante="principal" tam="compacto" className="pnl-mejorar" href={mejorar.href}>
            Mejorar plan
          </Boton>
        ) : mejorar?.alElegir ? (
          <Boton variante="principal" tam="compacto" className="pnl-mejorar" onClick={mejorar.alElegir}>
            Mejorar plan
          </Boton>
        ) : null}
        <Menu
          etiqueta="Tu cuenta"
          aspecto="avatar"
          alineacion="fin"
          disparador={<Avatar nombre={usuario.nombre} src={usuario.foto} tam={32} />}
          encabezado={{ nombre: usuario.nombre, correo: usuario.correo, foto: usuario.foto, estado: usuario.estado }}
          elementos={elementosPerfil}
        />
      </div>

      {buscando ? (
        <div className="pnl-barra__busqueda">
          <BuscadorDashboard ref={campoMovil} indice={indice} atajo={false} alElegir={() => setBuscando(false)} className="pnl-barra__busqueda-campo" />
          <button type="button" className="dash-enlace" onClick={() => setBuscando(false)}>
            Cancelar
          </button>
        </div>
      ) : null}
    </header>
  );
}

/** El círculo de "Primeros pasos": cuántos van y, al abrirlo, cada paso con su lugar. */
function PrimerosPasos({ pasos }: { pasos: PasoInicio[] }) {
  const { abierto, setAbierto, cerrar, raiz, disparador, alSalirFoco } = usePopover<HTMLButtonElement>();
  const id = `${useId().replace(/:/g, "")}-pasos`;
  const listos = pasos.filter((p) => p.listo).length;
  if (!pasos.length || listos === pasos.length) return null;
  const pct = Math.round((listos / pasos.length) * 100);

  return (
    <div ref={raiz} className="menu menu--fin" onBlur={alSalirFoco}>
      <button
        ref={disparador}
        type="button"
        className="pnl-pasos pnl-picable"
        aria-expanded={abierto}
        aria-controls={id}
        aria-haspopup="dialog"
        aria-label={`Primeros pasos: ${listos} de ${pasos.length} listos`}
        onClick={() => setAbierto((v) => !v)}
      >
        <span className="pnl-pasos__anillo">
          <Dona
            partes={[{ id: "listos", valor: listos, color: "var(--c-exito)" }]}
            total={pasos.length}
            tam={36}
            grosor={3}
            etiqueta={`${pct}%`}
            centro={<span className="cifras-app">{pct}%</span>}
          />
        </span>
        <span className="pnl-pasos__texto">Primeros pasos</span>
        <Icono nombre="chevron" tam={16} />
      </button>
      <div id={id} role="dialog" aria-label="Primeros pasos" className="menu__panel pnl-pasos__panel" data-abierto={abierto ? "true" : undefined}>
        <p className="pnl-pasos__titulo">Primeros pasos</p>
        <p className="dash-nota">
          {listos} de {pasos.length} listos. Cada paso te lleva a donde se hace.
        </p>
        <ul className="pnl-pasos__lista">
          {pasos.map((p) => (
            <li key={p.id}>
              <Accionable accion={{ ...p, alElegir: p.alElegir ? () => (cerrar(false), p.alElegir?.()) : () => cerrar(false) }} className={`pnl-paso pnl-picable${p.listo ? " pnl-paso--listo" : ""}`}>
                <span className="pnl-paso__marca" aria-hidden="true">
                  {p.listo ? <Icono nombre="check" tam={16} /> : null}
                </span>
                <span>
                  <span className="pnl-paso__titulo">
                    {p.titulo}
                    {p.listo ? <span className="sr-only"> (listo)</span> : null}
                  </span>
                  {p.detalle ? <span className="pnl-paso__detalle">{p.detalle}</span> : null}
                </span>
                {p.listo ? null : <Icono nombre="chevron-derecha" tam={16} />}
              </Accionable>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
