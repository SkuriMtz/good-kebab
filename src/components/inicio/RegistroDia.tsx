import { Revela } from "@/components/escena/Revela";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/**
 * El marcador propio de Atendel en el registro: los cuatro círculos del logo,
 * en un solo tono (currentColor). Va donde Vercel pone su triángulo: en la
 * línea de arriba y en lo que espera tu visto bueno.
 */
function Marcador() {
  return (
    <svg viewBox="0 0 10 10" className="m2-registro__marca" aria-hidden="true">
      <circle cx="2.6" cy="2.6" r="1.9" />
      <circle cx="7.4" cy="2.6" r="1.9" />
      <circle cx="2.6" cy="7.4" r="1.9" />
      <circle cx="7.4" cy="7.4" r="1.9" />
    </svg>
  );
}

type Linea = { hora: string; agente: IdAgente; texto: string; pendiente?: boolean };

/* Un día de ejemplo en una clínica dental. Son datos de muestra (así lo dice
   el panel): nada de cifras de negocio, solo el trabajo que hace cada agente. */
const DIA: Linea[] = [
  { hora: "08:05", agente: "lola", texto: "contestó los mensajes de WhatsApp que llegaron en la noche" },
  { hora: "09:12", agente: "lola", texto: "agendó a Mariana: limpieza dental, jueves a las 11:00" },
  { hora: "09:40", agente: "clara", texto: "ordenó tu correo: dos urgentes y una factura por pagar" },
  { hora: "11:05", agente: "victor", texto: "le ofreció dos horarios a Jorge, que faltó el viernes" },
  { hora: "12:30", agente: "iris", texto: "resumió el contrato del proveedor nuevo en cinco puntos" },
  { hora: "17:00", agente: "lola", texto: "mandó los recordatorios de las citas de mañana" },
  { hora: "17:20", agente: "clara", texto: "dejó lista la respuesta al laboratorio", pendiente: true },
];

/**
 * El "registro del día" (muestra M2): lo que hicieron hoy los agentes, en
 * Geist Mono, como la salida de una terminal. En oscuro flota sobre el negro,
 * sin caja; en claro va en una tarjeta de línea fina. Las líneas aparecen una
 * por una al llegar (Revela, de la v7).
 */
export function RegistroDia() {
  return (
    <figure className="m2-registro" aria-labelledby="registro-titulo">
      <figcaption className="m2-registro__cabeza">
        <span className="m2-registro__prompt">
          <Marcador />
          <span id="registro-titulo">registro de hoy</span>
        </span>
        <span className="m2-registro__nota">Ejemplo · clínica dental</span>
      </figcaption>
      <Revela className="m2-registro__cuerpo">
        <ol className="m2-registro__lista">
          {DIA.map((l) => (
            <li key={l.hora} className={`m2-registro__linea${l.pendiente ? " m2-registro__linea--pendiente" : ""}`}>
              <span className="m2-registro__signo">{l.pendiente ? <Marcador /> : "✓"}</span>
              <time className="m2-registro__hora">{l.hora}</time>
              <span className="m2-registro__texto">
                <b>{AGENTE_POR_ID[l.agente].nombre}</b> {l.texto}
                {l.pendiente ? <em> · espera tu visto bueno</em> : null}
              </span>
            </li>
          ))}
        </ol>
      </Revela>
    </figure>
  );
}
