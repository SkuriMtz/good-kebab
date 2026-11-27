import type { Metadata } from "next";
import { Sitio } from "@/components/Sitio";
import { Etiqueta } from "@/components/base/Etiqueta";
import { CarruselTipos, type TipoApps } from "@/components/apps/CarruselTipos";
import { textosApps } from "@/components/apps/textos";
import { contenidoMezcla } from "@/components/inicio-mezcla/textos";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { IDS_AGENTES } from "@/lib/agentes";
import { CATALOGO } from "@/lib/conexiones/catalogo";
import type { CategoriaApp, IdApp } from "@/lib/nucleo-tipos";
import { metadatosDe } from "@/lib/seo";
import "./apps.css";

const ORDEN: CategoriaApp[] = ["correo", "mensajes", "agenda", "reservas", "documentos", "clientes", "resenas", "pagos", "contabilidad", "facturacion"];
/** Los colores del equipo, uno tras otro, para que dos tarjetas juntas no se repitan. */
const COLORES = ["#7fb2ff", "#ff8a6b", "#f6c64a", "#5fd09f"];

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).paginaApps.meta);
}

/**
 * /apps: las apps que se conectan con Atendel, en una tarjeta de color por tipo (correo,
 * mensajes, agenda…), un poco ladeadas, que se recorren con las flechas; arriba, los tipos como
 * botones. Cada tarjeta dice qué hace Atendel en ese tipo, sus apps con su logo (las que todavía
 * no tienen conexión pública, «En camino»), quién del equipo las usa y un pedido de ejemplo.
 */
export default async function Apps() {
  const idioma = await idiomaServidor();
  const T = t(idioma).paginaApps;
  const A = textosApps(idioma);
  const ejemplos = contenidoMezcla(idioma).apps.ejemplos;
  const nombres = T.nombres as Partial<Record<IdApp, string>>;
  const conectables = CATALOGO.filter((a) => a.fase === 1).length;

  const tipos: TipoApps[] = ORDEN.flatMap((id, k) => {
    const apps = CATALOGO.filter((a) => a.categoria === id).sort((a, b) => a.fase - b.fase);
    if (!apps.length) return [];
    const usan = new Set(apps.flatMap((a) => a.agentes));
    return [
      {
        id,
        nombre: T.categorias[id].nombre,
        texto: A.tipos[id],
        color: COLORES[k % COLORES.length],
        agentes: IDS_AGENTES.filter((ag) => usan.has(ag)),
        apps: apps.map((a) => ({ id: a.id, nombre: nombres[a.id] ?? a.nombre, pronto: a.fase !== 1 })),
        pide: ejemplos[id],
      },
    ];
  });

  return (
    <Sitio cierre="apps">
      <header className="pagina-cabeza contenedor">
        <div className="pagina-cabeza__texto">
          <Etiqueta tono="cielo">{T.etiqueta}</Etiqueta>
          <h1 className="t-display">{T.titulo}</h1>
          <p className="t-intro">{T.intro(conectables)}</p>
        </div>
      </header>

      <div className="contenedor apps-pagina">
        <CarruselTipos tipos={tipos} t={{ anterior: A.anterior, siguiente: A.siguiente, probar: A.probar, pidele: A.pidele, pronto: T.pronto }} />
        <p className="apps-pagina__nota">{T.marcas}</p>
      </div>
    </Sitio>
  );
}
