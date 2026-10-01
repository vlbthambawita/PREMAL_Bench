# Visual lesson plan: one neuron, every scheme

This plan turns each scheme on the main table (`docs/data/schemes.json`) into an
interactive lesson like `docs/learn/ckks.html`. It is written so lessons can be
built one paper at a time, in a fixed order, with the same structure and the same
example everywhere.

## 1. The shared example (never changes)

One neuron of an LLM: **y = ReLU(w₁·x₁ + w₂·x₂ + b)**

| Quantity | Owner | Value |
|---|---|---|
| input x | client | [1.5, 2.0] |
| weights w | server | [0.5, −0.25] |
| bias b | server | 0.1 |
| z = w·x + b | nobody in clear | 0.35 |
| y = ReLU(z) | client only | 0.35 |

Scheme-specific encodings of the same numbers:

| Scheme family | Encoding of the example |
|---|---|
| CKKS (and variants) | reals scaled by Δ = 2²⁰ |
| BGV / BFV / GBFV | x × 10 = [15, 20], w × 4 = [2, −1], b × 40 = 4, so 40·z = 15·2 + 20·(−1) + 4 = 14 exactly (z = 0.35) |
| TFHE / FHEW | 4- to 6-bit integers; ReLU as a lookup table on the quantized z |
| Paillier / ElGamal | integers mod n; only the linear part (sum of xᵢ·wᵢ with public wᵢ) |
| Gentry–Lee / matrix FHE | x as a 1×2 matrix, w as a 2×1 matrix, one native matrix product |
| Secret sharing / GC / FSS | x split into random shares; ReLU as a comparison protocol or GC |
| Multi-party / threshold | same CKKS or BFV flow, but the secret key is split between client and model owner |
| Transciphering | client sends x under a symmetric cipher; server converts to CKKS first |

Before writing a lesson, fix the exact integer encoding in a short table at the top of
the lesson's `math` drawer, so the expected answer is known in advance.

## 2. Page template (copy `ckks.html`)

Every lesson is one HTML file in `docs/learn/<scheme>.html` with:

1. **Header**: back link, lesson number, title, three-colour legend
   (client blue, server purple, noise amber). Never change the colour meanings.
2. **Step chips**: numbered steps; numbers are a real sequence.
3. **Stage**: one animated SVG scene per step, a 1–2 sentence caption, and a
   **"Read the full explanation"** drawer directly under the caption
   (2–4 short paragraphs, plain language, one idea per paragraph).
4. **Status strip** (same four cells in every lesson, relabel only if a scheme
   has no such notion):
   - *Data is at*: client ↔ server dot
   - *Budget left*: levels (CKKS/BGV/BFV), noise budget bits (BFV),
     "bootstraps used" (TFHE), "rounds so far" (MPC), "n/a" (Paillier)
   - *Scale / encoding*
   - *Error so far*
5. **"Show the maths" drawer**: formulas, the actual numbers, tables.
6. **Try-it row**: edit x, re-generate keys or shares.
7. **Comparison card** (same rows in every lesson, see §4).
8. **Footer**: toy parameters and the original paper link from `schemes.json`.

Each step object in the script provides:
`key, who, whoT, at, budget, scale, err(), title, cap(), scene(), play(), math()`,
plus one entry in `EXPLAIN[]`. Keep these names so lessons stay easy to diff.

## 3. Engine rule: every number is real

Each lesson ships a small but genuine implementation of the scheme in plain JS
(BigInt where needed), with insecure toy sizes, so values on screen are computed,
never typed in. Before publishing:

- run the page script in Node with a stub DOM and print every step's values;
- check each decrypted value against the plaintext computation;
- record the toy parameters in the footer.

Toy engines planned per family:

| Family | Toy engine |
|---|---|
| CKKS | done: N = 4, Δ = 2²⁰, q = 2⁹⁰, P = 2¹⁰⁰ |
| BFV / BGV | N = 4, t = 257, q = 2⁶⁰; show noise budget in bits |
| GSW / FHEW / TFHE | LWE with n = 8, q = 2¹⁶; blind rotation over a degree-16 ring; LUT for ReLU |
| Gentry–Lee | 2×2 matrices over a small ring; one native ct × pt matrix product |
| Paillier | 64-bit n (BigInt) |
| ElGamal, RSA, GM, BGN | small primes; BGN shows its single multiplication |
| Secret sharing | additive shares mod 2⁶⁴, Beaver triple for one product |
| Garbled circuits | 2-bit comparator garbled table drawn row by row |
| FSS | DPF/DCF tree with depth 4 |

