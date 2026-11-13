"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import type { PromptBarAction } from "@/components/PromptBar";
import { Giro, Icono } from "@/components/base/Iconos";
import { ContextoNavegar, Enlace } from "../Piezas";
import { ACEPTA_DOCUMENTOS, avisarDocumentos, mensajeDe, useFuenteNegocio, validarArchivo } from "./fuente";
import { abrirDrive, driveDisponible } from "./drive";
import { abrirConectar } from "../ConectarApps";

/** Clip y Drive de contorno, como los del menú "+" de la referencia (los demás íconos son de Iconos). */
const Clip = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M15.5 7.5v8a3.5 3.5 0 0 1-7 0V6a2.25 2.25 0 0 1 4.5 0v9.25a1 1 0 0 1-2 0V8" />
  </svg>
);
const Drive = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M8.6 3.5h6.8l6.1 10.6-3.4 5.9H5.9l-3.4-5.9z" />
    <path d="M8.6 3.5 15 14.1h6.5M15.4 3.5 9 14.1 5.9 20M2.5 14.1H15" />
  </svg>
);

type Aviso = { tono: "subiendo" | "ok" | "error"; texto: string; n: number; docs?: boolean };

/**
 * El "+" de la caja de chat (como el de la referencia): "Subir archivos"
 * abre el selector y lo sube a Documentos (con el aviso de que tu equipo lo
 * usará); "Añadir desde Drive" abre el selector de Google Drive (si Drive no
 * está conectado, abre "Conectar una app" en Drive); "Conectar una app" abre
 * la ventana para conectar Gmail y las demás sin salir del chat. Devuelve
 * las acciones para PromptBar y lo que hay que pintar (selector y aviso).
 */
export function useSubirDesdeChat() {
  const fuente = useFuenteNegocio();
  const local = useContext(ContextoNavegar);
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const hrefDocs = `${fuente.base}?vista=negocio&tab=documentos`;

  useEffect(() => {
    if (!aviso || aviso.tono === "subiendo") return;
    const t = window.setTimeout(() => setAviso(null), aviso.tono === "ok" ? 7000 : 9000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const subir = async (archivo: File) => {
    const n = Date.now();
    const error = validarArchivo(archivo);
    if (error) {
      setAviso({ tono: "error", texto: error, n });
      return;
    }
    setAviso({ tono: "subiendo", texto: `Subiendo «${archivo.name}»…`, n });
    try {
      await fuente.subirArchivo(archivo);
      avisarDocumentos();
      setAviso({ tono: "ok", texto: `«${archivo.name}» está en Documentos. Lo verá tu equipo en sus respuestas.`, n });
    } catch (e) {
      setAviso({ tono: "error", texto: `No se pudo subir «${archivo.name}»: ${mensajeDe(e, "intenta de nuevo.")}`, n });
    }
  };

  const desdeDrive = async () => {
    const n = Date.now();
    if (fuente.demo) {
      setAviso({ tono: "ok", texto: "Es un ejemplo: en tu cuenta, aquí eliges archivos de tu Google Drive y tu equipo los lee.", n, docs: false });
      return;
    }
    if (!driveDisponible()) {
      if (local) local(hrefDocs);
      else router.push(hrefDocs);
      return;
    }
    // Sin Drive conectado, primero se conecta (sin salir del chat)
    const conectada = await fuente
      .listarApps()
      .then((l) => l.some((e) => e.id === "google_drive" && e.estado === "conectada"))
      .catch(() => false);
    if (!conectada) {
      abrirConectar("google_drive");
      return;
    }
    try {
      const { documentos, fallidos } = await abrirDrive(fuente);
      if (!documentos.length && !fallidos) return;
      avisarDocumentos();
      const noSe = fallidos ? ` ${fallidos === 1 ? "Un archivo no se pudo leer" : `${fallidos} archivos no se pudieron leer`} (Drive solo deja leer Docs, Hojas, PDF y texto).` : "";
      if (documentos.length) setAviso({ tono: fallidos ? "error" : "ok", texto: `${documentos.length === 1 ? `«${documentos[0].nombre}» está en Documentos.` : `${documentos.length} archivos de Drive están en Documentos.`} Lo verá tu equipo en sus respuestas.${noSe}`, n, docs: true });
      else setAviso({ tono: "error", texto: `No se pudo agregar lo que elegiste.${noSe}`, n });
    } catch (e) {
      setAviso({ tono: "error", texto: mensajeDe(e, "No se pudo abrir Google Drive."), n });
    }
  };

  const acciones: PromptBarAction[] = [
    {
      key: "subir-documento",
      name: "Subir archivos",
      description: "PDF, DOCX, TXT o MD: tu equipo lo consulta",
      icon: <Clip />,
      onSelect: () => entrada.current?.click(),
    },
    {
      key: "drive",
      name: "Añadir desde Drive",
      description: "Archivos de tu Google Drive",
      icon: <Drive />,
      onSelect: () => void desdeDrive(),
    },
    {
      key: "conectar-app",
      name: "Conectar una app",
      description: "Gmail, Calendar, WhatsApp y más",
      icon: <Icono nombre="enlace" tam={18} />,
      onSelect: () => abrirConectar(),
    },
  ];

  const elementos = (
    <>
      <input
        ref={entrada}
        type="file"
        className="pc-oculto"
        accept={ACEPTA_DOCUMENTOS}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          e.target.value = "";
          if (archivo) void subir(archivo);
        }}
      />
      {aviso ? (
        <div key={aviso.n} className={`pc-aviso-subida pc-aviso-subida--${aviso.tono}`} role={aviso.tono === "error" ? "alert" : "status"}>
          {aviso.tono === "subiendo" ? <Giro /> : <Icono nombre={aviso.tono === "ok" ? "check-circulo" : "alerta"} tam={16} />}
          <span className="pc-aviso-subida__texto">{aviso.texto}</span>
          {aviso.tono === "ok" && aviso.docs !== false ? (
            <Enlace href={hrefDocs} className="pc-enlace" onClick={() => setAviso(null)}>
              Ver en Documentos
            </Enlace>
          ) : null}
          {aviso.tono !== "subiendo" ? (
            <button type="button" className="pc-icono pc-aviso-subida__cerrar" onClick={() => setAviso(null)} aria-label="Cerrar el aviso">
              <Icono nombre="cerrar" tam={14} />
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );

  return { acciones, elementos };
}
