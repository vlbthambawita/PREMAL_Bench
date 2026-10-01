/* Toy TFHE engine (insecure sizes, real algebra). Requires lesson.js (LS.rng).
   Q = 2^32 everywhere, LWE dimension n (default 4, binary key), ring N (default 256, binary key),
   plaintext p = 32 with a padding bit (Δ = Q/(2p) = 2^26), GGSW base 2^8 with 3 levels,
   key switching base 2^6 with 4 levels. All arithmetic in JS Numbers kept below 2^53.
     const T = TFHE.make(); T.keygen();
     const c = T.encrypt(15); ... const out = T.bootstrap(c, m => Math.max(0, m-16)); T.decrypt(out) */
(function(){
"use strict";
const Q = 4294967296;                       // 2^32
const md = x => { x %= Q; return x < 0 ? x + Q : x; };
const cen = x => { x = md(x); return x >= Q/2 ? x - Q : x; };
const u32 = () => Math.floor(LS.rng()*Q);
const gauss = s => { let u = 0; for(let i=0;i<6;i++) u += LS.rng(); return Math.round((u-3)*s*1.41); };

/* negacyclic product of a small-integer polynomial d with a u32 polynomial c, result mod Q */
function mulSmall(d, c){ const N = c.length, out = new Array(N).fill(0);
  for(let i=0;i<N;i++){ const di = d[i]; if(!di) continue; for(let j=0;j<N;j++){ const k = i+j; if(k<N) out[k] += di*c[j]; else out[k-N] -= di*c[j]; } }
  return out.map(md); }
/* product with a binary polynomial S (used for phases and encryption) */
function mulBin(c, S){ const N = c.length, out = new Array(N).fill(0);
  for(let j=0;j<N;j++){ if(!S[j]) continue; for(let i=0;i<N;i++){ const k = i+j; if(k<N) out[k] += c[i]; else out[k-N] -= c[i]; } }
  return out.map(md); }
const padd = (a,b) => a.map((v,i) => md(v+b[i])), psub = (a,b) => a.map((v,i) => md(v-b[i]));
/* multiply by X^k in Z[X]/(X^N+1), k in [0,2N) */
function xpow(c, k){ const N = c.length; k = ((k % (2*N)) + 2*N) % (2*N); const out = new Array(N);
  for(let i=0;i<N;i++){ let j = i+k, s = 1; if(j >= 2*N) j -= 2*N; if(j >= N){ j -= N; s = -1; } out[j] = md(s*c[i]); } return out; }
/* signed gadget digits of v (u32) for base 2^bb and lv levels: v ≈ Σ d_l · 2^(32-bb·l) */
function decompose(v, bb, lv){ const B = 2**bb, drop = 32 - bb*lv; let t = Math.round(v / 2**drop) % (2**(bb*lv)); const d = new Array(lv);
  for(let l=lv;l>=1;l--){ let x = t % B; t = Math.floor(t / B); if(x >= B/2){ x -= B; t += 1; } d[l-1] = x; } return d; }

window.TFHE = {
  Q, md, cen,
  make(o={}){
    const n = o.n||4, N = o.N||256, p = o.p||32, D = Q/(2*p);
    const gb = o.gBits||8, gl = o.gLevels||3, kb = o.ksBits||6, kl = o.ksLevels||4;
    const lweNoise = o.lweNoise ?? 2**17, ringNoise = o.ringNoise ?? 3, ksNoise = o.ksNoise ?? 3;
    const T = { n, N, p, Q, D, gb, gl, kb, kl, twoN: 2*N, stats:{} };
    const g = l => 2**(32 - gb*l), gk = l => 2**(32 - kb*l);
    T.lweEnc = (mu, s, sig=lweNoise) => { const a = s.map(() => u32()); const e = gauss(sig); let b = mu + e; s.forEach((si,i) => { if(si) b += a[i]; }); return { a, b: md(b), e }; };
    T.phase = (c, s=T.K.s) => { let b = c.b; s.forEach((si,i) => { if(si) b -= c.a[i]; }); return md(b); };
    T.glweEnc = (mu, sig=ringNoise) => { const S = T.K.S, A = Array.from({length:N}, u32); const AS = mulBin(A, S); const B = AS.map((v,i) => md(v + mu[i] + gauss(sig))); return { A, B }; };
    T.glwePhase = c => psub(c.B, mulBin(c.A, T.K.S));
    /* GGSW of a polynomial message M (M = [bit] for CGGI keys, or a monomial for AP keys) */
    T.ggsw = M => { const Mp = new Array(N).fill(0); M.forEach((v,i) => Mp[i] = v); const rows = [];
      for(const comp of ["A","B"]) for(let l=1;l<=gl;l++){ const z = T.glweEnc(new Array(N).fill(0)); const add = Mp.map(v => md(v*g(l)));
        if(comp === "A") z.A = padd(z.A, add); else z.B = padd(z.B, add); rows.push({ comp, l, z }); }
      return rows; };
    T.extProd = (G, c) => { const dA = c.A.map(v => decompose(v, gb, gl)), dB = c.B.map(v => decompose(v, gb, gl));
      let A = new Array(N).fill(0), B = new Array(N).fill(0);
      for(const r of G){ const dig = (r.comp === "A" ? dA : dB).map(d => d[r.l-1]); A = padd(A, mulSmall(dig, r.z.A)); B = padd(B, mulSmall(dig, r.z.B)); }
      return { A, B }; };
    T.keygen = () => {
      const s = Array.from({length:n}, () => LS.rng() < 0.5 ? 0 : 1); if(s.every(v => v === s[0])) s[0] = 1 - s[0];
      const S = Array.from({length:N}, () => LS.rng() < 0.5 ? 0 : 1);
      T.K = { s, S };
      T.K.bsk = s.map(si => T.ggsw([si]));                        // CGGI bootstrapping key: GGSW(s_i)
      T.K.ksk = S.map(Sj => Array.from({length:kl}, (_,l) => T.lweEnc(md(Sj*gk(l+1)), s, ksNoise)));
      return T.K; };
    T.encrypt = (m, sig) => { const c = T.lweEnc(md(m*D), T.K.s, sig); return c; };
    T.decryptPhase = c => T.phase(c);
    T.decrypt = c => { const ph = T.phase(c); return ((Math.round(ph / D) % (2*p)) + 2*p) % (2*p); };
    T.lin = (terms, constM=0) => { /* Σ k_i·c_i + constM·Δ with integer k_i */ const a = new Array(n).fill(0); let b = md(constM*D);
      for(const [k,c] of terms){ c.a.forEach((v,i) => a[i] = md(a[i] + k*v)); b = md(b + k*c.b); } return { a, b }; };
    T.testPoly = f => { const per = N/p; const v = new Array(N); const vals = [];
      for(let j=0;j<N;j++){ const m = Math.round(j/per) % p; v[j] = md(f(m)*D); } for(let m=0;m<p;m++) vals.push(f(m)); return { v, vals, per }; };
    T.modSwitch = c => ({ a: c.a.map(v => Math.round(v * 2*N / Q) % (2*N)), b: Math.round(c.b * 2*N / Q) % (2*N) });
    T.blindRotate = (cs, v, trace) => { let acc = { A: new Array(N).fill(0), B: xpow(v, -cs.b) };
      if(trace) trace.push({ i:-1, rot: md(-cs.b), acc });
      for(let i=0;i<n;i++){ const rotated = { A: xpow(acc.A, cs.a[i]), B: xpow(acc.B, cs.a[i]) };
        const diff = { A: psub(rotated.A, acc.A), B: psub(rotated.B, acc.B) }; const ep = T.extProd(T.K.bsk[i], diff);
        acc = { A: padd(acc.A, ep.A), B: padd(acc.B, ep.B) }; if(trace) trace.push({ i, a: cs.a[i], s: T.K.s[i], acc }); }
      return acc; };
    T.sampleExtract = acc => ({ a: acc.A.map((v,j) => j === 0 ? v : md(-acc.A[N-j])), b: acc.B[0] });
    T.keySwitch = c => { const a = new Array(n).fill(0); let b = c.b;
      for(let j=0;j<N;j++){ const d = decompose(c.a[j], kb, kl); for(let l=0;l<kl;l++){ if(!d[l]) continue; const k = T.K.ksk[j][l]; k.a.forEach((v,i) => a[i] = md(a[i] - d[l]*v)); b = md(b - d[l]*k.b); } }
      return { a: a.map(md), b: md(b) }; };
    /* full programmable bootstrapping with a trace of every stage */
    T.bootstrap = (c, f) => { const t0 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
      const tp = T.testPoly(f), cs = T.modSwitch(c), trace = []; const acc = T.blindRotate(cs, tp.v, trace);
      const big = T.sampleExtract(acc), out = T.keySwitch(big);
      const t1 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
      const phi2N = ((cs.b - cs.a.reduce((s,ai,i) => s + ai*T.K.s[i], 0)) % (2*N) + 2*N) % (2*N);
      return { out, tp, cs, trace, acc, big, phi2N, ms: t1 - t0 }; };
    /* phase of an LWE ciphertext under the big ring key S (after sample extract) */
    T.phaseBig = c => { let b = c.b; T.K.S.forEach((Sj,j) => { if(Sj) b -= c.a[j]; }); return md(b); };
    T.err = (ph, m) => cen(ph - md(m*D));    // noise of a phase relative to message m
    T.sizes = () => ({ bskBits: n * 2*gl * 2*N * 32, kskBits: N * kl * (n+1) * 32, lweBits: (n+1)*32, glweBits: 2*N*32 });
    /* AP (FHEW-style) accumulator keys: GGSW(X^{v·B^j·s_i}) for every digit value */
    T.apKeys = (Br=8) => { const digits = Math.ceil(Math.log(2*N)/Math.log(Br)); const keys = [];
      for(let i=0;i<n;i++){ keys.push([]); for(let j=0;j<digits;j++){ keys[i].push([]); for(let v=0;v<Br;v++){ const e = ((v*Br**j*T.K.s[i]) % (2*N)); const M = new Array(N).fill(0); if(e < N) M[e] = 1; else M[e-N] = -1; keys[i][j].push(T.ggsw(M)); } } }
      T.K.ap = { keys, Br, digits }; return T.K.ap; };
    T.blindRotateAP = (cs, v) => { const { keys, Br, digits } = T.K.ap; let acc = { A: new Array(N).fill(0), B: xpow(v, -cs.b) }; let used = 0;
      for(let i=0;i<n;i++){ let a = cs.a[i]; for(let j=0;j<digits;j++){ const dv = a % Br; a = Math.floor(a / Br); if(dv){ acc = T.extProd(keys[i][j][dv], acc); used++; } } }
      return { acc, used }; };
    return T;
  },
  /* RLWE in the same Q with a small ring (for scheme switching): phase = b − a·s */
  rlwe(T, Nr=4){ const R = { N: Nr };
    R.enc = (mPoly, sig=2**14) => { const a = Array.from({length:Nr}, u32); const as = mulBin(a, T.K.s.slice(0, Nr)); const e = Array.from({length:Nr}, () => gauss(sig)); return { a, b: as.map((v,i) => md(v + mPoly[i] + e[i])), e }; };
    R.phase = c => psub(c.b, mulBin(c.a, T.K.s.slice(0, Nr)));
    R.mulPlain = (c, w) => ({ a: mulSmall(w, c.a), b: mulSmall(w, c.b) });
    R.addConst = (c, k) => ({ a: c.a.slice(), b: c.b.map((v,i) => i === 0 ? md(v + k) : v) });
    R.extract = c => ({ a: c.a.map((v,j) => j === 0 ? v : md(-c.a[Nr-j])), b: c.b[0] });
    return R; },
  decompose, xpow, mulSmall, mulBin
};
})();