## 4. Comparison card (identical rows everywhere)

| Row | What to write |
|---|---|
| A slot holds | data type in one ciphertext slot |
| Values per ciphertext | toy and real |
| Native operations | e.g. add / multiply / rotate / LUT |
| Linear part | how w·x + b was computed and its cost |
| ReLU | how it was computed, exact or approximate |
| Noise | how it grows and how it is handled |
| Budget used | levels, bootstraps, rounds |
| Refresh | bootstrapping type, or none |
| Our neuron gives | decrypted y vs 0.35 |
| Security | assumption, post-quantum yes/no |

A later page `docs/learn/compare.html` will read every lesson's card data and show
them side by side.

## 5. Visual vocabulary (reuse, don't reinvent)

| Concept | Visual |
|---|---|
| slots / packing | row of rounded tiles; lock icon when encrypted |
| polynomial coefficients | row of tiles labelled m₀…m₃ |
| ciphertext randomness | jittering bar chart |
| noise inside a value | bit register: headroom / message / noise segments |
| modulus levels | 4-cell meter in the status strip + shrinking register |
| rotation | crossing arrows between two tile rows |
| key switching | small key glyph on the arrow |
| bootstrapping | dashed pulsing box, "refresh" loop arrow |
| lookup table (TFHE) | test polynomial drawn as a ring of LUT entries rotating |
| approximation | function vs polynomial chart, gap highlighted |
| interaction (MPC) | message arrows with a round counter |
| errors at the end | log-scale bar chart: approximation vs noise |

Diagram rules (checked on every lesson):

- arrowheads use the colour-matched markers `ah` (ink), `ahs` (server), `ahc`
  (client), `ahm` (muted); never rely on `currentColor` inside a marker;
- arrows end 4–6 units before the target edge and never land in a gap between
  tiles; when one thing feeds many, use a bracket;
- labels never overlap lines or curves; labels stay inside the viewBox;
- curves are clipped to the plot area, never clamped;
- every scene works with reduced motion (final state is complete at rest).

## 6. Quality checks before each lesson ships

1. Node run: all steps render, no `NaN`/`undefined`, values match plaintext.
2. Each scene's SVG parses as XML.
3. Headless screenshots of every step at 1000 px and 400 px, with reduced motion
   forced; inspect arrows, overlaps, clipping. Command:
   `tools/shot.sh "http://127.0.0.1:8000/learn/<file>.html#step-N" out.png 1000 720` (serve `docs/` with `python3 -m http.server 8000` first)
