(window.LESSON_CARDS=window.LESSON_CARDS||{})["secret-sharing"]={
 slot:"One random-looking share of a 32-bit integer (fixed point in practice)",
 values:"One value per share; vectorized by sending many shares at once",
 ops:"Add and multiply by constants locally; multiply with a Beaver triple (one round)",
 linear:"Two Beaver products in one round, then local additions. No error.",
 relu:"Exact comparison: a ripple-carry adder on XOR-shared bits (31 sequential AND rounds), then a select",
 noise:"None. Shares are exact; security is information-theoretic",
 budget:"34 communication rounds for one neuron (no depth limit)",
 refresh:"None needed",
 result:"0.3500 exactly",
 security:"Non-colluding servers (2PC with dealer, or 3PC honest majority); no hardness assumption",
 exact:"exact", interaction:"many rounds between servers"
};
