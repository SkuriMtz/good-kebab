import type { ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { MarcaAgente } from "./Marcas";

/** Encabezado de una vista del dashboard (Agentes, Correo…): título, una línea y lo que vaya a la derecha. */
export function EncabezadoVista({ titulo, texto, extra, id = "vista-titulo" }: { titulo: string; texto?: ReactNode; extra?: ReactNode; id?: string }) {
  return (
    <header className="vista__cabeza">
      <div className="vista__texto">
        <h1 id={id} className="t-app-titulo-grande">
          {titulo}
        </h1>
        {texto ? <p>{texto}</p> : null}
      </div>
      {extra ? <div className="vista__extra">{extra}</div> : null}
    </header>
  );
}

/**
 * Ficha grande de un agente (vista Agentes de /pruebalo y /panel/agentes):
 * personaje, qué abarca, cómo está, qué hace y sus acciones.
 */
export function TarjetaAgente({
  agente,
  estado,
  acciones,
  apagado = false,
  marcada = false,
}: {
  agente: IdAgente;
  estado: ReactNode;
  acciones: ReactNode;
  /** Fuera de su plan o fuera del equipo. */
  apagado?: boolean;
  /** En tu equipo: borde azul sutil. */
  marcada?: boolean;
}) {
  const a = AGENTE_POR_ID[agente];
  return (
    <li className="ficha" data-apagada={apagado || undefined} data-marcada={marcada || undefined}>
      <div className="ficha__cabeza">
        <MarcaAgente agente={agente} tam="grande" apagado={apagado} />
        <div className="ficha__nombre">
          <h2 className="t-app-titulo">{a.nombre}</h2>
          <p>
            {a.area} · {a.abarca}
          </p>
          <div className="ficha__estado">{estado}</div>
        </div>
      </div>
      <p className="ficha__lema">{a.lema}</p>
      <ul className="ficha__capacidades">
        {a.capacidades.map((c) => (
          <li key={c}>
            <Icono nombre="check" tam={16} />
            {c}
          </li>
        ))}
      </ul>
      <div className="ficha__acciones">{acciones}</div>
    </li>
  );
}
