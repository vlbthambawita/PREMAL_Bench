/* Toy Gentry–Lee matrix FHE (ePrint 2025/1935), p = 1 case (one matrix per ciphertext), n = 2.
   Ring R  = Z_q[i][X]/(X^n − i)          (secret key lives here)
   Ring R' = Z_q[i][X,Y]/(X^n − i, Y^n − i)  (messages and ciphertexts; = n RLWE ciphertexts over R)
   Encoding: m(ζ_j, ζ_k) = M_jk with ζ_j = exp(2πi·5^j/4n).  Matrix product = trace over an auxiliary Z:
   a ⊛ b = Tr_Z( a(X,Z) · conj(b)(Y^-1, Z^-1) ), which decodes to (1/n)·A·B*  (Thm 3.5 / 3.6 of the paper).
   Insecure toy sizes; real algebra. Requires lesson.js. */
(function(){
"use strict";
const cm = LS.cmod;
window.GL = { make(o={}){
  const n = o.n||2, DB = BigInt(o.deltaBits||20), D = 1n<<DB, qBits = BigInt(o.qBits||90);
  const G = {}; G.n = n; G.D = D; G.q0 = 1n<<qBits;
  /* Gaussian integers [re, im] */
  const g = { add:(a,b,m)=>[cm(a[0]+b[0],m),cm(a[1]+b[1],m)], sub:(a,b,m)=>[cm(a[0]-b[0],m),cm(a[1]-b[1],m)],
    mul:(a,b,m)=>[cm(a[0]*b[0]-a[1]*b[1],m),cm(a[0]*b[1]+a[1]*b[0],m)], conj:a=>[a[0],-a[1]], mulI:a=>[-a[1],a[0]], mulNegI:a=>[a[1],-a[0]], zero:()=>[0n,0n] };
  G.g = g;
  const zeroP = () => Array.from({length:n},()=>Array.from({length:n},()=>[0n,0n]));
  G.zero = zeroP;
  /* multiply in R' : X^n = i, Y^n = i */
  G.mul = (a,b,m) => { const c = zeroP(); for(let x1=0;x1<n;x1++)for(let y1=0;y1<n;y1++){ const A = a[x1][y1]; if(A[0]===0n&&A[1]===0n) continue;
      for(let x2=0;x2<n;x2++)for(let y2=0;y2<n;y2++){ let x=x1+x2, y=y1+y2, v = g.mul(A,b[x2][y2],m); if(x>=n){x-=n; v=g.mulI(v);} if(y>=n){y-=n; v=g.mulI(v);} c[x][y] = g.add(c[x][y],v,m); } } return c; };
  G.add = (a,b,m) => a.map((r,x)=>r.map((v,y)=>g.add(v,b[x][y],m)));
  G.sub = (a,b,m) => a.map((r,x)=>r.map((v,y)=>g.sub(v,b[x][y],m)));
  G.red = (a,m) => a.map(r=>r.map(v=>[cm(v[0],m),cm(v[1],m)]));
  G.scal = (a,c,m) => a.map(r=>r.map(v=>[cm(v[0]*c,m),cm(v[1]*c,m)]));
  /* ⊛ : c[x][Y^-y] += Σ_u a[x][u]·conj(b[y][u]);  Y^-y = −i·Y^(n−y) for y ≥ 1 */
  G.star = (a,b,m) => { const c = zeroP(); for(let x=0;x<n;x++)for(let y=0;y<n;y++){ let acc=[0n,0n]; for(let u=0;u<n;u++) acc = g.add(acc, g.mul(a[x][u], g.conj(b[y][u]), m), m);
      if(y===0) c[x][0] = g.add(c[x][0],acc,m); else c[x][n-y] = g.add(c[x][n-y], g.mulNegI(acc), m); } return c; };
  G.star.count = n; // n×n coefficient-matrix products per ⊛ (one per Gaussian component pairing)
  const zeta = Array.from({length:n},(_,j)=>{ const e = Number(5n**BigInt(j) % BigInt(4*n)); const t = 2*Math.PI*e/(4*n); return [Math.cos(t),Math.sin(t)]; });
  G.zeta = zeta;
  const cpow = (z,k) => { let r=[1,0]; for(let i=0;i<k;i++) r=[r[0]*z[0]-r[1]*z[1], r[0]*z[1]+r[1]*z[0]]; return r; };
  const cmul = (a,b) => [a[0]*b[0]-a[1]*b[1], a[0]*b[1]+a[1]*b[0]];
  /* encode n×n complex matrix (numbers or [re,im]) at scale sc */
  G.encode = (M, sc=D) => { const c = zeroP(), S = Number(sc);
    for(let x=0;x<n;x++)for(let y=0;y<n;y++){ let re=0, im=0;
      for(let j=0;j<n;j++)for(let k=0;k<n;k++){ const v = Array.isArray(M[j][k])?M[j][k]:[M[j][k],0];
        const w = cmul(cpow([zeta[j][0],-zeta[j][1]],x), cpow([zeta[k][0],-zeta[k][1]],y)); const p = cmul(v,w); re+=p[0]; im+=p[1]; }
      c[x][y] = [BigInt(Math.round(re/(n*n)*S)), BigInt(Math.round(im/(n*n)*S))]; } return c; };
  G.decodeC = (c, sc=D) => { const S = Number(sc); return Array.from({length:n},(_,j)=>Array.from({length:n},(_,k)=>{ let re=0,im=0;
      for(let x=0;x<n;x++)for(let y=0;y<n;y++){ const w = cmul(cpow(zeta[j],x),cpow(zeta[k],y)); const v=[Number(c[x][y][0]),Number(c[x][y][1])]; const p=cmul(v,w); re+=p[0]; im+=p[1]; }
      return [re/S, im/S]; })); };
  G.decode = (c, sc=D) => G.decodeC(c,sc).map(r=>r.map(v=>v[0]));
  const rnd = m => [LS.randBig(m), LS.randBig(m)].map(v=>cm(v,m));
  G.keygen = () => { let s; do{ s = zeroP(); for(let x=0;x<n;x++) s[x][0] = [LS.tern(), LS.tern()]; }while(s.every(r=>r[0][0]===0n&&r[0][1]===0n)); G.s = s;
    /* conj(s)(Y^-1): coefficient s_x of X^x becomes conj(s_x)·Y^-x */
    const sy = zeroP(); for(let x=0;x<n;x++){ const v = g.conj(s[x][0]); if(x===0) sy[0][0]=v; else sy[0][n-x] = g.mulNegI(v); } G.sY = sy; return s; };
  /* secret-key encryption as in the paper: (b, a) with b = −a·s + m + e, a uniform in R'_q */
  G.encrypt = (m, q=G.q0) => { const a = zeroP().map(r=>r.map(()=>rnd(q))), e = zeroP().map(r=>r.map(()=>[LS.smallErr(),LS.smallErr()]));
    const b = G.add(G.sub(G.red(m,q), G.mul(a,G.s,q), q), e, q); return {c:[b,a], q}; };
  G.dec2 = ct => G.add(ct.c[0], G.mul(ct.c[1], G.s, ct.q), ct.q);
  G.dec3 = ct => { const q = ct.q, s2 = G.mul(G.s,G.s,q); return G.add(G.add(ct.c[0], G.mul(ct.c[1],G.s,q), q), G.mul(ct.c[2],s2,q), q); };
  /* 4-component ct ⊛ ct: (b⊛b', a⊛b', b⊛a', a⊛a') decrypts with (1, s(X), conj(s)(Y^-1), s(X)·conj(s)(Y^-1)) */
  G.dec4 = ct => { const q = ct.q, [c00,c10,c01,c11] = ct.c; let d = G.add(c00, G.mul(c10,G.s,q), q); d = G.add(d, G.mul(c01,G.sY,q), q); return G.add(d, G.mul(G.mul(c11,G.s,q),G.sY,q), q); };
  G.ptStar = (ct, v) => ({ c: ct.c.map(p => G.star(p, G.red(v,ct.q), ct.q)), q: ct.q });
  G.ctStar = (A, B) => { const q = A.q; return { c: [G.star(A.c[0],B.c[0],q), G.star(A.c[1],B.c[0],q), G.star(A.c[0],B.c[1],q), G.star(A.c[1],B.c[1],q)], q }; };
  G.hadamard = (A, B) => { const q = A.q, [b,a] = A.c, [b2,a2] = B.c; return { c: [G.mul(b,b2,q), G.add(G.mul(b,a2,q),G.mul(a,b2,q),q), G.mul(a,a2,q)], q }; };
  G.addPt = (ct, m) => ({ c: [G.add(ct.c[0], G.red(m,ct.q), ct.q), ...ct.c.slice(1)], q: ct.q });
  G.addCt = (A, B) => ({ c: A.c.map((p,i)=>G.add(p,B.c[i],A.q)), q: A.q });
  G.scalCt = (A, k) => ({ c: A.c.map(p=>G.scal(p,k,A.q)), q: A.q });
  G.rescale = ct => { const q2 = ct.q / D; return { c: ct.c.map(p => p.map(r=>r.map(v=>[cm(LS.rdiv(cm(v[0],ct.q),D),q2), cm(LS.rdiv(cm(v[1],ct.q),D),q2)]))), q: q2 }; };
  G.down = (ct, q2) => ({ c: ct.c.map(p=>G.red(p,q2)), q: q2 });
  return G; } };
})();
