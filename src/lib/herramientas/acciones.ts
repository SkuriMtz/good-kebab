import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { MAX_DIAPOSITIVAS, MAX_PUNTOS, TIPO_PPTX, generarPresentacion, nombreArchivo, validarPresentacion } from "@/lib/archivos/presentacion";
import { elegirContactos, mostrarWhatsapp, type ContactoEquipo } from "@/lib/equipo";
import { whatsappListo } from "@/lib/envios/whatsapp";
import type { HerramientaChat } from "./ciclo";

/**
 * ACCIONES DE ATENDEL en el chat (además de las apps de solo lectura):
 *
 * - crear_presentacion: arma un .pptx de verdad, lo guarda en el bucket
 *   privado "archivos" y regresa el enlace para descargarlo.
 * - proponer_envio_whatsapp: deja en Pendientes un envío a personas de tu
 *   equipo (Ajustes → Equipo). NUNCA manda nada: solo se manda cuando el
 *   dueño lo aprueba (/api/envios/[id]).
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function accionesDelChat(o: { supabase: SupabaseClient; userId: string; participantes: readonly IdAgente[]; conversacionId: string | null; negocio: string }): HerramientaChat[] {
  const hace = (preferido: IdAgente): IdAgente => (o.participantes.includes(preferido) ? preferido : o.participantes[0]);
  const iris = hace("iris");
  const lola = hace("lola");

  return [
    {
      nombre: "crear_presentacion",
      descripcion: `Arma una presentación de PowerPoint (.pptx) de verdad con portada y diapositivas de título y puntos, la guarda en Atendel y regresa el enlace para descargarla. Úsala cuando te pidan una presentación o diapositivas. Escribe el contenido tú, con los datos del negocio que tengas (no inventes cifras). Máximo ${MAX_DIAPOSITIVAS} diapositivas y ${MAX_PUNTOS} puntos cortos por diapositiva.`,
      esquema: {
        type: "object",
        properties: {
          titulo: { type: "string", description: "El título de la presentación (va en la portada y en el nombre del archivo)." },
          subtitulo: { type: "string", description: "Una línea debajo del título (opcional)." },
          diapositivas: {
            type: "array",
            description: "Las diapositivas después de la portada.",
            items: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                puntos: { type: "array", items: { type: "string" }, description: "Frases cortas, una idea cada una." },
              },
              required: ["titulo", "puntos"],
              additionalProperties: false,
            },
          },
        },
        required: ["titulo", "diapositivas"],
        additionalProperties: false,
      },
      fuente: "Atendel",
      estado: `${AGENTE_POR_ID[iris].nombre} está armando la presentación…`,
      async ejecutar(args) {
        const datos = validarPresentacion(args);
        if (typeof datos === "string") return `No se pudo armar: ${datos}`;
        const bytes = await generarPresentacion({ ...datos, negocio: o.negocio });
        const id = crypto.randomUUID();
        const nombre = nombreArchivo(datos.titulo);
        const ruta = `${o.userId}/${id}.pptx`;
        const subida = await o.supabase.storage.from("archivos").upload(ruta, bytes, { contentType: TIPO_PPTX, upsert: false });
        if (subida.error) return "No se pudo guardar la presentación. Dile a la persona que lo intente de nuevo en un momento.";
        const { error } = await o.supabase.from("archivos").insert({ id, owner_id: o.userId, conversacion_id: o.conversacionId, agente: iris, nombre, tipo: "pptx", ruta, bytes: bytes.byteLength });
        if (error) {
          await o.supabase.storage.from("archivos").remove([ruta]);
          return "No se pudo guardar la presentación. Dile a la persona que lo intente de nuevo en un momento.";
        }
        return [
          `Presentación lista: «${nombre}», con ${datos.diapositivas.length + 1} diapositivas (portada incluida).`,
          `archivo_id: ${id}`,
          `Dale el enlace a la persona escrito exactamente así: [Descargar ${nombre}](/api/archivos/${id})`,
          "Si también pidió mandarla a alguien, usa proponer_envio_whatsapp con este archivo_id.",
        ].join("\n");
      },
    },
    {
      nombre: "proponer_envio_whatsapp",
      descripcion:
        "Deja listo un envío por WhatsApp a personas del equipo del negocio (las que el dueño guardó en Ajustes → Equipo), con un mensaje y, si hay, un archivo que hayas creado. NO lo manda: queda en Pendientes → Por revisar y solo se manda cuando el dueño lo aprueba. Úsala cuando te pidan mandarle algo al equipo o a alguien de él.",
      esquema: {
        type: "object",
        properties: {
          para: { type: "array", items: { type: "string" }, description: 'Nombres o puestos de las personas (como estén en el equipo), o ["todos"] para todo el equipo.' },
          mensaje: { type: "string", description: "El mensaje corto que les llegará (sin firmar con tu nombre de agente)." },
          archivo_id: { type: "string", description: "El archivo_id que regresó crear_presentacion, si se manda un archivo." },
        },
        required: ["para", "mensaje"],
        additionalProperties: false,
      },
      fuente: "Atendel",
      estado: `${AGENTE_POR_ID[lola].nombre} está preparando el envío…`,
      async ejecutar(args) {
        const para = (Array.isArray(args.para) ? args.para : []).filter((x): x is string => typeof x === "string").slice(0, 20);
        const mensaje = typeof args.mensaje === "string" ? args.mensaje.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, 1000) : "";
        if (!para.length) return "Falta a quién mandarlo.";
        if (!mensaje) return "Falta el mensaje.";

        const { data, error } = await o.supabase.from("equipo_contactos").select("id, nombre, rol, whatsapp").eq("owner_id", o.userId).order("creado_en");
        if (error) return "No se pudo leer el equipo del negocio. Que lo intente de nuevo en un momento.";
        const contactos = (data ?? []) as ContactoEquipo[];
        if (!contactos.length) return "Todavía no hay nadie en el equipo del negocio. Dile a la persona que agregue a su equipo (nombre y WhatsApp) en Ajustes → Equipo y que te lo vuelva a pedir. No se preparó ningún envío.";
        const { elegidos, sinEncontrar } = elegirContactos(para, contactos);
        if (!elegidos.length) return `No encontré a ${sinEncontrar.join(", ")} en el equipo. En el equipo están: ${contactos.map((c) => `${c.nombre}${c.rol ? ` (${c.rol})` : ""}`).join(", ")}. No se preparó ningún envío.`;

        let archivoId: string | null = null;
        let nombreArch: string | null = null;
        if (typeof args.archivo_id === "string" && args.archivo_id.trim()) {
          const idA = args.archivo_id.trim();
          if (!UUID.test(idA)) return "Ese archivo_id no es válido.";
          const { data: a } = await o.supabase.from("archivos").select("id, nombre").eq("id", idA).eq("owner_id", o.userId).maybeSingle();
          if (!a) return "No encontré ese archivo.";
          archivoId = a.id as string;
          nombreArch = a.nombre as string;
        }

        const destinatarios = elegidos.map((c) => ({ nombre: c.nombre, whatsapp: c.whatsapp }));
        const { error: e2 } = await o.supabase.from("envios").insert({
          owner_id: o.userId,
          canal: "whatsapp",
          archivo_id: archivoId,
          conversacion_id: o.conversacionId,
          agente: lola,
          destinatarios,
          mensaje,
          estado: "por_aprobar",
        });
        if (e2) return "No se pudo dejar el envío en Pendientes. Que lo intente de nuevo en un momento.";
        return [
          `Envío listo en Pendientes → Por revisar, esperando el visto bueno del dueño. NO se ha mandado nada.`,
          `Para: ${elegidos.map((c) => `${c.nombre} (${mostrarWhatsapp(c.whatsapp)})`).join(", ")}.`,
          nombreArch ? `Archivo: ${nombreArch}.` : "Sin archivo.",
          sinEncontrar.length ? `No encontré a: ${sinEncontrar.join(", ")} (no van en el envío).` : "",
          whatsappListo() ? "Al aprobarlo, sale por WhatsApp." : "Ojo: el envío por WhatsApp todavía no está conectado; al aprobarlo queda guardado y sale en cuanto se conecte.",
          "Dile a la persona que lo revise en [Pendientes](/panel?vista=pendientes).",
        ]
          .filter(Boolean)
          .join("\n");
      },
    },
  ];
}

/** Lo que se agrega al system sobre estas acciones. */
export function instruccionesAcciones(participantes: readonly IdAgente[]): string {
  return [
    "",
    "",
    "Acciones de Atendel (además de leer apps):",
    "- Puedes ARMAR presentaciones de verdad con crear_presentacion (un archivo .pptx que la persona descarga). Hazlo cuando te pidan una presentación o diapositivas; escribe tú el contenido, claro y corto, con los datos que tengas del negocio, sin inventar cifras.",
    "- Puedes PREPARAR un envío por WhatsApp al equipo del negocio con proponer_envio_whatsapp. Nunca se manda solo: queda en Pendientes para que el dueño lo apruebe. Dilo así, sin decir que ya se mandó.",
    '- Si te piden las dos cosas ("haz la presentación y mándasela al equipo"), primero crear_presentacion y luego proponer_envio_whatsapp con su archivo_id.',
    "- Los enlaces que regresan estas herramientas (/api/archivos/…, /panel?vista=pendientes) dáselos a la persona tal cual, como enlace en formato [texto](ruta).",
    participantes.length > 1 ? "- En el grupo, la presentación la arma Iris si está, y el envío lo prepara Lola si está." : "",
  ]
    .filter((l, i) => i < 2 || l)
    .join("\n");
}
