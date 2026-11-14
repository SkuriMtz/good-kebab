"use client";

import { useState, type CSSProperties } from "react";
import { Icono } from "@/components/base/Iconos";
import { filasEjemplo } from "@/components/dashboard/estadisticas-negocio/ejemplo";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { DEMO_CORREOS, DEMO_ESTADOS, DEMO_SEMANA_AGENTE, type CorreoDemo } from "@/lib/demo-dashboard";
import { diaLocal, sumarDias } from "@/lib/estadisticas";
import { AREAS, AREA_DE_AGENTE, type IdArea } from "./pedidos";
import { Enlace, Modal, Odometro, Pildoras, Tarjeta, TituloSeccion, Vacio, claseBoton, retrasoEscalon } from "./Piezas";
import { PestanasPendientes } from "./Hecho";
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
      <TituloSeccion titulo="Agentes" texto="Le escribes a Atendel y él le pasa cada tarea al agente que le toca, o a varios a la vez. Así va la semana de cada uno en Estudio Luna." />
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
                  {a.id === "clara" ? (
                    <Enlace href="/pruebalo?vista=correo" className={claseBoton("borde", true)}>
                      Abrir Correo
                    </Enlace>
                  ) : a.id === "lola" ? (
                    <Enlace href="/pruebalo?vista=citas" className={claseBoton("borde", true)}>
                      Ver Citas
                    </Enlace>
                  ) : (
                    <Enlace href={`/pruebalo?vista=pendientes&area=${AREA_DE_AGENTE[a.id]}`} className={claseBoton("borde", true)}>
                      Sus pendientes
                    </Enlace>
                  )}
                  <Enlace href="/pruebalo?vista=ajustes&seccion=agentes" className={claseBoton("fantasma", true)}>
                    Sus reglas
                  </Enlace>
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
            <Enlace href={`/pruebalo?pide=${encodeURIComponent(`Ayúdame con el correo de ${c.remitente}: ${c.accion}`)}`} className={claseBoton("fantasma", true)}>
              Pedírselo a Atendel
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
      <PestanasPendientes base="/pruebalo?vista=pendientes" activa="revisar" porRevisar={items.filter((i) => i.columna === "revisar").length} />
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

/** Los horarios que se pueden apartar en "Nueva cita": de 9:00 a 18:30, cada media hora. */
const HORAS_CITA = Array.from({ length: 20 }, (_, i) => `${9 + Math.floor(i / 2)}:${i % 2 ? "30" : "00"}`);
const formatoMes = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" });
const formatoSemanaDia = new Intl.DateTimeFormat("es-MX", { weekday: "short", timeZone: "UTC" });
const formatoMesCorto = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" });
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const sinPunto = (t: string) => t.replace(".", "");
/** El lunes de la semana de ese día. */
const lunesDe = (d: string) => sumarDias(d, -((enFecha(d).getUTCDay() + 6) % 7));
const cuantas = (n: number) => (n === 1 ? "1 cita" : `${n} citas`);

