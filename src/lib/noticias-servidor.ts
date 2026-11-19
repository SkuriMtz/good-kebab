import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { limpiarAjustes, type IdIdioma } from "./ajustes";
import { borrarFotosViejas, conUrlDeFoto, guardarFotos } from "./fotos-noticias";
import { claveNoticias, datosParaElegir, diaNoticias, ESQUEMA_ELECCION, listaParaElegir, MAX_MOSTRAR, noticiasElegidas, noticiasGuardadas, pedidoNoticias, resultadosDeBusqueda, type Noticia } from "./noticias";
import { MODELOS } from "./planes";
import { pasarLimite } from "./seguridad";
import { Gasto } from "./uso";

/*
 * LAS NOTICIAS DE TU INDUSTRIA: se buscan una vez al día por tipo de negocio
 * + idioma y se comparten entre todos los de ese tipo.
 *
 * - Se preparan solas en la madrugada (pg_cron cada hora, migración 0038),
 *   solo para tipos de negocio con gente activa; si alguien abre el Tablero y
 *   todavía no están, se buscan en ese momento.
 * - Son un costo de Atendel, no del límite de nadie, con topes: por tipo de
 *   negocio, una búsqueda por hora como mucho y 3 al día; en total, 150 al
 *   día. Lo que costó cada una queda en noticias_industria.costo.
 * - Siempre con foto: solo pasan las noticias cuya foto se pudo bajar.
 */

type Fila = { dia: string; noticias: unknown } | null;
type Pedido = { tipo: string | null; idioma: IdIdioma; zona: string };

/** Tope de búsquedas al día para todo Atendel (~3 dólares). */
const TOPE_GLOBAL = 150;

/** Las noticias guardadas para esa clave (de cualquier día) y de qué día son. */
export async function leerNoticiasGuardadas(supabase: SupabaseClient, clave: string): Promise<{ dia: string | null; noticias: Noticia[] }> {
  const { data } = await supabase.from("noticias_industria").select("dia, noticias").eq("clave", clave).maybeSingle();
  const fila = data as Fila;
  return { dia: fila?.dia ?? null, noticias: noticiasGuardadas(fila?.noticias) };
}

