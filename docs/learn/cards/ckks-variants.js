(window.LESSON_CARDS=window.LESSON_CARDS||{})["ckks-variants"]={
 slot:"Same as CKKS: approximate reals (complex packing fits two reals per slot)",
 values:"N/2 complex, or N real with conjugate-invariant CKKS",
 ops:"Add, multiply, rotate, conjugate; all on RNS residues",
 linear:"With complex packing: one multiply plus one conjugation, no rotation",
 relu:"Unchanged: polynomial approximation as in CKKS",
 noise:"Rescale error removed by exact scale tracking; flooding noise added before sharing results",
 budget:"1–2 levels for the linear part; bootstrapping costs ~10+ levels",
 refresh:"Bootstrapping, made sparser (encapsulation), more precise (META-BTS), shallower (SHIP) or with smaller keys (PaCo)",
 result:"z = 0.3500 without a rotation",
 security:"Ring-LWE; IND-CPA-D needs noise flooding",
 exact:"approximate", interaction:"none (one round trip)"
};
