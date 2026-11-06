"use client";

import { abrirPicker, pickerDisponible } from "@/lib/conexiones/picker-cliente";
import type { Documento } from "@/lib/nucleo-tipos";
import type { FuenteNegocio } from "./fuente";

/* =====================================================================
   "Elegir de Google Drive": el único lugar que habla con el Picker de D
   (src/lib/conexiones/picker-cliente.ts). La vista solo pregunta si se
   puede (driveDisponible) y pide los archivos (abrirDrive); lo elegido se
   vuelve documentos con RUTAS.drivePicker (fuente.guardarDeDrive), que
   también dice cuántos fallaron (cabecera X-Archivos-Fallidos).
   ===================================================================== */

/** ¿Hay con qué abrir el Picker en este navegador? (sus dos variables públicas). */
export const driveDisponible = pickerDisponible;

/** Abre el Picker y guarda lo elegido como documentos. Si se cancela: nada. */
export async function abrirDrive(fuente: FuenteNegocio): Promise<{ documentos: Documento[]; fallidos: number }> {
  if (fuente.demo) return { documentos: [], fallidos: 0 };
  const archivos = await abrirPicker();
  if (!archivos.length) return { documentos: [], fallidos: 0 };
  return fuente.guardarDeDrive(archivos);
}
