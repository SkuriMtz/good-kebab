import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { resumirCorreo } from "@/lib/resumir";

/**
 * AGENTE DE CORREO — MODO DE PRUEBA
 *
 * Igual que el agente de Gmail, pero en lugar de leer la bandeja de entrada
 * recibe UN correo que el usuario pega en la pantalla. Sirve para probar la
 * IA, la base de datos y la seguridad sin tener que configurar Google Cloud.
 *
 * Las mismas reglas de seguridad aplican: solo usuarios con sesión, el
 * negocio se busca en el servidor (nunca se confía en el cliente), y RLS
 * protege lo que se guarda.
 */

// Límites para que nadie pueda mandar textos gigantes (y gastar tu saldo de IA)
const MAX_ASUNTO = 300;
const MAX_REMITENTE = 300;
const MAX_CONTENIDO = 5000;

function texto(valor: unknown, max: number) {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  if (limpio.length > max) return null;
  return limpio;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Verificar sesión
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2. Validar lo que mandó el usuario
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const asunto = texto(body.asunto, MAX_ASUNTO);
  const remitente = texto(body.remitente, MAX_REMITENTE);
  const contenido = texto(body.contenido, MAX_CONTENIDO);

  if (asunto === null || remitente === null || !contenido) {
    return NextResponse.json(
      {
        error: `Revisa los campos: el contenido es obligatorio (máx. ${MAX_CONTENIDO} caracteres) y el asunto/remitente no pueden pasar de ${MAX_ASUNTO}.`,
      },
      { status: 400 }
    );
  }

  // 3. Buscar el negocio del usuario (nunca se recibe negocio_id del cliente)
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

  // 4. Generar resumen + acción sugerida con IA
  let resultado;
  try {
    resultado = await resumirCorreo({
      asunto: asunto || "(sin asunto)",
      remitente: remitente || "(desconocido)",
      contenido,
    });
  } catch (e) {
    const mensaje =
      e instanceof Anthropic.AuthenticationError
        ? "La clave de Anthropic no es válida. Revisa ANTHROPIC_API_KEY en tu .env.local."
        : "No se pudo generar el resumen con la IA. Intenta de nuevo.";
    return NextResponse.json({ error: mensaje }, { status: 502 });
  }

  // 5. Guardar (RLS garantiza que solo se guarda bajo el negocio del usuario)
  const { error: insertError } = await supabase.from("resumenes_correo").insert({
    negocio_id: negocio.id,
    remitente: remitente || "(desconocido)",
    asunto: asunto || "(sin asunto)",
    resumen: resultado.resumen,
    accion_sugerida: resultado.accion,
  });

  if (insertError) {
    return NextResponse.json(
      { error: "Se generó el resumen pero no se pudo guardar" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    asunto: asunto || "(sin asunto)",
    remitente: remitente || "(desconocido)",
    resumen: resultado.resumen,
    accion: resultado.accion,
  });
}
