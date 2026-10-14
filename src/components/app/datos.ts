import "server-only";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { esIdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";
import type { Usuario } from "@/components/dashboard/tipos";

/**
 * Lo que necesitan el armazón del panel (layout) y sus páginas, leído UNA
 * vez por visita: `cache` de React reparte el mismo resultado entre el
 * layout y la página. Son las mismas consultas que ya usaba el panel (RLS
 * garantiza que cada quien solo ve lo suyo); aquí no se escribe nada.
 */

export type ConversacionPanel = {
  id: string;
  agente: string;
  titulo: string;
  actualizado_en: string;
  participantes?: string[] | null;
  tema?: string | null;
};

export type ResumenGuardado = {
  id: string;
  remitente: string | null;
  asunto: string | null;
  resumen: string;
  accion_sugerida: string | null;
  creado_en: string;
};

export const sesion = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});

export const cuentaDe = cache(async (userId: string) => {
  const { supabase } = await sesion();
  return cargarCuenta(supabase, userId);
});

export const conversacionesDe = cache(async (userId: string) => {
  const { supabase } = await sesion();
  const { data } = await supabase
    .from("conversaciones")
    .select("id, agente, titulo, actualizado_en, participantes, tema")
    .eq("owner_id", userId)
    .order("actualizado_en", { ascending: false })
    .limit(60);
  return ((data ?? []) as ConversacionPanel[]).filter((c) => esIdAgente(c.agente));
});

export const resumenesCorreo = cache(async () => {
  const { supabase } = await sesion();
  const { data } = await supabase
    .from("resumenes_correo")
    .select("id, remitente, asunto, resumen, accion_sugerida, creado_en")
    .order("creado_en", { ascending: false })
    .limit(30);
  return (data ?? []) as ResumenGuardado[];
});

/** Respuestas de los agentes en los últimos 7 días (solo la fecha de cada una), para la gráfica de la semana. */
export const respuestasRecientes = cache(async () => {
  const { supabase } = await sesion();
  const desde = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data, error } = await supabase.from("mensajes").select("creado_en").eq("rol", "assistant").gte("creado_en", desde).limit(5000);
  if (error) return null;
  return (data ?? []).map((m) => m.creado_en as string);
});

/** Nombre, correo y foto de la persona (Google trae nombre y foto; con enlace mágico, solo el correo). */
export function usuarioDe(user: User): Usuario {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const nombre = typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : "";
  const foto = typeof meta.avatar_url === "string" ? meta.avatar_url : typeof meta.picture === "string" ? meta.picture : null;
  return { nombre: nombre.trim(), correo: user.email ?? "", foto };
}
