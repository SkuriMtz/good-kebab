import { armarTablero, type DatosTablero } from "./tablero";

/*
 * El Tablero de la demo (/pruebalo?vista=tablero): Estudio Luna, con datos de
 * ejemplo (la demo dice que son de ejemplo y que nada se guarda).
 */
export function tableroDeEjemplo(): DatosTablero {
  return armarTablero({
    base: "/pruebalo",
    teNecesita: [
      { id: "1", titulo: "Mariana pidió cambiar su cita del jueves", detalle: "Aura dejó lista la respuesta con dos horarios libres. Falta tu OK.", href: "/pruebalo?vista=pendientes" },
      { id: "2", titulo: "Contestar a Grupo Sierra: cotización de 12 sesiones", detalle: "Altair preparó la respuesta con tu lista de precios.", href: "/pruebalo?vista=pendientes" },
      { id: "f-1", titulo: "Presentación de servicios 2027", detalle: "Para revisar y aprobar", href: "/pruebalo?vista=oficina" },
      { id: "t-1", titulo: "Borradores de respuesta para 3 clientes", detalle: "Lo hizo por su cuenta. Espera tu revisión", href: "/pruebalo?vista=oficina" },
    ],
    totalTeNecesita: 8,
    totalOk: 2,
    totalOficina: 6,
    viene: [
      { id: "v1", titulo: "Recordatorio de citas de mañana", cuando: "Hoy a las 19:00" },
      { id: "v2", titulo: "Informe de la semana", cuando: "Lunes a las 9:00" },
    ],
    hecho: [
      { id: "h1", titulo: "Confirmé 4 citas de mañana por WhatsApp", hace: "hace 20 min" },
      { id: "h2", titulo: "Resumí 9 correos nuevos", hace: "hace 1 h" },
      { id: "h3", titulo: "Mandé la factura de octubre a Lucía Ramos", hace: "ayer" },
    ],
    whatsapp: {
      semana: 48,
      antes: 43,
      serie: [5, 7, 6, 4, 9, 8, 9],
      esperan: 1,
      ultimos: [
        { id: "w1", texto: "Ana: ¿Tienen lugar el sábado?", hora: "hace 8 min" },
        { id: "w2", texto: "Luis: Gracias, ahí nos vemos", hora: "hace 40 min" },
        { id: "w3", texto: "Carmen: ¿Cuánto cuesta el paquete?", hora: "hace 2 h" },
      ],
    },
    correo: {
      semana: 23,
      antes: 27,
      serie: [4, 3, 5, 2, 4, 3, 2],
      conAccion: 3,
      ultimos: [
        { id: "c1", texto: "Grupo Sierra: Cotización", hora: "hace 1 h" },
        { id: "c2", texto: "Banco: Estado de cuenta", hora: "hace 3 h" },
      ],
    },
    clientes: { semana: 31, antes: 26, nuevos: 7, serie: [3, 5, 4, 3, 6, 5, 5] },
    respuestas: { semana: 64, antes: 58, serie: [8, 10, 9, 7, 11, 9, 10] },
    citas: { semana: 18, antes: 15, serie: [2, 3, 3, 1, 4, 3, 2] },
    apps: [
      { id: "g", nombre: "Google", cuenta: "hola@estudioluna.mx", logo: "/apps/gmail.svg", apps: ["Gmail", "Google Calendar", "Google Drive"], estado: "activa" },
      { id: "m", nombre: "Microsoft", cuenta: "admin@estudioluna.mx", logo: "/apps/outlook.png", apps: ["Outlook", "Calendario de Outlook"], estado: "error" },
      { id: "s", nombre: "Stripe", cuenta: "Estudio Luna", logo: "/apps/stripe.svg", apps: ["Stripe"], estado: "activa" },
    ],
    uso: { semanaPct: 43, trabajoPct: 21 },
  });
}
