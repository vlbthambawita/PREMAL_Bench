/* Toy secret-sharing engine: arithmetic shares mod 2^32, XOR bit shares, Beaver triples,
   ripple-carry arithmetic-to-boolean conversion, and ABY3-style replicated 3PC. Needs lesson.js. */
(function(){
"use strict";
const U = v => v >>> 0, add = (a,b) => (a+b)>>>0, sub = (a,b) => (a-b)>>>0, mul = (a,b) => Math.imul(a,b)>>>0, neg = a => (-a)>>>0;
const r32 = () => Math.floor(LS.rng()*4294967296) >>> 0, rbit = () => LS.rng() < 0.5 ? 1 : 0;
const signed = v => v >= 2147483648 ? v - 4294967296 : v;
const MPC = window.MPC = { U, add, sub, mul, neg, r32, rbit, signed, rounds:0, log:[] };
MPC.reset = () => { MPC.rounds = 0; MPC.msgs = 0; MPC.log = []; };
MPC.share = v => { const s0 = r32(); return [s0, sub(U(v), s0)]; };
MPC.open = sh => add(sh[0], sh[1]);
MPC.triple = () => { const a = r32(), b = r32(), c = mul(a,b); return { a:MPC.share(a), b:MPC.share(b), c:MPC.share(c), plain:{a,b,c} }; };
/* Beaver multiplication of several pairs in ONE round */
MPC.mulMany = (pairs, label) => { const out = []; const rec = [];
  for(const [x,y] of pairs){ const t = MPC.triple(); const d = add(sub(x[0],t.a[0]), sub(x[1],t.a[1])), e = add(sub(y[0],t.b[0]), sub(y[1],t.b[1]));
    const z0 = add(add(add(t.c[0], mul(d,t.b[0])), mul(e,t.a[0])), mul(d,e)), z1 = add(add(t.c[1], mul(d,t.b[1])), mul(e,t.a[1]));
    out.push([z0,z1]); rec.push({t,d,e,z:[z0,z1]}); }
  MPC.rounds += 1; MPC.msgs += 2*pairs.length*2; MPC.log.push({kind:"beaver", label, rec}); return {out, rec}; };
/* AND of XOR-shared bits with a boolean Beaver triple (one round) */
MPC.andBits = (u, v) => { const a = rbit(), b = rbit(), c = a & b; const as = [rbit()], bs = [rbit()], cs = [rbit()]; as[1] = a^as[0]; bs[1] = b^bs[0]; cs[1] = c^cs[0];
  const d = (u[0]^as[0]) ^ (u[1]^as[1]), e = (v[0]^bs[0]) ^ (v[1]^bs[1]);
  return [cs[0] ^ (d & bs[0]) ^ (e & as[0]) ^ (d & e), cs[1] ^ (d & bs[1]) ^ (e & as[1])]; };
/* A2B by ripple-carry addition of P0's and P1's shares, bit by bit. Returns sign-bit XOR shares and a trace. */
MPC.a2bSign = sh => { const A = i => (sh[0]>>>i)&1, B = i => (sh[1]>>>i)&1; let c = [0,0]; const trace = [];
  for(let i=0;i<31;i++){ const u = [A(i)^c[0], c[1]], v = [c[0], B(i)^c[1]]; const t = MPC.andBits(u, v); const cn = [c[0]^t[0], c[1]^t[1]];
    trace.push({i, a:A(i), b:B(i), carry:c[0]^c[1], sum:A(i)^B(i)^c[0]^c[1]}); c = cn; MPC.rounds += 1; MPC.msgs += 4; }
  const s = [A(31)^c[0], B(31)^c[1]]; trace.push({i:31, a:A(31), b:B(31), carry:c[0]^c[1], sum:s[0]^s[1]}); return {s, trace}; };
/* bit (XOR shares) to arithmetic shares: s = s0 + s1 - 2 s0 s1 (one Beaver product) */
MPC.b2a = s => { const {out} = MPC.mulMany([[[s[0],0],[0,s[1]]]], "b2a"); const p = out[0]; return [sub(sub(s[0], mul(2,p[0])), 0) , sub(s[1], mul(2,p[1]))]; };
/* ---- replicated 3PC (ABY3 style) ---- */
MPC.rep = v => { const a = r32(), b = r32(), c = sub(sub(U(v),a),b); const s = [a,b,c]; return [[s[0],s[1]],[s[1],s[2]],[s[2],s[0]]]; };
MPC.repOpen = r => add(add(r[0][0], r[1][0]), r[2][0]);
MPC.repMul = (x, y) => { const z1 = r32(), z2 = r32(), al = [z1, z2, sub(neg(z1), z2)];
  const zi = [0,1,2].map(i => add(add(add(mul(x[i][0],y[i][0]), mul(x[i][0],y[i][1])), mul(x[i][1],y[i][0])), al[i]));
  return { local:zi, alpha:al, out:[[zi[0],zi[1]],[zi[1],zi[2]],[zi[2],zi[0]]] }; };
MPC.repAdd = (x, y) => x.map((p,i) => [add(p[0],y[i][0]), add(p[1],y[i][1])]);
MPC.repAddConst = (x, c) => x.map((p,i) => i===0 ? [add(p[0],U(c)), p[1]] : i===2 ? [p[0], add(p[1],U(c))] : p);
})();
