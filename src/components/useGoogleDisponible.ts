"use client";

import { useEffect, useState } from "react";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Pregunta a Supabase si el inicio de sesión con Google ya está activado.
 * Así el botón de Google solo aparece cuando de verdad funciona (si no,
 * Supabase muestra una página de error poco amigable).
 */
export function useGoogleDisponible() {
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    let cancelado = false;
    fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } })
      .then((r) => (r.ok ? r.json() : null))
      .then((datos) => {
        if (!cancelado) setDisponible(Boolean(datos?.external?.google));
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  return disponible;
}
