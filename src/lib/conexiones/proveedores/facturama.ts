import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, argTexto, consulta, esquema, herramienta, linea, pedirJson, unir } from "./_comun-1";
import { argDia, basic3, dinero, fecha3, llaveRechazada, partirLlave } from "./_comun-3";

/**
 * FACTURAMA (por llave; facturama.mx/docs, nov 2026). SOLO LECTURA: nunca
 * timbra, cancela ni envía facturas.
 * - La persona pega "usuario:contraseña" de su cuenta de la API de
 *   Facturama (los mismos con los que entra al portal).
 * - HTTP Basic. Producción https://api.facturama.mx; si la cuenta es de
 *   pruebas, https://apisandbox.facturama.mx.
 * - Valida con GET /TaxEntity (RFC y razón social del emisor).
 * - Lee: GET /cfdi?type=issued (API Web; 10 por página, page desde 0,
 *   filtros status, rfc y taxEntityName parciales, dateStart/dateEnd
 *   aaaa-mm-ddThh:mm:ss). Si la cuenta es multiemisor, type=issuedLite.
 *   GET /Client?keyword= y GET /clients para los clientes.
 * - No hay API para revocar: se cambia la contraseña en Facturama.
 */

const NOMBRE = "Facturama";
const HOST = { produccion: "https://api.facturama.mx", sandbox: "https://apisandbox.facturama.mx" } as const;
type Ambiente = keyof typeof HOST;
const FORMATO = "usuario:contraseña (los de tu cuenta de Facturama, separados por dos puntos)";
/** RFC completo o una parte (Facturama busca por coincidencia parcial). */
const FORMA_RFC = /^[A-ZÑ&0-9]{2,13}$/;

const ambienteDe = (t: Tokens): Ambiente => (t.extra?.ambiente === "sandbox" ? "sandbox" : "produccion");

function api<T>(ambiente: Ambiente, credencial: string, ruta: string, params: Record<string, string | number | undefined>, senal?: AbortSignal) {
  const [usuario, clave] = partirLlave(credencial, NOMBRE, FORMATO);
  return pedirJson<T>(NOMBRE, `${HOST[ambiente]}${ruta}${consulta(params)}`, {
    encabezados: { Authorization: basic3(usuario, clave), Accept: "application/json" },
    senal,
    interpretar: (estado) => (estado === 401 ? "Facturama ya no acepta tu usuario y contraseña. Vuelve a pegarlos en Tu negocio › Apps." : undefined),
  });
}

type Cfdi = {
  Id?: string;
  CfdiType?: string;
  Type?: string;
  Serie?: string;
  Folio?: string;
  Date?: string;
  Subtotal?: number;
  Total?: number;
  Currency?: string;
  Status?: string;
  Rfc?: string;
  TaxName?: string;
  TaxEntityName?: string;
  Uuid?: string;
  Email?: string;
  PaymentMethod?: string;
  OrderNumber?: string;
};
type ClienteFm = { Id?: string; Rfc?: string; Name?: string; Email?: string; CfdiUse?: string; FiscalRegime?: string; TaxZipCode?: string };

const ESTADO: Record<string, string> = { active: "vigente", canceled: "cancelada", cancelled: "cancelada", pending: "pendiente" };
const TIPO: Record<string, string> = { I: "ingreso", E: "egreso", P: "pago", T: "traslado", N: "nómina" };

const lista = <T>(r: unknown): T[] => (Array.isArray(r) ? (r as T[]) : []);

