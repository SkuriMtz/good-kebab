"use client";

import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import { Boton } from "@/components/base/Boton";
import { Escribiendo } from "@/components/base/Escribiendo";
import { Giro, Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Actividad } from "@/components/dashboard/Actividad";
import { Bienvenida } from "@/components/dashboard/Bienvenida";
import { Cara } from "@/components/dashboard/Caras";
import { Ayuda, Columna, EstaSemana, ParaTi, ProximasCitas, TarjetaNegocio } from "@/components/dashboard/Columna";
import { AgentesFijados, ConversacionesRecientes } from "@/components/dashboard/Fijados";
import { haceCuanto } from "@/components/dashboard/momento";
import type {
  AgenteFijado,
  ConversacionReciente,
  Destacado,
  DiaSemana,
  Estadistica,
  Evento,
  IdPestanaActividad,
  ItemParaTi,
} from "@/components/dashboard/tipos";
import { Vacio } from "@/components/dashboard/Vacio";
import { EncabezadoVista, FilaCorreo } from "@/components/dashboard/Vistas";
import { Field } from "@/components/ui/Field";
import { useGoogleDisponible } from "@/components/useGoogleDisponible";
import { createClient } from "@/lib/supabase/client";

type Resultado = { asunto: string; remitente: string; resumen: string; accion: string };

type Guardado = {
  id: string;
  remitente: string | null;
  asunto: string | null;
  resumen: string;
  accion_sugerida: string | null;
  creado_en: string;
};

/** Lo que el servidor (page.tsx) arma para el Resumen con los datos reales de la cuenta. */
export type DatosResumen = {
  fecha: string;
  saludo: string;
  texto: string;
  cifras: Estadistica[];
  eventos: Evento[];
  destacados: Destacado[];
  fijados: AgenteFijado[];
  recientes: ConversacionReciente[];
  negocio: { nombre: string; plan: string; usados: number; limite: number; mes: string; renueva: string };
  /** null: no se pudieron leer los mensajes de la semana. */
  semana: DiaSemana[] | null;
  paraTi: ItemParaTi[];
  pestana: IdPestanaActividad;
};

// Correos de ejemplo para probar sin tener que escribir uno
const EJEMPLOS = [
  {
    etiqueta: "Paciente quiere cita",
    remitente: "Laura Méndez <laura.mendez@gmail.com>",
    asunto: "Cita para limpieza dental",
    contenido:
      "Hola, buenas tardes. Quisiera agendar una limpieza dental para la próxima semana, de preferencia el martes o jueves por la tarde después de las 5. ¿Tienen disponibilidad? También quería saber si aceptan seguro de gastos médicos. Gracias.",
  },
  {
    etiqueta: "Pregunta de precios",
    remitente: "Andrea Ruiz <andrea.ruiz@hotmail.com>",
    asunto: "Precio de depilación láser",
    contenido:
      "Hola! Vi su publicación en Instagram. ¿Cuánto cuesta el paquete de depilación láser de piernas completas? ¿Tienen promoción este mes? Y cuántas sesiones se necesitan normalmente.",
  },
  {
    etiqueta: "Cancelación",
    remitente: "Roberto Salinas <rsalinas@empresa.com.mx>",
    asunto: "No podré ir mañana",
    contenido:
      "Buenos días, les escribo para avisar que no podré asistir a mi consulta de mañana a las 10:00 am por un tema de trabajo. ¿Me podrían reprogramar para el viernes? Una disculpa por el aviso tan tarde.",
  },
];

const conSugerencia = (accion: string | null) => Boolean(accion && accion.trim().toLowerCase() !== "ninguna");

/**
 * El contenido de /panel dentro del armazón del dashboard:
 * - "resumen": bienvenida, actividad, agentes fijados, conversaciones y la columna derecha.
 * - "correo": Clara. Pegar un correo (o un ejemplo) y resumirlo, conectar o
 *   revisar Gmail, y el historial de lo que ya leyó. La lógica es la de siempre.
 */
export function Panel({
  vista,
  datos,
  conGoogle,
  resumenesIniciales,
  ahora,
}: {
  vista: "resumen" | "correo";
  datos: DatosResumen;
  conGoogle: boolean;
  resumenesIniciales: Guardado[];
  /** La hora del servidor (así las horas relativas coinciden al cargar). */
  ahora: string;
}) {
  return vista === "correo" ? (
    <Correo conGoogle={conGoogle} resumenesIniciales={resumenesIniciales} ahora={ahora} />
  ) : (
    <Resumen datos={datos} />
  );
}

