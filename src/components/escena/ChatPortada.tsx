import { forwardRef, type CSSProperties } from "react";
import "./chat-portada.css";

/**
 * EL CHAT DE LA PORTADA (variante de prueba, /vista-chat): en lugar del
 * cerebro, una plática con Atendel como se ve en el panel, sin triangulitos.
 * Es solo un dibujo (no se escribe en él): va dentro del fondo, que está
 * escondido para lectores de pantalla. FondoFiguras lo mueve con el scroll y,
 * al bajar hacia el caos, lo desvanece mientras sus piezas ([data-pieza]) se
 * vuelven triangulitos. Datos de ejemplo, como en /pruebalo.
 */

const TEXTOS = {
  es: {
    pregunta: "¿Cómo va hoy?",
    intro: "Tu equipo ya se encargó de esto:",
    tareas: [
      { quien: "Aura", que: "Confirmó las citas de mañana", color: "#ff7a59" },
      { quien: "Altair", que: "Contestó 3 correos", color: "#6ea8ff" },
      { quien: "Rigel", que: "Pidió reseñas a las clientas de hoy", color: "#3ccf91" },
    ],
    listo: "Listo",
    ok: "Necesita tu OK",
    okTexto: "Mensaje para Rosa: ¿la cambio al jueves a las 5?",
    aprobar: "Aprobar",
    caja: "Pídele algo a Atendel…",
  },
  en: {
    pregunta: "How's today going?",
    intro: "Your team already took care of this:",
    tareas: [
      { quien: "Aura", que: "Confirmed tomorrow's appointments", color: "#ff7a59" },
      { quien: "Altair", que: "Answered 3 emails", color: "#6ea8ff" },
      { quien: "Rigel", que: "Asked today's clients for reviews", color: "#3ccf91" },
    ],
    listo: "Done",
    ok: "Needs your OK",
    okTexto: "Message for Rosa: move her to Thursday at 5?",
    aprobar: "Approve",
    caja: "Ask Atendel anything…",
  },
};

export const ChatPortada = forwardRef<HTMLDivElement, { idioma?: string }>(function ChatPortada({ idioma }, ref) {
  const d = idioma === "en" ? TEXTOS.en : TEXTOS.es;
  return (
    <div ref={ref} className="chat-portada">
      <div className="chat-portada__cabeza">
        <span className="chat-portada__marca" aria-hidden="true">
          <i style={{ background: "#ff7a59" }} />
          <i style={{ background: "#6ea8ff" }} />
          <i style={{ background: "#3ccf91" }} />
          <i style={{ background: "#ffc83d" }} />
        </span>
        Atendel
      </div>
      <div className="chat-portada__cuerpo">
        <p className="chat-portada__tu" data-pieza style={{ "--n": 0 } as CSSProperties}>
          {d.pregunta}
        </p>
        <p className="chat-portada__atendel" data-pieza style={{ "--n": 1 } as CSSProperties}>
          {d.intro}
        </p>
        <ul className="chat-portada__tareas">
          {d.tareas.map((t, i) => (
            <li key={t.quien} className="chat-portada__tarea" data-pieza style={{ "--n": 2 + i } as CSSProperties}>
              <span className="chat-portada__cara" style={{ background: t.color }} aria-hidden="true" />
              <span className="chat-portada__textos">
                <b>{t.quien}</b>
                <span>{t.que}</span>
              </span>
              <span className="chat-portada__listo">
                <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                  <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {d.listo}
              </span>
            </li>
          ))}
        </ul>
        <div className="chat-portada__ok" data-pieza style={{ "--n": 5 } as CSSProperties}>
          <span className="chat-portada__ok-h">{d.ok}</span>
          <span className="chat-portada__ok-texto">{d.okTexto}</span>
          <span className="chat-portada__aprobar">{d.aprobar}</span>
        </div>
      </div>
      <div className="chat-portada__caja" data-pieza>
        {d.caja}
        <span className="chat-portada__enviar" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
});
