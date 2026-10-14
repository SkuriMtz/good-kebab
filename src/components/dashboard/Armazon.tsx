"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { BotonIcono } from "@/components/base/Boton";
import { Cajon } from "@/components/base/Cajon";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Kbd } from "@/components/base/Kbd";
import { Menu, type ElementoMenu } from "@/components/base/Menu";
import { Marca } from "@/components/Logo";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { EVENTO_TEMA, ponerTema, temaActual, type Tema } from "@/lib/tema";
import { Atajos } from "./Atajos";
import { CampanaAvisos, ListaAvisos } from "./Avisos";
import { ContextoTablero } from "./contexto";
import { TECLA_VISTA, esMac as detectarMac } from "./contenido";
import { Hoja } from "./Hoja";
import { Lateral } from "./Lateral";
import { Paleta } from "./Paleta";
import type { Aviso, Destino, ElementoNav, ElementoPaleta, EstadoAgente, GrupoLateral, IdVista, Usuario } from "./tipos";

/** Una acción rápida del "+" (Nueva conversación, Agendar cita…). */
export type AccionCrear = Destino & {
  id: string;
  etiqueta: string;
  icono: NombreIcono;
  descripcion?: string;
  pronto?: boolean;
  atajo?: string[];
};

export type PropsArmazon = {
  vista: IdVista;
  /** Nombre de la sección en la barra ("Resumen", "Conversaciones"…). */
  seccion: string;
  /** A dónde lleva el logo. */
  inicio: string;
  nav: ElementoNav[];
  agentes: EstadoAgente[];
  grupos: GrupoLateral[];
  nuevoGrupo?: Destino;
  sinGrupos?: string;
  /** Algo al pie del lateral (en la demo: crear tu cuenta). */
  pieLateral?: ReactNode;
  /** Algo junto al nombre de la sección (en la demo: "Datos de ejemplo"). */
  marcaBarra?: ReactNode;
  usuario: Usuario;
  /** Perfil, Configuración, Plan y facturación, Mi negocio. */
  perfil: ElementoMenu[];
  /** El último renglón del menú de perfil (Cerrar sesión / Salir de la demostración). */
  salir: Destino & { etiqueta: string };
  crear: AccionCrear[];
  avisos: Aviso[];
  alElegirAviso: (a: Aviso) => void;
  alLeerAvisos: () => void;
  vacioAvisos?: string;
  /** Conversaciones para la paleta. */
  conversacionesPaleta: ElementoPaleta[];
  /** Vista de chat: sin columna derecha ni barra inferior; el chat llena el espacio. */
  chat?: boolean;
  children: ReactNode;
};

const enCampo = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)));
};

/**
 * El armazón del dashboard (la "casa" de /pruebalo y /panel), con la
 * arquitectura del dashboard de GitHub y el acabado de Apple:
 *
 * - Barra superior fija y translúcida (56px + zona segura): logo / sección,
 *   buscador que abre la paleta (atajo "/"), "+", campana y avatar. Su filo
 *   de abajo solo aparece cuando el contenido pasa por debajo.
 * - Lateral fijo en computadora (≥1024px); en tableta y celular vive en el
 *   cajón (botón de barra lateral, se cierra deslizando).
 * - En celular, barra inferior con lo que más se usa (Resumen,
 *   Conversaciones, "+", Agentes, Avisos), áreas de 44px y la barra de inicio
 *   respetada. El "+" y los avisos suben como hoja.
 * - Teclado: ⌘K/Ctrl K o "/" abren la paleta, "?" los atajos, G y una letra
 *   cambian de vista, N empieza una conversación.
 */
