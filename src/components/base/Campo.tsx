"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { Icono } from "./Iconos";

/**
 * Campo de texto con etiqueta flotante (estilo en globals.css, ".entrada").
 * - Radio 8px, borde 1px #21262d, fondo #151a22 (en claro: blanco con #d1d9e0).
 * - Texto y placeholder a 16px (así el iPhone no hace zoom).
 * - La etiqueta descansa dentro del campo y sube al enfocar o al escribir
 *   (solo transform, 0.2s). Si hay `placeholder`, la etiqueta va siempre arriba.
 * - Estados: hover, foco (anillo), error (borde y mensaje con role="alert",
 *   ligado con aria-describedby), deshabilitado y ayuda.
 * - `multilinea` lo vuelve <textarea> que crece solo; con `maxLength` muestra contador.
 * Funciona controlado (value + onChange) o libre (defaultValue).
 */

type Comunes = {
  etiqueta: string;
  /** Mensaje de error; si existe, el campo se marca inválido. */
  error?: string | null;
  /** Texto de ayuda debajo del campo. */
  ayuda?: ReactNode;
  /** Recibe el texto ya extraído del evento. */
  alCambiar?: (valor: string) => void;
  className?: string;
};

type PropsLinea = Comunes & { multilinea?: false } & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;
type PropsMulti = Comunes & { multilinea: true } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;
export type PropsCampo = PropsLinea | PropsMulti;

export const Campo = forwardRef<HTMLInputElement | HTMLTextAreaElement, PropsCampo>(function Campo(props, ref) {
  const { multilinea = false, ...sinMulti } = props as PropsCampo & { multilinea?: boolean };
  const { etiqueta, error, ayuda, alCambiar, className = "", id: idDado, ...resto } = sinMulti;
  const idAuto = useId();
  const id = idDado ?? `campo-${idAuto.replace(/:/g, "")}`;
  const idNota = `${id}-nota`;
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  const valor = typeof resto.value === "string" ? resto.value : undefined;
  const max = resto.maxLength;
  const conPlaceholder = Boolean(resto.placeholder);

  // El texto largo hace crecer el área (sin barra de scroll interna)
  useEffect(() => {
    const el = areaRef.current;
    if (!multilinea || !el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [valor, multilinea]);

  const hayNota = Boolean(error) || Boolean(ayuda) || (multilinea && max !== undefined && valor !== undefined);
  const comunes = {
    id,
    className: "entrada__control",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": hayNota ? idNota : undefined,
    // Sin placeholder propio, uno vacío: así CSS sabe si el campo tiene texto (:placeholder-shown)
    placeholder: resto.placeholder || " ",
  };

  const cerca = max !== undefined && valor !== undefined && valor.length > max * 0.9;

  return (
    <div
      className={[
        "entrada",
        multilinea ? "entrada--multilinea" : "",
        conPlaceholder ? "entrada--flota" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-error={error ? "true" : undefined}
    >
      <div className="entrada__caja">
        {multilinea ? (
          <textarea
            {...(resto as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            {...comunes}
            ref={(el) => {
              areaRef.current = el;
              if (typeof ref === "function") ref(el);
              else if (ref) ref.current = el;
            }}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              (resto as TextareaHTMLAttributes<HTMLTextAreaElement>).onChange?.(e);
              alCambiar?.(e.target.value);
            }}
          />
        ) : (
          <input
            {...(resto as InputHTMLAttributes<HTMLInputElement>)}
            {...comunes}
            ref={ref as Ref<HTMLInputElement>}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              (resto as InputHTMLAttributes<HTMLInputElement>).onChange?.(e);
              alCambiar?.(e.target.value);
            }}
          />
        )}
        <label htmlFor={id} className="entrada__etiqueta">
          {etiqueta}
        </label>
      </div>
      {hayNota ? (
        <div id={idNota} className={`entrada__nota${error ? " entrada__nota--error" : ""}`}>
          {error ? (
            <>
              <Icono nombre="alerta" tam={16} />
              <span role="alert">{error}</span>
            </>
          ) : ayuda ? (
            <span>{ayuda}</span>
          ) : null}
          {multilinea && max !== undefined && valor !== undefined ? (
            <span className={`entrada__contador${cerca ? " text-error" : ""}`}>
              {valor.length.toLocaleString("es-MX")} / {max.toLocaleString("es-MX")}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

/**
 * Campo de correo listo: type="email", teclado de correo, autocompletado,
 * sin mayúsculas automáticas ni autocorrección.
 */
export const CampoCorreo = forwardRef<HTMLInputElement, Omit<PropsLinea, "type" | "etiqueta"> & { etiqueta?: string }>(
  function CampoCorreo({ etiqueta = "Tu correo", ...props }, ref) {
    return (
      <Campo
        {...props}
        ref={ref}
        etiqueta={etiqueta}
        type="email"
        inputMode="email"
        autoComplete={props.autoComplete ?? "email"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint={props.enterKeyHint ?? "send"}
      />
    );
  },
);
