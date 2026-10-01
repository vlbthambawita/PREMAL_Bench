(window.LESSON_CARDS=window.LESSON_CARDS||{})["phe-classics"]={
 slot:"One integer (RSA, ElGamal exponent, CL), one bit (GM), or one small integer (BGN)",
 values:"1 per ciphertext; GM spends a whole ciphertext per bit",
 ops:"Exactly one: × (RSA), + (ElGamal, CL), ⊕ (GM); BGN adds plus one multiplication",
 linear:"Additive schemes compute it exactly; RSA cannot add; GM cannot multiply by weights",
 relu:"Impossible; BGN reaches only the degree-2 polynomial",
 noise:"None",
 budget:"BGN: one multiplication; others: zero",
 refresh:"Not applicable",
 result:"z = 0.3500 exactly (ElGamal, CL); BGN p(z) = 0.3262; no ReLU",
 security:"Factoring / discrete log / pairings; none post-quantum; textbook RSA not even semantically secure",
 exact:"exact", interaction:"needs extra rounds for any non-linear step"
};
