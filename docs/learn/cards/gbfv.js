(window.LESSON_CARDS=window.LESSON_CARDS||{})["gbfv"]={
 slot:"An exact integer modulo p = b^(N/k) + 1, chosen by t(X) = X^k − b",
 values:"k: from N small slots (BFV) down to 1 huge slot (CLPX)",
 ops:"Add, multiply (exact); GBFV keeps SIMD for k > 1",
 linear:"Plaintext digit-polynomial multiply and add. 8 exact decimals for 7 bits of budget.",
 relu:"Not practical directly: interpolation would need degree p − 1 ≈ 2³². Needs lookup-table bootstrapping or scheme switching.",
 noise:"Grows with the digit size (≤ 128), not with the huge modulus p.",
 budget:"About 6–7 of 150 bits for the linear part",
 refresh:"GBFV is bootstrappable (paper: 2¹⁶ + 1 at N = 2¹⁴); CLPX has no known efficient bootstrapping",
 result:"z = 0.35000000 exact; ReLU not evaluated",
 security:"Ring-LWE (Module-LWE for ModHE, plain LWE possible for PZZ), post-quantum",
 exact:"exact", interaction:"none for the linear part"
};
