/* Synchronous SHA-256 (FIPS 180-4) for toy garbling, PRGs and hashes in the lessons.
   SHA256.hash(Uint8Array) -> Uint8Array(32); SHA256.hex(bytes). */
(function(){
"use strict";
const primes = []; for(let n=2; primes.length<64; n++){ let ok = true; for(const p of primes){ if(p*p>n) break; if(n%p===0){ ok=false; break; } } if(ok) primes.push(n); }
const frac32 = x => Math.floor((x - Math.floor(x)) * 4294967296) >>> 0;
const K = primes.map(p => frac32(Math.cbrt(p)));
const H0 = primes.slice(0,8).map(p => frac32(Math.sqrt(p)));
const ror = (x,n) => (x>>>n) | (x<<(32-n));
function hash(bytes){
  const l = bytes.length, nb = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(nb);
  m.set(bytes); m[l] = 0x80; const bl = l*8;
  m[nb-1] = bl & 255; m[nb-2] = (bl>>>8)&255; m[nb-3] = (bl>>>16)&255; m[nb-4] = (bl>>>24)&255; m[nb-5] = Math.floor(bl/4294967296)&255;
  let H = H0.slice(); const w = new Uint32Array(64);
  for(let o=0; o<nb; o+=64){
    for(let i=0;i<16;i++) w[i] = ((m[o+4*i]<<24) | (m[o+4*i+1]<<16) | (m[o+4*i+2]<<8) | m[o+4*i+3]) >>> 0;
    for(let i=16;i<64;i++){ const s0 = ror(w[i-15],7) ^ ror(w[i-15],18) ^ (w[i-15]>>>3), s1 = ror(w[i-2],17) ^ ror(w[i-2],19) ^ (w[i-2]>>>10); w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0; }
    let [a,b,c,d,e,f,g,h] = H;
    for(let i=0;i<64;i++){ const S1 = ror(e,6)^ror(e,11)^ror(e,25), ch = (e&f) ^ (~e&g), t1 = (h + S1 + ch + K[i] + w[i]) >>> 0, S0 = ror(a,2)^ror(a,13)^ror(a,22), mj = (a&b)^(a&c)^(b&c), t2 = (S0 + mj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0; }
    H = [H[0]+a, H[1]+b, H[2]+c, H[3]+d, H[4]+e, H[5]+f, H[6]+g, H[7]+h].map(v => v >>> 0);
  }
  const out = new Uint8Array(32); H.forEach((v,i) => { out[4*i] = v>>>24; out[4*i+1] = (v>>>16)&255; out[4*i+2] = (v>>>8)&255; out[4*i+3] = v&255; }); return out;
}
const hex = b => Array.from(b, x => x.toString(16).padStart(2,"0")).join("");
const utf8 = s => { const o = []; for(const ch of unescape(encodeURIComponent(s))) o.push(ch.charCodeAt(0)); return new Uint8Array(o); };
/* helpers on 64-bit BigInt labels */
const b64 = v => { const o = new Uint8Array(8); for(let i=7;i>=0;i--){ o[i] = Number(v & 255n); v >>= 8n; } return o; };
const toBig = (bytes, n=8) => { let v = 0n; for(let i=0;i<n;i++) v = (v<<8n) | BigInt(bytes[i]); return v; };
window.SHA256 = { hash, hex, utf8, b64, toBig,
  cat: (...arrs) => { const n = arrs.reduce((a,x)=>a+x.length,0), o = new Uint8Array(n); let k = 0; for(const a of arrs){ o.set(a,k); k += a.length; } return o; },
  h64: (...parts) => toBig(hash(window.SHA256.cat(...parts.map(p => typeof p === "bigint" ? b64(p) : typeof p === "number" ? b64(BigInt(p)) : typeof p === "string" ? utf8(p) : p)))) };
})();
