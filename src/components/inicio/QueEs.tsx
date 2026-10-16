import type { CSSProperties, ReactNode } from "react";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Insignia, type TonoInsignia } from "@/components/base/Insignia";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { Personaje } from "@/components/agentes/Personaje";
import { Revelar } from "@/app/para-quien-es/Revelar";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

type Entrada = {
  agente: IdAgente;
  /** Hora del ejemplo (detalle.ts). Iris no tiene hora en su ejemplo: va "Hoy". */
  hora: string;
  canal: string;
  accion: ReactNode;
  detalle: string;
  resultado: { tono: TonoInsignia; texto: string };
};

/**
 * "El día de la recepción": cada renglón sale de la conversación de ejemplo
 * de ese agente en src/components/agentes/detalle.ts (mismos nombres
 * ficticios, horas, servicios y cifras). Nada nuevo.
 */
const BITACORA: Entrada[] = [
  {
    agente: "clara",
    hora: "09:40",
    canal: "Correo",
    accion: (
      <>
        cambió la cita de <strong>Andrea Solís</strong>
      </>
    ),
    detalle:
      "Le ofreció dos horarios y le confirmó el martes a las 17:00, desde tu correo.",
    resultado: { tono: "exito", texto: "Correo enviado" },
  },
  {
    agente: "lola",
    hora: "10:44",
    canal: "WhatsApp",
    accion: (
      <>
        agendó a <strong>Mariana</strong>
      </>
    ),
    detalle:
      "Limpieza facial profunda, jueves a las 16:30. Un día antes le manda un recordatorio.",
    resultado: { tono: "exito", texto: "Cita creada" },
  },
  {
    agente: "victor",
    hora: "11:20",
    canal: "WhatsApp",
    accion: (
      <>
        le dio seguimiento a <strong>Paola</strong>
      </>
    ),
    detalle:
      "Había preguntado por botox y no agendó. Ya tiene cita el viernes a las 12:00.",
    resultado: { tono: "azul", texto: "De prospecto a cita" },
  },
  {
    agente: "iris",
    hora: "Hoy",
    canal: "Oficina",
    accion: <>terminó el reporte de septiembre</>,
    detalle:
      "342 citas, 47 clientes nuevos y 21 faltas. Te lo dejó en Excel y en PDF.",
    resultado: { tono: "neutra", texto: "Reporte listo" },
  },
];

/** La bitácora del día como un panel del producto (la actividad del dashboard). */
function Bitacora() {
  return (
    <MarcoNavegador
      titulo="Ejemplo del panel de Atendel: lo que el equipo resolvió hoy"
      pestanas={[
        { etiqueta: "Actividad", activa: true },
        { etiqueta: "Pendientes" },
        { etiqueta: "Citas" },
      ]}
      direccion="atendel.mx/panel"
    >
      <div className="inf-bitacora__cabeza">
        <p className="inf-bitacora__titulo">Hoy en la recepción</p>
        <Etiqueta as="span" tono="tenue">
          Ejemplo · nombres ficticios
        </Etiqueta>
      </div>
      <Revelar as="ol" className="inf-bitacora">
        {BITACORA.map((e, i) => {
          const a = AGENTE_POR_ID[e.agente];
          return (
            <li
              key={e.agente}
              className="inf-bitacora__fila"
              style={{ "--i": i } as CSSProperties}
            >
              <span
                className="marca-agente marca-agente--mini inf-bitacora__avatar"
                style={
                  { "--agente": PERSONAJES[e.agente].color } as CSSProperties
                }
              >
                <Personaje agente={e.agente} avatar />
              </span>
              <div className="min-w-0">
                <p className="inf-bitacora__accion">
                  <strong>{a.nombre}</strong> {e.accion}
                </p>
                <p className="inf-bitacora__detalle">{e.detalle}</p>
                <p className="inf-bitacora__meta">
                  <Etiqueta as="span" tono="tenue">
                    {e.canal}
                  </Etiqueta>
                  <Insignia tono={e.resultado.tono} conPunto>
                    {e.resultado.texto}
                  </Insignia>
                </p>
              </div>
              <Etiqueta as="span" tono="tenue" className="inf-bitacora__hora">
                {e.hora}
              </Etiqueta>
            </li>
          );
        })}
      </Revelar>
    </MarcoNavegador>
  );
}

/**
 * 4. Qué es Atendel (Grupo 4 · G4-T2, "el producto manda"). Columnas
 * asimétricas: a la izquierda Lola, el título y los tres párrafos de siempre;
 * a la derecha, la prueba: la bitácora del día de una recepción tal como se
 * ve en el panel, sobre un halo suave. Los renglones aparecen en orden al llegar.
 */
export function QueEs() {
  return (
    <Seccion id="que-es" etiquetadaPor="que-es-titulo" halo>
      <div className="columnas-asimetricas lg:items-center">
        <div>
          <EncabezadoSeccion
            id="que-es-titulo"
            alineacion="izquierda"
            adorno={<Personaje agente="lola" />}
            etiqueta="Qué es Atendel"
            titulo="Agentes de IA para negocios que atienden personas"
            texto="Atendel es un equipo de cuatro agentes de inteligencia artificial para clínicas, consultorios y estéticas."
            className="!mb-0"
          />
          <div className="inf-parrafos">
            <p className="t-cuerpo">
              Atienden tu WhatsApp y tus citas, ordenan tu correo, traen de
              regreso a tus clientes y hacen el trabajo de oficina.
            </p>
            <p className="t-cuerpo">
              Les hablas como a una persona y te entregan el trabajo hecho:
              mensajes, tablas, reportes y documentos.
            </p>
          </div>
        </div>
        <div className="relative">
          <Halo x="55%" y="50%" ancho="min(820px, 120vw)" suave />
          <Bitacora />
        </div>
      </div>
    </Seccion>
  );
}