/** Busca, elige y guarda las de hoy de esa clave (si tocan y los topes lo permiten). Regresa las que haya. */
async function buscarYGuardar(admin: SupabaseClient, o: Pedido): Promise<Noticia[]> {
  const clave = claveNoticias(o.tipo, o.idioma);
  const dia = diaNoticias(o.zona);
  const antes = await leerNoticiasGuardadas(admin, clave);
  // Ya hay de hoy: esas. (Si hoy no salió ninguna, se vuelve a intentar, con los topes de abajo)
  if ((antes.dia === dia && antes.noticias.length) || !process.env.ANTHROPIC_API_KEY) return antes.noticias;
  const hora = new Date().toISOString().slice(0, 13);
  if (!(await pasarLimite(`noticias:${clave}:${hora}`, 1, 2 * 3_600, false))) return antes.noticias;
  if (!(await pasarLimite(`noticias:${clave}:${dia}`, 3, 2 * 86_400, false))) return antes.noticias;
  if (!(await pasarLimite(`noticias:global:${new Date().toISOString().slice(0, 10)}`, TOPE_GLOBAL, 2 * 86_400, false))) return antes.noticias;

  const { system, mensaje, eleccion } = pedidoNoticias(o.tipo, o.idioma, dia);
  const gasto = new Gasto();
  const modelo = MODELOS.rapido.api;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    // Paso 1: buscar y apuntar (la búsqueda corre del lado de Anthropic; si la pausa, se le deja seguir)
    const mensajes: Anthropic.MessageParam[] = [{ role: "user", content: mensaje }];
    const bloques: Anthropic.ContentBlock[] = [];
    for (let vuelta = 0; vuelta < 3; vuelta++) {
      const r = await client.messages.create(
        {
          model: modelo,
          max_tokens: 3000,
          output_config: { effort: MODELOS.rapido.esfuerzo },
          system,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 2, user_location: { type: "approximate", timezone: o.zona } }],
          messages: mensajes,
        },
        { timeout: 45_000, maxRetries: 1 },
      );
      gasto.sumar(r, modelo);
      bloques.push(...r.content);
      if (r.stop_reason !== "pause_turn") break;
      mensajes.push({ role: "assistant", content: r.content });
    }
    // Paso 2: elegir de la lista NUMERADA de resultados reales (salida de formato fijo). La dirección de
    // cada noticia sale de la lista por su número, nunca de lo que escriba la IA.
    const lista = listaParaElegir(resultadosDeBusqueda(bloques));
    if (!lista.length) {
      console.error("Noticias: la búsqueda no trajo resultados");
      return antes.noticias;
    }
    const notas = bloques.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const r2 = await client.messages.create(
      {
        model: modelo,
        max_tokens: 1500,
        output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA_ELECCION as unknown as Record<string, unknown> } },
        system: eleccion,
        messages: [{ role: "user", content: datosParaElegir(lista, notas) }],
      },
      { timeout: 30_000, maxRetries: 1 },
    );
    gasto.sumar(r2, modelo);
    const texto = r2.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    let crudo: unknown = null;
    try {
      crudo = r2.stop_reason === "end_turn" ? JSON.parse(texto) : null;
    } catch {
      crudo = null;
    }
    const elegidas = noticiasElegidas(crudo, lista);
    // Siempre con foto: se bajan las fotos de las elegidas (hasta 6) y se quedan las que sí tienen
    const conFoto = (await guardarFotos(admin, clave, dia, elegidas)).filter((n) => n.foto).slice(0, MAX_MOSTRAR);
    if (!conFoto.length) {
      console.error(`Noticias: ninguna con foto (${lista.length} resultados, ${elegidas.length} elegidas, fin: ${r2.stop_reason})`);
      return antes.noticias;
    }
    const noticias = conFoto.map((n, i) => ({ ...n, id: String(i + 1) }));
    const { error } = await admin
      .from("noticias_industria")
      .upsert({ clave, dia, noticias, costo: Math.min(Math.round(gasto.costo), 5_000_000), actualizado_en: new Date().toISOString() }, { onConflict: "clave" });
    if (error) {
      console.error("Noticias: no se pudieron guardar", error.code);
      return antes.noticias;
    }
    await borrarFotosViejas(admin, clave, dia);
    return noticias.map(conUrlDeFoto);
  } catch (e) {
    console.error("Noticias: la búsqueda falló", e instanceof Anthropic.APIError ? e.status : e instanceof Error ? e.message : e);
    return antes.noticias;
  }
}

/** Para el Tablero, si las guardadas no son de hoy (las busca si nadie lo ha hecho). */
export async function noticiasDeHoy(admin: SupabaseClient, dueno: string, o: Pedido): Promise<Noticia[]> {
  // Tope por cuenta: cada vez que abre el Tablero sin noticias de hoy se pregunta (buscar, casi nunca)
  if (!(await pasarLimite(`noticias_usuario:${dueno}`, 12, 86_400, false))) return (await leerNoticiasGuardadas(admin, claveNoticias(o.tipo, o.idioma))).noticias;
  return buscarYGuardar(admin, o);
}

/**
 * En la madrugada (cada hora, desde /api/trabajo?que=noticias): prepara las de
 * hoy de los tipos de negocio con gente activa, mientras haya tiempo.
 */
export async function prepararNoticias(admin: SupabaseClient, tiempo: number): Promise<{ tipos: number; intentos: number }> {
  const empezo = Date.now();
  const { data } = await admin.rpc("negocios_para_noticias");
  const porClave = new Map<string, Pedido>();
  for (const f of (data ?? []) as { tipo: string; idioma: string; zona: string }[]) {
    const aj = limpiarAjustes({ idioma: f.idioma, zonaHoraria: f.zona });
    const tipo = f.tipo || null;
    const clave = claveNoticias(tipo, aj.idioma);
    if (!porClave.has(clave)) porClave.set(clave, { tipo, idioma: aj.idioma, zona: aj.zonaHoraria });
  }
  let intentos = 0;
  // En desorden, para que con muchos tipos a todos les toque
  for (const o of [...porClave.values()].sort(() => Math.random() - 0.5)) {
    if (Date.now() - empezo > tiempo) break;
    const antes = await leerNoticiasGuardadas(admin, claveNoticias(o.tipo, o.idioma));
    if (antes.dia === diaNoticias(o.zona) && antes.noticias.length) continue;
    intentos++;
    await buscarYGuardar(admin, o);
  }
  return { tipos: porClave.size, intentos };
}