/* =====================================================================
   Resumen
   ===================================================================== */

function Resumen({ datos }: { datos: DatosResumen }) {
  const [pestana, setPestana] = useState<IdPestanaActividad>(datos.pestana);
  return (
    <div className="dash-contenido">
      <div className="dash-resumen">
        <div className="dash-centro">
          <Bienvenida
            fecha={datos.fecha}
            saludo={datos.saludo}
            texto={datos.texto}
            acciones={
              <>
                <Boton tam="compacto" href="/panel/chat" icono={<Icono nombre="mensaje" />}>
                  Hablar con mi equipo
                </Boton>
                <Boton variante="sutil" tam="compacto" href="/panel?vista=correo" icono={<Icono nombre="correo" />}>
                  Resumir un correo
                </Boton>
              </>
            }
            cifras={datos.cifras}
          />
          <div id="dash-actividad" className="dash-ancla">
            <Actividad
              eventos={datos.eventos}
              pendientes={[]}
              destacados={datos.destacados}
              pestana={pestana}
              alCambiarPestana={setPestana}
              vacios={{
                actividad: (
                  <Vacio
                    agente="clara"
                    titulo="Aquí verás lo que hace tu equipo"
                    texto="Cada correo que resuma Clara y cada conversación con tus agentes aparece en esta línea de tiempo."
                    accion={
                      <Boton variante="sutil" tam="compacto" href="/panel?vista=correo">
                        Probar con un correo de ejemplo
                      </Boton>
                    }
                  />
                ),
                pendientes: (
                  <Vacio
                    agente="victor"
                    titulo="Nada espera tu visto bueno"
                    texto="Cuando un agente prepare un mensaje que necesite tu permiso, lo verás aquí antes de que salga."
                  />
                ),
                destacados: (
                  <Vacio
                    agente="clara"
                    titulo="Nada destacado por ahora"
                    texto="Cuando Clara sugiera qué hacer con un correo, la sugerencia queda aquí para que no se te pase."
                  />
                ),
              }}
            />
          </div>
          <AgentesFijados agentes={datos.fijados} todos={{ href: "/panel/agentes" }} />
          <ConversacionesRecientes
            conversaciones={datos.recientes}
            todas={{ href: "/panel/chat" }}
            vacio={
              <Vacio
                agente="lola"
                titulo="Todavía no hay conversaciones"
                texto="Pregúntale algo a tu equipo: un mensaje para confirmar citas, una respuesta para un cliente, un correo difícil."
                accion={
                  <Boton variante="sutil" tam="compacto" href="/panel/chat">
                    Empezar una conversación
                  </Boton>
                }
              />
            }
          />
        </div>
        <Columna>
          <TarjetaNegocio
            nombre={datos.negocio.nombre}
            plan={datos.negocio.plan}
            usados={datos.negocio.usados}
            limite={datos.negocio.limite}
            mes={datos.negocio.mes}
            renueva={datos.negocio.renueva}
            enlace={{ etiqueta: "Ver tu plan y tu equipo", destino: { href: "/panel/agentes" } }}
          />
          <ProximasCitas
            citas={[]}
            vacio={
              <Vacio
                agente="lola"
                compacto
                titulo="Tus citas aparecerán aquí"
                texto="Cuando Lola lleve tu agenda, verás las citas de mañana y quién ya confirmó."
                accion={<Insignia tono="pronto">Pronto</Insignia>}
              />
            }
          />
          <EstaSemana
            titulo="respuestas de tu equipo"
            unidad="respuestas"
            dias={datos.semana ?? []}
            vacio={
              <Vacio
                compacto
                icono="grafica"
                titulo={datos.semana ? "Sin mensajes esta semana" : "No pudimos leer tu semana"}
                texto={
                  datos.semana
                    ? "Cuando hables con tu equipo, aquí verás cuántas respuestas te dio cada día."
                    : "Vuelve a cargar la página en un momento."
                }
              />
            }
          />
          <ParaTi items={datos.paraTi} />
          <Ayuda texto="Arriba ves tu mes en tres cifras; abajo, lo que hizo tu equipo, empezando por lo más reciente. Lo que necesite tu permiso quedará en «Espera tu visto bueno»." />
        </Columna>
      </div>
    </div>
  );
}

/* =====================================================================
   Correo con Clara (modo de prueba, Gmail e historial)
   ===================================================================== */

