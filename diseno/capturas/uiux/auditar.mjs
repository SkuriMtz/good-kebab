// Uso: PUERTO=3401 node diseno/capturas/uiux/auditar.mjs <salida.json>  (con el sitio corriendo)
// Auditoría automática: títulos, landmarks, nombres accesibles, zonas de toque, campos y contraste.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const exe = fs.readdirSync('/opt/pw-browsers').filter(d=>d.startsWith('chromium-')).map(d=>`/opt/pw-browsers/${d}/chrome-linux/chrome`).find(p=>fs.existsSync(p));
const salida = process.argv[2] || 'auditoria.json';
const rutas = [['inicio','/'],['agentes','/agentes'],['precios','/precios'],['preguntas','/preguntas'],['para-quien-es','/para-quien-es'],['lista','/lista'],['contacto','/contacto'],['entrar','/entrar'],['404','/no-existe'],['agente-lola','/agentes/lola']];
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const informe = [];
for (const [ancho, alto] of [[1440,900],[390,844]]) for (const tema of ['oscuro','claro']) {
  const ctx = await browser.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, reducedMotion: 'reduce', isMobile: ancho < 500, hasTouch: ancho < 500 });
  await ctx.addInitScript((t) => { try { if (t==='claro') localStorage.setItem('atendel-tema-v5','claro'); } catch {} }, tema);
  const page = await ctx.newPage();
  for (const [nombre, ruta] of rutas) {
    const r0 = await page.goto(`http://localhost:${process.env.PUERTO || 3401}${ruta}`, { waitUntil: 'networkidle' }).catch(()=>null);
    await page.waitForTimeout(1500);
    await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y=0; y<h; y+=400) { window.scrollTo(0,y); await new Promise(r=>setTimeout(r,60)); } window.scrollTo(0,0); });
    await page.waitForTimeout(800);
    const r = await page.evaluate(({ancho}) => {
      const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0],p[1],p[2],p.length>3?p[3]:1]; };
      const lum = ([r,g,b]) => { const f = (v)=>{v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4);}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
      const mezcla = (a, b) => { const al = a[3]; return [a[0]*al+b[0]*(1-al), a[1]*al+b[1]*(1-al), a[2]*al+b[2]*(1-al), 1]; };
      const raiz = parse(getComputedStyle(document.body).backgroundColor) || [0,0,0,1];
      const fondoDe = (el) => {
        const capas = []; let e = el; let imagen = false;
        while (e && e.nodeType===1) { const cs = getComputedStyle(e); if (cs.backgroundImage && cs.backgroundImage!=='none' && /gradient|url/.test(cs.backgroundImage) && e!==document.body && e!==document.documentElement) imagen = true; const c = parse(cs.backgroundColor); if (c && c[3]>0) { capas.push(c); if (c[3]>=1) break; } e = e.parentElement; }
        let base = (capas.length && capas[capas.length-1][3]>=1) ? capas.pop() : (raiz[3]>=1 ? raiz : [0,0,0,1]);
        for (let i = capas.length-1; i>=0; i--) base = mezcla(capas[i], base);
        return { fondo: base, imagen };
      };
      const opacidad = (el) => { let o = 1, e = el; while (e && e.nodeType===1) { o *= parseFloat(getComputedStyle(e).opacity); e = e.parentElement; } return o; };
      const visible = (el) => { const b = el.getBoundingClientRect(); if (b.width<1||b.height<1) return false; const cs = getComputedStyle(el); if (cs.visibility==='hidden'||cs.display==='none') return false; if (el.closest('.sr-only, [hidden], dialog:not([open])')) return false; return true; };
      // Títulos
      const titulos = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(h => !h.closest('dialog:not([open])')).map(h => `${h.tagName}${h.closest('.sr-only')||h.classList.contains('sr-only')?'(sr)':''} ${h.textContent.trim().replace(/\s+/g,' ').slice(0,60)}`);
      const saltos = []; let prev = 0; for (const h of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) { if (h.closest('dialog:not([open])')) continue; const n = +h.tagName[1]; if (prev && n > prev+1) saltos.push(`${'h'+prev}→${h.tagName} "${h.textContent.trim().slice(0,40)}"`); prev = n; }
      const landmarks = { header: document.querySelectorAll('header.cabecera, [role=banner]').length, main: document.querySelectorAll('main').length, nav: document.querySelectorAll('nav').length, footer: document.querySelectorAll('footer').length, saltar: !!document.querySelector('a.saltar[href="#contenido"]') };
      // Nombres accesibles
      const sinNombre = [];
      for (const el of document.querySelectorAll('a[href], button, [role=button], [role=tab], [role=radio], input:not([type=hidden]), textarea, select')) {
        if (!visible(el) && !(el.matches('input,textarea'))) continue;
        if (el.closest('[aria-hidden="true"]')) continue;
        const nombre = (el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') ? el.getAttribute('aria-labelledby').split(' ').map(i=>document.getElementById(i)?.textContent||'').join(' ') : '') || (el.labels && el.labels[0]?.textContent) || el.textContent || el.getAttribute('title') || '').trim();
        if (!nombre) sinNombre.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0,40)}`);
      }
      const imgs = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).map(i => i.src.slice(-40));
      const svgs = [...document.querySelectorAll('svg')].filter(s => !s.closest('[aria-hidden="true"]') && !s.getAttribute('aria-hidden') && !s.getAttribute('role') && !s.getAttribute('aria-label') && visible(s)).map(s => `${s.parentElement?.tagName.toLowerCase()}.${String(s.parentElement?.className).slice(0,40)}`);
      // Zonas de toque (solo celular): lo interactivo visible que mide menos de 44px (o 24px)
      const chicos = [];
      if (ancho < 500) for (const el of document.querySelectorAll('a[href], button, [role=tab], [role=radio], summary, input:not([type=hidden]):not([tabindex="-1"])')) {
        if (!visible(el) || el.closest('[aria-hidden="true"], .hoja-nav[data-abierta="false"], .desplegable')) continue;
        const b = el.getBoundingClientRect();
        // capa ::after que agranda el área
        const af = getComputedStyle(el, '::after'); let extra = 0; if (af.content && af.content!=='none' && af.position==='absolute') { const t = parseFloat(af.top)||0, bo = parseFloat(af.bottom)||0; extra = Math.max(0, -t) + Math.max(0, -bo); if (af.height && af.height!=='auto') extra = Math.max(extra, parseFloat(af.height) - b.height); }
        const altoEf = b.height + extra;
        const enLinea = getComputedStyle(el).display==='inline' && el.closest('p, li') && el.closest('p,li').textContent.trim().length > el.textContent.trim().length + 3;
        if (altoEf < 44 || b.width < 24) chicos.push({ el: `${el.tagName.toLowerCase()}.${String(el.className).slice(0,36)} "${(el.getAttribute('aria-label')||el.textContent).trim().slice(0,26)}"`, alto: Math.round(altoEf), ancho: Math.round(b.width), enLinea: !!enLinea });
      }
      // Campos: letra de 16px o más
      const campos = [...document.querySelectorAll('input:not([type=hidden]):not([tabindex="-1"]), textarea')].filter(visible).map(i => ({ campo: i.name || i.id, tam: parseFloat(getComputedStyle(i).fontSize), autocomplete: i.getAttribute('autocomplete'), inputmode: i.getAttribute('inputmode'), etiqueta: !!(i.labels && i.labels.length), type: i.type }));
      // Contraste del texto visible
      const fallas = []; let medidos = 0; const vistos = new Set();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const t = walker.currentNode; if (!t.textContent.trim()) continue;
        const el = t.parentElement; if (!el || vistos.has(el)) continue; vistos.add(el);
        if (!visible(el) || el.closest('canvas, svg, .formulario-lista__trampa, script, style, noscript')) continue;
        const op = opacidad(el); if (op < 0.15) continue;
        const cs = getComputedStyle(el);
        const c = parse(cs.color); if (!c) continue;
        let { fondo, imagen } = fondoDe(el); const tab = el.closest('.pestanas__pestana[aria-selected="true"]'); if (tab) { const ind = tab.parentElement.querySelector('.pestanas__indicador'); const c2 = ind && parse(getComputedStyle(ind).backgroundColor); if (c2 && c2[3] > 0) fondo = mezcla(c2, fondo); }
        const color = mezcla([c[0],c[1],c[2],c[3]*op], fondo);
        const L1 = lum(color), L2 = lum(fondo);
        const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
        const tam = parseFloat(cs.fontSize), peso = parseInt(cs.fontWeight);
        const grande = tam >= 24 || (tam >= 18.66 && peso >= 700);
        const min = grande ? 3 : 4.5; medidos++;
        const deshab = el.closest('[disabled], [aria-disabled="true"]');
        if (ratio < min && !deshab) fallas.push({ texto: t.textContent.trim().replace(/\s+/g,' ').slice(0,40), el: `${el.tagName.toLowerCase()}.${String(el.className).slice(0,40)}`, ratio: +ratio.toFixed(2), min, tam, color: cs.color, fondo: `rgb(${fondo.slice(0,3).map(Math.round).join(',')})`, imagen, op: +op.toFixed(2) });
      }
      const largas = []; for (const p of document.querySelectorAll('main p')) { if (!visible(p) || p.closest('.chat, .marco, dialog') || p.children.length > 6) continue; const txt = p.textContent.trim(); if (txt.length < 90) continue; const cs = getComputedStyle(p); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize)*1.5; const lineas = Math.max(1, Math.round(p.getBoundingClientRect().height / lh)); if (lineas < 2) continue; const cpl = Math.round(txt.length / lineas); if (cpl > 75) largas.push(`${p.className.slice(0,30)} ~${cpl}c "${txt.slice(0,30)}"`); }
      return { largas, titulo: document.title, descripcion: document.querySelector('meta[name=description]')?.content || null, og: !!document.querySelector('meta[property="og:title"]'), h1: document.querySelectorAll('h1').length, titulos, saltos, landmarks, sinNombre, imgs, svgs: svgs.slice(0,8), chicos, campos, contraste: { medidos, fallas } };
    }, { ancho });
    informe.push({ nombre, ancho, tema, status: r0?.status(), ...r });
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(salida, JSON.stringify(informe, null, 1));
// Resumen
for (const i of informe) {
  console.log(`\n== ${i.nombre} ${i.ancho} ${i.tema} [${i.status}] h1=${i.h1} title="${i.titulo}" desc=${i.descripcion?'sí':'NO'} og=${i.og?'sí':'no'}`);
  if (i.saltos.length) console.log('  saltos títulos:', i.saltos.join(' | '));
  if (!i.landmarks.saltar || i.landmarks.main!==1 || !i.landmarks.footer) console.log('  landmarks:', JSON.stringify(i.landmarks));
  if (i.sinNombre.length) console.log('  sin nombre:', i.sinNombre.slice(0,6).join(', '));
  if (i.imgs.length) console.log('  img sin alt:', i.imgs.join(', '));
  if (i.svgs.length) console.log('  svg sin aria-hidden:', i.svgs.join(', '));
  if (i.chicos.length) console.log('  toque<44:', i.chicos.filter(c=>!c.enLinea).slice(0,12).map(c=>`${c.el}(${c.ancho}x${c.alto})`).join(' ; '), '| en línea:', i.chicos.filter(c=>c.enLinea).length);
  const malos = i.campos.filter(c => c.tam < 16 || !c.etiqueta); if (malos.length) console.log('  campos:', JSON.stringify(malos));
  if (i.largas.length) console.log('  líneas >75c:', i.largas.slice(0,6).join(' ; '));
  console.log(`  contraste: ${i.contraste.medidos} medidos, ${i.contraste.fallas.length} fallas`);
  for (const f of i.contraste.fallas.slice(0,10)) console.log(`    ${f.ratio}<${f.min} ${f.el} "${f.texto}" ${f.color} sobre ${f.fondo}${f.imagen?' (img)':''} op=${f.op}`);
}
