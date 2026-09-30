import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

/**
 * AGENTE DE CORREO — MVP
 *
 * Flujo:
 * 1. Verifica que quien llama esté autenticado (Supabase) — SEGURIDAD:
 *    nadie puede usar este endpoint sin haber iniciado sesión.
 * 2. Busca el negocio del usuario autenticado (nunca confía en un
 *    negocio_id que venga del cliente — eso sería una falla de seguridad).
 * 3. Lee los correos recientes de Gmail usando el token de Google guardado
 *    en la sesión de Supabase.
 * 4. Le pasa cada correo a Claude para generar un resumen + acción sugerida.
 * 5. Guarda el resultado en la base de datos (protegido por RLS).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Verificar sesión — sin esto, cualquiera podría llamar al endpoint
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Obtener el token de Google guardado al iniciar sesión con "Sign in with Google"
  const { data: sessionData } = await supabase.auth.getSession();
  const providerToken = sessionData.session?.provider_token;

  if (!providerToken) {
    return NextResponse.json(
      { error: "No hay una conexión activa con Gmail. Vuelve a iniciar sesión con Google." },
      { status: 400 }
    );
  }

  // 2. Buscar el negocio del usuario (nunca se recibe negocio_id del cliente)
  const { data: negocio, error: negocioError } = await supabase
    .from("negocios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (negocioError || !negocio) {
    return NextResponse.json(
      { error: "No se encontró un negocio para este usuario" },
      { status: 404 }
    );
  }

  // 3. Leer correos recientes de Gmail
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: providerToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10,
    q: "is:unread",
  });

  const mensajes = listResponse.data.messages ?? [];
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const resultados = [];

  for (const mensajeRef of mensajes) {
    if (!mensajeRef.id) continue;

    const mensaje = await gmail.users.messages.get({
      userId: "me",
      id: mensajeRef.id,
      format: "metadata",
      metadataHeaders: ["Subject", "From"],
    });

    const headers = mensaje.data.payload?.headers ?? [];
    const asunto = headers.find((h) => h.name === "Subject")?.value ?? "(sin asunto)";
    const remitente = headers.find((h) => h.name === "From")?.value ?? "(desconocido)";
    const fragmento = mensaje.data.snippet ?? "";

    // 4. Generar resumen + acción sugerida con IA
    const respuestaIA = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Eres un asistente que ayuda a un negocio pequeño a priorizar su correo.
Da un resumen de 1-2 líneas y una acción sugerida corta (o "ninguna" si no aplica).
Responde SOLO en este formato exacto:
RESUMEN: <resumen>
ACCION: <acción sugerida>

Asunto: ${asunto}
De: ${remitente}
Contenido: ${fragmento}`,
        },
      ],
    });

    const textoIA =
      respuestaIA.content[0].type === "text" ? respuestaIA.content[0].text : "";
    const resumen = textoIA.match(/RESUMEN:\s*(.+)/)?.[1]?.trim() ?? fragmento;
    const accion = textoIA.match(/ACCION:\s*(.+)/)?.[1]?.trim() ?? "ninguna";

    // 5. Guardar (RLS garantiza que solo se guarda bajo el negocio del usuario)
    const { error: insertError } = await supabase
      .from("resumenes_correo")
      .upsert(
        {
          negocio_id: negocio.id,
          remitente,
          asunto,
          resumen,
          accion_sugerida: accion,
          correo_original_id: mensajeRef.id,
        },
        { onConflict: "negocio_id,correo_original_id" }
      );

    if (!insertError) {
      resultados.push({ asunto, remitente, resumen, accion });
    }
  }

  return NextResponse.json({ procesados: resultados.length, resultados });
}
