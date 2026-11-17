"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/**
 * Verificación de Cloudflare Turnstile. Solo se pinta si existe
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY; si no, no hay nada en la página.
 * El script se carga desde el código (la política de seguridad lo permite
 * porque lo pide un script con nonce) y el token se manda como `turnstile`.
 */

type Api = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: Api;
  }
}

export const TURNSTILE_CLAVE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const URL_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let promesa: Promise<Api> | null = null;
function cargar(): Promise<Api> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  promesa ??= new Promise<Api>((ok, mal) => {
    const s = document.createElement("script");
    s.src = URL_SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? ok(window.turnstile) : mal(new Error("turnstile")));
    s.onerror = () => {
      promesa = null;
      mal(new Error("turnstile"));
    };
    document.head.appendChild(s);
  });
  return promesa;
}

export type ManijaTurnstile = { reiniciar: () => void };

export const Turnstile = forwardRef<ManijaTurnstile, { alToken: (token: string | null) => void; etiqueta: string }>(function Turnstile(
  { alToken, etiqueta },
  ref,
) {
  const caja = useRef<HTMLDivElement>(null);
  const idWidget = useRef<string | null>(null);
  const alTokenRef = useRef(alToken);
  alTokenRef.current = alToken;

  useImperativeHandle(ref, () => ({
    reiniciar: () => {
      alTokenRef.current(null);
      if (idWidget.current && window.turnstile) window.turnstile.reset(idWidget.current);
    },
  }));

  useEffect(() => {
    if (!TURNSTILE_CLAVE || !caja.current) return;
    let vivo = true;
    cargar()
      .then((api) => {
        if (!vivo || !caja.current || idWidget.current) return;
        idWidget.current = api.render(caja.current, {
          sitekey: TURNSTILE_CLAVE,
          theme: "dark",
          callback: (t: string) => alTokenRef.current(t),
          "expired-callback": () => alTokenRef.current(null),
          "error-callback": () => alTokenRef.current(null),
        });
      })
      .catch(() => {});
    return () => {
      vivo = false;
      if (idWidget.current && window.turnstile) window.turnstile.remove(idWidget.current);
      idWidget.current = null;
    };
  }, []);

  if (!TURNSTILE_CLAVE) return null;
  return <div ref={caja} className="acc__turnstile" role="group" aria-label={etiqueta} />;
});
