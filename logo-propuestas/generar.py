import math, random

CORAL, AZUL, VERDE, AMARILLO = "#ff8a6b", "#7fb2ff", "#5fd09f", "#f6c64a"

def dentro_a(x, y):
    # "a" geométrica de una sola panza: anillo + asta a la derecha (caja de 0..100)
    cx, cy = 40, 61
    d = math.hypot(x - cx, y - cy)
    anillo = 13 <= d <= 29
    asta = 60 <= x <= 74 and 30 <= y <= 91
    return anillo or asta

def red_triangulos(lado=6.0):
    h = lado * math.sqrt(3) / 2
    tris = []
    fila = 0
    y = 20
    while y < 98:
        x0 = -lado if fila % 2 else -lado / 2
        x = x0
        while x < 100:
            # triángulo hacia arriba y hacia abajo
            arriba = [(x, y + h), (x + lado, y + h), (x + lado / 2, y)]
            abajo = [(x + lado / 2, y), (x + lado * 1.5, y), (x + lado, y + h)]
            for t in (arriba, abajo):
                c = (sum(p[0] for p in t) / 3, sum(p[1] for p in t) / 3)
                if dentro_a(*c):
                    tris.append((t, c))
            x += lado
        y += h
        fila += 1
    return tris

def encoger(t, c, f):
    return [(c[0] + (p[0] - c[0]) * f, c[1] + (p[1] - c[1]) * f) for p in t]

def path(t):
    return "M" + " L".join(f"{p[0]:.2f} {p[1]:.2f}" for p in t) + " Z"

def girar(t, c, ang, dx=0, dy=0):
    s, co = math.sin(ang), math.cos(ang)
    return [(c[0] + (p[0]-c[0])*co - (p[1]-c[1])*s + dx, c[1] + (p[0]-c[0])*s + (p[1]-c[1])*co + dy) for p in t]

tris = red_triangulos()
# El triángulo de color: el de más arriba a la derecha del asta
acento = max(range(len(tris)), key=lambda i: tris[i][1][0] * 0.4 - tris[i][1][1])

def logo_a(color_tinta, fragmentos=False):
    partes = []
    rnd = random.Random(7)
    for i, (t, c) in enumerate(tris):
        tt = encoger(t, c, 0.8)
        fill = CORAL if i == acento else color_tinta
        op = 1
        if fragmentos and c[0] > 64 and rnd.random() < 0.55:
            # Los del borde derecho se desprenden, como en la portada
            k = (c[0] - 64) / 10
            tt = girar(tt, c, rnd.uniform(-0.9, 0.9), dx=8 + k * 12 * rnd.random(), dy=-k * 8 * rnd.random())
            op = round(max(0.25, 1 - k * 0.6), 2)
        partes.append(f'<path d="{path(tt)}" fill="{fill}" opacity="{op}"/>')
    return f'<svg viewBox="8 14 {104 if fragmentos else 84} 84" xmlns="http://www.w3.org/2000/svg">{"".join(partes)}</svg>'

def logo_equipo(color_tinta):
    # Un triángulo hecho de cuatro: tres agentes en las esquinas, el cuarto en medio
    A, B, C = (50, 10), (8, 84), (92, 84)
    m = lambda p, q: ((p[0]+q[0])/2, (p[1]+q[1])/2)
    ab, bc, ca = m(A, B), m(B, C), m(C, A)
    piezas = [([A, ab, ca], CORAL), ([ab, B, bc], AZUL), ([ca, bc, C], VERDE), ([ab, bc, ca], AMARILLO)]
    out = []
    for t, col in piezas:
        c = (sum(p[0] for p in t)/3, sum(p[1] for p in t)/3)
        out.append(f'<path d="{path(encoger(t, c, 0.86))}" fill="{col}" stroke="{col}" stroke-width="3" stroke-linejoin="round"/>')
    return f'<svg viewBox="0 0 100 94" xmlns="http://www.w3.org/2000/svg">{"".join(out)}</svg>'

open("a-fragmentos.svg", "w").write(logo_a("#0a0a0b"))
open("a-fragmentos-blanco.svg", "w").write(logo_a("#ffffff"))
open("a-desprendiendose.svg", "w").write(logo_a("#0a0a0b", True))
open("equipo.svg", "w").write(logo_equipo("#0a0a0b"))