function Correo({ conGoogle, resumenesIniciales, ahora }: { conGoogle: boolean; resumenesIniciales: Guardado[]; ahora: string }) {
  const supabase = useMemo(() => createClient(), []);
  const googleDisponible = useGoogleDisponible();

  const [remitente, setRemitente] = useState("");
  const [asunto, setAsunto] = useState("");
  const [contenido, setContenido] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<Guardado[] | null>(resumenesIniciales);
  const [referencia, setReferencia] = useState(() => new Date(ahora));
  const [nuevos, setNuevos] = useState<Set<string>>(() => new Set());
  const [gmailCargando, setGmailCargando] = useState(false);
  const [gmailMensaje, setGmailMensaje] = useState<string | null>(null);
  const resultadoRef = useRef<HTMLElement>(null);
  const idsPrevios = useRef<Set<string>>(new Set(resumenesIniciales.map((g) => g.id)));

  // RLS se encarga de que solo regresen los resúmenes del negocio de quien inició sesión
  const cargarHistorial = useCallback(
    async (marcarNuevos = false) => {
      const { data } = await supabase
        .from("resumenes_correo")
        .select("id, remitente, asunto, resumen, accion_sugerida, creado_en")
        .order("creado_en", { ascending: false })
        .limit(30);
      const lista: Guardado[] = data ?? [];
      if (marcarNuevos) {
        setNuevos(new Set(lista.filter((g) => !idsPrevios.current.has(g.id)).map((g) => g.id)));
      }
      idsPrevios.current = new Set(lista.map((g) => g.id));
      setReferencia(new Date());
      setHistorial(lista);
    },
    [supabase],
  );

  function usarEjemplo(ejemplo: (typeof EJEMPLOS)[number]) {
    setRemitente(ejemplo.remitente);
    setAsunto(ejemplo.asunto);
    setContenido(ejemplo.contenido);
    setError(null);
  }

  function limpiar() {
    setRemitente("");
    setAsunto("");
    setContenido("");
    setError(null);
  }

  async function resumir(e: FormEvent) {
    e.preventDefault();
    if (cargando) return;
    if (!contenido.trim()) {
      setError("Escribe o pega el contenido del correo.");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/agente-correo/prueba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remitente, asunto, contenido }),
      });
      const datos = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datos.error ?? "Algo salió mal. Intenta de nuevo.");
      setResultado(datos as Resultado);
      cargarHistorial(true);
      requestAnimationFrame(() => {
        const el = resultadoRef.current;
        if (el && el.getBoundingClientRect().top > window.innerHeight * 0.7) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function revisarGmail() {
    setGmailCargando(true);
    setGmailMensaje(null);
    try {
      const res = await fetch("/api/agente-correo", { method: "POST" });
      const datos = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(datos.error ?? "No se pudo revisar tu correo.");
      const n: number = datos.procesados ?? 0;
      setGmailMensaje(
        n === 0 ? "No tienes correos nuevos sin leer." : `Listo: resumí ${n} correo${n === 1 ? "" : "s"}. Están en tu historial.`,
      );
      cargarHistorial(true);
    } catch (err) {
      setGmailMensaje(err instanceof Error ? err.message : "No se pudo revisar tu correo.");
    } finally {
      setGmailCargando(false);
    }
  }

  async function conectarGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Solo lectura de Gmail: nunca se pide permiso de enviar o borrar
        scopes: "https://www.googleapis.com/auth/gmail.readonly",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  const hayTexto = Boolean(remitente || asunto || contenido);

  return (
    <div className="dash-contenido dash-vista">
      <EncabezadoVista
        etiqueta="Clara · Correo"
        titulo="Correo"
        texto="Pega un correo o elige un ejemplo. Clara te dice de qué trata y qué conviene hacer."
      />

      {/* ---------- Modo de prueba ---------- */}
      <div id="probar" className="dash-clara">
        <section className="dash-clara__formulario" aria-labelledby="dash-clara-titulo">
          <h2 id="dash-clara-titulo" className="dash-cabeza__titulo">
            Resume un correo
          </h2>
          <p className="dash-clara__etiqueta" id="dash-ejemplos">
            Ejemplos
          </p>
          <div className="dash-chips" role="group" aria-labelledby="dash-ejemplos">
            {EJEMPLOS.map((ejemplo) => (
              <button
                key={ejemplo.etiqueta}
                type="button"
                className="dash-chip"
                aria-pressed={contenido === ejemplo.contenido}
                onClick={() => usarEjemplo(ejemplo)}
              >
                {ejemplo.etiqueta}
              </button>
            ))}
          </div>

          <form onSubmit={resumir} className="dash-clara__campos" noValidate>
            <Field
              label="De"
              name="remitente"
              value={remitente}
              onChange={setRemitente}
              placeholder="Juan Pérez <juan@correo.com>"
              maxLength={300}
            />
            <Field label="Asunto" name="asunto" value={asunto} onChange={setAsunto} placeholder="¿De qué trata?" maxLength={300} />
            <Field
              label="Contenido"
              name="contenido"
              value={contenido}
              onChange={setContenido}
              placeholder="Pega aquí el texto del correo"
              multiline
              maxLength={5000}
            />
            <div className="dash-clara__acciones">
              <Boton type="submit" cargando={cargando} icono={<Icono nombre="rayo" />}>
                {cargando ? "Leyendo el correo" : "Resumir con IA"}
              </Boton>
              {hayTexto && !cargando ? (
                <Boton variante="fantasma" onClick={limpiar}>
                  Limpiar
                </Boton>
              ) : null}
            </div>
            {error ? (
              <p role="alert" className="dash-clara__error">
                <Icono nombre="alerta" tam={16} />
                {error}
              </p>
            ) : null}
          </form>
        </section>

        <section ref={resultadoRef} aria-live="polite" aria-label="Resumen de Clara" className="dash-clara__resultado">
          {resultado ? (
            <div className="dash-clara__lleno">
              <p className="dash-clara__etiqueta">Resumen</p>
              <p className="dash-clara__meta">
                {resultado.remitente} · {resultado.asunto}
              </p>
              <p className="dash-clara__resumen">{resultado.resumen}</p>
              {conSugerencia(resultado.accion) ? (
                <p className="dash-correo__accion">
                  <Icono nombre="flecha" tam={16} />
                  {resultado.accion}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="dash-clara__espera">
              <Cara agente="clara" tam="chica" />
              {cargando ? <Escribiendo quien="Clara" conTexto /> : <p className="dash-vacio__texto">El resumen aparecerá aquí.</p>}
            </div>
          )}
        </section>
      </div>

      {/* ---------- Gmail ---------- */}
      <section id="gmail" className="dash-gmail" aria-labelledby="dash-gmail-titulo">
        <Icono nombre="correo" tam={24} className="dash-gmail__icono" />
        <div className="dash-gmail__texto">
          <h2 id="dash-gmail-titulo" className="dash-cabeza__titulo">
            Tu Gmail
          </h2>
          <p className="dash-vacio__texto">
            {conGoogle
              ? "Tu Gmail está conectado: Clara resume los correos que no has leído. Solo lectura: nunca envía ni borra nada."
              : "Conecta tu Gmail y Clara resume tus correos sin leer. Solo lectura: nunca envía ni borra nada."}
          </p>
          {gmailMensaje ? (
            <p className="dash-gmail__mensaje" role="status">
              {gmailMensaje}
            </p>
          ) : null}
        </div>
        <div className="dash-gmail__accion">
          {conGoogle ? (
            <Boton variante="sutil" tam="compacto" onClick={revisarGmail} cargando={gmailCargando} flecha={!gmailCargando}>
              {gmailCargando ? "Revisando" : "Revisar correo nuevo"}
            </Boton>
          ) : googleDisponible ? (
            <Boton variante="sutil" tam="compacto" onClick={conectarGoogle} flecha>
              Conectar Gmail
            </Boton>
          ) : (
            <Insignia tono="pronto">Próximamente</Insignia>
          )}
        </div>
      </section>

      {/* ---------- Historial ---------- */}
      <section id="historial" className="dash-historial" aria-labelledby="dash-historial-titulo">
        <div className="dash-cabeza">
          <h2 id="dash-historial-titulo" className="dash-cabeza__titulo">
            Lo que Clara ya leyó
          </h2>
          {historial && historial.length > 0 ? (
            <span className="dash-columna__nota cifras">
              {historial.length} {historial.length === 1 ? "resumen" : "resúmenes"}
            </span>
          ) : null}
        </div>
        {historial === null ? (
          <p className="dash-cargando">
            <Giro />
            Cargando…
          </p>
        ) : historial.length === 0 ? (
          <Vacio agente="clara" titulo="Todavía no hay resúmenes" texto="Prueba con uno de los ejemplos de arriba: el resumen queda guardado aquí." />
        ) : (
          <ul className="dash-lista dash-correos">
            {historial.map((item) => (
              <FilaCorreo
                key={item.id}
                correo={{
                  id: item.id,
                  remitente: item.remitente,
                  asunto: item.asunto,
                  resumen: item.resumen,
                  accion: item.accion_sugerida,
                  cuando: haceCuanto(new Date(item.creado_en), referencia),
                  nuevo: nuevos.has(item.id),
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
