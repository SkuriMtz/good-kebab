import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { AGENTE_POR_ID, esIdAgente, type IdAgente } from "@/lib/agentes";
import { instruccionesDe, instruccionesGrupo } from "@/lib/agentes-prompts";
import { conMarca, partirIntervenciones } from "@/lib/grupo";
import { bloqueParaAgentes, limpiarAjustes } from "@/lib/ajustes";
import { cargarCuenta } from "@/lib/cuenta";
import { contextoCorreo } from "@/lib/contexto-correo";
import { contextoPerfil } from "@/lib/contexto-negocio";
import { bloqueDocumentos } from "@/lib/contexto-documentos";
import { planMinimo } from "@/lib/planes";
import { Gasto, leerUso, registrarUso } from "@/lib/uso";
import { bloqueoConHora } from "@/lib/uso-estado";
import { conexionesVigentes } from "@/lib/conexiones/tokens";
import { responderConHerramientas, type PeticionRonda } from "@/lib/herramientas/ciclo";
import { herramientasDelChat, instruccionesHerramientas } from "@/lib/herramientas/preparar";
import { accionesDelChat, instruccionesAcciones } from "@/lib/herramientas/acciones";
import { marcoEstado } from "@/lib/estado-chat";

/**
 * CHAT CON LOS AGENTES
 *
 * Recibe un mensaje para un agente (o para un grupo de agentes), revisa en
 * el servidor que la persona tenga sesión, que su plan incluya a esos
 * agentes y que no haya pasado su límite del mes, y responde en vivo.
 * En un grupo contesta un solo modelo por todos: cada intervención llega
 * marcada con "@@id" y se guarda como un mensaje de ese agente.
 * Si Clara está (sola o en el grupo), el system lleva los resúmenes de
 * correo recientes de la persona (src/lib/contexto-correo.ts): solo
 * lectura, delimitados y marcados como datos, no instrucciones.
 * Para todos los agentes, el system lleva además el perfil del negocio y los
 * fragmentos de sus documentos que tienen que ver con el mensaje
 * (contexto-negocio.ts y contexto-documentos.ts), con las mismas reglas.
 * Con apps conectadas, los agentes usan herramientas de SOLO LECTURA (tool
 * use, src/lib/herramientas/): las de su área y, en un grupo, las de sus
 * miembros. Mientras corre una, si el cliente lo pidió (`estados: true`),
 * el stream lleva una línea de estado (src/lib/estado-chat.ts).
 * La conversación se guarda en Supabase; RLS impide ver la de otros.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_MENSAJE = 4000;
const HISTORIAL = 30; // mensajes previos que se le mandan a la IA
/** Marca que antecede a un error a mitad de la respuesta (el cliente la detecta). */
const MARCA_ERROR = "\u0000ERROR:";

