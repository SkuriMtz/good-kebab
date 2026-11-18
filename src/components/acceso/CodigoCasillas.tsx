"use client";

import { forwardRef, useId, useState } from "react";
import { Icono } from "@/components/base/Iconos";

/**
 * El código de 6 dígitos en 6 cuadritos. Por dentro es UN solo campo (encima
 * de los cuadritos, invisible): así funcionan pegar el código, el
 * autocompletado del celular (one-time-code) y los lectores de pantalla como
 * en cualquier campo. Los cuadritos solo muestran lo escrito y dónde va el
 * siguiente dígito.
 */
export const CodigoCasillas = forwardRef<
  HTMLInputElement,
  {
    etiqueta: string;
    valor: string;
    alCambiar: (v: string) => void;
    error?: string;
    deshabilitado?: boolean;
  }
>(function CodigoCasillas({ etiqueta, valor, alCambiar, error, deshabilitado = false }, ref) {
  const id = useId();
  const idNota = `${id}-nota`;
  const [enfocado, setEnfocado] = useState(false);
  const siguiente = Math.min(valor.length, 5);
  return (
    <div className="acc__codigo6" data-error={error ? "true" : undefined}>
      <label htmlFor={id} className="acc__codigo6-etiqueta">
        {etiqueta}
      </label>
      <div className="acc__casillas">
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className="acc__digito"
            aria-hidden="true"
            data-llena={valor[i] ? "true" : undefined}
            data-activa={enfocado && !deshabilitado && i === siguiente ? "true" : undefined}
          >
            {valor[i] ?? ""}
          </span>
        ))}
        <input
          ref={ref}
          id={id}
          name="codigo"
          className="acc__casillas-campo"
          value={valor}
          onChange={(e) => alCambiar(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onFocus={(e) => {
            setEnfocado(true);
            // El cursor siempre al final: los dígitos se escriben y borran en orden
            const el = e.currentTarget;
            requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
          }}
          onBlur={() => setEnfocado(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          enterKeyHint="done"
          readOnly={deshabilitado}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idNota : undefined}
        />
      </div>
      {error ? (
        <div id={idNota} className="entrada__nota entrada__nota--error">
          <Icono nombre="alerta" tam={16} />
          <span role="alert">{error}</span>
        </div>
      ) : null}
    </div>
  );
});
