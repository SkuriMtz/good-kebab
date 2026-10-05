import Link from "next/link";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { GARANTIAS } from "@/lib/contenido";

/** Un ícono de contorno por garantía: solo tu cuenta, con tu permiso, cifrado. */
const ICONOS: NombreIcono[] = ["candado", "mano", "escudo"];

/**
 * 7. Seguridad (Grupo 4). Versión base: una sola tarjeta de vidrio ancha con
 * las tres garantías en fila, separadas por líneas de 1px, íconos en azul cielo.
 */
export function Seguridad() {
  return (
    <Seccion id="seguridad" etiquetadaPor="seguridad-titulo">
      <EncabezadoSeccion
        id="seguridad-titulo"
        adorno={<Icono nombre="escudo" tono="cielo" trazo={1.5} />}
        etiqueta="Tus datos"
        titulo="Cada negocio ve solo lo suyo"
      />
      <TarjetaVidrio relleno="ninguno">
        <ul className="grid md:grid-cols-3">
          {GARANTIAS.map(([titulo, texto], i) => (
            <li
              key={titulo}
              className="border-t border-[var(--c-vidrio-borde)] p-[var(--spacing-24)] first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0 lg:p-[var(--spacing-40)]"
            >
              <Icono nombre={ICONOS[i]} tono="cielo" tam={24} />
              <h3 className="t-titulo mt-[var(--spacing-16)]">{titulo}</h3>
              <p className="t-cuerpo mt-[var(--spacing-8)]">{texto}</p>
            </li>
          ))}
        </ul>
      </TarjetaVidrio>
      <p className="mt-[var(--spacing-24)] text-center">
        <Link href="/preguntas#seguridad" className="enlace">
          Cómo cuidamos tus datos
        </Link>
      </p>
    </Seccion>
  );
}
