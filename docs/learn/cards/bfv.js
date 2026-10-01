(window.LESSON_CARDS=window.LESSON_CARDS||{})["bfv"]={
 slot:"An exact integer modulo t (here t = 257)",
 values:"N: 4 in the toy, 8,192 to 32,768 in practice",
 ops:"Add, multiply, rotate slots (all exact mod t)",
 linear:"Plaintext multiply, rotate-and-add, add. Exact; costs about 11 bits of noise budget.",
 relu:"Exact, as a degree t − 1 = 256 interpolation polynomial: 255 ct × ct multiplications at depth 8.",
 noise:"Grows from the bottom towards the message pinned in the top bits; never touches the result until the budget runs out.",
 budget:"About 100 of 191 bits of noise budget",
 refresh:"Bootstrapping by digit extraction; slow, rarely used for ML",
 result:"14/40 = 0.3500, exact",
 security:"Ring-LWE, post-quantum",
 exact:"exact", interaction:"none (one round trip)"
};
