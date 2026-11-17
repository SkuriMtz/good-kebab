import { describe, expect, it } from "vitest";
import { choques, compararAgenda, huella, type Evento } from "@/lib/vigilar-agenda";

const T = (h: number, m = 0) => new Date(Date.UTC(2026, 5, 10, h, m)).toISOString();
const ev = (id: string, ini: string, fin: string, o: Partial<Evento> = {}): Evento => ({ proveedor: "google", id, inicio: ini, fin, todoElDia: false, titulo: id, ocupa: true, ...o });
const foto = (id: string, ini: string, fin: string) => ({ proveedor: "google" as const, evento_id: id, inicio: ini, fin, todo_el_dia: false, titulo: id });
const DESDE = new Date(Date.UTC(2026, 5, 10, 8)).getTime();
const HASTA = { google: Date.UTC(2026, 5, 24), microsoft: Date.UTC(2026, 5, 24) };
const o = { desde: DESDE, hasta: HASTA };

describe("huella", () => {
  it("es estable y corta", () => {
    expect(huella("cita")).toBe(huella("cita"));
    expect(huella("cita").length).toBeLessThanOrEqual(8);
  });
  it("cambia con el texto", () => {
    expect(huella("cita 1")).not.toBe(huella("cita 2"));
  });
});

describe("compararAgenda", () => {
  it("detecta citas nuevas que todavía no empiezan", () => {
    const r = compararAgenda([], [ev("a", T(10), T(11)), ev("pasada", T(6), T(7))], o);
    expect(r.nuevos.map((e) => e.id)).toEqual(["a"]);
    expect(r.movidos).toEqual([]);
    expect(r.faltan).toEqual([]);
  });
  it("detecta citas movidas (cambió inicio o fin)", () => {
    const r = compararAgenda([foto("a", T(10), T(11)), foto("b", T(12), T(13))], [ev("a", T(15), T(16)), ev("b", T(12), T(13, 30))], o);
    expect(r.movidos.map((m) => m.ahora.id)).toEqual(["a", "b"]);
    expect(r.nuevos).toEqual([]);
  });
  it("una cita igual no genera aviso", () => {
    const r = compararAgenda([foto("a", T(10), T(11))], [ev("a", T(10), T(11))], o);
    expect(r).toEqual({ nuevos: [], movidos: [], faltan: [] });
  });
  it("una cita que ya pasó y cambió no avisa", () => {
    const r = compararAgenda([foto("a", T(5), T(6))], [ev("a", T(5), T(7))], o);
    expect(r.movidos).toEqual([]);
  });
  it("detecta citas canceladas (futuras y dentro de lo leído)", () => {
    const r = compararAgenda([foto("a", T(10), T(11))], [], o);
    expect(r.faltan.map((f) => f.evento_id)).toEqual(["a"]);
  });
  it("no da por canceladas las que ya pasaron ni las que quedan más allá de lo leído", () => {
    const lejana = new Date(Date.UTC(2026, 5, 30, 10)).toISOString();
    const r = compararAgenda([foto("vieja", T(5), T(6)), foto("lejos", lejana, lejana)], [], o);
    expect(r.faltan).toEqual([]);
  });
  it("distingue proveedores con el mismo id", () => {
    const r = compararAgenda([foto("a", T(10), T(11))], [ev("a", T(10), T(11), { proveedor: "microsoft" })], o);
    expect(r.nuevos).toHaveLength(1);
    expect(r.faltan).toHaveLength(1);
  });
});

describe("choques", () => {
  it("encuentra citas que se enciman", () => {
    const r = choques([ev("a", T(10), T(11)), ev("b", T(10, 30), T(11, 30))], DESDE);
    expect(r).toHaveLength(1);
    expect([r[0][0].id, r[0][1].id]).toEqual(["a", "b"]);
  });
  it("citas pegadas (una termina cuando empieza la otra) no chocan", () => {
    expect(choques([ev("a", T(10), T(11)), ev("b", T(11), T(12))], DESDE)).toEqual([]);
  });
  it("ignora las que no ocupan tiempo (libres, todo el día, rechazadas)", () => {
    expect(choques([ev("a", T(10), T(11)), ev("b", T(10), T(11), { ocupa: false })], DESDE)).toEqual([]);
  });
  it("ignora las que ya terminaron", () => {
    expect(choques([ev("a", T(5), T(7)), ev("b", T(6), T(7))], DESDE)).toEqual([]);
  });
  it("no depende del orden de entrada", () => {
    expect(choques([ev("b", T(10, 30), T(11, 30)), ev("a", T(10), T(11))], DESDE)).toHaveLength(1);
  });
  it("devuelve como mucho 20 pares", () => {
    const muchas = Array.from({ length: 30 }, (_, i) => ev(`e${i}`, T(10), T(11)));
    expect(choques(muchas, DESDE)).toHaveLength(20);
  });
});
