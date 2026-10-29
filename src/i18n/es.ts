import { DETALLE, type DetalleAgente } from "@/components/agentes/detalle";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { GARANTIAS, PREGUNTAS, SEGMENTOS } from "@/lib/contenido";
import { PLANES, type IdPlan } from "@/lib/planes";

/**
 * Textos del sitio público en español: los de siempre, sacados de cada
 * componente para poder cambiar de idioma. El inglés (en.ts) tiene la misma
 * forma. Lo que ya vivía en src/lib (agentes, planes, preguntas, situaciones)
 * se toma de ahí sin cambiarlo: el panel lo sigue usando.
 */

export type Pregunta = { p: string; r: string };
type TextoAgente = { area: string; abarca: string; lema: string; capacidades: string[]; sugerencias: string[] };
type TextoPlan = { nivel: string; precio: string | null; resumen: string; incluye: string[] };
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
  PLANES.map((p) => [p.id, { nivel: p.nivel, precio: p.precio, resumen: p.resumen, incluye: p.incluye }]),
) as Record<IdPlan, TextoPlan>;

const pregunta = (inicio: string) => PREGUNTAS.filter((q) => q.p.startsWith(inicio));

const lista = (nombres: string[]) =>
  nombres.length <= 1
    ? nombres.join("")
    : `${nombres.slice(0, -1).join(", ")} ${nombres.length > 2 ? "e" : "y"} ${nombres[nombres.length - 1]}`;

