"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import type { PromptBarAction } from "@/components/PromptBar";
import { Giro, Icono } from "@/components/base/Iconos";
import { ContextoNavegar, Enlace } from "../Piezas";
import { ACEPTA_DOCUMENTOS, avisarDocumentos, mensajeDe, useFuenteNegocio, validarArchivo } from "./fuente";

type Aviso = { tono: "subiendo" | "ok" | "error"; texto: string; n: number };

/**
 * El "+" de la caja de chat: "Subir un documento" abre el selector de
 * archivos y lo sube a Documentos (con el aviso de que tu equipo lo usará),
 * y "Conectar una app" lleva a la pestaña Apps. Devuelve las acciones para
 * PromptBar y lo que hay que pintar (el selector escondido y el aviso).
 */
export function useSubirDesdeChat() {
  const fuente = useFuenteNegocio();
  const local = useContext(ContextoNavegar);
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const hrefDocs = `${fuente.base}?vista=negocio&tab=documentos`;
  const hrefApps = `${fuente.base}?vista=negocio&tab=apps`;

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

  const acciones: PromptBarAction[] = [
    {
      key: "subir-documento",
      name: "Subir un documento",
      description: "PDF, DOCX, TXT o MD: tu equipo lo consulta",
      icon: <Icono nombre="subir" tam={16} />,
      onSelect: () => entrada.current?.click(),
    },
    {
      key: "conectar-app",
      name: "Conectar una app",
      description: "Gmail, Calendar, Drive y más",
      icon: <Icono nombre="enlace" tam={16} />,
      onSelect: () => (local ? local(hrefApps) : router.push(hrefApps)),
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
          {aviso.tono === "ok" ? (
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
