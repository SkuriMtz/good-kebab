"use client";

import { useState, type CSSProperties } from "react";
import { Icono } from "@/components/base/Iconos";
import type { Cita } from "@/components/dashboard/tipos";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { DEMO_CITAS, DEMO_CORREOS, DEMO_ESTADOS, DEMO_NEGOCIO, DEMO_SEMANA_AGENTE, DEMO_USUARIA, type CorreoDemo } from "@/lib/demo-dashboard";
import { diaLocal } from "@/lib/estadisticas";
import { PLAN_POR_ID } from "@/lib/planes";
import { AREAS, AREA_DE_AGENTE, type IdArea } from "./pedidos";
import { Enlace, Modal, Odometro, Pildoras, Tarjeta, TituloSeccion, Vacio, claseBoton, retrasoEscalon } from "./Piezas";
import { BloqueAjustes, ElegirTema, ListaCitas, ListaCorreos, Seccion, Tablero, TarjetaAgente, TarjetaPlan, type ColumnaTablero, type FilaCitaDatos, type ItemTablero } from "./Secciones";
import { nombresDe } from "./Mensajes";

/* =====================================================================
   Las secciones de /pruebalo, con los DATOS DE EJEMPLO de
   src/lib/demo-dashboard.ts (Estudio Luna). Nada de esto es real; el
   panel lo dice arriba ("Datos de ejemplo").
   ===================================================================== */

const PLAN = PLAN_POR_ID[DEMO_NEGOCIO.plan];

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

/* ---------- Citas ---------- */

const ESTADOS_CITA = [
  { id: "todas", etiqueta: "Todas" },
  { id: "confirmo", etiqueta: "Confirmadas", tono: "exito" },
  { id: "sin-respuesta", etiqueta: "Sin respuesta", tono: "atencion" },
  { id: "cambio", etiqueta: "Cambios", tono: "azul" },
] as const;

