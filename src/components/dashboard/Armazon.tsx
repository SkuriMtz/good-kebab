"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { Boton, BotonIcono } from "@/components/base/Boton";
import { Cajon } from "@/components/base/Cajon";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Menu, type ElementoMenu } from "@/components/base/Menu";
import { Marca } from "@/components/Logo";
import { Avisos } from "./Avisos";
import { BuscadorDash } from "./BuscadorDash";
import { Lateral } from "./Lateral";
import { ProveedorNavegacion } from "./Navegacion";
import { useTema } from "./useTema";
import type { AgenteLateral, Aviso, Destino, ElementoNav, GrupoLateral, IdSeccion, ResultadoBusqueda, Usuario } from "./tipos";

/**
 * El armazón del dashboard de Atendel (arquitectura del dashboard de GitHub,
 * acabado de Apple). Lo usan /pruebalo (datos de ejemplo) y /panel (datos reales):
 *
 * - Barra superior fija de 56px, translúcida con desenfoque: la marca y
 *   "Atendel / Sección", el buscador redondo ("/"), el "+" de acciones
 *   rápidas, la campana con sus avisos y el avatar con el menú de perfil.
 * - Menú lateral de 256px (secciones, tus agentes, grupos). En celular y
 *   tableta vertical vive en el cajón (botón de barra lateral, arriba a la izquierda).
 * - El contenido de la sección y un pie mínimo con enlaces de utilidad.
 * - `app`: la sección ocupa todo el alto (el chat), sin pie.
 */