export const adaptador: Adaptador = {
  proveedor: "facturama",
  autenticacion: "llave",
  variables: [],

  async validarLlave(llave) {
    const [usuario, clave] = partirLlave(llave, NOMBRE, FORMATO);
    if (usuario.length > 120 || clave.length > 200) throw new ErrorProveedor(`Pega ${FORMATO}.`);
    const credencial = `${usuario}:${clave}`;
    for (const ambiente of ["produccion", "sandbox"] as const) {
      try {
        const e = await api<{ Rfc?: string; TaxName?: string; ComercialName?: string }>(ambiente, credencial, "/TaxEntity", {});
        const extra: Record<string, string> = { ambiente };
        if (e.Rfc) extra.rfc = linea(e.Rfc, 13);
        if (e.ComercialName || e.TaxName) extra.nombre = linea(e.ComercialName || e.TaxName, 120);
        return { access_token: credencial, extra };
      } catch (e) {
        // 401 en producción: puede ser una cuenta de pruebas (dev.facturama.mx)
        if (!(e instanceof ErrorProveedor) || e.status !== 401) throw e;
      }
    }
    throw llaveRechazada(NOMBRE, "el usuario y la contraseña de tu cuenta, separados por dos puntos");
  },

  async cuenta(t) {
    return unir(t.extra?.nombre || "Facturama", t.extra?.rfc, ambienteDe(t) === "sandbox" ? "pruebas (Sandbox)" : "") || "Cuenta de Facturama";
  },

  herramientas: [
    herramienta({
      nombre: "facturama_facturas",
      descripcion:
        "Lista las facturas (CFDI) emitidas en Facturama, de la más nueva a la más vieja: fecha, serie y folio, cliente (razón social y RFC), total, estado y UUID. Se puede buscar por RFC o nombre del cliente, por estado y por fechas. Solo lectura: no timbra ni cancela.",
      app: "facturama",
      agentes: ["iris", "victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        rfc: { type: "string", description: "RFC del cliente (completo o una parte)." },
        cliente: { type: "string", description: "Nombre o razón social del cliente (completo o una parte)." },
        estado: { type: "string", enum: ["all", "active", "canceled"], description: "all = todas (por defecto), active = vigentes, canceled = canceladas." },
        desde: { type: "string", description: "Fecha inicial AAAA-MM-DD." },
        hasta: { type: "string", description: "Fecha final AAAA-MM-DD." },
        pagina: { type: "integer", minimum: 0, maximum: 50, description: "Página de 10 facturas, desde 0. Por defecto 0 (las más recientes)." },
      }),
      async ejecutar(args, ctx) {
        const rfc = argTexto(args, "rfc", 13).toUpperCase();
        if (rfc && !FORMA_RFC.test(rfc)) throw new ErrorProveedor('"rfc" solo lleva letras y números (hasta 13).');
        const cliente = argTexto(args, "cliente", 120);
        const estado = argTexto(args, "estado", 10) || "all";
        if (!["all", "active", "canceled"].includes(estado)) throw new ErrorProveedor('"estado" puede ser all, active o canceled.');
        const desde = argDia(args, "desde");
        const hasta = argDia(args, "hasta");
        const pagina = argEntero(args, "pagina", 0, 0, 50);
        const t = await ctx.token();
        const params = {
          page: pagina,
          status: estado,
          rfc: rfc || undefined,
          taxEntityName: cliente || undefined,
          dateStart: desde ? `${desde}T00:00:00` : undefined,
          dateEnd: hasta ? `${hasta}T23:59:59` : undefined,
        };
        let cfdis = lista<Cfdi>(await api(ambienteDe(t), t.access_token, "/cfdi", { type: "issued", ...params }, ctx.senal));
        // Las cuentas multiemisor (API Lite) guardan sus facturas aparte
        if (!cfdis.length) cfdis = lista<Cfdi>(await api(ambienteDe(t), t.access_token, "/cfdi", { type: "issuedLite", ...params }, ctx.senal).catch(() => []));
        if (!cfdis.length) return rfc || cliente || desde || hasta ? "No encontré facturas en Facturama con esos datos." : pagina ? "No hay más facturas." : "No hay facturas emitidas en Facturama.";
        cfdis.sort((a, b) => String(b.Date ?? "").localeCompare(String(a.Date ?? "")));
        return [
          `Facturas emitidas en Facturama${rfc ? ` con RFC ${rfc}` : ""}${cliente ? ` de "${linea(cliente, 60)}"` : ""} (página ${pagina}, ${cfdis.length}${cfdis.length >= 10 ? "; pide la siguiente página para ver más" : ""}):`,
          ...cfdis.map(
            (c) =>
              `- ${unir(
                fecha3(c.Date),
                [c.Serie, c.Folio].filter(Boolean).join("-") ? `folio ${linea([c.Serie, c.Folio].filter(Boolean).join("-"), 30)}` : "",
                TIPO[c.CfdiType ?? ""] ?? "",
                linea(c.TaxName || c.TaxEntityName, 80),
                linea(c.Rfc, 13),
                dinero(c.Total, c.Currency),
                c.Status ? ESTADO[c.Status.toLowerCase()] ?? linea(c.Status, 20) : "",
                c.PaymentMethod ? linea(c.PaymentMethod, 3) : "",
                c.Uuid ? `UUID ${linea(c.Uuid, 36)}` : "",
                c.Id ? `id ${linea(c.Id, 40)}` : "",
              )}`,
          ),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "facturama_clientes",
      descripcion: "Busca clientes (receptores) guardados en Facturama: razón social, RFC, correo, uso de CFDI, régimen fiscal y código postal. Solo lectura.",
      app: "facturama",
      agentes: ["iris", "victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Nombre, RFC o correo del cliente. Vacío: los primeros clientes." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos clientes. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const buscar = argTexto(args, "buscar", 120);
        const limite = argEntero(args, "limite", 20, 1, 50);
        const t = await ctx.token();
        const r = buscar
          ? await api<unknown>(ambienteDe(t), t.access_token, "/Client", { keyword: buscar }, ctx.senal)
          : await api<unknown>(ambienteDe(t), t.access_token, "/clients", { start: 0, length: limite }, ctx.senal);
        const clientes = lista<ClienteFm>(r).slice(0, limite);
        if (!clientes.length) return buscar ? `No encontré clientes en Facturama con "${linea(buscar, 60)}".` : "No hay clientes guardados en Facturama.";
        return [
          `Clientes de Facturama${buscar ? ` con "${linea(buscar, 60)}"` : ""} (${clientes.length}):`,
          ...clientes.map(
            (c) =>
              `- ${unir(
                linea(c.Name, 100) || "Sin nombre",
                linea(c.Rfc, 13),
                linea(c.Email, 80),
                c.CfdiUse ? `uso ${linea(c.CfdiUse, 5)}` : "",
                c.FiscalRegime ? `régimen ${linea(c.FiscalRegime, 5)}` : "",
                c.TaxZipCode ? `CP ${linea(c.TaxZipCode, 5)}` : "",
              )}`,
          ),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as facturama };