const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);

  // 2. Lo que mandó el cliente
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return error("Petición inválida", 400);
  }
  const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim() : "";
  const conversacionId = typeof body.conversacionId === "string" ? body.conversacionId : null;
  if (!mensaje) return error("Escribe un mensaje.", 400);
  if (mensaje.length > MAX_MENSAJE) return error(`El mensaje es muy largo (máximo ${MAX_MENSAJE} caracteres).`, 400);
  // ¿El cliente sabe mostrar las líneas de estado? (si no, el stream es solo texto)
  const conEstados = body.estados === true || request.headers.get("x-atendel-estados") === "1";

  // Con quién: la conversación existente manda; si es nueva, lo que pidió el cliente
  let agente: IdAgente;
  let grupo: IdAgente[] | null = null;
  let tema: string | null = null;
  let conv: { id: string; agente: string; participantes: string[] | null; tema: string | null } | null = null;
  if (conversacionId) {
    const { data } = await supabase
      .from("conversaciones")
      .select("id, agente, participantes, tema")
      .eq("id", conversacionId)
      .maybeSingle();
    if (!data || !esIdAgente(data.agente)) return error("No se encontró la conversación.", 404);
    conv = data;
    agente = data.agente;
    grupo = Array.isArray(data.participantes) ? data.participantes.filter(esIdAgente) : null;
    tema = data.tema ?? null;
  } else if (Array.isArray(body.agentes)) {
    const pedidos = Array.from(new Set(body.agentes.filter(esIdAgente)));
    if (pedidos.length < 2 || pedidos.length !== body.agentes.length) return error("Un grupo necesita al menos 2 agentes.", 400);
    grupo = pedidos;
    agente = pedidos[0];
    tema = typeof body.tema === "string" && body.tema.trim() ? body.tema.trim().slice(0, 120) : null;
  } else {
    if (!esIdAgente(body.agente)) return error("Ese agente no existe.", 400);
    agente = body.agente;
  }
  if (grupo && grupo.length < 2) grupo = null;
  const participantes: IdAgente[] = grupo ?? [agente];

  // 3. Plan, equipo y uso (todo se decide aquí, nunca en el navegador)
  const cuenta = await cargarCuenta(supabase, user.id);
  const fuera = participantes.find((id) => !cuenta.activos.includes(id));
  if (fuera) {
    return error(
      !cuenta.plan.agentes.includes(fuera)
        ? `${AGENTE_POR_ID[fuera].nombre} está disponible con ${planMinimo(fuera).nombre}.`
        : `${AGENTE_POR_ID[fuera].nombre} no está en tu equipo. Agrégalo en "Mis agentes".`,
      403,
    );
  }
  // El límite de uso del plan (como Claude: sesión de 5 horas y semana)
  const limite = bloqueoConHora(await leerUso(supabase, user.id, cuenta.plan));
  if (limite) return NextResponse.json({ error: limite.texto, hasta: limite.hasta }, { status: 429 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return error("La IA todavía no está configurada: falta la llave de Anthropic (ANTHROPIC_API_KEY) en Vercel.", 503);
  }

  // 4. Conversación: la existente (RLS garantiza que es suya) o una nueva
  let idConversacion = conv?.id ?? null;
  let historial: Anthropic.MessageParam[] = [];
  if (idConversacion) {
    const { data: previos } = await supabase
      .from("mensajes")
      .select("rol, contenido, agente")
      .eq("conversacion_id", idConversacion)
      .order("creado_en", { ascending: false })
      .limit(HISTORIAL);
    for (const m of (previos ?? []).reverse()) {
      const rol = m.rol === "assistant" ? "assistant" : "user";
      // En grupos cada respuesta lleva su marca; varias seguidas se juntan en un solo turno
      const contenido = grupo && rol === "assistant" ? conMarca(esIdAgente(m.agente) ? m.agente : agente, m.contenido) : m.contenido;
      const ultimo = historial[historial.length - 1];
      if (ultimo && ultimo.role === rol && typeof ultimo.content === "string") ultimo.content += `\n\n${contenido}`;
      else historial.push({ role: rol, content: contenido });
    }
    // La conversación debe empezar con un mensaje de la persona
    while (historial.length && historial[0].role !== "user") historial.shift();
    // Y alternar: si el último guardado es de la persona (una respuesta que falló), se junta con el nuevo
    if (historial.length && historial[historial.length - 1].role === "user") historial.pop();
  } else {
    const titulo = (tema ?? mensaje).replace(/\s+/g, " ").slice(0, 80);
    const { data: nueva, error: errNueva } = await supabase
      .from("conversaciones")
      .insert({ owner_id: user.id, agente, titulo, participantes: grupo, tema })
      .select("id")
      .single();
    if (errNueva || !nueva) return error("No se pudo crear la conversación.", 500);
    idConversacion = nueva.id as string;
  }

  // 5. Guardar el mensaje y contarlo (para las estadísticas; el límite lo pone el uso real)
  const { error: errMensaje } = await supabase
    .from("mensajes")
    .insert({ conversacion_id: idConversacion, owner_id: user.id, rol: "user", contenido: mensaje });
  if (errMensaje) return error("No se pudo guardar tu mensaje.", 500);
  await supabase.rpc("sumar_mensaje");

  // 6. Contexto (solo lectura): si Clara está, los resúmenes de correo recientes (nunca el texto
  //    original); para todos, el perfil del negocio y los fragmentos de sus documentos
  const [correos, perfil, documentos, ajustesGuardados] = await Promise.all([
    participantes.includes("clara") ? contextoCorreo(supabase, user.id) : undefined,
    contextoPerfil(supabase, user.id),
    bloqueDocumentos(supabase, mensaje),
    // Lo que el dueño eligió en Ajustes (trato, estilo, firma, zona horaria, reglas por agente)
    supabase.from("ajustes_cuenta").select("datos").eq("owner_id", user.id).maybeSingle(),
  ]);
  const datosNegocio = [perfil, documentos].filter(Boolean).join("\n\n");
  const preferencias = bloqueParaAgentes(limpiarAjustes(ajustesGuardados.data?.datos), participantes);

  // 6b. Las apps conectadas: herramientas de solo lectura de estos agentes (sin tokens aquí)
  const conexiones = await conexionesVigentes(supabase, user.id);
  const deApps = herramientasDelChat({ supabase, userId: user.id, participantes, conexiones });
  // 6c. Acciones de Atendel: armar presentaciones y dejar envíos en Pendientes (nunca manda solo)
  const herramientas = [...deApps, ...accionesDelChat({ supabase, userId: user.id, participantes, conversacionId: idConversacion, negocio: cuenta.negocio })];
  const conApps = instruccionesHerramientas(participantes, deApps, conexiones) + instruccionesAcciones(participantes);

  // 7. Responder en vivo
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const codificar = new TextEncoder();
  const idFinal = idConversacion;

  let flujo: { abort: () => void } | null = null;
  const corte = new AbortController();
  const cuerpo = new ReadableStream<Uint8Array>({
    // La persona tocó "Detener": se corta también la respuesta de la IA y las herramientas (para no gastar de más)
    cancel() {
      corte.abort();
      flujo?.abort();
    },
    async start(controller) {
      let respuesta = "";
      // Lo que de verdad cuesta esta respuesta (todas sus rondas): cuenta para el límite del plan
      const gasto = new Gasto();
      // Si la persona detiene la respuesta, el flujo se cierra: ya no se escribe en él
      const enviar = (texto: string) => {
        try {
          controller.enqueue(codificar.encode(texto));
        } catch {
          /* el navegador ya cerró la conexión */
        }
      };
      try {
        const base = {
          max_tokens: 8000,
          system:
            (grupo
              ? instruccionesGrupo(grupo, cuenta.negocio, tema, correos, datosNegocio)
              : instruccionesDe(agente, cuenta.negocio, correos, datosNegocio)) +
            preferencias +
            conApps,
        };
        // Free usa Haiku (más económico, sin ajuste de esfuerzo); One y Max usan Opus
        const pedir = (p: PeticionRonda) =>
          cuenta.plan.modelo === "claude-haiku-4-5"
            ? client.beta.messages.stream({ ...base, ...p, model: cuenta.plan.modelo })
            : client.beta.messages.stream({
                ...base,
                ...p,
                model: cuenta.plan.modelo,
                output_config: { effort: cuenta.plan.esfuerzo },
                // Si el modelo declina por un falso positivo de seguridad, la API reintenta sola con otro modelo
                betas: ["server-side-fallback-2026-07-01"],
                fallbacks: "default",
              });
        // Texto en vivo; si pide herramientas, se corren (solo lectura) y sigue (máximo 4 rondas)
        const { final } = await responderConHerramientas({
          pedir,
          mensajes: [...historial, { role: "user" as const, content: mensaje }],
          herramientas,
          alTexto: (d) => {
            respuesta += d;
            enviar(d);
          },
          alEstado: (t) => {
            if (conEstados) enviar(marcoEstado(t));
          },
          alFlujo: (f) => {
            flujo = f;
          },
          alUso: (m) => gasto.sumar(m, cuenta.plan.modelo),
          senal: corte.signal,
        });
        if (final?.stop_reason === "refusal" && !respuesta) {
          respuesta = "No puedo ayudarte con eso. ¿Te ayudo con otra cosa del negocio?";
          enviar(respuesta);
        }
      } catch (e) {
        let texto = "No se pudo obtener la respuesta. Intenta de nuevo.";
        if (e instanceof Anthropic.AuthenticationError) texto = "La llave de Anthropic no es válida.";
        else if (e instanceof Anthropic.RateLimitError) texto = "La IA está saturada. Espera unos segundos.";
        else if (e instanceof Anthropic.BadRequestError) texto = "La IA rechazó la petición. Revisa el saldo de Anthropic.";
        enviar(MARCA_ERROR + texto);
      } finally {
        await registrarUso(supabase, gasto, "chat");
        if (respuesta.trim()) {
          // En grupo, cada intervención se guarda como mensaje de su agente
          const piezas = grupo ? partirIntervenciones(respuesta, grupo).filter((p) => p.texto) : [{ agente, texto: respuesta }];
          await supabase.from("mensajes").insert(
            piezas.map((p) => ({
              conversacion_id: idFinal,
              owner_id: user.id,
              rol: "assistant",
              agente: p.agente,
              contenido: p.texto.slice(0, 40000),
            })),
          );
        }
        await supabase
          .from("conversaciones")
          .update({ actualizado_en: new Date().toISOString() })
          .eq("id", idFinal);
        try {
          controller.close();
        } catch {
          /* ya estaba cerrado */
        }
      }
    },
  });

  return new Response(cuerpo, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Conversacion-Id": idFinal,
    },
  });
}
