import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ArmazonReal } from "@/components/panel/ArmazonReal";
import { esIdAgente, type IdAgente } from "@/lib/agentes";
import { limpiarAjustes } from "@/lib/ajustes";
import { ORGANIZACION_VACIA, limpiarOrganizacion } from "@/lib/organizacion-chats";
import { leerUso } from "@/lib/uso";
import { cargarCuenta } from "@/lib/cuenta";
import { cargarPendientes, opcionesPendientes } from "@/lib/pendientes";
import { createClient } from "@/lib/supabase/server";
import type { ChatMenu } from "@/components/panel/Armazon";

/**
 * El armazón del panel nuevo (menú de 288px con Fijados y Recientes, y el
 * pie con tu cuenta) con los datos reales de la cuenta. Se queda puesto al
 * moverse entre el Inicio (que es un chat nuevo), las conversaciones y las
 * secciones. Solo lee: plan, equipo, las conversaciones y los pendientes
 * (src/lib/pendientes.ts, contados igual en todas partes). RLS deja ver a
 * cada quien solo lo suyo.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya redirige a /entrar sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];
  const conGoogle = proveedores.includes("google");
  const cuenta = await cargarCuenta(supabase, user.id);
  // El uso del plan (sesión de 5 horas y semana), para Ajustes > Uso
  const uso = await leerUso(supabase, user.id, cuenta.plan);

  const [{ data: convs }, pendientes, { data: filaAjustes }, { data: conexiones }, { data: contactos }, { count: porRevisarOficina }, { count: revisionNueva }] = await Promise.all([
    supabase
      .from("conversaciones")
      .select("id, agente, titulo, tema, participantes, actualizado_en")
      .eq("owner_id", user.id)
      .order("actualizado_en", { ascending: false })
      .limit(40),
    // Las mismas 5 filas que pide el Inicio: la lectura se comparte (cache)
    cargarPendientes(user.id, opcionesPendientes(cuenta.plan.id, conGoogle, cuenta.activos), 5),
    // Ajustes > lo que eligió (si la tabla aún no existe, quedan los de fábrica)
    supabase.from("ajustes_cuenta").select("datos").eq("owner_id", user.id).maybeSingle(),
    // Ajustes > Conexiones: qué apps están conectadas (sin tokens)
    supabase.from("conexiones").select("apps, estado").eq("owner_id", user.id),
    // Ajustes > Equipo: las personas del negocio y su WhatsApp (migración 0009)
    supabase.from("equipo_contactos").select("id, nombre, rol, whatsapp").eq("owner_id", user.id).order("creado_en"),
    // La Oficina: los archivos que tu equipo te dejó y siguen por revisar (migración 0014)
    supabase.from("archivos").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("revision", "revisar"),
    // La revisión diaria que todavía no ves y que encontró algo (migración 0015)
    supabase.from("revisiones").select("id", { count: "exact", head: true }).eq("owner_id", user.id).is("leido_en", null).gt("faltan", 0),
  ]);
  const conectadas = (conexiones ?? []).filter((c) => c.estado === "activa").flatMap((c) => (Array.isArray(c.apps) ? (c.apps as string[]) : []));

  // Las conversaciones y cómo las acomodó (fijadas, archivadas, grupos). Si nunca ha
  // acomodado nada, los grupos con nombre empiezan fijados (como antes)
  const chats: ChatMenu[] = [];
  const conNombre: string[] = [];
  for (const c of convs ?? []) {
    const id = String(c.id);
    const agente = esIdAgente(c.agente) ? c.agente : null;
    const grupo = ((c.participantes as unknown[] | null) ?? []).filter(esIdAgente) as IdAgente[];
    const agentes = grupo.length >= 2 ? grupo : agente ? [agente] : [];
    if (!agentes.length) continue;
    const titulo = ((c.tema as string | null) || (c.titulo as string | null) || "Conversación").replace(/\s+/g, " ").trim();
    chats.push({ id, titulo, href: `/panel?c=${encodeURIComponent(id)}`, agentes, campo: c.tema ? "tema" : "titulo" });
    if (grupo.length >= 2 && c.tema) conNombre.push(id);
  }
  const datosGuardados = filaAjustes?.datos && typeof filaAjustes.datos === "object" ? (filaAjustes.datos as Record<string, unknown>) : {};
  const organizacion = "organizacion" in datosGuardados ? limpiarOrganizacion(datosGuardados.organizacion) : { ...ORGANIZACION_VACIA, fijadas: conNombre };

  const meta = user.user_metadata ?? {};
  const completo = (meta.full_name as string | undefined) || (meta.name as string | undefined) || user.email || "Tu cuenta";
  const nombre = completo.includes("@") ? completo.split("@")[0] : completo.split(" ")[0];

  return (
    <ArmazonReal
      datos={{
        nombre,
        userId: user.id,
        nombreCompleto: completo.includes("@") ? nombre : completo,
        negocio: cuenta.negocio,
        planId: cuenta.plan.id,
        planAgentes: [...cuenta.plan.agentes],
        conectadas,
        contactos: (contactos ?? []).map((c) => ({ id: String(c.id), nombre: String(c.nombre), rol: String(c.rol ?? ""), whatsapp: String(c.whatsapp) })),
        ajustes: limpiarAjustes(filaAjustes?.datos),
        correo: user.email ?? "",
        plan: cuenta.plan.nombre.replace(/^Atendel\s+/, ""),
        uso,
        gmail: conGoogle,
        activos: cuenta.activos,
        pendientes: pendientes.total,
        oficina: (porRevisarOficina ?? 0) + Math.min(1, revisionNueva ?? 0) || null,
        chats,
        organizacion,
      }}
    >
      {children}
    </ArmazonReal>
  );
}