def variantes(nombre, svg_claro, svg_oscuro, nota):
    return f'''
<section class="propuesta">
  <header><span class="num">{nombre[0]}</span><div><h2>{nombre[1]}</h2><p>{nota}</p></div></header>
  <div class="grande">
    <div class="caja claro">{svg_claro}</div>
    <div class="caja oscuro">{svg_oscuro}</div>
  </div>
  <div class="usos">
    <div class="uso"><div class="firma claro"><span class="marca">{svg_claro}</span><span class="palabra">atendel</span></div><small>Con el nombre (barra del sitio)</small></div>
    <div class="uso"><div class="firma oscuro"><span class="marca">{svg_oscuro}</span><span class="palabra">atendel</span></div><small>Con el nombre, modo oscuro</small></div>
    <div class="uso"><div class="iconos">
      <span class="app claro" style="width:72px;height:72px;padding:12px">{svg_claro}</span>
      <span class="app oscuro" style="width:48px;height:48px;padding:8px">{svg_oscuro}</span>
      <span class="app claro" style="width:32px;height:32px;padding:5px">{svg_claro}</span>
      <span class="app oscuro" style="width:16px;height:16px;border-radius:4px;padding:1px">{svg_oscuro}</span>
    </div><small>Ícono: app, perfil de WhatsApp, pestaña (16 px)</small></div>
  </div>
</section>'''

html = f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Atendel · propuestas de logo</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {{ --tinta:#0a0a0b; --gris:#71717a; --suave:#f4f4f5; }}
  * {{ box-sizing:border-box; margin:0 }}
  body {{ font-family:"Space Grotesk",system-ui,sans-serif; background:#fff; color:var(--tinta); padding:56px 20px 80px; }}
  main {{ max-width:1080px; margin:0 auto; display:flex; flex-direction:column; gap:88px }}
  h1 {{ font-size:clamp(2rem,4vw,3rem); font-weight:600; letter-spacing:-.045em; line-height:1.05 }}
  h1 em {{ font-family:Georgia,serif; font-weight:400; color:var(--gris) }}
  .intro p {{ margin-top:14px; color:var(--gris); max-width:560px; line-height:1.6 }}
  .propuesta header {{ display:flex; gap:14px; align-items:flex-start }}
  .num {{ display:inline-grid; place-items:center; min-width:34px; height:24px; border-radius:99px; background:var(--suave); font-size:.8125rem; font-weight:500; margin-top:4px }}
  h2 {{ font-size:1.5rem; font-weight:600; letter-spacing:-.035em }}
  header p {{ color:var(--gris); margin-top:4px; line-height:1.55; max-width:620px }}
  .grande {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:24px }}
  .caja {{ aspect-ratio:4/3; border-radius:28px; display:grid; place-items:center }}
  .caja svg {{ width:42%; height:auto }}
  .claro {{ background:var(--suave) }}
  .oscuro {{ background:#111113 }}
  .usos {{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:12px }}
  .uso small {{ display:block; margin-top:8px; color:var(--gris); font-size:.8125rem }}
  .firma {{ height:96px; border-radius:22px; display:flex; align-items:center; justify-content:center; gap:10px }}
  .firma .marca svg {{ height:34px; width:auto; display:block }}
  .palabra {{ font-weight:600; font-size:1.9rem; letter-spacing:-.06em; line-height:1 }}
  .oscuro .palabra {{ color:#fff }}
  .iconos {{ height:96px; border-radius:22px; display:flex; align-items:center; justify-content:center; gap:14px; border:1px solid #e4e4e7 }}
  .app {{ border-radius:22%; display:grid; place-items:center; flex:none }}
  .app svg {{ width:100%; height:100%; display:block }}
  @media (max-width:720px) {{ .grande,.usos {{ grid-template-columns:1fr }} }}
</style></head><body><main>
<div class="intro"><h1>Propuestas de logo <em>para Atendel.</em></h1>
<p>Tres ideas en blanco y negro con el color de los personajes. Cada una se ve en grande, junto al nombre y como ícono chiquito (hasta 16 px, el tamaño de una pestaña del navegador).</p></div>
{variantes(("1","La “a” de fragmentos (recomendada)"), logo_a("#0a0a0b"), logo_a("#ffffff"), "Una “a” armada con triangulitos, como la palabra de la portada. Un triángulo va en coral: el agente que se suma al equipo. Se reconoce aun muy pequeña y se puede animar armándose en la página.")}
{variantes(("2","La “a” que se desprende"), logo_a("#0a0a0b", True), logo_a("#ffffff", True), "La misma “a”, pero con fragmentos que salen volando del lado derecho, como cuando bajas en la portada. Tiene más movimiento; en tamaño chico se ve menos limpia.")}
{variantes(("3","El equipo de cuatro"), logo_equipo("#0a0a0b"), logo_equipo("#ffffff"), "Un triángulo hecho de cuatro piezas, una por agente y con sus colores: cuatro agentes, un solo equipo. Es el más colorido y el más fácil de recordar, pero no dice “a” de Atendel.")}
</main></body></html>'''
open("index.html", "w").write(html)
print(len(tris), "triángulos")
