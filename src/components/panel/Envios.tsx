"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { claseBoton } from "./Piezas";

/** Los botones de un envío en Pendientes: tu visto bueno es lo único que lo manda. */
export function AccionesEnvio({ id }: { id: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<"aprobar" | "descartar" | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null);

  async function resolver(accion: "aprobar" | "descartar") {
    setOcupado(accion);
    setAviso(null);
    try {
      const r = await fetch(`/api/envios/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion }) });
      const j = (await r.json().catch(() => null)) as { mensaje?: string; error?: string } | null;
      setAviso(r.ok ? { texto: j?.mensaje ?? "Listo." } : { texto: j?.error ?? j?.mensaje ?? "No se pudo. Intenta de nuevo.", error: true });
      if (r.ok) window.setTimeout(() => router.refresh(), 1400);
    } catch {
      setAviso({ texto: "Sin conexión: no se hizo nada.", error: true });
    }
    setOcupado(null);
  }

  return (
    <>
      <button type="button" className={claseBoton("principal", true)} disabled={ocupado !== null} onClick={() => resolver("aprobar")}>
        {ocupado === "aprobar" ? "Aprobando…" : "Aprobar y enviar"}
      </button>
      <button type="button" className={claseBoton("fantasma", true)} disabled={ocupado !== null} onClick={() => resolver("descartar")}>
        Descartar
      </button>
      {aviso ? (
        <span className={`pc-envio__aviso${aviso.error ? " pc-envio__aviso--error" : ""}`} role="status">
          {aviso.texto}
        </span>
      ) : null}
    </>
  );
}
