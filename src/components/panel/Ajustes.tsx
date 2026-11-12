"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { AvatarAgente } from "./Mensajes";
import { Enlace, Modal, Pildoras, claseBoton } from "./Piezas";
import { ElegirTema, TarjetaPlan } from "./Secciones";

/**
 * AJUSTES: una ventana (no una página) que se abre con el engrane del pie del
 * menú o con cualquier enlace a ?vista=ajustes. A la izquierda, un buscador y
 * las partes; a la derecha, cada ajuste en una fila (qué es a la izquierda,
 * el control a la derecha). Todo lo que se ve aquí funciona de verdad: lo que
 * no se puede cambiar desde el panel (el plan) lo dice.
 */

export const IDS_AJUSTE = ["cuenta", "plan", "apariencia", "equipo", "conexiones", "privacidad", "atajos"] as const;
export type IdAjuste = (typeof IDS_AJUSTE)[number];
export const esIdAjuste = (v: unknown): v is IdAjuste => typeof v === "string" && (IDS_AJUSTE as readonly string[]).includes(v);

export type DatosAjustes = {
  /** Nombre completo. */
  nombre: string;
  correo: string;
  plan: string;
  usados: number;
  total: number;
  gmail: boolean;
  activos: IdAgente[];
  hrefs: { correo: string; agentes: string; apps: string };
  /** Cerrar sesión (cuenta real) o salir de la demostración. */
  salir: { etiqueta: string; texto: string; href?: string; alSalir?: () => void | Promise<void> };
  /** Solo en la cuenta real: cerrar la sesión en todos los dispositivos. */
  salirDeTodo?: () => Promise<void>;
  /** En /pruebalo: los datos son de ejemplo. */
  demo?: boolean;
};

/** Lo que vive en el armazón y se cambia desde aquí. */
export type PreferenciasPanel = {
  menuCompacto: boolean;
  alCambiarMenu: (compacto: boolean) => void;
  infoAlAbrir: boolean;
  alCambiarInfo: (abierta: boolean) => void;
  verEntrada: () => void;
};

const PARTES: { id: IdAjuste; etiqueta: string; icono: NombreIcono; claves: string; grupo: number }[] = [
  { id: "cuenta", etiqueta: "Cuenta", icono: "persona", claves: "perfil nombre correo sesion salir dispositivos", grupo: 0 },
  { id: "plan", etiqueta: "Plan y uso", icono: "facturacion", claves: "plan mensajes uso precio cobro pago max one free", grupo: 0 },
  { id: "apariencia", etiqueta: "Apariencia", icono: "sol", claves: "tema oscuro claro sistema menu lateral informacion animacion entrada", grupo: 1 },
  { id: "equipo", etiqueta: "Tu equipo", icono: "agentes", claves: "agentes lola clara victor iris atencion correo clientes oficina", grupo: 1 },
  { id: "conexiones", etiqueta: "Conexiones", icono: "enlace", claves: "apps gmail correo whatsapp calendario conectar", grupo: 1 },
  { id: "privacidad", etiqueta: "Privacidad", icono: "escudo", claves: "seguridad datos llaves contrasenas solo lectura borrar cuenta", grupo: 2 },
  { id: "atajos", etiqueta: "Atajos", icono: "rayo", claves: "teclado teclas buscar enviar escape arroba", grupo: 2 },
];

/** Al abrir, el foco va al contenido (no a la X, que en celular saldría con el anillo azul). React no pasa `autofocus` como atributo: así sí. */
const AUTOFOCO = { autofocus: "" } as unknown as Record<string, never>;

const sinAcentos = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Una fila: qué es (con una línea de ayuda) a la izquierda y el control a la derecha. */
function Fila({ titulo, texto, children }: { titulo: ReactNode; texto?: ReactNode; children?: ReactNode }) {
  return (
    <div className="pc-aj-fila">
      <div className="pc-aj-fila__texto">
        <p className="pc-aj-fila__titulo">{titulo}</p>
        {texto ? <p className="pc-aj-fila__sub">{texto}</p> : null}
      </div>
      {children ? <div className="pc-aj-fila__control">{children}</div> : null}
    </div>
  );
}

function Grupo({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <section className="pc-aj-grupo">
      {titulo ? <h3 className="pc-aj-grupo__titulo">{titulo}</h3> : null}
      {children}
    </section>
  );
}

const Estado = ({ tono, children }: { tono: "exito" | "neutro"; children: ReactNode }) => <span className={`pc-estado pc-estado--${tono}`}>{children}</span>;

