import Link from "next/link";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import type { Plan } from "@/lib/planes";

/**
 * Cuántos mensajes llevas este mes, con la barra de progreso de la base
 * (ámbar desde el 80%, roja al tope; el color nunca va solo: lo dice el texto).
 * La usan "Tu equipo" y la lista del chat (`compacto`). El plan no se cambia
 * aquí: si no es Max, solo hay un enlace para ver qué incluye cada plan.
 */
export function Uso({
  usados,
  plan,
  compacto = false,
  mes,
  detalle,
  conEnlace = true,
}: {
  usados: number;
  plan: Plan;
  compacto?: boolean;
  /** "octubre": la etiqueta dice "Mensajes de octubre". */
  mes?: string;
  /** Una línea debajo (ej. "Se renueva el 1 de noviembre."). */
  detalle?: string;
  /** El enlace "Ver planes" (si ya hay otro cerca, se quita). */
  conEnlace?: boolean;
}) {
  const restan = Math.max(0, plan.mensajesMes - usados);
  const linea = restan === 0 ? "Llegaste a los mensajes de este mes." : `Te quedan ${restan.toLocaleString("es-MX")}.${detalle ? ` ${detalle}` : ""}`;
  return (
    <div className={`dash-uso__cuerpo${compacto ? " dash-uso__cuerpo--compacto" : ""}`}>
      <BarraProgreso
        etiqueta={mes ? `Mensajes de ${mes}` : "Mensajes este mes"}
        valor={usados}
        max={plan.mensajesMes}
        unidad="mensajes"
        detalle={compacto ? undefined : linea}
      />
      {plan.id !== "max" && conEnlace ? (
        <Link href="/precios" className="dash-cabeza__enlace dash-uso__enlace">
          Ver planes
        </Link>
      ) : null}
    </div>
  );
}
