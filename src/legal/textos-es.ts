import type { DatosLegales } from "@/lib/legal";

/**
 * Aviso de privacidad y términos de uso de Atendel, en español (la versión
 * que manda). Escritos con lo que el sistema hace de verdad: qué guarda,
 * para qué, con quién lo comparte y cuánto tiempo. Si cambia algo de eso en
 * el código, se cambia aquí y se actualiza la fecha en src/lib/legal.ts.
 */

export type Seccion = { titulo: string; parrafos?: string[]; lista?: string[]; despues?: string[] };
export type Documento = { titulo: string; resumen: string; secciones: Seccion[]; /** Aviso al inicio (solo la traducción al inglés). */ nota?: string };

export function privacidadEs(d: DatosLegales): Documento {
  return {
    titulo: "Aviso de privacidad",
    resumen:
      "Qué datos guarda Atendel, para qué los usa, con quién los comparte y cómo puedes ver, corregir o borrar los tuyos. Sin letra chiquita: si algo no está aquí, no lo hacemos.",
    secciones: [
      {
        titulo: "Quién es responsable de tus datos",
        parrafos: [
          `${d.responsable}, con domicilio en ${d.domicilio}, es responsable del tratamiento de los datos personales que se recaban a través de Atendel (este sitio y su panel), conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y su normativa.`,
          `Para cualquier tema de este aviso escríbenos a ${d.correo}.`,
        ],
      },
      {
        titulo: "Qué datos guardamos",
        parrafos: ["Solo lo necesario para que Atendel funcione:"],
        lista: [
          "Tu cuenta: tu correo y, si entras con Google, tu nombre.",
          "Tu negocio: lo que escribes en tu perfil (a qué te dedicas, servicios y precios, horarios, ubicación, formas de pago, políticas y tono), tus Reglas, Procesos y Memoria, y los documentos que subes.",
          "Tus conversaciones con Atendel y lo que te deja para revisar (borradores, archivos, informes).",
          "Las apps que conectas (por ejemplo Gmail, Outlook, Google Calendar o WhatsApp): el permiso que nos das para usarlas se guarda cifrado (AES-256-GCM) y solo lo usa el servidor. De esas apps leemos lo necesario para lo que pides o para lo que dejaste que Atendel haga solo (correos nuevos, tu agenda, mensajes).",
          "Tus ajustes y preferencias (idioma, avisos, horarios), los aparatos donde activaste notificaciones y, si lo conectas, el número de WhatsApp donde quieres recibir avisos.",
          "Datos de uso y de seguridad: cuánto usas la IA (para los límites de tu plan) y una bitácora de actividad sospechosa. De tu conexión guardamos solo un resumen cifrado de la IP (un hash), nunca la IP.",
          "Si te anotas en la lista de espera o nos escribes por el formulario de contacto: tu correo y, si los das, tu nombre, tu negocio y tu mensaje.",
        ],
      },
      {
        titulo: "Datos de tus clientes",
        parrafos: [
          "Cuando conectas tu WhatsApp, tu correo o tu agenda, Atendel ve datos de tus clientes (nombres, teléfonos, correos, mensajes y citas). Esos datos son de tu negocio: tú eres el responsable frente a tus clientes y Atendel solo los trata por encargo tuyo, para atenderlos como tú lo configuras. Te toca avisarles cómo usas sus datos y, si hace falta, pedirles su consentimiento.",
          "Si tus clientes te mandan datos sensibles (por ejemplo, de salud), Atendel los trata solo para atender su mensaje y con las mismas protecciones. No los usamos para nada más.",
        ],
      },
      {
        titulo: "Para qué los usamos",
        parrafos: ["Finalidades necesarias para darte el servicio:"],
        lista: [
          "Crear tu cuenta y dejarte entrar sin contraseña (con un código a tu correo o con Google).",
          "Que Atendel conteste, ordene y haga lo que le pides o lo que permitiste que haga solo, con tus Reglas y tus datos.",
          "Avisarte de lo importante (en el panel, con notificaciones o por WhatsApp, según elijas).",
          "Contar tu uso para respetar los límites de tu plan.",
          "Cuidar la seguridad: detectar abusos, frenar intentos raros y proteger tu cuenta.",
        ],
        despues: [
          "Finalidad adicional: si te anotaste en la lista de espera, avisarte cuando Atendel esté disponible. Puedes pedir que dejemos de escribirte en cualquier momento.",
          "No vendemos tus datos, no los usamos para publicidad y no los compartimos para que otros te contacten.",
        ],
      },
      {
        titulo: "Con quién los compartimos",
        parrafos: [
          "Para funcionar, Atendel usa proveedores que tratan los datos por encargo nuestro y solo para darte el servicio. Algunos están en Estados Unidos, así que tus datos se guardan o pasan por allá:",
        ],
        lista: [
          "Supabase: base de datos, archivos e inicio de sesión (servidores en Estados Unidos).",
          "Vercel: donde vive el sitio y el panel.",
          "Anthropic: la inteligencia artificial que lee el texto necesario para contestar. Según sus términos para empresas, no usa estos datos para entrenar sus modelos.",
          "Meta (WhatsApp): para recibir y mandar mensajes de WhatsApp, si conectas tu número o activas los avisos por WhatsApp.",
          "Los servicios de notificaciones de tu navegador o teléfono (Google, Apple, Mozilla o Microsoft), si activas los avisos.",
        ],
        despues: [
          "Además, cuando tú conectas una app (Google, Microsoft, Shopify u otras), Atendel se comunica con ella para hacer lo que le pides. Lo que esa app haga con tus datos se rige por su propio aviso de privacidad.",
          "Solo compartiríamos datos con una autoridad si la ley nos obliga.",
        ],
      },
      {
        titulo: "Cuánto tiempo los guardamos",
        parrafos: [
          "Mientras tengas tu cuenta. Algunos registros técnicos se borran solos antes: por ejemplo, la marca de los correos ya revisados a los 14 días, los registros de fallas de apps a los 7 días y la bitácora de seguridad a los 90 días.",
          "Si borras tu cuenta, se borran tus datos y tus archivos. Puede quedar una copia en los respaldos de nuestros proveedores por un tiempo limitado, hasta que se reemplacen.",
        ],
      },
      {
        titulo: "Tus derechos (ARCO) y cómo ejercerlos",
        parrafos: [
          "Tienes derecho a conocer qué datos tenemos (Acceso), corregirlos (Rectificación), pedir que los borremos (Cancelación) y oponerte a algún uso (Oposición). También puedes revocar tu consentimiento o limitar el uso de tus datos.",
          "Lo más rápido, desde tu panel: exportar tus datos en un archivo o borrar tu cuenta con todo lo que tiene (Ajustes → Privacidad), y corregir tu perfil (Tu negocio).",
          `O escríbenos a ${d.correo} con tu nombre, el correo de tu cuenta y lo que pides. Te contestamos en un máximo de 20 días hábiles y, si procede, lo hacemos en los 15 días hábiles siguientes.`,
          "Si crees que no atendimos bien tu solicitud, puedes acudir a la autoridad de protección de datos personales.",
        ],
      },
      {
        titulo: "Cookies y almacenamiento del navegador",
        parrafos: [
          "Atendel usa solo lo necesario para funcionar; no usa cookies de publicidad ni de rastreo de terceros:",
        ],
        lista: [
          "La cookie de tu sesión (para que sigas dentro).",
          "Una cookie que recuerda el idioma que elegiste.",
          "Una cookie que identifica este aparato con un código al azar (guardamos solo su hash) para avisarte si alguien entra a tu cuenta desde otro lado.",
          "Una cookie temporal mientras conectas una app (dura 10 minutos).",
          "En el almacenamiento de tu navegador: tu tema (claro u oscuro) y cómo acomodaste el panel.",
        ],
        despues: ["Si las bloqueas en tu navegador, no podrás entrar al panel."],
      },
      {
        titulo: "Cómo cuidamos tus datos",
        lista: [
          "Todo viaja cifrado (HTTPS) y los permisos de tus apps se guardan cifrados.",
          "Cada cuenta solo puede ver lo suyo: la base de datos lo revisa en cada consulta.",
          "Lo que llega de fuera (correos, mensajes, páginas) se trata como dato, nunca como orden: nada que tenga que ver con dinero sale sin tu OK.",
          "Límites de intentos, bitácora de seguridad y revisiones automáticas en cada cambio del código.",
        ],
      },
      {
        titulo: "Menores de edad",
        parrafos: ["Atendel es para negocios y para personas mayores de 18 años. No recabamos a propósito datos de menores."],
      },
      {
        titulo: "Cambios a este aviso",
        parrafos: [
          "Si cambiamos algo importante, lo publicamos aquí con la nueva fecha y te avisamos en el panel o por correo antes de que aplique.",
        ],
      },
    ],
  };
}

