import { Icono } from "@/components/base/Iconos";
import { Enlace, claseBoton } from "./Piezas";

/**
 * Arriba de la Oficina: lo que espera tu OK (mensajes listos para mandar,
 * correos por contestar, pasos por hacer), en pocas líneas y con un solo
 * botón. Así todo lo que te espera está en un solo lugar.
 */
export function PorAprobar({ total, items, href }: { total: number; items: { id: string; titulo: string; detalle?: string }[]; href: string }) {
  if (!total) {
    return (
      <p className="pc-poraprobar pc-poraprobar--vacio">
        <Icono nombre="check" tam={16} trazo={2} />
        Nada espera tu OK ahora mismo.
      </p>
    );
  }
  return (
    <section className="pc-poraprobar" aria-label="Necesita tu OK">
      <div className="pc-poraprobar__cabeza">
        <h2 className="pc-poraprobar__titulo">
          Necesita tu OK <span className="pc-poraprobar__cuenta">{total}</span>
        </h2>
        <Enlace href={href} className={claseBoton("principal", true)}>
          Ver y aprobar
        </Enlace>
      </div>
      <ul className="pc-poraprobar__lista">
        {items.slice(0, 3).map((i) => (
          <li key={i.id}>
            <span className="pc-poraprobar__item">{i.titulo}</span>
            {i.detalle ? <span className="pc-poraprobar__detalle">{i.detalle}</span> : null}
          </li>
        ))}
        {total > 3 ? <li className="pc-poraprobar__mas">y {total - 3} más</li> : null}
      </ul>
    </section>
  );
}
