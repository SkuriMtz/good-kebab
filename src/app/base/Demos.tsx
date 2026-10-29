"use client";

import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import { Boton, BotonIcono } from "@/components/base/Boton";
import { Buscador } from "@/components/base/Buscador";
import { Cajon } from "@/components/base/Cajon";
import { Escribiendo } from "@/components/base/Escribiendo";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Menu, type ElementoMenu } from "@/components/base/Menu";
import { PuntoEstado, type TonoEstado } from "@/components/base/PuntoEstado";
import { Marca } from "@/components/Logo";
import { Personaje } from "@/components/agentes/Personaje";
import type { IdAgente } from "@/lib/agentes";

/* ---------------------------------------------------------------------
   Piezas interactivas del muestrario /base (Base 4b). Todo es de ejemplo:
   nombres, horas y números ilustran el dashboard; no son datos reales.
   --------------------------------------------------------------------- */

export const MENU_PERFIL: ElementoMenu[] = [
  { id: "perfil", etiqueta: "Perfil", icono: "perfil" },
  { id: "configuracion", etiqueta: "Configuración", icono: "ajustes" },
  { id: "plan", etiqueta: "Plan y facturación", icono: "facturacion" },
  { id: "negocio", etiqueta: "Mi negocio", icono: "negocio" },
  { tipo: "separador" },
  { id: "salir", etiqueta: "Cerrar sesión", icono: "cerrar-sesion", peligroso: true },
];

export const MENU_CREAR: ElementoMenu[] = [
  { tipo: "titulo", etiqueta: "Crear" },
  { id: "conversacion", etiqueta: "Nueva conversación", icono: "mensaje", atajo: ["N"] },
  { id: "cita", etiqueta: "Agendar cita", icono: "calendario", atajo: ["C"] },
  { id: "grupo", etiqueta: "Nuevo grupo", icono: "usuarios" },
  { id: "importar", etiqueta: "Importar contactos", icono: "clientes", pronto: true },
];

const ENCABEZADO = {
  nombre: "Ana López",
  correo: "ana@clinicaluna.mx",
  estado: { tono: "exito" as const, etiqueta: "Disponible" },
};

/** El mismo contenido en oscuro y en claro, cada uno dentro de .producto. */
export function DosModos({ children, alto }: { children: ReactNode; alto?: string }) {
  return (
    <div className="grid gap-[var(--spacing-24)] lg:grid-cols-2">
      {(["oscuro", "claro"] as const).map((t) => (
        <div
          key={t}
          data-tema={t}
          className="producto rounded-panel-app border border-borde p-[var(--spacing-24)]"
          style={alto ? { minHeight: alto } : undefined}
        >
          <p className="t-app-etiqueta mb-[var(--spacing-16)]">Producto · {t}</p>
          {children}
        </div>
      ))}
    </div>
  );
}

/* ---------- Menús abiertos (estado "abierto" para verlos quietos) ---------- */
export function DemoMenus() {
  return (
    <div className="flex flex-wrap items-start gap-[var(--spacing-16)]">
      <Menu
        etiqueta="Tu cuenta"
        aspecto="avatar"
        disparador={<Avatar nombre={ENCABEZADO.nombre} tam={32} />}
        encabezado={ENCABEZADO}
        elementos={MENU_PERFIL}
        abiertoInicial
      />
      <div className="ml-auto">
        <Menu etiqueta="Crear" aspecto="icono" alineacion="fin" disparador={<Icono nombre="mas" />} elementos={MENU_CREAR} abiertoInicial />
      </div>
    </div>
  );
}

/* ---------- Cajón: un botón que lo abre ---------- */
export function DemoCajon() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Boton variante="sutil" tam="compacto" icono={<Icono nombre="barra-lateral" />} onClick={() => setAbierto(true)} aria-expanded={abierto}>
        Abrir el cajón
      </Boton>
      <Cajon abierto={abierto} alCerrar={() => setAbierto(false)} etiqueta="Menú de Atendel (ejemplo)" cabeza={<LogoApp seccion="Resumen" />}>
        <NavLateral />
      </Cajon>
    </>
  );
}

