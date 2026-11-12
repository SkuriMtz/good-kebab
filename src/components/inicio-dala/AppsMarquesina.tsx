import { CATALOGO } from "@/lib/conexiones/catalogo";
import { LOGO_APP } from "@/lib/conexiones/logos";
import type { IdApp } from "@/lib/nucleo-tipos";

/** Primero las más conocidas; después, las demás del catálogo que ya se conectan. */
const PRIMERO: IdApp[] = [
  "gmail",
  "whatsapp_business",
  "google_calendar",
  "instagram",
  "outlook",
  "stripe",
  "mercado_pago",
  "shopify",
  "notion",
  "calendly",
  "zoom",
  "slack",
  "paypal",
  "hubspot",
  "google_drive",
  "mercado_libre",
  "facturama",
];

/** Las apps que ya se conectan (sin las que están en camino), una por logo. */
function appsConLogo() {
  const listas = CATALOGO.filter((a) => a.fase === 1);
  const orden = [...PRIMERO.flatMap((id) => listas.filter((a) => a.id === id)), ...listas.filter((a) => !PRIMERO.includes(a.id))];
  const vistos = new Set<string>();
  return orden.filter((a) => {
    const logo = LOGO_APP[a.id];
    if (vistos.has(logo)) return false;
    vistos.add(logo);
    return true;
  });
}

/** Cuántas apps se conectan hoy (para el texto de abajo). */
export const APPS_CONECTABLES = CATALOGO.filter((a) => a.fase === 1).length;

/**
 * "Se conecta con las apps que ya usas": los logos de las apps que Atendel
 * conecta, en una sola fila que se desliza despacio (solo CSS, sin
 * JavaScript). Se detiene al pasar el cursor; con "reducir movimiento" queda
 * quieta. Las marcas son de sus dueños: aquí solo dicen con qué se conecta,
 * no que sean clientes.
 */
export function AppsMarquesina({ titulo, nota }: { titulo: string; nota: string }) {
  const apps = appsConLogo();
  const fila = (copia: boolean) => (
    <ul className="ini-apps__grupo" aria-hidden={copia || undefined} aria-label={copia ? undefined : titulo}>
      {apps.map((a) => (
        <li key={a.id} className="ini-apps__app" title={copia ? undefined : a.nombre}>
          {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
          <img src={LOGO_APP[a.id]} alt={copia ? "" : a.nombre} width={26} height={26} loading="lazy" decoding="async" />
        </li>
      ))}
    </ul>
  );
  return (
    <section className="ini-apps" aria-labelledby="apps-titulo">
      <h2 id="apps-titulo" className="ini-etiqueta ini-apps__titulo">
        {titulo}
      </h2>
      <div className="ini-apps__ventana">
        <div className="ini-apps__pista">
          {fila(false)}
          {fila(true)}
        </div>
      </div>
      <p className="ini-apps__nota">{nota}</p>
    </section>
  );
}
