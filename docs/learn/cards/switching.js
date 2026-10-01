(window.LESSON_CARDS=window.LESSON_CARDS||{})["switching"]={
 slot:"Ring coefficients for the linear part, then one LWE value per activation",
 values:"Many per ring ciphertext (linear part); 1 per LWE ciphertext (ReLU)",
 ops:"Ring multiply and add, coefficient extraction, TFHE bootstrapping, ring packing",
 linear:"One plaintext × ciphertext ring multiplication with coefficient encoding, no rotations",
 relu:"Exact lookup table via TFHE bootstrapping after extraction",
 noise:"Ring noise carried into the LWE ciphertext, then reset by the bootstrap",
 budget:"1 ring multiplication, 1 extraction, 1 bootstrap (+ repacking for the next layer)",
 refresh:"TFHE programmable bootstrapping; repacking by automorphisms and key switching",
 result:"0.3500 exactly (quantized neuron)",
 security:"Ring-LWE and LWE, post-quantum",
 exact:"exact", interaction:"none (one round trip)"
};
