(window.LESSON_CARDS=window.LESSON_CARDS||{})["fss"]={
 slot:"One additive share of a 32-bit integer; comparison keys are short seeds",
 values:"One value per share; one key pair per comparison",
 ops:"Local linear work; a comparison is one opening plus local PRG evaluation",
 linear:"As in secret sharing: Beaver products in one round, local additions",
 relu:"Exact: open u = z + r, evaluate two DCF keys locally, multiply by the bit (2 rounds)",
 noise:"None",
 budget:"2 online rounds; 2 × 146-byte DCF keys per server per ReLU",
 refresh:"None needed; keys are single-use and prepared offline",
 result:"0.3500 exactly",
 security:"Two non-colluding servers + dealer for keys; PRG security (SHA-256 here, AES in practice)",
 exact:"exact", interaction:"2 online rounds"
};
