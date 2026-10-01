(window.LESSON_CARDS=window.LESSON_CARDS||{})["multikey"]={
 slot:"Approximate reals, as in CKKS",
 values:"N/2 per ciphertext; one ciphertext per party key component",
 ops:"Add, multiply across keys; relinearization needs every party's evaluation key",
 linear:"Ciphertext × ciphertext (weights are encrypted too), 4 components per product",
 relu:"Polynomial approximation, as in CKKS",
 noise:"CKKS noise; cross-key products add more noise than plaintext weights",
 budget:"3 levels; ciphertext grows 2 → 4 → 9 components without relinearization (k + 1 with it)",
 refresh:"Multi-key bootstrapping, cost grows with the number of parties",
 result:"≈ 0.326 for a true 0.3500, weights private too",
 security:"Ring-LWE; decryption needs every party",
 exact:"approximate", interaction:"no joint setup; joint decryption at the end"
};
