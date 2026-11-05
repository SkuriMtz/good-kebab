"use client";

import type { CorreoPendiente } from "@/lib/pendientes";
import { accionValida, normalizar } from "@/lib/estadisticas";
import type { PasoPanel } from "@/lib/pasos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { planMinimo } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icono } from "@/components/base/Iconos";
import { Enlace, Pildoras, TituloSeccion, Vacio, claseBoton } from "./Piezas";
import { BloqueAjustes, ElegirTema, Seccion, Tablero, TarjetaPlan, type ItemTablero } from "./Secciones";
import { nombresDe } from "./Mensajes";
import { nombreRemitente } from "./remitente";

/* =====================================================================
   Las secciones de /panel con los datos reales de la cuenta. Nada
   inventado: lo que todavía no existe se dice con su estado vacío.
   ===================================================================== */

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });

/* ---------- Pendientes ---------- */

export function PendientesReal({
  correos,
  pasos,
  totalCorreos,
  tipo,
  de,
  accion,
}: {
  correos: CorreoPendiente[];
  pasos: PasoPanel[];
  totalCorreos: number | null;
  tipo?: string;
  de?: string;
  accion?: string;
}) {
  const filtro = tipo === "correos" || tipo === "pasos" ? tipo : "todo";
  // La acción se compara como la agrupa Estadísticas: normalizar(accionValida(…)) en los dos lados
  const clave = (t: string | null | undefined) => normalizar(accionValida(t) ?? "");
  const buscada = accion ? clave(accion) : "";
  const visibles = correos.filter((c) => (!de || nombreRemitente(c.remitente) === de) && (!accion || clave(c.accion_sugerida) === buscada));
  const items: ItemTablero[] = [
    ...(filtro === "pasos"
      ? []
      : visibles.map((c) => {
          const quien = nombreRemitente(c.remitente);
          return {
            id: `c-${c.id}`,
            columna: "revisar" as const,
            agente: "clara" as IdAgente,
            titulo: c.asunto || "(sin asunto)",
            para: `Correo de ${quien}`,
            texto: c.accion_sugerida,
            hace: fecha.format(new Date(c.creado_en)),
            acciones: (
              <>
                <Enlace href={`/panel?vista=correo&de=${encodeURIComponent(quien)}#historial`} className={claseBoton("borde", true)}>
                  Ver en Correo
                </Enlace>
                <Enlace href={`/panel?agente=clara&pide=${encodeURIComponent(`Ayúdame con el correo de ${quien} («${c.asunto ?? "sin asunto"}»): ${c.accion_sugerida}`)}`} className={claseBoton("fantasma", true)}>
                  Pedírselo a Clara
                </Enlace>
              </>
            ),
          };
        })),
    ...(filtro === "correos" || de || accion
      ? []
      : pasos.map((p) => ({
          id: `p-${p.id}`,
          columna: "revisar" as const,
          titulo: p.titulo,
          texto: p.detalle,
          nota: "Primer paso",
          acciones: (
            <Enlace href={p.href} className={claseBoton("borde", true)}>
              Hacerlo ahora
            </Enlace>
          ),
        }))),
  ];

  return (
    <Seccion ancha>
      <TituloSeccion titulo="Pendientes" texto="Lo que espera tu visto bueno. Clara deja aquí los correos que piden algo; Lola y Víctor se suman cuando estén conectados." />
      <div className="pc-filtros">
        <Pildoras
          etiqueta="Filtrar pendientes"
          activa={filtro}
          opciones={[
            { id: "todo", etiqueta: "Todo", href: "/panel?vista=pendientes", cuenta: (totalCorreos ?? 0) + pasos.length },
            { id: "correos", etiqueta: "Correos", href: "/panel?vista=pendientes&tipo=correos", cuenta: totalCorreos },
            { id: "pasos", etiqueta: "Primeros pasos", href: "/panel?vista=pendientes&tipo=pasos", cuenta: pasos.length },
          ]}
        />
        {de || accion ? (
          <Enlace href="/panel?vista=pendientes" className="pc-pildora pc-pildora--quitar" aria-label={`Quitar el filtro: ${de ?? accion}`}>
            {de ? `De: ${de}` : `Acción: ${accion}`}
            <Icono nombre="cerrar" tam={14} />
          </Enlace>
        ) : null}
      </div>
      {totalCorreos === null ? <p className="pc-nota">No se pudieron leer los correos pendientes. Intenta de nuevo en un momento.</p> : null}
      <Tablero
        agenteVacio="clara"
        items={items}
        vacios={{
          revisar: de || accion ? "Nada con este filtro." : "Nada por revisar. Cuando Clara encuentre un correo que pide algo, aparece aquí.",
          aprobado: "Lo que apruebes aparece aquí cuando Lola y Víctor estén conectados a tu WhatsApp.",
          enviado: "Aquí verás lo que tu equipo ya mandó.",
        }}
      />
    </Seccion>
  );
}

