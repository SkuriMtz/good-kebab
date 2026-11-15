/**
 * El cerebro de ejemplo de /pruebalo (Estudio Luna): Reglas, Procesos y
 * Memoria. Lo usan la pestaña de Tu negocio y el chat de la demostración.
 */
export type TipoReglaDemo = "precio" | "politica" | "dato" | "nunca";

export const DEMO_REGLAS: { id: string; tipo: TipoReglaDemo; texto: string }[] = [
  { id: "r1", tipo: "precio", texto: "Primera visita: $650 MXN" },
  { id: "r2", tipo: "precio", texto: "Sesión de 1 hora: $900 MXN" },
  { id: "r3", tipo: "politica", texto: "Cancelaciones con 24 horas de anticipación; si no, se cobra el 50 %." },
  { id: "r4", tipo: "dato", texto: "Abrimos de lunes a sábado, de 9:00 a 19:00." },
  { id: "r5", tipo: "nunca", texto: "Nunca ofrecer descuentos de más del 10 %." },
];
export const DEMO_PROCESOS: { id: string; titulo: string; cuando: string; pasos: string; activo: boolean }[] = [
  { id: "p1", titulo: "Agendar una cita", cuando: "Cuando alguien pide cita por WhatsApp", pasos: "1. Ofrece 2 horarios libres.\n2. Confirma día, hora y servicio.\n3. Manda la ubicación.\n4. Un día antes, recuérdale la cita.", activo: true },
  { id: "p2", titulo: "Después de la primera visita", cuando: "Al día siguiente de la primera cita de un cliente", pasos: "1. Pregúntale cómo le fue.\n2. Si le gustó, pídele una reseña en Google.\n3. En 4 semanas, recuérdale agendar la siguiente.", activo: true },
];
export const DEMO_MEMORIA: { id: string; texto: string; fuente: "dueño" | "chat" | "trabajo"; creado_en: string }[] = [
  { id: "m1", texto: "Ana prefiere mensajes cortos y sin emojis.", fuente: "chat", creado_en: "2026-11-10T16:00:00Z" },
  { id: "m2", texto: "Limpieza Brillo factura el día 15 de cada mes.", fuente: "chat", creado_en: "2026-11-08T15:00:00Z" },
  { id: "m3", texto: "Sofía Ramírez viene los viernes por la mañana.", fuente: "dueño", creado_en: "2026-11-05T18:00:00Z" },
];

