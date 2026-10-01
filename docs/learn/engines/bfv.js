/* Toy BFV and BGV engines (insecure sizes, real algebra). Requires lesson.js (LS helpers).
   const E = BFV.make({N:4, t:257n, qBits:200});   E.keygen(); ct = E.encrypt(E.encode([15,20,15,20])); E.decrypt(ct)
   const G = BGV.make({N:4, t:257n, levels:10, primeBits:31});
   Shared: EXACT.batch(N,t) slot encoding, EXACT.reluCoeffs(t), EXACT.evalPoly(E, ct, coeffs). */
(function(){
"use strict";
const P_ = LS.poly;
const isProbPrime = n => { if(n < 2n) return false; for(const p of [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n]){ if(n === p) return true; if(n % p === 0n) return false; }
  let d = n-1n, r = 0; while(d % 2n === 0n){ d /= 2n; r++; }
  for(const a of [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n]){ let x = LS.powmod(a, d, n); if(x === 1n || x === n-1n) continue; let ok = false; for(let i=1;i<r;i++){ x = x*x % n; if(x === n-1n){ ok = true; break; } } if(!ok) return false; } return true; };

const EXACT = window.EXACT = {
  isProbPrime,
  /* SIMD slots of Z_t[X]/(X^N+1) when t ≡ 1 mod 2N: slot j ↔ root r_j; slots j and j+N/2 are conjugate pairs */
  batch(N, t){
    const n = BigInt(N), M = 2n*n; let zeta = 0n;
    for(let g=2n; g<t; g++){ const z = LS.powmod(g, (t-1n)/M, t); if(LS.powmod(z, n, t) === t-1n){ zeta = z; break; } }
    const exps = []; let e = 1; for(let j=0;j<N/2;j++){ exps.push(e); e = (e*5) % (2*N); }
    const all = exps.concat(exps.map(x => (2*N - x) % (2*N)));
    const roots = all.map(x => LS.powmod(zeta, BigInt(x), t));
    const nInv = LS.invmod(n, t);
    const enc = v => { const m = []; for(let k=0;k<N;k++){ let s = 0n; for(let j=0;j<N;j++) s += BigInt(v[j]) * LS.powmod(LS.invmod(roots[j], t), BigInt(k), t); m.push(LS.cmod(s*nInv, t)); } return m; };
    const dec = m => roots.map(r => { let s = 0n; for(let k=0;k<N;k++) s += LS.mod(m[k], t) * LS.powmod(r, BigInt(k), t); return LS.cmod(s, t); });
    return { zeta, exps: all, roots, encode: enc, decode: dec };
  },
  /* ReLU on signed Z_t as a polynomial of degree t-1: c_k = -Σ_{a=1}^{(t-1)/2} a^{t-k} (k ≥ 1), c_0 = 0 */
  reluCoeffs(t){
    const h = (t-1n)/2n, c = [0n];
    for(let k=1n; k<t; k++){ let s = 0n; for(let a=1n; a<=h; a++) s += LS.powmod(a, t-k, t); c.push(LS.cmod(-s, t)); }
    return c;
  },
  evalPlain(c, x, t){ let s = 0n; for(let k=c.length-1; k>=0; k--) s = (s*x + c[k]) % t; return LS.cmod(s, t); },
  /* homomorphic polynomial evaluation by a power tree: pw[k] = pw[2^j] · pw[k-2^j]; depth ⌈log2 deg⌉ */
  evalPoly(E, z, c){
    const deg = c.length-1, pw = [null, z]; let mults = 0;
    for(let k=2; k<=deg; k++){ let a = 1; while(a*2 <= k) a *= 2; pw[k] = a === k ? E.mul(pw[k/2], pw[k/2]) : E.mul(pw[a], pw[k-a]); mults++; }
    let acc = null;
    for(let k=1; k<=deg; k++){ if(c[k] === 0n) continue; const term = E.mulScalar(pw[k], c[k]); acc = acc ? E.add(acc, term) : term; }
    if(c[0] !== 0n) acc = E.addPlain(acc, new Array(E.N).fill(0n).map((v,i)=>i===0?c[0]:0n));
    return { ct: acc, mults, depth: Math.ceil(Math.log2(deg)), pw };
  }
};

/* ---------------- BFV: c0 + c1·s = Δ·m + v (mod q), message in the HIGH bits ---------------- */
window.BFV = {
  make(o={}){
    const N = o.N||4, t = o.t||257n, q = 1n << BigInt(o.qBits||200), Pm = 1n << BigInt(o.pBits || (o.qBits||200)+20);
    const D = q / t, vec = f => Array.from({length:N}, f), slots = EXACT.batch(N, t);
    const E = { scheme:"BFV", N, t, q, P:Pm, D, slots, K:null, keyBits:0 };
    E.encode = v => slots.encode(v); E.decodeSlots = m => slots.decode(m);
    E.keygen = () => { let s; do{ s = vec(() => LS.tern()); }while(s.every(v => v === 0n));
      const a = vec(() => LS.randBig(q)), e = vec(() => LS.smallErr()), PQ = Pm*q;
      const swk = sp => { const a2 = vec(() => LS.randBig(PQ)), e2 = vec(() => LS.smallErr()); return [P_.neg(P_.mul(a2, s, PQ)).map((v,i) => LS.cmod(v + e2[i] + Pm*sp[i], PQ)), a2]; };
      E.K = { s, pk:[P_.add(P_.neg(P_.mul(a, s, q)), e, q), a], rlk: swk(P_.mul(s, s, null)), rot:{}, swk };
      E.K.rot[5] = swk(P_.auto(s, 5)); return E.K; };
    E.encrypt = m => { const u = vec(() => LS.tern()), e0 = vec(() => LS.smallErr()), e1 = vec(() => LS.smallErr());
      return { c:[P_.add(P_.add(P_.mul(E.K.pk[0], u, q), e0, q), m.map(v => v*D), q), P_.add(P_.mul(E.K.pk[1], u, q), e1, q)] }; };
    E.trivial = m => ({ c:[P_.red(m.map(v => v*D), q), vec(() => 0n)] });
    E.phase = ct => { let acc = ct.c[0].slice(), sp = E.K.s; for(let i=1;i<ct.c.length;i++){ acc = P_.add(acc, P_.mul(ct.c[i], sp, q), q); sp = P_.mul(sp, E.K.s, null); } return P_.red(acc, q); };
    E.decryptPoly = ct => E.phase(ct).map(v => LS.cmod(LS.rdiv(v*t, q), t));
    E.decrypt = ct => slots.decode(E.decryptPoly(ct));
    E.noise = ct => { const ph = E.phase(ct); let mx = 0n; ph.forEach(v => { const r = LS.rdiv(v*t, q); let d = v - r*D; if(d<0n) d=-d; if(d>mx) mx = d; }); return mx; };
    E.budget = ct => { const n = E.noise(ct); return Math.max(0, Math.floor(LS.bits(D/2n) - LS.bits(n) )); };
    E.budgetMax = () => LS.bits(D/2n);
    E.add = (a, b) => ({ c: a.c.map((p,i) => P_.add(p, b.c[i], q)) });
    E.sub = (a, b) => ({ c: a.c.map((p,i) => P_.sub(p, b.c[i], q)) });
    E.neg = a => ({ c: a.c.map(p => P_.red(P_.neg(p), q)) });
    E.addPlain = (ct, m) => ({ c: [P_.add(ct.c[0], m.map(v => LS.cmod(v,t)*D), q), ...ct.c.slice(1)] });
    E.mulPlain = (ct, m) => { const mm = m.map(v => LS.cmod(v, t)); return { c: ct.c.map(p => P_.mul(p, mm, q)) }; };
    E.mulScalar = (ct, k) => { k = LS.cmod(BigInt(k), t); return { c: ct.c.map(p => P_.scal(p, k, q)) }; };
    E.ks = (d, key) => { const m = Pm*q, dd = P_.red(d, q); return [P_.mul(dd, P_.red(key[0], m), m), P_.mul(dd, P_.red(key[1], m), m)].map(x => P_.red(x.map(v => LS.rdiv(v, Pm)), q)); };
    E.tensor = (a, b) => { const A = a.c.map(p => P_.red(p, q)), B = b.c.map(p => P_.red(p, q));
      const d = [P_.mul(A[0], B[0], null), P_.mul(A[0], B[1], null).map((v,i)=>v+P_.mul(A[1], B[0], null)[i]), P_.mul(A[1], B[1], null)];
      return { c: d.map(p => p.map(v => LS.cmod(LS.rdiv(v*t, q), q))) }; };
    E.relin = tt => { const r = E.ks(tt.c[2], E.K.rlk); return { c: [P_.add(tt.c[0], r[0], q), P_.add(tt.c[1], r[1], q)] }; };
    E.mul = (a, b) => E.relin(E.tensor(a, b));
    E.rotate = ct => { const r = E.ks(P_.auto(ct.c[1], 5), E.K.rot[5]); return { c: [P_.add(P_.auto(ct.c[0], 5), r[0], q), r[1]] }; };
    E.ctBytes = () => 2*N*Number(LS.bits(q-1n))/8;
    return E;
  }
};

/* ---------------- BGV: c0 + c1·s = m + t·e (mod q_l), message in the LOW bits, prime chain q_l = p_0 ⋯ p_l ---------------- */
window.BGV = {
  make(o={}){
    const N = o.N||4, t = o.t||257n, L = o.levels??10, pb = BigInt(o.primeBits||31), vec = f => Array.from({length:N}, f), slots = EXACT.batch(N, t);
    /* primes ≡ 1 (mod t) so modulus switching does not rescale the message */
    const primes = []; let cand = ((1n<<pb)/t)*t + 1n; while(primes.length < L+1){ if(isProbPrime(cand)) primes.push(cand); cand -= t; if(cand % 2n === 0n) cand -= t; }
    const ps = primes.slice(0, L+1);
    const q = []; let acc = 1n; for(let l=0;l<=L;l++){ acc *= ps[l]; q.push(acc); }
    /* key-switching modulus larger than q_L (a power of two works because t is odd) */
    const Pm = 1n << BigInt(LS.bits(q[L]) + 20);
    const tInvMod = (m) => LS.invmod(t, m);
    const E = { scheme:"BGV", N, t, q, L, primes: ps, P: Pm, slots, K:null };
    E.encode = v => slots.encode(v); E.decodeSlots = m => slots.decode(m);
    E.keygen = () => { let s; do{ s = vec(() => LS.tern()); }while(s.every(v => v === 0n));
      const Q = q[L], PQ = Pm*Q, a = vec(() => LS.randBig(Q)), e = vec(() => LS.smallErr());
      const swk = sp => { const a2 = vec(() => LS.randBig(PQ)), e2 = vec(() => LS.smallErr()); return [P_.neg(P_.mul(a2, s, PQ)).map((v,i) => LS.cmod(v + t*e2[i] + Pm*sp[i], PQ)), a2]; };
      E.K = { s, pk:[P_.add(P_.neg(P_.mul(a, s, Q)), e.map(v => t*v), Q), a], rlk: swk(P_.mul(s, s, null)), rot:{ 5: swk(P_.auto(s, 5)) } }; return E.K; };
    E.encrypt = m => { const Q = q[L], u = vec(() => LS.tern()), e0 = vec(() => LS.smallErr()), e1 = vec(() => LS.smallErr());
      return { c:[P_.add(P_.add(P_.mul(E.K.pk[0], u, Q), e0.map(v => t*v), Q), m, Q), P_.add(P_.mul(E.K.pk[1], u, Q), e1.map(v => t*v), Q)], l:L }; };
    E.phase = ct => { const m = q[ct.l]; let acc = ct.c[0].slice(), sp = E.K.s; for(let i=1;i<ct.c.length;i++){ acc = P_.add(acc, P_.mul(ct.c[i], sp, m), m); sp = P_.mul(sp, E.K.s, null); } return P_.red(acc, m); };
    E.decryptPoly = ct => E.phase(ct).map(v => LS.cmod(v, t));
    E.decrypt = ct => slots.decode(E.decryptPoly(ct));
    E.noise = ct => E.phase(ct).reduce((mx, v) => { const a = v < 0n ? -v : v; return a > mx ? a : mx; }, 0n);
    E.budget = ct => Math.max(0, LS.bits(q[ct.l]/2n) - LS.bits(E.noise(ct)));
    /* divide by d keeping the value mod t: c' = (c + δ)/d with δ ≡ −c (mod d), δ ≡ 0 (mod t) */
    E.divT = (v, d) => { const k = LS.cmod(-v * tInvMod(d), d); return (v + t*k) / d; };
    E.modSwitch = (ct, to) => { to = to ?? ct.l-1; let c = ct.c.map(p => P_.red(p, q[ct.l])), l = ct.l;
      while(l > to){ const p = ps[l]; c = c.map(poly => P_.red(poly.map(v => E.divT(v, p)), q[l-1])); l--; } return { c, l }; };
    E.align = (a, b) => a.l === b.l ? [a, b] : a.l > b.l ? [E.modSwitch(a, b.l), b] : [a, E.modSwitch(b, a.l)];
    E.add = (a, b) => { [a, b] = E.align(a, b); return { c: a.c.map((p,i) => P_.add(p, b.c[i], q[a.l])), l: a.l }; };
    E.sub = (a, b) => { [a, b] = E.align(a, b); return { c: a.c.map((p,i) => P_.sub(p, b.c[i], q[a.l])), l: a.l }; };
    E.addPlain = (ct, m) => ({ c: [P_.add(ct.c[0], m.map(v => LS.cmod(v, t)), q[ct.l]), ...ct.c.slice(1)], l: ct.l });
    E.mulPlain = (ct, m) => { const mm = m.map(v => LS.cmod(v, t)); return { c: ct.c.map(p => P_.mul(p, mm, q[ct.l])), l: ct.l }; };
    E.mulScalar = (ct, k) => { k = LS.cmod(BigInt(k), t); return { c: ct.c.map(p => P_.scal(p, k, q[ct.l])), l: ct.l }; };
    E.ks = (d, key, l) => { const m = Pm*q[l], dd = P_.red(d, q[l]); return [P_.mul(dd, P_.red(key[0], m), m), P_.mul(dd, P_.red(key[1], m), m)].map(x => P_.red(x.map(v => E.divT(LS.cmod(v, m), Pm)), q[l])); };
    E.tensor = (a, b) => { [a, b] = E.align(a, b); const m = q[a.l]; return { c: [P_.mul(a.c[0], b.c[0], m), P_.add(P_.mul(a.c[0], b.c[1], m), P_.mul(a.c[1], b.c[0], m), m), P_.mul(a.c[1], b.c[1], m)], l: a.l }; };
    E.relin = tt => { const r = E.ks(tt.c[2], E.K.rlk, tt.l), m = q[tt.l]; return { c: [P_.add(tt.c[0], r[0], m), P_.add(tt.c[1], r[1], m)], l: tt.l }; };
    E.mul = (a, b) => { const r = E.relin(E.tensor(a, b)); return r.l > 0 ? E.modSwitch(r) : r; };
    E.rotate = ct => { const r = E.ks(P_.auto(ct.c[1], 5), E.K.rot[5], ct.l), m = q[ct.l]; return { c: [P_.add(P_.auto(ct.c[0], 5), r[0], m), r[1]], l: ct.l }; };
    return E;
  }
};
/* ---------------- Generalized BFV: plaintext modulus t(X) = X^k − b ----------------
   Plaintexts Z[X]/(X^N + 1, X^k − b) ≅ Z_p[X]/(X^k − b) with p = b^(N/k) + 1.
   k = N gives BFV with t = b + 1; k = 1 gives CLPX (one huge slot mod b^N + 1). */
window.GBFV = {
  make(o={}){
    const N = o.N||4, k = o.k||1, b = o.b||256n, q = 1n << BigInt(o.qBits||160), vec = f => Array.from({length:N}, f);
    const mB = BigInt(N/k), p = b**mB + 1n;
    const g = vec(() => 0n); for(let i=0;i<N/k;i++) g[i*k] = b**(mB-1n-BigInt(i));   /* (X^k − b)·g = −p */
    const Dpoly = g.map(v => LS.rdiv(-q*v, p));
    const tpoly = vec((_, i) => i===0 ? -b : i===k ? 1n : 0n); if(k === N){ tpoly.fill(0n); tpoly[0] = -b-1n; }   /* X^N = −1 */
    /* slot roots: ρ^k ≡ b (mod p) */
    let roots = [];
    if(k === 1) roots = [b];
    else if(p < (1n<<20n)) { for(let r=1n; r<p && roots.length<k; r++) if(LS.powmod(r, BigInt(k), p) === LS.mod(b, p)) roots.push(r); }
    const E = { scheme: k===N?"BFV":k===1?"CLPX":"GBFV", N, k, b, q, p, Dpoly, tpoly, roots, K:null };
    const digits = (A) => { let r = LS.cmod(A, p); const d = []; for(let l=0;l<Number(mB);l++){ const dl = LS.cmod(r, b); d.push(dl); r = (r - dl)/b; } if(r !== 0n) d[0] -= r;   /* wrap-around: b^m ≡ −1 */ return d; };
    /* A_j (j < k) → low-norm polynomial: coefficient of X^(j + l·k) is digit l of A_j */
    E.fromA = A => { const m = vec(() => 0n); A.forEach((Aj, j) => digits(Aj).forEach((d, l) => { m[j + l*k] = d; })); return m; };
    E.toA = m => { const A = new Array(k).fill(0n); for(let i=0;i<N;i++){ const j = i % k, l = BigInt((i - j)/k); A[j] = LS.mod(A[j] + m[i]*LS.powmod(b, l, p), p); } return A; };
    E.slotsOf = m => { const A = E.toA(m); return roots.map(r => { let v = 0n; for(let j=k-1;j>=0;j--) v = (v*r + A[j]) % p; return LS.cmod(v, p); }); };
    E.encodeSlots = v => { /* solve Vandermonde V·A = v mod p */ const M = roots.map((r,i) => { const row = []; for(let j=0;j<k;j++) row.push(LS.powmod(r, BigInt(j), p)); row.push(LS.mod(BigInt(v[i]), p)); return row; });
      for(let c=0;c<k;c++){ let piv = M.findIndex((row,i) => i>=c && row[c] !== 0n); [M[c], M[piv]] = [M[piv], M[c]]; const inv = LS.invmod(M[c][c], p); M[c] = M[c].map(x => x*inv % p);
        for(let i=0;i<k;i++) if(i!==c && M[i][c] !== 0n){ const f = M[i][c]; M[i] = M[i].map((x,j) => LS.mod(x - f*M[c][j], p)); } }
      return E.fromA(M.map(row => row[k])); };
    E.encodeConst = c => E.fromA([BigInt(c), ...new Array(k-1).fill(0n)]);
    E.keygen = () => { let s; do{ s = vec(() => LS.tern()); }while(s.every(v => v === 0n)); const a = vec(() => LS.randBig(q)), e = vec(() => LS.smallErr());
      E.K = { s, pk:[P_.add(P_.neg(P_.mul(a, s, q)), e, q), a] }; return E.K; };
    E.encrypt = m => { const u = vec(() => LS.tern()), e0 = vec(() => LS.smallErr()), e1 = vec(() => LS.smallErr());
      return { c:[P_.add(P_.add(P_.mul(E.K.pk[0], u, q), e0, q), P_.mul(Dpoly, m, q), q), P_.add(P_.mul(E.K.pk[1], u, q), e1, q)] }; };
    E.phase = ct => P_.add(ct.c[0], P_.mul(ct.c[1], E.K.s, q), q);
    E.decryptPoly = ct => P_.mul(E.phase(ct), tpoly, null).map(v => LS.rdiv(v, q));
    E.decrypt = ct => E.slotsOf(E.decryptPoly(ct));
    E.noiseT = ct => { const r = P_.mul(E.phase(ct), tpoly, null); let mx = 0n; r.forEach(v => { let d = v - LS.rdiv(v, q)*q; if(d<0n) d=-d; if(d>mx) mx = d; }); return mx; };  /* |t(X)·v| */
    E.budget = ct => Math.max(0, LS.bits(q/2n) - LS.bits(E.noiseT(ct)));
    E.add = (a, c) => ({ c: a.c.map((pp,i) => P_.add(pp, c.c[i], q)) });
    E.addPlain = (ct, m) => ({ c: [P_.add(ct.c[0], P_.mul(Dpoly, m, q), q), ct.c[1]] });
    E.mulPlain = (ct, m) => ({ c: ct.c.map(pp => P_.mul(pp, m, q)) });
    return E;
  }
};
window.CLPX = { make: o => GBFV.make(Object.assign({k:1}, o)) };

/* ---------------- Module-LWE BFV-style toy (ModHE): rank k over a ring of degree n ---------------- */
window.MLWE = {
  make(o={}){
    const n = o.n||2, k = o.k||2, t = o.t||257n, q = 1n << BigInt(o.qBits||40), D = q/t, vec = f => Array.from({length:n}, f);
    const E = { n, k, t, q, D, K:null };
    E.keygen = () => { const s = []; for(let i=0;i<k;i++){ let si; do{ si = vec(() => LS.tern()); }while(si.every(v=>v===0n)); s.push(si); } E.K = { s }; return E.K; };
    E.encrypt = m => { const a = Array.from({length:k}, () => vec(() => LS.randBig(q))), e = vec(() => LS.smallErr());
      let as = vec(() => 0n); for(let i=0;i<k;i++) as = P_.add(as, P_.mul(a[i], E.K.s[i], q), q);
      return { b: P_.add(P_.add(P_.neg(as), e, q), m.map(v => LS.cmod(v,t)*D), q), a }; };
    E.phase = ct => { let acc = ct.b.slice(); for(let i=0;i<k;i++) acc = P_.add(acc, P_.mul(ct.a[i], E.K.s[i], q), q); return P_.red(acc, q); };
    E.decrypt = ct => E.phase(ct).map(v => LS.cmod(LS.rdiv(v*t, q), t));
    E.add = (x, y) => ({ b: P_.add(x.b, y.b, q), a: x.a.map((p,i) => P_.add(p, y.a[i], q)) });
    E.scal = (x, c) => ({ b: P_.scal(x.b, c, q), a: x.a.map(p => P_.scal(p, c, q)) });
    E.addPlain = (x, m) => ({ b: P_.add(x.b, m.map(v => LS.cmod(v,t)*D), q), a: x.a });
    return E;
  }
};
})();
