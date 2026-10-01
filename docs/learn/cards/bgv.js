(window.LESSON_CARDS=window.LESSON_CARDS||{})["bgv"]={
 slot:"An exact integer modulo t, stored in the low bits as m + t·e",
 values:"N: 4 in the toy, 8,192 to 32,768 in practice",
 ops:"Add, multiply, rotate (exact mod t), modulus switching",
 linear:"Same as BFV: plaintext multiply, rotate-and-add, add. Exact.",
 relu:"Exact degree-256 interpolation polynomial: 255 ct × ct multiplications, one prime dropped per depth.",
 noise:"Kept at a constant size by dividing the ciphertext by one prime after each multiplication.",
 budget:"8 of 10 primes (modulus 341 → 93 bits)",
 refresh:"Bootstrapping by digit extraction (HElib); slow",
 result:"14/40 = 0.3500, exact",
 security:"Ring-LWE, post-quantum",
 exact:"exact", interaction:"none (one round trip)"
};
