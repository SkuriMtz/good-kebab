import type { Metadata } from "next";
import { Laboratorio } from "./Laboratorio";
import "./laboratorio.css";

export const metadata: Metadata = {
  title: "Laboratorio de figuras",
  robots: { index: false, follow: false },
};

/**
 * Laboratorio del fondo de figuras del inicio: muestra cada figura y cada
 * cambio (portada, decisiones, caos, foco, globo, equipo, planes y cierre),
 * con un control para avanzar de escena, una barra para recorrer la historia
 * a mano y la repetición del scroll de los dos videos de referencia.
 */
export default function PaginaLaboratorio() {
  return <Laboratorio />;
}
