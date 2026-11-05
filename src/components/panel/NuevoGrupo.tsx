"use client";

import { useEffect, useState } from "react";
import { AGENTES_INFO, IDS_AGENTES, type IdAgente } from "@/lib/agentes";
import { AvatarAgente, nombresDe } from "./Mensajes";
import { Modal, claseBoton } from "./Piezas";

/**
 * "Nuevo grupo": eliges a dos o más agentes y, si quieres, le pones nombre.
 * Es el modal del panel (ANIMACIONES.md punto 8): <dialog>, foco adentro,
 * Esc cierra. Lo usan el chat real y el de /pruebalo.
 */
export function NuevoGrupo({
  abierto,
  onCrear,
  onCerrar,
  disponibles = IDS_AGENTES,
  nombreObligatorio = false,
  maxNombre = 40,
}: {
  abierto: boolean;
  onCrear: (nombre: string, agentes: IdAgente[]) => void;
  onCerrar: () => void;
  disponibles?: readonly IdAgente[];
  nombreObligatorio?: boolean;
  maxNombre?: number;
}) {
  const [elegidos, setElegidos] = useState<IdAgente[]>([]);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (abierto) {
      setElegidos([]);
      setNombre("");
    }
  }, [abierto]);

  const faltaNombre = nombreObligatorio && nombre.trim().length === 0;
  const listo = elegidos.length >= 2 && !faltaNombre;
  const ayuda = elegidos.length < 2 ? `Elige ${elegidos.length ? "uno más" : "al menos dos"}` : faltaNombre ? "Falta el nombre del grupo" : `Con ${nombresDe(elegidos)}`;
  const alternar = (id: IdAgente) => setElegidos((e) => (e.includes(id) ? e.filter((x) => x !== id) : IDS_AGENTES.filter((x) => x === id || e.includes(x))));

  return (
    <Modal
      abierto={abierto}
      alCerrar={onCerrar}
      titulo="Nuevo grupo"
      descripcion="Elige quién entra (mínimo dos). Contesta quien sepa del tema y se pasan el trabajo entre ellos."
      pie={
        <>
          <span className="pc-modal__ayuda" aria-live="polite">
            {ayuda}
          </span>
          <button type="button" className={claseBoton("fantasma")} onClick={onCerrar}>
            Cancelar
          </button>
          <button type="button" className={claseBoton("principal")} disabled={!listo} onClick={() => listo && onCrear(nombre.trim(), elegidos)}>
            Crear grupo
          </button>
        </>
      }
    >
      <fieldset className="pc-elegir">
        <legend className="pc-oculto">Agentes del grupo</legend>
        {AGENTES_INFO.map((a) => {
          const puede = disponibles.includes(a.id);
          return (
            <label key={a.id} className="pc-elegir__fila" data-apagado={puede ? undefined : ""}>
              <input type="checkbox" className="pc-casilla" checked={elegidos.includes(a.id)} disabled={!puede} onChange={() => alternar(a.id)} />
              <AvatarAgente agente={a.id} tam={32} />
              <span className="pc-elegir__textos">
                <span className="pc-elegir__nombre">{a.nombre}</span>
                <span className="pc-elegir__detalle">{puede ? `${a.area} · ${a.abarca}` : "No está en tu equipo"}</span>
              </span>
            </label>
          );
        })}
      </fieldset>
      <label className="pc-campo">
        <span className="pc-campo__etiqueta">{nombreObligatorio ? "Nombre del grupo" : "Nombre o tema (opcional)"}</span>
        <input className="pc-campo__entrada" value={nombre} maxLength={maxNombre} onChange={(e) => setNombre(e.target.value)} placeholder="Por ejemplo, Recepción" />
      </label>
    </Modal>
  );
}
