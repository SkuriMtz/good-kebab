import type { ReactNode } from "react";
import type { IdAgente } from "@/lib/agentes";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Cara } from "./Caras";

/**
 * Estado vacío: en vez de un ícono genérico, el agente que se va a encargar
 * de eso cuando haya datos (Lola para las citas, Víctor para lo que espera tu
 * visto bueno…). Una línea de título, una de explicación y, si hay, una acción.
 */
export function Vacio({
  agente,
  icono,
  titulo,
  texto,
  accion,
  compacto = false,
}: {
  agente?: IdAgente;
  icono?: NombreIcono;
  titulo: string;
  texto?: ReactNode;
  accion?: ReactNode;
  compacto?: boolean;
}) {
  return (
    <div className={`dash-vacio${compacto ? " dash-vacio--compacto" : ""}`}>
      {agente ? <Cara agente={agente} tam={compacto ? "mini" : "chica"} className="dash-vacio__cara" /> : null}
      {!agente && icono ? <Icono nombre={icono} tam={20} className="dash-vacio__icono" /> : null}
      <p className="dash-vacio__titulo">{titulo}</p>
      {texto ? <p className="dash-vacio__texto">{texto}</p> : null}
      {accion ? <div className="dash-vacio__accion">{accion}</div> : null}
    </div>
  );
}
