(window.LESSON_CARDS=window.LESSON_CARDS||{})["paillier"]={
 slot:"One exact integer mod n (mod n² for Damgård–Jurik)",
 values:"1 per ciphertext (no packing)",
 ops:"Add two ciphertexts, multiply by a public constant",
 linear:"Exponentiate by each weight, multiply ciphertexts, multiply by (1 + bn): exact",
 relu:"Impossible alone; one extra client round with multiplicative blinding (leaks sign of z)",
 noise:"None: decryption is exact",
 budget:"Unlimited additions; zero ciphertext multiplications",
 refresh:"Not needed (no noise)",
 result:"z = 0.3500 exactly; y = 0.3500 with one helper round",
 security:"Decisional composite residuosity (factoring); not post-quantum",
 exact:"exact", interaction:"1 extra round per non-linear layer"
};
