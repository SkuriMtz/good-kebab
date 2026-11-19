/*
 * LA VOZ DE ATENDEL (Ajustes → Apariencia): 4 voces para escoger, 2 de mujer
 * y 2 de hombre. Sus nombres cambian según el idioma del panel (Sofía en
 * español, Sophie en inglés, ソフィア en japonés…) y al tocar una se oye una
 * muestra en ese idioma. Piezas sin efectos, para el navegador y el servidor.
 */

export type GeneroVoz = "mujer" | "hombre";

/** Los 4 lugares de la lista: [mujer, hombre, mujer, hombre]. */
export const LUGARES_VOZ: readonly GeneroVoz[] = ["mujer", "hombre", "mujer", "hombre"];

/** Los nombres de los 4 lugares, por idioma (la parte antes del guion: «es», «en», «zh-TW» va aparte). */
const NOMBRES: Record<string, readonly [string, string, string, string]> = {
  es: ["Sofía", "Mateo", "Lucía", "Daniel"],
  gl: ["Sofía", "Mateo", "Lucía", "Daniel"],
  ca: ["Sofia", "Mateu", "Lucia", "Daniel"],
  eu: ["Sofia", "Mateo", "Luzia", "Daniel"],
  en: ["Sophie", "Matthew", "Lucy", "Daniel"],
  pt: ["Sofia", "Mateus", "Lúcia", "Daniel"],
  fr: ["Sophie", "Mathieu", "Lucie", "Daniel"],
  de: ["Sophie", "Matthias", "Lucia", "Daniel"],
  it: ["Sofia", "Matteo", "Lucia", "Daniele"],
  nl: ["Sophie", "Matthijs", "Lucia", "Daniël"],
  af: ["Sofie", "Matteus", "Lucia", "Daniël"],
  pl: ["Zofia", "Mateusz", "Łucja", "Daniel"],
  cs: ["Žofie", "Matěj", "Lucie", "Daniel"],
  sk: ["Žofia", "Matej", "Lucia", "Daniel"],
  hu: ["Zsófia", "Máté", "Luca", "Dániel"],
  ro: ["Sofia", "Matei", "Lucia", "Daniel"],
  hr: ["Sofija", "Matej", "Lucija", "Daniel"],
  sl: ["Zofija", "Matej", "Lucija", "Daniel"],
  sr: ["Софија", "Матеја", "Луција", "Данијел"],
  bg: ["София", "Матей", "Лусия", "Даниел"],
  ru: ["София", "Матвей", "Люсия", "Даниил"],
  uk: ["Софія", "Матвій", "Луція", "Данило"],
  el: ["Σοφία", "Ματθαίος", "Λουκία", "Δανιήλ"],
  sv: ["Sofia", "Mattias", "Lucia", "Daniel"],
  nb: ["Sofie", "Mathias", "Lucia", "Daniel"],
  da: ["Sofie", "Mathias", "Lucia", "Daniel"],
  fi: ["Sofia", "Matias", "Lucia", "Daniel"],
  is: ["Soffía", "Matthías", "Lúsía", "Daníel"],
  et: ["Sofia", "Mattias", "Lucia", "Daniel"],
  lv: ["Sofija", "Matīss", "Lūcija", "Daniels"],
  lt: ["Sofija", "Matas", "Liucija", "Danielius"],
  tr: ["Sofya", "Mateo", "Lusya", "Daniel"],
  ar: ["صوفيا", "ماتيو", "لوسيا", "دانيال"],
  he: ["סופיה", "מתיו", "לוסיה", "דניאל"],
  fa: ["سوفیا", "ماتئو", "لوسیا", "دانیال"],
  ur: ["صوفیہ", "میتھیو", "لوسیا", "ڈینیئل"],
  hi: ["सोफ़िया", "मैथ्यू", "लूसिया", "डेनियल"],
  bn: ["সোফিয়া", "ম্যাথিউ", "লুসিয়া", "ড্যানিয়েল"],
  ta: ["சோஃபியா", "மத்தேயு", "லூசியா", "டேனியல்"],
  th: ["โซเฟีย", "แมทธิว", "ลูเซีย", "แดเนียล"],
  zh: ["索菲亚", "马修", "露西亚", "丹尼尔"],
  "zh-TW": ["索菲亞", "馬修", "露西亞", "丹尼爾"],
  ja: ["ソフィア", "マシュー", "ルシア", "ダニエル"],
  ko: ["소피아", "매튜", "루시아", "다니엘"],
};
/** Para los idiomas que no están arriba (indonesio, filipino, suajili, guaraní, náhuatl…). */
const NOMBRES_GENERALES = ["Sofia", "Mateo", "Lucia", "Daniel"] as const;

