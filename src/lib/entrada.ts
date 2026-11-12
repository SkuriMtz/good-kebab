/**
 * La entrada al panel (src/components/panel/EntradaPanel.tsx) sale una vez por
 * pestaña. Este script corre en el <head>, antes de pintar: si ya se vio (o la
 * persona pide menos movimiento), marca <html data-entrada-vista> y el CSS la
 * esconde desde el primer cuadro, sin destellos.
 */
export const CLAVE_ENTRADA = "atendel-entrada-vista";

export const SCRIPT_ENTRADA = `(function(){var d=document.documentElement;try{if(sessionStorage.getItem('${CLAVE_ENTRADA}')||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))d.setAttribute('data-entrada-vista','')}catch(e){d.setAttribute('data-entrada-vista','')}})()`;
