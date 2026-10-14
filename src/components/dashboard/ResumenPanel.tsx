"use client";

import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Pestanas } from "@/components/base/Pestanas";
import { AGENTE_POR_ID, esIdAgente, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { AgentesFijados, Bienvenida, ConversacionesRecientes, LineaTiempo, type FilaConversacion, type Fijado } from "./Centro";
import { Ayuda, Consejos, Metricas, Novedades, ProximasCitas, TarjetaPlan } from "./Columna";
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
const formato = new Intl.NumberFormat("es-MX");

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
 * El resumen del panel con DATOS REALES: tu plan y tu uso, tu equipo, tus
 * conversaciones y los correos que Clara ya resumió. Donde todavía no hay
 * nada (citas, lo que espera tu visto bueno), un estado vacío que explica
 * qué va a aparecer ahí, sin inventar.
 */
export function ResumenPanel({
  nombre,
  planId,
  usados,
  activos,
  negocio,
  conGoogle,
  conversaciones,
  totalConversaciones,
  porAgente,
  resumenes,
  totalResumenes,
  mes,
}: {
  nombre?: string;
  planId: IdPlan;
  usados: number;
  activos: IdAgente[];
  negocio: string;
  conGoogle: boolean;
  conversaciones: ConversacionReal[];
  totalConversaciones: number;
  porAgente: Partial<Record<IdAgente, number>>;
  resumenes: ResumenReal[];
  totalResumenes: number;
  /** Lo de este mes (para "Este mes"). */
  mes: { conversaciones: number; resumenes: number };
}) {
  const ahora = useAhora();
  const plan = PLAN_POR_ID[planId];
  const eventos = actividadReal(resumenes, conversaciones);
  const ultima = conversaciones[0];
  const nombreNegocio = negocio === "tu negocio" ? "Tu negocio" : negocio;

  const hayAlgo = totalConversaciones > 0 || totalResumenes > 0;
  const resumen = hayAlgo ? (
    <>
      Este mes llevas <strong>{formato.format(usados)}</strong> de {formato.format(plan.mensajesMes)} mensajes. Tienes{" "}
      <strong>{formato.format(totalConversaciones)}</strong> {totalConversaciones === 1 ? "conversación" : "conversaciones"} con tu equipo y{" "}
      <strong>Clara</strong> ya resumió {formato.format(totalResumenes)} {totalResumenes === 1 ? "correo" : "correos"}.
    </>
  ) : (
    <>
      Tu equipo está listo: <strong>{nombresAgentes(activos)}</strong>. Empieza con una conversación o pega un correo para que Clara te diga de qué trata y qué
      conviene hacer.
    </>
  );

  const fijados: Fijado[] = activos.map((id) => ({
    id,
    estado: { tono: "exito", etiqueta: id === "clara" && conGoogle ? "Conectada a tu Gmail" : "En tu equipo" },
    meta:
      id === "clara"
        ? [
            { icono: "correo", texto: `${formato.format(totalResumenes)} ${totalResumenes === 1 ? "correo resumido" : "correos resumidos"}` },
            { icono: "mensaje", texto: `${porAgente.clara ?? 0} ${porAgente.clara === 1 ? "conversación" : "conversaciones"}` },
          ]
        : [{ icono: "mensaje", texto: `${porAgente[id] ?? 0} ${porAgente[id] === 1 ? "conversación" : "conversaciones"}` }],
    href: `/panel/chat?agente=${id}`,
  }));

  const filas: FilaConversacion[] = conversaciones.slice(0, 5).map((c) => {
    const ids = integrantes(c);
    return {
      id: c.id,
      titulo: ids.length > 1 ? c.tema || c.titulo : c.titulo,
      canal: ids.length > 1 ? "Grupo" : `Con ${AGENTE_POR_ID[ids[0]].nombre}`,
      ultimo: ids.length > 1 ? nombresAgentes(ids) : undefined,
      agentes: ids,
      fecha: c.actualizado_en,
      href: `/panel/chat?c=${encodeURIComponent(c.id)}`,
    };
  });

  const consejos: Consejo[] = [];
  if (!conGoogle) {
    consejos.push({
      id: "gmail",
      agente: "clara",
      titulo: "Conecta tu Gmail",
      texto: "Clara lee lo que no has leído y te dice qué conviene hacer. Solo lectura: nunca envía ni borra nada.",
      etiquetaAccion: "Ir a Correo",
      href: "/panel?vista=correo#gmail",
    });
  }
  if (plan.id !== "free" && activos.length > 1) {
    consejos.push({
      id: "grupo",
      agente: activos.includes("lola") ? "lola" : activos[0],
      titulo: "Arma un grupo",
      texto: `Junta a ${nombresAgentes(activos.slice(0, 2))} en una conversación y cada quien responde en lo suyo.`,
      etiquetaAccion: "Ir a Conversaciones",
      href: "/panel/chat",
    });
  }
  if (plan.id !== "max") {
    const siguiente = plan.id === "free" ? "lola" : "victor";
    consejos.push({
      id: "plan",
      agente: siguiente,
      titulo: `${AGENTE_POR_ID[siguiente].nombre} llega con ${planMinimo(siguiente).nombre}`,
      texto: AGENTE_POR_ID[siguiente].lema,
      etiquetaAccion: "Ver los planes",
      href: "/precios",
    });
  }

  return (
    <div className="dash-pagina dash-rejilla">
      <div className="dash-centro">
        <Bienvenida
          ahora={ahora}
          nombre={nombre}
          resumen={resumen}
          acciones={
            <>
              <Boton href="/panel/chat" icono={<Icono nombre="mensaje" tam={16} />}>
                Nueva conversación
              </Boton>
              <Boton variante="sutil" href="/panel?vista=correo" icono={<Icono nombre="correo" tam={16} />}>
                Resumir un correo
              </Boton>
            </>
          }
          tituloDia="Para hoy"
          dia={[
            {
              id: "conversaciones",
              icono: "conversaciones",
              texto: totalConversaciones ? `${formato.format(totalConversaciones)} ${totalConversaciones === 1 ? "conversación" : "conversaciones"}` : "Tu primera conversación",
              detalle: ultima ? `La última: ${ultima.tema || ultima.titulo}` : `Escríbele a ${AGENTE_POR_ID[activos[0] ?? "clara"].nombre}`,
              href: ultima ? `/panel/chat?c=${encodeURIComponent(ultima.id)}` : "/panel/chat",
            },
            {
              id: "correo",
              icono: "correo",
              texto: conGoogle ? "Revisa tu Gmail" : "Conecta tu Gmail",
              detalle: conGoogle ? "Clara resume lo que no has leído" : "Solo lectura: nunca envía ni borra",
              href: "/panel?vista=correo#gmail",
            },
            {
              id: "equipo",
              icono: "agentes",
              texto: `${activos.length} ${activos.length === 1 ? "agente" : "agentes"} en tu equipo`,
              detalle: nombresAgentes(activos),
              href: "/panel/agentes",
            },
          ]}
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
                    texto="Cada correo que Clara resuma y cada conversación con tus agentes aparece en esta línea de tiempo, con la hora."
                    accion={
                      <Boton variante="sutil" tam="compacto" href="/panel?vista=correo">
                        Resumir un correo de ejemplo
                      </Boton>
                    }
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
                    texto="Cuando un agente deje listo algo que salga a tu nombre (un mensaje a tus clientes, una respuesta de correo), aparecerá aquí antes de enviarse."
                  />
                ),
              },
              {
                id: "destacados",
                etiqueta: (
                  <span className="dash-pestana">
                    Destacados
                    <Insignia tono="pronto">Pronto</Insignia>
                  </span>
                ),
                deshabilitada: true,
              },
            ]}
          />
        </section>

        <AgentesFijados
          titulo="Tu equipo"
          fijados={fijados}
          accion={<EnlaceMas accion={{ href: "/panel/agentes" }}>Ver todos</EnlaceMas>}
        />

        <ConversacionesRecientes
          ahora={ahora}
          filas={filas}
          accion={filas.length ? <EnlaceMas accion={{ href: "/panel/chat" }}>Ver todas</EnlaceMas> : undefined}
          vacio={
            <Vacio
              agente={activos.includes("lola") ? "lola" : "clara"}
              titulo="Todavía no hablas con tu equipo"
              texto="Pídeles algo como se lo pedirías a tu recepcionista: un mensaje para confirmar citas, una respuesta a un correo, un reporte."
              accion={
                <Boton variante="sutil" tam="compacto" href="/panel/chat" icono={<Icono nombre="mensaje" tam={16} />}>
                  Empezar una conversación
                </Boton>
              }
            />
          }
        />
      </div>

      <aside className="dash-derecha" aria-label="Tu negocio, tu plan y novedades">
        <TarjetaPlan
          negocio={nombreNegocio}
          giro={negocio === "tu negocio" ? "Todavía sin nombre" : "Tu negocio"}
          plan={plan}
          usados={usados}
          equipo={activos}
          ahora={ahora}
          accion={<EnlaceMas accion={{ href: "/panel/agentes#plan" }}>Ver tu equipo y tu plan</EnlaceMas>}
        />
        <ProximasCitas
          titulo="Próximas citas"
          resumen="Pronto"
          citas={[]}
          vacio={
            <Vacio
              compacto
              agente="lola"
              titulo="Tu agenda vivirá aquí"
              texto="Cuando Lola lleve tus citas, aquí verás las de mañana: quién confirmó y quién no."
            />
          }
        />
        <Metricas
          titulo="Este mes"
          metricas={[
            { id: "mensajes", etiqueta: "Mensajes usados", valor: usados },
            { id: "conversaciones", etiqueta: "Conversaciones activas", valor: mes.conversaciones },
            { id: "correos", etiqueta: "Correos resumidos", valor: mes.resumenes },
          ]}
        />
        <Novedades />
        <Consejos consejos={consejos} />
        <Ayuda />
      </aside>
    </div>
  );
}
