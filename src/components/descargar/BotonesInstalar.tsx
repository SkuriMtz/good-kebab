"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { alCambiarInstalacion, estaInstalada, instalar, puedeInstalar } from "@/lib/avisos-aparato";

type Textos = { en: string; iphone: string; android: string; compu: string; entrar: string; instalada: string };

/**
 * Los botones de «Descargar»: iPhone y Android, del tamaño de los de una tienda de apps (pero
 * Atendel no está en tiendas: se instala desde el navegador). En Android (o en la compu), si el
 * navegador ya ofrece instalar, abre ese aviso; si no, baja a los pasos. iPhone baja a sus pasos.
 */
export function BotonesInstalar({ t }: { t: Textos }) {
  const [puede, setPuede] = useState(false);
  const [instalada, setInstalada] = useState(false);
  useEffect(() => {
    const revisar = () => {
      setPuede(puedeInstalar());
      setInstalada(estaInstalada());
    };
    revisar();
    return alCambiarInstalacion(revisar);
  }, []);

  const ir = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (instalada) return <p className="dl-instalada">{t.instalada}</p>;
  return (
    <div className="dl-botones">
      <button type="button" className="dl-insignia" onClick={() => ir("iphone")}>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.6" />
          <path d="M10.5 5h3" />
        </svg>
        <span>
          <small>{t.en}</small>
          {t.iphone}
        </span>
      </button>
      <button
        type="button"
        className="dl-insignia"
        onClick={async () => {
          if (puede && (await instalar())) return;
          ir("android");
        }}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5.5" y="2.5" width="13" height="19" rx="2.6" />
          <path d="M5.5 18h13" />
        </svg>
        <span>
          <small>{t.en}</small>
          {t.android}
        </span>
      </button>
      <p className="dl-compu">
        {t.compu}{" "}
        <Link href="/entrar">
          {t.entrar} <span aria-hidden="true">→</span>
        </Link>
      </p>
    </div>
  );
}
