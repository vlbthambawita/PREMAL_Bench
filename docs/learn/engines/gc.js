/* Toy Yao garbled circuits: 64-bit labels, free-XOR, point-and-permute, SHA-256 row encryption,
   plus a Bellare–Micali style oblivious transfer over Z_p*, p = 2^61 - 1 (toy group). Needs sha256.js, lesson.js. */
(function(){
"use strict";
const M64 = (1n<<64n) - 1n;
const r64 = () => LS.randBig(1n<<64n);
const lsb = v => Number(v & 1n);
const GC = window.GC = {};
GC.newDelta = () => r64() | 1n;
/* circuit: list of gates {op:"AND"|"XOR"|"NOT", a, b, out, id} over named wires */
GC.garble = (circuit, inputs, Delta) => {
  const L = {};                                     // wire -> label for 0
  for(const w of inputs) L[w] = r64();
  const tables = [];
  for(const g of circuit){
    if(g.op === "XOR") L[g.out] = L[g.a] ^ L[g.b];
    else if(g.op === "NOT") L[g.out] = L[g.a] ^ Delta;
    else { L[g.out] = r64(); const rows = new Array(4); const plain = [];
      for(const va of [0,1]) for(const vb of [0,1]){ const Ka = L[g.a] ^ (va ? Delta : 0n), Kb = L[g.b] ^ (vb ? Delta : 0n), Kc = L[g.out] ^ ((va&vb) ? Delta : 0n);
        const row = 2*lsb(Ka) + lsb(Kb); const ct = SHA256.h64(Ka, Kb, BigInt(g.id)) ^ Kc; rows[row] = ct; plain.push({va, vb, out:va&vb, row, ct}); }
      tables.push({id:g.id, gate:g, rows, plain}); }
  }
  return { L, tables, Delta };
};
GC.label = (G, w, v) => G.L[w] ^ (v ? G.Delta : 0n);
GC.evaluate = (circuit, tables, K) => {
  const trace = []; const T = {}; tables.forEach(t => T[t.id] = t);
  for(const g of circuit){
    if(g.op === "XOR") K[g.out] = K[g.a] ^ K[g.b];
    else if(g.op === "NOT") K[g.out] = K[g.a];            // free: the label is reinterpreted by the garbler
    else { const row = 2*lsb(K[g.a]) + lsb(K[g.b]); K[g.out] = T[g.id].rows[row] ^ SHA256.h64(K[g.a], K[g.b], BigInt(g.id)); trace.push({id:g.id, row, out:K[g.out]}); }
  }
  return { K, trace };
};
/* ---- Bellare–Micali OT in a toy group ---- */
const p = (1n<<61n) - 1n, g = 37n;
GC.ot = { p, g };
GC.otRun = (m0, m1, sigma) => {
  const rnd = () => 2n + LS.randBig(p - 3n);
  const c = rnd(), C = LS.powmod(g, c, p);                       // sender publishes C
  const k = rnd(), PKs = LS.powmod(g, k, p), PKo = C * LS.invmod(PKs, p) % p;
  const PK0 = sigma ? PKo : PKs;                                   // receiver sends PK0 only
  const PK1 = C * LS.invmod(PK0, p) % p;                           // sender derives PK1
  const enc = [ [PK0, m0], [PK1, m1] ].map(([PK, m]) => { const r = rnd(); return { R: LS.powmod(g, r, p), E: SHA256.h64(LS.powmod(PK, r, p)) ^ m }; });
  const got = enc[sigma].E ^ SHA256.h64(LS.powmod(enc[sigma].R, k, p));
  return { C, PK0, PK1, enc, got, bytes: 8 + 8 + 2*16 };
};
/* ReLU circuit on 5-bit shares: z = s + c mod 32 (adder), y_i = z_i AND NOT z_4 for i = 0..3 */
GC.reluCircuit = () => { const C = []; let id = 1; const g = (op,a,b,out) => C.push({op,a,b,out,id:op==="AND"?id++:0});
  g("XOR","s0","c0","z0"); g("AND","s0","c0","k1");
  for(let i=1;i<4;i++){ g("XOR",`s${i}`,`k${i}`,`t${i}`); g("XOR",`c${i}`,`k${i}`,`u${i}`); g("AND",`t${i}`,`u${i}`,`v${i}`); g("XOR",`k${i}`,`v${i}`,`k${i+1}`); g("XOR",`s${i}`,`c${i}`,`p${i}`); g("XOR",`p${i}`,`k${i}`,`z${i}`); }
  g("XOR","s4","c4","p4"); g("XOR","p4","k4","z4"); g("NOT","z4",null,"nz4");
  for(let i=0;i<4;i++) g("AND",`z${i}`,"nz4",`y${i}`);
  return C; };
GC.hex = v => v.toString(16).padStart(16,"0");
})();
