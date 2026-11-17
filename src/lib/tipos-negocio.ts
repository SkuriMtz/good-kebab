/**
 * Tipos de negocio para elegir de una lista (al crear la cuenta y en Tu
 * negocio). Agrupados para encontrarlos rápido. El id es corto y fijo (se
 * guarda en perfil_negocio.tipo); el nombre es lo que se ve.
 */

export type GrupoNegocio = { grupo: string; tipos: { id: string; nombre: string }[] };

export const TIPOS_NEGOCIO: GrupoNegocio[] = [
  {
    grupo: "Salud",
    tipos: [
      { id: "consultorio_medico", nombre: "Consultorio médico" },
      { id: "clinica", nombre: "Clínica" },
      { id: "dentista", nombre: "Consultorio dental" },
      { id: "psicologia", nombre: "Psicología y terapia" },
      { id: "nutricion", nombre: "Nutrición" },
      { id: "fisioterapia", nombre: "Fisioterapia y rehabilitación" },
      { id: "optica", nombre: "Óptica" },
      { id: "laboratorio", nombre: "Laboratorio clínico" },
      { id: "farmacia", nombre: "Farmacia" },
      { id: "pediatria", nombre: "Pediatría" },
      { id: "ginecologia", nombre: "Ginecología" },
      { id: "dermatologia", nombre: "Dermatología" },
      { id: "quiropractico", nombre: "Quiropráctico" },
      { id: "podologia", nombre: "Podología" },
      { id: "medicina_alternativa", nombre: "Medicina alternativa" },
    ],
  },
  {
    grupo: "Belleza y cuidado personal",
    tipos: [
      { id: "estetica", nombre: "Estética" },
      { id: "salon_belleza", nombre: "Salón de belleza" },
      { id: "barberia", nombre: "Barbería" },
      { id: "spa", nombre: "Spa" },
      { id: "unas", nombre: "Uñas" },
      { id: "pestanas_cejas", nombre: "Pestañas y cejas" },
      { id: "maquillaje", nombre: "Maquillaje" },
      { id: "depilacion", nombre: "Depilación" },
      { id: "tatuajes", nombre: "Tatuajes y perforaciones" },
      { id: "masajes", nombre: "Masajes" },
      { id: "cosmetologia", nombre: "Cosmetología" },
    ],
  },
  {
    grupo: "Deporte y bienestar",
    tipos: [
      { id: "gimnasio", nombre: "Gimnasio" },
      { id: "yoga_pilates", nombre: "Yoga y pilates" },
      { id: "entrenador", nombre: "Entrenador personal" },
      { id: "artes_marciales", nombre: "Artes marciales" },
      { id: "danza", nombre: "Escuela de danza" },
      { id: "natacion", nombre: "Natación" },
      { id: "club_deportivo", nombre: "Club deportivo" },
    ],
  },
  {
    grupo: "Comida y bebida",
    tipos: [
      { id: "restaurante", nombre: "Restaurante" },
      { id: "cafeteria", nombre: "Cafetería" },
      { id: "panaderia", nombre: "Panadería y pastelería" },
      { id: "comida_rapida", nombre: "Comida rápida" },
      { id: "taqueria", nombre: "Taquería" },
      { id: "bar", nombre: "Bar" },
      { id: "banquetes", nombre: "Banquetes y catering" },
      { id: "cocina_economica", nombre: "Cocina económica" },
      { id: "comida_domicilio", nombre: "Comida a domicilio" },
      { id: "heladeria", nombre: "Heladería" },
    ],
  },
  {
    grupo: "Tiendas y comercio",
    tipos: [
      { id: "tienda_ropa", nombre: "Ropa y calzado" },
      { id: "tienda_linea", nombre: "Tienda en línea" },
      { id: "abarrotes", nombre: "Abarrotes" },
      { id: "papeleria", nombre: "Papelería" },
      { id: "ferreteria", nombre: "Ferretería" },
      { id: "electronica", nombre: "Electrónica y celulares" },
      { id: "joyeria", nombre: "Joyería y accesorios" },
      { id: "floreria", nombre: "Florería" },
      { id: "muebleria", nombre: "Mueblería y decoración" },
      { id: "libreria", nombre: "Librería" },
      { id: "jugueteria", nombre: "Juguetería" },
      { id: "regalos", nombre: "Regalos y novedades" },
      { id: "cosmeticos", nombre: "Cosméticos y perfumería" },
      { id: "mayoreo", nombre: "Mayoreo y distribución" },
    ],
  },
  {
    grupo: "Servicios profesionales",
    tipos: [
      { id: "contabilidad", nombre: "Contabilidad" },
      { id: "abogados", nombre: "Despacho de abogados" },
      { id: "notaria", nombre: "Notaría" },
      { id: "consultoria", nombre: "Consultoría" },
      { id: "arquitectura", nombre: "Arquitectura" },
      { id: "ingenieria", nombre: "Ingeniería" },
      { id: "marketing", nombre: "Marketing y publicidad" },
      { id: "diseno", nombre: "Diseño" },
      { id: "fotografia", nombre: "Fotografía y video" },
      { id: "desarrollo_software", nombre: "Desarrollo de software" },
      { id: "recursos_humanos", nombre: "Recursos humanos" },
      { id: "traduccion", nombre: "Traducción" },
      { id: "seguros", nombre: "Seguros" },
      { id: "bienes_raices", nombre: "Bienes raíces" },
      { id: "agencia_viajes", nombre: "Agencia de viajes" },
    ],
  },
  {
    grupo: "Educación",
    tipos: [
      { id: "escuela", nombre: "Escuela o colegio" },
      { id: "guarderia", nombre: "Guardería" },
      { id: "idiomas", nombre: "Escuela de idiomas" },
      { id: "regularizacion", nombre: "Clases y regularización" },
      { id: "musica", nombre: "Escuela de música" },
      { id: "cursos", nombre: "Cursos y talleres" },
      { id: "autoescuela", nombre: "Escuela de manejo" },
    ],
  },
  {
    grupo: "Hogar y oficios",
    tipos: [
      { id: "limpieza", nombre: "Limpieza" },
      { id: "plomeria", nombre: "Plomería" },
      { id: "electricista", nombre: "Electricista" },
      { id: "carpinteria", nombre: "Carpintería" },
      { id: "jardineria", nombre: "Jardinería" },
      { id: "fumigacion", nombre: "Fumigación" },
      { id: "remodelacion", nombre: "Remodelación y construcción" },
      { id: "mudanzas", nombre: "Mudanzas" },
      { id: "lavanderia", nombre: "Lavandería y tintorería" },
      { id: "cerrajeria", nombre: "Cerrajería" },
      { id: "reparacion", nombre: "Reparación de aparatos" },
      { id: "costura", nombre: "Costura y sastrería" },
    ],
  },
  {
    grupo: "Autos y transporte",
    tipos: [
      { id: "taller", nombre: "Taller mecánico" },
      { id: "autolavado", nombre: "Autolavado" },
      { id: "refacciones", nombre: "Refacciones" },
      { id: "agencia_autos", nombre: "Venta de autos" },
      { id: "llantera", nombre: "Llantera" },
      { id: "transporte", nombre: "Transporte y fletes" },
      { id: "mensajeria", nombre: "Mensajería y paquetería" },
    ],
  },
  {
    grupo: "Mascotas",
    tipos: [
      { id: "veterinaria", nombre: "Veterinaria" },
      { id: "estetica_canina", nombre: "Estética canina" },
      { id: "tienda_mascotas", nombre: "Tienda de mascotas" },
      { id: "pension_mascotas", nombre: "Pensión y adiestramiento" },
    ],
  },
  {
    grupo: "Eventos y turismo",
    tipos: [
      { id: "eventos", nombre: "Organización de eventos" },
      { id: "salon_eventos", nombre: "Salón de eventos" },
      { id: "renta_mobiliario", nombre: "Renta de mobiliario" },
      { id: "hotel", nombre: "Hotel u hospedaje" },
      { id: "tours", nombre: "Tours y experiencias" },
      { id: "musica_eventos", nombre: "Música y DJ" },
    ],
  },
  {
    grupo: "Otros",
    tipos: [
      { id: "inmobiliaria", nombre: "Inmobiliaria y administración" },
      { id: "coworking", nombre: "Coworking y oficinas" },
      { id: "imprenta", nombre: "Imprenta" },
      { id: "asociacion", nombre: "Asociación u ONG" },
      { id: "iglesia", nombre: "Iglesia o comunidad" },
      { id: "agricultura", nombre: "Agricultura y ganadería" },
      { id: "manufactura", nombre: "Manufactura y taller" },
      { id: "otro", nombre: "Otro" },
    ],
  },
];

const POR_ID = new Map(TIPOS_NEGOCIO.flatMap((g) => g.tipos.map((t) => [t.id, t.nombre] as const)));

/** ¿Es un tipo de la lista? */
export const esTipoNegocio = (v: unknown): v is string => typeof v === "string" && POR_ID.has(v);

/** El nombre que se ve (o "" si no está en la lista). */
export const nombreTipoNegocio = (id: string | null | undefined) => (id ? (POR_ID.get(id) ?? "") : "");
