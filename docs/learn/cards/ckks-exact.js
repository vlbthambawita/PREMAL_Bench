(window.LESSON_CARDS=window.LESSON_CARDS||{})["ckks-exact"]={
 slot:"An approximate real kept very close to an integer or a bit",
 values:"N/2 (2 here); every slot carries its own bit or integer",
 ops:"Add, multiply, rotate, plus lookup tables inside bootstrapping",
 linear:"As in CKKS, with weights scaled to integers (×40)",
 relu:"Exact: extract bits by functional bootstrapping, clean them, multiply by (1 − sign)",
 noise:"Kept at a few ×10⁻⁶ by cleaning bits with 3v² − 2v³",
 budget:"6 levels after bit extraction (2 cleanings, product, scale)",
 refresh:"Functional bootstrapping doubles as the lookup-table evaluation",
 result:"≈ 0.34999 for a true 0.3500 (error ~5×10⁻⁶)",
 security:"Ring-LWE, post-quantum",
 exact:"exact", interaction:"none (one round trip)"
};
