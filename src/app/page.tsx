"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Resultado = {
  asunto: string;
  remitente: string;
  resumen: string;
  accion: string;
};

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function iniciarSesion() {
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
  }

  async function ejecutarAgente() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/agente-correo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setResultados(data.resultados ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-2">Agente de Correo</h1>
      <p className="text-gray-600 mb-6">
        Resúmenes y acciones sugeridas de tus correos sin leer, generados con IA.
      </p>

      {!user ? (
        <button
          onClick={iniciarSesion}
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          Conectar con Google
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button onClick={cerrarSesion} className="text-sm underline">
              Cerrar sesión
            </button>
          </div>

          <button
            onClick={ejecutarAgente}
            disabled={cargando}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {cargando ? "Procesando..." : "Revisar correo nuevo"}
          </button>

          {error && <p className="text-red-600 mt-4">{error}</p>}

          <ul className="mt-6 space-y-4">
            {resultados.map((r, i) => (
              <li key={i} className="border rounded-lg p-4 bg-white">
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
        </div>
      )}
    </main>
  );
}