export const es = {
  idioma: "es" as "es" | "en",
  meta: {
    locale: "es_MX",
    tituloInicio: "Atendel — Agentes de IA para negocios que atienden personas",
    descripcionInicio:
      "Lola contesta tu WhatsApp y agenda citas, Clara ordena tu correo, Víctor trae de regreso a tus clientes e Iris lleva el trabajo de oficina. Agentes de IA para negocios que atienden personas.",
    agentes: ["Agentes", "Lola, Clara, Víctor e Iris: qué hace cada agente de Atendel, cómo habla y en qué plan viene."],
    precios: ["Precios", "Atendel Free es gratis y trae a Clara, tu agente de correo. One suma a Lola; Max, a los cuatro agentes."],
    preguntas: [
      "Posibles preguntas",
      "Cómo se empieza, qué trae cada plan, cómo trabajan los agentes con tus clientes y cómo cuidamos tus datos.",
    ],
    paraQuien: [
      "Para quién es",
      "Si trabajas con citas, te escriben a todas horas, vives de que tus clientes regresen o el papeleo te quita tiempo: qué hacen Lola, Clara, Víctor e Iris por ti.",
    ],
    lista: ["Lista de espera", "Déjanos tu correo y te avisamos cuando abramos tu lugar en Atendel."],
    contacto: ["Contacto", "Escríbenos tus dudas sobre Atendel, los planes o cómo cuidamos tus datos. Te contestamos a tu correo."],
    entrar: ["Entrar", "Entra a Atendel con tu correo, sin contraseña. Si es tu primera vez, tu cuenta se crea al entrar con el plan Free."],
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
    abrir: "Abrir la navegación",
    cerrar: "Cerrar la navegación",
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
    lema: "Lola, Clara, Víctor e Iris: cuatro agentes de IA para la recepción y la oficina de tu negocio.",
    sello: "Entras con tu correo · sin contraseña",
    franja: "Ayuda y datos",
  },

  inicio: {
    portada: {
      etiqueta: "Tu equipo de agentes de IA",
      titulo: "Que ningún cliente se quede sin respuesta.",
      texto:
        "Lola contesta tu WhatsApp y agenda citas, Clara ordena tu correo, Víctor trae de regreso a tus clientes e Iris lleva el trabajo de oficina. Lo importante no sale sin tu visto bueno.",
    },
    decisiones: {
      titulo: "Atiende sin perder un mensaje",
      texto: "Tus agentes contestan a cualquier hora, agendan y confirman citas, y te avisan cuando algo necesita a una persona.",
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
      titulo: "Tu equipo, listo a cualquier hora",
      textos: [
        "Atendel es un equipo de cuatro agentes de inteligencia artificial que trabajan para tu negocio.",
        "Les escribes como a una persona y ellos resuelven: contestan, agendan, ordenan tu correo y preparan documentos.",
        "Tú decides qué hacen solos y qué te consultan primero.",
      ],
    },
    globo: {
      titulo: "Que tu negocio crezca, no tu trabajo",
      texto1: "Queremos que atender bien no dependa de estar pegado al celular.",
      texto2a: "Tus clientes reciben respuesta y tú recuperas tu tiempo para ",
      texto2b: "atender mejor",
      texto2c: ".",
      texto3: "Entras con tu correo, sin contraseña, desde el celular o la computadora.",
    },
    equipo: {
      titulo: "Tu equipo",
      sub: "Cuatro agentes, cada uno en lo suyo.",
      texto: "Toca a cualquiera para ver todo lo que hace.",
    },
    planes: {
      titulo: "Planes",
      texto: "Empieza gratis. One y Max abren por etapas: anótate en la lista y te avisamos.",
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
      equipo: "Lola, Clara, Víctor e Iris",
      etiqueta: "Lista de espera",
      titulo: "Anótate y te avisamos cuando abramos tu lugar",
      texto: "Para negocios que atienden personas. Solo necesitamos tu correo.",
      despuesTitulo: "Qué pasa después",
      despues: [
        { titulo: "Tu correo queda en la lista", texto: "No te pedimos nada más: ni teléfono, ni contraseña, ni datos de tu negocio." },
        {
          titulo: "Te escribimos cuando abramos tu lugar",
          texto: "Atendel abre por etapas: la conexión de Lola con tu WhatsApp y tu agenda llega poco a poco. Te avisamos a ese correo.",
        },
        {
          titulo: "Mientras, ya puedes empezar",
          texto: "Con Atendel Free entras hoy con tu correo, sin contraseña, y trabajas con Clara en tu correo. Y en Pruébalo platicas con los cuatro.",
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
      "Lola contesta tu WhatsApp y agenda, Clara lleva tu correo, Víctor trae de regreso a tus clientes e Iris hace el trabajo de oficina. Toca a cualquiera para ver su ficha.",
    hablar: "Habla con los agentes",
    verPrecios: "Ver precios",
    chatEtiqueta: "El chat",
    chatTitulo: "Pruébalos en el chat",
    chatTexto: "Escríbeles lo que necesitas, como en cualquier chat, o arma un grupo con los que quieras.",
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
    llegaCon: (nombre: string, plan: string) => `${nombre} llega con ${plan}. Mientras, puedes empezar gratis con Clara.`,
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
  },

  paginaAgente: {
    ruta: "Ruta",
    agentes: "Agentes",
    hablale: (nombre: string) => `Háblale a ${nombre}`,
    verFicha: "Ver su ficha",
    conversacionEtiqueta: (canal: string) => `Conversación de ejemplo · ${canal}`,
    tituloConversacion: {
      lola: "Así contesta Lola un WhatsApp",
      clara: "Así contesta Clara un correo",
      victor: "Así le da Víctor seguimiento a quien no agendó",
      iris: "Así le encargas trabajo a Iris",
    } as Record<IdAgente, string>,
    queHace: "Qué hace",
    todoLoQueHace: (nombre: string) => `Todo lo que hace ${nombre}`,
    paraEmpezar: "Para empezar",
    pidele: (nombre: string) => `Pídele algo a ${nombre}`,
    ideas: "Ideas de lo que le puedes pedir. Escríbeselas en el chat de prueba, como en cualquier chat.",
    planes: "Planes",
    enQuePlan: (nombre: string) => `En qué plan viene ${nombre}`,
    enLosTres: (nombre: string) => `${nombre} viene en los tres planes, también en el gratis: puedes empezar hoy.`,
    llegaCon: (nombre: string, plan: string) => `${nombre} llega con ${plan}. Mientras, puedes empezar gratis con Clara.`,
    desdeAqui: "Desde aquí",
    incluye: (nombre: string) => `Incluye a ${nombre}`,
    noViene: "No viene en este plan",
    verPreciosPlanes: "Ver precios y lo que trae cada plan",
    tuEquipo: "Tu equipo",
    otrosTres: "Los otros tres agentes",
  },

  planes: porPlan,
  tarjetasPlanes: {
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
      "Free para conocer a Clara, tu agente de correo. One para sumar a Lola en la atención por WhatsApp y citas. Max para tener a los cuatro.",
    planes: "Planes",
    compararEtiqueta: "Comparación",
    compararTitulo: "Quién trabaja contigo en cada plan",
    compararTexto: "Cada plan suma agentes y mensajes. Clara está en todos; Lola llega con One; Víctor e Iris, con Max.",
    antes: "Antes de decidir",
    preguntasTitulo: "Preguntas sobre los planes",
    cierreTitulo: "Pruébalos antes de decidir.",
    cierreTexto: "Platica con Lola, Clara, Víctor e Iris en el chat de demostración, o anótate para saber cuándo abren One y Max.",
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
    mensajesMes: "Mensajes al mes",
    funciones: ["Chats en grupo con tus agentes", "Eliges quién está en tu equipo", "Respuestas más elaboradas"],
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
      empezar: { nombre: "Para empezar", preguntas: [...pregunta("¿Es difícil"), ...pregunta("¿Sirve para mi negocio"), ...pregunta("¿Qué puedo usar")] },
      planes: {
        nombre: "Planes y precios",
        preguntas: [
          ...pregunta("¿Qué incluye cada plan"),
          {
            p: "¿Cuánto cuesta?",
            r: "Atendel Free es gratis. Los precios de Atendel One y Atendel Max todavía no se publican: déjanos tu correo en la lista de espera y te avisamos cuando abran.",
          },
          { p: "¿Necesito tarjeta para empezar?", r: "No. Entras con tu correo, sin contraseña, y empiezas a trabajar con Clara, tu agente de correo." },
          {
            p: "¿Qué pasa si se me acaban los mensajes?",
            r: "El chat te avisa que llegaste a los mensajes del mes (30 en Free, 600 en One y 3,000 en Max) y deja de enviar hasta el mes siguiente, cuando el conteo empieza de nuevo.",
          },
          {
            p: "¿Cómo cambio de plan?",
            r: "Por ahora no se cambia desde tu cuenta: One y Max abren por etapas. Anótate en la lista de espera y te escribimos cuando abramos tu lugar.",
          },
          {
            p: "¿Puedo elegir qué agentes uso?",
            r: "Sí, con Max: en tu panel, en Mis agentes, decides quién está en tu equipo: Lola, Clara, Víctor e Iris.",
          },
        ],
      },
      clientes: { nombre: "Con tus clientes", preguntas: [...pregunta("¿Mis clientes"), ...pregunta("¿Qué pasa si un agente")] },
      datos: { nombre: "Tus datos", preguntas: pregunta("¿Qué pasa con mis datos") },
    } as Record<"empezar" | "planes" | "clientes" | "datos", { nombre: string; preguntas: Pregunta[] }>,
    garantias: GARANTIAS.map(([titulo, texto]) => ({ titulo, texto })),
  },

  paraQuien: {
    etiqueta: "Para quién es",
    titulo: "Para negocios que atienden personas.",
    texto: "Si tu negocio vive de atender, agendar y que tus clientes regresen, el equipo de Atendel hace esa parte contigo.",
    hablar: "Habla con los agentes",
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

  entrar: {
    inicio: "Atendel, inicio",
    correoNoValido: "Ese correo no parece válido. Revisa que esté bien escrito.",
    variosLinks: "Pediste varios links seguidos. Espera un minuto y vuelve a intentar.",
    sinConexion: "No hay conexión. Revisa tu internet e intenta de nuevo.",
    noSeEnvio: "No se pudo enviar el link. Intenta de nuevo en un momento.",
    noInicio: "No se pudo iniciar sesión. Pide un link nuevo y ábrelo en este mismo navegador.",
    escribeCorreo: "Escribe tu correo para mandarte el link.",
    revisaCorreo: "Revisa tu correo: parece que le falta algo (por ejemplo, nombre@negocio.com).",
    tituloEnviado: "Revisa tu correo",
    titulo: "Entra a Atendel",
    formulario: "Entrar con tu correo",
    correo: "Correo electrónico",
    ayuda: "Te mandamos un link para entrar. Sin contraseña.",
    enviando: "Enviando…",
    enviar: "Enviarme el link",
    o: "o",
    google: "Continuar con Google",
    linkEnviado: "Link enviado",
    mandamosA: "Te mandamos un link a ",
    abrelo: ". Ábrelo en este mismo navegador para entrar.",
    noLlega: "¿No llega? Revisa Spam o Promociones. Puede tardar un par de minutos.",
    otroCorreo: "Usar otro correo",
    primeraVez: "¿Primera vez? Escribe tu correo y tu cuenta se crea al entrar, con el plan Free.",
    verPlanes: "Ver los planes",
  },

  noEncontrada: {
    etiqueta: "Error 404",
    titulo: "Esta página no existe",
    texto: "Puede que el enlace esté mal escrito o que la página haya cambiado de lugar.",
    volver: "Volver al inicio",
    sigue: "O sigue por aquí",
    atajos: [
      { href: "/agentes", titulo: "Agentes", texto: "Lola, Clara, Víctor e Iris: qué hace cada uno" },
      { href: "/precios", titulo: "Precios", texto: "Qué trae Free, One y Max" },
      { href: "/preguntas", titulo: "Posibles preguntas", texto: "Cómo se empieza y cómo cuidamos tus datos" },
      { href: "/pruebalo", titulo: "Pruébalo", texto: "Platica con los agentes en un chat de ejemplo" },
    ],
  },
};

/** La forma de los textos: el inglés tiene que traer exactamente lo mismo. */
export type Diccionario = typeof es;
