import type { Metadata } from "next";
import QRCode from "qrcode";
import { Sitio } from "@/components/Sitio";
import { BotonesInstalar } from "@/components/descargar/BotonesInstalar";
import { idiomaServidor } from "@/i18n/servidor";
import { SITIO } from "@/lib/sitio";
import "@/components/descargar/descargar.css";

export const metadata: Metadata = {
  title: "Descargar",
  description: "Instala Atendel en tu celular o tu computadora desde el navegador, gratis y sin tiendas de apps.",
};

/*
 * DESCARGAR: cómo tener Atendel en el celular y la compu. Atendel no está en tiendas de apps: es
 * una app web que se instala desde el navegador (ícono propio, pantalla completa y avisos). A la
 * izquierda, el título, el QR (abre esta página en el celular) y los botones de iPhone y Android;
 * a la derecha, un celular con la app (datos de ejemplo). Abajo, los pasos de cada aparato.
 * Textos en español e inglés (los demás idiomas usan el inglés).
 */

const TEXTOS = {
  es: {
    nuevo: "Nuevo",
    aviso: "Los avisos de tu equipo llegan al momento a tu celular",
    titulo: "Lleva a Atendel en tu celular",
    texto: "Se instala gratis desde el navegador, sin tiendas de apps. Tu equipo y sus avisos, siempre a la mano.",
    qr: "Escanéalo con la cámara de tu celular",
    botones: { en: "Instálalo en", iphone: "iPhone", android: "Android", compu: "¿En tu compu? Úsalo desde el navegador.", entrar: "Entrar", instalada: "Ya tienes Atendel instalado en este aparato." },
    pasosTitulo: "Cómo se instala",
    pasos: [
      { id: "iphone", titulo: "iPhone", nota: "En Safari", lista: ["Abre esta página en Safari.", "Toca Compartir.", "Toca «Agregar a inicio» y listo: Atendel queda con su ícono."] },
      { id: "android", titulo: "Android", nota: "En Chrome", lista: ["Abre esta página en Chrome.", "Toca «Instalar app» (o el menú ⋮ → Instalar app).", "Ábrelo desde tu pantalla de inicio."] },
      { id: "compu", titulo: "Computadora", nota: "En Chrome o Edge", lista: ["Abre Atendel en el navegador.", "Haz clic en el ícono de instalar de la barra de direcciones.", "Atendel se abre en su propia ventana."] },
    ],
    cel: { saludo: "Buenas tardes, Ana", aviso: "Aura confirmó las 6 citas de mañana", sugerencias: ["¿Qué es urgente en mi correo?", "Pide reseña a los clientes de hoy", "Hazme el reporte del mes"], caja: "Pídele algo a Atendel…" },
  },
  en: {
    nuevo: "New",
    aviso: "Your team's alerts reach your phone right away",
    titulo: "Take Atendel on your phone",
    texto: "Install it free from your browser, no app store needed. Your team and its alerts, always at hand.",
    qr: "Scan it with your phone's camera",
    botones: { en: "Install it on", iphone: "iPhone", android: "Android", compu: "On your computer? Use it from the browser.", entrar: "Sign in", instalada: "Atendel is already installed on this device." },
    pasosTitulo: "How to install it",
    pasos: [
      { id: "iphone", titulo: "iPhone", nota: "In Safari", lista: ["Open this page in Safari.", "Tap Share.", "Tap “Add to Home Screen” and you're done: Atendel gets its own icon."] },
      { id: "android", titulo: "Android", nota: "In Chrome", lista: ["Open this page in Chrome.", "Tap “Install app” (or the ⋮ menu → Install app).", "Open it from your home screen."] },
      { id: "compu", titulo: "Computer", nota: "In Chrome or Edge", lista: ["Open Atendel in your browser.", "Click the install icon in the address bar.", "Atendel opens in its own window."] },
    ],
    cel: { saludo: "Good afternoon, Ana", aviso: "Aura confirmed tomorrow's 6 appointments", sugerencias: ["What's urgent in my email?", "Ask today's clients for a review", "Make this month's report"], caja: "Ask Atendel anything…" },
  },
};

export default async function Descargar() {
  const idioma = await idiomaServidor();
  const t = idioma === "es" ? TEXTOS.es : TEXTOS.en;
  // El QR abre esta misma página en el celular (lo genera el servidor; es un dibujo SVG fijo)
  const qr = await QRCode.toString(`${SITIO}/descargar`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0b0b0c", light: "#ffffff" } });
  return (
    <Sitio cierre>
      <section className="dl-portada" aria-labelledby="dl-titulo">
        <div className="dl-texto">
          <p className="dl-pastilla">
            <span>{t.nuevo}</span>
            {t.aviso}
          </p>
          <h1 id="dl-titulo" className="dl-titulo">
            {t.titulo}
          </h1>
          <p className="dl-sub">{t.texto}</p>
          <div className="dl-acciones">
            <figure className="dl-qr">
              <div className="dl-qr__codigo" role="img" aria-label={t.qr} dangerouslySetInnerHTML={{ __html: qr }} />
              <figcaption>{t.qr}</figcaption>
            </figure>
            <BotonesInstalar t={t.botones} />
          </div>
        </div>
        <div className="dl-cel" aria-hidden="true">
          <div className="dl-cel__pantalla">
            <div className="dl-cel__estado">
              <span>9:41</span>
              <span className="dl-cel__iconos">
                <i />
                <i />
                <i />
              </span>
            </div>
            <div className="dl-cel__barra">
              <span className="dl-cel__boton">
                <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 6h14M3 10h14M3 14h9" />
                </svg>
              </span>
              <span className="dl-cel__marca">
                <i style={{ background: "#ff7a59" }} />
                <i style={{ background: "#6ea8ff" }} />
                <i style={{ background: "#3ccf91" }} />
                <i style={{ background: "#ffc83d" }} />
              </span>
              <span className="dl-cel__boton">
                <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M10 4v12M4 10h12" />
                </svg>
              </span>
            </div>
            <p className="dl-cel__saludo">{t.cel.saludo}</p>
            <div className="dl-cel__tarjetas">
              <span className="dl-cel__tarjeta dl-cel__tarjeta--lado" style={{ background: "#f6c64a" }} />
              <span className="dl-cel__tarjeta" style={{ background: "#ff8a6b" }}>
                {t.cel.aviso}
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.5" y="5" width="17" height="15" rx="3" />
                  <path d="M3.5 9.5h17M8 3v4M16 3v4M8.5 14.5l2.3 2.3 4.7-4.6" />
                </svg>
              </span>
              <span className="dl-cel__tarjeta dl-cel__tarjeta--lado" style={{ background: "#7fb2ff" }} />
            </div>
            <ul className="dl-cel__sugerencias">
              {t.cel.sugerencias.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="dl-cel__caja">
              <span>+</span>
              {t.cel.caja}
            </div>
            <span className="dl-cel__raya" />
          </div>
        </div>
      </section>

      <section className="dl-pasos" aria-labelledby="dl-pasos-titulo">
        <h2 id="dl-pasos-titulo" className="dl-pasos__titulo">
          {t.pasosTitulo}
        </h2>
        <ol className="dl-pasos__lista">
          {t.pasos.map((p) => (
            <li key={p.id} id={p.id} className="dl-paso">
              <p className="dl-paso__cabeza">
                <b>{p.titulo}</b>
                <span>{p.nota}</span>
              </p>
              <ol>
                {p.lista.map((x, k) => (
                  <li key={x}>
                    <span className="dl-paso__num">{k + 1}</span>
                    {x}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      </section>
    </Sitio>
  );
}
