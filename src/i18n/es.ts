import { DETALLE, type DetalleAgente } from "@/components/agentes/detalle";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { GARANTIAS, PREGUNTAS, SEGMENTOS } from "@/lib/contenido";
import { PLANES, type IdPlan } from "@/lib/planes";
import type { CategoriaApp, IdApp } from "@/lib/nucleo-tipos";
import type { Idioma } from "./index";

/**
 * Textos del sitio público en español: los de siempre, sacados de cada
 * componente para poder cambiar de idioma. El inglés (en.ts) tiene la misma
 * forma. Lo que ya vivía en src/lib (agentes, planes, preguntas, situaciones)
 * se toma de ahí sin cambiarlo: el panel lo sigue usando.
 */

export type Pregunta = { p: string; r: string };
type TextoAgente = { area: string; abarca: string; lema: string; capacidades: string[]; sugerencias: string[] };
type TextoPlan = { nivel: string; precio: string | null; resumen: string; incluye: string[]; uso: string };
export type Segmento = {
  id: string;
  nombre: string;
  corto: string;
  resumen: string;
  frente: IdAgente;
  intro: string;
  ayuda: { id: IdAgente; texto: string }[];
};

const porAgente = Object.fromEntries(
  AGENTES_INFO.map((a) => [a.id, { area: a.area, abarca: a.abarca, lema: a.lema, capacidades: a.capacidades, sugerencias: a.sugerencias }]),
) as Record<IdAgente, TextoAgente>;

const porPlan = Object.fromEntries(
  PLANES.map((p) => [p.id, { nivel: p.nivel, precio: p.precio, resumen: p.resumen, incluye: p.incluye, uso: p.uso }]),
) as Record<IdPlan, TextoPlan>;

const pregunta = (inicio: string) => PREGUNTAS.filter((q) => q.p.startsWith(inicio));

const lista = (nombres: string[]) =>
  nombres.length <= 1
    ? nombres.join("")
    : `${nombres.slice(0, -1).join(", ")} ${nombres.length > 2 ? "e" : "y"} ${nombres[nombres.length - 1]}`;

