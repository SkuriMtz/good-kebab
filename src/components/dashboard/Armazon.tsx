"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { BotonIcono } from "@/components/base/Boton";
import { Buscador } from "@/components/base/Buscador";
import { Cajon } from "@/components/base/Cajon";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Kbd } from "@/components/base/Kbd";
import { Menu, type ElementoMenu } from "@/components/base/Menu";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { Marca } from "@/components/Logo";
import { ponerTema } from "@/lib/tema";
import type { AgenteLateral, Destino, ElementoLateral, GrupoLateral, GrupoResultados, ResultadoBusqueda, Usuario } from "./tipos";
import { CarasAgentes, MarcaAgente, Tocable, useTema } from "./util";

/* =====================================================================
   ARMAZÓN DEL DASHBOARD (estilo en src/estilos/dashboard.css, ".tablero")
   Barra superior fija y translúcida · menú lateral (cajón en celular) ·
   área principal. El centro y la columna derecha los pone cada vista con
   <Lienzo>. Lo usan /pruebalo (datos de ejemplo) y /panel (datos reales).
   ===================================================================== */

export type PropsArmazon = {
  /** Nombre de la vista actual (barra superior y título del cajón). */
  seccion: string;
  /** Marca visible "Datos de ejemplo" (en /pruebalo). */
  ejemplo?: boolean;
  /** A dónde lleva el logo. */
  inicio: Destino;
  navegacion: ElementoLateral[];
  activa: string;
  agentes: AgenteLateral[];
  grupos: GrupoLateral[];
  /** Botón "+" junto a "Grupos" (o null si el plan no tiene grupos). */
  nuevoGrupo?: (Destino & { etiqueta: string }) | null;
  /** Línea bajo "Grupos" cuando no hay ninguno. */
  sinGrupos?: ReactNode;
  usuario: Usuario;
  /** Perfil, Configuración, Plan y facturación, Mi negocio (el modo y "Cerrar sesión" los agrega el armazón). */
  perfil: ElementoMenu[];
  salir: Destino & { etiqueta: string; descripcion?: string };
  /** Acciones rápidas del "+". */
  crear: ElementoMenu[];
  avisos: { elementos: ElementoMenu[]; sinLeer: number };
  /** Busca en lo que hay en pantalla (citas, chats, pendientes…). */
  buscar: (consulta: string) => GrupoResultados[];
  /** Vista a pantalla completa (el chat): sin columna ni pie, el contenido llena el alto. */
  pantalla?: boolean;
  /** Algo que va al final del cajón en celular (ej. el aviso de datos de ejemplo). */
  pieCajon?: ReactNode;
  children: ReactNode;
};

