(window.LESSON_CARDS=window.LESSON_CARDS||{})["ckks"]={
 slot:"An approximate real (or complex) number, scaled by Δ",
 values:"N/2: 2 in the toy, 32,768 in practice",
 ops:"Add, multiply, rotate slots",
 linear:"One plaintext multiply, one rotate-and-add, one add. Packing makes it cheap per value.",
 relu:"Polynomial approximation. Inexact, and deep if you want accuracy.",
 noise:"Never removed. It stays below the chosen precision.",
 budget:"3 levels (weights, z², coefficient)",
 refresh:"Bootstrapping, the most expensive operation",
 result:"0.3262 for a true 0.3500",
 security:"Ring-LWE, post-quantum",
 exact:"approximate", interaction:"none (one round trip)"
};
