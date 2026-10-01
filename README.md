# PREMAL_Bench

## CKKS Alternatives Atlas

A catalogue of methods for private LLM inference, built around
[*SoK: Private LLM Inference using Approximate Homomorphic Encryption*](https://eprint.iacr.org/2026/935)
(Al Badawi, Alexandru, Polyakov, Vaikuntanathan, 2026).

**Live page:** https://vlbthambawita.github.io/PREMAL_Bench/

The table groups 137 entries into nine groups:

| # | Group | What it covers |
|---|-------|----------------|
| 0 | CKKS LLM frameworks surveyed in the SoK | THOR, NEXUS, MOAI, CERIUM, CACHEMIR, POLARIS and others, with hardware, library, packing class and reported latency |
| 1 | Newer 2026 CKKS / FHE LLM frameworks | Odin, THEMIS, ROSETTA (CKKS+TFHE), Terrazzo (Gentry–Lee scheme on GPU) and others |
| 2 | CKKS core and variants | RNS-CKKS, conjugate-invariant, reduced-error, IND-CPA-D secure, multi-key/threshold, bit-CKKS, functional bootstrapping |
| 3 | CKKS bootstrapping and operation advances | Bootstrapping lineage up to SHIP and PaCo, key switching, fused matmul, homomorphic Softmax |
| 4 | Alternative FHE schemes | BGV, BFV, GSW, FHEW, TFHE, NTRU-based, scheme switching, Gentry–Lee matrix FHE and its 2026 follow-ups |
| 5 | Interactive MPC and HE+MPC hybrids | Gazelle, Cheetah, Iron, BOLT, BumbleBee, PUMA, SIGMA, Nimbus and MPC frameworks |
| 6 | Trusted hardware, statistical and integrity-only alternatives | GPU/CPU TEEs, Apple Private Cloud Compute, differential privacy, split inference, zkLLM |
| 7 | FHE libraries, GPU back-ends and compilers | OpenFHE, SEAL, Lattigo, HEaaN, Phantom, FIDESlib, Cheddar, TFHE-rs, Orion, HEIR |
| 8 | FHE hardware accelerators | F1, CraterLake, BTS, ARK, SHARP, Trebuchet, BASALISC, HERACLES |

A second page lists all 107 references of the SoK with source links: `docs/references.html`.

### Files

- `docs/index.html`: the searchable, filterable, sortable table.
- `docs/data/methods.json`: the table data (also loaded as `methods.js`).
- `docs/data/sok_references.js`: the SoK reference list.
- `papers/`: local PDF archive. It is listed in `.gitignore` and is not published.

### Publishing

GitHub Pages serves the `docs/` folder. In the repository settings, open
**Settings → Pages**, choose **Deploy from a branch**, select `main` and `/docs`.
