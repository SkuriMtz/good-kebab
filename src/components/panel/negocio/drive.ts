"use client";

import type { Documento } from "@/lib/nucleo-tipos";
import type { FuenteNegocio } from "./fuente";

/* =====================================================================
   "Elegir de Google Drive": el único lugar que habla con el Picker de D
   (src/lib/conexiones/picker-cliente.ts). La vista solo pregunta si se
   puede (driveDisponible) y pide los archivos (abrirDrive); lo elegido se
   vuelve documentos con RUTAS.drivePicker.
   ===================================================================== */

/** ¿Hay con qué abrir el Picker en este navegador? (sus dos variables públicas). */
export const driveDisponible = () => Boolean(process.env.NEXT_PUBLIC_GOOGLE_API_KEY && process.env.NEXT_PUBLIC_GOOGLE_APP_ID);

/** Abre el Picker y guarda lo elegido como documentos. Sin elegir nada: []. */
export async function abrirDrive(fuente: FuenteNegocio): Promise<Documento[]> {
  if (fuente.demo) return [];
  throw new Error("El selector de Google Drive todavía no está listo en esta versión.");
}
