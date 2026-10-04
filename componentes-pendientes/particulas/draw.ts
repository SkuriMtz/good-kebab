const C120 = -0.5;
const S120 = 0.8660254037844386;

/** Agrega al trazo actual un triángulo equilátero de "radio" s, girado r radianes. */
export function triangulo(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, r: number) {
  const c0 = Math.cos(r);
  const s0 = Math.sin(r);
  const c1 = c0 * C120 - s0 * S120;
  const s1 = s0 * C120 + c0 * S120;
  const c2 = c0 * C120 + s0 * S120;
  const s2 = s0 * C120 - c0 * S120;
  ctx.moveTo(x + c0 * s, y + s0 * s);
  ctx.lineTo(x + c1 * s, y + s1 * s);
  ctx.lineTo(x + c2 * s, y + s2 * s);
  ctx.closePath();
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Ajusta el tamaño interno del canvas a su tamaño en pantalla (nítido en retina). */
export function ajustarCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: r.width, h: r.height };
}

/**
 * Corre `dibujar` en cada cuadro solo mientras el canvas está en pantalla y
 * la pestaña está visible (ahorra batería en celulares).
 */
export function bucleVisible(canvas: HTMLCanvasElement, dibujar: (ahora: number) => void) {
  let raf = 0;
  let corriendo = false;
  let enPantalla = false;
  const cuadro = (ahora: number) => {
    dibujar(ahora);
    raf = requestAnimationFrame(cuadro);
  };
  const iniciar = () => {
    if (corriendo) return;
    corriendo = true;
    raf = requestAnimationFrame(cuadro);
  };
  const detener = () => {
    corriendo = false;
    cancelAnimationFrame(raf);
  };
  const io = new IntersectionObserver(
    ([e]) => {
      enPantalla = e.isIntersecting;
      if (enPantalla && !document.hidden) iniciar();
      else detener();
    },
    { rootMargin: "160px" },
  );
  io.observe(canvas);
  const alCambiarVisibilidad = () => {
    if (document.hidden) detener();
    else if (enPantalla) iniciar();
  };
  document.addEventListener("visibilitychange", alCambiarVisibilidad);
  return () => {
    detener();
    io.disconnect();
    document.removeEventListener("visibilitychange", alCambiarVisibilidad);
  };
}
