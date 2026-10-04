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
};

/**
 * Campo de texto: la etiqueta arriba y una caja blanca con filo fino que se
 * pinta de azul al escribir. Los textos largos crecen solos.
 */
export function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  multiline = false,
  rows = 5,
  maxLength,
  required,
  autoComplete,
  inputMode,
}: Props) {
  const id = useId();
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);

  const cerca = maxLength ? value.length > maxLength * 0.9 : false;

  return (
    <div className="campo">
      <label htmlFor={id} className="campo__etiqueta">
        {label}
      </label>
      {multiline ? (
        <textarea
          ref={areaRef}
          id={id}
          name={name}
          className="campo__entrada"
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
          className="campo__entrada"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
        />
      )}
      {multiline && maxLength ? (
        <p className={`campo__ayuda${cerca ? " !text-error" : ""}`}>
          {value.length.toLocaleString("es-MX")} / {maxLength.toLocaleString("es-MX")}
        </p>
      ) : null}
    </div>
  );
}
