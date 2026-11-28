import { forwardRef, type CSSProperties } from "react";
import "./chat-portada.css";

/**
 * EL CHAT DE LA PORTADA (era una vista previa; hoy ninguna página lo usa): en lugar del cerebro, un
 * resumen del chat de Atendel con el aspecto del panel de verdad (su barra, tu burbuja gris, la
 * tarjeta del equipo, la tarjeta de la cita que espera tu OK y la caja de abajo), sin ser una
 * copia: una sola plática corta. Es solo un dibujo (no se escribe en él): va dentro del fondo,
 * escondido para lectores de pantalla. FondoFiguras lo coloca y lo desvanece con el scroll.
 * Datos de ejemplo, como en /pruebalo.
 */

const TEXTOS = {
  es: {
    titulo: "Confirma las citas de mañana",
    pide: "Confirma las citas de mañana",
    encargo: "Atendel le encargó a",
    quien: "Aura",
    que: "Confirmar las 6 citas de mañana",
    listo: "Listo",
    responde: "Listo: 5 de 6 confirmadas. Carla pidió cambiar a las 17:00 y hay lugar.",
    cita: "Cita · cambio de hora",
    ok: "Necesita tu OK",
    nombre: "Carla Díaz",
    antes: "Antes",
    ahora: "Ahora",
    antesHora: "Mañana 16:00",
    ahoraHora: "Mañana 17:00",
    aprobar: "Aprobar",
    caja: "Pídele algo a Atendel…",
  },
  en: {
    titulo: "Confirm tomorrow's appointments",
    pide: "Confirm tomorrow's appointments",
    encargo: "Atendel handed it to",
    quien: "Aura",
    que: "Confirm tomorrow's 6 appointments",
    listo: "Done",
    responde: "Done: 5 of 6 confirmed. Carla asked to move to 5 pm and there's room.",
    cita: "Appointment · new time",
    ok: "Needs your OK",
    nombre: "Carla Díaz",
    antes: "Before",
    ahora: "Now",
    antesHora: "Tomorrow 4:00 pm",
    ahoraHora: "Tomorrow 5:00 pm",
    aprobar: "Approve",
    caja: "Ask Atendel anything…",
  },
};

export const ChatPortada = forwardRef<HTMLDivElement, { idioma?: string }>(function ChatPortada({ idioma }, ref) {
  const d = idioma === "es" || !idioma ? TEXTOS.es : TEXTOS.en;
  const pieza = (n: number) => ({ "data-pieza": "", style: { "--n": n } as CSSProperties });
  return (
    <div ref={ref} className="chat-portada">
      <div className="chat-portada__cabeza">
        <span className="chat-portada__marca" aria-hidden="true">
          <i style={{ background: "#ff7a59" }} />
          <i style={{ background: "#6ea8ff" }} />
          <i style={{ background: "#3ccf91" }} />
          <i style={{ background: "#ffc83d" }} />
        </span>
        {d.titulo}
        <svg className="chat-portada__flecha" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="chat-portada__cuerpo">
        <p className="chat-portada__tu" {...pieza(0)}>
          {d.pide}
        </p>
        <div className="chat-portada__equipo" {...pieza(1)}>
          <span className="chat-portada__cara" style={{ background: "#ff8a6b" }} aria-hidden="true" />
          <span className="chat-portada__textos">
            <span>
              {d.encargo} <b>{d.quien}</b>
            </span>
            <span>{d.que}</span>
          </span>
          <span className="chat-portada__listo">
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {d.listo}
          </span>
        </div>
        <p className="chat-portada__atendel" {...pieza(2)}>
          {d.responde}
        </p>
        <div className="chat-portada__tarjeta" {...pieza(3)}>
          <div className="chat-portada__tarjeta-cabeza">
            <span>
              <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                <rect x="2.5" y="3.5" width="11" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              {d.cita}
            </span>
            <span className="chat-portada__chip">{d.ok}</span>
          </div>
          <b className="chat-portada__nombre">{d.nombre}</b>
          <dl className="chat-portada__filas">
            <dt>{d.antes}</dt>
            <dd>{d.antesHora}</dd>
            <dt>{d.ahora}</dt>
            <dd>{d.ahoraHora}</dd>
          </dl>
          <span className="chat-portada__aprobar">{d.aprobar}</span>
        </div>
      </div>
      <div className="chat-portada__caja" {...pieza(4)}>
        <span className="chat-portada__mas" aria-hidden="true">
          +
        </span>
        <span className="chat-portada__placeholder">{d.caja}</span>
        <svg className="chat-portada__mic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <rect x="9" y="3.5" width="6" height="11" rx="3" />
          <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
        </svg>
      </div>
    </div>
  );
});
