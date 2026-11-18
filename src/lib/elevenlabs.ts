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

/** Por qué falló (para decirlo en pantalla): el código HTTP y el código corto de ElevenLabs, nunca su mensaje. */
export type FalloVoz = { status: number; codigo: string };

/** El código corto del error de ElevenLabs ({ detail: { status | code } }), limpio. */
async function codigoDe(r: Response): Promise<string> {
  const j = (await r.json().catch(() => null)) as { detail?: { status?: unknown; code?: unknown } | unknown } | null;
  const d = j && typeof j.detail === "object" && j.detail ? (j.detail as { status?: unknown; code?: unknown }) : null;
  const c = String(d?.status ?? d?.code ?? `http_${r.status}`);
  return c.replace(/[^a-z0-9_]/gi, "").slice(0, 60) || `http_${r.status}`;
}

async function idDeVoz(): Promise<{ id: string } | { fallo: FalloVoz }> {
  const fija = (process.env.ELEVENLABS_VOZ_ID ?? "").trim();
  if (ID_VOZ.test(fija)) return { id: fija };
  if (vozGuardada && vozGuardada.hasta > Date.now()) return { id: vozGuardada.id };
  try {
    const r = await fetch(`${BASE}/v1/voices`, { headers: { "xi-api-key": llave() }, signal: AbortSignal.timeout(10_000), cache: "no-store" });
    if (!r.ok) return { fallo: { status: r.status, codigo: `voces_${await codigoDe(r)}` } };
    const j = (await r.json()) as { voices?: VozApi[] };
    const voces = (j.voices ?? []).filter((v) => typeof v.voice_id === "string" && ID_VOZ.test(v.voice_id));
    if (!voces.length) return { fallo: { status: 0, codigo: "sin_voces" } };
    const mejor = voces.reduce((a, b) => (puntos(b) > puntos(a) ? b : a));
    vozGuardada = { id: String(mejor.voice_id), hasta: Date.now() + 3_600_000 };
    return { id: vozGuardada.id };
  } catch {
    return { fallo: { status: 0, codigo: "voces_sin_conexion" } };
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

/** Si el modelo elegido no está (o no viene en tu plan), se prueban estos, en orden. */
const RESPALDOS = ["eleven_flash_v2_5", "eleven_multilingual_v2"];
/** El modelo que ya funcionó (para no volver a probar los que fallan en cada frase). */
let modeloQueSirve: string | null = null;

/**
 * Dice una frase: el audio (MP3) en streaming, o por qué falló.
 * `antes`: lo que dijo justo antes (para que suene seguido).
 */
export async function hablar(texto: string, antes?: string): Promise<{ audio: ReadableStream<Uint8Array> } | { fallo: FalloVoz }> {
  const voz = await idDeVoz();
  if ("fallo" in voz) return voz;
  const modelos = [...new Set([modeloQueSirve ?? modeloHablar(), modeloHablar(), ...RESPALDOS])];
  let fallo: FalloVoz = { status: 0, codigo: "sin_respuesta" };
  for (const modelo of modelos) {
    try {
      const r = await fetch(`${BASE}/v1/text-to-speech/${encodeURIComponent(voz.id)}/stream?output_format=mp3_44100_64`, {
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
      if (r.ok && r.body) {
        modeloQueSirve = modelo;
        return { audio: r.body };
      }
      fallo = { status: r.status, codigo: await codigoDe(r) };
      console.error("Voz: no se pudo hablar", { modelo, ...fallo });
      // Clave mala, sin saldo o demasiadas peticiones: otro modelo no lo arregla
      if (r.status === 401 || r.status === 402 || r.status === 429) break;
      // La voz guardada ya no existe: se vuelve a escoger la próxima vez
      if (/voice/i.test(fallo.codigo)) vozGuardada = null;
    } catch {
      fallo = { status: 0, codigo: "sin_conexion" };
    }
  }
  return { fallo };
}
