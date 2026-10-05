import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Giro, Icono } from "./Iconos";

/**
 * Botones de Atendel (estilo en globals.css, ".boton"):
 * - principal: violeta de Atendel con texto blanco. UNO por pantalla.
 * - sutil: fondo oscuro translúcido, texto azul cielo y borde. La alternativa
 *   de menor compromiso (ej. "Prueba los agentes").
 * - fantasma: transparente; el texto y el borde hacen la señal.
 * Radio 6px, padding 6px 20px, alto mínimo 40px (48px en "grande").
 * Estados: hover (capa de opacidad), foco visible, presión (scale 0.97),
 * deshabilitado y cargando (con giro y aria-busy).
 *
 * Con `href` se pinta como enlace (next/link); sin él, como <button>.
 */

export type VarianteBoton = "principal" | "sutil" | "fantasma";
export type TamBoton = "normal" | "grande" | "chico";

/** Las clases de un botón, para usarlas en elementos que no son <Boton> (ej. <summary>, <label>). */
// Clases escritas completas (no armadas con plantillas) para que Tailwind no las descarte al compilar.
const CLASE_VARIANTE: Record<VarianteBoton, string> = {
  principal: "boton boton--principal",
  sutil: "boton boton--sutil",
  fantasma: "boton boton--fantasma",
};
const CLASE_TAM: Record<TamBoton, string> = { normal: "", grande: "boton--grande", chico: "boton--chico" };

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
