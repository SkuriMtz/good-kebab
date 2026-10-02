"use client";

import { useEffect, useRef, useState } from "react";
import { TriSpinner } from "./Buttons";
import { Texto } from "./Texto";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";

/** Una pregunta típica para cada agente y cómo contestaría. */
const GUIONES: Record<IdAgente, { pregunta: string; respuesta: string }> = {
  clara: {
    pregunta: "Una paciente me escribió molesta porque le cobramos de más. ¿Qué le contesto?",
    respuesta:
      "Te propongo esto, listo para enviar:\n\n“Hola, Sofía. Tienes toda la razón y te pido una disculpa: revisamos tu cuenta y sí hubo un cobro de más por $350. Hoy mismo hacemos la devolución a la misma tarjeta; puede tardar de 3 a 5 días en verse. Gracias por avisarnos.”\n\nSi quieres, en su próxima visita le ofrecemos una cortesía.",
  },
  lola: {
    pregunta: "¿Cómo le contesto a alguien que dice que está muy caro?",
    respuesta:
      "Sin bajar el precio de entrada. Algo así:\n\n“¡Te entiendo! El precio incluye la valoración con la doctora y la revisión a los 15 días. Si te acomoda, también hay paquete de 3 sesiones con 15% menos. ¿Te aparto un lugar esta semana?”\n\nCorto, cálido y termina con una pregunta para seguir la plática.",
  },
  victor: {
    pregunta: "Tengo 40 clientes que no vienen desde junio. ¿Qué les mando?",
    respuesta:
      "Un mensaje personal, no una promoción masiva:\n\n“Hola, Laura. Hace tiempo que no te vemos y queríamos saber cómo estás. Este mes tu limpieza facial va con 20% menos. ¿Te aparto un lugar?”\n\n- Mándalo martes o miércoles a media mañana.\n- A quien no conteste, uno más en 5 días y ya.\n- Anota quién regresa para saber si funcionó.",
  },
  oscar: {
    pregunta: "Hazme una tabla para llevar ingresos y gastos.",
    respuesta:
      "Va, lista para pasar a Excel:\n\n| Fecha | Concepto | Ingreso | Gasto |\n|---|---|---|---|\n| 01/10 | Limpieza facial | $850 | |\n| 01/10 | Insumos | | $1,200 |\n| 02/10 | Botox | $4,500 | |\n\nAl cierre del mes suma cada columna y réstalas: eso es lo que te quedó.",
  },
  lucia: {
    pregunta: "Nos dejaron una reseña de 2 estrellas. ¿Cómo respondo?",
    respuesta:
      "Rápido, en público y sin discutir:\n\n“Gracias por escribirnos, Mariana. Lamentamos mucho que tu espera fuera tan larga; no es lo que queremos para nadie. Escríbenos al WhatsApp del consultorio y lo resolvemos contigo.”\n\nDespués llámala tú. Una queja bien atendida muchas veces se vuelve una clienta fiel.",
  },
  iris: {
    pregunta: "¿Qué reviso antes de comprar un equipo de láser?",
    respuesta:
      "Lo principal:\n\n1. **Registro sanitario** del equipo ante COFEPRIS.\n2. **Garantía y servicio técnico** en tu ciudad, con tiempos por escrito.\n3. **Costo de las piezas** que se gastan con el uso.\n4. **Capacitación** incluida para tu equipo.\n5. **Cuántas sesiones al mes** necesitas para pagarlo.\n\nSi quieres, armo una tabla para comparar tus cotizaciones.",
  },
};

/**
 * Una ventana como la del chat de la app: eliges un agente, aparece una
 * pregunta y la respuesta se va escribiendo, como en ChatGPT o Claude.
 */
export function ChatDemo() {
  const [agente, setAgente] = useState<IdAgente>("lola");
  const [visto, setVisto] = useState(false);
  const [letras, setLetras] = useState(0);
  const [pensando, setPensando] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const guion = GUIONES[agente];
  const info = AGENTES_INFO.find((a) => a.id === agente)!;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisto(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -25% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // La respuesta se escribe sola (de golpe si la persona pidió menos movimiento)
  useEffect(() => {
    if (!visto) return;
    const total = guion.respuesta.length;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPensando(false);
      setLetras(total);
      return;
    }
    setPensando(true);
    setLetras(0);
    let id = 0;
    const t = window.setTimeout(() => {
      setPensando(false);
      id = window.setInterval(() => {
        setLetras((n) => {
          if (n >= total) {
            window.clearInterval(id);
            return n;
          }
          return Math.min(total, n + 4);
        });
      }, 22);
    }, 900);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, [visto, guion]);

  // No cortar a la mitad de una tabla (se vería rota mientras se escribe)
  let visible = guion.respuesta.slice(0, letras);
  if (letras < guion.respuesta.length) {
    const ultima = visible.lastIndexOf("\n");
    if (visible.slice(ultima + 1).startsWith("|")) visible = visible.slice(0, ultima);
  }

  return (
    <div ref={ref} className="grid grid-cols-[minmax(0,1fr)] border hairline bg-shale lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Tu equipo */}
      <div className="min-w-0 border-b hairline lg:border-b-0 lg:border-r">
        <p className="hidden px-5 pb-1 pt-5 font-cond text-base uppercase tracking-[0.03em] text-ash lg:block">
          Tu equipo
        </p>
        <ul className="flex overflow-x-auto px-3 lg:block lg:px-5 lg:pb-5" role="tablist" aria-label="Elige un agente">
          {AGENTES_INFO.map((a) => (
            <li key={a.id} className="shrink-0">
              <button
                type="button"
                role="tab"
                aria-selected={a.id === agente}
                className="demo-agente"
                onClick={() => setAgente(a.id)}
              >
                <span className="editorial text-[1.375rem] leading-none">{a.nombre}</span>
                <span className="text-[0.6875rem] uppercase tracking-[0.06em] text-ash">{a.area}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* La conversación */}
      <div className="flex min-h-[520px] min-w-0 flex-col">
        <div className="flex items-baseline gap-3 border-b hairline px-5 py-4 lg:px-8">
          <span className="editorial text-[1.75rem] leading-none">{info.nombre}</span>
          <span className="text-[0.75rem] uppercase tracking-[0.05em] text-ash">{info.area}</span>
        </div>
        <div className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          <div key={agente} className="swap-in flex flex-col gap-6">
            <p className="max-w-[85%] self-end whitespace-pre-wrap border hairline bg-void px-4 py-3 text-body">
              {guion.pregunta}
            </p>
            <div className="text-body text-silver">
              <p className="mb-2 font-cond text-base uppercase tracking-[0.03em] text-ash">{info.nombre}</p>
              {pensando || !visto ? (
                <p className="flex items-center gap-2 text-ash">
                  <TriSpinner className="h-3 w-3" /> Escribiendo…
                </p>
              ) : (
                <Texto texto={visible} />
              )}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 lg:px-8 lg:pb-6">
          <div className="flex items-center gap-2 border hairline p-2 pl-4 text-ash">
            <span className="flex-1 truncate text-body">Escríbele a {info.nombre}…</span>
            <span className="grid h-10 w-10 place-items-center bg-bone text-void" aria-hidden="true">
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
