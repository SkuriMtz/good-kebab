"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MarcaFragmentos } from "@/components/FragmentosMenu";
import { frasesListas } from "@/lib/platica";
import "./platica.css";

/*
 * MODO PLÁTICA: hablarle a Atendel y que conteste en voz, sin tocar nada
 * (como el modo de voz de ChatGPT).
 * 1. Escucha con el micrófono; cuando dejas de hablar (1.2 s de silencio),
 *    manda el audio a /api/platica/escuchar y regresa el texto.
 * 2. Ese texto va al chat de siempre (`preguntar`): queda escrito en la
 *    conversación y pasa por las mismas reglas (lo que necesita OK, espera).
 * 3. La respuesta se va diciendo por frases mientras llega
 *    (/api/platica/hablar), y al terminar vuelve a escuchar.
 * Tocar el logo mientras habla lo interrumpe. Pausa apaga el micrófono.
 * El audio no se guarda en Atendel.
 */

export type AlTextoVoz = (texto: string, fin: boolean, estado: string | null) => void;
/** Manda lo dicho al chat; regresa null si salió bien o el error. */
export type PreguntarVoz = (texto: string, alTexto: AlTextoVoz) => Promise<string | null>;

type Estado = "preparando" | "escuchando" | "oyendo" | "pensando" | "hablando" | "pausa" | "sinMicro" | "error";

const TEXTO_ESTADO: Record<Estado, string> = {
  preparando: "Preparando el micrófono…",
  escuchando: "Te escucho…",
  oyendo: "Te escucho…",
  pensando: "Pensando…",
  hablando: "Atendel está hablando. Toca el logo para interrumpir.",
  pausa: "En pausa",
  sinMicro: "Para platicar, permite el micrófono en tu navegador.",
  error: "",
};

/* ---------- El audio (uno para toda la página) ---------- */

let audioCompartido: AudioContext | null = null;

/** Créalo (o despiértalo) al tocar el botón: en iPhone el audio solo arranca con un toque. */
export function prepararAudio() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCompartido || audioCompartido.state === "closed") audioCompartido = new Ctx();
    void audioCompartido.resume().catch(() => undefined);
  } catch {
    /* sin audio: el modo plática lo dirá */
  }
}

const TIPOS_GRABAR = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"];
const tipoGrabar = () => (typeof MediaRecorder === "undefined" ? "" : (TIPOS_GRABAR.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? ""));

/** Qué tan fuerte suena (0 a 1) lo que pasa por un analizador. */
function volumen(a: AnalyserNode | null, buf: Float32Array<ArrayBuffer> | null, factor: number) {
  if (!a || !buf) return 0;
  a.getFloatTimeDomainData(buf);
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.min(1, Math.sqrt(s / buf.length) * factor);
}