4. Light and dark theme check on one step.
5. Link the lesson from `docs/index.html` (the scheme's row) and from the
   previous lesson's comparison card.

## 7. Lesson order and per-lesson plan

Order follows the teaching logic: one baseline, then each alternative changes one
idea at a time. Each entry lists the steps (scenes) and the "one thing that is
different" the lesson must make obvious.

### Lesson 1: CKKS (done) — `ckks.html`
Steps: example · keys · encode · encrypt · × w + rescale · rotate + add + bias ·
polynomial ReLU · decrypt · card. Difference shown: approximate packed arithmetic,
levels, approximation error ≫ noise.

### Lesson 2: BFV — `bfv.html`
Steps: example as integers · keys · encode into Z_t slots (CRT) · encrypt
(message in the high bits, noise in the low bits, opposite of CKKS) · × w (noise
budget drops, no rescaling) · rotate + add · ReLU attempt: sign via high-degree
polynomial mod t, show why it is costly · decrypt exactly · card.
**Different**: exact results, the noise budget instead of levels, ReLU is harder.

### Lesson 3: BGV — `bgv.html`
Short lesson reusing BFV scenes; one new scene for **modulus switching**
(noise in the low bits, message multiplied by p). **Different**: where the
message sits and how noise is managed.

### Lesson 4: TFHE (CGGI) — `tfhe.html`
Steps: example quantized to 4 bits · LWE encryption of one number · linear part as
weighted sum of LWE ciphertexts (no packing) · **programmable bootstrapping**:
blind rotation of a test polynomial that encodes ReLU, animated as a rotating
ring · sample extract · key switch · decrypt exact ReLU · card.
**Different**: exact non-linearity through a lookup table, one value per
ciphertext, bootstrapping as a feature.

### Lesson 5: FHEW and small-key FHEW — `fhew.html`
Reuse TFHE scenes; new scene comparing blind-rotation accumulators and key sizes.

### Lesson 6: Scheme switching (PEGASUS / CHIMERA) — `switching.html`
Steps: linear part in CKKS (reuse) · **extract** slots into LWE ciphertexts ·
ReLU by FHEW LUT · **repack** into CKKS · decrypt. **Different**: two schemes,
each used for what it does best; the cost is the conversion.

### Lesson 7: CKKS functional bootstrapping — `ckks-fbs.html`
Steps: discretize z · bootstrapping whose EvalMod step is replaced by a LUT ·
exact ReLU on small integers at CKKS throughput. **Different**: TFHE-style LUT
inside CKKS.

### Lesson 8: Discrete CKKS / Bit-CKKS / CKKS integer computer — `ckks-discrete.html`
Steps: encode bits or small integers · BLEACH cleaning polynomial animation ·
compare-and-ReLU on bits. **Different**: CKKS used as an exact engine.

### Lesson 9: Gentry–Lee matrix FHE — `gentry-lee.html`
Steps: encode x and w as matrices · encrypt a matrix · **one native matrix
product**, no rotations (side-by-side with CKKS rotate-and-add) · ReLU as in CKKS ·
card. **Different**: rotations and rotation keys disappear from the linear part.

### Lesson 10: Generalized BFV and high-precision exact FHE — `gbfv.html`
Steps: polynomial plaintext modulus t(x) · trade slots for precision slider ·
exact z with large precision. **Different**: the precision/packing dial.

### Lesson 11: Multi-party and threshold FHE — `threshold.html`
Steps: joint key generation (client and model owner each hold a share of s) ·
same CKKS computation · **joint decryption** with noise flooding.
**Different**: no single party can decrypt; protects the model too.

### Lesson 12: Multi-key CKKS — `multikey.html`
Steps: client and server encrypt under their own keys · ciphertext expansion ·
joint computation · joint decryption. **Different**: encrypted weights too.

### Lesson 13: Transciphering (HERA / Rubato, Pasta) — `transcipher.html`
Steps: client encrypts x with a symmetric stream cipher (tiny upload) · server
evaluates the cipher homomorphically to get CKKS ciphertexts · continues as in
Lesson 1. **Different**: client bandwidth, not server compute.

### Lesson 14: Paillier (and Damgård–Jurik) — `paillier.html`
Steps: keys from two primes · encrypt x₁, x₂ · **multiply ciphertext by a public
weight = exponentiation**, add = multiply ciphertexts · add bias · ReLU impossible:
show the protocol where the client must help · card.
**Different**: additive only, no noise, not post-quantum.

### Lesson 15: ElGamal, RSA, Goldwasser–Micali, BGN — `phe-classics.html`
One lesson, four short tracks; BGN shows its single multiplication, enough for z²
but not for ReLU.

### Lesson 16: Earlier FHE (Gentry 2009, DGHV, BV11) — `fhe-history.html`
Timeline lesson: DGHV toy over the integers on our neuron (bits), then the BV11
idea of relinearization and modulus switching that every modern scheme inherited.

### Lesson 17: Secret sharing (SPDZ-style 2PC, ABY3 3PC) — `secret-sharing.html`
Steps: split x into random shares · linear part locally on shares · one product
with a Beaver triple (animated message exchange, round counter in the status
strip) · ReLU via a comparison protocol · reconstruct.
**Different**: no ciphertext noise at all, but many rounds and non-colluding servers.

### Lesson 18: Garbled circuits — `garbled.html`
Steps: ReLU as a boolean circuit on 4-bit z · garble each gate (table shuffling
animation) · oblivious transfer of input labels · evaluate · decode.
**Different**: exact ReLU, large communication.

### Lesson 19: Function secret sharing — `fss.html`
Steps: dealer generates DCF keys for "z > 0" · two servers evaluate locally ·
add outputs to get ReLU. **Different**: few rounds, needs a dealer (SIGMA).

### Lesson 20: Homomorphic secret sharing and functional encryption — `hss-fe.html`
Two short tracks: HSS lets two servers compute locally; inner-product FE lets the
server learn z but nothing else, which shows why FE leaks more than FHE.

### Final page: Compare all — `compare.html`
All comparison cards side by side, with one chart of "linear cost vs ReLU
exactness vs interaction" and links back to each lesson.

## 8. How to run one lesson (checklist)

1. Read the scheme's original paper (link in `schemes.json`, PDF in
   `papers/references/schemes/`).
2. Write the toy engine and its Node test first; confirm the expected outputs.
3. Copy `ckks.html`, keep the structure, replace engine, steps, `EXPLAIN[]`
   and the card values.
4. Run the quality checks in §6 and fix every overlap or misaligned arrow.
5. Link it from `docs/index.html` and commit with one lesson per commit.
