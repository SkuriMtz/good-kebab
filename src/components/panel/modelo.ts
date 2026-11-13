"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PromptBarModel } from "@/components/PromptBar";
import { MODELOS, esIdModelo, type IdModelo } from "@/lib/planes";

/**
 * El modelo que se eligió en el selector del chat (Rápido o Avanzado), como
 * el de Claude. Se recuerda en este navegador; si el plan no lo trae, se usa
 * el primero de su plan. El servidor vuelve a revisar que el plan lo traiga.
 */
const CLAVE = "atendel-modelo";

/** El modelo guardado (para quien arma la petición fuera de React, como la demostración). */
export function modeloElegido(): IdModelo {
  try {
    const v = window.localStorage.getItem(CLAVE);
    return esIdModelo(v) ? v : "rapido";
  } catch {
    return "rapido";
  }
}

export function useModelo(permitidos: readonly IdModelo[]) {
  const [modelo, setModelo] = useState<IdModelo>(permitidos[0] ?? "rapido");
  // Ya se leyó lo guardado (antes no: el servidor no lo sabe y se evita la diferencia al hidratar)
  const [listo, setListo] = useState(false);
  const clave = permitidos.join(",");

  useEffect(() => {
    const guardado = modeloElegido();
    const lista = clave.split(",").filter(esIdModelo);
    setModelo(lista.includes(guardado) ? guardado : (lista[0] ?? "rapido"));
    setListo(true);
  }, [clave]);

  const elegir = useCallback((key: string) => {
    if (!esIdModelo(key)) return;
    setModelo(key);
    try {
      window.localStorage.setItem(CLAVE, key);
    } catch {
      /* sin almacenamiento: vale para esta visita */
    }
  }, []);

  /** Las opciones del selector de la caja: nombre y para qué es. */
  const opciones = useMemo<PromptBarModel[]>(
    () => clave.split(",").filter(esIdModelo).map((id) => ({ key: id, name: MODELOS[id].nombre, tag: MODELOS[id].detalle })),
    [clave],
  );

  return { modelo, elegir, opciones, listo };
}