/* ---------- Barra de progreso: se puede mover para ver la transición ---------- */
export function DemoProgreso() {
  const [usados, setUsados] = useState(320);
  return (
    <div className="grid gap-[var(--spacing-24)]">
      <BarraProgreso etiqueta="Mensajes de octubre" valor={usados} max={500} unidad="mensajes" detalle="Se renueva el 1 de noviembre." />
      <BarraProgreso etiqueta="Mensajes de octubre" valor={430} max={500} unidad="mensajes" detalle="Te quedan 70 mensajes este mes." />
      <BarraProgreso etiqueta="Mensajes de octubre" valor={500} max={500} unidad="mensajes" detalle="Llegaste al tope de tu plan." />
      <div className="flex flex-wrap gap-[var(--spacing-8)]">
        <Boton variante="sutil" tam="compacto" onClick={() => setUsados((u) => Math.max(0, u - 60))}>
          −60
        </Boton>
        <Boton variante="sutil" tam="compacto" onClick={() => setUsados((u) => Math.min(500, u + 60))}>
          +60
        </Boton>
      </div>
    </div>
  );
}

/* ---------- Mini dashboard de referencia: barra + lateral + tarjetas ---------- */

type ElementoNav = { id: string; etiqueta: string; icono: NombreIcono; contador?: number; pronto?: boolean };
const NAV: ElementoNav[] = [
  { id: "resumen", etiqueta: "Resumen", icono: "inicio" },
  { id: "conversaciones", etiqueta: "Conversaciones", icono: "conversaciones", contador: 2 },
  { id: "agentes", etiqueta: "Agentes", icono: "agentes" },
  { id: "citas", etiqueta: "Citas", icono: "calendario" },
  { id: "correo", etiqueta: "Correo", icono: "correo" },
  { id: "clientes", etiqueta: "Clientes", icono: "clientes", pronto: true },
  { id: "reportes", etiqueta: "Reportes", icono: "grafica", pronto: true },
  { id: "configuracion", etiqueta: "Configuración", icono: "ajustes" },
];

const AGENTES_DEMO: { id: IdAgente; nombre: string; tono: TonoEstado; estado: string; pulso?: boolean }[] = [
  { id: "lola", nombre: "Lola", tono: "azul", estado: "Contestando un WhatsApp", pulso: true },
  { id: "clara", nombre: "Clara", tono: "exito", estado: "Activa" },
  { id: "victor", nombre: "Víctor", tono: "atencion", estado: "Espera tu visto bueno" },
  { id: "iris", nombre: "Iris", tono: "neutro", estado: "En pausa" },
];

const ACTIVIDAD: { agente: IdAgente; quien: string; texto: string; hora: string; insignia?: { tono: "exito" | "atencion" | "azul"; texto: string } }[] = [
  { agente: "lola", quien: "Lola", texto: "agendó a Mariana Ruiz: limpieza facial, jueves 16:30", hora: "10:44", insignia: { tono: "exito", texto: "Cita confirmada" } },
  { agente: "clara", quien: "Clara", texto: "resumió 6 correos de proveedores", hora: "09:12" },
  { agente: "victor", quien: "Víctor", texto: "preparó un mensaje para 4 pacientes que no vuelven desde abril", hora: "08:30", insignia: { tono: "atencion", texto: "Espera tu visto bueno" } },
];

function LogoApp({ seccion }: { seccion: string }) {
  return (
    <span className="flex min-w-0 items-center gap-[var(--spacing-8)]">
      <Marca className="h-[22px] w-[22px] shrink-0" />
      <span className="t-app-mediano">Atendel</span>
      <span className="text-terciario" aria-hidden="true">
        /
      </span>
      <span className="truncate text-grafito">{seccion}</span>
    </span>
  );
}

