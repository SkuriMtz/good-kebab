"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_POR_ID } from "@/lib/conexiones/catalogo";
import { textoCompletoDeAccion } from "@/lib/datos-fuera";
import type { IdApp } from "@/lib/nucleo-tipos";
import { createClient } from "@/lib/supabase/client";
import { Modal, claseBoton } from "./Piezas";

/**
 * "¿Lo hago?": cuando Atendel deja algo esperando tu OK (crear o mover una
 * cita, mandar un correo, crear una tarea…), en el chat pone un enlace
 * ?aprobar=<id>. Esta ventana muestra qué es (con el texto completo de lo que
 * sale, no solo el resumen) y lo haces o lo descartas con un clic, sin salir
 * del chat. Lee con tu sesión (RLS: solo lo tuyo).
 */

type Datos = { resumen: string; motivo: string | null; estado: string; app: string; texto: string };
const ESTADO: Record<string, string> = { hecha: "ya se hizo", descartada: "lo descartaste", haciendo: "se está haciendo", error: "no salió" };

export function AprobarAccion({ id, alCerrar }: { id: string | null; alCerrar: () => void }) {
  const router = useRouter();
  const [datos, setDatos] = useState<Datos | null | "nada">(null);
  const [ocupado, setOcupado] = useState<"aprobar" | "descartar" | null>(null);
  // enlace: falta el permiso de hacer cosas en esa app (se da una vez) y sigue esperando tu OK
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean; enlace?: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setDatos(null);
    setAviso(null);
    let vivo = true;
    createClient()
      .from("acciones")
      .select("resumen, motivo, estado, app, args")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (vivo)
          setDatos(
            data
              ? { resumen: String(data.resumen), motivo: data.motivo ? String(data.motivo) : null, estado: String(data.estado), app: String(data.app), texto: textoCompletoDeAccion(data.args) }
              : "nada",
          );
      });
    return () => {
      vivo = false;
    };
  }, [id]);

  async function resolver(accion: "aprobar" | "descartar") {
    if (!id) return;
    setOcupado(accion);
    setAviso(null);
    try {
      const r = await fetch(`/api/acciones/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion }) });
      const j = (await r.json().catch(() => null)) as { mensaje?: string; error?: string; permiso?: { enlace?: string } } | null;
      if (r.ok) {
        setAviso({ texto: j?.mensaje ?? "Listo." });
        setDatos((d) => (d && d !== "nada" ? { ...d, estado: accion === "aprobar" ? "hecha" : "descartada" } : d));
        router.refresh();
      } else {
        const enlace = j?.permiso?.enlace;
        setAviso({ texto: j?.error ?? "No se pudo. Intenta de nuevo.", error: !enlace, ...(enlace && enlace.startsWith("/panel?conectar=") ? { enlace } : {}) });
      }
    } catch {
      setAviso({ texto: "Sin conexión: no se hizo nada.", error: true });
    }
    setOcupado(null);
  }

  const esperando = datos && datos !== "nada" && datos.estado === "esperando";
  return (
    <Modal
      abierto={id !== null}
      alCerrar={alCerrar}
      titulo="¿Lo hago?"
      descripcion={datos && datos !== "nada" ? `En ${APP_POR_ID[datos.app as IdApp]?.nombre ?? "tu app"}` : undefined}
      pie={
        esperando ? (
          <>
            <button type="button" className={claseBoton("fantasma", true)} disabled={ocupado !== null} onClick={() => resolver("descartar")}>
              Descartar
            </button>
            <button type="button" className={claseBoton("principal", true)} disabled={ocupado !== null} onClick={() => resolver("aprobar")}>
              {ocupado === "aprobar" ? "Haciéndolo…" : "Aprobar y hacer"}
            </button>
          </>
        ) : (
          <button type="button" className={claseBoton("borde", true)} onClick={alCerrar}>
            Cerrar
          </button>
        )
      }
    >
      {datos === null ? <p className="pc-aprobar__texto">Cargando…</p> : null}
      {datos === "nada" ? <p className="pc-aprobar__texto">No encontré eso. Puede que ya no exista.</p> : null}
      {datos && datos !== "nada" ? (
        <>
          <p className="pc-aprobar__resumen">{datos.resumen}</p>
          {/* Lo que sale completo (el resumen lo corta): lo ves todo antes de aprobar */}
          {datos.texto ? <blockquote className="pc-pendiente__texto pc-aprobar__texto">{datos.texto}</blockquote> : null}
          {datos.motivo && esperando ? <p className="pc-aprobar__texto">Te pregunto porque {datos.motivo}.</p> : null}
          {!esperando && !aviso ? <p className="pc-aprobar__texto">Esto ya se resolvió: {ESTADO[datos.estado] ?? datos.estado}.</p> : null}
        </>
      ) : null}
      {aviso ? (
        <p className={`pc-envio__aviso${aviso.error ? " pc-envio__aviso--error" : ""}`} role="status">
          {aviso.texto}
        </p>
      ) : null}
      {aviso?.enlace ? (
        // Abre la ventana de conectar con «Dar permiso» (navegación del panel, sin salir)
        <a href={aviso.enlace} className={`${claseBoton("principal", true)} pc-aprobar__permiso`}>
          Dar permiso
        </a>
      ) : null}
    </Modal>
  );
}
