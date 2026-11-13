"use client";

import { useEffect, useRef } from "react";
import { COLORES_FRAGMENTO } from "./Piezas";

/**
 * Detrás del saludo del Inicio (en lugar del resplandor azul): fragmentos
 * de Atendel flotando, solo dentro de un círculo que se desvanece en la
 * orilla (máscara en CSS). Triangulitos huecos en los colores de la marca,
 * en 3 profundidades: giran despacio alrededor del centro, se mecen y
 * titilan apenas. En el centro, donde van el saludo y la caja, son más
 * tenues para no estorbar la lectura.
 *
 * Canvas 2D, máximo 2× de densidad, pausa con la pestaña oculta; con
 * "reducir movimiento" (del sistema o de Ajustes) se pinta una vez y queda
 * quieto.
 */

type Fragmento = {
  /** Distancia al centro (0 a 1 del radio) y ángulo. */
  r: number;
  a: number;
  /** Vuelta alrededor del centro (rad/s) y meneo hacia dentro y fuera. */
  vuelta: number;
  meneo: number;
  fase: number;
  tam: number;
  giro: number;
  vgiro: number;
  color: string;
  alfa: number;
  titila: number;
};

const CAPAS = [
  { n: 0.5, tam: [3, 5], alfa: [0.32, 0.5], vuelta: 0.012 },
  { n: 0.35, tam: [5, 8], alfa: [0.42, 0.66], vuelta: 0.02 },
  { n: 0.15, tam: [8, 12], alfa: [0.3, 0.5], vuelta: 0.03 },
] as const;

const azar = (a: number, b: number) => a + Math.random() * (b - a);

function crear(total: number): Fragmento[] {
  const lista: Fragmento[] = [];
  for (const capa of CAPAS) {
    const n = Math.round(total * capa.n);
    for (let i = 0; i < n; i++) {
      lista.push({
        // Más hacia la orilla que al centro (el centro queda despejado)
        r: Math.sqrt(azar(0.04, 1)),
        a: Math.random() * Math.PI * 2,
        vuelta: capa.vuelta * azar(0.6, 1.4) * (Math.random() < 0.5 ? -1 : 1),
        meneo: azar(0.01, 0.035),
        fase: Math.random() * Math.PI * 2,
        tam: azar(capa.tam[0], capa.tam[1]),
        giro: Math.random() * Math.PI * 2,
        vgiro: azar(-0.25, 0.25),
        color: COLORES_FRAGMENTO[Math.floor(Math.random() * COLORES_FRAGMENTO.length)],
        alfa: azar(capa.alfa[0], capa.alfa[1]),
        titila: azar(0.4, 1.1),
      });
    }
  }
  return lista;
}

export function FragmentosInicio() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lienzo = ref.current;
    const ctx = lienzo?.getContext("2d");
    if (!lienzo || !ctx) return;
    const quieto = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || lienzo.closest(".pc")?.getAttribute("data-movimiento") === "reducido";
    let ancho = 0;
    let alto = 0;
    let dpr = 1;
    let fragmentos: Fragmento[] = [];
    let cuadro = 0;
    let antes = 0;
    let t = 0;

    const medir = () => {
      const caja = lienzo.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      ancho = caja.width;
      alto = caja.height;
      lienzo.width = Math.round(ancho * dpr);
      lienzo.height = Math.round(alto * dpr);
      // Menos en celular
      fragmentos = crear(ancho < 600 ? 46 : 92);
    };

    const pintar = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, ancho, alto);
      const cx = ancho / 2;
      const cy = alto / 2;
      const rx = ancho / 2;
      const ry = alto / 2;
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      for (const f of fragmentos) {
        const r = f.r + Math.sin(t * 0.5 + f.fase) * f.meneo;
        const a = f.a + t * f.vuelta;
        const x = cx + Math.cos(a) * rx * r;
        const y = cy + Math.sin(a) * ry * r;
        // En el centro (saludo y caja) más tenues
        const centro = r < 0.42 ? 0.25 + (r / 0.42) * 0.75 : 1;
        const brillo = 0.75 + 0.25 * Math.sin(t * f.titila + f.fase);
        const h = f.tam * 0.866;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(f.giro + t * f.vgiro);
        ctx.globalAlpha = f.alfa * centro * brillo;
        ctx.strokeStyle = f.color;
        ctx.beginPath();
        ctx.moveTo(0, (-h * 2) / 3);
        ctx.lineTo(f.tam / 2, h / 3);
        ctx.lineTo(-f.tam / 2, h / 3);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    };

    const paso = (ahora: number) => {
      if (!document.hidden) {
        t += Math.min(0.05, (ahora - (antes || ahora)) / 1000);
        pintar();
      }
      antes = ahora;
      cuadro = requestAnimationFrame(paso);
    };

    const arrancar = () => {
      cancelAnimationFrame(cuadro);
      antes = 0;
      if (quieto()) pintar();
      else cuadro = requestAnimationFrame(paso);
    };

    medir();
    arrancar();
    const observador = new ResizeObserver(() => {
      medir();
      if (quieto()) pintar();
    });
    observador.observe(lienzo);
    const movimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
    movimiento.addEventListener("change", arrancar);
    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      movimiento.removeEventListener("change", arrancar);
    };
  }, []);

  return <canvas ref={ref} className="pc-inicio__resplandor pc-inicio__fragmentos" aria-hidden="true" />;
}
