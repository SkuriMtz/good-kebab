"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Resultado = {
  asunto: string;
  remitente: string;
  resumen: string;
  accion: string;
};

type Guardado = {
  id: string;
  remitente: string | null;
  asunto: string | null;
  resumen: string;
  accion_sugerida: string | null;
  creado_en: string;
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

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [linkEnviado, setLinkEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [historial, setHistorial] = useState<Guardado[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [remitente, setRemitente] = useState("");
  const [asunto, setAsunto] = useState("");
  const [contenido, setContenido] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    if (new URLSearchParams(window.location.search).get("error") === "login") {
      setError(
        "No se pudo iniciar sesión. Pide un link nuevo y ábrelo en este mismo navegador."
      );
    }
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // Lee lo guardado en la base de datos. RLS se encarga de que solo
  // regresen los resúmenes del negocio de quien inició sesión.
  const cargarHistorial = useCallback(async () => {
    const { data } = await supabase
      .from("resumenes_correo")
      .select("id, remitente, asunto, resumen, accion_sugerida, creado_en")
      .order("creado_en", { ascending: false })
      .limit(20);
    setHistorial(data ?? []);
  }, [supabase]);

  useEffect(() => {
    if (user) cargarHistorial();
  }, [user, cargarHistorial]);

  async function entrarConCorreo(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setCargando(false);
    if (error) {
      setError(`No se pudo enviar el link: ${error.message}`);
    } else {
      setLinkEnviado(true);
    }
  }

  async function iniciarSesionGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Pedimos permiso de solo-lectura sobre Gmail — nunca se pide
        // permiso de enviar o borrar correos en este MVP.
        scopes: "https://www.googleapis.com/auth/gmail.readonly",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setResultados([]);
    setHistorial([]);
    setLinkEnviado(false);
  }

  async function llamarAgente(url: string, body?: object) {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      return null;
    } finally {
      setCargando(false);
    }
  }

  async function probarCorreo(e: React.FormEvent) {
    e.preventDefault();
    const data = await llamarAgente("/api/agente-correo/prueba", {
      remitente,
      asunto,
      contenido,
    });
    if (data) {
      setResultados([data]);
      cargarHistorial();
    }
  }

  async function revisarGmail() {
    const data = await llamarAgente("/api/agente-correo");
    if (data) {
      setResultados(data.resultados ?? []);
      cargarHistorial();
    }
  }

  function usarEjemplo(ejemplo: (typeof EJEMPLOS)[number]) {
    setRemitente(ejemplo.remitente);
    setAsunto(ejemplo.asunto);
    setContenido(ejemplo.contenido);
  }

  const campo = "w-full border rounded-lg px-3 py-2 bg-white";

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-2">Agente de Correo</h1>
      <p className="text-gray-600 mb-6">
        Resúmenes y acciones sugeridas de tus correos, generados con IA.
      </p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!user ? (
        <div className="space-y-6">
          {linkEnviado ? (
            <p className="border rounded-lg p-4 bg-white">
              Te enviamos un link a <strong>{email}</strong>. Ábrelo{" "}
              <strong>en este mismo navegador</strong> para entrar.
            </p>
          ) : (
            <form onSubmit={entrarConCorreo} className="space-y-3">
              <label className="block text-sm font-medium">
                Entra con tu correo (te llega un link, sin contraseña)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className={campo}
              />
              <button
                type="submit"
                disabled={cargando}
                className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {cargando ? "Enviando..." : "Enviarme link de acceso"}
              </button>
            </form>
          )}

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">
              O, si ya configuraste Google Cloud:
            </p>
            <button onClick={iniciarSesionGoogle} className="text-sm underline">
              Conectar con Google (Gmail)
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button onClick={cerrarSesion} className="text-sm underline">
              Cerrar sesión
            </button>
          </div>

          <section className="border rounded-lg p-4 bg-white mb-6">
            <h2 className="font-medium mb-1">Modo de prueba</h2>
            <p className="text-sm text-gray-600 mb-3">
              Pega un correo (o usa un ejemplo) y la IA lo resume.
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {EJEMPLOS.map((ej) => (
                <button
                  key={ej.etiqueta}
                  type="button"
                  onClick={() => usarEjemplo(ej)}
                  className="text-xs border rounded-full px-3 py-1 hover:bg-gray-50"
                >
                  {ej.etiqueta}
                </button>
              ))}
            </div>

            <form onSubmit={probarCorreo} className="space-y-3">
              <input
                value={remitente}
                onChange={(e) => setRemitente(e.target.value)}
                placeholder="De (ej. Juan Pérez <juan@correo.com>)"
                maxLength={300}
                className={campo}
              />
              <input
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Asunto"
                maxLength={300}
                className={campo}
              />
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Contenido del correo"
                required
                maxLength={5000}
                rows={5}
                className={campo}
              />
              <button
                type="submit"
                disabled={cargando}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {cargando ? "Procesando..." : "Resumir con IA"}
              </button>
            </form>
          </section>

          <section className="mb-6">
            <button
              onClick={revisarGmail}
              disabled={cargando}
              className="text-sm underline disabled:opacity-50"
            >
              Revisar correo nuevo de Gmail
            </button>
            <span className="text-xs text-gray-500 ml-2">
              (solo si entraste con Google)
            </span>
          </section>

          {resultados.length > 0 && (
            <section className="mb-8">
              <h2 className="font-medium mb-2">Resultado</h2>
              <ul className="space-y-4">
                {resultados.map((r, i) => (
                  <li key={i} className="border-2 border-blue-200 rounded-lg p-4 bg-white">
                    <p className="text-xs text-gray-500">{r.remitente}</p>
                    <p className="font-medium">{r.asunto}</p>
                    <p className="text-sm mt-1">{r.resumen}</p>
                    {r.accion !== "ninguna" && (
                      <p className="text-sm mt-1 text-blue-700">
                        Sugerencia: {r.accion}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-medium mb-2">Historial guardado</h2>
            {historial.length === 0 ? (
              <p className="text-sm text-gray-500">Todavía no hay resúmenes.</p>
            ) : (
              <ul className="space-y-3">
                {historial.map((h) => (
                  <li key={h.id} className="border rounded-lg p-3 bg-white">
                    <p className="text-xs text-gray-500">
                      {h.remitente} · {new Date(h.creado_en).toLocaleString("es-MX")}
                    </p>
                    <p className="font-medium text-sm">{h.asunto}</p>
                    <p className="text-sm mt-1">{h.resumen}</p>
                    {h.accion_sugerida && h.accion_sugerida !== "ninguna" && (
                      <p className="text-sm mt-1 text-blue-700">
                        Sugerencia: {h.accion_sugerida}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
