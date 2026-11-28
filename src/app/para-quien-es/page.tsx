import type { Metadata } from "next";
import { Sitio } from "@/components/Sitio";
import { Etiqueta } from "@/components/base/Etiqueta";
import { esIdAgente, type IdAgente } from "@/lib/agentes";
import { Casos, type AgenteCaso, type CasoNegocio } from "./Casos";
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
 * Para quién es: calmado y al grano. Arriba, el título y una línea; abajo, los casos (Citas,
 * Mensajes, Clientes que regresan, Papeleo, Ventas en línea, Facturas y cobros, Proveedores)
 * como botones y una tarjeta con el caso que toques: qué pasa, quién del equipo va al frente y
 * qué hace cada uno, en una línea (Casos.tsx). Los nombres de los cuatro primeros salen de
 * src/i18n; lo demás, de ./textos.ts.
 */
export default async function ParaQuienEs() {
  const idioma = await idiomaServidor();
  const P = t(idioma).paraQuien;
  const T = textosParaQuien(idioma);
  const agente = (id: IdAgente, texto: string): AgenteCaso => {
    const a = agenteDe(idioma, id);
    return { id, nombre: a.nombre, area: a.area, texto };
  };
  const base: CasoNegocio[] = P.segmentos.flatMap((s) => {
    const corto = T.casos[s.id as keyof typeof T.casos];
    if (!corto || !esIdAgente(s.frente)) return [];
    const resto = s.ayuda.map((x) => x.id).filter((id): id is IdAgente => esIdAgente(id) && id !== s.frente);
    return [
      {
        id: s.id,
        corto: s.corto,
        nombre: s.nombre,
        intro: corto.intro,
        frente: agente(s.frente, corto.agentes[s.frente]),
        resto: resto.map((id) => agente(id, corto.agentes[id])),
      },
    ];
  });
  // Y los casos de más: ventas en línea, facturas y cobros, proveedores
  const extra: CasoNegocio[] = casosExtra(idioma).map((c) => ({
    id: c.id,
    corto: c.corto,
    nombre: c.nombre,
    intro: c.intro,
    frente: agente(c.frente, c.agentes[c.frente]),
    resto: c.resto.map((id) => agente(id, c.agentes[id])),
  }));
  const casos = [...base, ...extra];

  return (
    <Sitio cierre="paraQuien">
      <header className="pagina-cabeza contenedor">
        <div className="pagina-cabeza__texto">
          <Etiqueta tono="cielo">{P.etiqueta}</Etiqueta>
          <h1 className="t-display">{P.titulo}</h1>
          <p className="t-intro">{T.texto}</p>
        </div>
      </header>

      <div className="contenedor">
        <Casos casos={casos} t={{ probar: T.probar, equipo: T.equipo, elegir: T.texto }} />
      </div>
    </Sitio>
  );
}
