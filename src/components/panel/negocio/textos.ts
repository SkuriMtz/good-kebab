import type { NombreIcono } from "@/components/base/Iconos";
import type { CampoPerfil, CategoriaApp, EstadoDocumento, PerfilNegocio, TipoDocumento } from "@/lib/nucleo-tipos";
import { CAMPOS_PERFIL } from "@/lib/nucleo-tipos";

/* =====================================================================
   Los textos de "Tu negocio": cada campo del perfil con su etiqueta, una
   línea de ayuda y un ejemplo neutro (sin nombrar tipos de negocio).
   ===================================================================== */

export const INFO_CAMPO: Record<CampoPerfil, { etiqueta: string; ayuda: string; ejemplo: string }> = {
  a_que_se_dedica: {
    etiqueta: "A qué se dedica",
    ayuda: "Qué ofreces, a quién y qué te hace distinto, en dos o tres líneas.",
    ejemplo: "Ej.: Atendemos con cita a personas de la zona. Nos distinguen la puntualidad y el trato.",
  },
  servicios_y_precios: {
    etiqueta: "Servicios y precios",
    ayuda: "Uno por línea, con su precio y cuánto dura.",
    ejemplo: "Ej.: Servicio básico, 45 min, $450\nPaquete de 4 visitas, $1,600",
  },
  horarios: {
    etiqueta: "Horarios",
    ayuda: "Los días y las horas en que atiendes, y cuándo cierras.",
    ejemplo: "Ej.: Lunes a viernes de 10:00 a 19:00. Sábados de 9:00 a 14:00. Domingos cerrado.",
  },
  ubicacion: {
    etiqueta: "Dónde estás",
    ayuda: "La dirección, cómo llegar y si hay dónde estacionarse.",
    ejemplo: "Ej.: Av. Principal 123, local 4, col. Centro. Hay estacionamiento en la esquina.",
  },
  formas_de_pago: {
    etiqueta: "Formas de pago",
    ayuda: "Lo que aceptas y si pides un anticipo.",
    ejemplo: "Ej.: Efectivo, tarjeta y transferencia. Anticipo del 30 % para apartar.",
  },
  politicas: {
    etiqueta: "Políticas",
    ayuda: "Cancelaciones, retrasos, reembolsos y lo que tus clientes deben saber.",
    ejemplo: "Ej.: Puedes cancelar sin costo hasta 24 horas antes. Con más de 15 minutos de retraso, se cambia la hora.",
  },
  tono: {
    etiqueta: "Cómo le hablas a tus clientes",
    ayuda: "El tono de tu equipo: de tú o de usted, formal o cercano.",
    ejemplo: "Ej.: De tú, cercano y breve. Sin emojis en los correos.",
  },
  preguntas_frecuentes: {
    etiqueta: "Lo que más te preguntan",
    ayuda: "Cada pregunta con tu respuesta, una por línea.",
    ejemplo: "Ej.: ¿Atienden sin cita? Solo si hay espacio; mejor aparta por WhatsApp.",
  },
  algo_mas: {
    etiqueta: "Algo más",
    ayuda: "Lo que tu equipo debe saber y no cupo arriba.",
    ejemplo: "Ej.: En diciembre cerramos del 24 al 2 de enero.",
  },
};

/** Los campos con algo escrito. */
export const camposLlenos = (p: Partial<Record<CampoPerfil, string>> | null | undefined) => CAMPOS_PERFIL.filter((c) => (p?.[c] ?? "").trim().length > 0).length;

/** Del 0 al 100: qué tanto conoce tu equipo tu negocio. */
export const porcentajePerfil = (p: PerfilNegocio | null | undefined) => Math.round((camposLlenos(p) / CAMPOS_PERFIL.length) * 100);

/* ---------- Documentos ---------- */

export const TIPO_DOCUMENTO: Record<TipoDocumento, { etiqueta: string; icono: NombreIcono }> = {
  pdf: { etiqueta: "PDF", icono: "documento" },
  docx: { etiqueta: "DOCX", icono: "documento" },
  txt: { etiqueta: "TXT", icono: "documento" },
  md: { etiqueta: "MD", icono: "documento" },
  link: { etiqueta: "Link", icono: "enlace" },
  drive: { etiqueta: "Drive", icono: "documento" },
  notion: { etiqueta: "Notion", icono: "documento" },
};

export const ESTADO_DOCUMENTO: Record<EstadoDocumento, { etiqueta: string; tono: "neutro" | "exito" | "error" }> = {
  procesando: { etiqueta: "Leyendo", tono: "neutro" },
  listo: { etiqueta: "Listo", tono: "exito" },
  error: { etiqueta: "No se pudo leer", tono: "error" },
};

/* ---------- Apps conectadas ---------- */

/** El orden y el nombre de cada categoría, y su ícono genérico (sin logos de marcas). */
export const CATEGORIAS_APP: { id: CategoriaApp; etiqueta: string; icono: NombreIcono }[] = [
  { id: "correo", etiqueta: "Correo", icono: "correo" },
  { id: "agenda", etiqueta: "Agenda", icono: "calendario" },
  { id: "reservas", etiqueta: "Reservas y citas", icono: "calendario" },
  { id: "documentos", etiqueta: "Documentos y hojas", icono: "documento" },
  { id: "mensajes", etiqueta: "Mensajes", icono: "mensaje" },
  { id: "clientes", etiqueta: "Clientes", icono: "clientes" },
  { id: "pagos", etiqueta: "Pagos y ventas", icono: "facturacion" },
  { id: "resenas", etiqueta: "Reseñas", icono: "estrella" },
  { id: "facturacion", etiqueta: "Facturación", icono: "documento" },
  { id: "contabilidad", etiqueta: "Contabilidad", icono: "facturacion" },
];
