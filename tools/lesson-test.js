#!/usr/bin/env node
/* Headless check for a lesson page: runs its scripts with a stub DOM, renders every step,
   reports NaN/undefined, and checks each SVG scene is well-formed XML.
   usage: node tools/lesson-test.js docs/learn/ckks.html [--dump]   (prints captions and status per step) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const file = process.argv[2], dump = process.argv.includes("--dump");
const html = fs.readFileSync(file, "utf8"), dir = path.dirname(file);
const els = {};
function mk(id){ return { id, textContent:"", _html:"", value:"", style:{}, className:"", disabled:false, hidden:false, children:[], dataset:{},
  get innerHTML(){ return this._html; }, set innerHTML(v){ this._html = v; if(id==="app") parseInputs(v); },
  classList:{ toggle(){}, add(){}, remove(){} }, setAttribute(){}, addEventListener(){}, appendChild(c){ this.children.push(c); }, querySelectorAll(){ return []; } }; }
function parseInputs(h){ const re = /<input id="([^"]+)"[^>]*value="([^"]*)"/g; let m; while((m = re.exec(h))) { el(m[1]).value = m[2]; } const lv = /<div class="levels" id="s-lv">((?:<i><\/i>)*)<\/div>/.exec(h); if(lv) el("s-lv").children = Array.from({length:(lv[1].match(/<i>/g)||[]).length}, () => mk("i")); }
const el = id => els[id] || (els[id] = mk(id));
const ctx = { console, Math, BigInt, Number, String, Array, Object, JSON, Error, Date, parseFloat, parseInt, isFinite, Map, Set, Uint8Array, Uint32Array, Float64Array, Symbol, Promise, setTimeout:()=>0, clearTimeout(){}, setInterval:()=>0, clearInterval(){},
  matchMedia: () => ({ matches:false }), localStorage:{ getItem:()=>null, setItem(){} }, history:{ replaceState(){} }, location:{ hash:"" },
  performance:{ now:()=>0 }, requestAnimationFrame:()=>0, TextEncoder, crypto: require("crypto").webcrypto,
  document:{ getElementById: el, createElement: () => mk("x"+Math.random()), addEventListener(){}, documentElement:{ dataset:{} }, body:{ contains:()=>false }, querySelectorAll:()=>[] } };
ctx.window = ctx; vm.createContext(ctx);
const scripts = [...html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)];
for(const s of scripts){ const code = s[1] ? fs.readFileSync(path.join(dir, s[1]), "utf8") : s[2]; try{ vm.runInContext(code, ctx, { filename: s[1] || "inline" }); } catch(e){ console.error("SCRIPT ERROR in", s[1]||"inline", e.stack.split("\n").slice(0,4).join("\n")); process.exit(1); } }
const chips = el("chips").children; let bad = 0;
const xmlOk = h => { // minimal well-formedness check: balanced tags (void html tags allowed)
  const voids = new Set(["br","img","input","hr","meta","link","wbr"]); const st = []; const re = /<\/?([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g; let m;
  while((m = re.exec(h))){ const tag = m[1].toLowerCase(); if(m[0].startsWith("</")){ if(st.pop() !== tag) return "mismatched </"+tag+"> near: "+h.slice(Math.max(0,m.index-60), m.index+10); } else if(!m[3] && !voids.has(tag)) st.push(tag); }
  return st.length ? "unclosed <"+st.pop()+">" : null; };
console.log(`${path.basename(file)}: ${chips.length} steps`);
for(let i=0;i<chips.length;i++){
  try{ chips[i].onclick(); } catch(e){ console.log(`  step ${i} THREW`, e.stack.split("\n").slice(0,3).join(" | ")); bad++; continue; }
  const sc = el("scene").innerHTML, all = sc + el("st-cap").innerHTML + el("mathbody").innerHTML + el("explainbody").innerHTML + el("st-title").innerHTML;
  const issues = []; if(/NaN|undefined|Infinity|\[object Object\]/.test(all)) issues.push("NaN/undefined in output: "+(all.match(/.{0,50}(NaN|undefined|Infinity|\[object Object\]).{0,30}/)||[""])[0]);
  const x = xmlOk(sc); if(x) issues.push("markup: "+x);
  if(!el("explainbody").innerHTML.trim()) issues.push("no explanation");
  if(!el("st-cap").innerHTML.trim()) issues.push("no caption");
  if(issues.length) bad++;
  console.log(`  ${i} ${issues.length?"FAIL":"ok  "} ${el("st-title").innerHTML.replace(/<[^>]+>/g,"").slice(0,48).padEnd(48)} ${issues.join("; ")}`);
  if(dump) console.log(`     cap: ${el("st-cap").innerHTML.replace(/<[^>]+>/g,"")}\n     status: scale=${el("s-scale").textContent} err=${el("s-err").textContent} budget=${el("s-lvtxt").textContent||el("s-lv").children.filter(c=>c).length}`);
}
console.log(bad ? `FAILED: ${bad} step(s)` : "ALL STEPS OK");
process.exit(bad ? 1 : 0);
