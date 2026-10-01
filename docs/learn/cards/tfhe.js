(window.LESSON_CARDS=window.LESSON_CARDS||{})["tfhe"]={
 slot:"One small integer (5 bits + padding bit) as a point on the torus",
 values:"1 per LWE ciphertext",
 ops:"Add ciphertexts, multiply by small integers, programmable bootstrapping (any lookup table)",
 linear:"Integer weights: 2·c₁ − c₂ + 20·Δ. Cheap per value, but no packing: one ciphertext per input.",
 relu:"Exact, as a 32-entry lookup table evaluated during bootstrapping",
 noise:"Grows with linear ops; reset to a fixed small level by every bootstrap",
 budget:"1 bootstrap (4 CMuxes, 4 external products)",
 refresh:"Programmable bootstrapping: blind rotation, sample extract, key switch",
 result:"0.3500 exactly (quantized neuron)",
 security:"LWE / Ring-LWE (GLWE), post-quantum",
 exact:"exact", interaction:"none (one round trip)"
};
