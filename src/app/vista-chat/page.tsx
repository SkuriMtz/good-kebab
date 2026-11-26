import type { Metadata } from "next";

/**
 * PRUEBA: el inicio con un chat de Atendel en lugar del cerebro (FondoInicio lo
 * cambia al ver esta dirección). Si gusta, pasa a «/»; si no, se borra esta
 * carpeta y todo queda como antes. No aparece en buscadores.
 */
export { default, viewport } from "../page";

export const metadata: Metadata = { title: "Vista previa: chat en la portada", robots: { index: false, follow: false } };
