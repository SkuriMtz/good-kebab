import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LIMITES, normalizarCorreo, revisarSolicitud, type RespuestaLista, type Solicitud } from "@/lib/lista";

/**
 * LISTA DE ESPERA Y CONTACTO
 *
 * Recibe { tipo, correo, nombre?, negocio?, mensaje? } y lo guarda en la
 * tabla `solicitudes` de Supabase con la clave pública (anon) y la sesión del
 * visitante si tiene una. La tabla SOLO permite insertar (RLS): nadie puede
 * leerla desde el sitio. Nunca se usa la service role key.
 *
 * Mientras la migración 0005_solicitudes.sql no se corra en Supabase, responde
 * con un mensaje amable en lugar de un error técnico.
 */

const responder = (cuerpo: RespuestaLista, status = 200) => NextResponse.json(cuerpo, { status });

/** Texto opcional: recortado, vacío → undefined, o null si es inválido. */
function opcional(valor: unknown, max: number): string | undefined | null {
  if (valor === undefined || valor === null) return undefined;
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  if (limpio.length > max) return null;
  return limpio || undefined;
}

export async function POST(request: NextRequest) {
  // 1. Que sea JSON y no un archivo gigante
  const largo = Number(request.headers.get("content-length") ?? "0");
  if (largo > 10_000) return responder({ ok: false, error: "El mensaje es demasiado largo." }, 413);

  let cuerpo: Record<string, unknown>;
  try {
    const datos = await request.json();
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) throw new Error("forma");
    cuerpo = datos as Record<string, unknown>;
  } catch {
    return responder({ ok: false, error: "No pudimos leer el formulario. Intenta de nuevo." }, 400);
  }

  // 2. Campo trampa: las personas no lo ven; si viene lleno, es un bot. Se le
  //    contesta "ok" para no darle pistas, pero no se guarda nada.
  if (typeof cuerpo.sitio_web === "string" && cuerpo.sitio_web.trim() !== "") return responder({ ok: true });

  // 3. Validar con las mismas reglas que el navegador
  const tipo = cuerpo.tipo === "contacto" ? "contacto" : cuerpo.tipo === undefined || cuerpo.tipo === "lista" ? "lista" : null;
  const correo = typeof cuerpo.correo === "string" ? normalizarCorreo(cuerpo.correo) : "";
  const nombre = opcional(cuerpo.nombre, LIMITES.nombre);
  const negocio = opcional(cuerpo.negocio, LIMITES.negocio);
  const mensaje = opcional(cuerpo.mensaje, LIMITES.mensaje);
  if (tipo === null || nombre === null || negocio === null || mensaje === null) {
    return responder({ ok: false, error: "Revisa los datos del formulario: algún campo es demasiado largo." }, 400);
  }
  const solicitud: Solicitud = { tipo, correo, nombre, negocio, mensaje };
  const problema = revisarSolicitud(solicitud);
  if (problema) return responder({ ok: false, error: problema }, 400);

  // 4. Guardar (solo insertar; sin .select(), porque nadie puede leer la tabla)
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("solicitudes").insert({
      tipo,
      correo,
      nombre: nombre ?? null,
      negocio: negocio ?? null,
      mensaje: mensaje ?? null,
    });

    if (error) {
      // Ya estaba en la lista: para la persona es lo mismo, quedó anotada
      if (error.code === "23505") return responder({ ok: true });
      // La tabla todavía no existe (falta correr la migración en Supabase)
      if (error.code === "42P01" || error.code === "PGRST205") {
        console.error("[api/lista] Falta la tabla `solicitudes`: corre supabase/migrations/0005_solicitudes.sql", error.code);
        return responder(
          { ok: false, error: "La lista de espera abre muy pronto. Mientras, puedes probar a los agentes en Pruébalo." },
          503,
        );
      }
      // La base de datos rechazó algún valor (sus reglas son las mismas que las de aquí)
      if (error.code === "23514") return responder({ ok: false, error: "Revisa tu correo y los datos del formulario." }, 400);
      console.error("[api/lista] No se pudo guardar", error.code);
      return responder({ ok: false, error: "No pudimos guardar tus datos. Intenta de nuevo en un momento." }, 500);
    }
    return responder({ ok: true });
  } catch (e) {
    console.error("[api/lista] Error inesperado", e instanceof Error ? e.message : e);
    return responder({ ok: false, error: "No pudimos guardar tus datos. Intenta de nuevo en un momento." }, 500);
  }
}
