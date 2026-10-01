# PREMAL_Bench

## CKKS Alternatives Atlas

A catalogue of methods for private LLM inference, built around
[*SoK: Private LLM Inference using Approximate Homomorphic Encryption*](https://eprint.iacr.org/2026/935)
(Al Badawi, Alexandru, Polyakov, Vaikuntanathan, 2026).

**Live page:** https://vlbthambawita.github.io/PREMAL_Bench/

The main table lists **56 encryption schemes and scheme-level variants**, one row per scheme, in nine groups:

| # | Group | Examples |
|---|-------|----------|
| 1 | CKKS and its variants | RNS-CKKS, conjugate-invariant, reduced-error, IND-CPA-D secure, discrete CKKS, Bit-CKKS, functional bootstrapping, SHIP, PaCo |
| 2 | Exact word-wise FHE | BGV, BFV, CLPX, Generalized BFV, high-precision exact FHE, Module-LWE HE |
| 3 | Bit-wise / lookup-table FHE | GSW, FHEW, TFHE, small-key FHEW, FINAL, SIMD ALU FHE |
| 4 | Matrix-native FHE | Gentry–Lee scheme, generalized BGV/BFV/CKKS over matrix rings |
| 5 | Earlier and other FHE | Gentry 2009, DGHV, Smart–Vercauteren, BV11, LTV, YASHE, CCA-secure FHE |
| 6 | Multi-party FHE | Threshold FHE, multiparty HE, multi-key CKKS/BFV, multi-key TFHE |
| 7 | Scheme switching and hybrid HE | CHIMERA, PEGASUS, HERA/Rubato transciphering, HE-friendly ciphers |
| 8 | Partially homomorphic encryption | Paillier, Damgård–Jurik, ElGamal, RSA, Goldwasser–Micali, BGN, Castagnos–Laguillaumie |
| 9 | Non-HE cryptographic alternatives | Secret sharing (SPDZ, ABY3), garbled circuits, function secret sharing, HSS, inner-product FE |

Columns: scheme, year, hardness assumption, plaintext type, SIMD packing, bootstrapping, fit for LLM inference,
original paper, implementing libraries, status, plus follow-up variants in the expandable details.

Secondary pages:
- `docs/learn/`: 20 visual lessons (one per scheme family), `learn/index.html` lists them and `learn/compare.html` compares their summary cards.
- `docs/systems.html`: 137 papers, frameworks, libraries and accelerators that use these schemes.
- `docs/references.html`: all 107 references of the SoK with source links.

### Files

- `docs/index.html`: the searchable, filterable, sortable scheme table.
- `docs/data/schemes.json`: the scheme data (also loaded as `schemes.js`).
- `docs/data/methods.json`: data for the systems page.
- `docs/data/sok_references.js`: the SoK reference list.
- `papers/`: local PDF archive. It is listed in `.gitignore` and is not published.

### Publishing

GitHub Pages serves the `docs/` folder. In the repository settings, open
**Settings → Pages**, choose **Deploy from a branch**, select `main` and `/docs`.
