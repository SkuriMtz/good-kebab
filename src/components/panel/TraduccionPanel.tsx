"use client";

import { useEffect, useLayoutEffect } from "react";
import { SUGERENCIAS } from "./sugerencias";

/**
 * TODO el panel en el idioma de Ajustes > Apariencia (no solo los agentes).
 *
 * El panel está escrito en español; con otro idioma, este componente busca
 * los textos de la interfaz dentro de .pc (menús, botones, títulos,
 * ajustes, ventanas, y los placeholder, aria-label y title), los manda a
 * /api/traducir y cambia el texto en su lugar. Lo traducido se guarda en el
 * navegador (cada texto se pide una sola vez por idioma) y se aplica antes
 * de pintar, para que casi no se vea el español.
 *
 * - Nunca se traducen mensajes ni lo que escribes: se saltan las burbujas,
 *   el texto de los agentes, las cajas de texto y todo lo marcado con
 *   translate="no". Los agentes ya contestan en ese idioma.
 * - Solo cambia el texto (nodeValue), nunca la estructura: React sigue
 *   funcionando igual. Si React cambia un texto, se vuelve a traducir.
 * - Al regresar a español, todo vuelve a su texto original.
 */

const ATRIBUTOS = ["placeholder", "aria-label", "title"] as const;
const SALTAR = '[translate="no"], .pc-msj__texto, .pc-burbuja, .pc-msj__cuerpo, textarea, input, script, style, code, pre, [contenteditable="true"], .pc-escribe';
/** En los atributos (placeholder, aria-label, title) sí entran las cajas de texto: solo su contenido se salta. */
const SALTAR_ATRIBUTOS = '[translate="no"], .pc-msj__texto, .pc-burbuja, .pc-msj__cuerpo, script, style, code, pre';
const LOTE = 120;

/** Textos que no se mandan: sin letras, correos, enlaces, números. */
const traducible = (t: string) => /\p{L}{2,}/u.test(t) && !/^\S+@\S+$/.test(t) && !/^https?:\/\//.test(t) && t.length <= 300;

const antesDePintar = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Original = { texto: string; puesto: string };

