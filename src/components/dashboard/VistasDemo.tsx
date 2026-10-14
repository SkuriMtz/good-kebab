"use client";

import { useState } from "react";
import { Avatar } from "@/components/base/Avatar";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { ChatDemo } from "@/components/ChatDemo";
import { AGENTE_POR_ID, IDS_AGENTES, type IdAgente } from "@/lib/agentes";
import { AGENDA_HOY_DEMO, CITAS_DEMO, CITAS_MANANA_TOTAL, CORREOS_DEMO, ESTADO_AGENTES_DEMO, LOGROS_DEMO, NEGOCIO_DEMO, type VistaDemo } from "@/lib/demo-dashboard";
import { CaraAgente, EncabezadoVista } from "./piezas";
import { TarjetasEquipo } from "./TarjetasEquipo";
import type { Cita } from "./tipos";

/*
 * Las otras vistas de /pruebalo (todo con datos de ejemplo y sin llamar a
 * la IA): Conversaciones (el chat de demostración tal cual), Agentes, Citas
 * y Correo.
 */

export function VistaConversaciones() {
  return (
    <div className="tb-vista tb-vista--chat">
      <EncabezadoVista
        titulo="Conversaciones"
        ejemplo
        texto="Escríbeles, usa @ para mencionar a un agente o / para pedir una acción. Las respuestas son de ejemplo."
      />
      <ChatDemo completa />
    </div>
  );
}

export function VistaAgentes({ ir }: { ir: (v: VistaDemo) => void }) {
  const [equipo, setEquipo] = useState<IdAgente[]>([...IDS_AGENTES]);
  const [aviso, setAviso] = useState<string | null>(null);
  const alternar = (id: IdAgente) => {
    if (equipo.includes(id) && equipo.length === 1) {
      setAviso("Tu equipo necesita al menos un agente.");
      return;
    }
    setAviso(null);
    setEquipo((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));
  };
  return (
    <div className="tb-vista">
      <EncabezadoVista
        titulo="Tu equipo"
        ejemplo
        texto="Con Atendel Max trabajan los cuatro y eliges quién está en tu equipo. Solo los de tu equipo aparecen en el chat."
      />
      <section id="plan" className="tb-caja tb-plan" aria-labelledby="plan-titulo">
        <div className="tb-plan__texto">
          <h2 id="plan-titulo" className="tb-plan__titulo">
            {NEGOCIO_DEMO.nombre} · Atendel Max
          </h2>
          <p className="tb-plan__detalle">Los 4 agentes, chats en grupo y 3,000 mensajes al mes. El plan lo cambia Atendel, no desde aquí.</p>
        </div>
        <BarraProgreso etiqueta="Mensajes de octubre" valor={640} max={3000} unidad="mensajes" detalle="Se renueva el 1 de noviembre." className="tb-plan__uso" />
      </section>
      {aviso ? (
        <p role="alert" className="tb-alerta">
          <Icono nombre="alerta" tam={16} />
          {aviso}
        </p>
      ) : null}
      <TarjetasEquipo
        puedeElegir
        alAlternar={alternar}
        miembros={IDS_AGENTES.map((id) => ({
          id,
          estado: equipo.includes(id) ? ESTADO_AGENTES_DEMO[id] : { tono: "neutro", texto: "Fuera del equipo" },
          incluido: true,
          enEquipo: equipo.includes(id),
          logros: LOGROS_DEMO[id],
          hablar: { etiqueta: `Hablar con ${AGENTE_POR_ID[id].nombre}`, alElegir: () => ir("conversaciones"), icono: "mensaje" },
        }))}
      />
    </div>
  );
}

