import { describe, expect, it } from "vitest";
import { appsDeScopesGoogle, enlaceDarPermiso, puedeEscribir, scopesParaConectar, tieneEscritura } from "../src/lib/conexiones/permisos-google";

const G = "https://www.googleapis.com/auth/";

describe("permisos de Google por partes", () => {
  it("al conectar solo pide leer (y el correo de la cuenta)", () => {
    const s = scopesParaConectar(["gmail", "google_calendar", "google_tasks"]);
    expect(s).toEqual(expect.arrayContaining(["openid", "email", `${G}gmail.readonly`, `${G}calendar.events.readonly`, `${G}tasks.readonly`]));
    expect(s).not.toContain(`${G}gmail.send`);
    expect(s).not.toContain(`${G}calendar.events`);
    expect(s).not.toContain(`${G}tasks`);
    expect(s).not.toContain(`${G}calendar.readonly`);
  });

  it("con «Dar permiso» pide además escribir, solo en esa app", () => {
    const s = scopesParaConectar(["gmail", "google_calendar"], ["gmail"]);
    expect(s).toContain(`${G}gmail.send`);
    expect(s).not.toContain(`${G}calendar.events`);
  });

  it("no repite permisos ni pide de apps que no son de Google", () => {
    const s = scopesParaConectar(["gmail", "gmail", "outlook"]);
    expect(new Set(s).size).toBe(s.length);
    expect(s.every((x) => x === "openid" || x === "email" || x.startsWith(G))).toBe(true);
  });

  it("Forms pide las respuestas y los títulos de las preguntas", () => {
    expect(scopesParaConectar(["google_forms"])).toEqual(expect.arrayContaining([`${G}forms.responses.readonly`, `${G}forms.body.readonly`]));
  });

  it("reconoce las apps conectadas, también con los permisos de antes", () => {
    expect(appsDeScopesGoogle([`${G}gmail.readonly`, `${G}calendar.events.readonly`])).toEqual(["gmail", "google_calendar"]);
    // Quien conectó antes: calendar.readonly + calendar.events y tasks completo
    expect(appsDeScopesGoogle([`${G}calendar.readonly`, `${G}calendar.events`, `${G}tasks`]).sort()).toEqual(["google_calendar", "google_tasks"]);
    // Solo el permiso de escribir también cuenta como calendario conectado
    expect(appsDeScopesGoogle([`${G}calendar.events`])).toEqual(["google_calendar"]);
    expect(appsDeScopesGoogle(["openid", "email"])).toEqual([]);
  });

  it("sabe si ya dio permiso de hacer cosas", () => {
    expect(puedeEscribir("gmail", [`${G}gmail.readonly`])).toBe(false);
    expect(puedeEscribir("gmail", [`${G}gmail.readonly`, `${G}gmail.send`])).toBe(true);
    expect(puedeEscribir("gmail", ["https://mail.google.com/"])).toBe(true);
    expect(puedeEscribir("google_calendar", [`${G}calendar.events.readonly`])).toBe(false);
    expect(puedeEscribir("google_calendar", [`${G}calendar`])).toBe(true);
    expect(puedeEscribir("google_tasks", [`${G}tasks.readonly`])).toBe(false);
    expect(puedeEscribir("google_tasks", [`${G}tasks`])).toBe(true);
    // Las apps sin permiso aparte (solo leen) siempre pueden lo suyo
    expect(puedeEscribir("google_drive", [])).toBe(true);
  });

  it("solo Gmail, Calendar y Tareas tienen permiso aparte, con su enlace", () => {
    expect(tieneEscritura("gmail")).toBe(true);
    expect(tieneEscritura("google_calendar")).toBe(true);
    expect(tieneEscritura("google_tasks")).toBe(true);
    expect(tieneEscritura("google_drive")).toBe(false);
    expect(tieneEscritura("outlook")).toBe(false);
    expect(enlaceDarPermiso("gmail")).toBe("/panel?conectar=gmail&permiso=escribir");
  });
});

describe("la dirección de Google al conectar", () => {
  it("pide solo leer, y escribir solo con «Dar permiso»", async () => {
    process.env.GOOGLE_CLIENT_ID = "prueba.apps.googleusercontent.com";
    process.env.GOOGLE_CLIENT_SECRET = "secreto-de-prueba";
    const { google } = await import("../src/lib/conexiones/proveedores/google");
    const base = { state: "s", redirectUri: "https://ejemplo.mx/api/conexiones/google/callback", apps: ["gmail", "google_calendar"] as ("gmail" | "google_calendar")[] };
    const sinPermiso = new URL(google.urlAutorizacion!(base)).searchParams;
    expect(sinPermiso.get("include_granted_scopes")).toBe("true");
    expect(sinPermiso.get("scope")!.split(" ")).not.toContain(`${G}gmail.send`);
    const conPermiso = new URL(google.urlAutorizacion!({ ...base, query: { escribir: "gmail" } })).searchParams.get("scope")!.split(" ");
    expect(conPermiso).toContain(`${G}gmail.send`);
    expect(conPermiso).not.toContain(`${G}calendar.events`);
    // Una app que no se está conectando no cuela su permiso de escribir
    const colado = new URL(google.urlAutorizacion!({ ...base, apps: ["google_drive"], query: { escribir: "gmail" } })).searchParams.get("scope")!.split(" ");
    expect(colado).not.toContain(`${G}gmail.send`);
  });
});
