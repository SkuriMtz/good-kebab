"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { Boton, BotonIcono } from "@/components/base/Boton";
import { Cajon } from "@/components/base/Cajon";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Menu, type ElementoMenu, type EncabezadoMenu } from "@/components/base/Menu";
import { Marca } from "@/components/Logo";
import { EVENTO_TEMA, ponerTema, temaActual, type Tema } from "@/lib/tema";
import { BuscadorGlobal, type ResultadoBusqueda } from "./BuscadorGlobal";
import { ContextoArmazon } from "./contexto";
import { Lateral, type AgenteLateral, type ElementoNav, type GrupoLateral } from "./Lateral";
import { EnlaceAccion } from "./piezas";
import type { Accion } from "./tipos";

/*
 * ARMAZÓN DEL DASHBOARD (panel y /pruebalo). La arquitectura de un
 * dashboard de desarrollo, con el acabado de Apple:
 * - Barra superior fija de 56px, translúcida: marca + "/ sección", buscador
 *   redondo (atajo "/"), "+" con acciones rápidas, campana con avisos y el
 *   avatar con el menú de la cuenta (incluye el modo claro/oscuro).
 * - Menú lateral de 256px (≥1024px); en pantallas más chicas vive en un
 *   cajón que se abre con el botón de la barra lateral.
 * - Contenido al centro (cada vista pone su propia columna derecha) y un
 *   pie mínimo con enlaces de utilidad.
 * `modo="chat"`: sin pie ni márgenes, para que el chat ocupe toda la altura
 * (y el lateral solo se queda fijo desde 1280px).
 */

export type PropsArmazon = {
  seccion: string;
  /** Lleva al inicio del dashboard (la marca de la barra). */
  inicio: Accion;
  nav: ElementoNav[];
  activo: string;
  alNavegar?: (id: string) => void;
  agentes: AgenteLateral[];
  grupos: GrupoLateral[];
  grupoNuevo?: { accion?: Accion; nota?: string };
  usuario: EncabezadoMenu;
  menuPerfil: ElementoMenu[];
  menuCrear: ElementoMenu[];
  avisos: ElementoMenu[];
  avisosSinLeer?: number;
  alLeerAvisos?: () => void;
  busqueda: ResultadoBusqueda[];
  /** Franja arriba del contenido (la de "estás en una demostración"). */
  aviso?: ReactNode;
  modo?: "normal" | "chat";
  children: ReactNode;
};

function useTema() {
  const [tema, setTema] = useState<Tema>("oscuro");
  useEffect(() => {
    setTema(temaActual());
    const cambio = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    window.addEventListener(EVENTO_TEMA, cambio);
    return () => window.removeEventListener(EVENTO_TEMA, cambio);
  }, []);
  return tema;
}

