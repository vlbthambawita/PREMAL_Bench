/* Extra toy-CKKS tools for lessons 2, 9, 11, 12. Requires lesson.js and engines/ckks.js. */
(function(){
"use strict";
const P_ = LS.poly;
const X = window.CKKSX = {};
/* small primes p ≡ 1 (mod 2N) near 2^bits, searching downward */
X.isPrime = n => { n = BigInt(n); if(n < 2n) return false; for(const p of [2n,3n,5n,7n,11n,13n]){ if(n === p) return true; if(n % p === 0n) return false; }
  let d = n-1n, r = 0; while(d % 2n === 0n){ d /= 2n; r++; }
  for(const a of [2n,3n,5n,7n,11n,13n,17n,19n,23n]){ let x = LS.powmod(a, d, n); if(x === 1n || x === n-1n) continue; let ok = false; for(let i=1;i<r;i++){ x = x*x % n; if(x === n-1n){ ok = true; break; } } if(!ok) return false; } return true; };
X.primesNear = (bits, count, twoN, avoid=[]) => { const out = []; let c = (1n<<BigInt(bits)) + 1n; while(out.length < count){ c -= BigInt(twoN); if(c % BigInt(twoN) !== 1n) c -= (c - 1n) % BigInt(twoN); if(X.isPrime(c) && !avoid.includes(c)) out.push(c); } return out; };
X.primesAbove = (bits, count, twoN, avoid=[]) => { const out = []; let c = (1n<<BigInt(bits)) + 1n; while(out.length < count){ if(X.isPrime(c) && !avoid.includes(c)) out.push(c); c += BigInt(twoN); } return out; };
/* CRT */
X.crt = (res, primes) => { const Q = primes.reduce((a,b)=>a*b, 1n); let x = 0n; res.forEach((r,i) => { const Qi = Q/primes[i]; x += BigInt(r) * Qi * LS.invmod(Qi % primes[i], primes[i]); }); return LS.cmod(x, Q); };
/* inverse of a polynomial in Z_{2^k}[X]/(X^N+1) by Hensel lifting; returns null if not invertible */
X.polyInvPow2 = (c, k) => { const N = c.length, mod = 1n<<BigInt(k);
  const c2 = c.map(v => LS.mod(v, 2n)); if(c2.reduce((a,b)=>a+b, 0n) % 2n === 0n) return null;
  // brute-force inverse mod 2 (N ≤ 16 in our toys)
  let inv = null; for(let mask=0; mask < (1<<N) && !inv; mask++){ const t = Array.from({length:N}, (_,i) => BigInt((mask>>i)&1)); const pr = P_.mul(c2, t).map(v => LS.mod(v, 2n)); if(pr[0] === 1n && pr.slice(1).every(v => v === 0n)) inv = t; }
  if(!inv) return null; let m = 2n;
  while(m < mod){ m = m*m > mod ? mod : m*m; const ci = P_.mul(c, inv).map(v => LS.mod(v, m)); const two = ci.map((v,i) => LS.mod((i===0?2n:0n) - v, m)); inv = P_.mul(inv, two).map(v => LS.mod(v, m)); }
  return inv.map(v => LS.mod(v, mod)); };
/* switching key: lets a ciphertext component multiplied by sFrom be re-expressed under sTo */
X.swkFromTo = (C, sFrom, sTo) => { const PQ = C.P*C.q[C.L], a = Array.from({length:C.N}, () => LS.randBig(PQ)), e = Array.from({length:C.N}, () => LS.smallErr());
  return [P_.neg(P_.mul(a, sTo, PQ)).map((v,i) => LS.cmod(v + e[i] + C.P*sFrom[i], PQ)), a]; };
/* multi-key ciphertexts: map "i,j" (powers of s1,s2) -> polynomial, at level l */
X.mk = {
  fromCt: (ct, party) => ({ l: ct.l, c: { "0,0": ct.c[0], [party===1?"1,0":"0,1"]: ct.c[1] } }),
  add: (A, B, C) => { const m = C.q[A.l], out = { ...A.c }; for(const k in B.c) out[k] = out[k] ? P_.add(out[k], B.c[k], m) : B.c[k].slice(); return { l: A.l, c: out }; },
  mul: (A, B, C) => { const m = C.q[A.l], out = {}; for(const ka in A.c) for(const kb in B.c){ const [i1,j1] = ka.split(",").map(Number), [i2,j2] = kb.split(",").map(Number), k = (i1+i2)+","+(j1+j2); const p = P_.mul(A.c[ka], B.c[kb], m); out[k] = out[k] ? P_.add(out[k], p, m) : p; } return { l: A.l, c: out }; },
  mulPt: (A, pt, C) => { const m = C.q[A.l], out = {}; for(const k in A.c) out[k] = P_.mul(A.c[k], pt, m); return { l: A.l, c: out }; },
  addPt: (A, pt, C) => { const m = C.q[A.l], out = { ...A.c }; out["0,0"] = out["0,0"] ? P_.add(out["0,0"], pt, m) : P_.red(pt, m); return { l: A.l, c: out }; },
  rescale: (A, C) => { const out = {}; for(const k in A.c) out[k] = P_.red(P_.red(A.c[k], C.q[A.l]).map(v => LS.rdiv(v, C.D)), C.q[A.l-1]); return { l: A.l-1, c: out }; },
  down: (A, C, to) => { to = to ?? A.l-1; const out = {}; for(const k in A.c) out[k] = P_.red(A.c[k], C.q[to]); return { l: to, c: out }; },
  dec: (A, C, s1, s2) => { const m = C.q[A.l]; let acc = new Array(C.N).fill(0n); for(const k in A.c){ const [i,j] = k.split(",").map(Number); let mono = [1n, ...new Array(C.N-1).fill(0n)]; for(let t=0;t<i;t++) mono = P_.mul(mono, s1, m); for(let t=0;t<j;t++) mono = P_.mul(mono, s2, m); acc = P_.add(acc, P_.mul(A.c[k], mono, m), m); } return acc; },
  size: A => Object.keys(A.c).length
};
})();
