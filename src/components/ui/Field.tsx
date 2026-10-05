"use client";

import type { HTMLAttributes, HTMLInputTypeAttribute } from "react";
import { Campo } from "@/components/base/Campo";

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
  error?: string | null;
  disabled?: boolean;
};

/**
 * Campo de formulario de siempre (lo usan /entrar y el panel), ahora con el
 * estilo de la base común: envuelve a <Campo> (etiqueta flotante, radio 8px,
 * foco, error y deshabilitado). Los textos largos crecen solos y muestran contador.
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
  error,
  disabled,
}: Props) {
  if (multiline) {
    return (
      <Campo
        multilinea
        etiqueta={label}
        name={name}
        value={value}
        alCambiar={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        required={required}
        error={error}
        disabled={disabled}
      />
    );
  }
  return (
    <Campo
      etiqueta={label}
      name={name}
      type={type}
      value={value}
      alCambiar={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      required={required}
      autoComplete={autoComplete}
      inputMode={inputMode}
      error={error}
      disabled={disabled}
    />
  );
}