export function Armazon({
  seccion,
  titulo,
  nav,
  agentes,
  grupos,
  vacioGrupos,
  usuario,
  avisos,
  acciones,
  perfil,
  indice,
  ir,
  inicio,
  todo,
  demo = false,
  app = false,
  pieLateral,
  children,
}: {
  seccion: IdSeccion;
  /** Lo que se lee después de "Atendel /" en la barra. */
  titulo: string;
  nav: ElementoNav[];
  agentes: AgenteLateral[];
  grupos: GrupoLateral[];
  vacioGrupos?: ReactNode;
  usuario: Usuario;
  avisos: Aviso[];
  /** Menú "+": acciones rápidas (lo que no existe va con `pronto`). */
  acciones: ElementoMenu[];
  /** Menú del avatar (sin el cambio de modo: lo agrega el armazón). */
  perfil: { antes: ElementoMenu[]; salir: ElementoMenu };
  indice: ResultadoBusqueda[];
  ir: (destino: Destino) => void;
  /** A dónde lleva la marca. */
  inicio: Destino;
  /** "Ver toda la actividad". */
  todo: Destino;
  demo?: boolean;
  app?: boolean;
  pieLateral?: ReactNode;
  children: ReactNode;
}) {
  const [cajon, setCajon] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const { tema, siguiente, alternar } = useTema();

  // Al cambiar de sección se cierran el cajón y la búsqueda del celular
  useEffect(() => {
    setCajon(false);
    setBuscando(false);
  }, [seccion]);

  const elementosPerfil: ElementoMenu[] = [
    ...perfil.antes,
    { tipo: "separador" },
    {
      id: "tema",
      etiqueta: siguiente === "claro" ? "Modo claro" : "Modo oscuro",
      descripcion: tema === "oscuro" ? "Ahora estás en modo oscuro" : "Ahora estás en modo claro",
      icono: siguiente === "claro" ? "sol" : "luna",
      alElegir: alternar,
    },
    { tipo: "separador" },
    perfil.salir,
  ];

  const marca = (
    <span className="dash-marca">
      <Marca className="dash-marca__logo" />
      <span className="dash-marca__nombre">Atendel</span>
    </span>
  );

  return (
    <ProveedorNavegacion ir={ir}>
      <div className={`producto dash${app ? " dash--app" : ""}`}>
        <a href="#contenido" className="dash-saltar">
          Saltar al contenido
        </a>

        {/* ---------- Barra superior ---------- */}
        <header className="dash-barra">
          <BotonIcono
            etiqueta="Abrir el menú"
            icono="barra-lateral"
            className="dash-barra__cajon"
            onClick={() => setCajon(true)}
            aria-expanded={cajon}
          />
          <nav aria-label="Estás en" className="dash-migas">
            {"href" in inicio ? (
              <Link href={inicio.href} className="dash-migas__inicio" aria-label="Atendel: inicio">
                {marca}
              </Link>
            ) : (
              <button type="button" className="dash-migas__inicio" aria-label="Atendel: resumen" onClick={() => ir(inicio)}>
                {marca}
              </button>
            )}
            <span className="dash-migas__separador" aria-hidden="true">
              /
            </span>
            <span className="dash-migas__seccion" aria-current="page">
              {titulo}
            </span>
          </nav>
          {demo ? <Insignia className="dash-barra__ejemplo">Datos de ejemplo</Insignia> : null}

          <div className="dash-barra__busqueda">
            <BuscadorDash indice={indice} />
          </div>

          <div className="dash-barra__acciones">
            {demo ? (
              <Boton variante="sutil" tam="compacto" href="/entrar" className="dash-barra__entrar">
                Entrar
              </Boton>
            ) : null}
            <BotonIcono
              etiqueta="Buscar"
              icono="buscar"
              className="dash-barra__buscar"
              aria-expanded={buscando}
              onClick={() => setBuscando((v) => !v)}
            />
            <Menu etiqueta="Crear" etiquetaDisparador="Crear: acciones rápidas" aspecto="icono" alineacion="fin" disparador={<Icono nombre="mas" />} elementos={acciones} />
            <Avisos avisos={avisos} todo={todo} />
            <Menu
              etiqueta="Tu cuenta"
              aspecto="avatar"
              alineacion="fin"
              className="dash-barra__perfil"
              disparador={<Avatar nombre={usuario.nombre || usuario.correo} src={usuario.foto} tam={28} />}
              encabezado={{ ...usuario, nombre: usuario.nombre || usuario.correo, correo: usuario.nombre ? usuario.correo : undefined }}
              elementos={elementosPerfil}
            />
          </div>
        </header>

        {buscando ? (
          <div className="dash-busqueda-movil">
            <BuscadorDash indice={indice} atajo={false} alElegir={() => setBuscando(false)} />
          </div>
        ) : null}

        {/* ---------- Lateral + contenido ---------- */}
        <div className="dash-cuerpo">
          <aside className="dash-lateral" aria-label="Menú de Atendel">
            <Lateral nav={nav} seccion={seccion} agentes={agentes} grupos={grupos} vacioGrupos={vacioGrupos} pie={pieLateral} />
          </aside>
          <main id="contenido" className="dash-principal" tabIndex={-1}>
            {children}
            {app ? null : <Pie alternarTema={alternar} siguiente={siguiente} />}
          </main>
        </div>

        <Cajon abierto={cajon} alCerrar={() => setCajon(false)} etiqueta="Menú de Atendel" cabeza={marca}>
          <Lateral
            nav={nav}
            seccion={seccion}
            agentes={agentes}
            grupos={grupos}
            vacioGrupos={vacioGrupos}
            pie={pieLateral}
            alIr={() => setCajon(false)}
          />
        </Cajon>
      </div>
    </ProveedorNavegacion>
  );
}

/** Pie mínimo: enlaces de utilidad y el cambio de modo. */
function Pie({ alternarTema, siguiente }: { alternarTema: () => void; siguiente: "claro" | "oscuro" }) {
  return (
    <footer className="dash-pie">
      <span className="dash-pie__marca">
        <Marca className="dash-pie__logo" />© {new Date().getFullYear()} Atendel
      </span>
      <ul className="dash-pie__enlaces">
        <li>
          <Link href="/preguntas">Ayuda</Link>
        </li>
        <li>
          <Link href="/preguntas#seguridad">Tus datos</Link>
        </li>
        <li>
          <Link href="/precios">Planes</Link>
        </li>
        <li>
          <Link href="/">Sitio de Atendel</Link>
        </li>
      </ul>
      <button type="button" className="dash-pie__tema" onClick={alternarTema}>
        <Icono nombre={siguiente === "claro" ? "sol" : "luna"} tam={16} />
        {siguiente === "claro" ? "Modo claro" : "Modo oscuro"}
      </button>
    </footer>
  );
}
