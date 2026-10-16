import Link from "next/link";
import { Halo } from "@/components/base/Halo";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { GARANTIAS } from "@/lib/contenido";

/** Un ícono de contorno por garantía: solo tu cuenta (candado), con tu permiso (mano), cifrado (escudo). */
const ICONOS: NombreIcono[] = ["candado", "mano", "escudo"];

/**
 * 7. Seguridad (Grupo 4 · propuesta T1). Encabezado centrado (el bloque de
 * encabezado de GitHub) y una sola tarjeta de vidrio ancha con las tres
 * garantías en fila, separadas por líneas de 1px, con íconos de contorno en
 * azul cielo. Un halo suave detrás deja ver el vidrio. Al pie, el enlace a
 * cómo cuidamos tus datos. Va sobre la franja secundaria (#151a22 / #f6f8fa):
 * corta el ritmo antes de los precios y en modo claro le da matiz al blanco.
 *
 * Reutilizable: en /preguntas#seguridad (del Grupo 5) se usa
 * `<Seguridad variante="preguntas" />`: misma tarjeta, sin el enlace a sí
 * misma y con el fondo de esa página. Conserva el ancla `#seguridad`.
 */
export function Seguridad({ variante = "inicio" }: { variante?: "inicio" | "preguntas" }) {
  const enPreguntas = variante === "preguntas";
  return (
    <Seccion id="seguridad" etiquetadaPor="seguridad-titulo" halo fondo={enPreguntas ? "ninguno" : "fondo-2"}>
      <EncabezadoSeccion
        id="seguridad-titulo"
        etiqueta="Tus datos"
        titulo="Cada negocio ve solo lo suyo"
        texto="Los datos de tus pacientes y clientes son tuyos. No vendemos tu información a nadie."
      />
      <div className="relative">
        <Halo y="55%" ancho="min(1040px, 130vw)" proporcion="3 / 1" suave />
        <TarjetaVidrio relleno="ninguno">
          <ul className="inf-garantias">
            {GARANTIAS.map(([titulo, texto], i) => (
              <li key={titulo} className="inf-garantia">
                <Icono nombre={ICONOS[i]} tono="cielo" tam={24} trazo={1.5} />
                <h3 className="t-sub">{titulo}</h3>
                <p className="t-cuerpo">{texto}</p>
              </li>
            ))}
          </ul>
          {enPreguntas ? null : (
            <div className="inf-seguridad__pie">
              <Link href="/preguntas#seguridad" className="inf-enlace">
                <span>Cómo cuidamos tus datos</span>
                <Icono nombre="flecha" tam={16} />
              </Link>
            </div>
          )}
        </TarjetaVidrio>
      </div>
    </Seccion>
  );
}
