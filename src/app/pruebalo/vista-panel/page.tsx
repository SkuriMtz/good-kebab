import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chat, type Conversacion } from "@/app/panel/chat/Chat";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vista de prueba del panel", robots: { index: false, follow: false } };

/*
 * Solo para revisar el diseño del chat real (/panel/chat) sin iniciar sesión.
 * Pinta el mismo componente <Chat> con datos de prueba; no existe salvo que
 * el servidor arranque con VISTA_PANEL=1 (en producción da 404). Los mensajes
 * y la respuesta de /api/chat los simula la herramienta de capturas.
 * Se puede borrar sin afectar nada.
 */
const hace = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

const CONVERSACIONES: Conversacion[] = [
  { id: "c1", agente: "lola", titulo: "Recordatorios de mañana", actualizado_en: hace(30), participantes: ["lola", "victor"], tema: "Recordatorios de mañana" },
  { id: "c2", agente: "clara", titulo: "Factura atrasada", actualizado_en: hace(90) },
  { id: "c3", agente: "lola", titulo: "Precios de limpieza facial", actualizado_en: hace(60 * 26) },
];

export default function VistaPanel({ searchParams }: { searchParams: { c?: string } }) {
  if (process.env.VISTA_PANEL !== "1") notFound();
  return (
    <Chat
      email="prueba@ejemplo.mx"
      planId="max"
      activos={["lola", "clara", "victor"]}
      usadosIniciales={212}
      conversacionesIniciales={CONVERSACIONES}
      agenteInicial="lola"
      conversacionInicial={searchParams.c ?? null}
    />
  );
}
