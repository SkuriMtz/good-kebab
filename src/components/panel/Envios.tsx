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

/**
 * Lo que decides sobre un mensaje de un cliente por WhatsApp: mandarle la
 * respuesta que propuso Lola (la puedes cambiar) o no contestarle.
 */
export function AccionesWhatsapp({ id, borrador, vencido }: { id: string; borrador: string; vencido: boolean }) {
  const router = useRouter();
  const [texto, setTexto] = useState(borrador);
  const [ocupado, setOcupado] = useState<"mandar" | "descartar" | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null);

  async function resolver(accion: "mandar" | "descartar") {
    setOcupado(accion);
    setAviso(null);
    try {
      const r = await fetch(`/api/whatsapp/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion, texto }) });
      const j = (await r.json().catch(() => null)) as { mensaje?: string; error?: string } | null;
      setAviso(r.ok ? { texto: j?.mensaje ?? "Listo." } : { texto: j?.error ?? "No se pudo. Intenta de nuevo.", error: true });
      if (r.ok) window.setTimeout(() => router.refresh(), 1400);
    } catch {
      setAviso({ texto: "Sin conexión: no se hizo nada.", error: true });
    }
    setOcupado(null);
  }

  return (
    <>
      {vencido ? null : (
        <label className="pc-wa__campo">
          <span className="pc-wa__etiqueta">{borrador ? "Lo que Lola le quiere contestar (lo puedes cambiar)" : "Tu respuesta"}</span>
          <textarea className="pc-campo__entrada pc-wa__texto" value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} maxLength={4096} placeholder="Escribe la respuesta…" />
        </label>
      )}
      {vencido ? null : (
        <button type="button" className={claseBoton("principal", true)} disabled={ocupado !== null || !texto.trim()} onClick={() => resolver("mandar")}>
          {ocupado === "mandar" ? "Mandando…" : "Mandar por WhatsApp"}
        </button>
      )}
      <button type="button" className={claseBoton("fantasma", true)} disabled={ocupado !== null} onClick={() => resolver("descartar")}>
        {vencido ? "Quitar de la lista" : "No contestar"}
      </button>
      {aviso ? (
        <span className={`pc-envio__aviso${aviso.error ? " pc-envio__aviso--error" : ""}`} role="status">
          {aviso.texto}
        </span>
      ) : null}
    </>
  );
}

/** Lo que decides sobre algo que Atendel dejó listo para hacer en una app (una cita, un correo, una tarea…). */
export function AccionesAccion({ id }: { id: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<"aprobar" | "descartar" | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null);

  async function resolver(accion: "aprobar" | "descartar") {
    setOcupado(accion);
    setAviso(null);
    try {
      const r = await fetch(`/api/acciones/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion }) });
      const j = (await r.json().catch(() => null)) as { mensaje?: string; error?: string } | null;
      setAviso(r.ok ? { texto: j?.mensaje ?? "Listo." } : { texto: j?.error ?? "No se pudo. Intenta de nuevo.", error: true });
      if (r.ok) window.setTimeout(() => router.refresh(), 1600);
    } catch {
      setAviso({ texto: "Sin conexión: no se hizo nada.", error: true });
    }
    setOcupado(null);
  }

  return (
    <>
      <button type="button" className={claseBoton("principal", true)} disabled={ocupado !== null} onClick={() => resolver("aprobar")}>
        {ocupado === "aprobar" ? "Haciéndolo…" : "Aprobar y hacer"}
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
