"use client";

import { useEffect, useState } from "react";

/** 32 bytes al azar (del generador seguro del navegador), en base64. */
function nuevaLlave(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function GenerarLlave() {
  const [llave, setLlave] = useState("");
  const [copiada, setCopiada] = useState(false);

  // Se crea al abrir (en el navegador, nunca en el servidor)
  useEffect(() => setLlave(nuevaLlave()), []);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(llave);
      setCopiada(true);
      window.setTimeout(() => setCopiada(false), 2500);
    } catch {
      /* si no deja copiar, se puede seleccionar a mano */
    }
  };

  return (
    <section className="llave__caja">
      <h1 className="llave__titulo">Tu llave de cifrado</h1>
      <p className="llave__texto">Esta llave se creó aquí, en tu navegador. No se mandó a ningún lado y no se guarda: si cierras la página, desaparece.</p>
      <code className="llave__valor" aria-live="polite">
        {llave || "…"}
      </code>
      <div className="llave__botones">
        <button type="button" className="llave__boton llave__boton--principal" onClick={copiar} disabled={!llave}>
          {copiada ? "¡Copiada!" : "Copiar"}
        </button>
        <button
          type="button"
          className="llave__boton"
          onClick={() => {
            setLlave(nuevaLlave());
            setCopiada(false);
          }}
        >
          Generar otra
        </button>
      </div>
      <ol className="llave__pasos">
        <li>
          En Vercel, abre el proyecto <b>good-kebab</b> → <b>Settings</b> → <b>Environment Variables</b>.
        </li>
        <li>
          En <b>Key</b> escribe <code>ATENDEL_LLAVE_CIFRADO</code> y en <b>Value</b> pega la llave.
        </li>
        <li>
          Guarda y vuelve a publicar (Redeploy). <b>No la cambies nunca</b> después: las conexiones guardadas dejarían de servir.
        </li>
        <li>No se la mandes a nadie (tampoco por el chat).</li>
      </ol>
    </section>
  );
}
