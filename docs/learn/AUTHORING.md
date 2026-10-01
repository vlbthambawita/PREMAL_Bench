# Authoring a lesson

Read `LESSON_PLAN.md` first (shared example, visual vocabulary, diagram rules).
`ckks.html` is the reference implementation.

## Files

| File | Purpose |
|---|---|
| `lesson.css`, `lesson.js` | shared styles and runtime (do not fork per lesson) |
| `lessons.js` | registry: number, id, file, title, scheme rows covered |
| `cards/<id>.js` | this lesson's comparison card (`window.LESSON_CARDS[id]`) |
| `engines/<name>.js` | reusable toy engines (`ckks.js`, `bfv.js`, `tfhe.js`, …) |
| `<id>.html` | the lesson page |

## Page skeleton

```html
<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>BFV Step by Step</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="lesson.css"></head>
<body><div id="app"></div>
<script src="lessons.js"></script><script src="cards/bfv.js"></script>
<script src="lesson.js"></script><script src="engines/bfv.js"></script>
<script> /* lesson config, then LS.start(cfg) */ </script></body></html>
```

## Config passed to `LS.start(cfg)`

```js
{ id:"bfv", title:"BFV Step by Step",
  setup(){ /* keygen; called on load and on "New random keys" */ },
  compute(inp){ /* inp.x1, inp.x2 → returns R (all numbers the steps show) */ },
  inputs:[{id:"x1",label:"x₁",value:1.5},{id:"x2",label:"x₂",value:2.0}],  // optional, this is the default
  inputNote:"…", reseedLabel:"New random keys",
  status:{ budgetLabel:"Noise budget", budgetCells:4, scaleLabel:"Encoding", errLabel:"Error so far" },
  footer:"toy parameters + original paper link",
  cardResult:()=>"0.3500 exactly",
  steps:[ step, step, …, LS.cardStep(cfg,{…}) ] }
```

Each step:

```js
{ key:"Encrypt",            // chip label
  who:"client"|"server"|"both", whoT:"client",   // badge
  at:0..1,                  // dot position client→server
  budget:3 | "2 rounds",    // number = cells lit, string = text in the budget cell
  scale:"Δ = q/t",          // string or function
  err:()=>number|string,    // "Error so far"
  title:"…", sim:false,     // sim:true shows a "plaintext simulation" badge (only when a step cannot run encrypted)
  cap:()=>"1–2 sentences",  // under the figure
  scene:()=>LS.svg(h, inner, ariaLabel),   // or HTML
  play(){ LS.pop(".x",0); … },             // animations; final state must be complete at rest
  math:()=>"formulas/tables HTML",
  explain:()=>"2–4 short paragraphs" }
```

`LS.cardStep(cfg, {name, budget, scale, err, extra, math, explain})` builds the
final comparison-card step from `cards/<id>.js`.

## Helpers on `LS`

Randomness: `LS.rng()`, `LS.randInt`, `LS.randBig(m)`, `LS.tern()`, `LS.smallErr()` (seeded; `LS.seed`).
Number theory: `LS.mod, cmod, rdiv, fdiv, powmod, invmod, egcd`; polynomials `LS.poly.{red,add,sub,neg,scal,mul,auto,str}` (negacyclic, BigInt).
Format: `LS.f(x,d)`, `LS.fe(x)` (×10ⁿ), `LS.sup`, `LS.sub`, `LS.big`, `LS.hex(v,m)`, `LS.bits`.
SVG: `LS.svg, tile, lock, keyIcon, lbl, small, arrow, plot(...)`; markers `ah` ink, `ahs` server,
`ahc` client, `ahm` muted, `ahn` noise, `ahw` warn, `ahk` ok.
Animation: `LS.A(sel,keyframes,{t,s,d})`, `pop, fade, draw` (paths need `pathLength="1" stroke-dasharray="1"`), `slide, blink, growX, countUp(id,to,t)`.
Neuron: `LS.W = [0.5,-0.25]`, `LS.B = 0.1`, `LS.neuron(x)`.
Colour classes: `c-client c-server c-noise c-ok c-warn c-muted`.

## Card fields (`cards/<id>.js`)

`slot, values, ops, linear, relu, noise, budget, refresh, result, security`, plus
`exact` ("exact" | "approximate" | "n/a") and `interaction` (short text) for the compare page.

## Checks before a lesson is done

```bash
node tools/lesson-test.js docs/learn/<id>.html --dump      # must print ALL STEPS OK
(cd docs && python3 -m http.server 8000) &                    # if not already running
tools/shot.sh "http://127.0.0.1:8000/learn/<id>.html#step-N" /tmp/<id>-N.png 1000 760
```

Look at every step's screenshot: arrows end at their target (not in gaps or past edges),
labels do not overlap lines or each other, nothing is clipped, colours match the legend.
