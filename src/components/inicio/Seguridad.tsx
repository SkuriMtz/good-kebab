import Link from "next/link";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Seccion } from "@/components/base/Seccion";
import { GARANTIAS } from "@/lib/contenido";

/** Un ícono de contorno por garantía: solo tu cuenta, con tu permiso, cifrado. */
const ICONOS: NombreIcono[] = ["candado", "mano", "escudo"];

/**
 * 7. Seguridad (estilo diseno/vercel): la frase a la izquierda y las tres
 * garantías debajo, en una cuadrícula de tres tarjetas finas (en celular,
 * una debajo de otra), con su ícono de contorno en el color del texto.
 *
 * Se puede reutilizar en /preguntas (sección #seguridad, Grupo 5):
 *   <Seguridad variante="preguntas" />
 * - "inicio" (por defecto): con el enlace a /preguntas#seguridad.
 * - "preguntas": sin banda (va dentro de la página de preguntas) y sin el
 *   enlace, porque ya estás ahí. Conserva el ancla id="seguridad".
 */
export function Seguridad({
  variante = "inicio",
  id = "seguridad",
}: {
  variante?: "inicio" | "preguntas";
  id?: string;
}) {
  const enInicio = variante === "inicio";
  return (
    <Seccion
      id={id}
      etiquetadaPor={`${id}-titulo`}
      fondo="ninguno"
      className={`garantias-banda${enInicio ? " garantias-banda--inicio" : ""}`}
    >
      <header className="garantias__cabeza">
        <div>
          <p className="garantias__etiqueta">
            <Icono nombre="escudo" tam={16} tono="cielo" />
            <Etiqueta as="span">Tus datos</Etiqueta>
          </p>
          <h2 id={`${id}-titulo`} className="t-grande garantias__frase">
            Cada negocio ve solo lo suyo.
          </h2>
        </div>
        {enInicio ? (
          <Link href="/preguntas#seguridad" className="enlace garantias__enlace">
            Cómo cuidamos tus datos
            <Icono nombre="flecha" tam={16} />
          </Link>
        ) : null}
      </header>

      <ul className="garantias">
        {GARANTIAS.map(([titulo, texto], i) => (
          <li key={titulo} className="garantia tarjeta-fina">
            <Icono nombre={ICONOS[i]} tono="cielo" tam={24} trazo={1.5} />
            <h3 className="t-titulo garantia__titulo">{titulo}</h3>
            <p className="t-cuerpo">{texto}</p>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}
