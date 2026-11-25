import type { CSSProperties } from "react";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { haceTexto } from "./Hoy";
import { AvatarAgente } from "./Mensajes";
import { Enlace, TituloSeccion } from "./Piezas";

/**
 * TU EQUIPO (?vista=equipo): tú solo le hablas a Atendel, y él le encarga
 * cada cosa al empleado que le toca. Aquí ves a los cuatro: su puesto, si
 * está trabajando ahorita o disponible, qué hizo hoy y su escritorio (la
 * sección donde trabaja). Sale de los encargos (migración 0040), de lo que
 * hicieron en tus apps y de lo que dejaron en la Oficina (src/lib/tu-equipo.ts).
 * El mismo componente sirve para /pruebalo (con datos de ejemplo).
 */

export type HechoEquipo = {
  id: string;
  titulo: string;
  /** Cuándo (ISO). */
  hora: string;
  /** espera: algo que hizo y espera tu OK. */
  estado: "trabajando" | "listo" | "error" | "espera";
  href?: string;
};

export type FichaEmpleado = {
  agente: IdAgente;
  /** En qué está ahorita (null: disponible). */
  trabajando: string | null;
  /** Cuántas cosas terminó hoy. */
  hoy: number;
  /** Lo último (hasta 3), de lo más nuevo a lo más viejo. */
  ultimos: HechoEquipo[];
};

type Escritorio = { etiqueta: string; href: string };

/** La sección donde trabaja cada uno (su escritorio). */
export function escritoriosDe(base: "/panel" | "/pruebalo"): Record<IdAgente, Escritorio[]> {
  const v = (vista: string) => (base === "/panel" ? `/panel?vista=${vista}` : `/pruebalo?vista=${vista}`);
  return {
    lola: [
      { etiqueta: "Citas", href: v("citas") },
      { etiqueta: "Necesita tu OK", href: v("pendientes") },
    ],
    clara: [{ etiqueta: "Correo", href: v("correo") }],
    victor: [{ etiqueta: "Cómo va tu negocio", href: v("estadisticas") }],
    iris: [
      { etiqueta: "Oficina", href: v("oficina") },
      { etiqueta: "Tareas", href: v("tareas") },
    ],
  };
}

const ESTADO_HECHO: Record<HechoEquipo["estado"], string> = {
  trabajando: "Trabajando",
  listo: "Listo",
  error: "No se pudo",
  espera: "Espera tu OK",
};

export function TuEquipo({
  fichas,
  ahora,
  escritorios,
  hrefPedir,
}: {
  fichas: FichaEmpleado[];
  ahora: number;
  escritorios: Record<IdAgente, Escritorio[]>;
  /** El chat con un pedido ya escrito para Atendel. */
  hrefPedir: (texto: string) => string;
}) {
  const trabajando = fichas.filter((f) => f.trabajando).length;
  return (
    <div className="pc-seccion pc-tu-equipo">
      <TituloSeccion
        titulo="Tu equipo"
        texto="Tú solo le hablas a Atendel. Él le encarga cada cosa a quien le toca, y aquí ves en qué anda cada uno."
      />
      <p className="pc-tu-equipo__resumen" role="status">
        <span className="pc-tu-equipo__punto" data-activo={trabajando ? "" : undefined} aria-hidden="true" />
        {trabajando ? (trabajando === 1 ? "1 está trabajando ahorita" : `${trabajando} están trabajando ahorita`) : "Todos disponibles"}
      </p>
      <ul className="pc-tu-equipo__lista">
        {fichas.map((f, i) => {
          const a = AGENTE_POR_ID[f.agente];
          return (
            <li key={f.agente} className="pc-empleado" data-estado={f.trabajando ? "trabajando" : "disponible"} style={{ "--orden": i } as CSSProperties}>
              <div className="pc-empleado__cabeza">
                <span className="pc-encargo__cara pc-empleado__cara">
                  <AvatarAgente agente={f.agente} tam={44} />
                  <span className="pc-empleado__punto" aria-hidden="true" />
                </span>
                <div className="pc-empleado__quien">
                  <h2 className="pc-empleado__nombre">{a.nombre}</h2>
                  <p className="pc-empleado__puesto">
                    {a.area} · {a.abarca}
                  </p>
                </div>
                <span className="pc-empleado__estado">{f.trabajando ? "Trabajando" : "Disponible"}</span>
              </div>

              {f.trabajando ? (
                <p className="pc-empleado__ahora">
                  <span className="pc-empleado__ahora-tag">Ahorita</span>
                  <span className="pc-encargo__brillo">{f.trabajando}</span>
                </p>
              ) : (
                <p className="pc-empleado__lema">{a.lema}</p>
              )}

              <div className="pc-empleado__hoy">
                <p className="pc-empleado__hoy-h">
                  Hoy <span>{f.hoy === 0 ? (f.ultimos.length ? "nada terminado todavía" : "nada todavía") : f.hoy === 1 ? "1 cosa lista" : `${f.hoy} cosas listas`}</span>
                </p>
                {f.ultimos.length ? (
                  <ul className="pc-empleado__hechos">
                    {f.ultimos.map((h) => {
                      const dentro = (
                        <>
                          <span className="pc-empleado__icono" data-estado={h.estado} aria-hidden="true">
                            <Icono nombre={h.estado === "listo" ? "check" : h.estado === "error" ? "alerta" : h.estado === "espera" ? "check-circulo" : "reloj"} tam={14} trazo={2} />
                          </span>
                          <span className="pc-empleado__hecho-texto">{h.titulo}</span>
                          <span className="pc-empleado__hecho-hora">
                            <span className="pc-aj-sr">{ESTADO_HECHO[h.estado]}, </span>
                            {h.estado === "espera" ? "Espera tu OK" : haceTexto(h.hora, ahora)}
                          </span>
                        </>
                      );
                      return (
                        <li key={h.id} data-estado={h.estado}>
                          {h.href ? (
                            <Enlace href={h.href} className="pc-empleado__hecho">
                              {dentro}
                            </Enlace>
                          ) : (
                            <span className="pc-empleado__hecho">{dentro}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="pc-empleado__vacio">Cuando le pidas algo a Atendel que sea de {a.area.toLowerCase()}, aquí verás lo que hizo.</p>
                )}
              </div>

              <div className="pc-empleado__pie">
                <span className="pc-empleado__pie-h">Su escritorio</span>
                {escritorios[f.agente].map((e) => (
                  <Enlace key={e.href} href={e.href} className="pc-empleado__escritorio">
                    {e.etiqueta}
                  </Enlace>
                ))}
                <Enlace href={hrefPedir(`Encárgale a ${a.nombre} que `)} className="pc-empleado__pedir">
                  Encárgale algo
                  <Icono nombre="flecha" tam={14} />
                </Enlace>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