export default function ModoPlatica({ abierto, alCerrar, preguntar, detener }: { abierto: boolean; alCerrar: () => void; preguntar: PreguntarVoz; detener: () => void }) {
  const [estado, setEstado] = useState<Estado>("preparando");
  const [nota, setNota] = useState<string | null>(null);

  const estadoRef = useRef<Estado>("preparando");
  const poner = useCallback((e: Estado) => {
    estadoRef.current = e;
    setEstado(e);
  }, []);
  const preguntarRef = useRef(preguntar);
  const detenerRef = useRef(detener);
  useEffect(() => {
    preguntarRef.current = preguntar;
    detenerRef.current = detener;
  }, [preguntar, detener]);

  // Todo lo que vive mientras está abierto
  const r = useRef({
    gen: 0,
    stream: null as MediaStream | null,
    micro: null as AnalyserNode | null,
    salida: null as AnalyserNode | null,
    buf: null as Float32Array<ArrayBuffer> | null,
    grabador: null as MediaRecorder | null,
    vigia: 0 as number,
    cola: [] as Promise<AudioBuffer | null>[],
    fuente: null as AudioBufferSourceNode | null,
    sonando: false,
    fin: false,
    hasta: 0,
    antes: "",
  });

  /** Qué tan fuerte se oye ahora (para mover el logo). */
  const nivel = useCallback(() => {
    const x = r.current;
    const e = estadoRef.current;
    if (e === "oyendo" || e === "escuchando") return volumen(x.micro, x.buf, 9) * (e === "oyendo" ? 1 : 0.6);
    if (e === "hablando") return volumen(x.salida, x.buf, 5);
    if (e === "pensando") return 0.12 + 0.08 * Math.sin(performance.now() / 260);
    return 0;
  }, []);

  /* ----- Apagar todo ----- */
  const callarse = useCallback(() => {
    const x = r.current;
    x.cola = [];
    x.sonando = false;
    try {
      x.fuente?.stop();
    } catch {
      /* ya había terminado */
    }
    x.fuente = null;
  }, []);

  const dejarDeGrabar = useCallback(() => {
    const x = r.current;
    window.clearInterval(x.vigia);
    x.vigia = 0;
    if (x.grabador && x.grabador.state !== "inactive") {
      x.grabador.ondataavailable = null;
      x.grabador.onstop = null;
      x.grabador.stop();
    }
    x.grabador = null;
  }, []);

  /* ----- Hablar ----- */
  const empezarRef = useRef<() => void>(() => {});

  const siguiente = useCallback(async () => {
    const x = r.current;
    const gen = x.gen;
    const p = x.cola.shift();
    if (!p) {
      x.sonando = false;
      // Ya dijo todo: a escuchar otra vez
      if (x.fin && estadoRef.current !== "pausa" && estadoRef.current !== "error") empezarRef.current();
      return;
    }
    x.sonando = true;
    const audio = await p;
    if (gen !== x.gen) return;
    const ctx = audioCompartido;
    if (!audio || !ctx || !x.salida) {
      void siguiente();
      return;
    }
    poner("hablando");
    const fuente = ctx.createBufferSource();
    fuente.buffer = audio;
    fuente.connect(x.salida);
    fuente.onended = () => {
      if (gen !== x.gen) return;
      x.fuente = null;
      void siguiente();
    };
    x.fuente = fuente;
    fuente.start();
  }, [poner]);

  const decir = useCallback(
    (frase: string) => {
      const x = r.current;
      const gen = x.gen;
      const antes = x.antes;
      x.antes = frase;
      const audio = (async () => {
        try {
          const res = await fetch("/api/platica/hablar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto: frase, antes }) });
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            // Si no puede hablar, se detiene y dice por qué (en pantalla); la respuesta queda escrita en el chat
            if (gen === x.gen) {
              x.gen++;
              callarse();
              setNota(j.error ?? "No pude hablar en este momento.");
              poner("error");
            }
            return null;
          }
          const datos = await res.arrayBuffer();
          if (!audioCompartido || gen !== x.gen) return null;
          return await audioCompartido.decodeAudioData(datos);
        } catch {
          return null;
        }
      })();
      x.cola.push(audio);
      if (!x.sonando) void siguiente();
    },
    [callarse, poner, siguiente],
  );

  /* ----- Preguntar ----- */
  const mandar = useCallback(
    async (texto: string) => {
      const x = r.current;
      const gen = x.gen;
      setNota(null);
      x.fin = false;
      x.hasta = 0;
      x.antes = "";
      poner("pensando");
      const error = await preguntarRef.current(texto, (acumulado, fin, linea) => {
        if (gen !== x.gen) return;
        const { frases, hasta } = frasesListas(acumulado, x.hasta, fin);
        x.hasta = hasta;
        for (const f of frases) decir(f);
        // Lo que está haciendo (revisar tu cuenta, contar…) mientras lo hace; luego se quita
        if (linea) setNota(linea);
        else if (acumulado) setNota((n) => (n && n.endsWith("…") ? null : n));
        if (fin) x.fin = true;
      });
      if (gen !== x.gen) return;
      if (error) {
        callarse();
        setNota(error);
        poner("error");
        return;
      }
      x.fin = true;
      // Si no hubo nada que decir (o ya lo dijo todo), a escuchar
      if (!x.sonando && !x.cola.length) empezarRef.current();
    },
    [callarse, decir, poner],
  );

  /* ----- Escuchar ----- */
  const escuchar = useCallback(() => {
    const x = r.current;
    if (!x.stream || !x.micro || !x.buf) return;
    dejarDeGrabar();
    const gen = x.gen;
    const tipo = tipoGrabar();
    let grabador: MediaRecorder;
    try {
      grabador = new MediaRecorder(x.stream, tipo ? { mimeType: tipo, audioBitsPerSecond: 32_000 } : undefined);
    } catch {
      setNota("Este navegador no puede grabar audio. Prueba con Chrome o Safari.");
      poner("error");
      return;
    }
    const partes: Blob[] = [];
    grabador.ondataavailable = (e) => {
      if (e.data.size) partes.push(e.data);
    };
    x.grabador = grabador;
    grabador.start(250);
    poner("escuchando");

    const inicio = performance.now();
    let hablo = false;
    let sobre = 0;
    let ultimo = inicio;
    let piso = 0.01;
    const terminar = () => {
      window.clearInterval(x.vigia);
      x.vigia = 0;
      grabador.onstop = async () => {
        if (gen !== x.gen) return;
        const audio = new Blob(partes, { type: (grabador.mimeType || tipo || "audio/webm").split(";")[0] });
        poner("pensando");
        try {
          const res = await fetch("/api/platica/escuchar", { method: "POST", headers: { "Content-Type": audio.type }, body: audio });
          const j = (await res.json().catch(() => ({}))) as { texto?: string; error?: string };
          if (gen !== x.gen) return;
          if (!res.ok) {
            setNota(j.error ?? "No te pude escuchar. Intenta otra vez.");
            poner("error");
            return;
          }
          const texto = (j.texto ?? "").trim();
          if (texto.length < 2) {
            setNota("No te escuché bien. Intenta otra vez.");
            empezarRef.current();
            return;
          }
          void mandar(texto);
        } catch {
          if (gen !== x.gen) return;
          setNota("Se perdió la conexión. Intenta otra vez.");
          poner("error");
        }
      };
      grabador.stop();
      x.grabador = null;
    };

    x.vigia = window.setInterval(() => {
      if (gen !== x.gen) return;
      const v = volumen(x.micro, x.buf, 1);
      const ahora = performance.now();
      const umbral = Math.max(0.015, piso * 2.6);
      if (v > umbral) {
        sobre += 50;
        if (sobre >= 150 && !hablo) {
          hablo = true;
          poner("oyendo");
          setNota(null);
        }
        ultimo = ahora;
      } else {
        sobre = 0;
        if (!hablo) piso = piso * 0.95 + v * 0.05;
      }
      // Dejó de hablar
      if (hablo && ahora - ultimo > 1200) terminar();
      // Un minuto como máximo por vez
      else if (ahora - inicio > 60_000) terminar();
      // 15 segundos sin hablar: se vuelve a empezar (para no mandar puro silencio)
      else if (!hablo && ahora - inicio > 15_000) empezarRef.current();
    }, 50);
  }, [dejarDeGrabar, mandar, poner]);

  useEffect(() => {
    empezarRef.current = () => {
      if (estadoRef.current === "pausa") return;
      escuchar();
    };
  }, [escuchar]);

  /* ----- Abrir y cerrar ----- */
  const terminarTodo = useCallback(() => {
    const x = r.current;
    x.gen++;
    dejarDeGrabar();
    callarse();
    x.stream?.getTracks().forEach((t) => t.stop());
    x.stream = null;
    x.micro?.disconnect();
    x.micro = null;
    x.salida?.disconnect();
    x.salida = null;
  }, [callarse, dejarDeGrabar]);

  const arrancar = useCallback(async () => {
    const x = r.current;
    const gen = ++x.gen;
    setNota(null);
    poner("preparando");
    prepararAudio();
    const ctx = audioCompartido;
    if (!ctx || !navigator.mediaDevices?.getUserMedia) {
      setNota("Este navegador no puede usar el micrófono. Prueba con Chrome o Safari.");
      poner("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (gen !== x.gen) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      x.stream = stream;
      const micro = ctx.createAnalyser();
      micro.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(micro);
      const salida = ctx.createAnalyser();
      salida.fftSize = 1024;
      salida.connect(ctx.destination);
      x.micro = micro;
      x.salida = salida;
      x.buf = new Float32Array(new ArrayBuffer(1024 * 4));
      escuchar();
    } catch {
      if (gen === x.gen) poner("sinMicro");
    }
  }, [escuchar, poner]);

  useEffect(() => {
    if (!abierto) return;
    // Al abrir: empezar (fuera del render, como lo pide React)
    const id = window.setTimeout(() => void arrancar(), 0);
    return () => {
      window.clearTimeout(id);
      terminarTodo();
    };
  }, [abierto, arrancar, terminarTodo]);

  /* ----- Botones ----- */
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    cerrarRef.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        alCerrar();
        return;
      }
      // El foco se queda dentro de la pantalla
      if (e.key !== "Tab" || !caja.current) return;
      const botones = Array.from(caja.current.querySelectorAll<HTMLElement>("button:not([disabled])"));
      if (!botones.length) return;
      const [primero, ultimo] = [botones[0], botones[botones.length - 1]];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [abierto, alCerrar]);

  const interrumpir = () => {
    const x = r.current;
    if (estadoRef.current !== "hablando" && estadoRef.current !== "pensando") return;
    x.gen++;
    callarse();
    detenerRef.current();
    setNota(null);
    escuchar();
  };

  const pausar = () => {
    if (estadoRef.current === "pausa") {
      poner("preparando");
      escuchar();
      return;
    }
    r.current.gen++;
    dejarDeGrabar();
    callarse();
    poner("pausa");
  };

  if (!abierto) return null;

  const listo = estado !== "preparando" && estado !== "sinMicro";
  const reintentar = estado === "sinMicro" || estado === "error";

  return (
    <div ref={caja} className="platica" role="dialog" aria-modal="true" aria-labelledby="platica-titulo" data-estado={estado}>
      <h2 id="platica-titulo" className="sr-only">
        Plática con Atendel
      </h2>
      <button type="button" className="platica__marca" onClick={interrumpir} aria-label={estado === "hablando" ? "Interrumpir a Atendel" : "Atendel"} tabIndex={estado === "hablando" || estado === "pensando" ? 0 : -1}>
        <MarcaFragmentos activo nivel={nivel} className="platica__lienzo" />
      </button>

      {/* Sin texto en pantalla (el logo dice si escucha, piensa o habla); el estado va para lectores
          de pantalla, y solo un problema (micrófono, límite) se ve */}
      <p className={reintentar ? "platica__error" : "sr-only"} role="status" aria-live="polite">
        {nota ?? TEXTO_ESTADO[estado]}
      </p>

      <div className="platica__botones">
        {reintentar ? (
          <button type="button" className="platica__icono" aria-label="Intentar de nuevo" onClick={() => (estado === "sinMicro" || !r.current.stream ? void arrancar() : escuchar())}>
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path d="M19 12a7 7 0 1 1-2.05-4.95M19 5v4h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <button type="button" className="platica__icono" onClick={pausar} disabled={!listo} aria-label={estado === "pausa" ? "Seguir platicando" : "Pausa"} aria-pressed={estado === "pausa"}>
            {estado === "pausa" ? (
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path d="M8.5 5.5v13M15.5 5.5v13" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            )}
          </button>
        )}
        <button ref={cerrarRef} type="button" className="platica__icono" aria-label="Terminar la plática" onClick={alCerrar}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
