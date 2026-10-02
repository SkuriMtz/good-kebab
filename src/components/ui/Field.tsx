"use client";

import { useEffect, useId, useRef, type HTMLAttributes, type HTMLInputTypeAttribute } from "react";

type Props = {
  label: string;
  name: string;
  value: string;
  onChange: (valor: string) => void;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  /** Cambia este número para que la línea destelle (ej. al llenar con un ejemplo). */
  flashKey?: number;
};

/**
 * Campo de texto minimalista: sin caja, solo una línea que se pinta de
 * violeta desde el centro al escribir. Los textos largos crecen solos.
 */
export function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  multiline = false,
  rows = 4,
  maxLength,
  required,
  autoComplete,
  inputMode,
  flashKey = 0,
}: Props) {
  const id = useId();
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const cerca = maxLength ? value.length > maxLength * 0.9 : false;

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <div className="relative">
        {multiline ? (
          <textarea
            ref={areaRef}
            id={id}
            name={name}
            className="field__input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            required={required}
            rows={rows}
          />
        ) : (
          <input
            id={id}
            name={name}
            type={type}
            className="field__input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            required={required}
            autoComplete={autoComplete}
            inputMode={inputMode}
          />
        )}
        <span key={flashKey} className={`field__line${flashKey ? " field__line--flash" : ""}`} aria-hidden="true" />
      </div>
      {multiline && maxLength ? (
        <span className={`field__meta${cerca ? " text-saffron" : ""}`}>
          {value.length.toLocaleString("es-MX")} / {maxLength.toLocaleString("es-MX")}
        </span>
      ) : null}
    </div>
  );
}
