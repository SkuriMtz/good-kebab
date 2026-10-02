"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Arrow, TriIcon, TriSpinner } from "./Buttons";

/**
 * "Míralo en acción": demo de ejemplo en la página de inicio (sin llamar a
 * la IA). Muestra un correo real de una clínica y el tipo de resumen que da
 * Atendel. Está marcado como ejemplo para no confundir a nadie.
 */
const EJEMPLOS = [
  {
    etiqueta: "Paciente quiere cita",
    de: "Laura Méndez",
    asunto: "Cita para limpieza dental",
    texto:
      "Hola, buenas tardes. Quisiera agendar una limpieza dental para la próxima semana, de preferencia el martes o jueves por la tarde después de las 5. ¿Tienen disponibilidad? También quería saber si aceptan seguro de gastos médicos. Gracias.",
    resumen: "Quiere una limpieza dental la próxima semana, martes o jueves después de las 5, y pregunta por seguros.",
    accion: "Ofrécele horarios del martes o jueves y confirma qué seguros aceptan.",
  },
  {
    etiqueta: "Pregunta de precios",
    de: "Andrea Ruiz",
    asunto: "Precio de depilación láser",
    texto:
      "¡Hola! Vi su publicación en Instagram. ¿Cuánto cuesta el paquete de depilación láser de piernas completas? ¿Tienen promoción este mes? Y cuántas sesiones se necesitan normalmente.",
    resumen: "Pide precio del paquete de láser en piernas completas, promociones del mes y número de sesiones.",
    accion: "Envíale precio, la promoción vigente y cuántas sesiones recomiendan.",
  },
  {
    etiqueta: "Cancelación",
    de: "Roberto Salinas",
    asunto: "No podré ir mañana",
    texto:
      "Buenos días, les escribo para avisar que no podré asistir a mi consulta de mañana a las 10:00 am por un tema de trabajo. ¿Me podrían reprogramar para el viernes? Una disculpa por el aviso tan tarde.",
    resumen: "Cancela su consulta de mañana a las 10:00 y pide moverla al viernes.",
    accion: "Libera el espacio de mañana y ofrécele horarios del viernes.",
  },
];

export function Demo() {
  const [actual, setActual] = useState(0);
  const [estado, setEstado] = useState<"esperando" | "leyendo" | "listo">("esperando");
  const [vuelta, setVuelta] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();

  const resumir = (i: number) => {
    window.clearTimeout(timer.current);
    setActual(i);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEstado("listo");
      setVuelta((n) => n + 1);
      return;
    }
    setEstado("leyendo");
    timer.current = window.setTimeout(() => {
      setEstado("listo");
      setVuelta((n) => n + 1);
    }, 1100);
  };

  // Se resume solo la primera vez que aparece en pantalla
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          resumir(0);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer.current);
    };
  }, []);

  const ej = EJEMPLOS[actual];

  return (
    <div ref={ref}>
      <div className="flex flex-wrap gap-x-7" role="tablist" aria-label="Ejemplos de correo">
        {EJEMPLOS.map((e, i) => (
          <button
            key={e.etiqueta}
            type="button"
            role="tab"
            aria-selected={i === actual}
            className={`chip ${i === actual ? "!text-bone" : ""}`}
            onClick={() => resumir(i)}
          >
            <TriIcon className={`h-3 w-3 ${i === actual ? "text-iris" : "text-ash"}`} />
            {e.etiqueta}
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
        {/* El correo tal como llega */}
        <div key={`c${actual}`} className="swap-in">
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ash">Correo que llega</p>
          <p className="mt-4 text-caption text-ash">
            De <span className="text-bone">{ej.de}</span>
          </p>
          <h3 className="mt-2 text-heading-2xs">{ej.asunto}</h3>
          <p className="mt-4 max-w-[520px] text-body text-silver">{ej.texto}</p>
        </div>

        {/* Lo que Atendel entrega */}
        <div aria-live="polite" className="min-h-[220px]">
          <p className="flex items-center gap-3 text-caption font-semibold uppercase tracking-[0.08em] text-iris">
            {estado === "leyendo" ? <TriSpinner className="h-3 w-3" /> : <TriIcon className="h-3 w-3" />}
            {estado === "leyendo" ? "Atendel está leyendo…" : "Lo que te dice Atendel"}
          </p>
          {estado === "listo" ? (
            <div key={vuelta} className="stagger">
              <p className="mt-5 text-heading-sm" style={{ "--i": 0 } as CSSProperties}>
                {ej.resumen}
              </p>
              <p className="mt-6 flex items-start gap-3 text-body text-saffron" style={{ "--i": 1 } as CSSProperties}>
                <Arrow className="mt-1.5 shrink-0" />
                {ej.accion}
              </p>
              <p className="mt-6 text-caption text-ash" style={{ "--i": 2 } as CSSProperties}>
                Ejemplo ilustrativo. En tu panel lo hace con tus correos reales.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
