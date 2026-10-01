/* Toy function secret sharing: naive table keys and the BCG+21 distributed comparison function (DCF)
   built from a SHA-256 PRG tree. Outputs live in Z_{2^32}. Needs sha256.js, lesson.js. */
(function(){
"use strict";
const add = (a,b) => (a+b)>>>0, sub = (a,b) => (a-b)>>>0, neg = a => (-a)>>>0, mul = (a,b) => Math.imul(a,b)>>>0;
const sgn = (t, v) => t ? neg(v) : v;            // (-1)^t · v
const rseed = () => { const s = new Uint8Array(16); for(let i=0;i<16;i++) s[i] = Math.floor(LS.rng()*256); return s; };
const xor = (a,b) => a.map((v,i) => v ^ b[i]);
const u32 = (b, o) => ((b[o]<<24) | (b[o+1]<<16) | (b[o+2]<<8) | b[o+3]) >>> 0;
function G(s){ const L = SHA256.hash(SHA256.cat(s, new Uint8Array([0]))), R = SHA256.hash(SHA256.cat(s, new Uint8Array([1])));
  return { sL:L.slice(0,16), vL:u32(L,16), tL:L[20]&1, sR:R.slice(0,16), vR:u32(R,16), tR:R[20]&1 }; }
const conv = s => u32(SHA256.hash(SHA256.cat(s, new Uint8Array([2]))), 0);
const bit = (x, i, n) => (x >>> (n-1-i)) & 1;
const FSS = window.FSS = { add, sub, neg, mul };
FSS.naive = (n, f) => { const T = [], K0 = [], K1 = []; for(let u=0; u<(1<<n); u++){ T.push(f(u)>>>0); const r = Math.floor(LS.rng()*4294967296)>>>0; K0.push(r); K1.push(sub(T[u], r)); } return { T, K0, K1 }; };
/* DCF for f(x) = beta if x < alpha else 0, on n-bit inputs (MSB first) */
FSS.dcfGen = (n, alpha, beta) => {
  let s0 = rseed(), s1 = rseed(); const seeds = [s0.slice(), s1.slice()]; let t0 = 0, t1 = 1, Va = 0; const CW = [];
  for(let i=0;i<n;i++){
    const g0 = G(s0), g1 = G(s1), a = bit(alpha, i, n);
    const keep = a ? "R" : "L", lose = a ? "L" : "R";
    const scw = xor(g0["s"+lose], g1["s"+lose]);
    let Vcw = sgn(t1, sub(sub(g1["v"+lose], g0["v"+lose]), Va));
    if(lose === "L") Vcw = add(Vcw, sgn(t1, beta>>>0));
    Va = add(add(sub(Va, g1["v"+keep]), g0["v"+keep]), sgn(t1, Vcw));
    const tLcw = g0.tL ^ g1.tL ^ a ^ 1, tRcw = g0.tR ^ g1.tR ^ a;
    CW.push({scw, Vcw, tLcw, tRcw});
    const tk = keep === "L" ? tLcw : tRcw;
    const ns0 = t0 ? xor(g0["s"+keep], scw) : g0["s"+keep], ns1 = t1 ? xor(g1["s"+keep], scw) : g1["s"+keep];
    const nt0 = g0["t"+keep] ^ (t0 & tk), nt1 = g1["t"+keep] ^ (t1 & tk);
    s0 = ns0; s1 = ns1; t0 = nt0; t1 = nt1;
  }
  const last = sgn(t1, sub(sub(conv(s1), conv(s0)), Va));
  return [ {b:0, seed:seeds[0], CW, last, n}, {b:1, seed:seeds[1], CW, last, n} ];
};
FSS.dcfEval = (k, x) => { let s = k.seed, t = k.b, V = 0; const path = [];
  for(let i=0;i<k.n;i++){ const g = G(s), cw = k.CW[i]; let {sL,tL,sR,tR} = g;
    if(t){ sL = xor(sL, cw.scw); tL ^= cw.tLcw; sR = xor(sR, cw.scw); tR ^= cw.tRcw; }
    const xi = bit(x, i, k.n);
    if(xi === 0){ V = add(V, sgn(k.b, add(g.vL, t ? cw.Vcw : 0))); s = sL; t = tL; } else { V = add(V, sgn(k.b, add(g.vR, t ? cw.Vcw : 0))); s = sR; t = tR; }
    path.push({level:i, bit:xi, t}); }
  V = add(V, sgn(k.b, add(conv(s), t ? k.last : 0))); return {V, path}; };
FSS.keyBytes = k => 16 + k.CW.length*(16+4+1) + 4;
FSS.hexSeed = s => Array.from(s.slice(0,4), x => x.toString(16).padStart(2,"0")).join("") + "…";
})();
