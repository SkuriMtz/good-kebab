"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import type { IdAgente } from "@/lib/agentes";
import "./panel.css";

/* =====================================================================
   Piezas del panel nuevo (/panel y /pruebalo). Las comparte todo el
   panel y también Estadísticas (trabajador B): título de sección,
   tarjeta, píldoras, odómetro, modal, vacío y barra de búsqueda.
   El estilo vive en src/components/panel/panel.css (prefijo .pc-), con
   los tokens de ATENDEL.md en claro y oscuro.
   ===================================================================== */

/* ---------- Navegación: Link en /panel, local en /pruebalo ---------- */

/**
 * En /pruebalo todo vive en el navegador: un enlace cambia la dirección sin
 * ir al servidor (history.pushState; Next sincroniza useSearchParams). El
 * panel de ejemplo pone aquí su función de navegar; sin ella, es un Link.
 */
export const ContextoNavegar = createContext<((href: string) => void) | null>(null);

type PropsEnlace = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; children: ReactNode; scroll?: boolean };

/** Un enlace del panel: lleva a su sección y la dirección cambia (atrás y recargar funcionan). */
export function Enlace({ href, children, onClick, scroll, ...resto }: PropsEnlace) {
  const local = useContext(ContextoNavegar);
  if (!local) {
    return (
      <Link href={href} scroll={scroll} onClick={onClick} {...resto}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      {...resto}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        local(href);
      }}
    >
      {children}
    </a>
  );
}

/* ---------- Título de sección (serif 32px, como Mercury) ---------- */

export function TituloSeccion({
  titulo,
  texto,
  acciones,
  id,
}: {
  titulo: ReactNode;
  /** Una línea debajo, en gris. */
  texto?: ReactNode;
  /** Botones a la derecha (en celular bajan). */
  acciones?: ReactNode;
  id?: string;
}) {
  return (
    <header className="pc-titulo">
      <div className="pc-titulo__texto">
        <h1 id={id} className="pc-titulo__h">
          {titulo}
        </h1>
        {texto ? <p className="pc-titulo__sub">{texto}</p> : null}
      </div>
      {acciones ? <div className="pc-titulo__acciones">{acciones}</div> : null}
    </header>
  );
}

/** Subtítulo de un bloque dentro de una sección ("Por revisar", "Mañana"). */
export function Subtitulo({ children, extra, id }: { children: ReactNode; extra?: ReactNode; id?: string }) {
  return (
    <div className="pc-subtitulo">
      <h2 id={id} className="pc-subtitulo__h">
        {children}
      </h2>
      {extra ? <div className="pc-subtitulo__extra">{extra}</div> : null}
    </div>
  );
}

/* ---------- Tarjeta (borde fino, hover y press sutiles) ---------- */

/**
 * La tarjeta del panel: fondo de tarjeta, borde de 1px y radio de 12px.
 * Con `href` o `alElegir` se puede picar (borde más claro al pasar el
 * cursor y scale(.98) al presionar, ANIMACIONES.md punto 6). `indice`
 * la mete en la entrada escalonada (punto 2).
 */
export function Tarjeta({
  children,
  href,
  alElegir,
  className = "",
  indice,
  etiqueta,
  como = "div",
  style,
}: {
  children: ReactNode;
  href?: string;
  alElegir?: () => void;
  className?: string;
  /** Su lugar en la entrada escalonada (0, 1, 2…). Sin esto, no entra animada. */
  indice?: number;
  /** Nombre accesible si el contenido no basta. */
  etiqueta?: string;
  como?: "div" | "section" | "article" | "li";
  style?: CSSProperties;
}) {
  const clases = `pc-tarjeta${href || alElegir ? " pc-tarjeta--picable" : ""}${indice !== undefined ? " pc-entra" : ""} ${className}`.trim();
  const estilo = indice !== undefined ? ({ ...style, "--d": `${retrasoEscalon(indice)}ms` } as CSSProperties) : style;
  if (href) {
    return (
      <Enlace href={href} className={clases} style={estilo} aria-label={etiqueta}>
        {children}
      </Enlace>
    );
  }
  if (alElegir) {
    return (
      <button type="button" className={clases} style={estilo} onClick={alElegir} aria-label={etiqueta}>
        {children}
      </button>
    );
  }
  const Como = como;
  return (
    <Como className={clases} style={estilo} aria-label={etiqueta}>
      {children}
    </Como>
  );
}