/* ---------- Citas ---------- */

export function CitasReal({ conLola, de, dia }: { conLola: boolean; de?: string; dia?: string }) {
  return (
    <Seccion>
      <TituloSeccion titulo="Citas" texto="La agenda que lleva Lola: lo que confirma, cambia y recuerda por WhatsApp." />
      {de || dia ? (
        <div className="pc-filtros">
          <Enlace href="/panel?vista=citas" className="pc-pildora pc-pildora--quitar" aria-label={`Quitar el filtro: ${de ?? dia}`}>
            {de ? `Cliente: ${de}` : `Día: ${dia}`}
            <Icono nombre="cerrar" tam={14} />
          </Enlace>
        </div>
      ) : null}
      <Vacio
        agente="lola"
        titulo="Todavía no hay citas"
        texto="Tus citas aparecen aquí cuando conectes WhatsApp con Lola. Mientras, puedes pedirle en el chat los mensajes para confirmar o reagendar."
        accion={
          conLola ? (
            <Enlace href={`/panel?agente=lola&pide=${encodeURIComponent("Escribe un mensaje para confirmar las citas de mañana, corto y amable.")}`} className={claseBoton("principal", true)}>
              Pedírselo a Lola
            </Enlace>
          ) : (
            <Enlace href="/precios" className={claseBoton("borde", true)}>
              Lola llega con {planMinimo("lola").nombre}
            </Enlace>
          )
        }
      />
      <p className="pc-nota">
        ¿Quieres ver cómo se ve con citas? <Enlace href="/pruebalo?vista=citas" className="pc-enlace">Míralo con datos de ejemplo</Enlace>.
      </p>
    </Seccion>
  );
}

/* ---------- Ajustes ---------- */

export function AjustesReal({ plan, usados, total, conGoogle, activos, correo }: { plan: string; usados: number; total: number; conGoogle: boolean; activos: IdAgente[]; correo: string }) {
  const router = useRouter();
  return (
    <Seccion>
      <TituloSeccion titulo="Ajustes" texto="Tu plan, cómo se ve el panel, tu correo y tu equipo." />
      <BloqueAjustes id="aj-plan" titulo="Tu plan" texto="El plan solo se ve aquí. Para cambiarlo, escríbenos.">
        <TarjetaPlan plan={plan} usados={usados} total={total} />
      </BloqueAjustes>
      <BloqueAjustes id="aj-tema" titulo="Apariencia" texto="Oscuro es el de siempre; claro es una tarjeta sobre gris.">
        <ElegirTema />
      </BloqueAjustes>
      <BloqueAjustes id="aj-correo" titulo="Correo" texto="Clara lee tu Gmail. Solo lectura: nunca envía ni borra nada.">
        <p className="pc-ajuste__estado">
          <span className={`pc-estado pc-estado--${conGoogle ? "exito" : "neutro"}`}>{conGoogle ? "Gmail conectado" : "Sin Gmail"}</span>
          <Enlace href="/panel?vista=correo#gmail" className="pc-enlace">
            {conGoogle ? "Ir a Correo" : "Conectar Gmail"}
          </Enlace>
        </p>
      </BloqueAjustes>
      <BloqueAjustes id="aj-equipo" titulo="Tu equipo" texto={activos.length ? `Trabajan contigo: ${nombresDe(activos)}.` : "Todavía no eliges a tu equipo."}>
        <p className="pc-ajuste__estado">
          {activos.map((id) => (
            <span key={id} className="pc-estado pc-estado--neutro">
              {AGENTE_POR_ID[id].nombre}
            </span>
          ))}
          <Enlace href="/panel/agentes" className="pc-enlace">
            Elegir en Agentes
          </Enlace>
        </p>
      </BloqueAjustes>
      <BloqueAjustes id="aj-cuenta" titulo="Tu cuenta" texto={correo}>
        <button
          type="button"
          className={claseBoton("borde", true)}
          onClick={async () => {
            await createClient().auth.signOut();
            router.replace("/");
            router.refresh();
          }}
        >
          <Icono nombre="cerrar-sesion" tam={16} />
          Cerrar sesión
        </button>
      </BloqueAjustes>
    </Seccion>
  );
}
