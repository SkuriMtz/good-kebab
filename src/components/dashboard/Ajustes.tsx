"use client";

import type { ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import type { Plan } from "@/lib/planes";
import { ponerTema } from "@/lib/tema";
import { Accionable, Cifra, Dona, Tarjeta } from "./Piezas";
import type { Accion } from "./tipos";
import { useTema } from "./useTema";

const formato = new Intl.NumberFormat("es-MX");

/**
 * Ajustes, dentro del panel: el plan (solo se ve; para cambiarlo, los
 * planes o escribirnos), la apariencia, el correo, el equipo y tus datos.
 * Nada aquí cambia el plan.
 */
export function VistaAjustes({
  plan,
  usados,
  conGmail,
  gmail,
  equipo,
  planes,
  marca,
}: {
  plan: Plan;
  usados: number;
  conGmail: boolean;
  gmail: Accion;
  equipo: Accion;
  /** "Plan y facturación": los planes (página pública) o escribirnos. */
  planes: Accion;
  marca?: ReactNode;
}) {
  const tema = useTema();
  const pct = Math.min(100, Math.round((usados / plan.mensajesMes) * 100));
  return (
    <div className="pnl-pagina">
      <header className="pnl-vista__cabeza">
        <div>
          <h1 className="pnl-vista__titulo">
            Ajustes
            {marca}
          </h1>
          <p className="pnl-vista__texto">Tu plan, cómo se ve el panel, tu correo y tu equipo.</p>
        </div>
      </header>

      <div className="pnl-ajustes">
        <Tarjeta titulo="Plan y facturación" subtitulo={plan.nombre} className="pnl-ajustes__plan">
          <div className="pnl-ajustes__uso">
            <Dona partes={[{ id: "usados", valor: usados, color: "var(--c-accion-texto)" }]} total={plan.mensajesMes} tam={72} grosor={8} etiqueta={`${pct}% del plan`} centro={<span className="pnl-mini__pct"><Cifra valor={pct} sufijo="%" /></span>} />
            <p>
              <strong className="cifras-app">
                {formato.format(usados)} de {formato.format(plan.mensajesMes)}
              </strong>{" "}
              mensajes este mes.
              <span className="pnl-ajustes__nota">{plan.resumen}</span>
            </p>
          </div>
          <div className="pnl-ajustes__acciones">
            <Accionable accion={planes} className="pnl-filtro pnl-picable">
              Ver los planes
              <Icono nombre="flecha" tam={16} />
            </Accionable>
            <Accionable accion={{ href: "/contacto" }} className="pnl-filtro pnl-picable">
              Para cambiar de plan, escríbenos
            </Accionable>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Apariencia" subtitulo="Se guarda en este navegador">
          <div className="pnl-segmento" role="group" aria-label="Modo del panel">
            {(["claro", "oscuro"] as const).map((t) => (
              <button key={t} type="button" className="pnl-segmento__opcion" aria-pressed={tema === t} onClick={() => ponerTema(t)}>
                <Icono nombre={t === "claro" ? "sol" : "luna"} tam={16} />
                {t === "claro" ? "Claro" : "Oscuro"}
              </button>
            ))}
          </div>
        </Tarjeta>

        <Tarjeta titulo="Correo" subtitulo={conGmail ? "Clara lee tu Gmail (solo lectura)" : "Clara todavía no lee tu Gmail"}>
          <Accionable accion={gmail} className="pnl-filtro pnl-picable">
            <Icono nombre="correo" tam={16} />
            {conGmail ? "Ir a Correo" : "Conectar Gmail"}
          </Accionable>
        </Tarjeta>

        <Tarjeta titulo="Tu equipo" subtitulo="Quién trabaja contigo">
          <Accionable accion={equipo} className="pnl-filtro pnl-picable">
            <Icono nombre="agentes" tam={16} />
            Elegir agentes
          </Accionable>
        </Tarjeta>

        <Tarjeta titulo="Tus datos" subtitulo="Qué se guarda y quién lo ve">
          <Accionable accion={{ href: "/preguntas#seguridad" }} className="pnl-filtro pnl-picable">
            <Icono nombre="escudo" tam={16} />
            Tus datos y tu privacidad
          </Accionable>
        </Tarjeta>

        <Tarjeta titulo="Mi negocio" subtitulo="Nombre, horario y servicios" accion={<Insignia tono="pronto">Pronto</Insignia>} />
      </div>
    </div>
  );
}