function FilaCita({ c, pasada = false }: { c: Cita; pasada?: boolean }) {
  return (
    <li className="tb-agenda__fila" data-pasada={pasada || undefined}>
      <time className="tb-agenda__hora cifras">{c.hora}</time>
      <span className="tb-agenda__cliente">
        <Avatar nombre={c.cliente} tam={32} />
        <span className="tb-agenda__nombres">
          <span className="tb-agenda__nombre">{c.cliente}</span>
          <span className="tb-agenda__servicio">{c.servicio}</span>
        </span>
      </span>
      <span className="tb-agenda__quien">
        {c.agente ? (
          <>
            <CaraAgente id={c.agente} tam={20} />
            Agendó {AGENTE_POR_ID[c.agente].nombre}
          </>
        ) : (
          "En recepción"
        )}
      </span>
      <Insignia tono={c.estado.tono} conPunto className="tb-agenda__estado">
        {c.estado.texto}
      </Insignia>
    </li>
  );
}

export function VistaCitas({ ir }: { ir: (v: VistaDemo) => void }) {
  const manana = CITAS_DEMO.filter((c) => c.dia === "Mañana");
  return (
    <div className="tb-vista">
      <EncabezadoVista
        titulo="Citas"
        ejemplo
        texto={`Hoy hay ${AGENDA_HOY_DEMO.length} citas y mañana ${CITAS_MANANA_TOTAL}. Lola confirma cada una un día antes por WhatsApp.`}
      >
        <Boton variante="sutil" tam="compacto" icono={<Icono nombre="calendario" />} onClick={() => ir("conversaciones")}>
          Pedirle una cita a Lola
        </Boton>
      </EncabezadoVista>

      {[
        { titulo: "Hoy · jueves 8 de octubre", citas: AGENDA_HOY_DEMO, pasadas: 3, resto: 0 },
        { titulo: "Mañana · viernes 9 de octubre", citas: manana, pasadas: 0, resto: CITAS_MANANA_TOTAL - manana.length },
      ].map((d) => (
        <section key={d.titulo} className="tb-caja tb-caja--lista tb-agenda" aria-label={d.titulo}>
          <h2 className="tb-agenda__titulo">
            {d.titulo}
            <span className="tb-agenda__cuenta cifras">{d.citas.length + d.resto} citas</span>
          </h2>
          <ul>
            {d.citas.map((c, i) => (
              <FilaCita key={c.id} c={c} pasada={i < d.pasadas} />
            ))}
          </ul>
          {d.resto ? (
            <p className="tb-agenda__resto">
              <Icono nombre="check-doble" tam={16} />
              {d.resto} citas más, todas confirmadas por WhatsApp.
            </p>
          ) : null}
        </section>
      ))}

      <p className="tb-nota">
        <Icono nombre="reloj" tam={16} />
        <span>
          La agenda dentro de Atendel llega pronto. Mientras, Lola te ayuda desde el chat: escribe <strong>/agendar</strong> o{" "}
          <strong>/confirmar</strong>.
        </span>
      </p>
    </div>
  );
}

export function VistaCorreo() {
  return (
    <div className="tb-vista">
      <EncabezadoVista
        titulo="Correo"
        ejemplo
        texto="Clara leyó los 23 correos de hoy. Estos son los que importan; los otros 19 son promociones y avisos."
      >
        <Boton href="/entrar" variante="sutil" tam="compacto" flecha>
          Pruébalo con un correo tuyo
        </Boton>
      </EncabezadoVista>
      <ul className="tb-correos">
        {CORREOS_DEMO.map((m) => (
          <li key={m.id}>
            <article className="tb-caja tb-correo" aria-labelledby={`correo-${m.id}`}>
              <div className="tb-correo__cabeza">
                <Avatar nombre={m.remitente} tam={32} />
                <div className="tb-correo__de">
                  <h2 id={`correo-${m.id}`} className="tb-correo__asunto">
                    {m.asunto}
                  </h2>
                  <p className="tb-correo__remitente">{m.remitente}</p>
                </div>
                <Insignia tono={m.urgencia.tono} conPunto>
                  {m.urgencia.texto}
                </Insignia>
                <time className="tb-correo__hora cifras">{m.hora}</time>
              </div>
              <p className="tb-correo__resumen">{m.resumen}</p>
              {m.sugerencia ? (
                <p className="tb-correo__sugerencia">
                  <CaraAgente id="clara" tam={20} />
                  <span>
                    <span className="sr-only">Clara sugiere: </span>
                    {m.sugerencia}
                  </span>
                </p>
              ) : null}
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
