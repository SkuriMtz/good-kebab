import "server-only";

/*
 * LA VOZ DEL MODO PLÁTICA (ElevenLabs), solo en el servidor:
 * - escuchar: el audio que grabó el navegador → texto (Scribe);
 * - hablar: una frase → audio MP3 (en streaming).
 * La clave va SOLO en Vercel como ELEVENLABS_API_KEY (nunca en el código ni
 * en el navegador). Opcionales: ELEVENLABS_VOZ_ID (la voz que elijas en tu
 * cuenta de ElevenLabs; si no, se toma una en español de tu cuenta) y
 * ELEVENLABS_MODELO (por omisión, el de tiempo real).
 */

const BASE = "https://api.elevenlabs.io";
const MODELO_HABLAR_PREDETERMINADO = "eleven_v4_turbo";
const MODELO_ESCUCHAR = "scribe_v3";

/** Sin espacios ni caracteres invisibles que se cuelan al pegar. */
const llave = () => (process.env.ELEVENLABS_API_KEY ?? "").replace(/[^\x21-\x7E]/g, "");

/** ¿Está puesta la clave? (si no, el modo plática no se muestra) */
export const vozDisponible = () => llave().length > 0;

const modeloHablar = () => {
  const m = (process.env.ELEVENLABS_MODELO ?? "").trim();
  return /^[a-z0-9_]{3,40}$/.test(m) ? m : MODELO_HABLAR_PREDETERMINADO;
};

/* ---------- La voz ---------- */

let vozGuardada: { id: string; hasta: number } | null = null;
const ID_VOZ = /^[A-Za-z0-9]{10,40}$/;

type VozApi = { voice_id?: unknown; labels?: Record<string, unknown> | null; verified_languages?: { language?: unknown; accent?: unknown; locale?: unknown }[] | null };

/** Qué tan bien le queda la voz al español de México (más es mejor). */
function puntos(v: VozApi): number {
  const idiomas = (v.verified_languages ?? []).map((l) => `${String(l.language ?? "")} ${String(l.accent ?? "")} ${String(l.locale ?? "")}`.toLowerCase());
  const etiquetas = Object.values(v.labels ?? {})
    .map((x) => String(x).toLowerCase())
    .join(" ");
  const todo = `${idiomas.join(" ")} ${etiquetas}`;
  if (/mex|es-mx/.test(todo)) return 3;
  if (/latin|lat-am|es-419/.test(todo)) return 2;
  if (/\bes\b|spanish|español/.test(todo)) return 1;
  return 0;
}

async function idDeVoz(): Promise<string | null> {
  const fija = (process.env.ELEVENLABS_VOZ_ID ?? "").trim();
  if (ID_VOZ.test(fija)) return fija;
  if (vozGuardada && vozGuardada.hasta > Date.now()) return vozGuardada.id;
  try {
    const r = await fetch(`${BASE}/v1/voices`, { headers: { "xi-api-key": llave() }, signal: AbortSignal.timeout(10_000), cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as { voices?: VozApi[] };
    const voces = (j.voices ?? []).filter((v) => typeof v.voice_id === "string" && ID_VOZ.test(v.voice_id));
    if (!voces.length) return null;
    const mejor = voces.reduce((a, b) => (puntos(b) > puntos(a) ? b : a));
    vozGuardada = { id: String(mejor.voice_id), hasta: Date.now() + 3_600_000 };
    return vozGuardada.id;
  } catch {
    return null;
  }
}

/* ---------- Escuchar ---------- */

/** Pasa a texto lo que dijo. `segundos`: cuánto duró el audio (para el costo). null si falló. */
export async function escuchar(audio: Blob, nombre: string): Promise<{ texto: string; segundos: number } | null> {
  const datos = new FormData();
  datos.append("model_id", MODELO_ESCUCHAR);
  datos.append("language_code", "es");
  datos.append("tag_audio_events", "false");
  datos.append("file", audio, nombre);
  try {
    const r = await fetch(`${BASE}/v1/speech-to-text`, { method: "POST", headers: { "xi-api-key": llave() }, body: datos, signal: AbortSignal.timeout(30_000), cache: "no-store" });
    if (!r.ok) {
      console.error("Voz: no se pudo escuchar", r.status);
      return null;
    }
    const j = (await r.json()) as { text?: unknown; audio_duration_secs?: unknown; words?: { end?: unknown }[] };
    const ultima = Array.isArray(j.words) && j.words.length ? Number(j.words[j.words.length - 1]?.end) : NaN;
    const segundos = Number.isFinite(Number(j.audio_duration_secs)) ? Number(j.audio_duration_secs) : Number.isFinite(ultima) ? ultima : audio.size / 16_000;
    return { texto: typeof j.text === "string" ? j.text.trim() : "", segundos };
  } catch {
    return null;
  }
}

/* ---------- Hablar ---------- */

/** Dice una frase. Regresa el audio (MP3) en streaming, o null si falló. `antes`: lo que dijo justo antes (para que suene seguido). */
export async function hablar(texto: string, antes?: string): Promise<ReadableStream<Uint8Array> | null> {
  const voz = await idDeVoz();
  if (!voz) return null;
  const modelo = modeloHablar();
  try {
    const r = await fetch(`${BASE}/v1/text-to-speech/${encodeURIComponent(voz)}/stream?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "xi-api-key": llave(), "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: texto,
        model_id: modelo,
        language_code: "es",
        ...(antes ? { previous_text: antes.slice(-300) } : {}),
        // Los modelos Flash no leen bien números y fechas si no se les pide
        apply_text_normalization: modelo.startsWith("eleven_flash") ? "on" : "auto",
      }),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    if (!r.ok || !r.body) {
      console.error("Voz: no se pudo hablar", r.status);
      return null;
    }
    return r.body;
  } catch {
    return null;
  }
}