export function CitasDemo({
  estado,
  de,
  dia,
  ahora,
  extra,
  alAgregar,
}: {
  estado: string;
  /** ?de=: las citas de esa persona (desde Estadísticas). */
  de?: string;
  /** ?dia=AAAA-MM-DD: en el ejemplo solo está la agenda de mañana. */
  dia?: string;
  ahora: number;
  extra: Cita[];
  alAgregar: (c: Cita) => void;
}) {
  const manana = diaLocal(new Date(ahora + 86_400_000));
  const [abierta, setAbierta] = useState(false);
  const [forma, setForma] = useState({ cliente: "", servicio: "", hora: "12:00" });
  const todas = [...DEMO_CITAS, ...extra].sort((a, b) => Number(a.hora.replace(":", ".")) - Number(b.hora.replace(":", ".")));
  const activa = ESTADOS_CITA.some((e) => e.id === estado) ? estado : "todas";
  const tonoDe = (c: Cita) => (c.estado.tono === "exito" ? "exito" : c.estado.tono === "atencion" ? "atencion" : c.estado.tono === "azul" ? "azul" : "neutro");
  const filtro = ESTADOS_CITA.find((e) => e.id === activa);
  const otroDia = Boolean(dia && dia !== manana);
  const visibles = otroDia ? [] : todas.filter((c) => (activa === "todas" || (filtro && "tono" in filtro && tonoDe(c) === filtro.tono)) && (!de || c.paciente === de));
  const filas: FilaCitaDatos[] = visibles.map((c) => ({ id: c.id, hora: c.hora, cliente: c.paciente, servicio: c.servicio, estado: c.estado.texto, tono: tonoDe(c), href: "/pruebalo?con=lola" }));
  const confirmadas = todas.filter((c) => tonoDe(c) === "exito").length;

  return (
    <Seccion>
      <TituloSeccion
        titulo="Citas"
        texto="Lo que Lola agenda, confirma y recuerda por WhatsApp."
        acciones={
          <button type="button" className={claseBoton("principal")} onClick={() => setAbierta(true)}>
            <Icono nombre="mas" tam={16} />
            Nueva cita
          </button>
        }
      />
      <div className="pc-numeros pc-numeros--tres">
        <Tarjeta indice={0} className="pc-numero">
          <p className="pc-numero__etiqueta">Citas mañana</p>
          <p className="pc-numero__valor">
            <Odometro valor={todas.length} />
          </p>
        </Tarjeta>
        <Tarjeta indice={1} className="pc-numero" href="/pruebalo?vista=citas&estado=confirmo">
          <p className="pc-numero__etiqueta">Confirmadas</p>
          <p className="pc-numero__valor">
            <Odometro valor={confirmadas} />
          </p>
        </Tarjeta>
        <Tarjeta indice={2} className="pc-numero" href="/pruebalo?vista=citas&estado=sin-respuesta">
          <p className="pc-numero__etiqueta">Sin respuesta</p>
          <p className="pc-numero__valor">
            <Odometro valor={todas.filter((c) => tonoDe(c) === "atencion").length} />
          </p>
        </Tarjeta>
      </div>
      <div className="pc-filtros">
        <Pildoras etiqueta="Filtrar citas" activa={activa} opciones={ESTADOS_CITA.map((e) => ({ id: e.id, etiqueta: e.etiqueta, href: e.id === "todas" ? "/pruebalo?vista=citas" : `/pruebalo?vista=citas&estado=${e.id}` }))} />
        {de || dia ? (
          <Enlace href="/pruebalo?vista=citas" className="pc-pildora pc-pildora--quitar" aria-label={`Quitar el filtro: ${de ?? dia}`}>
            {de ? `Cliente: ${de}` : `Día: ${dia}`}
            <Icono nombre="cerrar" tam={14} />
          </Enlace>
        ) : null}
      </div>
      {filas.length ? (
        <ListaCitas titulo="Mañana" citas={filas} />
      ) : (
        <Vacio
          icono="calendario"
          titulo={otroDia ? "En el ejemplo solo está la agenda de mañana" : de ? `${de} no tiene cita mañana` : "Nada con este filtro"}
          texto={otroDia || de ? "En tu panel, Lola te muestra la agenda de cualquier día." : "Prueba con otro estado."}
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
                alAgregar({ id: `n${Date.now()}`, paciente: forma.cliente.trim(), servicio: forma.servicio.trim(), hora: forma.hora, estado: { tono: "neutra", texto: "Por confirmar" } });
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
            <span className="pc-campo__etiqueta">Hora (mañana)</span>
            <select className="pc-campo__entrada" value={forma.hora} onChange={(e) => setForma({ ...forma, hora: e.target.value })}>
              {["9:30", "12:00", "13:30", "16:00", "18:30"].map((h) => (
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

/* ---------- Ajustes ---------- */

export function AjustesDemo() {
  return (
    <Seccion>
      <TituloSeccion titulo="Ajustes" texto="Tu plan, cómo se ve el panel, tu correo y tu equipo." />
      <BloqueAjustes id="aj-plan" titulo="Tu plan" texto="El plan solo se ve aquí. Para cambiarlo, escríbenos.">
        <TarjetaPlan plan={PLAN.nombre} usados={DEMO_NEGOCIO.mensajesUsados} total={PLAN.mensajesMes} />
      </BloqueAjustes>
      <BloqueAjustes id="aj-tema" titulo="Apariencia" texto="Oscuro es el de siempre; claro es una tarjeta sobre gris.">
        <ElegirTema />
      </BloqueAjustes>
      <BloqueAjustes id="aj-correo" titulo="Correo" texto="Clara lee el Gmail del negocio. Solo lectura: nunca envía ni borra nada.">
        <p className="pc-ajuste__estado">
          <span className="pc-estado pc-estado--exito">Gmail conectado</span>
          <Enlace href="/pruebalo?vista=correo" className="pc-enlace">
            Ir a Correo
          </Enlace>
        </p>
      </BloqueAjustes>
      <BloqueAjustes id="aj-equipo" titulo="Tu equipo" texto={`Trabajan contigo: ${nombresDe(["lola", "clara", "victor", "iris"])}.`}>
        <p className="pc-ajuste__estado">
          <Enlace href="/pruebalo?vista=agentes" className="pc-enlace">
            Ver a tu equipo
          </Enlace>
        </p>
      </BloqueAjustes>
      <BloqueAjustes id="aj-cuenta" titulo="Tu cuenta" texto={`${DEMO_USUARIA.nombre} · ${DEMO_USUARIA.correo}`}>
        <Enlace href="/" className={claseBoton("borde", true)}>
          <Icono nombre="cerrar-sesion" tam={16} />
          Salir de la demostración
        </Enlace>
      </BloqueAjustes>
    </Seccion>
  );
}

export const estiloEscalon = (i: number) => ({ "--d": `${retrasoEscalon(i)}ms` }) as CSSProperties;
