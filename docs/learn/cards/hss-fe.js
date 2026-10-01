(window.LESSON_CARDS=window.LESSON_CARDS||{})["hss-fe"]={
 slot:"FE: one group element per coordinate (value in the exponent). HSS: one share per server",
 values:"One value per coordinate; the result must be small enough for a discrete-log search",
 ops:"FE: one inner product per functional key. HSS: local linear work; products via share conversion",
 linear:"FE: the server decrypts ⟨x̃, w̃⟩ = 40·z directly. HSS: each server applies w to its share",
 relu:"FE: in the clear, because the server learns z. HSS: needs products, via distributed discrete log",
 noise:"None in FE. HSS share conversion fails with small probability (≈ m/256 here)",
 budget:"No server-to-server rounds; one key per function (FE)",
 refresh:"None",
 result:"0.3500 exactly, but the FE server sees z",
 security:"DDH (toy 41-bit group here); FE leaks every inner product its keys allow",
 exact:"exact", interaction:"none between servers"
};