function NavLateral() {
  return (
    <div className="flex flex-col gap-[var(--spacing-24)]">
      <ul className="flex flex-col gap-[2px]">
        {NAV.map((n) => {
          const activo = n.id === "resumen";
          return (
            <li key={n.id}>
              <a
                href={n.pronto ? undefined : "#dashboard"}
                aria-current={activo ? "page" : undefined}
                aria-disabled={n.pronto || undefined}
                className={`flex h-[36px] items-center gap-[var(--spacing-12)] rounded-control px-[var(--spacing-8)] transition-transform duration-micro ease-base active:scale-[0.98] ${
                  activo ? "bg-capa-activa font-[500] text-tinta" : n.pronto ? "cursor-not-allowed text-grafito opacity-60" : "text-grafito hover:bg-capa-hover hover:text-tinta"
                }`}
              >
                <Icono nombre={n.icono} tam={16} />
                <span className="min-w-0 flex-1 truncate">{n.etiqueta}</span>
                {n.contador ? <Insignia contador={n.contador} etiqueta={`${n.contador} sin leer`} /> : null}
                {n.pronto ? <Insignia tono="pronto">Pronto</Insignia> : null}
              </a>
            </li>
          );
        })}
      </ul>
      <div>
        <p className="t-app-etiqueta px-[var(--spacing-8)] pb-[var(--spacing-8)]">Tus agentes</p>
        <ul className="flex flex-col gap-[2px]">
          {AGENTES_DEMO.map((a) => (
            <li key={a.id} className="flex min-h-[44px] items-center gap-[var(--spacing-12)] rounded-control px-[var(--spacing-8)]">
              <span className="marca-agente marca-agente--mini" style={{ ["--agente" as string]: `var(--agente-${a.id})` }}>
                <Personaje agente={a.id} avatar />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-tinta">{a.nombre}</span>
                <PuntoEstado tono={a.tono} etiqueta={a.estado} mostrarEtiqueta pulso={a.pulso} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DemoDashboard({ tema }: { tema: "oscuro" | "claro" }) {
  const [cajon, setCajon] = useState(false);
  return (
    <div data-tema={tema} className="producto overflow-hidden rounded-panel-app border border-borde">
      {/* Barra superior: 56px, translúcida */}
      <header className="flex h-[var(--barra-app-h)] items-center gap-[var(--spacing-8)] border-b border-borde bg-[var(--c-barra)] px-[var(--spacing-12)] backdrop-blur-[20px] sm:px-[var(--spacing-16)]">
        <BotonIcono etiqueta="Abrir el menú" icono="barra-lateral" className="lg:hidden" onClick={() => setCajon(true)} aria-expanded={cajon} />
        <LogoApp seccion="Resumen" />
        <div className="ml-auto hidden w-full max-w-[280px] sm:block">
          <Buscador etiqueta={`Buscar en Atendel (${tema})`} placeholder="Busca citas, clientes o chats" tam="compacto" atajo={tema === "oscuro"} />
        </div>
        <div className="ml-auto flex items-center gap-[var(--spacing-4)] sm:ml-0">
          <BotonIcono etiqueta="Buscar" icono="buscar" className="sm:hidden" />
          <Menu etiqueta="Crear" aspecto="icono" alineacion="fin" disparador={<Icono nombre="mas" />} elementos={MENU_CREAR} />
          <BotonIcono etiqueta="Avisos" icono="campana" contador={3} etiquetaContador="3 avisos sin leer" anillo="var(--c-app-fondo)" />
          <Menu
            etiqueta="Tu cuenta"
            aspecto="avatar"
            alineacion="fin"
            className="ml-[var(--spacing-4)]"
            disparador={<Avatar nombre={ENCABEZADO.nombre} tam={28} />}
            encabezado={ENCABEZADO}
            elementos={MENU_PERFIL}
          />
        </div>
      </header>

      <div className="grid lg:grid-cols-[var(--ancho-app-lateral)_minmax(0,1fr)]">
        {/* Menú lateral (en celular vive en el cajón) */}
        <nav aria-label={`Secciones del panel (ejemplo, ${tema})`} className="hidden border-r border-borde bg-lateral p-[var(--spacing-12)] lg:block">
          <NavLateral />
        </nav>

        <div className="grid min-w-0 gap-[var(--espacio-app-bloques)] p-[var(--spacing-16)] sm:p-[var(--spacing-24)] xl:grid-cols-[minmax(0,1fr)_var(--ancho-app-columna)]">
          {/* Bienvenida */}
          <section aria-labelledby={`saludo-${tema}`} className="rounded-panel-app border border-borde bg-superficie p-[var(--espacio-app-tarjeta-amplio)] xl:col-span-2">
            <div className="flex flex-wrap items-center gap-[var(--spacing-8)]">
              <p className="t-app-etiqueta cifras">Martes 8 de octubre</p>
              <Insignia>Datos de ejemplo</Insignia>
            </div>
            <h3 id={`saludo-${tema}`} className="t-app-saludo mt-[var(--spacing-8)]">
              Buenos días, Ana
            </h3>
            <p className="mt-[var(--spacing-8)] max-w-[60ch] text-grafito">
              Desde ayer, Lola agendó 3 citas y Clara resumió 6 correos. Víctor tiene un mensaje listo que espera tu visto bueno.
            </p>
            <div className="mt-[var(--spacing-20)] flex flex-col gap-[var(--spacing-8)] sm:flex-row">
              <Boton tam="compacto" icono={<Icono nombre="mensaje" />}>
                Nueva conversación
              </Boton>
              <Boton variante="sutil" tam="compacto" icono={<Icono nombre="calendario" />}>
                Agendar cita
              </Boton>
            </div>
          </section>

          {/* Actividad de los agentes */}
          <section aria-labelledby={`actividad-${tema}`} className="min-w-0 rounded-panel-app border border-borde bg-superficie">
            <div className="flex items-center justify-between gap-[var(--spacing-12)] border-b border-borde px-[var(--espacio-app-tarjeta)] py-[var(--spacing-12)]">
              <h3 id={`actividad-${tema}`} className="t-app-mediano">
                Actividad de hoy
              </h3>
              <Menu
                etiqueta="Opciones de la actividad"
                aspecto="icono"
                alineacion="fin"
                disparador={<Icono nombre="puntos" />}
                elementos={[
                  { id: "filtrar", etiqueta: "Filtrar por agente", icono: "filtro" },
                  { id: "fijar", etiqueta: "Fijar en el resumen", icono: "fijar" },
                ]}
              />
            </div>
            <ul>
              {ACTIVIDAD.map((a, i) => (
                <li key={i} className="flex gap-[var(--spacing-12)] border-b border-borde px-[var(--espacio-app-tarjeta)] py-[var(--spacing-12)] last:border-b-0">
                  <span className="marca-agente marca-agente--mini mt-[2px]" style={{ ["--agente" as string]: `var(--agente-${a.agente})` }}>
                    <Personaje agente={a.agente} avatar />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-grafito">
                      <span className="font-[600] text-tinta">{a.quien}</span> {a.texto}
                    </p>
                    {a.insignia ? (
                      <Insignia tono={a.insignia.tono} conPunto className="mt-[var(--spacing-8)]">
                        {a.insignia.texto}
                      </Insignia>
                    ) : null}
                  </div>
                  <time className="t-app-etiqueta cifras shrink-0">{a.hora}</time>
                </li>
              ))}
              <li className="flex items-center gap-[var(--spacing-12)] px-[var(--espacio-app-tarjeta)] py-[var(--spacing-12)]">
                <span className="marca-agente marca-agente--mini" style={{ ["--agente" as string]: "var(--agente-lola)" }}>
                  <Personaje agente="lola" avatar />
                </span>
                <Escribiendo quien="Lola" conTexto />
              </li>
            </ul>
          </section>

          {/* Columna derecha: uso del plan */}
          <aside aria-label={`Tu plan (ejemplo, ${tema})`} className="grid content-start gap-[var(--espacio-app-bloques)]">
            <div className="rounded-panel-app border border-borde bg-superficie p-[var(--espacio-app-tarjeta)]">
              <div className="mb-[var(--spacing-16)] flex items-center justify-between">
                <h3 className="t-app-mediano">Plan One</h3>
                <Insignia tono="azul">Activo</Insignia>
              </div>
              <BarraProgreso etiqueta="Mensajes de octubre" valor={320} max={500} unidad="mensajes" detalle="Se renueva el 1 de noviembre." />
            </div>
            <div className="rounded-panel-app border border-borde bg-superficie p-[var(--espacio-app-tarjeta)]">
              <h3 className="t-app-mediano">Próximas citas</h3>
              <ul className="mt-[var(--spacing-12)] flex flex-col">
                {[
                  ["Mariana Ruiz", "Limpieza facial", "Jue 16:30"],
                  ["Jorge Peña", "Consulta de valoración", "Vie 10:00"],
                ].map(([n, s, h]) => (
                  <li key={n} className="flex min-h-[var(--alto-app-fila)] items-center gap-[var(--spacing-12)]">
                    <Avatar nombre={n} tam={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-tinta">{n}</span>
                      <span className="t-app-etiqueta block truncate">{s}</span>
                    </span>
                    <span className="t-app-etiqueta cifras shrink-0">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <Cajon abierto={cajon} alCerrar={() => setCajon(false)} etiqueta={`Menú de Atendel (ejemplo, ${tema})`} cabeza={<LogoApp seccion="Resumen" />}>
        <NavLateral />
      </Cajon>
    </div>
  );
}

/* ---------- Insignia sobre la campana y botones de ícono ---------- */
export function DemoBotonesIcono() {
  return (
    <div className="flex flex-wrap items-center gap-[var(--spacing-8)]">
      <BotonIcono etiqueta="Avisos" icono="campana" contador={3} etiquetaContador="3 avisos sin leer" anillo="var(--c-app-fondo)" />
      <BotonIcono etiqueta="Avisos" icono="campana" punto etiquetaContador="hay avisos nuevos" anillo="var(--c-app-fondo)" />
      <BotonIcono etiqueta="Crear" icono="mas" />
      <BotonIcono etiqueta="Fijar" icono="estrella" aria-pressed />
      <BotonIcono etiqueta="Más opciones" icono="puntos" />
      <BotonIcono etiqueta="Borrar" icono="basura" disabled />
      <BotonIcono etiqueta="Abrir el menú" icono="barra-lateral" tam="normal" />
    </div>
  );
}
