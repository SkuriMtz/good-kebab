"use client";

import { useState, type CSSProperties } from "react";
import { Icono } from "@/components/base/Iconos";
import { filasEjemplo } from "@/components/dashboard/estadisticas-negocio/ejemplo";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { DEMO_CORREOS, DEMO_ESTADOS, DEMO_SEMANA_AGENTE, type CorreoDemo } from "@/lib/demo-dashboard";
import { diaLocal, sumarDias } from "@/lib/estadisticas";
import { AREAS, AREA_DE_AGENTE, type IdArea } from "./pedidos";
import { Enlace, Modal, Odometro, Pildoras, Tarjeta, TituloSeccion, Vacio, claseBoton, retrasoEscalon } from "./Piezas";
import { ListaCitas, ListaCorreos, Seccion, Tablero, TarjetaAgente, type ColumnaTablero, type FilaCitaDatos, type ItemTablero } from "./Secciones";

/* =====================================================================
   Las secciones de /pruebalo, con los DATOS DE EJEMPLO de
   src/lib/demo-dashboard.ts (Estudio Luna). Nada de esto es real; el
   panel lo dice arriba ("Datos de ejemplo").
   ===================================================================== */


export function haceTexto(min: number) {
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

const TONO_ESTADO = { azul: "azul", exito: "exito", atencion: "atencion", neutro: "neutro", error: "atencion" } as const;

/* ---------- Agentes ---------- */

export function AgentesDemo({ enfocado }: { enfocado?: IdAgente }) {
  return (
    <Seccion>
      <TituloSeccion titulo="Agentes" texto="Tu equipo de Estudio Luna: lo que hace cada quien y cómo va su semana." />
      <div className="pc-agentes">
        {AGENTES_INFO.map((a, i) => {
          const e = DEMO_ESTADOS[a.id];
          return (
            <TarjetaAgente
              key={a.id}
              agente={a.id}
              indice={i}
              enfocado={enfocado === a.id}
              estado={{ texto: e.etiqueta, tono: TONO_ESTADO[e.tono as keyof typeof TONO_ESTADO] ?? "neutro" }}
              datos={
                <ul className="pc-agente__semana" aria-label="Esta semana">
                  {DEMO_SEMANA_AGENTE[a.id].map((d) => {
                    const [, num, resto] = d.texto.match(/^(\d+)\s+(.*)$/) ?? [];
                    return (
                      <li key={d.texto}>
                        <Icono nombre={d.icono} tam={16} />
                        {num ? (
                          <>
                            <Odometro valor={Number(num)} className="pc-agente__cifra" /> {resto}
                          </>
                        ) : (
                          d.texto
                        )}
                      </li>
                    );
                  })}
                </ul>
              }
              acciones={
                <>
                  <Enlace href={`/pruebalo?con=${a.id}`} className={claseBoton("borde", true)}>
                    Hablar con {a.nombre}
                  </Enlace>
                  {a.id === "clara" ? (
                    <Enlace href="/pruebalo?vista=correo" className={claseBoton("fantasma", true)}>
                      Abrir Correo
                    </Enlace>
                  ) : a.id === "lola" ? (
                    <Enlace href="/pruebalo?vista=citas" className={claseBoton("fantasma", true)}>
                      Ver Citas
                    </Enlace>
                  ) : (
                    <Enlace href={`/pruebalo?vista=pendientes&area=${AREA_DE_AGENTE[a.id]}`} className={claseBoton("fantasma", true)}>
                      Sus pendientes
                    </Enlace>
                  )}
                </>
              }
            />
          );
        })}
      </div>
    </Seccion>
  );
}

/* ---------- Pendientes (el tablero, con lo que se apruebe en esta visita) ---------- */

export function PendientesDemo({
  items,
  area,
  accion,
  alMover,
  alEditar,
}: {
  items: ItemTablero[];
  area: IdArea;
  /** ?accion=: los correos de Clara que piden eso (desde Estadísticas o Correo). */
  accion?: string;
  alMover: (id: string, c: ColumnaTablero) => void;
  alEditar: (id: string, texto: string) => void;
}) {
  const [editando, setEditando] = useState<ItemTablero | null>(null);
  const [borrador, setBorrador] = useState("");
  const porAccion: ItemTablero[] = accion
    ? DEMO_CORREOS.filter((c) => c.accion && c.accion.trim() === accion.trim()).map((c) => ({
        id: `correo-${c.id}`,
        columna: "revisar",
        agente: "clara",
        titulo: c.asunto,
        para: `Correo de ${c.remitente}`,
        texto: c.accion,
        hace: haceTexto(c.haceMin),
        acciones: (
          <>
            <Enlace href={`/pruebalo?vista=correo&de=${encodeURIComponent(c.remitente)}`} className={claseBoton("borde", true)}>
              Ver en Correo
            </Enlace>
            <Enlace href="/pruebalo?con=clara" className={claseBoton("fantasma", true)}>
              Pedírselo a Clara
            </Enlace>
          </>
        ),
      }))
    : [];
  const base = accion ? porAccion : items;
  const visibles = area === "todo" ? base : base.filter((i) => i.agente && AREA_DE_AGENTE[i.agente] === area);
  const cuenta = (a: IdArea) => items.filter((i) => i.columna === "revisar" && (a === "todo" || (i.agente && AREA_DE_AGENTE[i.agente] === a))).length;
  return (
    <Seccion ancha>
      <TituloSeccion titulo="Pendientes" texto="Lo que tu equipo dejó listo y espera tu visto bueno. Apruébalo con el botón o arrástralo a Aprobado." />
      <div className="pc-filtros">
        <Pildoras
          etiqueta="Filtrar por área"
          activa={area}
          opciones={AREAS.map((a) => ({ id: a.id, etiqueta: a.etiqueta, href: a.id === "todo" ? "/pruebalo?vista=pendientes" : `/pruebalo?vista=pendientes&area=${a.id}`, cuenta: cuenta(a.id) || undefined }))}
        />
        {accion ? (
          <Enlace href="/pruebalo?vista=pendientes" className="pc-pildora pc-pildora--quitar" aria-label={`Quitar el filtro: ${accion}`}>
            Acción: {accion}
            <Icono nombre="cerrar" tam={14} />
          </Enlace>
        ) : null}
      </div>
      <Tablero
        agenteVacio="victor"
        items={visibles}
        alMover={alMover}
        alCambiar={(id) => {
          const it = items.find((x) => x.id === id);
          if (!it) return;
          setBorrador(it.texto ?? "");
          setEditando(it);
        }}
        vacios={{ revisar: "Nada por revisar. Todo al día.", aprobado: "Lo que apruebes aparece aquí.", enviado: "Aquí verás lo que tu equipo ya mandó." }}
      />
      <Modal
        abierto={editando !== null}
        alCerrar={() => setEditando(null)}
        titulo="Cambiar algo"
        descripcion={editando ? `${editando.agente ? AGENTE_POR_ID[editando.agente].nombre : "Tu equipo"} lo manda así. Cámbialo y queda listo para aprobar.` : undefined}
        pie={
          <>
            <button type="button" className={claseBoton("fantasma")} onClick={() => setEditando(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className={claseBoton("principal")}
              disabled={!borrador.trim()}
              onClick={() => {
                if (editando) alEditar(editando.id, borrador.trim());
                setEditando(null);
              }}
            >
              Guardar el cambio
            </button>
          </>
        }
      >
        <label className="pc-campo">
          <span className="pc-campo__etiqueta">{editando?.titulo}</span>
          <textarea className="pc-campo__entrada pc-campo__entrada--largo" rows={5} value={borrador} onChange={(e) => setBorrador(e.target.value)} maxLength={600} />
        </label>
      </Modal>
    </Seccion>
  );
}

/** El tablero de ejemplo al entrar: lo que espera tu visto bueno y lo que ya salió. */
export function tableroInicial(aprobaciones: { id: string; agente: IdAgente; titulo: string; para: string; texto: string; alAprobar: string; haceMin: number }[]): ItemTablero[] {
  return [
    ...aprobaciones.map((a) => ({ id: a.id, columna: "revisar" as const, agente: a.agente, titulo: a.titulo, para: a.para, texto: a.texto, nota: `Al aprobar: ${a.alAprobar}`, hace: haceTexto(a.haceMin), movible: true })),
    {
      id: "recordatorios",
      columna: "enviado",
      agente: "lola",
      titulo: "Recordatorio a las 12 citas de mañana",
      para: "Por WhatsApp, a cada quien con su hora",
      nota: "10 ya confirmaron",
      hace: haceTexto(47),
    },
    {
      id: "seguimiento",
      columna: "enviado",
      agente: "victor",
      titulo: "Mensaje a 12 personas que preguntaron y no agendaron",
      para: "Para Paola y 11 personas más",
      texto: "Hola, Paola. La semana pasada preguntaste por la sesión de 1 hora. ¿Te aparto un lugar? Tengo viernes 12:00 o sábado 10:30.",
      nota: "3 ya contestaron",
      hace: haceTexto(26 * 60 + 15),
    },
  ];
}

/* ---------- Citas (de las MISMAS filas que las Estadísticas de ejemplo) ---------- */

export type CitaDemo = { id: string; dia: string; hora: string; cliente: string; servicio: string; estado: "agendada" | "reagendada" | "cancelada" | "nueva" };

const HORARIOS = ["9:00", "10:00", "11:30", "12:00", "13:30", "16:00", "17:00", "18:30"];
const SERVICIOS = ["Primera visita", "Sesión de 1 hora", "Seguimiento", "Revisión", "Asesoría"];
const hash = (t: string) => {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return h >>> 0;
};
const minutos = (h: string) => {
  const [a, b] = h.split(":").map(Number);
  return a * 60 + (b || 0);
};
let citasCache: { ahora: number; lista: CitaDemo[] } | null = null;

/** Las citas que cuenta Estadísticas (filasEjemplo), con una hora y un servicio fijos por semilla. */
export function citasEjemplo(ahora: number): CitaDemo[] {
  if (citasCache?.ahora === ahora) return citasCache.lista;
  const lista = filasEjemplo(new Date(ahora)).citas.map((c, i) => {
    const k = hash(`${c.cliente}-${c.dia}-${i}`);
    return { id: `g${i}`, dia: c.dia, hora: HORARIOS[k % HORARIOS.length], cliente: c.cliente, servicio: SERVICIOS[(k >>> 8) % SERVICIOS.length], estado: c.estado };
  });
  citasCache = { ahora, lista };
  return lista;
}

const formatoDiaLargo = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const formatoDiaCorto = new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const enFecha = (dia: string) => new Date(`${dia}T12:00:00Z`);

const ESTADOS_CITA = [
  { id: "todas", etiqueta: "Todas" },
  { id: "agendada", etiqueta: "Agendadas" },
  { id: "reagendada", etiqueta: "Cambios" },
  { id: "cancelada", etiqueta: "Canceladas" },
] as const;
const ESTADO_FILA: Record<CitaDemo["estado"], { texto: string; tono: FilaCitaDatos["tono"] }> = {
  agendada: { texto: "Agendada", tono: "exito" },
  nueva: { texto: "Por confirmar", tono: "atencion" },
  reagendada: { texto: "Cambió de hora", tono: "azul" },
  cancelada: { texto: "Cancelada", tono: "neutro" },
};

export function CitasDemo({
  estado,
  de,
  dia,
  ahora,
  extra,
  alAgregar,
}: {
  estado: string;
  /** ?de=: las citas de esa persona (desde Estadísticas o Actividad). */
  de?: string;
  /** ?dia=AAAA-MM-DD (desde la semana de Estadísticas). Sin esto, mañana. */
  dia?: string;
  ahora: number;
  extra: CitaDemo[];
  alAgregar: (c: CitaDemo) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const [forma, setForma] = useState({ cliente: "", servicio: "", hora: "12:00" });
  const hoy = diaLocal(new Date(ahora));
  const manana = sumarDias(hoy, 1);
  const elDia = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : manana;
  const todas = [...citasEjemplo(ahora), ...extra];
  const base = de ? todas.filter((c) => c.cliente === de) : todas.filter((c) => c.dia === elDia);
  const activas = base.filter((c) => c.estado !== "cancelada");
  const activa = ESTADOS_CITA.some((e) => e.id === estado) ? estado : "todas";
  const visibles = (activa === "cancelada" ? base.filter((c) => c.estado === "cancelada") : activa === "todas" ? activas : activas.filter((c) => c.estado === activa || (activa === "agendada" && c.estado === "nueva"))).sort(
    (a, b) => a.dia.localeCompare(b.dia) || minutos(a.hora) - minutos(b.hora),
  );
  const filas: FilaCitaDatos[] = visibles.map((c) => ({
    id: c.id,
    hora: c.hora,
    cliente: de ? `${c.cliente}` : c.cliente,
    servicio: de ? `${c.servicio} · ${formatoDiaCorto.format(enFecha(c.dia))}` : c.servicio,
    estado: ESTADO_FILA[c.estado].texto,
    tono: ESTADO_FILA[c.estado].tono,
    href: "/pruebalo?con=lola",
  }));
  const nombreDia = elDia === hoy ? "Hoy" : elDia === manana ? "Mañana" : formatoDiaLargo.format(enFecha(elDia));
  const conEstado = (e: string) => `/pruebalo?vista=citas${de ? `&de=${encodeURIComponent(de)}` : `&dia=${elDia}`}${e === "todas" ? "" : `&estado=${e}`}`;
  const diaHref = (d: string) => `/pruebalo?vista=citas&dia=${d}`;

  return (
    <Seccion>
      <TituloSeccion
        titulo="Citas"
        texto={de ? `Las citas de ${de}, las que agendó Lola.` : `${nombreDia}${nombreDia === "Hoy" || nombreDia === "Mañana" ? `, ${formatoDiaLargo.format(enFecha(elDia))}` : ""}. Lo que Lola agenda, confirma y recuerda por WhatsApp.`}
        acciones={
          <button type="button" className={claseBoton("principal")} onClick={() => setAbierta(true)}>
            <Icono nombre="mas" tam={16} />
            Nueva cita
          </button>
        }
      />
      <div className="pc-numeros pc-numeros--tres">
        <Tarjeta indice={0} className="pc-numero" href={conEstado("todas")}>
          <p className="pc-numero__etiqueta">{de ? "Citas" : "Citas del día"}</p>
          <p className="pc-numero__valor">
            <Odometro valor={activas.length} />
          </p>
        </Tarjeta>
        <Tarjeta indice={1} className="pc-numero" href={conEstado("agendada")}>
          <p className="pc-numero__etiqueta">Agendadas</p>
          <p className="pc-numero__valor">
            <Odometro valor={activas.filter((c) => c.estado === "agendada" || c.estado === "nueva").length} />
          </p>
        </Tarjeta>
        <Tarjeta indice={2} className="pc-numero" href={conEstado("reagendada")}>
          <p className="pc-numero__etiqueta">Cambios de hora</p>
          <p className="pc-numero__valor">
            <Odometro valor={activas.filter((c) => c.estado === "reagendada").length} />
          </p>
        </Tarjeta>
      </div>
      <div className="pc-filtros">
        {de ? null : (
          <span className="pc-dias" role="group" aria-label="Cambiar de día">
            <Enlace href={diaHref(sumarDias(elDia, -1))} className="pc-icono" aria-label="Día anterior">
              <Icono nombre="chevron-izquierda" tam={18} />
            </Enlace>
            <Enlace href={diaHref(sumarDias(elDia, 1))} className="pc-icono" aria-label="Día siguiente">
              <Icono nombre="chevron-derecha" tam={18} />
            </Enlace>
          </span>
        )}
        <Pildoras etiqueta="Filtrar citas" activa={activa} opciones={ESTADOS_CITA.map((e) => ({ id: e.id, etiqueta: e.etiqueta, href: conEstado(e.id) }))} />
        {de ? (
          <Enlace href="/pruebalo?vista=citas" className="pc-pildora pc-pildora--quitar" aria-label={`Quitar el filtro: ${de}`}>
            Cliente: {de}
            <Icono nombre="cerrar" tam={14} />
          </Enlace>
        ) : null}
      </div>
      {filas.length ? (
        <ListaCitas titulo={de ? `Citas de ${de}` : nombreDia} citas={filas} />
      ) : (
        <Vacio
          agente="lola"
          titulo={de ? `${de} no tiene citas en el ejemplo` : activa === "todas" ? `Sin citas para ${nombreDia.toLowerCase()}` : "Nada con este filtro"}
          texto={de ? "Se le puede pedir a Lola que le aparte una." : "Prueba con otro día o con otro estado."}
          accion={
            <Enlace href={de ? "/pruebalo?con=lola" : "/pruebalo?vista=citas"} className={claseBoton("borde", true)}>
              {de ? "Pedirle a Lola que la agende" : "Ver la agenda de mañana"}
            </Enlace>
          }
        />
      )}
      <Modal
        abierto={abierta}
        alCerrar={() => setAbierta(false)}
        titulo="Nueva cita"
        descripcion="Lola la aparta y le manda la confirmación por WhatsApp (en esta demostración solo se agrega a la lista)."
        pie={
          <>
            <button type="button" className={claseBoton("fantasma")} onClick={() => setAbierta(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className={claseBoton("principal")}
              disabled={!forma.cliente.trim() || !forma.servicio.trim()}
              onClick={() => {
                alAgregar({ id: `n${Date.now()}`, dia: de ? manana : elDia, cliente: forma.cliente.trim(), servicio: forma.servicio.trim(), hora: forma.hora, estado: "nueva" });
                setForma({ cliente: "", servicio: "", hora: "12:00" });
                setAbierta(false);
              }}
            >
              Agendar
            </button>
          </>
        }
      >
        <div className="pc-formulario__campos">
          <label className="pc-campo">
            <span className="pc-campo__etiqueta">Cliente</span>
            <input className="pc-campo__entrada" value={forma.cliente} onChange={(e) => setForma({ ...forma, cliente: e.target.value })} placeholder="Nombre y apellido" maxLength={80} />
          </label>
          <label className="pc-campo">
            <span className="pc-campo__etiqueta">Servicio</span>
            <input className="pc-campo__entrada" value={forma.servicio} onChange={(e) => setForma({ ...forma, servicio: e.target.value })} placeholder="Por ejemplo, sesión de 1 hora" maxLength={80} />
          </label>
          <label className="pc-campo">
            <span className="pc-campo__etiqueta">Hora ({de ? "mañana" : nombreDia.toLowerCase()})</span>
            <select className="pc-campo__entrada" value={forma.hora} onChange={(e) => setForma({ ...forma, hora: e.target.value })}>
              {HORARIOS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Modal>
    </Seccion>
  );
}

/* ---------- Correo ---------- */

const PRIORIDADES = [
  { id: "todo", etiqueta: "Todo" },
  { id: "urgente", etiqueta: "Urgente", texto: "Urgente", tono: "error" },
  { id: "hoy", etiqueta: "Hoy", texto: "Hoy", tono: "atencion" },
  { id: "semana", etiqueta: "Esta semana", texto: "Esta semana", tono: "neutro" },
  { id: "sin-accion", etiqueta: "Sin acción", texto: "Sin acción", tono: "neutro" },
] as const;

export function CorreoDemo({ prioridad, de }: { prioridad: string; de?: string }) {
  const activa = PRIORIDADES.some((p) => p.id === prioridad) ? prioridad : "todo";
  const lista = DEMO_CORREOS.filter((c) => (activa === "todo" || c.prioridad === activa) && (!de || c.remitente === de));
  const fila = (c: CorreoDemo) => {
    const p = PRIORIDADES.find((x) => x.id === c.prioridad);
    return {
      id: c.id,
      remitente: c.remitente,
      asunto: c.asunto,
      resumen: c.resumen,
      accion: c.accion,
      hrefAccion: c.accion ? `/pruebalo?con=clara` : undefined,
      fecha: haceTexto(c.haceMin),
      prioridad: p && "texto" in p ? { texto: p.texto, tono: p.tono } : undefined,
    };
  };
  return (
    <Seccion>
      <TituloSeccion
        titulo="Correo"
        texto="Lo que Clara leyó hoy, con lo urgente primero. En tu panel lee tu Gmail (solo lectura)."
        acciones={
          <Enlace href="/pruebalo?con=clara" className={claseBoton("borde")}>
            Hablar con Clara
          </Enlace>
        }
      />
      <div className="pc-numeros pc-numeros--tres">
        <Tarjeta indice={0} className="pc-numero">
          <p className="pc-numero__etiqueta">Correos leídos hoy</p>
          <p className="pc-numero__valor">
            <Odometro valor={23} />
          </p>
        </Tarjeta>
        <Tarjeta indice={1} className="pc-numero" href="/pruebalo?vista=correo&prioridad=urgente">
          <p className="pc-numero__etiqueta">Urgentes</p>
          <p className="pc-numero__valor">
            <Odometro valor={DEMO_CORREOS.filter((c) => c.prioridad === "urgente").length} />
          </p>
        </Tarjeta>
        <Tarjeta indice={2} className="pc-numero" href="/pruebalo?vista=correo&prioridad=sin-accion">
          <p className="pc-numero__etiqueta">Sin acción</p>
          <p className="pc-numero__valor">
            <Odometro valor={20} />
          </p>
        </Tarjeta>
      </div>
      <div className="pc-filtros">
        <Pildoras etiqueta="Filtrar por prioridad" activa={activa} opciones={PRIORIDADES.map((p) => ({ id: p.id, etiqueta: p.etiqueta, href: p.id === "todo" ? "/pruebalo?vista=correo" : `/pruebalo?vista=correo&prioridad=${p.id}` }))} />
        {de ? (
          <Enlace href="/pruebalo?vista=correo" className="pc-pildora pc-pildora--quitar" aria-label={`Quitar el filtro: ${de}`}>
            De: {de}
            <Icono nombre="cerrar" tam={14} />
          </Enlace>
        ) : null}
      </div>
      {lista.length ? <ListaCorreos correos={lista.map(fila)} /> : <Vacio icono="correo" titulo="Nada con este filtro" />}
    </Seccion>
  );
}

export const estiloEscalon = (i: number) => ({ "--d": `${retrasoEscalon(i)}ms` }) as CSSProperties;
