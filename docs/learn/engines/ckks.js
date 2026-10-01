/* Toy CKKS engine (insecure sizes, real algebra). Requires lesson.js (LS helpers).
   const C = CKKS.make({N:4, deltaBits:20, q0Bits:30, levels:3, pBits:100});
   C.keygen(); ct = C.encrypt(C.encode([1.5,2.0])); ... C.val(ct) -> slot values (real parts). */
(function(){
"use strict";
const P_ = LS.poly;
window.CKKS = {
  make(o={}){
    const N = o.N||4, DB = BigInt(o.deltaBits||20), D = 1n<<DB, L = o.levels??3, Pm = 1n<<BigInt(o.pBits||100);
    const q = []; for(let l=0;l<=L;l++) q.push(1n<<(BigInt(o.q0Bits||30)+DB*BigInt(l)));
    const M = 2*N, nslots = N/2;
    const gen = []; let g = 1; for(let j=0;j<nslots;j++){ gen.push(g); g = (g*5) % M; }
    const roots = gen.map(e => [Math.cos(Math.PI*e/N), Math.sin(Math.PI*e/N)]);
    const C = { N, D, Dn:Number(D), L, q, P:Pm, nslots, gen, K:null };
    const rnd = m => LS.randBig(m), vec = f => Array.from({length:N}, f);
    /* encode complex or real slot vector z (numbers or [re,im]) at scale sc (BigInt) */
    C.encode = (z, sc=D) => { const zz = z.map(v => Array.isArray(v) ? v : [v,0]); const m = [];
      for(let k=0;k<N;k++){ let re = 0; for(let j=0;j<nslots;j++){ const a = -Math.PI*gen[j]*k/N, c = Math.cos(a), s = Math.sin(a); re += zz[j][0]*c - zz[j][1]*s; } m.push(BigInt(Math.round(2*re/N*Number(sc)))); } return m; };
    C.decodeC = (m, sc=D) => roots.map((r,j) => { let re=0, im=0; for(let k=0;k<N;k++){ const a = Math.PI*gen[j]*k/N, v = Number(m[k]); re += v*Math.cos(a); im += v*Math.sin(a); } return [re/Number(sc), im/Number(sc)]; });
    C.decode = (m, sc=D) => C.decodeC(m, sc).map(v => v[0]);
    C.keygen = (sOverride) => { let s; if(sOverride) s = sOverride; else do{ s = vec(() => LS.tern()); }while(s.every(v => v === 0n));
      const Q = q[L], PQ = Pm*Q, a = vec(() => rnd(Q)), e = vec(() => LS.smallErr());
      const swk = sp => { const a2 = vec(() => rnd(PQ)), e2 = vec(() => LS.smallErr()); return [P_.neg(P_.mul(a2, s, PQ)).map((v,i) => LS.cmod(v + e2[i] + Pm*sp[i], PQ)), a2]; };
      C.K = { s, pk:[P_.add(P_.neg(P_.mul(a, s, Q)), e, Q), a], rlk: swk(P_.mul(s, s, PQ)), rot:{}, conj: swk(P_.auto(s, M-1)), swk };
      C.rotKey(1); return C.K; };
    C.rotKey = r => { const g = C.gen[((r % nslots)+nslots) % nslots]; if(!C.K.rot[g]) C.K.rot[g] = C.K.swk(P_.auto(C.K.s, g)); return C.K.rot[g]; };
    C.encrypt = (m, lvl=L) => { const Q = q[lvl], u = vec(() => LS.tern()), e0 = vec(() => LS.smallErr()), e1 = vec(() => LS.smallErr());
      return { c:[P_.add(P_.add(P_.mul(P_.red(C.K.pk[0],Q), u, Q), e0, Q), m, Q), P_.add(P_.mul(P_.red(C.K.pk[1],Q), u, Q), e1, Q)], l:lvl }; };
    C.decRaw = (ct, s=C.K.s) => { let acc = ct.c[0].slice(), sp = s; for(let i=1;i<ct.c.length;i++){ acc = P_.add(acc, P_.mul(ct.c[i], sp, q[ct.l]), q[ct.l]); sp = P_.mul(sp, s, null); } return P_.red(acc, q[ct.l]); };
    C.ks = (d, key, l) => { const m = Pm*q[l], dd = P_.red(d, q[l]); return [P_.mul(dd, P_.red(key[0], m), m), P_.mul(dd, P_.red(key[1], m), m)].map(t => P_.red(t.map(v => LS.rdiv(v, Pm)), q[l])); };
    C.rescale = ct => ({ c: ct.c.map(p => P_.red(P_.red(p, q[ct.l]).map(v => LS.rdiv(v, D)), q[ct.l-1])), l: ct.l-1 });
    C.mulPt = (ct, pt) => ({ c: ct.c.map(p => P_.mul(p, pt, q[ct.l])), l: ct.l });
    C.addPt = (ct, pt) => ({ c: [P_.add(ct.c[0], pt, q[ct.l]), ...ct.c.slice(1)], l: ct.l });
    C.add = (a, b) => ({ c: a.c.map((p,i) => P_.add(p, b.c[i], q[a.l])), l: a.l });
    C.sub = (a, b) => ({ c: a.c.map((p,i) => P_.sub(p, b.c[i], q[a.l])), l: a.l });
    C.down = (ct, to) => { to = to ?? ct.l-1; return { c: ct.c.map(p => P_.red(p, q[to])), l: to }; };
    C.tensor = (a, b) => { const m = q[a.l]; return { c: [P_.mul(a.c[0], b.c[0], m), P_.add(P_.mul(a.c[0], b.c[1], m), P_.mul(a.c[1], b.c[0], m), m), P_.mul(a.c[1], b.c[1], m)], l: a.l }; };
    C.relin = t => { const m = q[t.l], r = C.ks(t.c[2], C.K.rlk, t.l); return { c: [P_.add(t.c[0], r[0], m), P_.add(t.c[1], r[1], m)], l: t.l }; };
    C.mulCt = (a, b) => C.relin(C.tensor(a, b));
    C.applyAuto = (ct, g, key) => { const m = q[ct.l], r = C.ks(P_.auto(ct.c[1], g), key, ct.l); return { c: [P_.add(P_.auto(ct.c[0], g), r[0], m), r[1]], l: ct.l }; };
    C.rotate = (ct, r=1) => { const g = C.gen[((r % nslots)+nslots) % nslots]; return C.applyAuto(ct, g, C.rotKey(r)); };
    C.conjugate = ct => C.applyAuto(ct, M-1, C.K.conj);
    C.cst = c => { const v = new Array(N).fill(0n); v[0] = BigInt(Math.round(c*Number(D))); return v; };
    C.val = (ct, sc=D) => C.decode(C.decRaw(ct), sc);
    C.valC = (ct, sc=D) => C.decodeC(C.decRaw(ct), sc);
    return C;
  }
};
})();
