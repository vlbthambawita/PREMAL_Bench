/* Toy early FHE schemes (insecure sizes, real algebra). Requires lesson.js and engines/phe.js (Miller–Rabin).
   DGHV over the integers, BV11 LWE with relinearization and modulus switching, LTV over NTRU,
   and Smart–Vercauteren CRT slot packing. */
(function(){
"use strict";
const {mod, cmod, powmod, invmod} = LS;
const EARLY = window.EARLY = {};
const randSigned = bits => { const v = LS.randBig(1n<<BigInt(bits+1)); return v - (1n<<BigInt(bits)); };
const randOdd = bits => (LS.randBig(1n<<BigInt(bits-1)) | (1n<<BigInt(bits-1))) | 1n;

/* ---------- DGHV: c = m + t·r + p·q, secret odd p ---------- */
EARLY.dghv = function(o={}){ const t = BigInt(o.t||257), p = randOdd(o.pBits||100), qBits = o.qBits||160, rBits = o.rBits||8;
  const D = { t, p };
  D.enc = m => { const r = randSigned(rBits), q = LS.randBig(1n<<BigInt(qBits)); return { c: mod(m, t) + t*r + p*q, r, q }; };
  D.noise = c => cmod(c, p);                                // m + t·r (small while decryptable)
  D.dec = c => cmod(D.noise(c), t);
  D.noiseBits = c => LS.bits(D.noise(c));
  return D; };

/* ---------- BV11-style symmetric LWE with plaintext modulus t: b = <a,s> + t·e + m ---------- */
EARLY.lwe = function(o={}){ const n = o.n||4, t = BigInt(o.t||257);
  const findQ = bits => { let k = (1n<<BigInt(bits)) / t; for(;;){ const q = k*t + 1n; if(PHE.isPrime(q)) return q; k++; } };   // q ≡ 1 mod t
  const q = findQ(o.qBits||40), q2 = findQ(o.q2Bits||20), logq = q.toString(2).length;
  const s = Array.from({length:n}, () => LS.tern());
  const L = { n, t, q, q2, s, logq };
  const dot = (a, v) => a.reduce((acc, x, i) => acc + x*v[i], 0n);
  L.enc = (m, Q=q) => { const a = Array.from({length:n}, () => mod(LS.randBig(Q), Q)), e = LS.smallErr(); return { a, b: mod(dot(a, s) + t*e + m, Q), q: Q }; };
  L.phase = ct => cmod(ct.b - dot(ct.a, s), ct.q);           // m + t·e
  L.dec = ct => cmod(L.phase(ct), t);
  L.noiseBits = ct => LS.bits(L.phase(ct));
  L.add = (x, y) => ({ a: x.a.map((v,i) => mod(v + y.a[i], x.q)), b: mod(x.b + y.b, x.q), q: x.q });
  L.scal = (x, k) => ({ a: x.a.map(v => mod(v*k, x.q)), b: mod(x.b*k, x.q), q: x.q });
  /* relinearization key: Enc(s_i s_j 2^k) for i ≤ j and k < logq */
  L.rlk = {}; for(let i=0;i<n;i++) for(let j=i;j<n;j++) for(let k=0;k<logq;k++) L.rlk[i+","+j+","+k] = L.enc(mod(s[i]*s[j]*(1n<<BigInt(k)), q));
  L.rlkSize = Object.keys(L.rlk).length;
  /* tensor: phase1·phase2 = b1b2 − b1<a2,s> − b2<a1,s> + Σ a1_i a2_j s_i s_j */
  L.tensor = (x, y) => { const quad = {}; for(let i=0;i<n;i++) for(let j=i;j<n;j++){ let v = x.a[i]*y.a[j]; if(i !== j) v += x.a[j]*y.a[i]; quad[i+","+j] = mod(v, q); }
    return { c0: mod(x.b*y.b, q), lin: x.a.map((v,i) => mod(x.b*y.a[i] + y.b*v, q)), quad, q }; };
  L.decTensor = T => { let v = T.c0 - dot(T.lin, s); for(const k in T.quad){ const [i,j] = k.split(",").map(Number); v += T.quad[k]*s[i]*s[j]; } return cmod(v, q); };
  L.relin = T => { let out = { a: T.lin.slice(), b: T.c0, q };
    for(const key in T.quad){ const v = T.quad[key]; for(let k=0;k<logq;k++){ if((v >> BigInt(k)) & 1n){ const r = L.rlk[key+","+k]; out = { a: out.a.map((x,i) => mod(x + r.a[i], q)), b: mod(out.b + r.b, q), q }; } } }
    return out; };
  /* modulus switching q → q2, keeping every coefficient ≡ mod t */
  const sw = x => { const xc = cmod(x, q), y = LS.rdiv(xc*q2, q); const d = cmod(xc - y, t); return mod(y + d, q2); };
  L.modSwitch = ct => ({ a: ct.a.map(sw), b: sw(ct.b), q: q2 });
  return L; };

/* ---------- LTV over NTRU: R_q = Z_q[X]/(X^N + 1), f = 1 + t·f', h = t·g·f⁻¹ ---------- */
EARLY.ltv = function(o={}){ const N = o.N||8, t = BigInt(o.t||257), M = BigInt(2*N);
  let q = ((1n<<BigInt(o.qBits||61)) / M)*M + 1n; while(!PHE.isPrime(q)) q += M;               // q ≡ 1 mod 2N
  let w; for(let a=2n;;a++){ w = powmod(a, (q-1n)/M, q); if(powmod(w, BigInt(N), q) === q-1n) break; }   // primitive 2N-th root
  const roots = Array.from({length:N}, (_,k) => powmod(w, BigInt(2*k+1), q));
  const ev = (p, r) => p.reduce((acc, c, i) => mod(acc + c*powmod(r, BigInt(i), q), q), 0n);
  const invN = invmod(BigInt(N), q);
  const inv = p => { const vals = roots.map(r => ev(p, r)); if(vals.some(v => v === 0n)) return null; const iv = vals.map(v => invmod(v, q));
    return Array.from({length:N}, (_,j) => mod(invN * iv.reduce((acc, v, k) => acc + v*powmod(invmod(roots[k], q), BigInt(j), q), 0n), q)); };
  const P = LS.poly, small = () => Array.from({length:N}, () => LS.tern());
  let f, fi, g; do{ const fp = small(); f = fp.map((c,i) => t*c + (i===0?1n:0n)); fi = inv(f); }while(!fi);
  g = small(); const h = P.mul(P.scal(g, t, q), fi, q);
  const T = { N, t, q, f, g, h };
  T.enc = m => { const s = small(), e = small(), mp = Array.from({length:N}, (_,i) => i===0 ? mod(m, t) : 0n); return P.add(P.add(P.mul(h, s, q), P.scal(e, t, q), q), mp, q); };
  T.add = (a,b) => P.add(a, b, q); T.scal = (a,k) => P.scal(a, k, q); T.mul = (a,b) => P.mul(a, b, q);
  T.addConst = (a,k) => { const r = a.slice(); r[0] = cmod(r[0] + k, q); return r; };
  T.phase = (c, deg=1) => { let key = f; for(let i=1;i<deg;i++) key = P.mul(key, f, q); return P.mul(key, c, q); };
  T.dec = (c, deg=1) => cmod(T.phase(c, deg)[0], t);
  T.noiseBits = (c, deg=1) => Math.max(...T.phase(c, deg).map(v => LS.bits(v)));
  return T; };

/* ---------- Smart–Vercauteren style CRT packing: Z_t[X]/(X^4 + 1) with t ≡ 1 mod 8 ---------- */
EARLY.packing = function(t=17n){ const N = 4; let z; for(let a=2n;;a++){ z = a; if(powmod(a, 4n, t) === t-1n) break; }
  const roots = [1,3,5,7].map(k => powmod(z, BigInt(k), t));
  const ev = (p, r) => p.reduce((acc, c, i) => mod(acc + c*powmod(r, BigInt(i), t), t), 0n);
  const invN = invmod(BigInt(N), t);
  const encode = v => Array.from({length:N}, (_,j) => mod(invN * v.reduce((acc, x, k) => acc + BigInt(x)*powmod(invmod(roots[k], t), BigInt(j), t), 0n), t));
  const decode = p => roots.map(r => ev(p, r));
  return { t, roots, encode, decode, mul: (a,b) => LS.poly.mul(a, b, null).map(v => mod(v, t)) }; };
})();
