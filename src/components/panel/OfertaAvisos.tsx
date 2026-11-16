"use client";

import { useEffect, useState } from "react";
import { Icono } from "@/components/base/Iconos";
import { activarAvisos, estadoAparato, registrarTrabajador } from "@/lib/avisos-aparato";
import { claseBoton } from "./Piezas";

const VISTO = "atendel:avisos-oferta";

/**
 * Una sola vez en el panel: «¿Te aviso en este aparato?». Si dices que no,
 * no vuelve a salir (se activa cuando quieras en Ajustes → Notificaciones).
 * En iPhone sin instalar, explica cómo instalar Atendel primero.
 * También registra el trabajador de las notificaciones (public/sw.js) y
 * anota este aparato (/api/avisos/entrada: aviso si entras desde uno nuevo).
 */
export function OfertaAvisos() {
  const [modo, setModo] = useState<"activar" | "instalar-ios" | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void registrarTrabajador();
    // Una vez por visita: anota este aparato (si entraste desde uno nuevo, te avisa en los demás)
    try {
      if (!sessionStorage.getItem("atendel:entrada")) {
        sessionStorage.setItem("atendel:entrada", "1");
        void fetch("/api/avisos/entrada", { method: "POST" }).catch(() => undefined);
      }
    } catch {
      void fetch("/api/avisos/entrada", { method: "POST" }).catch(() => undefined);
    }
    let visto = true;
    try {
      visto = localStorage.getItem(VISTO) === "1";
    } catch {
      /* sin almacenamiento: no se ofrece */
    }
    if (visto) return;
    // Un momento después de abrir, para no saltar encima de todo
    const t = window.setTimeout(() => {
      void estadoAparato().then((e) => {
        if (e.estado === "apagado") setModo("activar");
        else if (e.estado === "instalar-ios") setModo("instalar-ios");
      });
    }, 4000);
    return () => window.clearTimeout(t);
  }, []);

  const cerrar = () => {
    try {
      localStorage.setItem(VISTO, "1");
    } catch {
      /* igual se cierra */
    }
    setModo(null);
  };

  async function activar() {
    setOcupado(true);
    setError(null);
    const e = await activarAvisos();
    setOcupado(false);
    if (e) setError(e);
    else cerrar();
  }

  if (!modo) return null;
  return (
    <aside className="pc-oferta-avisos" aria-label="Avisos en este aparato">
      <Icono nombre="campana" tam={18} />
      <div className="pc-oferta-avisos__texto">
        <p className="pc-oferta-avisos__titulo">{modo === "activar" ? "¿Te aviso en este aparato?" : "Instala Atendel para recibir avisos"}</p>
        <p className="pc-oferta-avisos__sub">
          {modo === "activar"
            ? "Así te enteras de lo importante aunque no tengas Atendel abierto. Tú eliges cuánto en Ajustes → Notificaciones."
            : "En Safari, toca Compartir (el cuadro con la flecha) y luego «Agregar a inicio». Ábrela desde su ícono y activa los avisos."}
        </p>
        {error ? (
          <p className="pc-oferta-avisos__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="pc-oferta-avisos__botones">
          {modo === "activar" ? (
            <button type="button" className={claseBoton("principal", true)} disabled={ocupado} onClick={activar}>
              Activar avisos
            </button>
          ) : null}
          <button type="button" className={claseBoton("fantasma", true)} onClick={cerrar}>
            {modo === "activar" ? "Ahora no" : "Entendido"}
          </button>
        </div>
      </div>
    </aside>
  );
}