export function Armazon({
  seccion,
  inicio,
  nav,
  activo,
  alNavegar,
  agentes,
  grupos,
  grupoNuevo,
  usuario,
  menuPerfil,
  menuCrear,
  avisos,
  avisosSinLeer = 0,
  alLeerAvisos,
  busqueda,
  aviso,
  modo = "normal",
  children,
}: PropsArmazon) {
  const [cajon, setCajon] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const tema = useTema();

  // El modo claro/oscuro va en el menú de la cuenta, antes de "Cerrar sesión"
  const elementoTema: ElementoMenu = {
    id: "tema",
    etiqueta: tema === "oscuro" ? "Usar modo claro" : "Usar modo oscuro",
    icono: tema === "oscuro" ? "sol" : "luna",
    alElegir: () => ponerTema(tema === "oscuro" ? "claro" : "oscuro"),
  };
  const ultimoSeparador = menuPerfil.map((e) => e.tipo).lastIndexOf("separador");
  const perfil: ElementoMenu[] =
    ultimoSeparador >= 0
      ? [...menuPerfil.slice(0, ultimoSeparador), { tipo: "separador", id: "sep-tema" }, elementoTema, ...menuPerfil.slice(ultimoSeparador)]
      : [...menuPerfil, { tipo: "separador", id: "sep-tema" }, elementoTema];

  const listaAvisos: ElementoMenu[] =
    avisosSinLeer > 0 && alLeerAvisos
      ? [...avisos, { tipo: "separador", id: "sep-leer" }, { id: "leer", etiqueta: "Marcar todo como leído", icono: "check-doble", alElegir: alLeerAvisos }]
      : avisos;

  const lateral = (cerrar?: () => void) => (
    <Lateral nav={nav} activo={activo} alNavegar={alNavegar} agentes={agentes} grupos={grupos} grupoNuevo={grupoNuevo} alElegir={cerrar} />
  );

  return (
    <ContextoArmazon.Provider value={true}>
      <div className={`producto tablero${modo === "chat" ? " tablero--chat" : ""}`}>
        <a href="#contenido" className="tb-saltar">
          Saltar al contenido
        </a>

        <header className="tb-barra" data-buscando={buscando ? "true" : undefined}>
          <div className="tb-barra__izquierda">
            <BotonIcono
              etiqueta="Abrir el menú"
              icono="barra-lateral"
              className="tb-barra__menu"
              onClick={() => setCajon(true)}
              aria-expanded={cajon}
            />
            <EnlaceAccion accion={inicio} className="tb-marca" aria-label={`Atendel: ${inicio.etiqueta}`}>
              <Marca className="tb-marca__logo" />
              <span className="tb-marca__nombre">Atendel</span>
            </EnlaceAccion>
            <span className="tb-barra__diagonal" aria-hidden="true">
              /
            </span>
            <span className="tb-barra__seccion">{seccion}</span>
          </div>

          <div className="tb-barra__buscar">
            <BuscadorGlobal resultados={busqueda} placeholder="Busca citas, agentes o chats" />
          </div>

          <div className="tb-barra__derecha">
            <BotonIcono etiqueta="Buscar" icono="buscar" className="tb-barra__lupa" onClick={() => setBuscando(true)} aria-expanded={buscando} />
            <Menu etiqueta="Crear" aspecto="icono" alineacion="fin" disparador={<Icono nombre="mas" />} elementos={menuCrear} className="tb-barra__crear" />
            <Menu
              etiqueta="Avisos"
              etiquetaDisparador={avisosSinLeer ? `Avisos, ${avisosSinLeer} sin leer` : "Avisos"}
              aspecto="icono"
              alineacion="fin"
              disparador={
                <>
                  <Icono nombre="campana" />
                  {avisosSinLeer ? <Insignia contador={avisosSinLeer} solida sobre /> : null}
                </>
              }
              elementos={listaAvisos}
              className="tb-barra__avisos"
            />
            <Menu
              etiqueta="Tu cuenta"
              aspecto="avatar"
              alineacion="fin"
              disparador={<Avatar nombre={usuario.nombre} src={usuario.foto} tam={28} />}
              encabezado={usuario}
              elementos={perfil}
              className="tb-barra__cuenta"
            />
          </div>

          {/* Celular: la búsqueda ocupa la barra completa */}
          {buscando ? (
            <div className="tb-barra__busqueda-movil">
              <BuscadorGlobal resultados={busqueda} placeholder="Busca citas, agentes o chats" atajo={false} enfocar alTerminar={() => setBuscando(false)} />
              <Boton variante="fantasma" tam="compacto" onClick={() => setBuscando(false)}>
                Cancelar
              </Boton>
            </div>
          ) : null}
        </header>

        <div className="tb-cuerpo">
          <aside className="tb-lateral" aria-label="Menú de Atendel">
            {lateral()}
          </aside>

          <div className="tb-principal">
            {aviso}
            <main id="contenido" className="tb-contenido" tabIndex={-1}>
              {children}
            </main>
            {modo === "chat" ? null : (
              <footer className="tb-pie">
                <span className="tb-pie__marca">
                  <Marca className="tb-pie__logo" />© 2026 Atendel
                </span>
                <nav aria-label="Enlaces de utilidad">
                  <ul className="tb-pie__enlaces">
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
                </nav>
              </footer>
            )}
          </div>
        </div>

        <Cajon
          abierto={cajon}
          alCerrar={() => setCajon(false)}
          etiqueta="Menú de Atendel"
          cabeza={
            <span className="tb-marca tb-marca--cajon">
              <Marca className="tb-marca__logo" />
              <span className="tb-marca__nombre">Atendel</span>
            </span>
          }
        >
          {lateral(() => setCajon(false))}
        </Cajon>
      </div>
    </ContextoArmazon.Provider>
  );
}