export function Armazon(props: PropsArmazon) {
  const {
    seccion,
    ejemplo = false,
    inicio,
    navegacion,
    activa,
    agentes,
    grupos,
    nuevoGrupo,
    sinGrupos,
    usuario,
    perfil,
    salir,
    crear,
    avisos,
    buscar,
    pantalla = false,
    pieCajon,
    children,
  } = props;
  const tema = useTema();
  const [cajon, setCajon] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [buscadorMovil, setBuscadorMovil] = useState(false);
  const campoMovil = useRef<HTMLInputElement>(null);
  const principal = useRef<HTMLElement>(null);

  const q = consulta.trim();
  const resultados = useMemo(() => (q ? buscar(q) : []), [q, buscar]);

  // Al abrir el buscador en celular, el foco va al campo
  useEffect(() => {
    if (buscadorMovil) campoMovil.current?.focus();
  }, [buscadorMovil]);

  const cerrarBusqueda = () => {
    setConsulta("");
    setBuscadorMovil(false);
  };

  const menuPerfil: ElementoMenu[] = [
    ...perfil,
    { tipo: "separador" },
    {
      id: "tema",
      etiqueta: tema === "oscuro" ? "Modo claro" : "Modo oscuro",
      icono: tema === "oscuro" ? "sol" : "luna",
      alElegir: () => ponerTema(tema === "oscuro" ? "claro" : "oscuro"),
    },
    { tipo: "separador" },
    {
      id: "salir",
      etiqueta: salir.etiqueta,
      descripcion: salir.descripcion,
      icono: "cerrar-sesion",
      peligroso: true,
      href: salir.href,
      alElegir: salir.alElegir,
    },
  ];

  const lateral = (
    <Lateral
      navegacion={navegacion}
      activa={activa}
      agentes={agentes}
      grupos={grupos}
      nuevoGrupo={nuevoGrupo}
      sinGrupos={sinGrupos}
      alNavegar={() => {
        setCajon(false);
        cerrarBusqueda();
      }}
    />
  );

  return (
    <div className={`producto tablero${pantalla ? " tablero--pantalla" : ""}`}>
      <a href="#contenido" className="tb-saltar">
        Saltar al contenido
      </a>

      {/* ---------- Barra superior: fija, translúcida ---------- */}
      <header className="tb-barra">
        <div className="tb-barra__inicio">
          <BotonIcono
            etiqueta="Abrir el menú lateral"
            icono="barra-lateral"
            className="tb-solo-movil"
            aria-expanded={cajon}
            anillo="var(--c-barra)"
            onClick={() => setCajon(true)}
          />
          <Tocable destino={inicio} className="tb-logo" etiqueta="Atendel, ir al inicio">
            <Marca className="tb-logo__marca" />
            <span className="tb-logo__nombre">Atendel</span>
          </Tocable>
          <span className="tb-barra__sep" aria-hidden="true">
            /
          </span>
          <span className="tb-barra__seccion">{seccion}</span>
          {ejemplo ? <Insignia className="tb-barra__ejemplo">Datos de ejemplo</Insignia> : null}
        </div>

        <div className="tb-barra__fin">
          <div className="tb-barra__buscador">
            <Buscador
              etiqueta="Buscar en Atendel"
              placeholder="Busca citas, chats…"
              tam="compacto"
              valor={consulta}
              alCambiar={setConsulta}
              alBuscar={(v) => setConsulta(v)}
            />
          </div>
          <BotonIcono
            etiqueta={buscadorMovil ? "Cerrar la búsqueda" : "Buscar"}
            icono={buscadorMovil ? "cerrar" : "buscar"}
            className="tb-buscar-movil"
            aria-expanded={buscadorMovil}
            onClick={() => (buscadorMovil ? cerrarBusqueda() : setBuscadorMovil(true))}
          />
          <span className="tb-barra__division" aria-hidden="true" />
          <Menu
            etiqueta="Crear"
            etiquetaDisparador="Crear algo nuevo"
            aspecto="libre"
            claseDisparador="tb-crear"
            alineacion="fin"
            disparador={
              <>
                <Icono nombre="mas" tam={16} />
                <Icono nombre="chevron" tam={16} className="tb-crear__chevron" />
              </>
            }
            elementos={crear}
          />
          <Menu
            etiqueta="Avisos"
            etiquetaDisparador={avisos.sinLeer ? `Avisos, ${avisos.sinLeer} sin leer` : "Avisos"}
            aspecto="icono"
            alineacion="fin"
            className="tb-avisos"
            disparador={
              <>
                <Icono nombre="campana" />
                {avisos.sinLeer ? <Insignia contador={avisos.sinLeer} solida sobre /> : null}
              </>
            }
            elementos={avisos.elementos}
          />
          <Menu
            etiqueta="Tu cuenta"
            etiquetaDisparador={`Tu cuenta: ${usuario.nombre}`}
            aspecto="avatar"
            alineacion="fin"
            className="tb-perfil"
            disparador={<Avatar nombre={usuario.nombre} src={usuario.foto} tam={28} />}
            encabezado={usuario}
            elementos={menuPerfil}
          />
        </div>
      </header>

      {/* Buscador en celular: una fila debajo de la barra */}
      {buscadorMovil ? (
        <div className="tb-buscador-movil">
          <Buscador
            ref={campoMovil}
            etiqueta="Buscar en Atendel"
            placeholder="Busca citas, chats…"
            atajo={false}
            valor={consulta}
            alCambiar={setConsulta}
            alBuscar={(v) => setConsulta(v)}
          />
        </div>
      ) : null}

      <div className="tb-cuerpo">
        <nav className="tb-lateral" aria-label="Secciones del panel">
          {lateral}
        </nav>

        <main id="contenido" ref={principal} className="tb-principal" tabIndex={-1}>
          {q ? (
            <Resultados
              consulta={q}
              grupos={resultados}
              alElegir={(r) => {
                r.alElegir?.();
                cerrarBusqueda();
              }}
              alBorrar={cerrarBusqueda}
            />
          ) : null}
          <div className="tb-vista" hidden={Boolean(q)}>
            {children}
          </div>
        </main>
      </div>

      <Cajon
        abierto={cajon}
        alCerrar={() => setCajon(false)}
        etiqueta="Menú de Atendel"
        cabeza={
          <span className="tb-cajon-cabeza">
            <Marca className="tb-logo__marca" />
            <span className="tb-logo__nombre">Atendel</span>
            {ejemplo ? <Insignia>Datos de ejemplo</Insignia> : null}
          </span>
        }
      >
        {lateral}
        {pieCajon}
      </Cajon>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Menú lateral: secciones, tus agentes y grupos
   --------------------------------------------------------------------- */

function Lateral({
  navegacion,
  activa,
  agentes,
  grupos,
  nuevoGrupo,
  sinGrupos,
  alNavegar,
}: {
  navegacion: ElementoLateral[];
  activa: string;
  agentes: AgenteLateral[];
  grupos: GrupoLateral[];
  nuevoGrupo?: (Destino & { etiqueta: string }) | null;
  sinGrupos?: ReactNode;
  alNavegar: () => void;
}) {
  const con = (d: Destino): Destino => ({
    href: d.href,
    alElegir: () => {
      d.alElegir?.();
      alNavegar();
    },
  });

  return (
    <div className="tb-lateral__interior">
      <ul className="tb-nav">
        {navegacion.map((n) => (
          <li key={n.id}>
            {n.pronto ? (
              <span className="tb-nav__elemento" aria-disabled="true">
                <Icono nombre={n.icono} tam={16} />
                <span className="tb-nav__texto">{n.etiqueta}</span>
                <Insignia tono="pronto">Pronto</Insignia>
              </span>
            ) : (
              <Tocable destino={con(n)} className="tb-nav__elemento" actual={n.id === activa}>
                <Icono nombre={n.icono} tam={16} />
                <span className="tb-nav__texto">{n.etiqueta}</span>
                {n.contador ? <Insignia tono="azul" contador={n.contador} etiqueta={n.etiquetaContador} /> : null}
              </Tocable>
            )}
          </li>
        ))}
      </ul>

      <section className="tb-lateral__bloque" aria-labelledby="tb-tus-agentes">
        <h2 id="tb-tus-agentes" className="tb-lateral__titulo">
          Tus agentes
        </h2>
        <ul className="tb-lista-lateral">
          {agentes.map((a) => (
            <li key={a.id}>
              <Tocable destino={con(a)} className={`tb-agente-lateral${a.apagado ? " tb-agente-lateral--apagado" : ""}`}>
                <MarcaAgente agente={a.id} tam={28} apagado={a.apagado} />
                <span className="tb-agente-lateral__texto">
                  <span className="tb-agente-lateral__nombre">{a.nombre}</span>
                  <PuntoEstado tono={a.tono} etiqueta={a.estado} mostrarEtiqueta pulso={a.pulso} />
                </span>
              </Tocable>
            </li>
          ))}
        </ul>
      </section>

      <section className="tb-lateral__bloque" aria-labelledby="tb-grupos">
        <div className="tb-lateral__titulo-fila">
          <h2 id="tb-grupos" className="tb-lateral__titulo">
            Grupos
          </h2>
          {nuevoGrupo ? (
            nuevoGrupo.href ? (
              <Link href={nuevoGrupo.href} className="tb-mini-boton" aria-label={nuevoGrupo.etiqueta} title={nuevoGrupo.etiqueta} onClick={alNavegar}>
                <Icono nombre="mas" tam={16} />
              </Link>
            ) : (
              <button
                type="button"
                className="tb-mini-boton"
                aria-label={nuevoGrupo.etiqueta}
                title={nuevoGrupo.etiqueta}
                onClick={() => {
                  nuevoGrupo.alElegir?.();
                  alNavegar();
                }}
              >
                <Icono nombre="mas" tam={16} />
              </button>
            )
          ) : null}
        </div>
        {grupos.length ? (
          <ul className="tb-lista-lateral">
            {grupos.map((g) => (
              <li key={g.id}>
                <Tocable destino={con(g)} className="tb-grupo-lateral">
                  <CarasAgentes agentes={g.agentes} tam={28} />
                  <span className="tb-grupo-lateral__texto">
                    <span className="tb-grupo-lateral__nombre">{g.nombre}</span>
                    <span className="tb-grupo-lateral__detalle">{nombresAgentes(g.agentes)}</span>
                  </span>
                </Tocable>
              </li>
            ))}
          </ul>
        ) : (
          <div className="tb-lateral__vacio">{sinGrupos}</div>
        )}
      </section>
    </div>
  );
}

const NOMBRES: Record<string, string> = { lola: "Lola", clara: "Clara", victor: "Víctor", iris: "Iris" };
function nombresAgentes(ids: string[]) {
  const n = ids.map((i) => NOMBRES[i] ?? i);
  return n.length <= 1 ? n.join("") : `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}`;
}

/* ---------------------------------------------------------------------
   Lienzo: centro + columna derecha + pie (cada vista pone el suyo)
   --------------------------------------------------------------------- */

export function Lienzo({
  columna,
  etiquetaColumna = "Tu negocio de un vistazo",
  nota,
  children,
}: {
  columna?: ReactNode;
  etiquetaColumna?: string;
  /** Una línea extra en el pie (ej. "Datos de ejemplo…"). */
  nota?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`tb-lienzo${columna ? "" : " tb-lienzo--sin-columna"}`}>
      <div className="tb-centro">{children}</div>
      {columna ? (
        <aside className="tb-columna" aria-label={etiquetaColumna}>
          {columna}
        </aside>
      ) : null}
      <PieTablero nota={nota} />
    </div>
  );
}

function PieTablero({ nota }: { nota?: ReactNode }) {
  const tema = useTema();
  const siguiente = tema === "oscuro" ? "claro" : "oscuro";
  return (
    <footer className="tb-pie">
      <div className="tb-pie__fila">
        <Marca className="tb-pie__marca" />
        <span>© 2026 Atendel</span>
        <nav aria-label="Enlaces de ayuda" className="tb-pie__enlaces">
          <Link href="/">Inicio</Link>
          <Link href="/precios">Precios</Link>
          <Link href="/preguntas">Preguntas</Link>
          <Link href="/preguntas#seguridad">Tus datos</Link>
        </nav>
        <button type="button" className="tb-pie__tema" onClick={() => ponerTema(siguiente)}>
          <Icono nombre={tema === "oscuro" ? "sol" : "luna"} tam={16} />
          {tema === "oscuro" ? "Modo claro" : "Modo oscuro"}
        </button>
      </div>
      {nota ? <p className="tb-pie__nota">{nota}</p> : null}
    </footer>
  );
}

/* ---------------------------------------------------------------------
   Resultados del buscador (reemplazan la vista mientras escribes)
   --------------------------------------------------------------------- */

function Resultados({
  consulta,
  grupos,
  alElegir,
  alBorrar,
}: {
  consulta: string;
  grupos: GrupoResultados[];
  alElegir: (r: ResultadoBusqueda) => void;
  alBorrar: () => void;
}) {
  const total = grupos.reduce((s, g) => s + g.elementos.length, 0);
  return (
    <div className="tb-lienzo tb-lienzo--sin-columna">
      <section className="tb-centro" aria-labelledby="tb-resultados">
        <div className="tb-bloque__cabeza">
          <h1 id="tb-resultados" className="t-app-titulo">
            Resultados para «{consulta}»
          </h1>
          <button type="button" className="tb-enlace" onClick={alBorrar}>
            Borrar la búsqueda
          </button>
        </div>
        <p className="tb-texto-2" role="status">
          {total === 0 ? "No encontramos nada con esas palabras." : `${total} ${total === 1 ? "resultado" : "resultados"}`}
          <span className="tb-solo-escritorio tb-resultados__atajo">
            {" "}
            · <Kbd>Esc</Kbd> para borrar
          </span>
        </p>
        {total === 0 ? (
          <div className="tb-tarjeta tb-vacio">
            <Icono nombre="buscar" tam={24} className="tb-vacio__icono" />
            <p className="tb-vacio__titulo">Prueba con un nombre o un servicio</p>
            <p className="tb-vacio__texto">Por ejemplo «Rosa», «factura» o «limpieza facial».</p>
          </div>
        ) : (
          grupos
            .filter((g) => g.elementos.length)
            .map((g) => (
              <section key={g.titulo} className="tb-tarjeta" aria-label={g.titulo}>
                <h2 className="tb-tarjeta__subtitulo">{g.titulo}</h2>
                <ul className="tb-filas">
                  {g.elementos.map((r) => (
                    <li key={r.id}>
                      <Tocable destino={{ href: r.href, alElegir: () => alElegir(r) }} className="tb-fila">
                        {r.agente ? <MarcaAgente agente={r.agente} tam={28} /> : <span className="tb-fila__icono"><Icono nombre={r.icono ?? "flecha"} tam={16} /></span>}
                        <span className="tb-fila__texto">
                          <span className="tb-fila__titulo">{r.etiqueta}</span>
                          {r.detalle ? <span className="tb-fila__detalle">{r.detalle}</span> : null}
                        </span>
                        <Icono nombre="chevron-derecha" tam={16} className="tb-fila__chevron" />
                      </Tocable>
                    </li>
                  ))}
                </ul>
              </section>
            ))
        )}
      </section>
    </div>
  );
}

/** Busca sin acentos ni mayúsculas. */
export function coincide(texto: string, consulta: string) {
  const n = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es-MX");
  return n(texto).includes(n(consulta));
}