export function Armazon(p: PropsArmazon) {
  const router = useRouter();
  const [cajon, setCajon] = useState(false);
  const [paleta, setPaleta] = useState<{ abierta: boolean; teclado: boolean }>({ abierta: false, teclado: false });
  const [atajos, setAtajos] = useState(false);
  const [avisos, setAvisos] = useState<"barra" | "hoja" | null>(null);
  const [crearHoja, setCrearHoja] = useState(false);
  const [tema, setTema] = useState<Tema>("oscuro");
  const [mac, setMac] = useState(false);
  const [desplazado, setDesplazado] = useState(false);
  const pendienteG = useRef(0);

  useEffect(() => {
    setTema(temaActual());
    setMac(detectarMac());
    const alCambiarTema = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    window.addEventListener(EVENTO_TEMA, alCambiarTema);
    return () => window.removeEventListener(EVENTO_TEMA, alCambiarTema);
  }, []);

  // El filo de la barra aparece cuando hay contenido pasando por debajo
  useEffect(() => {
    const alDesplazar = () => setDesplazado(window.scrollY > 4);
    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  const ir = useCallback(
    (d: Destino | undefined) => {
      if (!d) return;
      if (d.alElegir) d.alElegir();
      else if (d.href) router.push(d.href);
    },
    [router],
  );

  const cambiarTema = useCallback(() => ponerTema(temaActual() === "claro" ? "oscuro" : "claro"), []);

  /* ---------- Paleta: todo lo que se puede alcanzar ---------- */
  const elementosPaleta = useMemo<ElementoPaleta[]>(() => {
    const conAccion = (e: ElementoPaleta): ElementoPaleta => (e.alElegir || !e.href ? e : { ...e, alElegir: () => router.push(e.href as string) });
    const vistas: ElementoPaleta[] = p.nav.map((n) => ({
      id: `vista-${n.id}`,
      grupo: "Ir a",
      etiqueta: n.etiqueta,
      icono: n.icono,
      pronto: n.pronto,
      atajo: TECLA_VISTA[n.id] && !n.pronto ? ["G", TECLA_VISTA[n.id] as string] : undefined,
      href: n.href,
      alElegir: n.alElegir,
    }));
    const agentes: ElementoPaleta[] = p.agentes.map((a) => {
      const info = AGENTE_POR_ID[a.id];
      return {
        id: `agente-${a.id}`,
        grupo: "Agentes",
        etiqueta: a.bloqueado ? info.nombre : `Hablar con ${info.nombre}`,
        descripcion: a.bloqueado ? `${info.area} · ${a.bloqueado}` : `${info.area} · ${info.abarca}`,
        agentes: [a.id],
        palabras: `${info.nombre} ${info.area} ${info.abarca} ${info.capacidades.join(" ")}`,
        href: a.href,
        alElegir: a.alElegir,
      };
    });
    const crear: ElementoPaleta[] = p.crear.map((c) => ({
      id: `crear-${c.id}`,
      grupo: "Crear",
      etiqueta: c.etiqueta,
      descripcion: c.descripcion,
      icono: c.icono,
      pronto: c.pronto,
      atajo: c.atajo,
      href: c.href,
      alElegir: c.alElegir,
    }));
    const preferencias: ElementoPaleta[] = [
      {
        id: "tema",
        grupo: "Preferencias",
        etiqueta: tema === "claro" ? "Cambiar a modo oscuro" : "Cambiar a modo claro",
        icono: tema === "claro" ? "luna" : "sol",
        palabras: "tema apariencia claro oscuro noche día",
        alElegir: cambiarTema,
      },
      { id: "atajos", grupo: "Preferencias", etiqueta: "Atajos de teclado", icono: "rayo", atajo: ["?"], palabras: "teclas ayuda", alElegir: () => setAtajos(true) },
      { id: "salir", grupo: "Preferencias", etiqueta: p.salir.etiqueta, icono: "cerrar-sesion", href: p.salir.href, alElegir: p.salir.alElegir },
    ];
    return [...vistas, ...agentes, ...p.conversacionesPaleta, ...crear, ...preferencias].map(conAccion);
  }, [p.nav, p.agentes, p.conversacionesPaleta, p.crear, p.salir, tema, cambiarTema, router]);

  /* ---------- Atajos de teclado ---------- */
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      // ⌘K / Ctrl K funciona en todas partes, incluso escribiendo
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaleta((v) => ({ abierta: !v.abierta, teclado: true }));
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented || enCampo(e.target)) return;
      if (document.querySelector("dialog[open]")) return;

      if (e.key === "/") {
        e.preventDefault();
        setPaleta({ abierta: true, teclado: true });
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setAtajos(true);
        return;
      }
      const tecla = e.key.toUpperCase();
      if (pendienteG.current > Date.now()) {
        pendienteG.current = 0;
        const vista = (Object.keys(TECLA_VISTA) as IdVista[]).find((v) => TECLA_VISTA[v] === tecla);
        const destino = p.nav.find((n) => n.id === vista && !n.pronto);
        if (destino) {
          e.preventDefault();
          ir(destino);
        }
        return;
      }
      if (tecla === "G" && !e.shiftKey) {
        pendienteG.current = Date.now() + 1200;
        return;
      }
      if (tecla === "N" && !e.shiftKey) {
        const nueva = p.crear.find((c) => c.atajo?.[0] === "N" && !c.pronto);
        if (nueva) {
          e.preventDefault();
          ir(nueva);
        }
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [p.nav, p.crear, ir]);

  /* ---------- Menús ---------- */
  const menuCrear: ElementoMenu[] = [
    { tipo: "titulo", etiqueta: "Crear" },
    ...p.crear.map((c) => ({ id: c.id, etiqueta: c.etiqueta, icono: c.icono, descripcion: c.descripcion, pronto: c.pronto, atajo: c.atajo, href: c.href, alElegir: c.alElegir })),
  ];
  const menuPerfil: ElementoMenu[] = [
    ...p.perfil,
    { tipo: "separador" },
    { id: "tema", etiqueta: tema === "claro" ? "Modo oscuro" : "Modo claro", icono: tema === "claro" ? "luna" : "sol", alElegir: cambiarTema },
    { id: "atajos", etiqueta: "Atajos de teclado", icono: "rayo", atajo: ["?"], alElegir: () => setAtajos(true) },
    { tipo: "separador" },
    { id: "salir", etiqueta: p.salir.etiqueta, icono: "cerrar-sesion", peligroso: true, href: p.salir.href, alElegir: p.salir.alElegir },
  ];

  const nuevos = p.avisos.filter((a) => a.nuevo).length;
  const navPorId = (id: IdVista) => p.nav.find((n) => n.id === id);
  const inferior: { id: IdVista; corto: string }[] = [
    { id: "resumen", corto: "Resumen" },
    { id: "conversaciones", corto: "Chats" },
  ];
  const inferior2: { id: IdVista; corto: string }[] = [{ id: "agentes", corto: "Agentes" }];

  const lateral = (alTocar?: () => void) => (
    <Lateral
      nav={p.nav}
      vista={p.vista}
      agentes={p.agentes}
      grupos={p.grupos}
      nuevoGrupo={p.nuevoGrupo}
      sinGrupos={p.sinGrupos}
      pie={p.pieLateral}
      alTocar={alTocar}
    />
  );

  const botonInferior = (b: { id: IdVista; corto: string }) => {
    const n = navPorId(b.id);
    if (!n) return null;
    const actual = p.vista === b.id;
    const contenido = (
      <>
        <span className="inferior__icono">
          <Icono nombre={n.icono} tam={24} />
          {n.contador ? <Insignia contador={n.contador} solida sobre /> : null}
        </span>
        <span>{b.corto}</span>
      </>
    );
    const lectura = n.contador ? `${n.etiqueta}, ${n.etiquetaContador ?? n.contador}` : n.etiqueta;
    return n.href ? (
      <Link key={b.id} href={n.href} className="inferior__boton" aria-current={actual ? "page" : undefined} aria-label={lectura}>
        {contenido}
      </Link>
    ) : (
      <button key={b.id} type="button" className="inferior__boton" aria-current={actual ? "page" : undefined} aria-label={lectura} onClick={n.alElegir}>
        {contenido}
      </button>
    );
  };

  const contexto = useMemo(
    () => ({ abrirPaleta: () => setPaleta({ abierta: true, teclado: false }), abrirAtajos: () => setAtajos(true), esMac: mac }),
    [mac],
  );

  return (
    <ContextoTablero.Provider value={contexto}>
    <div className="producto tablero" data-chat={p.chat ? "true" : undefined}>
      <a href="#contenido" className="tablero__saltar">
        Saltar al contenido
      </a>

      {/* ---------- Barra superior ---------- */}
      <header className="barra" data-desplazado={desplazado || undefined}>
        <BotonIcono etiqueta="Abrir el menú lateral" icono="barra-lateral" className="barra__cajon" aria-expanded={cajon} onClick={() => setCajon(true)} />
        <Link href={p.inicio} className="barra__logo" aria-label="Atendel, inicio">
          <Marca className="barra__marca" />
          <span className="barra__nombre">Atendel</span>
        </Link>
        <span className="barra__diagonal" aria-hidden="true">
          /
        </span>
        <span className="barra__seccion">{p.seccion}</span>
        {p.marcaBarra ? <span className="barra__marca-extra">{p.marcaBarra}</span> : null}

        <div className="barra__derecha">
          <button type="button" className="barra__buscar" onClick={(e) => setPaleta({ abierta: true, teclado: e.detail === 0 })} aria-haspopup="dialog" aria-keyshortcuts="/ Control+K Meta+K">
            <Icono nombre="buscar" tam={16} />
            <span className="barra__buscar-texto">Busca o salta a…</span>
            <Kbd className="barra__buscar-kbd">/</Kbd>
          </button>
          <BotonIcono etiqueta="Buscar" icono="buscar" className="barra__solo-celular" onClick={() => setPaleta({ abierta: true, teclado: false })} />
          <span className="barra__separador" aria-hidden="true" />
          <Menu
            etiqueta="Crear"
            etiquetaDisparador="Crear: nueva conversación, cita o grupo"
            aspecto="icono"
            alineacion="fin"
            className="barra__solo-computadora"
            disparador={<Icono nombre="mas" />}
            elementos={menuCrear}
          />
          <span className="barra__solo-computadora">
            <CampanaAvisos
              abierta={avisos === "barra"}
              alCambiar={(v) => setAvisos(v ? "barra" : null)}
              avisos={p.avisos}
              alElegir={p.alElegirAviso}
              alLeerTodos={p.alLeerAvisos}
              vacio={p.vacioAvisos}
            />
          </span>
          <Menu
            etiqueta="Tu cuenta"
            aspecto="avatar"
            alineacion="fin"
            className="barra__avatar"
            disparador={<Avatar nombre={p.usuario.nombre} src={p.usuario.foto} tam={32} />}
            encabezado={{ nombre: p.usuario.nombre, correo: p.usuario.correo, foto: p.usuario.foto, estado: p.usuario.estado }}
            elementos={menuPerfil}
          />
        </div>
      </header>

      <div className="tablero__cuerpo">
        <aside className="tablero__lateral" aria-label="Menú lateral">
          {lateral()}
        </aside>
        <main id="contenido" className="tablero__principal" tabIndex={-1}>
          {p.children}
        </main>
      </div>

      {/* ---------- Barra inferior (celular) ---------- */}
      {!p.chat ? (
        <nav className="inferior" aria-label="Accesos rápidos">
          {inferior.map(botonInferior)}
          <button type="button" className="inferior__boton inferior__crear" aria-label="Crear" aria-haspopup="dialog" aria-expanded={crearHoja} onClick={() => setCrearHoja(true)}>
            <span className="inferior__mas">
              <Icono nombre="mas" tam={24} />
            </span>
          </button>
          {inferior2.map(botonInferior)}
          <button
            type="button"
            className="inferior__boton"
            aria-label={nuevos ? `Avisos, ${nuevos} sin leer` : "Avisos"}
            aria-haspopup="dialog"
            aria-expanded={avisos === "hoja"}
            onClick={() => setAvisos("hoja")}
          >
            <span className="inferior__icono">
              <Icono nombre="campana" tam={24} />
              {nuevos ? <Insignia contador={nuevos} solida sobre /> : null}
            </span>
            <span>Avisos</span>
          </button>
        </nav>
      ) : null}

      {/* ---------- Capas ---------- */}
      <Cajon abierto={cajon} alCerrar={() => setCajon(false)} etiqueta="Menú de Atendel" cabeza={<span className="barra__logo"><Marca className="barra__marca" /><span className="barra__nombre">Atendel</span></span>}>
        {lateral(() => setCajon(false))}
      </Cajon>

      <Hoja abierta={crearHoja} alCerrar={() => setCrearHoja(false)} titulo="Crear">
        <ul className="hoja__lista">
          {p.crear.map((c) => {
            const contenido = (
              <>
                <span className="hoja__icono">
                  <Icono nombre={c.icono} tam={20} />
                </span>
                <span className="hoja__texto">
                  <span>{c.etiqueta}</span>
                  {c.descripcion ? <span className="hoja__descripcion">{c.descripcion}</span> : null}
                </span>
                {c.pronto ? <Insignia tono="pronto">Pronto</Insignia> : <Icono nombre="chevron-derecha" tam={16} className="hoja__chevron" />}
              </>
            );
            return (
              <li key={c.id}>
                {c.pronto ? (
                  <span className="hoja__fila" aria-disabled="true">
                    {contenido}
                  </span>
                ) : c.href ? (
                  <Link href={c.href} className="hoja__fila" onClick={() => setCrearHoja(false)}>
                    {contenido}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="hoja__fila"
                    onClick={() => {
                      setCrearHoja(false);
                      c.alElegir?.();
                    }}
                  >
                    {contenido}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Hoja>

      <Hoja
        abierta={avisos === "hoja"}
        alCerrar={() => setAvisos(null)}
        titulo="Avisos"
        accion={
          nuevos ? (
            <button type="button" className="hoja__accion" onClick={p.alLeerAvisos}>
              Marcar como leídos
            </button>
          ) : null
        }
      >
        <ListaAvisos
          avisos={p.avisos}
          vacio={p.vacioAvisos}
          alElegir={(a) => {
            setAvisos(null);
            p.alElegirAviso(a);
          }}
        />
      </Hoja>

      <Paleta abierta={paleta.abierta} conTeclado={paleta.teclado} alCerrar={() => setPaleta((v) => ({ ...v, abierta: false }))} elementos={elementosPaleta} esMac={mac} />
      <Atajos abierta={atajos} alCerrar={() => setAtajos(false)} esMac={mac} />
    </div>
    </ContextoTablero.Provider>
  );
}
