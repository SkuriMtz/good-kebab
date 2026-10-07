"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { Seccion } from "@/components/base/Seccion";
import { Personaje } from "@/components/agentes/Personaje";
import { Texto } from "@/components/Texto";
import { AGENTE_POR_ID, IDS_AGENTES, type IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

/*
 * 2. El producto en vivo (Grupo 2 · G2-T5).
 * A la izquierda, el encabezado de la sección y los tres pasos de la escena;
 * a la derecha, el marco de navegador con una escena real del guion que se
 * cuenta sola: alguien escribe → el agente contesta → queda el resultado
 * (la cita en la agenda, el pendiente, el reporte). Las pestañas del marco
 * cambian de agente. Todo es guion local: aquí no se llama a la IA.
 * Los datos son los mismos del chat de demostración (ChatDemo).
 */

type NumPaso = 0 | 1 | 2;
type Paso = { titulo: string; detalle: string };

type Linea =
  | { tipo: "mensaje"; de: "otro" | "agente"; texto: string; hora: string; paso: NumPaso }
  | { tipo: "correo"; remitente: string; asunto: string; texto: string; hora: string; paso: NumPaso }
  | { tipo: "aviso"; icono: NombreIcono; texto: string; paso: NumPaso };

type Escena = {
  /** Canal: en la pestaña del marco y en la cabeza de la conversación. */
  canal: string;
  icono: NombreIcono;
  /** Con quién habla el agente. */
  otro: { nombre: string; iniciales: string };
  pasos: [Paso, Paso, Paso];
  lineas: Linea[];
};

const ESCENAS: Record<IdAgente, Escena> = {
  lola: {
    canal: "WhatsApp",
    icono: "mensaje",
    otro: { nombre: "Sofía Ramírez", iniciales: "SR" },
    pasos: [
      { titulo: "Sofía escribe por WhatsApp", detalle: "A las 23:14, con la clínica cerrada" },
      { titulo: "Lola le contesta al momento", detalle: "Le ofrece tus horarios libres" },
      { titulo: "La cita queda en tu agenda", detalle: "Viernes 10:00, con confirmación y recordatorio" },
    ],
    lineas: [
      { tipo: "mensaje", de: "otro", hora: "23:14", paso: 0, texto: "¡Hola! ¿Tienen lugar para una limpieza facial esta semana? Sería mi primera vez." },
      {
        tipo: "mensaje",
        de: "agente",
        hora: "23:14",
        paso: 1,
        texto: "¡Hola, Sofía! Claro. Para tu primera limpieza facial (1 hora) tengo **jueves 11:00** o **viernes 10:00**. ¿Cuál te acomoda?",
      },
      { tipo: "mensaje", de: "otro", hora: "23:15", paso: 1, texto: "El viernes a las 10, por favor." },
      {
        tipo: "mensaje",
        de: "agente",
        hora: "23:15",
        paso: 2,
        texto: "Listo, quedó el **viernes a las 10:00**. Te mando la ubicación y un recordatorio un día antes. Llega 10 minutos antes para llenar tu ficha.",
      },
    ],
  },
  clara: {
    canal: "Correo",
    icono: "correo",
    otro: { nombre: "Insumos Médicos del Bajío", iniciales: "IM" },
    pasos: [
      { titulo: "Llega un correo de tu proveedor", detalle: "Una factura entre los 23 correos del día" },
      { titulo: "Clara te dice lo importante", detalle: "Cuánto es y cuándo vence" },
      { titulo: "Queda en tus pendientes", detalle: "Y te avisa un día antes" },
    ],
    lineas: [
      {
        tipo: "correo",
        remitente: "Insumos Médicos del Bajío",
        asunto: "Factura de septiembre",
        hora: "08:40",
        paso: 0,
        texto: "Adjuntamos la factura por $8,450. Fecha límite de pago: jueves.",
      },
      {
        tipo: "mensaje",
        de: "agente",
        hora: "08:41",
        paso: 1,
        texto: "De los 23 correos de hoy, este es el urgente: **factura de $8,450 que vence el jueves**.",
      },
      {
        tipo: "mensaje",
        de: "agente",
        hora: "08:41",
        paso: 2,
        texto: "La anoté en tus pendientes y te aviso el miércoles. Los otros 20 son promociones y avisos.",
      },
    ],
  },
  victor: {
    canal: "WhatsApp",
    icono: "mensaje",
    otro: { nombre: "Laura", iniciales: "L" },
    pasos: [
      { titulo: "Laura no viene hace 6 meses", detalle: "Víctor la encuentra entre tus clientes" },
      { titulo: "Víctor le escribe por su nombre", detalle: "Un mensaje personal, no una promoción masiva" },
      { titulo: "Laura vuelve a agendar", detalle: "Sábado 10:30, ya en tu agenda" },
    ],
    lineas: [
      { tipo: "aviso", icono: "reloj", paso: 0, texto: "Última visita de Laura: hace 6 meses · limpieza facial" },
      {
        tipo: "mensaje",
        de: "agente",
        hora: "12:00",
        paso: 1,
        texto: "Hola, Laura. Hace tiempo que no te vemos. Este mes tu limpieza facial va con 20% menos, ¿te aparto un lugar?",
      },
      { tipo: "mensaje", de: "otro", hora: "12:20", paso: 1, texto: "¡Hola! Sí, ya me hacía falta. ¿Tienes el sábado?" },
      {
        tipo: "mensaje",
        de: "agente",
        hora: "12:21",
        paso: 2,
        texto: "Claro: **sábado a las 10:30**. Ya quedó; te mando un recordatorio el viernes.",
      },
    ],
  },
  iris: {
    canal: "Oficina",
    icono: "documento",
    otro: { nombre: "Tú", iniciales: "Tú" },
    pasos: [
      { titulo: "Le pides el cierre del mes", detalle: "Con una frase, como a una persona" },
      { titulo: "Iris junta tus números", detalle: "Citas, clientes nuevos y faltas" },
      { titulo: "El reporte queda listo", detalle: "En Excel, para que lo revises" },
    ],
    lineas: [
      { tipo: "mensaje", de: "otro", hora: "18:03", paso: 0, texto: "¿Cómo nos fue en septiembre? Pásamelo en Excel." },
      {
        tipo: "mensaje",
        de: "agente",
        hora: "18:04",
        paso: 1,
        texto: "Bien: **342 citas**, 18 más que en agosto, y **47 clientes nuevos**. Las faltas bajaron de 26 a 21.",
      },
      {
        tipo: "mensaje",
        de: "agente",
        hora: "18:04",
        paso: 2,
        texto: "Te dejé el reporte en Excel con una hoja de citas y otra de pagos.",
      },
    ],
  },
};

/* ---------- Lo que queda al final de cada escena ---------- */

function Evento({ agente, children }: { agente: IdAgente; children: ReactNode }) {
  return (
    <span className="vivo__evento" style={{ "--agente": PERSONAJES[agente].color } as CSSProperties}>
      {children}
    </span>
  );
}

/** Un día de agenda: horas separadas por líneas finas; la cita nueva cae en su hueco. */
function Agenda({
  agente,
  dia,
  horas,
  ocupadas,
  nueva,
  listo,
}: {
  agente: IdAgente;
  dia: string;
  horas: string[];
  ocupadas: string[];
  nueva: { hora: string; nombre: string; servicio: string };
  listo: boolean;
}) {
  return (
    <div className="vivo__resultado">
      <p className="vivo__resultado-titulo">
        <Icono nombre="calendario" tam={16} />
        Agenda · {dia}
      </p>
      <ol className="vivo__agenda">
        {horas.map((h) => (
          <li key={h} className="vivo__franja">
            <span className="vivo__hora-num">{h}</span>
            {h === nueva.hora ? (
              <span className="vivo__hueco" data-listo={listo ? "" : undefined}>
                <span className="vivo__libre">Libre</span>
                <Evento agente={agente}>
                  <span className="vivo__evento-nombre">{nueva.nombre}</span>
                  <span className="vivo__evento-detalle">{nueva.servicio}</span>
                  <span className="vivo__evento-estado">
                    <Icono nombre="check" tam={14} trazo={2} />
                    Confirmada por {AGENTE_POR_ID[agente].nombre}
                  </span>
                </Evento>
              </span>
            ) : ocupadas.includes(h) ? (
              <span className="vivo__ocupado">Ocupado</span>
            ) : (
              <span className="vivo__libre vivo__libre--quieto">Libre</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Pendientes({ listo }: { listo: boolean }) {
  return (
    <div className="vivo__resultado">
      <p className="vivo__resultado-titulo">
        <Icono nombre="check-circulo" tam={16} />
        Pendientes · esta semana
      </p>
      <ul className="vivo__pendientes" data-listo={listo ? "" : undefined}>
        <li className="vivo__pendiente vivo__pendiente--nuevo">
          <span className="vivo__casilla" aria-hidden="true" />
          <span className="vivo__pendiente-cuerpo">
            <span className="vivo__pendiente-titulo">Pagar a Insumos Médicos del Bajío</span>
            <span className="vivo__pendiente-detalle">Vence el jueves · lo anotó Clara</span>
          </span>
          <span className="vivo__monto">$8,450</span>
        </li>
        <li className="vivo__pendiente">
          <span className="vivo__casilla" aria-hidden="true" />
          <span className="vivo__pendiente-cuerpo">
            <span className="vivo__pendiente-titulo">Pagar CFE</span>
            <span className="vivo__pendiente-detalle">Vence el 15</span>
          </span>
          <span className="vivo__monto">$2,180</span>
        </li>
      </ul>
    </div>
  );
}

function Reporte({ listo }: { listo: boolean }) {
  const filas: [string, string, string][] = [
    ["Citas", "342", "324"],
    ["Clientes nuevos", "47", "39"],
    ["Faltas", "21", "26"],
  ];
  return (
    <div className="vivo__resultado">
      <p className="vivo__resultado-titulo">
        <Icono nombre="documento" tam={16} />
        Reporte · septiembre
      </p>
      <div className="vivo__hueco vivo__hueco--reporte" data-listo={listo ? "" : undefined}>
        <span className="vivo__libre">Todavía no hay reporte</span>
        <span className="vivo__reporte">
          <table className="vivo__tabla">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Concepto</span>
                </th>
                <th scope="col">Sep</th>
                <th scope="col">Ago</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(([c, s, a]) => (
                <tr key={c}>
                  <th scope="row">{c}</th>
                  <td>{s}</td>
                  <td>{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <span className="vivo__archivo">
            <Icono nombre="documento" tam={16} />
            reporte-septiembre.xlsx
          </span>
        </span>
      </div>
    </div>
  );
}

function Resultado({ agente, listo }: { agente: IdAgente; listo: boolean }) {
  if (agente === "lola")
    return (
      <Agenda
        agente="lola"
        dia="viernes"
        horas={["09:00", "10:00", "11:00", "12:00"]}
        ocupadas={["09:00", "12:00"]}
        nueva={{ hora: "10:00", nombre: "Sofía Ramírez", servicio: "Limpieza facial · 1 h · primera vez" }}
        listo={listo}
      />
    );
  if (agente === "victor")
    return (
      <Agenda
        agente="victor"
        dia="sábado"
        horas={["09:30", "10:30", "11:30", "12:30"]}
        ocupadas={["11:30"]}
        nueva={{ hora: "10:30", nombre: "Laura", servicio: "Limpieza facial · regresa tras 6 meses" }}
        listo={listo}
      />
    );
  if (agente === "clara") return <Pendientes listo={listo} />;
  return <Reporte listo={listo} />;
}

/* ---------- Íconos de los controles (contorno 1.75 en rejilla de 24, como los de la base) ---------- */

function IconoControl({ nombre }: { nombre: "pausa" | "seguir" | "repetir" }) {
  return (
    <svg
      className="icono"
      style={{ "--icono-tam": "16px" } as CSSProperties}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {nombre === "pausa" ? <path d="M9 6v12M15 6v12" /> : null}
      {nombre === "seguir" ? <path d="M8 5.5v13l10.5-6.5L8 5.5Z" /> : null}
      {nombre === "repetir" ? (
        <>
          <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
          <path d="M4.5 4.5v4h4" />
        </>
      ) : null}
    </svg>
  );
}

/* ---------- La escena ---------- */

/** Cuánto "escribe" alguien antes de que aparezca su mensaje (ms). */
const tecleo = (texto: string) => Math.min(1800, 600 + texto.length * 12);

export function ChatEnMarco() {
  const [agente, setAgente] = useState<IdAgente>("lola");
  const [avance, setAvance] = useState(0);
  const [escribe, setEscribe] = useState(false);
  const [fin, setFin] = useState(false);
  const [pausada, setPausada] = useState(false);
  const [visible, setVisible] = useState(false);
  const [empezo, setEmpezo] = useState(false);
  const rejillaRef = useRef<HTMLDivElement>(null);
  const hiloRef = useRef<HTMLDivElement>(null);

  const escena = ESCENAS[agente];
  const info = AGENTE_POR_ID[agente];
  const siguiente = escena.lineas[avance];
  const pasoActual = fin ? 3 : (siguiente?.paso ?? 2);
  const corre = !pausada && visible && !fin;

  // Empieza cuando la sección se ve; se detiene si sale de la pantalla o la pestaña se oculta
  useEffect(() => {
    const el = rejillaRef.current;
    if (!el) return;
    let dentro = false;
    const revisar = () => {
      const ve = dentro && document.visibilityState === "visible";
      setVisible(ve);
      if (ve) setEmpezo(true);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        dentro = e.isIntersecting;
        revisar();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", revisar);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", revisar);
    };
  }, []);

  // El reloj de la escena: un paso a la vez
  useEffect(() => {
    if (!corre) return;
    let t: number;
    if (siguiente) {
      if (siguiente.tipo === "mensaje" && !escribe) {
        t = window.setTimeout(() => setEscribe(true), avance === 0 ? 500 : 700);
      } else if (siguiente.tipo === "mensaje") {
        t = window.setTimeout(() => {
          setEscribe(false);
          setAvance((a) => a + 1);
        }, tecleo(siguiente.texto));
      } else {
        t = window.setTimeout(() => setAvance((a) => a + 1), avance === 0 ? 500 : 900);
      }
    } else {
      t = window.setTimeout(() => setFin(true), 800);
    }
    return () => window.clearTimeout(t);
  }, [corre, siguiente, escribe, avance]);

  // Lo nuevo siempre a la vista (solo dentro de la conversación, sin mover la página)
  useEffect(() => {
    const el = hiloRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [avance, escribe, fin]);

  const reiniciar = (id: IdAgente = agente) => {
    setAgente(id);
    setAvance(0);
    setEscribe(false);
    setFin(false);
    setPausada(false);
  };

  const quienEscribe = escribe && siguiente?.tipo === "mensaje" ? siguiente.de : null;
  const vistas = escena.lineas.slice(0, avance);
  const pasoTexto = Math.min(pasoActual, 2);

  const controles = (
    <div className="en-vivo__controles">
      <div className="en-vivo__botones">
        {fin ? (
          <Boton variante="fantasma" tam="chico" icono={<IconoControl nombre="repetir" />} onClick={() => reiniciar()}>
            Repetir
          </Boton>
        ) : pausada ? (
          <Boton variante="fantasma" tam="chico" icono={<IconoControl nombre="seguir" />} onClick={() => setPausada(false)}>
            Seguir
          </Boton>
        ) : (
          <Boton variante="fantasma" tam="chico" icono={<IconoControl nombre="pausa" />} onClick={() => setPausada(true)}>
            Pausar
          </Boton>
        )}
        {!fin && avance > 0 ? (
          <Boton variante="fantasma" tam="chico" className="boton--solo-texto" onClick={() => reiniciar()}>
            Desde el inicio
          </Boton>
        ) : null}
      </div>
      <Boton variante="sutil" href={`/pruebalo?con=${agente}`} flecha>
        Háblale tú a {info.nombre}
      </Boton>
    </div>
  );

  return (
    <Seccion id="en-vivo" etiquetadaPor="en-vivo-titulo" halo className="en-vivo">
      <div ref={rejillaRef} className="en-vivo__rejilla" data-pausada={pausada ? "" : undefined}>
        {/* ---------- Encabezado y pasos ---------- */}
        <div className="en-vivo__texto">
          <header className="encabezado encabezado--izquierda en-vivo__encabezado">
            <Etiqueta tono="cielo">El producto, en vivo</Etiqueta>
            <h2 id="en-vivo-titulo" className="t-seccion">
              Llega un mensaje. <span className="en-vivo__nowrap">Tu equipo</span> lo resuelve.
            </h2>
            <p className="t-intro">Elige a quién ver trabajar. Es una demostración con datos de ejemplo: nada sale de esta página.</p>
          </header>

          <ol className="en-vivo__pasos" aria-label={`Lo que hace ${info.nombre}, paso a paso`}>
            {escena.pasos.map((p, i) => {
              const estado = i < pasoActual ? "hecho" : i === pasoActual ? "ahora" : "luego";
              return (
                <li
                  key={`${agente}-${i}`}
                  className="en-vivo__paso"
                  data-estado={estado}
                  aria-current={estado === "ahora" ? "step" : undefined}
                >
                  <span className="en-vivo__paso-marca" aria-hidden="true">
                    {estado === "hecho" ? <Icono nombre="check" tam={14} trazo={2} /> : `0${i + 1}`}
                  </span>
                  <span className="en-vivo__paso-texto">
                    <span className="en-vivo__paso-titulo">{p.titulo}</span>
                    <span className="en-vivo__paso-detalle">{p.detalle}</span>
                  </span>
                  {estado === "hecho" ? <span className="sr-only">(listo)</span> : null}
                </li>
              );
            })}
          </ol>
          <div className="en-vivo__controles-grande">{controles}</div>
        </div>

        {/* ---------- El producto ---------- */}
        <div className="en-vivo__producto">
          <Halo x="55%" y="50%" ancho="min(900px, 120vw)" suave />
          <MarcoNavegador
            titulo={`Escena de ejemplo con ${info.nombre}`}
            direccion="atendel.mx/pruebalo"
            className="vivo-marco"
            alElegir={(id) => reiniciar(id as IdAgente)}
            pestanas={IDS_AGENTES.map((id) => ({
              id,
              activa: id === agente,
              adorno: <Personaje agente={id} avatar />,
              etiqueta: (
                <>
                  {AGENTE_POR_ID[id].nombre}
                  {id === agente ? <span className="vivo__pestana-canal"> · {ESCENAS[id].canal}</span> : null}
                </>
              ),
            }))}
          >
            <div className="vivo__cuerpo" key={agente}>
              {/* Progreso compacto (celular y tableta) */}
              <div className="vivo__progreso" aria-hidden="true">
                <span className="vivo__barras">
                  {[0, 1, 2].map((i) => (
                    <i key={i} data-lleno={i < pasoActual ? "" : undefined} />
                  ))}
                </span>
                <span className="vivo__progreso-texto">
                  {fin ? "Listo" : `Paso ${pasoTexto + 1} de 3`} · {escena.pasos[pasoTexto].titulo}
                </span>
              </div>

              <div className="vivo__conversacion">
                <div className="vivo__cabeza">
                  <span className="vivo__iniciales" aria-hidden="true">
                    {escena.otro.iniciales}
                  </span>
                  <span className="vivo__quien">
                    <span className="vivo__nombre">{escena.otro.nombre}</span>
                    <span className="vivo__canal">
                      <Icono nombre={escena.icono} tam={14} />
                      {escena.canal}
                    </span>
                  </span>
                  <span className="vivo__atiende">
                    <span className="vivo__atiende-cara" aria-hidden="true">
                      <Personaje agente={agente} avatar />
                    </span>
                    <span className="vivo__atiende-texto">
                      <span className="vivo__atiende-nombre">{info.nombre}</span>
                      <span className="vivo__en-linea">en línea</span>
                    </span>
                  </span>
                </div>

                <div
                  ref={hiloRef}
                  className="vivo__hilo"
                  role="log"
                  aria-live="polite"
                  aria-label={`Conversación de ejemplo de ${info.nombre}`}
                  data-lenis-prevent
                >
                  <div className="vivo__hilo-dentro">
                    {vistas.length === 0 && !quienEscribe ? (
                      <p className="vivo__espera">
                        <Icono nombre={escena.icono} tam={16} />
                        {empezo ? "Llega algo nuevo…" : "La escena empieza cuando la ves"}
                      </p>
                    ) : null}
                    {vistas.map((l, i) => {
                      const antes = vistas[i - 1];
                      const mismo = l.tipo === "mensaje" && antes?.tipo === "mensaje" && antes.de === l.de;
                      const despues = vistas[i + 1];
                      const sigueEscribiendo = !despues && quienEscribe !== null && l.tipo === "mensaje" && quienEscribe === l.de;
                      const ultimo = !(l.tipo === "mensaje" && despues?.tipo === "mensaje" && despues.de === l.de) && !sigueEscribiendo;
                      return <LineaEscena key={i} linea={l} agente={agente} mismo={mismo} ultimo={ultimo} />;
                    })}
                    {quienEscribe ? (
                      <div className={`vivo__fila vivo__fila--${quienEscribe} vivo__entra`}>
                        <span
                          className="vivo__puntos"
                          role="status"
                          aria-label={`${quienEscribe === "agente" ? info.nombre : escena.otro.nombre} está escribiendo`}
                        >
                          <i />
                          <i />
                          <i />
                        </span>
                        {quienEscribe === "agente" ? (
                          <span className="vivo__cara" aria-hidden="true">
                            <Personaje agente={agente} avatar />
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {/* En celular y tableta el resultado cae dentro de la conversación */}
                    {fin ? (
                      <div className="vivo__en-hilo vivo__entra">
                        <Resultado agente={agente} listo />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* En computadora, el resultado vive a un lado */}
              <aside className="vivo__lado" aria-label="Resultado de la escena">
                <Resultado agente={agente} listo={fin} />
              </aside>
            </div>
          </MarcoNavegador>
          <div className="en-vivo__controles-chico">{controles}</div>
        </div>
      </div>
    </Seccion>
  );
}

function LineaEscena({ linea, agente, mismo, ultimo }: { linea: Linea; agente: IdAgente; mismo: boolean; ultimo: boolean }) {
  if (linea.tipo === "aviso")
    return (
      <p className="vivo__aviso vivo__entra">
        <Icono nombre={linea.icono} tam={14} />
        {linea.texto}
      </p>
    );
  if (linea.tipo === "correo")
    return (
      <div className="vivo__fila vivo__fila--otro vivo__entra">
        <article className="vivo__correo">
          <p className="vivo__correo-de">
            <span className="vivo__correo-remitente">{linea.remitente}</span>
            <span className="vivo__hora">{linea.hora}</span>
          </p>
          <p className="vivo__correo-asunto">{linea.asunto}</p>
          <p className="vivo__correo-texto">{linea.texto}</p>
        </article>
      </div>
    );
  const delAgente = linea.de === "agente";
  return (
    <div className={`vivo__fila vivo__fila--${linea.de} vivo__entra${mismo ? "" : " vivo__fila--bloque"}`}>
      <div className="vivo__burbuja" data-ultimo={ultimo ? "" : undefined}>
        {delAgente ? <span className="sr-only">{AGENTE_POR_ID[agente].nombre}: </span> : null}
        <span className="vivo__texto">
          <Texto texto={linea.texto} />
        </span>
        <span className="vivo__hora">{linea.hora}</span>
      </div>
      {delAgente ? (
        <span className="vivo__cara" aria-hidden="true">
          {ultimo ? <Personaje agente={agente} avatar /> : null}
        </span>
      ) : null}
    </div>
  );
}
