"use client";

import { useRouter } from "next/navigation";
import { Pestanas } from "@/components/base/Pestanas";
import { AGENTE_POR_ID, esIdAgente, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, type IdPlan } from "@/lib/planes";
import { Inicio, LineaTiempo, type Atajo, type OpcionPedido } from "./Centro";
import { Consejos, ProximasCitas, TarjetaPlan } from "./Columna";
import { nombresAgentes } from "./nombres";
import { EnlaceMas, Vacio } from "./Piezas";
import { useAhora } from "./tiempo";
import type { Consejo, Evento } from "./tipos";

export type ConversacionReal = {
  id: string;
  agente: string;
  titulo: string;
  actualizado_en: string;
  participantes?: string[] | null;
  tema?: string | null;
};

export type ResumenReal = {
  id: string;
  remitente: string | null;
  asunto: string | null;
  resumen: string;
  accion_sugerida: string | null;
  creado_en: string;
};

const conSugerencia = (accion: string | null) => Boolean(accion && accion.trim().toLowerCase() !== "ninguna");

function integrantes(c: ConversacionReal): IdAgente[] {
  const p = (c.participantes ?? []).filter(esIdAgente);
  if (p.length >= 2) return p;
  return esIdAgente(c.agente) ? [c.agente] : ["clara"];
}

/** Arma la línea de tiempo con lo que de verdad pasó: correos que Clara resumió y conversaciones con tu equipo. */
function actividadReal(resumenes: ResumenReal[], conversaciones: ConversacionReal[]): Evento[] {
  const eventos: (Evento & { orden: number })[] = [];

  // Los resúmenes del mismo día van juntos si son más de dos (como "resumió 5 correos")
  const porDia = new Map<string, ResumenReal[]>();
  resumenes.forEach((r) => {
    const dia = new Date(r.creado_en).toDateString();
    porDia.set(dia, [...(porDia.get(dia) ?? []), r]);
  });
  porDia.forEach((lista) => {
    if (lista.length > 2) {
      eventos.push({
        id: `resumenes-${lista[0].id}`,
        agente: "clara",
        verbo: "resumió",
        objeto: `${lista.length} correos`,
        fecha: lista[0].creado_en,
        orden: new Date(lista[0].creado_en).getTime(),
        agrupado: {
          etiqueta: "Ver los correos",
          elementos: lista.map((r) => ({ id: r.id, titulo: r.asunto || "(sin asunto)", detalle: r.remitente ?? undefined })),
        },
        accion: { etiqueta: "Ir a Correo", href: "/panel?vista=correo#historial" },
      });
      return;
    }
    lista.forEach((r) =>
      eventos.push({
        id: `resumen-${r.id}`,
        agente: "clara",
        verbo: "resumió un correo",
        objeto: r.remitente ? `de ${r.remitente.replace(/<.*>/, "").trim()}` : undefined,
        fecha: r.creado_en,
        orden: new Date(r.creado_en).getTime(),
        tarjeta: {
          tipo: "mensaje",
          para: r.asunto || "(sin asunto)",
          texto: r.resumen,
          pie: conSugerencia(r.accion_sugerida) ? `Sugerencia: ${r.accion_sugerida}` : undefined,
        },
      }),
    );
  });

  conversaciones.slice(0, 8).forEach((c) => {
    const ids = integrantes(c);
    const grupo = ids.length > 1;
    eventos.push({
      id: `conv-${c.id}`,
      agente: ids[0],
      con: grupo ? ids[1] : undefined,
      verbo: grupo
        ? `y ${ids.length === 2 ? AGENTE_POR_ID[ids[1]].nombre : `${ids.length - 1} agentes más`} trabajaron contigo en`
        : "habló contigo sobre",
      objeto: grupo ? c.tema || nombresAgentes(ids) : c.titulo,
      fecha: c.actualizado_en,
      orden: new Date(c.actualizado_en).getTime(),
      accion: { etiqueta: "Abrir la conversación", href: `/panel/chat?c=${encodeURIComponent(c.id)}` },
    });
  });

  return eventos.sort((a, b) => b.orden - a.orden).slice(0, 10);
}

