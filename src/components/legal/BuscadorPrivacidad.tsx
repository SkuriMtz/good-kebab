"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

/**
 * El buscador del Centro de privacidad: busca mientras escribes (el servidor
 * filtra con ?q=…). Sin JavaScript también sirve: es un formulario GET.
 */
export function BuscadorPrivacidad({ inicial, placeholder, etiqueta }: { inicial: string; placeholder: string; etiqueta: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [valor, setValor] = useState(inicial);
  const [buscando, empezar] = useTransition();
  const espera = useRef(0);

  useEffect(() => () => window.clearTimeout(espera.current), []);

  const ir = (v: string) => {
    const q = v.trim();
    empezar(() => router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false }));
  };

  return (
    <form
      role="search"
      action={pathname}
      method="get"
      className="centro__buscador"
      data-buscando={buscando ? "" : undefined}
      onSubmit={(e) => {
        e.preventDefault();
        window.clearTimeout(espera.current);
        ir(valor);
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        name="q"
        value={valor}
        placeholder={placeholder}
        aria-label={etiqueta}
        maxLength={100}
        autoComplete="off"
        onChange={(e) => {
          const v = e.target.value;
          setValor(v);
          window.clearTimeout(espera.current);
          espera.current = window.setTimeout(() => ir(v), 250);
        }}
      />
    </form>
  );
}
