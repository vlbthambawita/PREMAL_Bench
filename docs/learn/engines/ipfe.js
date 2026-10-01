/* Toy inner-product functional encryption (Abdalla–Bourse–De Caro–Pointcheval, DDH variant) and the
   distributed discrete-log step of DDH-based HSS (Boyle–Gilboa–Ishai), in the order-q subgroup of Z_p*,
   p = 2q + 1 a 41-bit safe prime. Needs lesson.js, sha256.js. */
(function(){
"use strict";
const p = 1099511628443n, q = 549755814221n, g = 4n;
const pw = (b,e) => LS.powmod(b, LS.mod(e, q), p);
const rq = () => 1n + LS.randBig(q - 1n);
const IPFE = window.IPFE = { p, q, g, pw, rq };
IPFE.setup = l => { const s = Array.from({length:l}, rq); return { msk:s, mpk:s.map(si => pw(g, si)) }; };
IPFE.encrypt = (mpk, x) => { const r = rq(); return { r, ct0: pw(g, r), ct: mpk.map((h,i) => pw(h, r) * pw(g, BigInt(x[i])) % p) }; };
IPFE.keygen = (msk, y) => LS.mod(msk.reduce((a,si,i) => a + si*BigInt(y[i]), 0n), q);
IPFE.decrypt = (C, sk, y, range=4000) => { let num = 1n; C.ct.forEach((c,i) => num = num * pw(c, BigInt(y[i])) % p);
  const gz = num * LS.invmod(pw(C.ct0, sk), p) % p; let steps = 0;
  // small discrete log: try 0, ±1, ±2, ...
  let up = 1n, dn = 1n; const ginv = LS.invmod(g, p);
  for(let k=0;k<=range;k++){ steps++; if(up === gz) return {gz, z:k, steps}; if(dn === gz) return {gz, z:-k, steps}; up = up*g % p; dn = dn*ginv % p; }
  return {gz, z:null, steps}; };
/* distributed discrete log: walk until a distinguished point (hash byte 0 == 0 and byte 1 < limit) */
IPFE.dist = (h, limit=1) => { const b = SHA256.hash(SHA256.utf8(h.toString())); return b[0] < limit; };
IPFE.walk = (h, maxSteps=20000, limit=1) => { let x = h, i = 0; while(i < maxSteps){ if(IPFE.dist(x, limit)) return {i, point:x}; x = x*g % p; i++; } return {i:null, point:null}; };
})();
