"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { Avatar } from "@/components/base/Avatar";
import { Boton } from "@/components/base/Boton";
import { Campo } from "@/components/base/Campo";
import { Escribiendo } from "@/components/base/Escribiendo";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Menu } from "@/components/base/Menu";
import { Pestanas } from "@/components/base/Pestanas";
import { Cara } from "./Caras";
import { Destinable } from "./Navegacion";
import { Vacio } from "./Vacio";
import type { Adjunto, Destacado, Evento, IdPestanaActividad, Pendiente } from "./tipos";

const VISIBLES = 5;

/**
 * Lo que hizo tu equipo, en tres pestañas:
 * - Actividad: línea de tiempo (como la de un pull request): cada agente es
 *   un nodo sobre una línea vertical; citas, resúmenes, archivos y relevos
 *   entre agentes llevan su "adjunto". Se agrupa por día.
 * - Espera tu visto bueno: lo que un agente preparó y no sale sin tu permiso.
 * - Destacados: lo que tus agentes marcaron para que no se te pase.
 * Arriba a la derecha, un filtro por agente que aplica a las tres.
 */
export function Actividad({
  eventos,
  pendientes: pendientesIniciales,
  destacados,
  pestana,
  alCambiarPestana,
  interactivo = false,
  vacios,
  nombreTu = "Tú",
  alCambiarPendientes,
}: {
  eventos: Evento[];
  pendientes: Pendiente[];
  destacados: Destacado[];
  pestana: IdPestanaActividad;
  alCambiarPestana: (p: IdPestanaActividad) => void;
  /** Demo: aprobar, editar y descartar funcionan aquí (sin enviar nada). */
  interactivo?: boolean;
  vacios: { actividad: ReactNode; pendientes: ReactNode; destacados: ReactNode };
  nombreTu?: string;
  /** Avisa cuántos quedan por revisar (para la bienvenida). */
  alCambiarPendientes?: (n: number) => void;
}) {
  const [filtro, setFiltro] = useState<IdAgente | null>(null);
  const [pendientes, setPendientes] = useState(pendientesIniciales);
  const [hechos, setHechos] = useState<Evento[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [todo, setTodo] = useState(false);

  useEffect(() => {
    alCambiarPendientes?.(pendientes.length);
  }, [pendientes.length, alCambiarPendientes]);

  const deAgente = <T extends { agente?: IdAgente; quien?: IdAgente | "tu" }>(x: T) =>
    !filtro || x.agente === filtro || x.quien === filtro;

  const todosEventos = [...hechos, ...eventos].filter((e) => !filtro || e.quien === filtro || e.relevo === filtro);
  const visibles = todo ? todosEventos : todosEventos.slice(0, VISIBLES);
  const pendientesVisibles = pendientes.filter(deAgente);
  const destacadosVisibles = destacados.filter(deAgente);

  const resolver = (p: Pendiente, como: "aprobado" | "descartado") => {
    setPendientes((ps) => ps.filter((x) => x.id !== p.id));
    const quien = AGENTE_POR_ID[p.agente].nombre;
    if (como === "aprobado") {
      setHechos((hs) => [
        {
          id: `hecho-${p.id}`,
          dia: "Hoy",
          cuando: "hace un momento",
          quien: "tu",
          accion: `aprobaste el mensaje de ${quien}:`,
          objeto: p.titulo.charAt(0).toLocaleLowerCase("es-MX") + p.titulo.slice(1),
          insignia: { tono: "exito", texto: "Aprobado" },
        },
        ...hs,
      ]);
      setAviso(`Aprobaste el mensaje de ${quien}. Es un ejemplo: no se envió nada.`);
    } else setAviso(`Descartaste el mensaje de ${quien}. ${quien} no lo enviará.`);
  };

  const filtroEtiqueta = filtro ? `Solo ${AGENTE_POR_ID[filtro].nombre}` : "Todos los agentes";

  return (
    <section className="dash-actividad" aria-labelledby="dash-actividad-titulo">
      <div className="dash-cabeza">
        <h2 id="dash-actividad-titulo" className="dash-cabeza__titulo">
          Lo que hizo tu equipo
        </h2>
        <Menu
          etiqueta="Filtrar por agente"
          aspecto="boton"
          alineacion="fin"
          disparador={
            <span className="dash-filtro">
              <Icono nombre="filtro" tam={16} />
              {filtroEtiqueta}
            </span>
          }
          elementos={[
            { id: "todos", etiqueta: "Todos los agentes", icono: "agentes", actual: !filtro, alElegir: () => setFiltro(null) },
            { tipo: "separador" },
            ...AGENTES_INFO.map((a) => ({
              id: a.id,
              etiqueta: a.nombre,
              descripcion: a.area,
              actual: filtro === a.id,
              alElegir: () => setFiltro(a.id),
            })),
          ]}
        />
      </div>

      <Pestanas
        etiqueta="Actividad de tu equipo"
        alineacion="izquierda"
        className="dash-pestanas"
        activa={pestana}
        alCambiar={(id) => alCambiarPestana(id as IdPestanaActividad)}
        pestanas={[
          {
            id: "actividad",
            etiqueta: "Actividad",
            contenido: todosEventos.length ? (
              <>
                <LineaDeTiempo eventos={visibles} nombreTu={nombreTu} />
                {todosEventos.length > VISIBLES ? (
                  <div className="dash-mas">
                    <Boton variante="sutil" tam="compacto" onClick={() => setTodo((v) => !v)} aria-expanded={todo}>
                      {todo ? "Ver menos" : `Ver ${todosEventos.length - VISIBLES} más`}
                    </Boton>
                  </div>
                ) : null}
              </>
            ) : (
              vacios.actividad
            ),
          },
          {
            id: "pendientes",
            etiqueta: (
              <span className="dash-pestana">
                Espera tu visto bueno
                {pendientes.length ? <Insignia tono="atencion" contador={pendientes.length} etiqueta={`${pendientes.length} pendientes`} /> : null}
              </span>
            ),
            contenido: (
              <>
                {aviso ? (
                  <p className="dash-confirmacion" role="status">
                    <Icono nombre="check-circulo" tam={16} />
                    {aviso}
                  </p>
                ) : null}
                {pendientesVisibles.length ? (
                  <ul className="dash-pendientes">
                    {pendientesVisibles.map((p) => (
                      <TarjetaPendiente key={p.id} pendiente={p} interactivo={interactivo} alResolver={resolver} />
                    ))}
                  </ul>
                ) : aviso ? null : (
                  vacios.pendientes
                )}
              </>
            ),
          },
          {
            id: "destacados",
            etiqueta: "Destacados",
            contenido: destacadosVisibles.length ? (
              <ul className="dash-lista">
                {destacadosVisibles.map((d) => (
                  <li key={d.id}>
                    <Destinable destino={d.destino} className="dash-lista__fila dash-destacado">
                      <Cara agente={d.agente} />
                      <span className="dash-destacado__texto">
                        <span className="dash-destacado__titulo">{d.titulo}</span>
                        {d.detalle ? <span className="dash-destacado__detalle">{d.detalle}</span> : null}
                      </span>
                      <span className="dash-destacado__extra">
                        {d.insignia ? (
                          <Insignia tono={d.insignia.tono} conPunto>
                            {d.insignia.texto}
                          </Insignia>
                        ) : null}
                        <span className="dash-hora cifras">{d.cuando}</span>
                      </span>
                    </Destinable>
                  </li>
                ))}
              </ul>
            ) : (
              vacios.destacados
            ),
          },
        ]}
      />
    </section>
  );
}

/* ---------- Línea de tiempo ---------- */

function LineaDeTiempo({ eventos, nombreTu }: { eventos: Evento[]; nombreTu: string }) {
  const dias: { dia: string; eventos: Evento[] }[] = [];
  for (const e of eventos) {
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo.dia === e.dia) ultimo.eventos.push(e);
    else dias.push({ dia: e.dia, eventos: [e] });
  }
  return (
    <div className="dash-linea">
      {dias.map((d) => (
        <div key={d.dia} className="dash-linea__dia">
          <h3 className="dash-linea__fecha">{d.dia}</h3>
          <ol className="dash-linea__lista">
            {d.eventos.map((e) => (
              <ItemLinea key={e.id} evento={e} nombreTu={nombreTu} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function ItemLinea({ evento: e, nombreTu }: { evento: Evento; nombreTu: string }) {
  const quien = e.quien === "tu" ? nombreTu : AGENTE_POR_ID[e.quien].nombre;
  return (
    <li className={`dash-evento${e.vivo ? " dash-evento--vivo" : ""}`}>
      <span className="dash-evento__nodo">
        {e.quien === "tu" ? <Avatar nombre={nombreTu} tam={28} /> : <Cara agente={e.quien} />}
      </span>
      <div className="dash-evento__cuerpo">
        <div className="dash-evento__linea">
          <p className="dash-evento__frase">
            <strong>{e.quien === "tu" ? "Tú" : quien}</strong> {e.accion}{" "}
            {e.objeto ? (
              e.destino ? (
                <Destinable destino={e.destino} className="dash-evento__objeto">
                  {e.objeto}
                </Destinable>
              ) : (
                <strong>{e.objeto}</strong>
              )
            ) : null}
          </p>
          <time className="dash-hora cifras" dateTime={e.fecha}>
            {e.cuando}
          </time>
        </div>
        {e.relevo ? (
          <p className="dash-relevo">
            <Cara agente={e.quien === "tu" ? e.relevo : e.quien} />
            <Icono nombre="flecha" tam={14} />
            <Cara agente={e.relevo} />
            <span>
              Relevo de {quien} a {AGENTE_POR_ID[e.relevo].nombre}
            </span>
          </p>
        ) : null}
        {e.detalle ? <p className="dash-evento__detalle">{e.detalle}</p> : null}
        {e.vivo ? <Escribiendo quien={quien} conTexto className="dash-evento__vivo" /> : null}
        {e.insignia ? (
          <Insignia tono={e.insignia.tono} conPunto className="dash-evento__insignia">
            {e.insignia.texto}
          </Insignia>
        ) : null}
        {e.adjunto ? <PiezaAdjunta adjunto={e.adjunto} /> : null}
      </div>
    </li>
  );
}

function PiezaAdjunta({ adjunto: a }: { adjunto: Adjunto }) {
  if (a.tipo === "cita") {
    return (
      <div className="dash-adjunto dash-adjunto--cita">
        <Icono nombre="calendario" tam={20} className="dash-adjunto__icono" />
        <div className="dash-adjunto__texto">
          <p className="dash-adjunto__titulo cifras">{a.cuando}</p>
          <p className="dash-adjunto__detalle">
            {a.persona} · {a.servicio}
          </p>
        </div>
        {a.estado ? (
          <Insignia tono={a.estado.tono} conPunto className="dash-adjunto__estado">
            {a.estado.texto}
          </Insignia>
        ) : null}
      </div>
    );
  }
  if (a.tipo === "correo") {
    return (
      <div className="dash-adjunto dash-adjunto--correo">
        <p className="dash-adjunto__titulo">
          <Icono nombre="correo" tam={16} className="dash-adjunto__icono" />
          {a.titulo}
        </p>
        <ul className="dash-adjunto__puntos">
          {a.puntos.map((p) => (
            <li key={p.texto}>
              <Insignia tono={p.etiqueta === "Urgente" ? "atencion" : p.etiqueta === "Hoy" ? "azul" : "neutra"}>{p.etiqueta}</Insignia>
              <span>{p.texto}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (a.tipo === "archivo") {
    return (
      <div className="dash-adjunto dash-adjunto--archivo">
        <Icono nombre="documento" tam={20} className="dash-adjunto__icono" />
        <div className="dash-adjunto__texto">
          <p className="dash-adjunto__titulo">{a.nombre}</p>
          <p className="dash-adjunto__detalle">{a.detalle}</p>
        </div>
      </div>
    );
  }
  return (
    <figure className="dash-adjunto dash-adjunto--mensaje">
      <figcaption className="dash-adjunto__canal">
        <Icono nombre="mensaje" tam={14} />
        {a.canal}
      </figcaption>
      <blockquote className="dash-burbuja">{a.texto}</blockquote>
    </figure>
  );
}

/* ---------- Espera tu visto bueno ---------- */

function TarjetaPendiente({
  pendiente: p,
  interactivo,
  alResolver,
}: {
  pendiente: Pendiente;
  interactivo: boolean;
  alResolver: (p: Pendiente, como: "aprobado" | "descartado") => void;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(p.borrador);
  const [enviando, setEnviando] = useState(false);
  const temporizador = useRef<number>();
  const quien = AGENTE_POR_ID[p.agente].nombre;
  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  const aprobar = () => {
    setEnviando(true);
    // Un respiro para ver el estado "cargando": en el ejemplo no se envía nada
    temporizador.current = window.setTimeout(() => alResolver({ ...p, borrador: texto }, "aprobado"), 700);
  };

  return (
    <li className="dash-pendiente">
      <div className="dash-pendiente__cabeza">
        <Cara agente={p.agente} />
        <p className="dash-pendiente__quien">
          <strong>{quien}</strong> preparó un mensaje · {p.canal}
        </p>
        <span className="dash-hora cifras">{p.cuando}</span>
      </div>
      <h3 className="dash-pendiente__titulo">{p.titulo}</h3>
      {editando ? (
        <Campo etiqueta={`Mensaje para ${p.para}`} multilinea value={texto} alCambiar={setTexto} maxLength={600} rows={4} />
      ) : (
        <blockquote className="dash-burbuja dash-burbuja--borrador">{texto}</blockquote>
      )}
      <div className="dash-pendiente__acciones">
        <Boton variante="sutil" tam="compacto" icono={<Icono nombre="check" />} cargando={enviando} disabled={!interactivo || !texto.trim()} onClick={aprobar}>
          {enviando ? "Aprobando" : "Aprobar y enviar"}
        </Boton>
        <Boton variante="fantasma" tam="compacto" disabled={!interactivo || enviando} onClick={() => setEditando((v) => !v)} aria-pressed={editando}>
          {editando ? "Listo" : "Editar"}
        </Boton>
        <Boton variante="fantasma" tam="compacto" disabled={!interactivo || enviando} onClick={() => alResolver(p, "descartado")}>
          Descartar
        </Boton>
      </div>
    </li>
  );
}
