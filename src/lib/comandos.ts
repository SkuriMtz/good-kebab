import type { IdAgente } from "./agentes";

/**
 * Acciones rápidas del chat (menú "/"). El texto se manda tal cual y cada
 * agente sabe qué significa (ver agentes-prompts.ts).
 */
export type Comando = {
  key: string;
  name: string;
  description: string;
  agente: IdAgente;
  /** Qué debe hacer el agente cuando el mensaje usa esta acción. */
  instruccion: string;
};

export const COMANDOS: Comando[] = [
  {
    key: "agendar",
    name: "/agendar",
    description: "Agenda una cita",
    agente: "lola",
    instruccion: "ayuda a agendar una cita: pide lo que falte (quién, servicio, día) y deja listo el mensaje de confirmación para el cliente.",
  },
  {
    key: "confirmar",
    name: "/confirmar",
    description: "Confirma las citas de mañana",
    agente: "lola",
    instruccion: "escribe el mensaje de confirmación y recordatorio de citas para mandar por WhatsApp.",
  },
  {
    key: "resumir-correos",
    name: "/resumir-correos",
    description: "Lo importante del correo de hoy",
    agente: "clara",
    instruccion: "resume los correos que te peguen, ordénalos por urgencia y sugiere qué contestar a cada uno.",
  },
  {
    key: "facturas",
    name: "/facturas",
    description: "Facturas y pagos del mes",
    agente: "clara",
    instruccion: "encuentra en lo que te peguen facturas, cobros y pagos, con monto y fecha límite, en una tabla.",
  },
  {
    key: "seguimiento",
    name: "/seguimiento",
    description: "Escribe a quien preguntó y no agendó",
    agente: "victor",
    instruccion: "escribe un mensaje de seguimiento personal para quien preguntó y no agendó, sin presionar.",
  },
  {
    key: "reactivar",
    name: "/reactivar",
    description: "Trae de regreso a clientes inactivos",
    agente: "victor",
    instruccion: "propón un mensaje y un plan corto para que regresen clientes que dejaron de venir.",
  },
  {
    key: "reporte",
    name: "/reporte",
    description: "Reporte del mes: citas y clientes",
    agente: "iris",
    instruccion: "arma una tabla de reporte mensual (citas, clientes nuevos, faltas) con los datos que te den, o la plantilla si no hay datos.",
  },
  {
    key: "investigar",
    name: "/investigar",
    description: "Compara precios o proveedores",
    agente: "iris",
    instruccion: "investiga y compara opciones en una tabla, aclarando qué datos conviene verificar.",
  },
];

export const comandosDe = (agentes: readonly IdAgente[]) => COMANDOS.filter((c) => agentes.includes(c.agente));
