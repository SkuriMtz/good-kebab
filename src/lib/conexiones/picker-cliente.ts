"use client";

import type { Documento } from "@/lib/nucleo-tipos";
import { RUTAS } from "@/lib/nucleo-tipos";

/**
 * GOOGLE PICKER EN EL NAVEGADOR (para la interfaz: Tu negocio → Documentos
 * o Apps → Google Drive → "Elegir de Drive").
 *
 *   const docs = await elegirDeDrive();   // abre el Picker y guarda lo elegido
 *
 * 1. Carga https://apis.google.com/js/api.js y el módulo "picker".
 * 2. Pide a /api/conexiones/google/token-picker un token de vida corta solo
 *    con drive.file (el token completo nunca llega al navegador).
 * 3. Abre el Picker con NEXT_PUBLIC_GOOGLE_API_KEY y NEXT_PUBLIC_GOOGLE_APP_ID
 *    (el App ID amarra lo elegido a la app: con drive.file, Google solo deja
 *    abrir esos archivos).
 * 4. Manda lo elegido a POST /api/conexiones/google/picker, que los vuelve
 *    Documentos. Regresa esos Documentos ([] si la persona canceló).
 * Lanza Error con un mensaje para la persona si algo falla.
 */

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "";
const APP_ID = process.env.NEXT_PUBLIC_GOOGLE_APP_ID ?? "";
const SCRIPT = "https://apis.google.com/js/api.js";

/** Lo mínimo de gapi y google.picker que se usa (sin depender de sus tipos). */
type Gapi = { load(modulo: string, opciones: { callback: () => void; onerror: () => void }): void };
type Doc = { id: string; name?: string; mimeType?: string };
type RespuestaPicker = { action: string; docs?: Doc[] };
type Picker = {
  DocsView: new (vista?: unknown) => { setIncludeFolders(v: boolean): unknown; setSelectFolderEnabled(v: boolean): unknown; setMimeTypes(t: string): unknown };
  ViewId: { DOCS: unknown };
  Feature: { MULTISELECT_ENABLED: unknown };
  Action: { PICKED: string; CANCEL: string };
  PickerBuilder: new () => PickerBuilder;
};
type PickerBuilder = {
  addView(v: unknown): PickerBuilder;
  enableFeature(f: unknown): PickerBuilder;
  setOAuthToken(t: string): PickerBuilder;
  setDeveloperKey(k: string): PickerBuilder;
  setAppId(id: string): PickerBuilder;
  setLocale(l: string): PickerBuilder;
  setTitle(t: string): PickerBuilder;
  setCallback(f: (r: RespuestaPicker) => void): PickerBuilder;
  build(): { setVisible(v: boolean): void };
};
type Ventana = Window & { gapi?: Gapi; google?: { picker?: Picker } };

/** Tipos que Atendel sabe leer. */
const TIPOS = [
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.google-apps.presentation",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
].join(",");

export const pickerDisponible = () => Boolean(API_KEY && APP_ID);

let cargando: Promise<Picker> | null = null;
function cargarPicker(): Promise<Picker> {
  const w = window as Ventana;
  if (w.google?.picker) return Promise.resolve(w.google.picker);
  cargando ??= new Promise<Picker>((resolver, rechazar) => {
    const listo = () =>
      (w.gapi as Gapi).load("picker", {
        callback: () => (w.google?.picker ? resolver(w.google.picker) : rechazar(new Error("No se pudo abrir Google Drive."))),
        onerror: () => rechazar(new Error("No se pudo abrir Google Drive.")),
      });
    if (w.gapi) return listo();
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = listo;
    s.onerror = () => {
      cargando = null;
      rechazar(new Error("No se pudo cargar Google Drive. Revisa tu conexión."));
    };
    document.head.appendChild(s);
  });
  return cargando;
}

async function tokenPicker(): Promise<string> {
  const r = await fetch("/api/conexiones/google/token-picker", { cache: "no-store" });
  const d = (await r.json().catch(() => ({}))) as { token?: string; error?: string };
  if (!r.ok || !d.token) throw new Error(d.error ?? "No se pudo abrir Google Drive.");
  return d.token;
}

/** Abre el Picker; resuelve con lo elegido ([] si cancela). */
export async function abrirPicker(): Promise<{ id: string; nombre: string; mime: string }[]> {
  if (!pickerDisponible()) throw new Error("Falta configurar el selector de Google Drive en Atendel.");
  const [picker, token] = await Promise.all([cargarPicker(), tokenPicker()]);
  return new Promise((resolver) => {
    const vista = new picker.DocsView(picker.ViewId.DOCS);
    vista.setIncludeFolders(true);
    vista.setSelectFolderEnabled(false);
    vista.setMimeTypes(TIPOS);
    new picker.PickerBuilder()
      .addView(vista)
      .enableFeature(picker.Feature.MULTISELECT_ENABLED)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setAppId(APP_ID)
      .setLocale("es")
      .setTitle("Elige archivos para Atendel")
      .setCallback((r) => {
        if (r.action === picker.Action.PICKED) resolver((r.docs ?? []).map((d) => ({ id: d.id, nombre: d.name ?? "", mime: d.mimeType ?? "" })));
        else if (r.action === picker.Action.CANCEL) resolver([]);
      })
      .build()
      .setVisible(true);
  });
}

/** Abre el Picker y vuelve Documentos lo elegido. */
export async function elegirDeDrive(): Promise<Documento[]> {
  const archivos = await abrirPicker();
  if (!archivos.length) return [];
  const r = await fetch(RUTAS.drivePicker, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ archivos }),
  });
  const d = (await r.json().catch(() => null)) as Documento[] | { error?: string } | null;
  if (!r.ok || !Array.isArray(d)) throw new Error((d && !Array.isArray(d) && d.error) || "No se pudieron guardar los archivos de Drive.");
  return d;
}
