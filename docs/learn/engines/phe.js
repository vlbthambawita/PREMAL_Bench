/* Toy partially homomorphic schemes (insecure sizes, real algebra): Paillier, Damgård–Jurik (s = 2),
   textbook RSA, exponential ElGamal, Goldwasser–Micali, plus two clearly-labelled models:
   BGN "exponent model" and a Castagnos–Laguillaumie-style scheme in the analogue group (Z/p²Z)*.
   Requires lesson.js (LS helpers). */
(function(){
"use strict";
const {mod, powmod, invmod, egcd} = LS;
const MR_BASES = [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n];
function isPrime(n){ if(n < 2n) return false; for(const p of MR_BASES){ if(n === p) return true; if(n % p === 0n) return false; }
  let d = n-1n, r = 0; while((d & 1n) === 0n){ d >>= 1n; r++; }
  for(const a of MR_BASES){ let x = powmod(a, d, n); if(x === 1n || x === n-1n) continue; let ok = false; for(let i=1;i<r;i++){ x = x*x % n; if(x === n-1n){ ok = true; break; } } if(!ok) return false; } return true; }
function randBits(bits){ let x = 0n; for(let i=0;i<bits;i+=16) x = (x<<16n) | BigInt(Math.floor(LS.rng()*65536)); x = x & ((1n<<BigInt(bits))-1n); return x | (1n<<BigInt(bits-1)); }
function randPrime(bits, cond){ for(let i=0;i<200000;i++){ const c = randBits(bits) | 1n; if((!cond || cond(c)) && isPrime(c)) return c; } throw new Error("no prime"); }
const gcd = (a,b) => egcd(a,b)[0], lcm = (a,b) => a/gcd(a,b)*b;
const randUnit = n => { for(;;){ const r = mod(LS.randBig(n), n); if(r > 1n && gcd(r, n) === 1n) return r; } };
const center = (v, n) => v > n/2n ? v - n : v;
const PHE = window.PHE = { isPrime, randPrime, randUnit, center, gcd, lcm };

/* ---------- Paillier ---------- */
PHE.paillier = function(bits=32){
  let p, q; do{ p = randPrime(bits); q = randPrime(bits); }while(p === q || gcd(p*q, (p-1n)*(q-1n)) !== 1n);
  const n = p*q, n2 = n*n, lam = lcm(p-1n, q-1n), g = n+1n;
  const L = u => (u-1n)/n, mu = invmod(L(powmod(g, lam, n2)), n);
  const K = { p, q, n, n2, lam, mu, g };
  K.enc = (m, r) => { r = r || randUnit(n); return { c: mod((1n + mod(m,n)*n) % n2 * powmod(r, n, n2), n2), r }; };
  K.dec = c => mod(L(powmod(c, lam, n2)) * mu, n);
  K.decS = c => center(K.dec(c), n);
  K.add = (a, b) => a*b % n2;
  K.addConst = (a, k) => a * mod(1n + mod(k,n)*n, n2) % n2;
  K.mulConst = (a, k) => k >= 0n ? powmod(a, k, n2) : powmod(invmod(a, n2), -k, n2);
  return K;
};
/* ---------- Damgård–Jurik, s = 2 (plaintext mod n², ciphertext mod n³) ---------- */
PHE.dj = function(K){
  const n = K.n, n2 = n*n, n3 = n2*n, lam = K.lam;
  const D = { n, n2, n3 };
  D.enc = (m, r) => { r = r || randUnit(n); return mod(powmod(n+1n, mod(m, n2), n3) * powmod(r, n2, n3), n3); };
  const Lf = u => (u-1n)/n;
  function dlog1n(a){ /* a = (1+n)^i mod n^3, return i mod n^2 (Damgård–Jurik extraction) */
    let i = 0n; const s = 2;
    for(let j=1;j<=s;j++){ const nj = n**BigInt(j); let t1 = Lf(mod(a, n**BigInt(j+1))), t2 = i;
      for(let k=2;k<=j;k++){ i = i-1n; t2 = mod(t2*i, nj); let kf = 1n; for(let u=2n;u<=BigInt(k);u++) kf *= u; t1 = mod(t1 - t2*(n**BigInt(k-1))*invmod(kf, nj), nj); }
      i = t1; }
    return i; }
  D.dec = c => { const a = powmod(c, lam, n3); const i = dlog1n(a); return mod(i * invmod(lam, n2), n2); };
  D.decS = c => center(D.dec(c), n2);
  D.add = (a,b) => a*b % n3;
  D.mulConst = (a,k) => k >= 0n ? powmod(a, k, n3) : powmod(invmod(a, n3), -k, n3);
  D.addConst = (a,k) => a * powmod(n+1n, mod(k, n2), n3) % n3;
  return D;
};
/* ---------- textbook RSA ---------- */
PHE.rsa = function(bits=32){ const e = 65537n; let p, q, phi; do{ p = randPrime(bits); q = randPrime(bits); phi = (p-1n)*(q-1n); }while(p === q || gcd(e, phi) !== 1n);
  const n = p*q, d = invmod(e, phi); return { p, q, n, e, d, enc: m => powmod(mod(m,n), e, n), dec: c => powmod(c, d, n), mul: (a,b) => a*b % n }; };
/* ---------- exponential ElGamal in the order-q subgroup of Z_p*, p = 2q + 1 ---------- */
PHE.elgamal = function(bits=40){ let q, p; for(;;){ q = randPrime(bits); p = 2n*q + 1n; if(isPrime(p)) break; }
  let g; do{ g = powmod(mod(LS.randBig(p), p), 2n, p); }while(g <= 1n);
  const x = mod(LS.randBig(q-2n), q-2n) + 1n, h = powmod(g, x, p);
  const E = { p, q, g, x, h };
  E.enc = (m, r) => { r = r || (mod(LS.randBig(q-2n), q-2n) + 1n); return [powmod(g, r, p), powmod(g, mod(m, q), p) * powmod(h, r, p) % p]; };
  E.add = (a, b) => [a[0]*b[0] % p, a[1]*b[1] % p];
  E.mulConst = (a, k) => [powmod(a[0], mod(k, q), p), powmod(a[1], mod(k, q), p)];
  E.addConst = (a, k) => [a[0], a[1] * powmod(g, mod(k, q), p) % p];
  E.decG = c => c[1] * invmod(powmod(c[0], x, p), p) % p;          // g^m
  E.dlog = (gm, range=1000) => { let acc = 1n; const gi = invmod(g, p); let neg = 1n;          // small-range discrete log
    for(let m=0;m<=range;m++){ if(acc === gm) return {m, tries: 2*m+1}; if(neg === gm) return {m:-m, tries: 2*m+2}; acc = acc*g % p; neg = neg*gi % p; } return {m:null, tries: 2*range+2}; };
  return E; };
/* ---------- Goldwasser–Micali with Blum primes, y = n − 1 ---------- */
PHE.gm = function(bits=32){ let p, q; do{ p = randPrime(bits, c => c % 4n === 3n); q = randPrime(bits, c => c % 4n === 3n); }while(p === q);
  const n = p*q, y = n-1n; return { p, q, n, y, enc: b => { const r = randUnit(n); return mod((b ? y : 1n) * r % n * r, n); }, xor: (a,b) => a*b % n,
    dec: c => powmod(mod(c,p), (p-1n)/2n, p) === 1n ? 0 : 1 }; };
/* ---------- BGN exponent model (insecure: tracks exponents instead of curve points) ---------- */
PHE.bgnModel = function(bits=20){ let q1, q2; do{ q1 = randPrime(bits); q2 = randPrime(bits); }while(q1 === q2);
  const n = q1*q2; const B = { q1, q2, n };
  B.enc = m => mod(m + q2*mod(LS.randBig(n), n), n);              // exponent of g^m·h^r, with h = g^{q2}
  B.add = (a,b) => mod(a+b, n); B.mulConst = (a,k) => mod(a*k, n);
  B.pair = (a,b) => mod(a*b + q2*mod(LS.randBig(n),n), n);        // exponent of e(c1,c2)·e(g,h)^r'
  B.dec = c => center(mod(c*q1, n)/q1, q2);                         // (c·q1 mod n)/q1 = m  (discrete log in the order-q1 part)
  return B; };
/* ---------- Castagnos–Laguillaumie framework in the analogue group (Z/p²Z)* (insecure: group order known) ---------- */
PHE.clAnalogue = function(bits=32){ const p = randPrime(bits), p2 = p*p, f = 1n + p;      // f has order p, DL in <f> is easy: f^m = 1 + m·p
  let g; do{ g = powmod(mod(LS.randBig(p2), p2), p, p2); }while(g <= 1n);                  // g^p lands in the order-(p−1) part
  const x = mod(LS.randBig(p), p-2n) + 1n, h = powmod(g, x, p2);
  const C = { p, p2, f, g, x, h };
  C.enc = m => { const r = mod(LS.randBig(p), p-2n) + 1n; return [powmod(g, r, p2), powmod(f, mod(m,p), p2) * powmod(h, r, p2) % p2]; };
  C.add = (a,b) => [a[0]*b[0] % p2, a[1]*b[1] % p2];
  C.mulConst = (a,k) => [powmod(a[0], mod(k, p*(p-1n)), p2), powmod(a[1], mod(k, p*(p-1n)), p2)];
  C.addConst = (a,k) => [a[0], a[1]*powmod(f, mod(k,p), p2) % p2];
  C.dec = c => { const fm = c[1] * invmod(powmod(c[0], x, p2), p2) % p2; return center(mod((fm - 1n)/p, p), p); };
  return C; };
})();
