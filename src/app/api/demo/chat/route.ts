import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AGENTE_POR_ID, esIdAgente, type IdAgente } from "@/lib/agentes";
import { instruccionesDe, instruccionesGrupo } from "@/lib/agentes-prompts";
import { IDIOMAS } from "@/lib/ajustes";
import { MAX_DIAPOSITIVAS, MAX_PUNTOS, nombreArchivo, validarPresentacion } from "@/lib/archivos/presentacion";
import { DEMO_NEGOCIO } from "@/lib/demo-dashboard";
import { MODELO_DEMO, usarMensajeDemo } from "@/lib/demo-ia";
import { marcoDato } from "@/lib/demo-marcas";
import { EQUIPO_DEMO, correosDemoParaIA, datosDemoParaIA } from "@/lib/demo-negocio";
import { elegirContactos } from "@/lib/equipo";
import { conMarca } from "@/lib/grupo";
import { responderConHerramientas, type HerramientaChat, type PeticionRonda } from "@/lib/herramientas/ciclo";

/**
 * POST /api/demo/chat → la IA de verdad en /pruebalo, con los datos de
 * ejemplo de Estudio Luna. Sin cuenta: nada se guarda en la base (solo el
 * contador del límite). Modelo Sonnet 5.5, respuestas cortas y un
 * límite de 20 mensajes al día por visitante (src/lib/demo-ia.ts).
 *
 * Herramientas de la demostración: crear_presentacion (la presentación viaja
 * al navegador, que arma el .pptx) y proponer_envio_whatsapp (llega a
 * Pendientes de /pruebalo). Nada sale a ningún lado.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MARCA_ERROR = "\u0000ERROR:";
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });
const NEGOCIO = DEMO_NEGOCIO.nombre;

const DEMO = `

ESTÁS EN LA DEMOSTRACIÓN PÚBLICA DE ATENDEL:
- El negocio, sus clientes, su agenda, sus correos y su equipo son DE EJEMPLO (Estudio Luna). Quien escribe está probando Atendel.
- No hay apps conectadas: usa solo los datos de ejemplo de abajo. Si te piden algo que necesita una app (su WhatsApp, su agenda real), contesta con un ejemplo creíble y aclara en una frase que en su panel lo harías con sus datos de verdad.
- Si lo que piden necesita una app (Gmail, Google Calendar, Google Drive, Google Sheets, WhatsApp Business, Outlook, Excel o Stripe), agrega al final, en una línea aparte, su enlace para conectarla sin salir del chat, con este formato exacto: [Conectar Gmail](/pruebalo?conectar=gmail). Los ids: gmail, google_calendar, google_drive, google_sheets, whatsapp_business, outlook, excel, stripe. Uno solo, el que hace falta.
- Respuestas cortas y útiles (máximo unas 120 palabras), en español de México.
- Nunca pidas ni aceptes datos personales, contraseñas, tarjetas ni llaves.
- Solo ayudas con cosas de un negocio como este (clientes, citas, correo, ventas, reportes, documentos). Si te piden algo ajeno (tareas escolares, programar, temas fuera del negocio), dilo en una frase amable y ofrece algo del negocio.

Acciones de la demostración:
- Puedes ARMAR presentaciones con crear_presentacion: la persona la descarga desde una tarjeta que aparece sola debajo de tu mensaje (no escribas enlaces de descarga).
- Puedes PREPARAR un envío por WhatsApp al equipo de ejemplo (Luis y Sofía) con proponer_envio_whatsapp: queda en Pendientes para su visto bueno; nunca digas que ya se mandó.
- Si piden las dos cosas, primero la presentación y luego el envío.`;

type Linea = { de: string; texto: string };

export async function POST(req: NextRequest) {
  if (Number(req.headers.get("content-length") ?? "0") > 60_000) return error("El mensaje es demasiado largo.", 413);
  let body: { agentes?: unknown; historial?: unknown; mensaje?: unknown; tema?: unknown; idioma?: unknown };
  try {
    body = await req.json();
  } catch {
    return error("No entendí el mensaje.", 400);
  }
  const agentes = Array.from(new Set((Array.isArray(body.agentes) ? body.agentes : []).filter(esIdAgente))).slice(0, 4) as IdAgente[];
  if (!agentes.length) return error("¿Con quién hablas?", 400);
  const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim().slice(0, 2000) : "";
  if (!mensaje) return error("Escribe un mensaje.", 400);
  const grupo = agentes.length > 1 ? agentes : null;
  const tema = typeof body.tema === "string" ? body.tema.trim().slice(0, 120) : null;
  // El idioma de Ajustes > Apariencia (solo uno de la lista)
  const idioma = IDIOMAS.find((i) => i.id === body.idioma && i.id !== "es-MX");

  // El historial (lo de la pestaña): los últimos 16, con las marcas de grupo
  const lineas = (Array.isArray(body.historial) ? (body.historial as Linea[]) : [])
    .filter((l) => l && typeof l.texto === "string" && (l.de === "tu" || esIdAgente(l.de)))
    .slice(-16);
  const historial: Anthropic.MessageParam[] = [];
  for (const l of lineas) {
    const rol = l.de === "tu" ? "user" : "assistant";
    const texto = l.texto.slice(0, 3000);
    const contenido = grupo && rol === "assistant" ? conMarca(l.de as IdAgente, texto) : texto;
    const ultimo = historial[historial.length - 1];
    if (ultimo && ultimo.role === rol) ultimo.content = `${ultimo.content as string}\n\n${contenido}`;
    else historial.push({ role: rol, content: contenido });
  }
  while (historial[0]?.role === "assistant") historial.shift();
  if (historial[historial.length - 1]?.role === "user") historial.pop();

  if (!process.env.ANTHROPIC_API_KEY) return error("La IA de la demostración no está conectada (falta la llave; ver /api/demo/estado).", 503);
  const uso = await usarMensajeDemo(req);
  if ("error" in uso) return error(uso.error, uso.status);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const codificar = new TextEncoder();
  const corte = new AbortController();
  let flujo: { abort: () => void } | null = null;
  const datos = datosDemoParaIA();
  const correos = agentes.includes("clara") ? correosDemoParaIA() : undefined;
  const system =
    (grupo ? instruccionesGrupo(grupo, NEGOCIO, tema, correos, datos) : instruccionesDe(agentes[0], NEGOCIO, correos, datos)) +
    DEMO +
    (idioma ? `\n- Idioma: contesta SIEMPRE en ${idioma.es} (${idioma.nombre}), aunque estas instrucciones estén en español.` : "");
  const hace = (a: IdAgente): IdAgente => (agentes.includes(a) ? a : agentes[0]);

  const cuerpo = new ReadableStream<Uint8Array>({
    cancel() {
      corte.abort();
      flujo?.abort();
    },
    async start(controller) {
      const enviar = (t: string) => {
        try {
          controller.enqueue(codificar.encode(t));
        } catch {
          /* el navegador ya cerró */
        }
      };
      const herramientas: HerramientaChat[] = [
        {
          nombre: "crear_presentacion",
          descripcion: `Arma una presentación de PowerPoint con portada y diapositivas de título y puntos; la persona la descarga desde una tarjeta. Escribe tú el contenido con los datos de ejemplo. Máximo ${MAX_DIAPOSITIVAS} diapositivas y ${MAX_PUNTOS} puntos cortos por diapositiva.`,
          esquema: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              subtitulo: { type: "string" },
              diapositivas: {
                type: "array",
                items: { type: "object", properties: { titulo: { type: "string" }, puntos: { type: "array", items: { type: "string" } } }, required: ["titulo", "puntos"], additionalProperties: false },
              },
            },
            required: ["titulo", "diapositivas"],
            additionalProperties: false,
          },
          fuente: "Atendel (demostración)",
          estado: `${AGENTE_POR_ID[hace("iris")].nombre} está armando la presentación…`,
          async ejecutar(args) {
            const p = validarPresentacion(args);
            if (typeof p === "string") return `No se pudo armar: ${p}`;
            const archivo = nombreArchivo(p.titulo);
            enviar(marcoDato({ tipo: "presentacion", archivo, datos: { ...p, negocio: NEGOCIO } }));
            return `Presentación lista: «${archivo}», con ${p.diapositivas.length + 1} diapositivas. Ya aparece la tarjeta para descargarla debajo de tu mensaje; no escribas enlaces.`;
          },
        },
        {
          nombre: "proponer_envio_whatsapp",
          descripcion: "Deja en Pendientes un envío por WhatsApp a personas del equipo de ejemplo (Luis, Recepción; Sofía, Encargada), con un mensaje y la presentación si la hay. NO lo manda: espera el visto bueno.",
          esquema: {
            type: "object",
            properties: {
              para: { type: "array", items: { type: "string" }, description: 'Nombres o puestos, o ["todos"].' },
              mensaje: { type: "string" },
              archivo: { type: "string", description: "El nombre del archivo .pptx, si se manda una presentación." },
            },
            required: ["para", "mensaje"],
            additionalProperties: false,
          },
          fuente: "Atendel (demostración)",
          estado: `${AGENTE_POR_ID[hace("lola")].nombre} está preparando el envío…`,
          async ejecutar(args) {
            const para = (Array.isArray(args.para) ? args.para : []).filter((x): x is string => typeof x === "string").slice(0, 10);
            const texto = typeof args.mensaje === "string" ? args.mensaje.replace(/\s+/g, " ").trim().slice(0, 600) : "";
            if (!para.length || !texto) return "Falta a quién o el mensaje.";
            const { elegidos, sinEncontrar } = elegirContactos(para, EQUIPO_DEMO);
            if (!elegidos.length) return `No encontré a ${sinEncontrar.join(", ")} en el equipo de ejemplo. Están: Luis (Recepción) y Sofía (Encargada).`;
            const archivo = typeof args.archivo === "string" && args.archivo.trim() ? args.archivo.trim().slice(0, 80) : null;
            const nombres = elegidos.map((c) => c.nombre).join(" y ");
            enviar(
              marcoDato({
                tipo: "envio",
                pendiente: {
                  id: `envio-${Date.now()}`,
                  agente: hace("lola"),
                  titulo: archivo ? `Mandar «${archivo}» por WhatsApp` : "Mandar un mensaje por WhatsApp",
                  para: `A ${nombres} (tu equipo)`,
                  texto,
                  nota: "Al aprobar: se le manda a cada quien por WhatsApp",
                },
              }),
            );
            return `Envío listo en Pendientes para ${nombres}, esperando el visto bueno. No se mandó nada.`;
          },
        },
      ];
      try {
        const pedir = (p: PeticionRonda) => client.beta.messages.stream({ max_tokens: 1500, system, ...p, model: MODELO_DEMO });
        await responderConHerramientas({
          pedir,
          mensajes: [...historial, { role: "user" as const, content: mensaje }],
          herramientas,
          alTexto: (d) => enviar(d),
          alEstado: () => {},
          alFlujo: (f) => {
            flujo = f;
          },
          senal: corte.signal,
        });
      } catch (e) {
        let texto = "No se pudo obtener la respuesta. Intenta de nuevo.";
        if (e instanceof Anthropic.RateLimitError) texto = "La IA está saturada. Espera unos segundos.";
        enviar(MARCA_ERROR + texto);
      } finally {
        try {
          controller.close();
        } catch {
          /* ya estaba cerrado */
        }
      }
    },
  });

  return new Response(cuerpo, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Demo-Quedan": String(uso.quedan) } });
}
