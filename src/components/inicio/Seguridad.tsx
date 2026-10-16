import type { CSSProperties } from "react";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Insignia, type TonoInsignia } from "@/components/base/Insignia";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { Personaje } from "@/components/agentes/Personaje";
import type { IdAgente } from "@/lib/agentes";
import { GARANTIAS } from "@/lib/contenido";
import { PERSONAJES } from "@/lib/personajes";

/** Un ícono de contorno por garantía: solo tu cuenta, con tu permiso, cifrado. */
const ICONOS: NombreIcono[] = ["candado", "mano", "escudo"];

type Permiso = {
  que: string;
  detalle?: string;
  agente?: IdAgente;
  icono?: NombreIcono;
  estado: { tono: TonoInsignia; texto: string };
};

/**
 * "Quién puede ver qué": un ejemplo de los permisos de una cuenta, armado
 * solo con lo que dicen las tres garantías (GARANTIAS en contenido.ts).
 */
const PERMISOS: { grupo: string; filas: Permiso[] }[] = [
  {
    grupo: "Quién ve tus datos",
    filas: [
      {
        que: "Tu negocio",
        detalle: "Tus clientes, tus citas y tus números",
        icono: "negocio",
        estado: { tono: "exito", texto: "Puede ver" },
      },
      {
        que: "Otros negocios en Atendel",
        detalle: "Lo controla la base de datos",
        icono: "usuarios",
        estado: { tono: "neutra", texto: "Sin acceso" },
      },
    ],
  },
  {
    grupo: "Qué hace cada agente por su cuenta",
    filas: [
      {
        que: "Lola",
        detalle: "Contesta precios y horarios",
        agente: "lola",
        estado: { tono: "azul", texto: "Por su cuenta" },
      },
      {
        que: "Clara",
        detalle: "Contesta desde tu correo",
        agente: "clara",
        estado: { tono: "azul", texto: "Con tus reglas" },
      },
      {
        que: "Víctor",
        detalle: "Escribe a quien faltó a su cita",
        agente: "victor",
        estado: { tono: "atencion", texto: "Te consulta primero" },
      },
    ],
  },
  {
    grupo: "Conexión",
    filas: [
      {
        que: "De tu celular o computadora",
        detalle: "Hasta nuestros servidores",
        icono: "candado",
        estado: { tono: "exito", texto: "Cifrada" },
      },
    ],
  },
];

function Permisos() {
  return (
    <figure className="inf-permisos" aria-labelledby="inf-permisos-titulo">
      <figcaption className="inf-permisos__cabeza">
        <span className="inf-permisos__titulo" id="inf-permisos-titulo">
          <Icono nombre="candado" tam={16} />
          Permisos de tu cuenta
        </span>
        <Etiqueta as="span" tono="tenue">
          Ejemplo
        </Etiqueta>
      </figcaption>
      {PERMISOS.map((g) => (
        <div key={g.grupo} className="inf-permisos__grupo">
          <Etiqueta tono="tenue" className="inf-permisos__subtitulo">
            {g.grupo}
          </Etiqueta>
          <ul>
            {g.filas.map((f) => (
              <li key={f.que} className="inf-permisos__fila">
                {f.agente ? (
                  <span
                    className="marca-agente marca-agente--mini"
                    style={
                      {
                        "--agente": PERSONAJES[f.agente].color,
                      } as CSSProperties
                    }
                  >
                    <Personaje agente={f.agente} avatar />
                  </span>
                ) : (
                  <span className="inf-permisos__icono">
                    <Icono nombre={f.icono ?? "candado"} tam={16} />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="inf-permisos__que">{f.que}</span>
                  {f.detalle ? (
                    <span className="inf-permisos__detalle">{f.detalle}</span>
                  ) : null}
                </span>
                <Insignia tono={f.estado.tono} conPunto>
                  {f.estado.texto}
                </Insignia>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </figure>
  );
}

/**
 * 7. Seguridad (Grupo 4 · G4-T2, "el producto manda"). Como la parte de
 * seguridad de la portada de GitHub: el producto a la izquierda —los permisos
 * de una cuenta, "quién puede ver qué"— y a la derecha las tres garantías en
 * una lista con divisiones de 1px e íconos de contorno en azul cielo.
 *
 * Reutilizable: `variante="preguntas"` es para la sección #seguridad de
 * /preguntas (sin el enlace a sí misma y con otro id de título). En el inicio
 * la sección lleva id="seguridad"; en /preguntas también (es el ancla del pie).
 */
export function Seguridad({
  variante = "inicio",
}: {
  variante?: "inicio" | "preguntas";
}) {
  const idTitulo =
    variante === "inicio" ? "seguridad-titulo" : "preguntas-seguridad-titulo";
  return (
    <Seccion id="seguridad" etiquetadaPor={idTitulo}>
      <div className="columnas-asimetricas columnas-asimetricas--invertidas lg:items-center">
        <div className="lg:order-2">
          <EncabezadoSeccion
            id={idTitulo}
            alineacion="izquierda"
            adorno={<Icono nombre="escudo" tono="cielo" trazo={1.5} />}
            etiqueta="Tus datos"
            titulo="Cada negocio ve solo lo suyo"
            className="!mb-0"
          />
          <ul className="inf-garantias">
            {GARANTIAS.map(([titulo, texto], i) => (
              <li key={titulo} className="inf-garantias__fila">
                <Icono nombre={ICONOS[i]} tono="cielo" tam={20} />
                <div>
                  <h3 className="inf-garantias__titulo">{titulo}</h3>
                  <p className="t-cuerpo">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
          {variante === "inicio" ? (
            <Boton
              href="/preguntas#seguridad"
              variante="fantasma"
              flecha
              className="inf-garantias__enlace"
            >
              Cómo cuidamos tus datos
            </Boton>
          ) : null}
        </div>
        <div className="lg:order-1">
          <Permisos />
        </div>
      </div>
    </Seccion>
  );
}
