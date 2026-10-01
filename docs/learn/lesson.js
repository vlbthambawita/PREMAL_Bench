/* Shared lesson runtime: page shell, stepper, status strip, drawers, comparison card, helpers.
   A lesson page loads lessons.js (registry), lesson.js, then calls LS.start(config). See AUTHORING.md. */
(function(){
"use strict";
const LS = window.LS = {};
const $ = id => document.getElementById(id);
LS.$ = $;

/* ---------- seeded randomness ---------- */
LS.seed = 20261001;
LS.rng = function(){ let s = LS.seed|0; s = s + 0x6D2B79F5|0; LS.seed = s; let t = Math.imul(s^s>>>15, 1|s); t = t + Math.imul(t^t>>>7, 61|t) ^ t; return ((t^t>>>14)>>>0)/4294967296; };
LS.randInt = (lo, hi) => lo + Math.floor(LS.rng()*(hi-lo+1));
LS.randBig = function(mod){ let x = 0n; const words = Math.ceil(mod.toString(2).length/32)+2; for(let i=0;i<words;i++) x = (x<<32n) | BigInt(Math.floor(LS.rng()*4294967296)); return x % mod; };
LS.tern = () => BigInt(Math.floor(LS.rng()*3)-1);
LS.smallErr = () => BigInt(Math.round((LS.rng()+LS.rng()+LS.rng()-1.5)*1.3));

/* ---------- BigInt / modular helpers ---------- */
LS.mod = (x, m) => { x %= m; return x < 0n ? x + m : x; };
LS.cmod = (x, m) => { x %= m; if(x < 0n) x += m; if(x > m/2n) x -= m; return x; };
LS.fdiv = (x, d) => { let r = x/d; if(x%d !== 0n && (x<0n) !== (d<0n)) r -= 1n; return r; };
LS.rdiv = (x, d) => LS.fdiv(x + d/2n, d);
LS.powmod = (b, e, m) => { let r = 1n; b = LS.mod(b, m); while(e > 0n){ if(e & 1n) r = r*b % m; b = b*b % m; e >>= 1n; } return r; };
LS.egcd = (a, b) => { let [x0,x1,y0,y1] = [1n,0n,0n,1n]; while(b){ const q = a/b; [a,b] = [b, a-q*b]; [x0,x1] = [x1, x0-q*x1]; [y0,y1] = [y1, y0-q*y1]; } return [a, x0, y0]; };
LS.invmod = (a, m) => { const [g,x] = LS.egcd(LS.mod(a,m), m); if(g !== 1n) throw new Error("no inverse"); return LS.mod(x, m); };
/* negacyclic polynomials (X^N = -1), arrays of BigInt */
LS.poly = {
  red: (a, m) => a.map(v => LS.cmod(v, m)),
  add: (a, b, m) => a.map((v,i) => LS.cmod(v + b[i], m)),
  sub: (a, b, m) => a.map((v,i) => LS.cmod(v - b[i], m)),
  neg: a => a.map(v => -v),
  scal: (a, c, m) => a.map(v => LS.cmod(v*c, m)),
  mul(a, b, m){ const N = a.length, c = new Array(N).fill(0n); for(let i=0;i<N;i++){ if(a[i]===0n) continue; for(let j=0;j<N;j++){ const k=i+j; if(k<N) c[k] += a[i]*b[j]; else c[k-N] -= a[i]*b[j]; } } return m ? c.map(v => LS.cmod(v, m)) : c; },
  auto(a, g){ const N = a.length, c = new Array(N).fill(0n); for(let k=0;k<N;k++){ const e = (g*k) % (2*N); if(e < N) c[e] += a[k]; else c[e-N] -= a[k]; } return c; },
  str(p){ const t=[]; p.forEach((c,i)=>{ c = BigInt(c); if(c===0n) return; const a = c<0n?-c:c, mono = i===0?"":i===1?"X":"X"+LS.sup(i); t.push((c<0n?"− ":"+ ")+(a===1n&&i?"":a)+mono); }); const r = t.join(" ")||"0"; return r.startsWith("+ ") ? r.slice(2) : r.replace(/^− /,"−"); }
};

/* ---------- formatting ---------- */
LS.f = (x, d=4) => { if(Math.abs(x) < 5e-13) x = 0; return x.toFixed(d).replace("-","−"); };
LS.sup = s => String(s).replace(/[-\d]/g, c => "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"["-0123456789".indexOf(c)]);
LS.sub = s => String(s).replace(/\d/g, c => "₀₁₂₃₄₅₆₇₈₉"[c]);
LS.fe = x => { const a = Math.abs(x); if(a < 1e-15) return "0"; const e = Math.floor(Math.log10(a)); return (a/10**e).toFixed(1)+"×10"+LS.sup(e); };
LS.big = v => String(v).replace("-","−");
LS.hex = (v, m, keep=5) => { const w = m.toString(16).length; const h = (((BigInt(v)%m)+m)%m).toString(16).padStart(w,"0"); return h.length > keep+4 ? h.slice(0,keep)+"…"+h.slice(-3) : h; };
LS.bits = v => { v = BigInt(v); if(v < 0n) v = -v; return v.toString(2).length; };

/* ---------- SVG helpers ---------- */
LS.reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = "cubic-bezier(.2,.7,.2,1)";
const mk = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(${c})"/></marker>`;
LS.MK = `<defs>${mk("ah","--ink")}${mk("ahs","--server")}${mk("ahc","--client")}${mk("ahm","--muted")}${mk("ahn","--noise")}${mk("ahw","--warn")}${mk("ahk","--ok")}</defs>`;
LS.svg = (h, inner, label, w=800) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${LS.MK}${inner}</svg>`;
LS.tile = (x,y,w,h,txt,cls,extra="",fs=15) => `<g class="${cls}"><rect class="anim ${extra}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="2"/><text class="anim mono ${extra}" x="${x+w/2}" y="${y+h/2+5}" text-anchor="middle" font-size="${fs}" fill="currentColor">${txt}</text></g>`;
LS.lock = (x,y,cls="c-client") => `<g class="${cls} lock anim"><rect x="${x}" y="${y+7}" width="14" height="11" rx="2" fill="currentColor"/><path d="M${x+3},${y+8} v-3 a4,4 0 0 1 8,0 v3" fill="none" stroke="currentColor" stroke-width="2"/></g>`;
LS.keyIcon = (x,y,cls="c-server") => `<g class="${cls}"><circle cx="${x}" cy="${y}" r="8" fill="none" stroke="currentColor" stroke-width="3"/><path d="M${x+8},${y} h20 m-6,0 v7 m-7,-7 v5" stroke="currentColor" stroke-width="3" fill="none"/></g>`;
LS.lbl = (x,y,t,o="") => `<text x="${x}" y="${y}" font-size="13" fill="currentColor" ${o}>${t}</text>`;
LS.small = (x,y,t,o="") => `<text x="${x}" y="${y}" font-size="11.5" fill="currentColor" class="c-muted" ${o}>${t}</text>`;
LS.arrow = (x1,y1,x2,y2,m="ahm",cls="c-muted",o="") => `<g class="${cls}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="2" marker-end="url(#${m})" ${o}/></g>`;
LS.A = function(sel, kf, o={}){ if(LS.reduce) return; const sc = $("scene"); if(!sc || !sc.querySelectorAll) return; sc.querySelectorAll(sel).forEach((el,i) => { if(el.animate) el.animate(kf, {duration:o.d||650, delay:(o.t||0)+i*(o.s||0), easing:o.e||ease, fill:"backwards", iterations:o.n||1}); }); };
LS.pop = (sel,t,s) => LS.A(sel,[{opacity:0,transform:"scale(.6)"},{opacity:1,transform:"scale(1)"}],{t,s:s??90});
LS.fade = (sel,t,s) => LS.A(sel,[{opacity:0},{opacity:1}],{t,s:s??80,d:500});
LS.draw = (sel,t,d) => LS.A(sel,[{strokeDashoffset:1},{strokeDashoffset:0}],{t,d:d||800,s:120});
LS.slide = (sel,dx,dy,t,s) => LS.A(sel,[{opacity:0,transform:`translate(${dx}px,${dy}px)`},{opacity:1,transform:"translate(0,0)"}],{t,s:s??90,d:750});
LS.blink = (sel,t) => LS.A(sel,[{opacity:0},{opacity:1},{opacity:.35},{opacity:1}],{t,d:1000});
LS.growX = (sel,t,s) => LS.A(sel,[{transform:"scaleX(0)",transformOrigin:"left"},{transform:"scaleX(1)",transformOrigin:"left"}],{t,s:s??200,d:900});
LS.countUp = function(id, to, t, dec=0){ const el = document.getElementById(id); if(!el) return; const fin = Number(to).toLocaleString("en-US",{maximumFractionDigits:dec}).replace("-","−"); if(LS.reduce || typeof requestAnimationFrame!=="function"){ el.textContent = fin; return; }
  const t0 = performance.now()+t; el.textContent = "0"; const tick = now => { const k = Math.min(1, Math.max(0,(now-t0)/700)); el.textContent = k<1 ? Math.round(to*k).toLocaleString("en-US").replace("-","−") : fin; if(k<1 && document.body.contains(el)) requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
/* chart helper: returns {sx, sy, path(fn,n)} for a box */
LS.plot = (X0,X1,Y0,Y1,xmin,xmax,ymin,ymax) => { const sx = v => X0+(v-xmin)/(xmax-xmin)*(X1-X0), sy = v => Y0-(v-ymin)/(ymax-ymin)*(Y0-Y1);
  return { sx, sy, path(fn, n=90){ let d=""; for(let i=0;i<=n;i++){ const v = xmin+(xmax-xmin)*i/n; const w = Math.min(ymax+(ymax-ymin), Math.max(ymin-(ymax-ymin), fn(v))); d += (i?"L":"M")+sx(v).toFixed(1)+","+sy(w).toFixed(1); } return d; } }; };

/* ---------- the shared neuron ---------- */
LS.W = [0.5, -0.25]; LS.B = 0.1;
LS.neuron = x => { const prod = [x[0]*LS.W[0], x[1]*LS.W[1]], z = prod[0]+prod[1]+LS.B; return {x, prod, dot: prod[0]+prod[1], z, relu: Math.max(0,z)}; };

/* ---------- page shell ---------- */
function shell(cfg){
  const reg = (window.LESSONS||[]), me = reg.find(l => l.id === cfg.id) || {no:"", title:cfg.title};
  const idx = reg.indexOf(me), prev = reg[idx-1], next = reg[idx+1];
  const inputs = (cfg.inputs || [{id:"x1",label:"x₁",value:1.5},{id:"x2",label:"x₂",value:2.0}]).map(i => `<label for="in-${i.id}">${i.label}<input id="in-${i.id}" type="number" step="${i.step||0.1}" value="${i.value}"></label>`).join("");
  const st = cfg.status || {};
  $("app").innerHTML = `<div class="wrap">
  <header>
    <div class="top"><span><a href="../index.html">← Schemes table</a> · <a href="index.html">All lessons</a></span><span class="muted">Lesson ${me.no} · same neuron in every lesson</span><button class="ghost" id="theme" type="button">Theme</button></div>
    <h1>${cfg.title}</h1>
    <div class="legend" aria-label="Colour legend"><span class="c-client">client and secret key</span><span class="c-server">server and its work</span><span class="c-noise">noise and error</span></div>
  </header>
  <nav class="chips" id="chips" aria-label="Steps"></nav>
  <article class="stage" aria-live="polite">
    <div class="stagehead"><h2 id="st-title">…</h2><span class="who" id="st-who">…</span></div>
    <div class="scene" id="scene"></div>
    <p class="caption" id="st-cap">…</p>
    <details class="explain" id="explain"><summary>Read the full explanation</summary><div class="explainbody" id="explainbody"></div></details>
    <div class="nav">
      <div class="grp"><button class="ghost" id="prev" type="button">← Back</button><button id="next" type="button">Next →</button></div>
      <div class="grp"><button class="ghost" id="replay" type="button">↻ Replay</button><button class="ghost" id="play" type="button">▶ Auto-play</button></div>
    </div>
  </article>
  <div class="status" aria-label="State of the computation">
    <div class="stat"><span class="k">Data is at</span><div class="where"><span class="c-client">client</span><span class="track"><span class="dot" id="s-dot"></span></span><span class="c-server">server</span></div></div>
    <div class="stat"><span class="k">${st.budgetLabel||"Levels left"}</span><div class="levels" id="s-lv">${"<i></i>".repeat(st.budgetCells||4)}</div><span class="v" id="s-lvtxt" hidden></span></div>
    <div class="stat"><span class="k">${st.scaleLabel||"Scale"}</span><span class="v" id="s-scale">—</span></div>
    <div class="stat"><span class="k">${st.errLabel||"Error so far"}</span><span class="v c-noise" id="s-err">0</span></div>
  </div>
  <details class="math" id="math"><summary>Show the maths for this step</summary><div class="mathbody" id="mathbody"></div></details>
  <div class="try" role="group" aria-label="Try your own input">${inputs}<button class="ghost" id="reseed" type="button">${cfg.reseedLabel||"New random keys"}</button><span class="muted">${cfg.inputNote||"Change x and every value is recomputed."}</span></div>
  <div class="nextlesson">${prev?`<a href="${prev.file}">← Lesson ${prev.no}: ${prev.title}</a>`:"<span></span>"}${next?`<a href="${next.file}">Lesson ${next.no}: ${next.title} →</a>`:`<a href="compare.html">Compare all schemes →</a>`}</div>
  <footer>${cfg.footer||""}</footer>
  </div>`;
}

/* ---------- comparison card step ---------- */
LS.CARD_ROWS = [["slot","A slot holds"],["values","Values per ciphertext"],["ops","Native operations"],["linear","Linear part"],["relu","ReLU"],["noise","Noise"],["budget","Budget used"],["refresh","Refresh"],["result","Our neuron gives"],["security","Security"]];
LS.cardStep = function(cfg, opts={}){
  const me = {card: (window.LESSON_CARDS||{})[cfg.id] || {}};
  return { key:"At a glance", who:"both", whoT:"summary", at:0, budget:opts.budget??0, scale:opts.scale||"—", err:opts.err||(()=>0), title:`${opts.name||cfg.title.replace(/ Step by Step$/,"")} at a glance`, html:true,
    cap:()=>"Every lesson ends with this card, filled in for the same neuron, so schemes can be compared line by line. <a href=\"compare.html\">See all cards side by side.</a>",
    scene:()=>`<dl class="glance">${LS.CARD_ROWS.map(([k,l]) => `<dt>${l}</dt><dd${k==="result"?' class="mono"':""}>${k==="result"&&cfg.cardResult?cfg.cardResult():(me.card[k]||"—")}</dd>`).join("")}</dl>${opts.extra?opts.extra():""}`,
    play(){ LS.A(".glance dd",[{opacity:0,transform:"translateX(-10px)"},{opacity:1,transform:"none"}],{s:60,d:400}); LS.A(".next div",[{opacity:0,transform:"translateY(10px)"},{opacity:1,transform:"none"}],{t:700,s:120}); },
    math: opts.math || (()=>`<p>${cfg.paramsNote||""}</p>`),
    explain: opts.explain || (()=>`<p>The card rows are the same in every lesson. Open <a href="compare.html">the comparison page</a> to read them side by side.</p>`) };
};

/* ---------- controller ---------- */
LS.start = function(cfg){
  LS.cfg = cfg;
  shell(cfg);
  const steps = cfg.steps;
  let cur = 0, timer = null;
  const chips = $("chips");
  steps.forEach((s,i) => { const b = document.createElement("button"); b.className = "chip"; b.type = "button"; b.innerHTML = `<b>${i}</b>${s.key}`; b.onclick = () => go(i); chips.appendChild(b); });
  const val = (v) => typeof v === "function" ? v() : v;
  function status(s){
    const at = val(s.at)||0; $("s-dot").style.left = `calc(${at*100}% - ${at*14}px)`;
    const b = val(s.budget), lv = $("s-lv"), lt = $("s-lvtxt");
    if(typeof b === "string"){ lv.hidden = true; lt.hidden = false; lt.textContent = b; }
    else { lv.hidden = false; lt.hidden = true; [...lv.children].forEach((c,i) => c.classList.toggle("gone", i >= (b??0))); }
    $("s-scale").textContent = val(s.scale) ?? "—";
    const e = s.err ? s.err() : 0; $("s-err").textContent = typeof e === "string" ? e : (e ? LS.fe(e) : "0");
  }
  function go(i, keepPlay){
    cur = Math.max(0, Math.min(steps.length-1, i)); const s = steps[cur];
    if(!keepPlay) stop();
    $("st-title").innerHTML = val(s.title) + (s.sim ? '<span class="badge-sim" title="This step shows the arithmetic in the clear">plaintext simulation</span>' : "");
    const w = $("st-who"); w.className = "who "+s.who; w.textContent = s.whoT;
    $("scene").innerHTML = s.scene(); $("st-cap").innerHTML = s.cap(); $("mathbody").innerHTML = s.math ? s.math() : ""; $("explainbody").innerHTML = s.explain ? s.explain() : "";
    [...chips.children].forEach((c,j) => { c.setAttribute("aria-current", j===cur ? "step" : "false"); c.classList.toggle("done", j < cur); });
    $("prev").disabled = cur === 0; $("next").disabled = cur === steps.length-1;
    status(s); if(s.play) s.play();
    try{ localStorage.setItem("lesson-"+cfg.id, cur); history.replaceState(null, "", "#step-"+cur); }catch(e){}
  }
  LS.go = go;
  function stop(){ if(timer){ clearInterval(timer); timer = null; $("play").textContent = "▶ Auto-play"; } }
  $("prev").onclick = () => go(cur-1); $("next").onclick = () => go(cur+1); $("replay").onclick = () => go(cur, !!timer);
  $("play").onclick = () => { if(timer){ stop(); return; } if(cur === steps.length-1) go(0); $("play").textContent = "❚❚ Pause"; timer = setInterval(() => { if(cur >= steps.length-1){ stop(); return; } go(cur+1, true); }, cfg.autoplayMs||6500); };
  document.addEventListener("keydown", e => { if(e.target && e.target.tagName === "INPUT") return; if(e.key === "ArrowRight") go(cur+1); if(e.key === "ArrowLeft") go(cur-1); });
  const inputs = () => { const o = {}; (cfg.inputs || [{id:"x1",value:1.5},{id:"x2",value:2.0}]).forEach(i => { const v = parseFloat($("in-"+i.id).value); o[i.id] = isFinite(v) ? v : i.value; }); return o; };
  const recompute = () => { LS.R = cfg.compute(inputs()); go(cur, !!timer); };
  (cfg.inputs || [{id:"x1"},{id:"x2"}]).forEach(i => $("in-"+i.id).addEventListener("change", recompute));
  $("reseed").onclick = () => { LS.seed = Math.floor(Math.random()*1e9); if(cfg.setup) cfg.setup(); recompute(); };
  $("theme").onclick = () => { const r = document.documentElement; const d = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; r.dataset.theme = d ? "light" : "dark"; };
  if(cfg.setup) cfg.setup();
  LS.R = cfg.compute(inputs());
  let start = 0; try{ start = +localStorage.getItem("lesson-"+cfg.id) || 0; }catch(e){}
  try{ const hm = /^#step-(\d+)$/.exec(location.hash); if(hm) start = +hm[1]; }catch(e){}
  go(start);
};
})();
