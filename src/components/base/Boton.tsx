import Link from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { Giro, Icono, type NombreIcono } from "./Iconos";
import { Insignia } from "./Insignia";

/**
 * Botones de Atendel (estilo en globals.css, ".boton"):
 * - principal: AZUL de acción (#0071e3, hover #0077ed) con texto blanco.
 *   UNO por pantalla. (Desde la base 4b el violeta ya no es acción: es marca.)
 * - sutil: fondo oscuro translúcido, texto azul cielo y borde. La alternativa
 *   de menor compromiso (ej. "Prueba los agentes"). Dentro de .producto pasa a
 *   neutro con contorno (el botón "normal" del dashboard).
 * - fantasma: transparente; el texto y el borde hacen la señal. Dentro de
 *   .producto, sin borde (aparece al pasar el cursor).
 * Radio 6px (8px dentro de .producto), padding 6px 20px.
 * Tamaños: "chico" 36px · "normal" 40px · "grande" 48px · "compacto" 32px
 * (el del dashboard: 14px/500; en táctil el área que se toca crece a 44px).
 * Estados: hover (capa de opacidad), foco visible, presión (scale 0.97),
 * deshabilitado y cargando (con giro y aria-busy).
 *
 * Con `href` se pinta como enlace (next/link); sin él, como <button>.
 */

export type VarianteBoton = "principal" | "sutil" | "fantasma";
export type TamBoton = "normal" | "grande" | "chico" | "compacto";

/** Las clases de un botón, para usarlas en elementos que no son <Boton> (ej. <summary>, <label>). */
// Clases escritas completas (no armadas con plantillas) para que Tailwind no las descarte al compilar.
const CLASE_VARIANTE: Record<VarianteBoton, string> = {
  principal: "boton boton--principal",
  sutil: "boton boton--sutil",
  fantasma: "boton boton--fantasma",
};
const CLASE_TAM: Record<TamBoton, string> = {
  normal: "",
  grande: "boton--grande",
  chico: "boton--chico",
  compacto: "boton--compacto",
};

export function claseBotonBase(variante: VarianteBoton = "principal", tam: TamBoton = "normal", bloque = false) {
  return [CLASE_VARIANTE[variante], CLASE_TAM[tam], bloque ? "boton--bloque" : ""].filter(Boolean).join(" ");
}

type Comunes = {
  variante?: VarianteBoton;
  tam?: TamBoton;
  /** Ocupa todo el ancho disponible. */
  bloque?: boolean;
  /** Muestra el giro, bloquea el botón y anuncia "ocupado". */
  cargando?: boolean;
  /** Ícono antes del texto (se cambia por el giro mientras carga). */
  icono?: ReactNode;
  /** Flecha → al final (para botones que llevan a otra página). */
  flecha?: boolean;
  className?: string;
  children: ReactNode;
};

type ComoBoton = Comunes &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Comunes> & {
    href?: undefined;
  };

type ComoEnlace = Comunes &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Comunes | "href"> & {
    href: string;
    /** Un enlace no se puede "deshabilitar": se marca aria-disabled y no navega. */
    deshabilitado?: boolean;
    prefetch?: boolean;
  };

export type PropsBoton = ComoBoton | ComoEnlace;

function Contenido({ cargando, icono, flecha, children }: Pick<Comunes, "cargando" | "icono" | "flecha" | "children">) {
  return (
    <>
      {cargando ? <Giro className="boton__giro" /> : icono}
      <span>{children}</span>
      {flecha ? <Icono nombre="flecha" tam={16} className="flecha" /> : null}
    </>
  );
}

export function Boton(props: PropsBoton) {
  if (props.href !== undefined) {
    const {
      variante = "principal",
      tam = "normal",
      bloque = false,
      cargando = false,
      icono,
      flecha = false,
      className = "",
      children,
      href,
      deshabilitado = false,
      onClick,
      ...resto
    } = props;
    const clases = `${claseBotonBase(variante, tam, bloque)} ${className}`;
    // Inactivo: un <a> sin href no navega ni recibe foco; se anuncia como deshabilitado.
    if (deshabilitado || cargando) {
      return (
        <a
          className={clases}
          role="link"
          aria-disabled="true"
          aria-busy={cargando || undefined}
          data-cargando={cargando || undefined}
        >
          <Contenido cargando={cargando} icono={icono} flecha={flecha}>
            {children}
          </Contenido>
        </a>
      );
    }
    return (
      <Link {...resto} href={href} className={clases} onClick={onClick}>
        <Contenido cargando={cargando} icono={icono} flecha={flecha}>
          {children}
        </Contenido>
      </Link>
    );
  }

  const {
    variante = "principal",
    tam = "normal",
    bloque = false,
    cargando = false,
    icono,
    flecha = false,
    className = "",
    children,
    type = "button",
    disabled,
    ...resto
  } = props;
  return (
    <button
      {...resto}
      type={type}
      className={`${claseBotonBase(variante, tam, bloque)} ${className}`}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      data-cargando={cargando || undefined}
    >
      <Contenido cargando={cargando} icono={icono} flecha={flecha}>
        {children}
      </Contenido>
    </button>
  );
}

/* ---------------------------------------------------------------------
   Botón de solo ícono (barra del dashboard: campana, "+", barra lateral…)
   --------------------------------------------------------------------- */

type PropsBotonIcono = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** Qué hace, para lectores de pantalla (y el globo del cursor). Obligatorio: no hay texto visible. */
  etiqueta: string;
  icono: NombreIcono;
  /** "compacto" 32px (barra del dashboard; 44px de área táctil en celular) o "normal" 44px. */
  tam?: "compacto" | "normal";
  /** Contador encima (ej. avisos sin leer). 0 o sin valor: no se pinta. */
  contador?: number;
  /** Un punto encima en vez de número ("hay algo nuevo"). */
  punto?: boolean;
  /** Cómo se lee el contador o el punto (ej. "3 avisos sin leer"). */
  etiquetaContador?: string;
  /** Color del anillo del contador: el fondo sobre el que va el botón (por defecto --c-fondo). */
  anillo?: string;
};

/**
 * <BotonIcono etiqueta="Avisos" icono="campana" tam="compacto" contador={3} etiquetaContador="3 avisos sin leer" />
 * Hover y presión con una capa sutil (--c-activo); foco visible; aria-expanded
 * o aria-pressed dejan la capa puesta. Se puede usar como disparador de <Menu>.
 */
export const BotonIcono = forwardRef<HTMLButtonElement, PropsBotonIcono>(function BotonIcono(
  { etiqueta, icono, tam = "compacto", contador, punto = false, etiquetaContador, anillo, className = "", type = "button", style, ...resto },
  ref,
) {
  const hayContador = typeof contador === "number" && contador > 0;
  const lectura = etiquetaContador ? `${etiqueta}, ${etiquetaContador}` : etiqueta;
  return (
    <button
      {...resto}
      ref={ref}
      type={type}
      aria-label={lectura}
      title={etiqueta}
      className={`boton-icono boton-icono--capa${tam === "compacto" ? " boton-icono--compacto" : ""} ${className}`}
      style={anillo ? ({ ...style, "--anillo": anillo } as CSSProperties) : style}
    >
      <Icono nombre={icono} tam={tam === "compacto" ? 20 : 24} />
      {hayContador ? <Insignia contador={contador} solida sobre /> : punto ? <Insignia punto tono="azul" sobre /> : null}
    </button>
  );
});