const base = (idioma: string) => idioma.split("-")[0].toLowerCase();

/** Los nombres de los 4 lugares en ese idioma del panel («es-MX», «en-US», «zh-TW»…). */
export function nombresDeVoces(idioma: string): readonly [string, string, string, string] {
  return NOMBRES[idioma] ?? NOMBRES[base(idioma)] ?? NOMBRES_GENERALES;
}

/** «Hola, soy {nombre}…»: lo que dice la muestra, en ese idioma (si no está, en inglés). */
const MUESTRAS: Record<string, string> = {
  es: "Hola, soy {nombre}. Así va a sonar Atendel cuando platiquemos.",
  ca: "Hola, sóc {nombre}. Així sonarà Atendel quan parlem.",
  gl: "Ola, son {nombre}. Así soará Atendel cando falemos.",
  en: "Hi, I'm {nombre}. This is how Atendel will sound when we talk.",
  pt: "Olá, eu sou {nombre}. É assim que a Atendel vai soar quando conversarmos.",
  fr: "Bonjour, je suis {nombre}. Voici comment Atendel sonnera quand nous parlerons.",
  de: "Hallo, ich bin {nombre}. So klingt Atendel, wenn wir miteinander sprechen.",
  it: "Ciao, sono {nombre}. Ecco come suonerà Atendel quando parleremo.",
  nl: "Hallo, ik ben {nombre}. Zo klinkt Atendel als we praten.",
  pl: "Cześć, jestem {nombre}. Tak będzie brzmiał Atendel, gdy będziemy rozmawiać.",
  ru: "Привет, я {nombre}. Так будет звучать Atendel, когда мы будем разговаривать.",
  uk: "Привіт, я {nombre}. Так звучатиме Atendel, коли ми розмовлятимемо.",
  tr: "Merhaba, ben {nombre}. Konuştuğumuzda Atendel böyle duyulacak.",
  ar: "مرحبًا، أنا {nombre}. هكذا سيبدو صوت Atendel عندما نتحدث.",
  hi: "नमस्ते, मैं {nombre} हूँ। जब हम बात करेंगे, तो Atendel ऐसा सुनाई देगा।",
  zh: "你好，我是{nombre}。我们聊天时，Atendel 就是这个声音。",
  ja: "こんにちは、{nombre}です。お話しするとき、Atendel はこんな声になります。",
  ko: "안녕하세요, {nombre}입니다. 대화할 때 Atendel은 이런 목소리예요.",
};

export function textoDeMuestra(idioma: string, nombre: string): string {
  return (MUESTRAS[base(idioma)] ?? MUESTRAS.en).replace("{nombre}", nombre);
}

/** El código de idioma para la voz y el dictado (ISO 639-1, «es», «en»…), o undefined si no es de dos letras. */
export function codigoIdioma(idioma: string): string | undefined {
  const b = base(idioma);
  return /^[a-z]{2}$/.test(b) ? b : undefined;
}

/** Así se ve un id de voz de ElevenLabs. */
export const ID_VOZ = /^[A-Za-z0-9]{10,40}$/;