export function TraduccionPanel({ idioma }: { idioma: string }) {
  antesDePintar(() => {
    const raiz = document.querySelector<HTMLElement>(".pc");
    if (!raiz) return;
    const enEspanol = idioma.startsWith("es");
    document.documentElement.lang = idioma.split("-")[0] || "es";
    if (enEspanol) return;

    const claveGuardado = `atendel-traduccion-${idioma}`;
    let guardado: Record<string, string> = {};
    try {
      guardado = JSON.parse(window.localStorage.getItem(claveGuardado) ?? "{}") as Record<string, string>;
    } catch {
      guardado = {};
    }
    const cache = new Map<string, string>(Object.entries(guardado));
    // Lo que se cambió, para poder regresarlo al español
    const textos = new Map<Text, Original>();
    const atributos = new Map<Element, Map<string, Original>>();
    const pendientes = new Set<string>();
    let reloj = 0;
    let vivo = true;
    let escribiendo = false;

    const saltar = (el: Element | null) => !el || el.closest(SALTAR) !== null;
    const saltarAtributos = (el: Element) => el.closest(SALTAR_ATRIBUTOS) !== null;

    // Separa los espacios de las orillas para traducir solo el texto
    const partes = (v: string) => {
      const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(v) ?? ["", "", v, ""];
      return { antes: m[1], nucleo: m[2], despues: m[3] };
    };

    const ponerTexto = (nodo: Text) => {
      const actual = nodo.nodeValue ?? "";
      const previo = textos.get(nodo);
      // Si React lo cambió (ya no es lo que pusimos), lo nuevo es el original
      const original = previo && previo.puesto === actual ? previo.texto : actual;
      const { antes, nucleo, despues } = partes(original);
      if (!traducible(nucleo)) return;
      const t = cache.get(nucleo);
      if (t === undefined) {
        pendientes.add(nucleo);
        textos.set(nodo, { texto: original, puesto: actual });
        return;
      }
      const puesto = antes + t + despues;
      textos.set(nodo, { texto: original, puesto });
      if (actual !== puesto) nodo.nodeValue = puesto;
    };

    const ponerAtributo = (el: Element, nombre: string) => {
      const actual = el.getAttribute(nombre);
      if (actual === null) return;
      let mapa = atributos.get(el);
      const previo = mapa?.get(nombre);
      const original = previo && previo.puesto === actual ? previo.texto : actual;
      const nucleo = original.trim();
      if (!traducible(nucleo)) return;
      const t = cache.get(nucleo);
      if (!mapa) {
        mapa = new Map();
        atributos.set(el, mapa);
      }
      if (t === undefined) {
        pendientes.add(nucleo);
        mapa.set(nombre, { texto: original, puesto: actual });
        return;
      }
      mapa.set(nombre, { texto: original, puesto: t });
      if (actual !== t) el.setAttribute(nombre, t);
    };

    const recorrer = (desde: Node) => {
      if (desde.nodeType === Node.TEXT_NODE) {
        if (!saltar(desde.parentElement)) ponerTexto(desde as Text);
        return;
      }
      if (!(desde instanceof Element) || saltarAtributos(desde)) return;
      for (const a of ATRIBUTOS) if (desde.hasAttribute(a)) ponerAtributo(desde, a);
      if (desde.matches(SALTAR)) return;
      const caminante = document.createTreeWalker(desde, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
        acceptNode: (n) => (n instanceof Element && n.matches(SALTAR_ATRIBUTOS) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      let n = caminante.nextNode();
      while (n) {
        if (n.nodeType === Node.TEXT_NODE) {
          if (!saltar(n.parentElement)) ponerTexto(n as Text);
        } else if (n instanceof Element) {
          // Las cajas de texto: sus atributos sí (placeholder), su contenido no
          for (const a of ATRIBUTOS) if (n.hasAttribute(a)) ponerAtributo(n, a);
        }
        n = caminante.nextNode();
      }
    };

    const aplicarTodo = () => {
      escribiendo = true;
      recorrer(raiz);
      escribiendo = false;
      // Los ejemplos de la caja cambian solos cada pocos segundos: se piden todos de una vez
      for (const t of Object.values(SUGERENCIAS).flat()) if (!cache.has(t)) pendientes.add(t);
      pedir();
    };

    const pedir = () => {
      if (!pendientes.size) return;
      window.clearTimeout(reloj);
      reloj = window.setTimeout(async () => {
        const lista = Array.from(pendientes).filter((t) => !cache.has(t));
        pendientes.clear();
        for (let i = 0; i < lista.length && vivo; i += LOTE) {
          const lote = lista.slice(i, i + LOTE);
          try {
            const r = await fetch("/api/traducir", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idioma, textos: lote }),
            });
            if (!r.ok) continue;
            const j = (await r.json()) as { traducciones?: unknown };
            if (!Array.isArray(j.traducciones)) continue;
            lote.forEach((t, k) => {
              const x = (j.traducciones as unknown[])[k];
              if (typeof x === "string") cache.set(t, x);
            });
          } catch {
            /* sin conexión: se queda en español y se intenta con el siguiente cambio */
          }
        }
        if (!vivo) return;
        try {
          // Se guarda lo más reciente (tope de 4000 textos por idioma)
          const entradas = Array.from(cache.entries()).slice(-4000);
          window.localStorage.setItem(claveGuardado, JSON.stringify(Object.fromEntries(entradas)));
        } catch {
          /* sin almacenamiento: vale para esta visita */
        }
        escribiendo = true;
        recorrer(raiz);
        escribiendo = false;
      }, 120);
    };

    // Lo nuevo que pinta React (ventanas, menús, mensajes de estado…)
    const observador = new MutationObserver((cambios) => {
      if (escribiendo) return;
      escribiendo = true;
      for (const c of cambios) {
        if (c.type === "characterData") {
          const n = c.target as Text;
          if (!saltar(n.parentElement)) ponerTexto(n);
        } else if (c.type === "attributes" && c.target instanceof Element && c.attributeName) {
          if (!saltarAtributos(c.target)) ponerAtributo(c.target, c.attributeName);
        } else c.addedNodes.forEach((n) => recorrer(n));
      }
      escribiendo = false;
      pedir();
    });
    aplicarTodo();
    observador.observe(raiz, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATRIBUTOS] });

    return () => {
      vivo = false;
      window.clearTimeout(reloj);
      observador.disconnect();
      // De regreso al español (o a otro idioma): cada texto vuelve a su original
      textos.forEach((o, nodo) => {
        if (nodo.isConnected && nodo.nodeValue === o.puesto) nodo.nodeValue = o.texto;
      });
      atributos.forEach((mapa, el) => {
        mapa.forEach((o, nombre) => {
          if (el.isConnected && el.getAttribute(nombre) === o.puesto) el.setAttribute(nombre, o.texto);
        });
      });
      document.documentElement.lang = "es";
    };
  }, [idioma]);

  return null;
}