/**
 * El resumen del panel con DATOS REALES, como el home de GitHub: el saludo,
 * la caja para pedirle algo a tu equipo (lleva al chat real con el texto ya
 * escrito), los atajos, la actividad (correos que Clara resumió y tus
 * conversaciones) y, a la derecha, tu plan y lo que viene. Donde todavía no
 * hay nada, un estado vacío corto, sin inventar.
 */
export function ResumenPanel({
  nombre,
  planId,
  usados,
  activos,
  negocio,
  conGoogle,
  conversaciones,
  resumenes,
}: {
  nombre?: string;
  planId: IdPlan;
  usados: number;
  activos: IdAgente[];
  negocio: string;
  conGoogle: boolean;
  conversaciones: ConversacionReal[];
  resumenes: ResumenReal[];
}) {
  const ahora = useAhora();
  const router = useRouter();
  const plan = PLAN_POR_ID[planId];
  const eventos = actividadReal(resumenes, conversaciones);
  const nombreNegocio = negocio === "tu negocio" ? "Tu negocio" : negocio;
  const equipo: IdAgente[] = activos.length ? activos : ["clara"];

  const opciones: OpcionPedido[] = equipo.map((id) => ({ id, nombre: AGENTE_POR_ID[id].nombre, detalle: AGENTE_POR_ID[id].area, agentes: [id] }));

  const atajos: Atajo[] = [
    ...(activos.includes("lola") ? [{ id: "cita", etiqueta: "Agendar cita", icono: "calendario" as const, href: "/panel/chat?agente=lola" }] : []),
    { id: "correo", etiqueta: "Resumir un correo", icono: "correo", href: "/panel?vista=correo" },
    ...(plan.id !== "free" && activos.length > 1 ? [{ id: "grupo", etiqueta: "Nuevo grupo", icono: "usuarios" as const, href: "/panel/chat" }] : []),
    { id: "equipo", etiqueta: "Tu equipo", icono: "agentes", href: "/panel/agentes" },
  ];

  const consejos: Consejo[] = conGoogle
    ? []
    : [
        {
          id: "gmail",
          agente: "clara",
          titulo: "Conecta tu Gmail",
          texto: "Clara lee lo que no has leído. Solo lectura: nunca envía ni borra.",
          etiquetaAccion: "Ir a Correo",
          href: "/panel?vista=correo#gmail",
        },
      ];

  return (
    <div className="dash-pagina dash-rejilla">
      <div className="dash-centro">
        <Inicio
          ahora={ahora}
          nombre={nombre}
          opciones={opciones}
          alPedir={(texto, id) => router.push(`/panel/chat?agente=${id}&pide=${encodeURIComponent(texto)}`)}
          atajos={atajos}
        />

        <section className="dash-bloque dash-actividad" aria-label="Actividad de tu equipo">
          <Pestanas
            etiqueta="Actividad de tu equipo"
            alineacion="izquierda"
            classNamePanel="dash-actividad__panel"
            pestanas={[
              {
                id: "actividad",
                etiqueta: "Actividad",
                contenido: eventos.length ? (
                  <LineaTiempo eventos={eventos} ahora={ahora} />
                ) : (
                  <Vacio
                    agente="clara"
                    titulo="Aquí verás lo que hace tu equipo"
                    texto="Cada correo que Clara resuma y cada conversación aparece aquí, con la hora."
                  />
                ),
              },
              {
                id: "visto-bueno",
                etiqueta: "Espera tu visto bueno",
                contenido: (
                  <Vacio
                    icono="check-circulo"
                    titulo="Nada espera tu visto bueno"
                    texto="Lo que un agente deje listo para salir a tu nombre aparecerá aquí antes de enviarse."
                  />
                ),
              },
            ]}
          />
        </section>
      </div>

      <aside className="dash-derecha" aria-label="Tu plan y tus citas">
        <TarjetaPlan
          negocio={nombreNegocio}
          plan={plan}
          usados={usados}
          ahora={ahora}
          accion={<EnlaceMas accion={{ href: "/panel/agentes#plan" }}>Ver tu equipo y tu plan</EnlaceMas>}
        />
        <ProximasCitas
          titulo="Próximas citas"
          citas={[]}
          vacio={<Vacio compacto agente="lola" titulo="Pronto" texto="Cuando Lola lleve tus citas, aquí verás las de mañana." />}
        />
        <Consejos consejos={consejos} />
      </aside>
    </div>
  );
}