export const es = {
  idioma: "es" as Idioma,
  meta: {
    locale: "es_MX",
    tituloInicio: "Atendel — Tu socio de IA para atender tu negocio",
    descripcionInicio:
      "Atendel ve lo que pasa en tu negocio, lo resuelve con su equipo y te avisa por WhatsApp: Aura atiende tu WhatsApp y tus citas, Altair tu correo, Rigel a tus clientes y Mira la oficina. Trabaja aunque no estés y te avisa de todo.",
    agentes: ["Agentes", "Atendel y su equipo: Aura, Altair, Rigel y Mira. Qué hace cada uno y cómo trabajan juntos."],
    precios: ["Precios", "Atendel Free es gratis y trae a todo el equipo para probarlo. One y Max son para el día a día; Max, con 5 veces el uso de One."],
    preguntas: [
      "Posibles preguntas",
      "Cómo se empieza, qué trae cada plan, cómo trabajan los agentes con tus clientes y cómo cuidamos tus datos.",
    ],
    paraQuien: [
      "Para quién es",
      "Si trabajas con citas, te escriben a todas horas, vives de que tus clientes regresen o el papeleo te quita tiempo: qué hacen Aura, Altair, Rigel y Mira por ti.",
    ],
    lista: ["Lista de espera", "Déjanos tu correo y te avisamos cuando abramos tu lugar en Atendel."],
    contacto: ["Contacto", "Escríbenos tus dudas sobre Atendel, los planes o cómo cuidamos tus datos. Te contestamos a tu correo."],
    privacidad: ["Aviso de privacidad", "Qué datos guarda Atendel, para qué los usa, con quién los comparte y cómo puedes verlos, corregirlos o borrarlos."],
    terminos: ["Términos de uso", "Las reglas para usar Atendel: qué hace, qué te toca a ti y qué nos toca a nosotros."],
    cookies: ["Política de cookies", "Qué cookies y tecnologías parecidas usa Atendel, para qué y cómo puedes borrarlas."],
    entrar: ["Entrar", "Entra a Atendel con tu correo y un código de 6 dígitos. Sin contraseña."],
    crear: ["Crea tu cuenta", "Crea tu cuenta de Atendel con tu correo. Empiezas con el plan Free."],
    noEncontrada: [
      "Página no encontrada",
      "Esta dirección no existe en Atendel. Vuelve al inicio o sigue a los agentes, los precios o las posibles preguntas.",
    ],
    agente: (nombre: string, area: string, lema: string) => [`${nombre} · ${area}`, `${nombre}, agente de ${area.toLowerCase()} de Atendel. ${lema}`],
  },
  lista,

  barra: {
    saltar: "Saltar al contenido",
    inicio: "Atendel, inicio",
    principal: "Principal",
    principalCelular: "Principal en celular",
    agentes: "Agentes",
    precios: "Precios",
    cuando: "Cuándo sale",
    preguntas: "Preguntas",
    pruebalo: "Pruébalo",
    paraQuien: "Para quién es",
    entrar: "Entrar",
    tema: "Tema",
    idioma: "Idioma",
    unete: "Únete a la lista",
    crear: "Crea tu cuenta",
    abrir: "Abrir el menú",
    cerrar: "Cerrar el menú",
    menu: "Menú",
    inicioMenu: "Inicio",
    equipo: "El equipo",
    conoce: "Conoce a Aura, Altair, Rigel y Mira",
    todos: "Ver a todo el equipo",
    ayuda: "Ayuda y contacto",
    contacto: "Contacto",
    legal: "Términos y políticas",
    privacy: "Privacidad",
    apps: "Apps",
    todasPoliticas: "Todos los documentos",
    producto: "Producto",
    descargar: "Descargar",
  },

  tema: {
    grupo: "Tema",
    oscuro: "Oscuro",
    claro: "Claro",
    sistema: "Sistema",
    aClaro: "Cambiar a modo claro",
    aOscuro: "Cambiar a modo oscuro",
    modoClaro: "Modo claro",
    modoOscuro: "Modo oscuro",
  },

  pie: {
    aria: "Pie de página",
    agentes: "Agentes",
    precios: "Precios",
    preguntas: "Preguntas",
    contacto: "Contacto",
    entrar: "Entrar",
    producto: "Producto",
    paraQuien: "Para quién es",
    ayuda: "Ayuda",
    cuenta: "Cuenta",
    pruebalo: "Pruébalo",
    tusDatos: "Tus datos",
    miPanel: "Mi panel",
    lema: "Atendel, tu socio de IA: con Aura, Altair, Rigel y Mira atiende tu negocio aunque no estés.",
    sello: "Entras con tu correo · sin contraseña",
    franja: "Ayuda y datos",
    privacidad: "Privacidad",
    terminos: "Términos",
    cookies: "Cookies",
    centro: "Centro de privacidad",
  },

  inicio: {
    portada: {
      etiqueta: "Tu socio de IA",
      titulo: "Que ningún cliente se\u00a0quede sin respuesta.", // «se quede» siempre juntos: el renglón corta después de «cliente»
      texto:
        "Atendel ve lo que pasa en tu negocio y lo resuelve como un socio, con su equipo; de lo importante te avisa por WhatsApp: Aura atiende tu WhatsApp y tus citas, Altair tu correo, Rigel a tus clientes y Mira la oficina. Trabaja aunque no estés, y lo de dinero no sale sin tu OK.",
    },
    decisiones: {
      titulo: "Trabaja aunque no estés",
      texto: "Vigila tu WhatsApp, tu correo y tu agenda durante el día, hace las tareas que le programas y contesta a tus clientes con tus precios y tus reglas. Lo importante te lo avisa por WhatsApp o con una notificación en tu celular.",
    },
    caos: {
      aria: "Así es tu día hoy",
      textos: [
        "Así es tu día hoy. Mensajes de WhatsApp, correos, citas y pendientes regados entre el celular, la libreta y tu cabeza.",
        "Contestas tarde porque estás atendiendo. Se te pasa confirmar una cita. Un cliente que preguntó ya no regresa.",
        "Y el papeleo se acumula para la noche.",
      ],
    },
    foco: {
      titulo: "Un solo chat, todo un equipo",
      textos: [
        "Atendel es tu socio de inteligencia artificial: ve lo que pasa en tu negocio, lo resuelve y te avisa de lo importante. Detrás trabajan cuatro agentes para tu negocio.",
        "Él decide a quién le toca: contestar, agendar, mover una cita, ordenar tu correo o preparar un documento. Lo hace en tus propias apps y te cuenta una sola vez qué hizo.",
        "Aprende tu negocio con tus Reglas, tus Procesos y su Memoria. Tú decides qué hace solo y qué te pregunta antes; lo de dinero, siempre te lo pregunta.",
      ],
    },
    globo: {
      titulo: "Que tu negocio crezca, no tu trabajo",
      texto1: "Queremos que atender bien no dependa de estar pegado al celular.",
      texto2a: "Tus clientes reciben respuesta y tú recuperas tu tiempo para ",
      texto2b: "atender mejor",
      texto2c: ".",
      texto3: "Entras con tu correo, sin contraseña, desde el celular o la computadora, y lo instalas como app en tu celular. Si prefieres, también le hablas.",
    },
    equipo: {
      titulo: "Tu equipo",
      sub: "Atendel reparte el trabajo entre cuatro agentes, cada uno en lo suyo.",
      texto: "Toca a cualquiera para ver todo lo que hace.",
    },
    apps: {
      titulo: "Se conecta con las apps que ya usas",
      nota: (n: number) => `${n} apps, con tu propia cuenta. Atendel las revisa por ti y, con tu permiso, hace cosas en ellas: agenda, contesta y manda.`,
    },
    planes: {
      titulo: "Planes",
      texto: "Empieza gratis con todo el equipo. One y Max abren por etapas: anótate en la lista y te avisamos.",
      cuandoTitulo: "Cuándo sale",
      cuandoTexto: "Free ya está abierto. One y Max abren por etapas: anótate en la lista y te avisamos cuando abra tu lugar.",
    },
    cierre: { linea1: "Tu negocio ya tiene quién atienda.", linea2: "Deja que Atendel lo haga." },
  },

  carrusel: {
    region: "Los cuatro agentes",
    tipo: "carrusel",
    verFicha: "Ver su ficha",
    abrir: (nombre: string, cargo: string) => `${nombre}, ${cargo}: ver su ficha`,
    anterior: (nombre: string) => `Anterior: ${nombre}`,
    siguiente: (nombre: string) => `Siguiente: ${nombre}`,
    cargo: { lola: "Atención · WhatsApp y citas", clara: "Correo", victor: "Clientes", iris: "Oficina" } as Record<IdAgente, string>,
  },

  listaEspera: {
    titulo: "Únete a la lista",
    texto: "Déjanos tu correo y te avisamos cuando abramos tu lugar en Atendel.",
    cerrar: "Cerrar",
    formulario: "Lista de espera de Atendel",
    correo: "Tu correo",
    boton: "Únete a la lista",
    anotando: "Anotando…",
    reintentar: "Intentar de nuevo",
    pruebaAgentes: "Prueba los agentes",
    listoA: "Listo. Te escribimos a ",
    listoB: " en cuanto abramos tu lugar.",
    corregir: "¿Te equivocaste de correo? Corrígelo",
    trampa: "No llenes este campo",
    irPruebalo: "Ir a Pruébalo",
    errores: {
      vacio: "Escribe tu correo.",
      invalido: "Revisa tu correo: parece que le falta algo (por ejemplo, nombre@negocio.com).",
      datos: "Revisa tu correo y los datos del formulario.",
      pausa: "La lista de espera abre muy pronto. Mientras, puedes probar a los agentes en Pruébalo.",
      falla: "No pudimos guardar tus datos. Intenta de nuevo en un momento.",
      conexion: "No hay conexión. Revisa tu internet e intenta de nuevo.",
    },
    pagina: {
      equipo: "Aura, Altair, Rigel y Mira",
      etiqueta: "Lista de espera",
      titulo: "Anótate y te avisamos cuando abramos tu lugar",
      texto: "Para negocios que atienden personas. Solo necesitamos tu correo.",
      despuesTitulo: "Qué pasa después",
      despues: [
        { titulo: "Tu correo queda en la lista", texto: "No te pedimos nada más: ni teléfono, ni contraseña, ni datos de tu negocio." },
        {
          titulo: "Te escribimos cuando abramos tu lugar",
          texto: "Atendel abre por etapas: la conexión de Aura con tu WhatsApp y tu agenda llega poco a poco. Te avisamos a ese correo.",
        },
        {
          titulo: "Mientras, ya puedes empezar",
          texto: "Con Atendel Free entras hoy con tu correo, sin contraseña, y trabajas con Atendel y todo su equipo. Y en Pruébalo platicas con él sin crear cuenta.",
        },
      ],
      pruebaAgentes: "Prueba los agentes",
      empiezaFree: "Empieza con Free",
      preguntar: "¿Prefieres preguntarnos algo primero?",
      escribenos: "Escríbenos",
    },
  },

  agentes: porAgente,
  detalle: DETALLE as Record<IdAgente, DetalleAgente>,

  paginaAgentes: {
    etiqueta: "Atención · Correo · Clientes · Oficina",
    titulo: "¿Qué le encargas hoy?",
    texto:
      "Atendel ve lo que pasa, te avisa por WhatsApp y se lo pasa a quien le toca: Aura atiende tu WhatsApp y tus citas, Altair lleva tu correo, Rigel trae de regreso a tus clientes y Mira hace el trabajo de oficina. Toca a cualquiera para ver su ficha.",
    hablar: "Habla con Atendel",
    verPrecios: "Ver precios",
    chatEtiqueta: "El chat",
    chatTitulo: "Pruébalos en el chat",
    chatTexto: "Atendel te avisa de lo que pasa y, si quieres, también le pides cosas, como en cualquier chat: él reparte el trabajo y te contesta una sola vez.",
    irAgente: "Ir a un agente",
    verFicha: "Ver su ficha",
    abrirFicha: (nombre: string, area: string) => `${nombre}, ${area}: ver su ficha`,
    suPagina: "Su página",
    todoLoQueHace: "Todo lo que hace",
    vieneEn: "Viene en",
    conversacionCon: (nombre: string) => `Conversación de ejemplo con ${nombre}`,
  },

  ficha: {
    cerrar: "Cerrar la ficha",
    queEs: "Qué es y para qué sirve",
    todo: "Todo lo que puede hacer",
    enQuePlan: "En qué plan está",
    incluido: "Incluido",
    noIncluido: "No incluido",
    llegaCon: (nombre: string, plan: string) => `${nombre} llega con ${plan}. Mientras, puedes empezar gratis con Altair.`,
    probarGratis: (nombre: string) => `Probar a ${nombre} gratis`,
    empezarGratis: "Empezar gratis",
    pruebaloCon: (nombre: string) => `Pruébalo con ${nombre}`,
    suPagina: "Su página",
    verPrecios: "Ver precios",
  },

  conversacion: {
    loAtiende: (nombre: string) => ` · lo atiende ${nombre}`,
    ejemplo: "Nombres de ejemplo",
    desdeTuCorreo: "desde tu correo",
    seLoPaso: (nombre: string) => `Ya se lo pasé a ${nombre}.`,
    pidele: "Pídele algo a Atendel…",
    /** La nota cuando apruebas un archivo que te dejó (Mira). */
    aprobado: (archivo: string) => `Aprobado · ${archivo}`,
    tu: "Tú",
    trabajaCon: "Trabaja con",
    picar: (quien: string) => [`¡Aquí no! 👀`, `¡Ey! Este celular es de muestra.`, `¡Cosquillas no! 😆`, `Shh… ${quien} está trabajando.`, `Mira, pero no toques. 😄`, `¡Uy! Casi me tiras.`],
    conAtendel: {
      lola: { aviso: "Mariana te escribió por WhatsApp: pregunta cuánto cuesta la sesión de una hora y quiere cita el jueves.", pregunta: "Le preparé la respuesta: la sesión de una hora cuesta $850 y el jueves hay 11:00 o 16:30. ¿Se la mando?", respuesta: "Sí, mándala", hecho: "Listo, se la mandé. Eligió 16:30: ya quedó agendada y un día antes le mando recordatorio." },
      clara: { aviso: "Andrea Solís te mandó un correo: quiere cambiar su cita del martes a la tarde.", pregunta: "Le preparé un correo desde tu cuenta con dos horarios para el martes: 17:00 o 18:30. ¿Lo mando?", respuesta: "Sí, mándalo", hecho: "Mandado. Eligió 17:00: ya moví su cita y un día antes le mando recordatorio." },
      victor: { aviso: "Paola preguntó por botox la semana pasada y no agendó.", pregunta: "Le quiero escribir por WhatsApp con dos opciones: viernes 12:00 o sábado 10:30. ¿Le escribo?", respuesta: "Sí, escríbele", hecho: "Listo. Eligió el viernes: ya quedó agendada y le mandé la ubicación." },
      iris: { aviso: "Esta semana tres clientas preguntaron si tus precios están al día.", pregunta: "Revisé 4 negocios cercanos: cobran entre $590 y $990. Tú estás en $750, a la mitad. Te dejé la tabla con fuentes en precios-zona.xlsx. ¿La apruebas?", respuesta: "Sí, la apruebo", hecho: "Perfecto, ya quedó en tu Oficina." },
    },
  },

  paginaAgente: {
    ruta: "Ruta",
    agentes: "Agentes",
    hablale: (nombre: string) => `Háblale a ${nombre}`,
    verFicha: "Ver su ficha",
    conversacionEtiqueta: (canal: string) => `Conversación de ejemplo · ${canal}`,
    tituloConversacion: {
      lola: "Así contesta Aura un WhatsApp",
      clara: "Así contesta Altair un correo",
      victor: "Así le da Rigel seguimiento a quien no agendó",
      iris: "Así le encargas trabajo a Mira",
    } as Record<IdAgente, string>,
    queHace: "Qué hace",
    todoLoQueHace: (nombre: string) => `Todo lo que hace ${nombre}`,
    paraEmpezar: "Para empezar",
    pidele: (nombre: string) => `Pídele algo a ${nombre}`,
    ideas: "Ideas de lo que le puedes pedir. Escríbeselas en el chat de prueba, como en cualquier chat.",
    planes: "Planes",
    enQuePlan: (nombre: string) => `En qué plan viene ${nombre}`,
    enLosTres: (nombre: string) => `${nombre} viene en los tres planes, también en el gratis: puedes empezar hoy.`,
    llegaCon: (nombre: string, plan: string) => `${nombre} llega con ${plan}. Mientras, puedes empezar gratis con Altair.`,
    desdeAqui: "Desde aquí",
    incluye: (nombre: string) => `Incluye a ${nombre}`,
    noViene: "No viene en este plan",
    verPreciosPlanes: "Ver precios y lo que trae cada plan",
    tuEquipo: "Tu equipo",
    otrosTres: "Los otros tres agentes",
  },

  planes: porPlan,
  tarjetasPlanes: {
    incluyeCuatro: "Incluye los 4 agentes",
    aria: "Planes de Atendel",
    disponibleHoy: "Disponible hoy",
    nivel: (nivel: string) => `Atendel · ${nivel}`,
    proximamente: "Próximamente",
    agentesAria: (nombres: string) => `Agentes: ${nombres}`,
    losCuatro: "Los cuatro agentes",
    empiezaGratis: "Empieza gratis",
    avisame: "Avísame cuando abra",
    unete: "Únete a la lista",
    sinContrasena: "Entras con tu correo, sin contraseña.",
    porAnunciar: "Precio por anunciar.",
    incluye: "Incluye",
  },

  paginaPrecios: {
    etiqueta: "Precios · Free, One y Max",
    titulo: "Empieza gratis. Crece cuando tu negocio lo pida.",
    intro:
      "Free para conocer a Atendel y a todo su equipo. One y Max, para el día a día: Max, con 5 veces el uso de One.",
    planes: "Planes",
    compararEtiqueta: "Comparación",
    compararTitulo: "Qué trae cada plan",
    compararTexto: "Los tres planes traen a Atendel y a sus cuatro agentes. Cambian los modelos, el uso y cuánto trabaja por su cuenta: Max tiene 5 veces el uso de One.",
    antes: "Antes de decidir",
    preguntasTitulo: "Preguntas sobre los planes",
    cierreTitulo: "Pruébalos antes de decidir.",
    cierreTexto: "Platica con Atendel en el chat de demostración, o anótate para saber cuándo abren One y Max.",
    pruebaAgentes: "Prueba los agentes",
    listaEspera: "Lista de espera",
  },

  comparacion: {
    caption: "Qué agentes y funciones trae cada plan de Atendel",
    agenteOFuncion: "Agente o función",
    incluido: "Incluido",
    noIncluido: "No incluido",
    agentes: "Agentes",
    enElChat: "En el chat",
    uso: "Uso del chat",
    cuatro: "Los 4 agentes",
    trabajo: "Revisión diaria y tareas automáticas",
    avanzada: "IA avanzada para lo más pesado",
    internet: "Tareas que investigan en internet",
  },

  preguntas: {
    etiqueta: "Ayuda",
    titulo: "Posibles preguntas",
    texto: "Dudas que puedes tener antes de empezar con tu negocio.",
    temas: "Temas",
    cuidamos: "Cómo cuidamos tus datos",
    pruebaAgentes: "Prueba los agentes",
    precios: "Precios",
    seguridadEtiqueta: "Tus datos",
    seguridadTitulo: "Cada negocio ve solo lo suyo",
    algoMas: "¿Algo más sobre tus datos?",
    escribenos: "Escríbenos",
    noEsta: "¿No está tu pregunta?",
    pregunta: "pregunta",
    preguntasPalabra: "preguntas",
    grupos: {
      agentes: {
        nombre: "Los agentes",
        preguntas: [
          { p: "¿Qué son los agentes?", r: "Son tus asistentes de IA. Cada uno tiene su trabajo: Aura atiende tu WhatsApp y tus citas, Altair lleva tu correo, Rigel trae de vuelta a tus clientes y Mira se encarga de la oficina." },
          { p: "¿Cómo funcionan?", r: "Llega un mensaje o tú le pides algo a Atendel. Atendel se lo pasa al agente indicado, que lo resuelve y te avisa. Lo que no le hayas dejado hacer solo, te lo pregunta antes." },
          {
            p: "¿Tengo que decirle a qué agente le toca?",
            r: "No. Atendel decide solo a quién le toca, sea algo que vio o algo que le pidas: Aura, Altair, Rigel o Mira. Te contesta una sola vez y abajo ves quién lo hizo.",
          },
        ],
      },
      empezar: { nombre: "Para empezar", preguntas: [...pregunta("¿Es difícil"), ...pregunta("¿Sirve para mi negocio"), ...pregunta("¿Atendel trabaja"), ...pregunta("¿Qué puedo usar")] },
      planes: {
        nombre: "Planes y precios",
        preguntas: [
          ...pregunta("¿Qué incluye cada plan"),
          {
            p: "¿Cuánto cuesta?",
            r: "Atendel Free es gratis. Los precios de Atendel One y Atendel Max todavía no se publican: déjanos tu correo en la lista de espera y te avisamos cuando abran.",
          },
          { p: "¿Necesito tarjeta para empezar?", r: "No. Entras con tu correo, sin contraseña, y empiezas a trabajar con Atendel y todo su equipo." },
          {
            p: "¿Cómo cambio de plan?",
            r: "Por ahora no se cambia desde tu cuenta: One y Max abren por etapas. Anótate en la lista de espera y te escribimos cuando abramos tu lugar.",
          },
        ],
      },
      clientes: { nombre: "Con tus clientes", preguntas: [...pregunta("¿Mis clientes"), ...pregunta("¿Qué pasa si un agente")] },
      datos: { nombre: "Tus datos", preguntas: pregunta("¿Qué pasa con mis datos") },
    } as Record<"agentes" | "empezar" | "planes" | "clientes" | "datos", { nombre: string; preguntas: Pregunta[] }>,
    garantias: GARANTIAS.map(([titulo, texto]) => ({ titulo, texto })),
  },

  paraQuien: {
    etiqueta: "Para quién es",
    titulo: "Para negocios que atienden personas.",
    texto: "Si tu negocio vive de atender, agendar y que tus clientes regresen, el equipo de Atendel hace esa parte contigo.",
    hablar: "Habla con Atendel",
    indice: "En esta página",
    resto: "El resto del equipo",
    cierreEtiqueta: "Pruébalo",
    cierreTitulo: "Pruébalo con tu negocio en mente.",
    verPrecios: "Ver precios",
    segmentos: SEGMENTOS.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      corto: s.corto,
      resumen: s.resumen,
      frente: s.frente,
      intro: s.intro,
      ayuda: s.ayuda.map(([id, texto]) => ({ id, texto })),
    })) as Segmento[],
  },

  contacto: {
    etiqueta: "Contacto",
    titulo: "Escríbenos",
    texto: "Dudas sobre los planes, sobre tu tipo de negocio o sobre cómo cuidamos tus datos. Te contestamos a tu correo.",
    escribenos: "O escríbenos directo a",
    atajosAria: "Quizá tu respuesta ya está aquí",
    atajosEtiqueta: "Quizá ya está aquí",
    atajos: [
      { href: "/preguntas", titulo: "Posibles preguntas", texto: "Cómo se empieza y qué hace cada agente" },
      { href: "/precios", titulo: "Precios", texto: "Qué trae Free, One y Max" },
      { href: "/preguntas#seguridad", titulo: "Tus datos", texto: "Cómo cuidamos la información de tu negocio" },
    ],
    formulario: {
      aria: "Formulario de contacto",
      pausa: "Este formulario todavía no recibe mensajes: lo estamos terminando de abrir. Tu texto sigue aquí; intenta de nuevo en unos días.",
      nombreFalta: "Escribe tu nombre.",
      correoFalta: "Escribe tu correo para poder contestarte.",
      correoInvalido: "Revisa tu correo: parece que le falta algo (por ejemplo, nombre@negocio.com).",
      mensajeFalta: "Escribe tu mensaje.",
      mensajeLargo: (n: string) => `El mensaje puede tener hasta ${n} caracteres.`,
      recibimos: "Recibimos tu mensaje",
      contestamosA: "Te contestamos a ",
      mientras: ". Mientras, puedes platicar con los agentes en ",
      pruebalo: "Pruébalo",
      otro: "Escribir otro mensaje",
      nombre: "Tu nombre",
      negocio: "Tu negocio (opcional)",
      negocioAyuda: "El nombre de tu negocio y tu ciudad.",
      correo: "Tu correo",
      correoAyuda: "Ahí te contestamos.",
      mensaje: "Tu mensaje",
      trampa: "No llenes este campo",
      todos: "Todos los campos son necesarios, menos el negocio.",
      enviando: "Enviando…",
      reintentar: "Intentar de nuevo",
      enviar: "Enviar mensaje",
    },
  },

  acceso: {
    inicio: "Atendel, inicio",
    entrar: {
      titulo: "Entra a Atendel",
      texto: "Escribe tu correo y te mandamos un código.",
      formulario: "Entrar con tu correo",
      pregunta: "¿No tienes cuenta?",
      enlace: "Crea una",
      href: "/crear-cuenta",
    },
    crear: {
      titulo: "Crea tu cuenta",
      texto: "Tu correo y unos datos de tu negocio. Empiezas con el plan Free.",
      formulario: "Crear una cuenta con tu correo",
      pregunta: "¿Ya tienes cuenta?",
      enlace: "Entra",
      href: "/entrar",
    },
    correo: "Correo electrónico",
    siguiente: "Siguiente",
    enviando: "Enviando…",
    o: "o",
    google: "Continuar con Google",
    atras: "Atrás",
    pasoDe: (n: number, total: number) => `Paso ${n} de ${total}`,
    noInicio: "No se pudo iniciar sesión. Pide un código nuevo, o abre el enlace del correo en este mismo navegador.",
    resumen: "Sobre tu negocio (opcional)",
    nombre: "Nombre completo",
    nacimiento: "Fecha de nacimiento",
    negocio: "Nombre del negocio",
    tipo: "Tipo de negocio",
    tipoVacio: "Elige uno",
    telefono: "Teléfono o WhatsApp",
    aceptoAntes: "Soy mayor de 18 años y acepto los ",
    terminos: "Términos",
    aceptoY: " y el ",
    privacidad: "Aviso de privacidad",
    paso2: {
      titulo: "Revisa tu correo",
      mandamos: "Te mandamos un código de 6 dígitos a ",
      codigo: "Código de 6 dígitos",
      verificando: "Verificando…",
      reenviar: "Reenviar código",
      reenviarEn: (s: number) => `Reenviar código en ${s} s`,
      reenviado: "Listo, te mandamos un código nuevo.",
      otroCorreo: "Usar otro correo",
      enlace: "También puedes tocar el enlace del correo",
    },
    errores: {
      escribeCorreo: "Escribe tu correo para mandarte el código.",
      falta: "Completa este dato.",
      revisaCorreo: "Revisa tu correo: parece que le falta algo (por ejemplo, nombre@negocio.com).",
      fechaInvalida: "Revisa la fecha de nacimiento.",
      menor: "Debes ser mayor de 18 años para crear una cuenta.",
      telefono: "Revisa el teléfono: escribe solo números, con la lada.",
      aceptar: "Marca la casilla para continuar.",
      verificacion: "Completa la verificación de seguridad.",
      noSeEnvio: "No se pudo enviar el código. Intenta de nuevo en un momento.",
      muchos: "Demasiados intentos. Espera unos minutos y vuelve a intentar.",
      servicio: "El servicio no está disponible por ahora. Intenta de nuevo en un momento.",
      sinConexion: "No hay conexión. Revisa tu internet e intenta de nuevo.",
      codigoIncompleto: "Escribe los 6 dígitos del código.",
      codigoMal: "Ese código no es correcto o ya venció. Revisa el correo o pide uno nuevo.",
      google: "No se pudo abrir Google. Intenta de nuevo en un momento.",
    },
    pie: {
      aria: "Ayuda y datos",
      ayuda: "Ayuda",
      terminos: "Términos",
      privacidad: "Privacidad",
      privado: "Usa navegación privada si este no es tu aparato.",
    },
    seguridad: "Verificación de seguridad",
  },

  noEncontrada: {
    etiqueta: "Error 404",
    titulo: "Esta página no existe",
    texto: "Puede que el enlace esté mal escrito o que la página haya cambiado de lugar.",
    volver: "Volver al inicio",
    sigue: "O sigue por aquí",
    atajos: [
      { href: "/agentes", titulo: "Agentes", texto: "Aura, Altair, Rigel y Mira: qué hace cada uno" },
      { href: "/precios", titulo: "Precios", texto: "Qué trae Free, One y Max" },
      { href: "/preguntas", titulo: "Posibles preguntas", texto: "Cómo se empieza y cómo cuidamos tus datos" },
      { href: "/pruebalo", titulo: "Pruébalo", texto: "Platica con los agentes en un chat de ejemplo" },
    ],
  },

  errorPagina: {
    etiqueta: "Algo falló",
    titulo: "Algo no salió bien",
    texto: "Fue de nuestro lado, no tuyo. Intenta de nuevo; si sigue, vuelve en unos minutos.",
    reintentar: "Intentar de nuevo",
    volver: "Volver al inicio",
  },
  /* Páginas legales y Centro de privacidad (/privacy) */
  legal: {
    etiquetas: {
      saltar: "Saltar al contenido",
      inicio: "Inicio",
      politicas: "Políticas",
      entrar: "Entrar",
      contacto: "Contacto",
      contenido: "Contenido",
      vigente: "Vigente desde",
      tipo: "Tipo",
      idioma: "Idioma",
      pdf: "Descargar PDF",
      nota: "",
      pieAria: "Políticas y contacto",
      centro: "Centro de privacidad",
      centroTitulo: "Centro de privacidad de Atendel",
      centroDescripcion: "Todos los documentos legales de Atendel en un solo lugar: privacidad, términos, cookies, tratamiento de datos, IA y más.",
      buscar: "Buscar en los documentos…",
      buscarAria: "Buscar en los documentos legales",
      secciones: "secciones",
      preguntas: "preguntas",
      resultados: "resultados",
      sinResultados: "No encontramos nada con esas palabras. Prueba con otras o escríbenos.",
      verTodo: "Ver todos los documentos",
      agentes: "Agentes",
      precios: "Precios",
    },
    docs: {
      privacidad: {
        nombre: "Aviso de privacidad",
        resumen: "Qué datos tratamos, para qué y cómo ejerces tus derechos.",
        etiqueta: "Legal · Privacidad",
        titulo: "Aviso de Privacidad",
        tipo: "Aviso integral",
      },
      acceso: {
        nombre: "Acceso a tus cuentas",
        resumen: "Cómo entra Atendel a tu correo, tu agenda y tus apps, y cómo lo mantiene privado.",
        etiqueta: "Legal · Acceso a tus datos",
        titulo: "Política de Acceso a Cuentas y Servicios de Terceros",
        tipo: "Cuentas conectadas y privacidad",
      },
      preguntas: {
        nombre: "Preguntas frecuentes",
        resumen: "Respuestas cortas sobre privacidad, seguridad y condiciones.",
        etiqueta: "Legal · Preguntas",
        titulo: "Preguntas frecuentes",
        tipo: "Privacidad, seguridad y condiciones",
      },
      terminos: {
        nombre: "Términos y condiciones",
        resumen: "Las reglas para usar Atendel: tu cuenta, los planes y la responsabilidad.",
        etiqueta: "Legal · Términos",
        titulo: "Términos y Condiciones de Uso",
        tipo: "Condiciones generales",
      },
      cookies: {
        nombre: "Política de cookies",
        resumen: "Las cookies que usamos (solo las necesarias) y para qué sirve cada una.",
        etiqueta: "Legal · Cookies",
        titulo: "Política de Cookies",
        tipo: "Cookies y tecnologías similares",
      },
      tratamiento: {
        nombre: "Tratamiento de datos (DPA)",
        resumen: "Cómo tratamos los datos de tus clientes por cuenta de tu negocio.",
        etiqueta: "Legal · Tratamiento de datos",
        titulo: "Acuerdo de Tratamiento de Datos Personales",
        tipo: "Acuerdo (DPA)",
      },
      uso: {
        nombre: "Uso aceptable",
        resumen: "Lo que se puede y lo que no se puede hacer con Atendel.",
        etiqueta: "Legal · Uso aceptable",
        titulo: "Política de Uso Aceptable",
        tipo: "Reglas de uso",
      },
      reembolsos: {
        nombre: "Cancelaciones y reembolsos",
        resumen: "Cómo cancelar Free, One o Max y cuándo procede un reembolso.",
        etiqueta: "Legal · Reembolsos",
        titulo: "Política de Cancelaciones y Reembolsos",
        tipo: "Planes Free, One y Max",
      },
      ia: {
        nombre: "Inteligencia artificial",
        resumen: "Cómo usa Atendel la IA, sus límites y lo que siempre decides tú.",
        etiqueta: "Legal · Inteligencia artificial",
        titulo: "Política de Inteligencia Artificial",
        tipo: "Uso de la IA",
      },
      servicio: {
        nombre: "Nivel de servicio (SLA)",
        resumen: "Disponibilidad, mantenimientos, soporte y cómo te avisamos de fallas.",
        etiqueta: "Legal · Nivel de servicio",
        titulo: "Acuerdo de Nivel de Servicio",
        tipo: "Acuerdo (SLA)",
      },
      proveedores: {
        nombre: "Proveedores y subencargados",
        resumen: "Quién nos ayuda a darte el servicio y dónde se guardan los datos.",
        etiqueta: "Legal · Proveedores",
        titulo: "Lista de Proveedores y Subencargados",
        tipo: "Lista de proveedores",
      },
    },
  },

  /* /apps */
  paginaApps: {
    meta: ["Apps que se conectan", "Las apps que se conectan con Atendel y qué hace Atendel con cada una."],
    etiqueta: "Apps",
    titulo: "Atendel trabaja con las apps que ya usas.",
    intro: (n: number) => `${n} apps disponibles. Conecta tu cuenta y Atendel trabaja en ellas, siempre con tu permiso.`,
    pronto: "En camino",
    marcas:
      "Las marcas y logos son de sus dueños; aquí solo dicen con qué se conecta Atendel. Algunas apps piden aprobar a Atendel antes de funcionar con cualquier cuenta.",
    cierreTitulo: "Conecta tus apps en minutos",
    cierreTexto: "Entra con tu correo, sin contraseña, y conéctalas desde Tu negocio → Apps conectadas. Las quitas cuando quieras.",
    crear: "Crea tu cuenta",
    /** Los nombres de apps que cambian en este idioma (los demás, como en el catálogo). */
    nombres: {} as Partial<Record<IdApp, string>>,
    categorias: {
      correo: {
        nombre: "Correo",
        texto: "Altair lee y resume tus correos, y puede contestar o mandar por ti con tu OK (o solo, si así lo eliges).",
      },
      mensajes: {
        nombre: "Mensajes",
        texto: "Aura lee los mensajes que te mandan tus clientes y Mira resume los canales de tu equipo. Solo lectura.",
      },
      agenda: {
        nombre: "Agenda y pendientes",
        texto:
          "Aura ve tu agenda y, en Google Calendar y Outlook, crea, mueve o cancela citas revisando que no choquen. Mira ve tus pendientes y puede crearlos o completarlos.",
      },
      reservas: { nombre: "Reservas", texto: "Aura ve tus citas, las de cada cliente y tus servicios. Solo lectura." },
      documentos: {
        nombre: "Documentos",
        texto: "Mira lee los archivos y hojas que le indiques para resumirlos o sacar cuentas; en Airtable y Trello también agrega registros o tarjetas.",
      },
      clientes: {
        nombre: "Clientes",
        texto: "Rigel busca a tus clientes en tus contactos y tu CRM, y lee las respuestas de tus formularios y cómo les fue a tus campañas. Solo lectura.",
      },
      resenas: { nombre: "Reseñas", texto: "Rigel lee tus reseñas para proponerte cómo contestarlas. Solo lectura." },
      pagos: {
        nombre: "Pagos y ventas",
        texto: "Mira ve tus cobros, pagos, pedidos y ventas para llevar las cuentas. Solo lectura: Atendel no mueve dinero.",
      },
      contabilidad: { nombre: "Contabilidad", texto: "Mira ve tus facturas, cobros y clientes. Solo lectura: no timbra ni cancela facturas." },
      facturacion: { nombre: "Facturas electrónicas", texto: "Mira lee tus facturas electrónicas (CFDI) para llevar cobros y pagos. Solo lectura." },
    } satisfies Record<CategoriaApp, { nombre: string; texto: string }>,
  },

  /* /cuando-sale */
  paginaCuando: {
    meta: ["Cuándo sale", "Free ya está abierto. One y Max abren por etapas: anótate y te avisamos."],
    etiqueta: "Lanzamiento",
    titulo: "Cuándo sale Atendel",
    intro: "Free ya está abierto. One y Max abren por etapas: anótate en la lista y te avisamos cuando abra tu lugar.",
    etapas: [
      { plan: "Free", estado: "abierto", estadoTexto: "Ya está abierto", texto: "Entra hoy con tu correo, sin contraseña, y trabaja con Atendel y su equipo en el modo Rápido." },
      {
        plan: "One",
        estado: "pronto",
        estadoTexto: "Abre por etapas",
        texto: "Para el día a día: revisión diaria, tareas automáticas e IA avanzada para lo pesado. Precio por anunciar.",
      },
      { plan: "Max", estado: "pronto", estadoTexto: "Abre por etapas", texto: "Todo lo de One, con 5 veces su uso. Precio por anunciar." },
    ] as { plan: string; estado: "abierto" | "pronto"; estadoTexto: string; texto: string }[],
    crear: "Crea tu cuenta",
    nota: "Nunca te cobraremos nada sin que antes aceptes el precio y las condiciones.",
    cierreTitulo: "¿Te avisamos?",
    cierreTexto: "Déjanos tu correo y te escribimos cuando abra tu lugar en One o Max.",
  },
};

/** La forma de los textos: el inglés tiene que traer exactamente lo mismo. */
export type Diccionario = typeof es;
