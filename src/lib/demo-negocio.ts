import type { CampoPerfil } from "./nucleo-tipos";
import type { ContactoEquipo } from "./equipo";
import { DEMO_CITAS, DEMO_CORREOS, DEMO_NEGOCIO } from "./demo-dashboard";

/**
 * El negocio de ejemplo de /pruebalo (Estudio Luna): lo que ve la persona en
 * la demostración y lo que sabe la IA de la demostración. Todo es de ejemplo.
 */

export const PERFIL_DEMO: Partial<Record<CampoPerfil, string>> = {
  a_que_se_dedica: "Atendemos con cita a clientes de la zona; también vendemos productos en el local.",
  servicios_y_precios: "Servicio básico · $350\nServicio completo · $600\nPaquete del mes · $1,200",
  horarios: "Lunes a viernes de 10:00 a 19:00\nSábado de 10:00 a 15:00",
  ubicacion: "Calle Ejemplo 123, Col. Centro",
  formas_de_pago: "Efectivo, transferencia y tarjeta",
};

/** El equipo de ejemplo (Ajustes > Equipo): números de prueba, no son de nadie. */
export const EQUIPO_DEMO: ContactoEquipo[] = [
  { id: "demo-luis", nombre: "Luis", rol: "Recepción", whatsapp: "+525500000001" },
  { id: "demo-sofia", nombre: "Sofía", rol: "Encargada", whatsapp: "+525500000002" },
];

/** Los datos de ejemplo, como bloques para la IA de la demostración. */
export function datosDemoParaIA(): string {
  const perfil = Object.entries(PERFIL_DEMO)
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
    .join("\n");
  const citas = DEMO_CITAS.map((c) => `- ${c.hora} · ${c.paciente} · ${c.servicio} · ${c.estado.texto}`).join("\n");
  const equipo = EQUIPO_DEMO.map((c) => `- ${c.nombre} (${c.rol})`).join("\n");
  return `<perfil_del_negocio>\nnombre: ${DEMO_NEGOCIO.nombre}\nciudad: ${DEMO_NEGOCIO.ciudad}\n${perfil}\n</perfil_del_negocio>\n\n<agenda_de_manana>\n${citas}\n</agenda_de_manana>\n\n<equipo_del_negocio>\n${equipo}\n</equipo_del_negocio>`;
}

/** Los correos de ejemplo, como los resúmenes que lee Clara. */
export function correosDemoParaIA(): string {
  return `<correos_recientes>\n${DEMO_CORREOS.map((c) => `- De: ${c.remitente} · Asunto: ${c.asunto} · Resumen: ${c.resumen}${c.accion ? ` · Acción sugerida: ${c.accion}` : ""} · Prioridad: ${c.prioridad}`).join("\n")}\n</correos_recientes>`;
}
