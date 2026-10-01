(window.LESSON_CARDS=window.LESSON_CARDS||{})["transcipher"]={
 slot:"Upload: a symmetric ciphertext element (here Z₂₅₇); server side: a BFV slot",
 values:"Upload as small as the data; server converts to packed HE ciphertexts",
 ops:"Symmetric encryption on the client; homomorphic cipher evaluation on the server",
 linear:"After unmasking, same as the underlying scheme (BFV here): exact.",
 relu:"Same as the underlying scheme: exact degree-256 polynomial in BFV.",
 noise:"Cipher evaluation spends a depth-4 slice of the budget before the neuron starts.",
 budget:"Cipher: 8 multiplications, depth 4; then the neuron",
 refresh:"Inherited from the underlying scheme",
 result:"14/40 = 0.3500, exact, with an 18-bit upload",
 security:"Ring-LWE for the HE part; the symmetric cipher's own (younger) security analysis",
 exact:"exact", interaction:"one-time key upload, then one round trip per query"
};
