import Link from "next/link";
import type { CSSProperties } from "react";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { DETALLE } from "./detalle";
import { Personaje } from "./Personaje";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";
import { PLANES, planMinimo } from "@/lib/planes";

/*
 * Piezas del perfil de un agente (al estilo de un perfil de usuario de
 * GitHub): el retrato redondo, los datos con íconos, su equipo, la lista
 * de todo lo que hace y en qué plan viene. Las usan el inicio, /agentes,
 * /agentes/[agente] y la ficha.
 */

export const colorAgente = (agente: IdAgente) => ({ "--agente": PERSONAJES[agente].color }) as CSSProperties;

/** El retrato redondo: el personaje entero (mira y parpadea) sobre un velo de su color. */
export function RetratoAgente({
  agente,
  tam = "perfil",
  className = "",
}: {
  agente: IdAgente;
  /** perfil: el grande del perfil (128 en celular) · mediano: 160 · chico: 96 · mini: 64. */
  tam?: "perfil" | "mediano" | "chico" | "mini";
  className?: string;
}) {
  return (
    <span className={`retrato-agente retrato-agente--${tam} ${className}`} style={colorAgente(agente)} aria-hidden="true">
      <Personaje agente={agente} />
    </span>
  );
}

/** Dónde trabaja, con qué plan viene y si ya se conecta a tus herramientas. */
export function DatosAgente({ agente, className = "" }: { agente: IdAgente; className?: string }) {
  const info = AGENTE_POR_ID[agente];
  const canal = DETALLE[agente].canal;
  return (
    <ul className={`datos-agente ${className}`}>
      <li>
        <Icono nombre={canal === "Correo" ? "correo" : "mensaje"} tam={16} />
        <span>
          <span className="sr-only">Dónde trabaja: </span>
          {canal}
        </span>
      </li>
      <li>
        <Icono nombre="facturacion" tam={16} />
        <span>Viene con {planMinimo(agente).nombre}</span>
      </li>
      <li>
        {info.conectado ? (
          <PuntoEstado tono="exito" etiqueta="Conectada" />
        ) : (
          <PuntoEstado tono="neutro" etiqueta="En el chat" />
        )}
        <span>{info.conectado ? "Ya se conecta a tu correo" : "Por ahora, la pruebas en el chat"}</span>
      </li>
    </ul>
  );
}

/** Los otros tres agentes, como las organizaciones de un perfil: cada uno lleva a su perfil. */
export function EquipoAgente({ agente }: { agente: IdAgente }) {
  const otros = AGENTES_INFO.filter((a) => a.id !== agente);
  return (
    <div className="equipo-agente">
      <h2 className="equipo-agente__titulo">Trabaja con</h2>
      <ul className="equipo-agente__lista">
        {otros.map((a) => (
          <li key={a.id}>
            <Link href={`/agentes/${a.id}`} className="equipo-agente__enlace" style={colorAgente(a.id)}>
              <span className="equipo-agente__cara" aria-hidden="true">
                <Personaje agente={a.id} avatar />
              </span>
              <span className="equipo-agente__nombre">{a.nombre}</span>
              <span className="equipo-agente__area">{a.area}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Quién es: la presentación del agente, como el LÉEME de un perfil. */
export function PresentacionAgente({ agente }: { agente: IdAgente }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <TarjetaVidrio as="section" relleno="ninguno" className="caja-agente" aria-labelledby={`quien-${agente}`}>
      <header className="caja-agente__cabeza">
        <Icono nombre="documento" tam={16} />
        <Etiqueta as="h3" tono="cuerpo" id={`quien-${agente}`}>
          Quién es {info.nombre}
        </Etiqueta>
      </header>
      <p className="caja-agente__lectura">{DETALLE[agente].descripcion}</p>
    </TarjetaVidrio>
  );
}

/** Todo lo que hace: una lista con divisiones finas, como las listas del producto. */
export function FuncionesAgente({ agente }: { agente: IdAgente }) {
  const funciones = DETALLE[agente].funciones;
  return (
    <TarjetaVidrio as="section" relleno="ninguno" className="caja-agente" aria-labelledby={`hace-${agente}`}>
      <header className="caja-agente__cabeza">
        <Icono nombre="check-circulo" tam={16} />
        <Etiqueta as="h3" tono="cuerpo" id={`hace-${agente}`}>
          Todo lo que hace
        </Etiqueta>
        <Insignia tono="neutra" contador={funciones.length} etiqueta={`${funciones.length} cosas`} className="ml-auto" />
      </header>
      <ul className="funciones-agente">
        {funciones.map((f) => (
          <li key={f.titulo} className="funciones-agente__fila">
            <Icono nombre="check" tam={16} tono="cielo" className="funciones-agente__icono" />
            <div>
              <p className="funciones-agente__titulo">{f.titulo}</p>
              <p className="funciones-agente__detalle">{f.detalle}</p>
            </div>
          </li>
        ))}
      </ul>
    </TarjetaVidrio>
  );
}

/**
 * En qué plan viene: los tres planes en fila, con el primero que lo trae
 * marcado "Desde aquí" (borde destacado), y lo que trae ese plan.
 * Los precios salen de planes.ts ("Próximamente" si aún no hay).
 */
export function PlanesAgente({ agente, compacto = false }: { agente: IdAgente; compacto?: boolean }) {
  const info = AGENTE_POR_ID[agente];
  const minimo = planMinimo(agente);
  return (
    <div className="planes-agente">
      <ul className="planes-agente__lista" aria-label={`Planes que incluyen a ${info.nombre}`}>
        {PLANES.map((p) => {
          const incluido = p.agentes.includes(agente);
          const desde = p.id === minimo.id;
          return (
            <li key={p.id} className="planes-agente__plan" data-incluido={incluido ? "" : undefined} data-desde={desde ? "" : undefined}>
              <div className="planes-agente__cabeza">
                <span className="planes-agente__marca">Atendel</span>
                {desde ? <Insignia tono="azul">Desde aquí</Insignia> : null}
              </div>
              <p className="planes-agente__nombre">{p.nombre.replace("Atendel ", "")}</p>
              <p className="planes-agente__precio">{p.precio ?? "Próximamente"}</p>
              <p className="planes-agente__estado">
                {incluido ? <Icono nombre="check-circulo" tam={16} tono="cielo" /> : <span className="planes-agente__guion" aria-hidden="true" />}
                {incluido ? `Incluye a ${info.nombre}` : `Sin ${info.nombre}`}
              </p>
            </li>
          );
        })}
      </ul>
      {compacto ? null : (
        <div className="planes-agente__trae">
          <Etiqueta as="h3" tono="tenue">
            Lo que trae {minimo.nombre}
          </Etiqueta>
          <ul className="lista-check planes-agente__incluye">
            {minimo.incluye.map((c) => (
              <li key={c} className="t-cuerpo">
                <Icono nombre="check" tam={16} tono="cielo" />
                {c}
              </li>
            ))}
          </ul>
          <p className="planes-agente__resumen">{minimo.resumen}</p>
        </div>
      )}
    </div>
  );
}
