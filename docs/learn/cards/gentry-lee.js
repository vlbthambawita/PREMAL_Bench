(window.LESSON_CARDS=window.LESSON_CARDS||{})["gentry-lee"]={
 slot:"An entry of an n×n approximate complex matrix (CKKS-style scale Δ); φ(p) matrices per ciphertext",
 values:"n² per matrix × φ(p) matrices: 4 in the toy",
 ops:"Add, entry-wise multiply, native matrix product ⊛, transpose, row/column rotations",
 linear:"One native ct ⊛ plaintext product: 2 coefficient-matrix products, 0 rotations, 0 key switches",
 relu:"Polynomial approximation, exactly as in CKKS",
 noise:"As in CKKS: below the scale Δ, never removed",
 budget:"3 levels (bias+rescale, constant, z²)",
 refresh:"CKKS-style bootstrapping; 2026 GL-native bootstrapping with constant key switches per step",
 result:"0.3262 for a true 0.3500",
 security:"Ring-LWE over Z[X]/Φ₄ₙₚ(X), post-quantum",
 exact:"approximate", interaction:"none (one round trip)"
};
