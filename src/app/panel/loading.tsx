import { Seccion } from "@/components/panel/Secciones";
import "@/components/panel/carga.css";

/** Mientras llega una sección del panel: el menú se queda y aquí salen renglones que respiran. */
export default function CargandoPanel() {
  return (
    <Seccion>
      <div className="pc-carga" role="status" aria-live="polite" aria-label="Cargando">
        <div className="pc-carga__renglon pc-carga__renglon--titulo" />
        <div className="pc-carga__renglon" style={{ width: "70%" }} />
        <div className="pc-carga__renglon pc-carga__renglon--fila" />
        <div className="pc-carga__renglon pc-carga__renglon--fila" />
        <div className="pc-carga__renglon pc-carga__renglon--fila" />
      </div>
    </Seccion>
  );
}