/**
 * Retraso de la entrada escalonada: 40ms entre tarjetas al principio y
 * cada vez menos (no es un metrónomo), con tope en ~240ms: lo del final
 * llega con las últimas y nada bloquea los clics.
 */
export function retrasoEscalon(i: number) {
  return Math.min(240, Math.round(40 * Math.pow(Math.max(0, i), 0.85)));
}

/* ---------- Píldoras (filtros y periodos) ---------- */

export type OpcionPildora = { id: string; etiqueta: string; href?: string; cuenta?: number | null };

/**
 * Una fila de píldoras: la activa va llena. Con `href` son enlaces (la
 * dirección cambia y atrás funciona); con `alElegir`, botones.
 */
export function Pildoras({
  opciones,
  activa,
  alElegir,
  etiqueta,
  className = "",
}: {
  opciones: OpcionPildora[];
  activa: string;
  alElegir?: (id: string) => void;
  /** Para lectores de pantalla ("Filtrar por área"). */
  etiqueta: string;
  className?: string;
}) {
  return (
    <div className={`pc-pildoras ${className}`} role="group" aria-label={etiqueta}>
      {opciones.map((o) => {
        const es = o.id === activa;
        const contenido = (
          <>
            {o.etiqueta}
            {o.cuenta !== undefined && o.cuenta !== null ? <span className="pc-pildora__cuenta">{o.cuenta}</span> : null}
          </>
        );
        return o.href ? (
          <Enlace key={o.id} href={o.href} scroll={false} className="pc-pildora" aria-current={es ? "true" : undefined}>
            {contenido}
          </Enlace>
        ) : (
          <button key={o.id} type="button" className="pc-pildora" aria-pressed={es} onClick={() => alElegir?.(o.id)}>
            {contenido}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Odómetro (ANIMACIONES.md punto 3) ---------- */

const formatoMx = new Intl.NumberFormat("es-MX");

/**
 * Una cifra cuyos dígitos ruedan: cada dígito es una columna de 0 a 9 que
 * sube con transform (CSS, @starting-style), escalonada 40ms de izquierda a
 * derecha. Si el valor cambia, la transición sigue desde donde va. El
 * lector de pantalla oye la cifra completa. `null` se pinta "—" (sin datos).
 */
export function Odometro({
  valor,
  formato = (n: number) => formatoMx.format(n),
  className = "",
}: {
  valor: number | null | undefined;
  formato?: (n: number) => string;
  className?: string;
}) {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
    return (
      <span className={`pc-odo ${className}`}>
        <span aria-hidden="true">—</span>
        <span className="pc-oculto">Sin datos</span>
      </span>
    );
  }
  const texto = formato(valor);
  const signos = [...texto];
  let digito = 0;
  return (
    <span className={`pc-odo ${className}`}>
      <span className="pc-oculto">{texto}</span>
      {signos.map((c, i) => {
        // La llave va desde la derecha: las unidades siguen siendo las unidades si la cifra crece
        const llave = signos.length - i;
        if (!/\d/.test(c)) {
          return (
            <span key={`s${llave}`} className="pc-odo__signo" aria-hidden="true">
              {c}
            </span>
          );
        }
        const d = digito++;
        return (
          <span key={`d${llave}`} className="pc-odo__dig" aria-hidden="true">
            <span className="pc-odo__col" style={{ "--n": c, "--d": `${d * 40}ms` } as CSSProperties}>
              {DIGITOS}
            </span>
          </span>
        );
      })}
    </span>
  );
}
const DIGITOS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => <span key={n}>{n}</span>);

/* ---------- Modal (ANIMACIONES.md punto 8) ---------- */

/**
 * Ventana sobre el panel: <dialog> nativo (el foco queda adentro y Esc
 * cierra). Entra en 200ms creciendo de .96 a 1 con el fondo oscurecido y
 * desenfocado; sale en 140ms. `instantaneo`: sin animación (lo que se abre
 * con el teclado muchas veces al día, como ⌘K).
 */
export function Modal({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  children,
  pie,
  instantaneo = false,
  ancho = "normal",
  className = "",
}: {
  abierto: boolean;
  alCerrar: () => void;
  titulo: ReactNode;
  descripcion?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
  instantaneo?: boolean;
  ancho?: "normal" | "ancho";
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const cerrar = useRef(alCerrar);
  cerrar.current = alCerrar;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    else if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className={`pc-modal pc-modal--${ancho} ${className}`}
      data-instantaneo={instantaneo ? "" : undefined}
      aria-labelledby={`${id}-t`}
      aria-describedby={descripcion ? `${id}-d` : undefined}
      onClose={() => cerrar.current()}
      onClick={(e) => {
        // Picar fuera de la caja (en el fondo) cierra
        if (e.target === e.currentTarget) cerrar.current();
      }}
    >
      <div className="pc-modal__caja">
        <div className="pc-modal__cabeza">
          <h2 id={`${id}-t`} className="pc-modal__titulo">
            {titulo}
          </h2>
          <button type="button" className="pc-icono" onClick={() => cerrar.current()} aria-label="Cerrar">
            <Icono nombre="cerrar" tam={18} />
          </button>
        </div>
        {descripcion ? (
          <p id={`${id}-d`} className="pc-modal__texto">
            {descripcion}
          </p>
        ) : null}
        <div className="pc-modal__cuerpo">{children}</div>
        {pie ? <div className="pc-modal__pie">{pie}</div> : null}
      </div>
    </dialog>
  );
}

/* ---------- Vacío ---------- */

/**
 * Vacío. Con `agente`, en lugar del ícono va un grupito de fragmentos
 * quietos con el personaje de ese agente (Pendientes, Citas, Actividad).
 */
export function Vacio({ icono = "check-circulo", agente, titulo, texto, accion }: { icono?: NombreIcono; agente?: IdAgente; titulo: ReactNode; texto?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="pc-vacio">
      {agente ? (
        <FragmentosQuietos agente={agente} />
      ) : (
        <span className="pc-vacio__icono" aria-hidden="true">
          <Icono nombre={icono} tam={20} />
        </span>
      )}
      <p className="pc-vacio__titulo">{titulo}</p>
      {texto ? <p className="pc-vacio__texto">{texto}</p> : null}
      {accion ? <div className="pc-vacio__accion">{accion}</div> : null}
    </div>
  );
}

/** Un grupito de triangulitos de contorno, quietos, alrededor del personaje de un agente. */
export function FragmentosQuietos({ agente, className = "" }: { agente: IdAgente; className?: string }) {
  const tris = [
    { x: 10, y: 14, g: -12, c: "#ffb829", t: 8 },
    { x: 26, y: 46, g: 30, c: "#e040fb", t: 7 },
    { x: 84, y: 10, g: 48, c: "#3d7bff", t: 7 },
    { x: 100, y: 38, g: -20, c: "#23d9b5", t: 9 },
    { x: 90, y: 58, g: 160, c: "#8052ff", t: 6 },
    { x: 16, y: 62, g: 80, c: "#15846e", t: 6 },
  ];
  return (
    <span className={`pc-quietos ${className}`} aria-hidden="true">
      <svg className="pc-quietos__tris" viewBox="0 0 112 72" focusable="false">
        {tris.map((t, i) => {
          const h = (t.t * Math.sqrt(3)) / 2;
          return <path key={i} d={`M0 ${(-h * 2) / 3} L${t.t / 2} ${h / 3} L${-t.t / 2} ${h / 3}Z`} transform={`translate(${t.x} ${t.y}) rotate(${t.g})`} fill="none" stroke={t.c} strokeWidth={1.4} strokeLinejoin="round" />;
        })}
      </svg>
      <span className="pc-quietos__personaje">
        <Personaje agente={agente} avatar />
      </span>
    </span>
  );
}

/* ---------- Buscador ancho con ⌘K (arriba de cada sección) ---------- */

/** El aviso que abre el buscador del panel (lo escucha el armazón). */
export const EVENTO_BUSCAR = "atendel:buscar";

export function abrirBuscador() {
  window.dispatchEvent(new Event(EVENTO_BUSCAR));
}

/** Parece un campo, pero abre el buscador del panel (⌘K o Ctrl K). */
export function BarraBuscar({ texto = "Buscar en tu panel" }: { texto?: string }) {
  return (
    <button type="button" className="pc-barra-buscar" onClick={abrirBuscador} aria-keyshortcuts="Meta+K Control+K">
      <Icono nombre="buscar" tam={18} />
      <span className="pc-barra-buscar__texto">{texto}</span>
      <kbd className="pc-kbd" aria-hidden="true">
        ⌘K
      </kbd>
    </button>
  );
}

/* ---------- Botones del panel ---------- */

type Variante = "principal" | "suave" | "borde" | "fantasma";

/** Clase de botón del panel (para <button>, <a> o Enlace). */
export const claseBoton = (variante: Variante = "suave", chico = false) => `pc-boton pc-boton--${variante}${chico ? " pc-boton--chico" : ""}`;

/* ---------- La marca de fragmentos de Atendel ---------- */

/** Los colores de los fragmentos (ATENDEL.md). */
export const COLORES_FRAGMENTO = ["#ffb829", "#8052ff", "#15846e", "#23d9b5", "#e040fb", "#3d7bff"] as const;

const TRIANGULOS: { x: number; y: number; giro: number; color: string; tam: number }[] = [
  { x: 9, y: 9, giro: -8, color: "#ffb829", tam: 11 },
  { x: 24, y: 7, giro: 38, color: "#8052ff", tam: 10 },
  { x: 29, y: 21, giro: 14, color: "#3d7bff", tam: 10 },
  { x: 17, y: 19, giro: 180, color: "#23d9b5", tam: 9 },
  { x: 8, y: 27, giro: -24, color: "#e040fb", tam: 10 },
  { x: 22, y: 31, giro: 62, color: "#15846e", tam: 9 },
];

/**
 * La marca de Atendel en el panel: seis triangulitos de contorno con los
 * colores de los fragmentos (no la chispa de ninguna otra app). `viva`:
 * cada uno deriva muy despacio (solo transform; quieta con reducir
 * movimiento).
 */
export function MarcaFragmentos({ tam = 36, viva = false, className = "" }: { tam?: number; viva?: boolean; className?: string }) {
  return (
    <svg className={`pc-marca${viva ? " pc-marca--viva" : ""} ${className}`} width={tam} height={tam} viewBox="0 0 38 38" aria-hidden="true" focusable="false">
      {TRIANGULOS.map((t, i) => {
        const r = t.tam / 2;
        const h = (t.tam * Math.sqrt(3)) / 2;
        const d = `M0 ${(-h * 2) / 3} L${r} ${h / 3} L${-r} ${h / 3}Z`;
        return (
          <g key={i} transform={`translate(${t.x} ${t.y}) rotate(${t.giro})`}>
            <path className="pc-marca__tri" style={{ "--i": i } as CSSProperties} d={d} fill="none" stroke={t.color} strokeWidth={1.6} strokeLinejoin="round" />
          </g>
        );
      })}
    </svg>
  );
}