export function VentanaAjustes({
  abierta,
  seccion,
  alElegir,
  alCerrar,
  datos,
  preferencias,
}: {
  abierta: boolean;
  seccion: IdAjuste;
  alElegir: (s: IdAjuste) => void;
  alCerrar: () => void;
  datos: DatosAjustes;
  preferencias: PreferenciasPanel;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [enMac, setEnMac] = useState(true);
  const [saliendo, setSaliendo] = useState(false);
  useEffect(() => setEnMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)), []);
  useEffect(() => {
    if (!abierta) setBusqueda("");
  }, [abierta]);

  const partes = useMemo(() => {
    const q = sinAcentos(busqueda.trim());
    return q ? PARTES.filter((p) => sinAcentos(`${p.etiqueta} ${p.claves}`).includes(q)) : PARTES;
  }, [busqueda]);
  const parte = PARTES.find((p) => p.id === seccion) ?? PARTES[0];
  const tecla = enMac ? "⌘" : "Ctrl";

  let contenido: ReactNode;
  if (seccion === "cuenta") {
    contenido = (
      <>
        <Grupo titulo="Perfil">
          <Fila titulo="Foto de perfil" texto="Por ahora, la inicial de tu nombre.">
            <span className="pc-aj-avatar" aria-hidden="true">
              {(datos.nombre.trim()[0] ?? "A").toUpperCase()}
            </span>
          </Fila>
          <Fila titulo="Nombre">
            <span className="pc-aj-valor">{datos.nombre}</span>
          </Fila>
          <Fila titulo="Correo" texto={datos.demo ? "Un correo de ejemplo: no es de nadie." : "Con el que entras a Atendel."}>
            <span className="pc-aj-valor">{datos.correo}</span>
          </Fila>
        </Grupo>
        <Grupo titulo="Sesión">
          <Fila titulo={datos.salir.etiqueta} texto={datos.salir.texto}>
            {datos.salir.href ? (
              <Enlace href={datos.salir.href} className={claseBoton("borde", true)}>
                <Icono nombre="cerrar-sesion" tam={16} />
                {datos.salir.etiqueta}
              </Enlace>
            ) : (
              <button
                type="button"
                className={claseBoton("borde", true)}
                disabled={saliendo}
                onClick={async () => {
                  setSaliendo(true);
                  await datos.salir.alSalir?.();
                }}
              >
                <Icono nombre="cerrar-sesion" tam={16} />
                {datos.salir.etiqueta}
              </button>
            )}
          </Fila>
          {datos.salirDeTodo ? (
            <Fila titulo="Cerrar sesión en todos lados" texto="En todas las computadoras y celulares donde entraste con esta cuenta.">
              <button
                type="button"
                className={claseBoton("borde", true)}
                disabled={saliendo}
                onClick={async () => {
                  setSaliendo(true);
                  await datos.salirDeTodo?.();
                }}
              >
                Cerrar en todos
              </button>
            </Fila>
          ) : null}
        </Grupo>
      </>
    );
  } else if (seccion === "plan") {
    contenido = (
      <>
        <Grupo>
          <TarjetaPlan plan={datos.plan} usados={datos.usados} total={datos.total} />
        </Grupo>
        <Grupo titulo="Cómo se cuenta">
          <Fila titulo="Mensajes del mes" texto="Cada mensaje que le mandas a tu equipo y cada pregunta a la gráfica de tu resumen cuentan como uno." />
          <Fila titulo="Cambiar de plan" texto="El plan no se cambia desde el panel: escríbenos y lo hacemos contigo.">
            <Enlace href="/contacto" className={claseBoton("borde", true)}>
              Escríbenos
            </Enlace>
          </Fila>
        </Grupo>
      </>
    );
  } else if (seccion === "apariencia") {
    contenido = (
      <Grupo>
        <Fila titulo="Tema" texto="Oscuro es el de siempre; claro es una tarjeta sobre gris.">
          <ElegirTema />
        </Fila>
        <Fila titulo="Menú lateral" texto="Compacto deja solo los íconos.">
          <Pildoras
            etiqueta="Menú lateral"
            activa={preferencias.menuCompacto ? "compacto" : "completo"}
            alElegir={(id) => preferencias.alCambiarMenu(id === "compacto")}
            opciones={[
              { id: "completo", etiqueta: "Completo" },
              { id: "compacto", etiqueta: "Compacto" },
            ]}
          />
        </Fila>
        <Fila titulo="Información a la derecha" texto="Si el resumen de tu negocio se abre solo al entrar (en pantallas anchas).">
          <Pildoras
            etiqueta="Información a la derecha"
            activa={preferencias.infoAlAbrir ? "abierta" : "cerrada"}
            alElegir={(id) => preferencias.alCambiarInfo(id === "abierta")}
            opciones={[
              { id: "abierta", etiqueta: "Abierta" },
              { id: "cerrada", etiqueta: "Cerrada" },
            ]}
          />
        </Fila>
        <Fila titulo="Animación de entrada" texto="Los fragmentos que forman el logo al entrar. Sale una vez por pestaña.">
          <button type="button" className={claseBoton("borde", true)} onClick={preferencias.verEntrada}>
            Verla otra vez
          </button>
        </Fila>
      </Grupo>
    );
  } else if (seccion === "equipo") {
    contenido = (
      <>
        <Grupo>
          {AGENTES_INFO.map((a) => (
            <Fila
              key={a.id}
              titulo={
                <span className="pc-aj-agente">
                  <AvatarAgente agente={a.id} tam={28} />
                  {a.nombre} · {a.area}
                </span>
              }
              texto={a.lema}
            >
              <Estado tono={datos.activos.includes(a.id) ? "exito" : "neutro"}>{datos.activos.includes(a.id) ? "Trabaja contigo" : "Sin elegir"}</Estado>
            </Fila>
          ))}
        </Grupo>
        <Grupo>
          <Fila titulo="Elegir a tu equipo" texto="Quién trabaja contigo y en qué.">
            <Enlace href={datos.hrefs.agentes} className={claseBoton("borde", true)}>
              Ir a Agentes
            </Enlace>
          </Fila>
        </Grupo>
      </>
    );
  } else if (seccion === "conexiones") {
    contenido = (
      <Grupo>
        <Fila titulo="Gmail" texto="Clara lo lee. Solo lectura: nunca envía ni borra nada.">
          <Estado tono={datos.gmail ? "exito" : "neutro"}>{datos.gmail ? "Conectado" : "Sin conectar"}</Estado>
          <Enlace href={datos.hrefs.correo} className="pc-enlace">
            {datos.gmail ? "Ir a Correo" : "Conectar"}
          </Enlace>
        </Fila>
        <Fila titulo="Más apps" texto="WhatsApp, calendarios, pagos y más: cada una con tu propia cuenta y solo para leer.">
          <Enlace href={datos.hrefs.apps} className={claseBoton("borde", true)}>
            Ver apps
          </Enlace>
        </Fila>
      </Grupo>
    );
  } else if (seccion === "privacidad") {
    contenido = (
      <>
        <Grupo>
          <Fila titulo="Solo lectura" texto="Por ahora tu equipo solo lee lo que conectas: no envía, no borra ni paga nada por su cuenta.">
            <Estado tono="exito">Activo</Estado>
          </Fila>
          <Fila titulo="Tus contraseñas y llaves" texto="Atendel nunca te las pide en el chat. Si alguien lo hace a nombre de Atendel, no las des." />
          <Fila titulo="Tus datos" texto="Cada cuenta ve solo lo suyo: nadie más puede leer tus conversaciones ni tus números." />
        </Grupo>
        <Grupo titulo="Tu cuenta">
          <Fila titulo="Borrar tu cuenta" texto="Escríbenos y te ayudamos a borrarla con todo lo que tiene.">
            <Enlace href="/contacto" className={claseBoton("borde", true)}>
              Escríbenos
            </Enlace>
          </Fila>
        </Grupo>
      </>
    );
  } else {
    const atajos: [string, string[]][] = [
      ["Buscar en tu panel", [tecla, "K"]],
      ["Enviar un mensaje", ["Enter"]],
      ["Salto de línea", ["Shift", "Enter"]],
      ["Elegir a qué agente le escribes", ["@"]],
      ["Cerrar ventanas y menús", ["Esc"]],
    ];
    contenido = (
      <Grupo>
        {atajos.map(([que, teclas]) => (
          <Fila key={que} titulo={que}>
            <span className="pc-aj-teclas">
              {teclas.map((t) => (
                <kbd key={t}>{t}</kbd>
              ))}
            </span>
          </Fila>
        ))}
      </Grupo>
    );
  }

  return (
    <Modal abierto={abierta} alCerrar={alCerrar} titulo="Ajustes" ancho="ancho" className="pc-ajustes">
      <div className="pc-aj">
        <nav className="pc-aj__nav" aria-label="Partes de Ajustes">
          <label className="pc-aj__buscar">
            <Icono nombre="buscar" tam={16} />
            <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar" aria-label="Buscar en Ajustes" />
          </label>
          <ul className="pc-aj__lista">
            {partes.map((p, i) => (
              <li key={p.id} data-corte={i > 0 && partes[i - 1].grupo !== p.grupo ? "" : undefined}>
                <button type="button" className="pc-aj__parte" aria-current={p.id === seccion ? "page" : undefined} onClick={() => alElegir(p.id)}>
                  <Icono nombre={p.icono} tam={18} />
                  {p.etiqueta}
                </button>
              </li>
            ))}
            {partes.length === 0 ? <li className="pc-aj__nada">Nada con “{busqueda.trim()}”.</li> : null}
          </ul>
        </nav>
        <div className="pc-aj__contenido" key={seccion} tabIndex={-1} {...AUTOFOCO}>
          <h2 className="pc-aj__titulo">{parte.etiqueta}</h2>
          {datos.demo && (seccion === "cuenta" || seccion === "plan") ? <p className="pc-aj__aviso">Datos de ejemplo de Estudio Luna.</p> : null}
          {contenido}
        </div>
      </div>
    </Modal>
  );
}
