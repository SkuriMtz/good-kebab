import type { Metadata } from "next";
import { Sitio } from "@/components/Sitio";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Ideas } from "./Ideas";
import { ideasDe, type IdCaso } from "./ideas";
import { casosExtra, textosParaQuien } from "./textos";
import { agenteDe, t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";
import "./para-quien-es.css";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.paraQuien);
}

/**
 * Para quién es: el título al centro y, abajo, muchas ideas de varios tipos (citas, mensajes,
 * clientes que regresan, papeleo, ventas en línea, facturas y cobros, proveedores) en tarjetas
 * de color que se filtran por tipo. La que toques abre un chat de ejemplo (Ideas.tsx). Los
 * nombres de los tipos salen de src/i18n y de ./textos.ts; las ideas, de ./ideas.ts.
 */
export default async function ParaQuienEs() {
  const idioma = await idiomaServidor();
  const P = t(idioma).paraQuien;
  const T = textosParaQuien(idioma);
  const { ui, ideas } = ideasDe(idioma);
  const casos: { id: IdCaso; corto: string }[] = [
    ...P.segmentos.map((s) => ({ id: s.id as IdCaso, corto: s.corto })),
    ...casosExtra(idioma).map((c) => ({ id: c.id, corto: c.corto })),
  ].filter((c) => ideas.some((x) => x.caso === c.id));
  const vistas = ideas.map((x) => {
    const a = agenteDe(idioma, x.agente);
    return { ...x, nombre: a.nombre, area: a.area };
  });

  return (
    <Sitio cierre="paraQuien">
      <header className="contenedor ideas-pq-cabeza">
        <Etiqueta tono="cielo">{P.etiqueta}</Etiqueta>
        <h1 className="t-display">{P.titulo}</h1>
        <p className="t-intro">{ui.subtitulo}</p>
      </header>

      <div className="contenedor">
        <Ideas ideas={vistas} casos={casos} t={{ ...ui, probar: T.probar }} />
      </div>
    </Sitio>
  );
}
