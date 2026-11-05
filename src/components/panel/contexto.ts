"use client";

import { createContext } from "react";
import type { ChatMenu } from "./Armazon";

/**
 * Para que el chat avise al menú: una conversación nueva sube a Recientes
 * (o a Fijados si es un grupo con nombre) y una borrada se quita, sin
 * recargar la página.
 */
export type AvisosChats = {
  agregar: (chat: ChatMenu, fijado: boolean) => void;
  quitar: (id: string) => void;
};

export const ContextoChats = createContext<AvisosChats | null>(null);
