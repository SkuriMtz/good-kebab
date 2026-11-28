"use client";

import { useState, type CSSProperties } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { agenteDe, type Idioma } from "@/i18n";
import { IDS_AGENTES, type IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

/**
 * Debajo del título de la portada (como los personajes de Notion): las caras de los cuatro
 * agentes, encimadas, y un texto mínimo. Sin párrafos:
 * - Te siguen con la mirada (Personaje, a 48 px ya está vivo).
 * - Al pasar el cursor, enfocar o tocar una cara, esa sube y el texto dice quién es y qué hace;
 *   al salir, vuelve a «Tu equipo de IA, en línea».
 * - Entra después del título (mezcla.css; sin movimiento si se pide reducirlo).
 */
const TEXTOS: Record<string, { equipo: string; roles: Record<IdAgente, string> }> = {
  es: { equipo: "Tu equipo de IA, en línea", roles: { lola: "Contesta tu WhatsApp y agenda citas", clara: "Lleva tu correo", victor: "Trae de vuelta a tus clientes", iris: "Hace el papeleo" } },
  en: { equipo: "Your AI team, online", roles: { lola: "Answers your WhatsApp and books appointments", clara: "Handles your email", victor: "Brings your clients back", iris: "Does the paperwork" } },
  pt: { equipo: "Sua equipe de IA, online", roles: { lola: "Responde seu WhatsApp e marca horários", clara: "Cuida do seu e-mail", victor: "Traz seus clientes de volta", iris: "Faz a papelada" } },
  fr: { equipo: "Votre équipe IA, en ligne", roles: { lola: "Répond sur WhatsApp et prend les rendez-vous", clara: "Gère vos e-mails", victor: "Fait revenir vos clients", iris: "S'occupe de la paperasse" } },
  de: { equipo: "Dein KI-Team, online", roles: { lola: "Beantwortet dein WhatsApp und vereinbart Termine", clara: "Kümmert sich um deine E-Mails", victor: "Holt deine Kunden zurück", iris: "Erledigt den Papierkram" } },
  it: { equipo: "Il tuo team di IA, online", roles: { lola: "Risponde su WhatsApp e fissa gli appuntamenti", clara: "Gestisce la tua email", victor: "Fa tornare i tuoi clienti", iris: "Si occupa delle scartoffie" } },
  zh: { equipo: "你的 AI 团队，随时在线", roles: { lola: "回复 WhatsApp，安排预约", clara: "处理你的邮件", victor: "让老客人回来", iris: "处理文书工作" } },
};

export function EquipoPortada({ idioma }: { idioma: Idioma }) {
  const T = TEXTOS[idioma] ?? TEXTOS.en;
  const [activo, setActivo] = useState<IdAgente | null>(null);
  const a = activo ? agenteDe(idioma, activo) : null;
  return (
    <div className="mz-equipo-portada" onMouseLeave={() => setActivo(null)}>
      <ul className="mz-equipo-portada__caras">
        {IDS_AGENTES.map((id, i) => (
          <li key={id} style={{ "--c": PERSONAJES[id].color, "--i": i } as CSSProperties}>
            <button
              type="button"
              className="mz-equipo-portada__cara"
              aria-pressed={activo === id}
              aria-label={`${agenteDe(idioma, id).nombre}: ${T.roles[id]}`}
              data-activo={activo === id || undefined}
              onMouseEnter={() => setActivo(id)}
              onFocus={() => setActivo(id)}
              onBlur={() => setActivo(null)}
              onClick={() => setActivo((x) => (x === id ? null : id))}
            >
              <Personaje agente={id} avatar />
            </button>
          </li>
        ))}
      </ul>
      <p className="mz-equipo-portada__texto" aria-live="polite">
        {a && activo ? (
          <span key={activo} className="mz-equipo-portada__rol" style={{ "--c": PERSONAJES[activo].color } as CSSProperties}>
            <b>{a.nombre}</b> · {T.roles[activo]}
          </span>
        ) : (
          <span key="equipo" className="mz-equipo-portada__rol">
            <i className="mz-equipo-portada__punto" aria-hidden="true" />
            {T.equipo}
          </span>
        )}
      </p>
    </div>
  );
}