export function terminosEs(d: DatosLegales): Documento {
  return {
    titulo: "Términos de uso",
    resumen: "Las reglas para usar Atendel: qué hace, qué te toca a ti y qué nos toca a nosotros.",
    secciones: [
      {
        titulo: "Quiénes somos",
        parrafos: [
          `Atendel es un servicio de ${d.responsable}, con domicilio en ${d.domicilio}. Al crear tu cuenta o usar Atendel aceptas estos términos. Si no estás de acuerdo, no lo uses.`,
        ],
      },
      {
        titulo: "Qué es Atendel",
        parrafos: [
          "Atendel es un asistente con inteligencia artificial para negocios: contesta tu WhatsApp y tu correo, acomoda tu agenda, prepara documentos y te avisa de lo importante, con tus Reglas y con las apps que conectes. Dentro trabajan cuatro especialistas (Aura, Altair, Rigel e Mira), pero tú solo le hablas a Atendel.",
        ],
      },
      {
        titulo: "Tu cuenta",
        lista: [
          "Entras con un código a tu correo o con Google; no hay contraseña. Cuida el acceso a tu correo: quien lo tenga puede entrar a tu cuenta.",
          "La cuenta es para un negocio y la maneja una persona mayor de 18 años con facultad para usarla.",
          "Puedes cerrar sesión en todos tus aparatos y borrar tu cuenta cuando quieras desde Ajustes.",
        ],
      },
      {
        titulo: "Planes y precios",
        parrafos: [
          "Los planes y lo que incluye cada uno están en la página de Precios. El plan Free no cuesta. Hoy Atendel no cobra nada: si un plan llega a tener costo, el precio se publicará antes y solo se cobrará si tú lo aceptas. Podrás cancelar cuando quieras.",
          "Cada plan tiene límites de uso de la IA por semana. Al llegar al límite, el trabajo por su cuenta se pausa hasta que se renueva; te avisamos antes.",
          "No puedes cambiar tu plan ni tus límites por tu cuenta fuera de lo que ofrece el panel.",
        ],
      },
      {
        titulo: "La IA puede equivocarse",
        parrafos: [
          "Atendel usa inteligencia artificial y puede equivocarse. Revisa lo importante antes de mandarlo a un cliente. Lo que tiene que ver con dinero (cobros, pagos, descuentos, reembolsos) siempre pide tu OK.",
          "Tú decides qué hace solo en «Qué hace solo» (Ajustes). Lo que permites que haga sin preguntarte, y lo que apruebas, es tu decisión y tu responsabilidad.",
        ],
      },
      {
        titulo: "Tus apps y tus clientes",
        lista: [
          "Cuando conectas una app nos das permiso de usarla para lo que pides; puedes quitarlo cuando quieras en Tu negocio → Apps. Esa app tiene sus propios términos, que también aplican.",
          "Eres responsable de los datos de tus clientes y de tener su permiso para contactarlos (por ejemplo, por WhatsApp), conforme a la ley y a las políticas de cada plataforma.",
          "Lo que subes y lo que Atendel prepara para ti es tuyo. Nos das permiso de procesarlo solo para darte el servicio.",
        ],
      },
      {
        titulo: "Lo que no se vale",
        lista: [
          "Usar Atendel para mandar mensajes masivos no deseados (spam), engañar, acosar o hacer algo ilegal.",
          "Intentar entrar a cuentas o datos ajenos, saltarte los límites, o atacar, saturar o copiar el servicio.",
          "Usar Atendel para dar diagnósticos médicos, legales o financieros como si fueran de un profesional.",
        ],
        despues: ["Si pasa algo de esto, podemos pausar o cerrar la cuenta. Si se puede, te avisamos antes y te explicamos por qué."],
      },
      {
        titulo: "Disponibilidad y responsabilidad",
        parrafos: [
          "Trabajamos para que Atendel funcione siempre, pero puede haber fallas o pausas, también de servicios de terceros (como WhatsApp, Google, Microsoft o el proveedor de IA). No garantizamos que funcione sin interrupciones.",
          "En la medida en que la ley lo permite, no respondemos por pérdidas indirectas ni por decisiones que tomes con base en lo que la IA sugiere sin revisarlo. Nada de esto limita los derechos que te da la ley como consumidor.",
        ],
      },
      {
        titulo: "La marca y el programa",
        parrafos: ["Atendel, su nombre, sus personajes y su programa son nuestros. Usarlos no te da derechos sobre ellos."],
      },
      {
        titulo: "Cambios",
        parrafos: [
          "Si cambiamos estos términos, publicamos la nueva versión aquí con su fecha y te avisamos antes en el panel o por correo. Si sigues usando Atendel después del cambio, lo aceptas; si no estás de acuerdo, puedes borrar tu cuenta.",
        ],
      },
      {
        titulo: "Ley y tribunales",
        parrafos: [
          `Estos términos se rigen por las leyes de México. Cualquier desacuerdo lo intentamos resolver primero platicando; si no se puede, lo resuelven los tribunales de ${d.jurisdiccion}, sin perjuicio de tus derechos ante la Procuraduría Federal del Consumidor.`,
        ],
      },
      {
        titulo: "Contacto",
        parrafos: [`Escríbenos a ${d.correo}.`],
      },
    ],
  };
}
