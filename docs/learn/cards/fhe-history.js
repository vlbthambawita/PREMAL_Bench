(window.LESSON_CARDS=window.LESSON_CARDS||{})["fhe-history"]={
 slot:"An integer mod t (DGHV, LWE, NTRU); CRT slots from Smart–Vercauteren",
 values:"1 per ciphertext (DGHV, BV11); up to N slots mod t with Smart–Vercauteren packing",
 ops:"Add and multiply, until the noise runs out",
 linear:"Integer or polynomial arithmetic on ciphertexts: exact, small noise growth",
 relu:"Not attempted: needs deep circuits and bootstrapping",
 noise:"Doubles in bits per multiplication (DGHV); tamed by relinearization and modulus switching (BV11/BGV)",
 budget:"DGHV toy: 2 squarings before failure",
 refresh:"Gentry's bootstrapping: evaluate decryption under an encrypted key",
 result:"z = 0.3500 exactly (DGHV, LTV); ReLU out of reach",
 security:"Approximate GCD (DGHV), LWE (BV11), NTRU (LTV, YASHE: overstretched attacks); CPA only",
 exact:"exact", interaction:"none"
};
