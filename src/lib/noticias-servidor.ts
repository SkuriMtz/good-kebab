import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IdIdioma } from "./ajustes";
import { cargarCuenta } from "./cuenta";
import { conUrlDeFoto, guardarFotos } from "./fotos-noticias";
import { claveNoticias, datosParaElegir, diaNoticias, ESQUEMA_ELECCION, listaParaElegir, noticiasElegidas, noticiasGuardadas, pedidoNoticias, resultadosDeBusqueda, type Noticia } from "./noticias";
import { MODELOS } from "./planes";
import { pasarLimite } from "./seguridad";
import { inicioSemana } from "./trabajo";
import { Gasto } from "./uso";

/*
 * Busca las noticias de tu industria (una vez al día por tipo de negocio +
 * idioma) y las guarda para todos los de ese tipo. Usa el modelo Rápido con la
 * búsqueda en internet (máximo 2 búsquedas: ~2 centavos de dólar). Lo paga, de
 * su «trabajo por su cuenta», quien la pidió primero ese día; si ya no le
 * alcanza, no se busca y se quedan las de antes.
 */

/** Lo que se aparta del límite para no dejar a nadie sin trabajo por su cuenta (una búsqueda cuesta ~15 mil). */
const RESERVA = 40_000;

type Fila = { dia: string; noticias: unknown } | null;

/** Las noticias guardadas para esa clave (de cualquier día) y de qué día son. */
export async function leerNoticiasGuardadas(supabase: SupabaseClient, clave: string): Promise<{ dia: string | null; noticias: Noticia[] }> {
  const { data } = await supabase.from("noticias_industria").select("dia, noticias").eq("clave", clave).maybeSingle();
  const fila = data as Fila;
  return { dia: fila?.dia ?? null, noticias: noticiasGuardadas(fila?.noticias) };
}

async function alcanza(admin: SupabaseClient, dueno: string, zona: string): Promise<boolean> {
  const cuenta = await cargarCuenta(admin, dueno);
  const { data } = await admin.from("trabajo_uso").select("costo").eq("owner_id", dueno).gte("creado_en", inicioSemana(zona));
  const gastado = (data ?? []).reduce((s, g) => s + (Number(g.costo) || 0), 0);
  return gastado + RESERVA <= cuenta.plan.trabajo.semana;
}

/**
 * Las de hoy: si ya están, esas; si no, las busca. Por tipo de negocio,
 * una búsqueda por hora como mucho y 3 al día, aunque muchos abran el
 * Tablero al mismo tiempo.
 */
export async function noticiasDeHoy(admin: SupabaseClient, dueno: string, o: { tipo: string | null; idioma: IdIdioma; zona: string }): Promise<Noticia[]> {
  const clave = claveNoticias(o.tipo, o.idioma);
  const dia = diaNoticias(o.zona);
  const antes = await leerNoticiasGuardadas(admin, clave);
  // Ya hay de hoy: esas. (Si hoy no salió ninguna, se vuelve a intentar, con los topes de abajo)
  if ((antes.dia === dia && antes.noticias.length) || !process.env.ANTHROPIC_API_KEY) return antes.noticias;
  // Tope por cuenta (cada vez que abre el Tablero sin noticias de hoy se pregunta; buscar, casi nunca)
  if (!(await pasarLimite(`noticias_usuario:${dueno}`, 12, 86_400, false))) return antes.noticias;
  if (!(await alcanza(admin, dueno, o.zona))) return antes.noticias;
  // Por tipo de negocio: una búsqueda a la vez (cada hora como mucho) y máximo 3 al día
  const hora = new Date().toISOString().slice(0, 13);
  if (!(await pasarLimite(`noticias:${clave}:${hora}`, 1, 2 * 3_600, false))) return antes.noticias;
  if (!(await pasarLimite(`noticias:${clave}:${dia}`, 3, 2 * 86_400, false))) return antes.noticias;

  const { system, mensaje, eleccion } = pedidoNoticias(o.tipo, o.idioma, dia);
  const gasto = new Gasto();
  const modelo = MODELOS.rapido.api;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const mensajes: Anthropic.MessageParam[] = [{ role: "user", content: mensaje }];
    const bloques: Anthropic.ContentBlock[] = [];
    // La búsqueda corre del lado de Anthropic; si la pausa (pause_turn), se le deja seguir (máximo 2 veces)
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
    // Paso 2: elegir de la lista numerada de resultados REALES (salida con formato fijo). La dirección
    // de cada noticia sale de la lista por su número, nunca de lo que escriba la IA.
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
    const encontradas = noticiasElegidas(crudo, lista);
    if (!encontradas.length) {
      // Nada sirvió: se quedan las de antes y se vuelve a intentar más tarde (máximo 3 al día)
      console.error(`Noticias: ninguna elegida (${lista.length} resultados, fin: ${r2.stop_reason})`);
      return antes.noticias;
    }
    // Cada una con su foto (la de la nota), guardada en Storage
    const noticias = await guardarFotos(admin, clave, dia, encontradas);
    const { error } = await admin.from("noticias_industria").upsert({ clave, dia, noticias, actualizado_en: new Date().toISOString() }, { onConflict: "clave" });
    if (error) console.error("Noticias: no se pudieron guardar", error.code);
    return noticias.map(conUrlDeFoto);
  } catch (e) {
    console.error("Noticias: la búsqueda falló", e instanceof Anthropic.APIError ? e.status : e instanceof Error ? e.message : e);
    return antes.noticias;
  } finally {
    if (gasto.costo > 0)
      await admin.from("trabajo_uso").insert({ owner_id: dueno, costo: Math.max(1, Math.min(Math.round(gasto.costo), 5_000_000)), entrada: gasto.entrada, salida: gasto.salida, modelo: gasto.modelo.slice(0, 60) });
  }
}
