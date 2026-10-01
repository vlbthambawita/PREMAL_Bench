(window.LESSON_CARDS=window.LESSON_CARDS||{})["threshold"]={
 slot:"Same as CKKS: approximate reals",
 values:"N/2 (2 here), like CKKS",
 ops:"Add, multiply, rotate, unchanged; key generation and decryption become protocols",
 linear:"As in CKKS: one plaintext multiply, one rotate-and-add",
 relu:"Polynomial approximation, as in CKKS",
 noise:"CKKS noise plus flooding noise in every partial decryption",
 budget:"3 levels; 1 round for public and rotation keys, 2 rounds for the relinearization key",
 refresh:"Bootstrapping under the joint key (keys generated jointly)",
 result:"≈ 0.326 for a true 0.3500, only with both shares",
 security:"Ring-LWE; any party alone learns nothing",
 exact:"approximate", interaction:"key generation and decryption need all parties (or t of n)"
};
