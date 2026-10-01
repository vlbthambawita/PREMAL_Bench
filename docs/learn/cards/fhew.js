(window.LESSON_CARDS=window.LESSON_CARDS||{})["fhew"]={
 slot:"One bit or small integer per LWE ciphertext",
 values:"1 per ciphertext (SIMD ALU variant: many words amortized)",
 ops:"Add, multiply by small integers, bootstrapped gates or lookup tables",
 linear:"As TFHE: integer linear combination of LWE ciphertexts",
 relu:"Exact lookup table in bootstrapping; FHEW's original mode bootstraps one NAND gate at a time",
 noise:"Reset by every bootstrap",
 budget:"1 bootstrap (CMux: 4 external products; AP: up to 12)",
 refresh:"Blind rotation: AP (FHEW), CMux (TFHE), automorphisms (LMKCDEY), NTRU keys (FINAL)",
 result:"0.3500 exactly with both accumulators",
 security:"LWE / Ring-LWE; FINAL also NTRU; post-quantum",
 exact:"exact", interaction:"none (one round trip)"
};
