"use client";

import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { planMinimo, type Plan } from "@/lib/planes";
import type { Destino } from "./tipos";
import { MarcaAgente } from "./util";

/* =====================================================================
   VISTA AGENTES ("Mis agentes"): los 4 agentes, cuáles permite el plan y
   quién está en tu equipo. Elegir equipo solo cambia QUIÉN trabaja contigo
   dentro de tu plan; el plan no se cambia desde aquí.
   La usan /panel/agentes (guarda en Supabase) y /pruebalo (solo local).
   ===================================================================== */

export function VistaAgentes({
  plan,
  elegidos,
  libre,
  guardando,
  error,
  alAlternar,
  hablar,
  verFicha,
  ejemplo = false,
}: {
  plan: Plan;
  elegidos: IdAgente[];
  /** ¿Puede elegir quién está en su equipo? (en Free solo trabaja Clara) */
  libre: boolean;
  guardando: IdAgente | null;
  error: string | null;
  alAlternar: (id: IdAgente) => void;
  hablar: (id: IdAgente) => Destino;
  verFicha: (id: IdAgente) => void;
  ejemplo?: boolean;
}) {
  return (
    <>
      <header className="tb-encabezado">
        <div className="tb-encabezado__sello">
          <span className="tb-texto-2">{plan.nombre}</span>
          {ejemplo ? <Insignia>Datos de ejemplo</Insignia> : null}
        </div>
        <h1 className="t-app-titulo-grande">Tu equipo</h1>
        <p className="tb-encabezado__texto">
          {libre
            ? "Elige quién trabaja contigo. Puedes cambiarlo cuando quieras; solo los agentes de tu equipo aparecen en el chat."
            : "Con Atendel Free trabajas con Clara. Con Atendel One se suma Lola, y con Atendel Max tienes a todo el equipo y eliges a quien quieras."}
        </p>
      </header>

      {error ? (
        <p role="alert" className="tb-error">
          <Icono nombre="alerta" tam={16} />
          {error}
        </p>
      ) : null}

      <ul className="tb-equipo-lista">
        {AGENTES_INFO.map((a) => {
          const permitido = plan.agentes.includes(a.id);
          const enEquipo = permitido && elegidos.includes(a.id);
          const ultimo = enEquipo && elegidos.length === 1;
          return (
            <li key={a.id} className={`tb-tarjeta tb-miembro${permitido ? "" : " tb-miembro--fuera"}`}>
              <div className="tb-miembro__cabeza">
                <MarcaAgente agente={a.id} tam={64} apagado={!permitido} />
                <div className="tb-miembro__nombre">
                  <h2 className="t-app-titulo">{a.nombre}</h2>
                  <p className="tb-texto-2">
                    {a.area} · {a.abarca}
                  </p>
                  <span className="tb-miembro__estado">
                    {!permitido ? (
                      <Insignia tono="pronto">
                        <Icono nombre="candado" tam={12} />
                        Con {planMinimo(a.id).nombre}
                      </Insignia>
                    ) : enEquipo ? (
                      <Insignia tono="exito" conPunto>
                        En tu equipo
                      </Insignia>
                    ) : (
                      <Insignia>Fuera de tu equipo</Insignia>
                    )}
                  </span>
                </div>
              </div>
              <p className="tb-miembro__lema">{a.lema}</p>
              <ul className="tb-miembro__capacidades">
                {a.capacidades.map((c) => (
                  <li key={c}>
                    <Icono nombre="check" tam={16} />
                    {c}
                  </li>
                ))}
              </ul>
              <div className="tb-miembro__acciones">
                {!permitido ? (
                  <Boton variante="sutil" tam="compacto" href="/precios" flecha>
                    Ver precios
                  </Boton>
                ) : libre ? (
                  <Boton
                    variante="sutil"
                    tam="compacto"
                    aria-pressed={enEquipo}
                    cargando={guardando === a.id}
                    disabled={guardando !== null && guardando !== a.id}
                    icono={<Icono nombre={enEquipo ? "check" : "mas"} />}
                    title={ultimo ? "Tu equipo necesita al menos un agente" : undefined}
                    onClick={() => alAlternar(a.id)}
                  >
                    {enEquipo ? "En tu equipo" : "Agregar a tu equipo"}
                  </Boton>
                ) : null}
                {enEquipo ? <BotonHablar destino={hablar(a.id)} nombre={a.nombre} /> : null}
                <Boton variante="fantasma" tam="compacto" onClick={() => verFicha(a.id)}>
                  Ver ficha
                </Boton>
              </div>
            </li>
          );
        })}
      </ul>

      {plan.id !== "max" ? (
        <div className="tb-tarjeta tb-nota-plan">
          <p>
            {plan.id === "free" ? (
              <>
                Con <span className="tb-fuerte">Atendel One</span> se suma Lola, que atiende tu WhatsApp y tus citas. Con{" "}
                <span className="tb-fuerte">Atendel Max</span> tienes a los cuatro: Víctor trae de regreso a tus clientes e Iris se
                encarga de la oficina.
              </>
            ) : (
              <>
                Con <span className="tb-fuerte">Atendel Max</span> tienes a los cuatro: Víctor trae de regreso a tus clientes e Iris se
                encarga de la oficina.
              </>
            )}
          </p>
          <Boton variante="sutil" tam="compacto" href="/precios" flecha>
            Ver precios
          </Boton>
        </div>
      ) : null}
    </>
  );
}

/** "Hablar con Lola": enlace al chat (panel) o cambio de vista (ejemplo). */
function BotonHablar({ destino, nombre }: { destino: Destino; nombre: string }) {
  const icono = <Icono nombre="mensaje" />;
  if (destino.href) {
    return (
      <Boton variante="fantasma" tam="compacto" icono={icono} href={destino.href} onClick={destino.alElegir}>
        Hablar con {nombre}
      </Boton>
    );
  }
  return (
    <Boton variante="fantasma" tam="compacto" icono={icono} onClick={destino.alElegir}>
      Hablar con {nombre}
    </Boton>
  );
}