/**
 * Citas: arriba la semana (cada día con cuántas citas tiene; se pica para
 * verlo), abajo el día elegido con sus filtros y la lista. "Nueva cita"
 * pide cliente, servicio, día (las próximas dos semanas) y hora (los
 * horarios ocupados de ese día no se pueden elegir).
 */
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
  /** ?dia=AAAA-MM-DD (desde la semana de Estadísticas). Sin esto, mañana (o el siguiente día con citas). */
  dia?: string;
  ahora: number;
  extra: CitaDemo[];
  alAgregar: (c: CitaDemo) => void;
}) {
  const hoy = diaLocal(new Date(ahora));
  const manana = sumarDias(hoy, 1);
  const todas = [...citasEjemplo(ahora), ...extra];
  const activasDe = (d: string) => todas.filter((c) => c.dia === d && c.estado !== "cancelada");
  // Sin día pedido: mañana; si mañana no hay nada (el domingo no se abre), el siguiente día con citas
  const elDia =
    dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : (Array.from({ length: 7 }, (_, i) => sumarDias(manana, i)).find((d) => activasDe(d).length) ?? manana);
  const [abierta, setAbierta] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  /** La hora libre de ese día más cercana a las 12:00. */
  const horaLibre = (d: string, preferida = "12:00") => {
    const tomadas = new Set(activasDe(d).map((c) => c.hora));
    if (!tomadas.has(preferida)) return preferida;
    const libres = HORAS_CITA.filter((h) => !tomadas.has(h));
    return libres.sort((a, b) => Math.abs(minutos(a) - minutos(preferida)) - Math.abs(minutos(b) - minutos(preferida)))[0] ?? preferida;
  };
  const formaVacia = () => {
    const d = elDia >= hoy ? elDia : manana;
    return { cliente: "", servicio: "", dia: d, hora: horaLibre(d) };
  };
  const [forma, setForma] = useState(formaVacia);

  const base = de ? todas.filter((c) => c.cliente === de) : todas.filter((c) => c.dia === elDia);
  const activas = base.filter((c) => c.estado !== "cancelada");
  const activa = ESTADOS_CITA.some((e) => e.id === estado) ? estado : "todas";
  const visibles = (activa === "cancelada" ? base.filter((c) => c.estado === "cancelada") : activa === "todas" ? activas : activas.filter((c) => c.estado === activa || (activa === "agendada" && c.estado === "nueva"))).sort(
    (a, b) => a.dia.localeCompare(b.dia) || minutos(a.hora) - minutos(b.hora),
  );
  const filas: FilaCitaDatos[] = visibles.map((c) => ({
    id: c.id,
    hora: c.hora,
    cliente: c.cliente,
    servicio: de ? `${c.servicio} · ${sinPunto(formatoDiaCorto.format(enFecha(c.dia)))}` : c.servicio,
    estado: ESTADO_FILA[c.estado].texto,
    tono: ESTADO_FILA[c.estado].tono,
    href: `/pruebalo?pide=${encodeURIComponent(`Escríbele a ${c.cliente} para confirmar su cita del ${formatoDiaLargo.format(enFecha(c.dia))} a las ${c.hora}.`)}`,
  }));
  const nombreDia = elDia === hoy ? "Hoy" : elDia === manana ? "Mañana" : mayuscula(formatoDiaLargo.format(enFecha(elDia)));
  const fechaLarga = mayuscula(formatoDiaLargo.format(enFecha(elDia)));
  const porConfirmar = activas.filter((c) => c.estado === "nueva").length;
  const cambios = activas.filter((c) => c.estado === "reagendada").length;
  const resumen = [cuantas(activas.length), porConfirmar ? `${porConfirmar} por confirmar` : null, cambios ? `${cambios} ${cambios === 1 ? "cambió" : "cambiaron"} de hora` : null].filter(Boolean).join(" · ");
  const conEstado = (e: string) => `/pruebalo?vista=citas${de ? `&de=${encodeURIComponent(de)}` : `&dia=${elDia}`}${e === "todas" ? "" : `&estado=${e}`}`;
  const diaHref = (d: string) => `/pruebalo?vista=citas&dia=${d}`;
  const lunes = lunesDe(elDia);
  const semana = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

  // "Nueva cita": las próximas dos semanas y lo ocupado del día elegido
  const proximos = Array.from({ length: 14 }, (_, i) => sumarDias(hoy, i));
  const ocupadas = new Set(activasDe(forma.dia).map((c) => c.hora));
  const elegirDia = (d: string) => setForma((f) => ({ ...f, dia: d, hora: horaLibre(d, f.hora) }));
  const abrir = () => {
    setForma(formaVacia());
    setAbierta(true);
  };

  return (
    <Seccion>
      <TituloSeccion
        titulo="Citas"
        texto={de ? `Las citas de ${de}, las que agendó Lola.` : "Lo que Lola agenda, confirma y recuerda por WhatsApp."}
        acciones={
          <button type="button" className={claseBoton("principal")} onClick={abrir}>
            <Icono nombre="mas" tam={16} />
            Nueva cita
          </button>
        }
      />

      {de ? null : (
        <section className="pc-semana" aria-label="La semana">
          <div className="pc-semana__cabeza">
            <p className="pc-semana__mes">{mayuscula(formatoMes.format(enFecha(elDia)))}</p>
            <span className="pc-dias" role="group" aria-label="Cambiar de semana">
              <Enlace href={diaHref(sumarDias(lunes, -7))} className="pc-icono" aria-label="Semana anterior">
                <Icono nombre="chevron-izquierda" tam={18} />
              </Enlace>
              {elDia !== hoy ? (
                <Enlace href={diaHref(hoy)} className="pc-semana__hoy">
                  Hoy
                </Enlace>
              ) : null}
              <Enlace href={diaHref(sumarDias(lunes, 7))} className="pc-icono" aria-label="Semana siguiente">
                <Icono nombre="chevron-derecha" tam={18} />
              </Enlace>
            </span>
          </div>
          <ol className="pc-semana__dias">
            {semana.map((d) => {
              const n = activasDe(d).length;
              const fecha = formatoDiaLargo.format(enFecha(d));
              return (
                <li key={d}>
                  <Enlace
                    href={diaHref(d)}
                    className="pc-semana__dia"
                    aria-current={d === elDia ? "date" : undefined}
                    aria-label={`${mayuscula(fecha)}: ${n ? cuantas(n) : "sin citas"}`}
                    data-hoy={d === hoy ? "" : undefined}
                    data-pasado={d < hoy ? "" : undefined}
                  >
                    <span className="pc-semana__nombre">{d === hoy ? "Hoy" : sinPunto(formatoSemanaDia.format(enFecha(d)))}</span>
                    <span className="pc-semana__numero cifras">{enFecha(d).getUTCDate()}</span>
                    <span className="pc-semana__cuenta">{n ? cuantas(n) : "—"}</span>
                  </Enlace>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="pc-citas-dia">
        <div className="pc-citas-dia__texto">
          <h2 className="pc-citas-dia__titulo">{de ? `Citas de ${de}` : nombreDia}</h2>
          <p className="pc-citas-dia__resumen">{de ? cuantas(activas.length) : `${nombreDia === fechaLarga ? "" : `${fechaLarga} · `}${resumen}`}</p>
        </div>
        <Pildoras etiqueta="Filtrar citas" activa={activa} opciones={ESTADOS_CITA.map((e) => ({ id: e.id, etiqueta: e.etiqueta, href: conEstado(e.id) }))} />
      </div>
      {de ? (
        <div className="pc-filtros">
          <Enlace href="/pruebalo?vista=citas" className="pc-pildora pc-pildora--quitar" aria-label={`Quitar el filtro: ${de}`}>
            Cliente: {de}
            <Icono nombre="cerrar" tam={14} />
          </Enlace>
        </div>
      ) : null}
      {aviso ? (
        <p className="pc-citas-aviso" role="status">
          <Icono nombre="check" tam={16} trazo={2} />
          {aviso}
        </p>
      ) : null}

      {filas.length ? (
        <ListaCitas titulo={de ? `Citas de ${de}` : nombreDia} citas={filas} />
      ) : (
        <Vacio
          agente="lola"
          titulo={de ? `${de} no tiene citas en el ejemplo` : activa === "todas" ? `Sin citas ${nombreDia === "Hoy" || nombreDia === "Mañana" ? `para ${nombreDia.toLowerCase()}` : "este día"}` : "Nada con este filtro"}
          texto={de ? "Atendel le puede apartar una con Lola." : "Elige otro día de la semana o aparta una cita nueva."}
          accion={
            de ? (
              <Enlace href={`/pruebalo?pide=${encodeURIComponent(`Apártale una cita a ${de} esta semana.`)}`} className={claseBoton("borde", true)}>
                Pedírselo a Atendel
              </Enlace>
            ) : (
              <button type="button" className={claseBoton("borde", true)} onClick={abrir}>
                <Icono nombre="mas" tam={14} />
                Nueva cita
              </button>
            )
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
              disabled={!forma.cliente.trim() || !forma.servicio.trim() || ocupadas.has(forma.hora)}
              onClick={() => {
                alAgregar({ id: `n${Date.now()}`, dia: forma.dia, cliente: forma.cliente.trim(), servicio: forma.servicio.trim(), hora: forma.hora, estado: "nueva" });
                setAviso(`Listo: ${forma.cliente.trim()}, ${formatoDiaLargo.format(enFecha(forma.dia))} a las ${forma.hora}.`);
                setAbierta(false);
              }}
            >
              Agendar
            </button>
          </>
        }
      >
        <div className="pc-formulario__campos">
          <div className="pc-elige__par">
            <label className="pc-campo">
              <span className="pc-campo__etiqueta">Cliente</span>
              <input className="pc-campo__entrada" value={forma.cliente} onChange={(e) => setForma({ ...forma, cliente: e.target.value })} placeholder="Nombre y apellido" maxLength={80} />
            </label>
            <label className="pc-campo">
              <span className="pc-campo__etiqueta">Servicio</span>
              <input className="pc-campo__entrada" value={forma.servicio} onChange={(e) => setForma({ ...forma, servicio: e.target.value })} placeholder="Ej.: sesión de 1 hora" maxLength={80} />
            </label>
          </div>
          <fieldset className="pc-campo pc-elige">
            <legend className="pc-campo__etiqueta pc-elige__etiqueta">
              Día <span className="pc-elige__valor">{mayuscula(formatoDiaLargo.format(enFecha(forma.dia)))}</span>
            </legend>
            <div className="pc-elige__dias">
              {proximos.map((d) => {
                const f = enFecha(d);
                return (
                  <label key={d} className="pc-elige__dia">
                    <input type="radio" name="cita-dia" value={d} checked={forma.dia === d} onChange={() => elegirDia(d)} className="pc-oculto" />
                    <span className="pc-elige__nombre">{d === hoy ? "Hoy" : sinPunto(formatoSemanaDia.format(f))}</span>
                    <span className="pc-elige__numero cifras">{f.getUTCDate()}</span>
                    <span className="pc-elige__mes">{sinPunto(formatoMesCorto.format(f))}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <fieldset className="pc-campo pc-elige">
            <legend className="pc-campo__etiqueta pc-elige__etiqueta">
              Hora <span className="pc-elige__valor">{forma.hora}</span>
            </legend>
            <div className="pc-elige__horas">
              {HORAS_CITA.map((h) => {
                const tomada = ocupadas.has(h);
                return (
                  <label key={h} className="pc-elige__hora cifras" data-tomada={tomada ? "" : undefined} title={tomada ? "Ya hay una cita a esa hora" : undefined}>
                    <input type="radio" name="cita-hora" value={h} checked={forma.hora === h} disabled={tomada} onChange={() => setForma({ ...forma, hora: h })} className="pc-oculto" />
                    {h}
                  </label>
                );
              })}
            </div>
          </fieldset>
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
