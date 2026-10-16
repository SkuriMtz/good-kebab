import Link from "next/link";
import { Planes } from "@/components/Planes";
import { Icono } from "@/components/base/Iconos";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";

/**
 * 8. Precios (Grupo 5). Encabezado a la izquierda con el enlace a la
 * comparación del otro lado (como las bandas de Apple), y debajo los tres
 * planes en un solo panel de vidrio. "Avísame cuando abra" baja al
 * formulario del CTA final (#lista) de esta misma página.
 */
export function Precios() {
  return (
    <Seccion id="precios" etiquetadaPor="precios-titulo">
      <div className="precios-cabeza">
        <EncabezadoSeccion
          id="precios-titulo"
          alineacion="izquierda"
          etiqueta="Planes"
          titulo="Empieza gratis con Clara. Suma a Lola y al resto del equipo cuando lo necesites."
          className="precios-cabeza__texto"
        />
        <Link href="/precios#comparar" className="enlace-flecha">
          Comparar planes por agente
          <Icono nombre="chevron-derecha" tam={16} />
        </Link>
      </div>
      <Planes hrefLista="#lista" />
      <p className="planes-nota t-chico">
        En todos los planes entras con tu correo, sin contraseña · funciona en celular y computadora · cada negocio ve
        solo lo suyo.
      </p>
    </Seccion>
  );
}
