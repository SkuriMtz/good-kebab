g=open("generar.py").read()
exec(g.split("open(\"a-fragmentos.svg\"")[0])
exec("def variantes"+g.split("def variantes")[1].split("html = f")[0])
C = [CORAL, AZUL, VERDE, AMARILLO]
def svg(c): return f'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">{c}</svg>'
def cuadricula(t):  # 2x2, separados
    pos=[(28,28),(72,28),(28,72),(72,72)]
    return svg("".join(f'<circle cx="{x}" cy="{y}" r="19" fill="{c}"/>' for (x,y),c in zip(pos,C)))
def trebol(t):  # encimados, con mezcla
    pos=[(50,30),(30,50),(70,50),(50,70)]
    return svg("".join(f'<circle cx="{x}" cy="{y}" r="21" fill="{c}" style="mix-blend-mode:multiply"/>' for (x,y),c in zip(pos,C)))
def equipo_a(t):  # 3 en fila y uno arriba a la derecha: el que "levanta la mano"
    pos=[(22,64,15),(50,64,15),(78,64,15),(78,30,11)]
    return svg("".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for (x,y,r),c in zip(pos,C)))
html=open("index.html").read()
cab=html.split("<main>")[0]+"<main>"
intro='<div class="intro"><h1>Los cuatro agentes, <em>en círculos.</em></h1><p>Tres maneras de juntar los cuatro colores de Lola, Clara, Víctor e Iris.</p></div>'
partes=[variantes(("1","Cuadrícula"),cuadricula(0),cuadricula(0),"Cuatro círculos ordenados, uno por agente. Muy limpio y se reconoce perfecto en chiquito."),
 variantes(("2","Trébol"),trebol(0),trebol(0).replace("multiply","screen"),"Los cuatro se enciman al centro: donde se juntan, los colores se mezclan. Dice “trabajan juntos”."),
 variantes(("3","Uno levanta la mano"),equipo_a(0),equipo_a(0),"Tres en fila y uno arriba, como alguien del equipo que dice “yo me encargo”. Tiene más personalidad.")]
open("circulos.html","w").write(cab+intro+"".join(partes)+"</main></body></html>")
