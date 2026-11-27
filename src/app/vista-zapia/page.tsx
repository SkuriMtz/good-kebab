import { redirect } from "next/navigation";

/** La vista previa de la landing combinada ya es el inicio oficial: este enlace lleva a «/». */
export default function VistaCombinada() {
  redirect("/");
}
