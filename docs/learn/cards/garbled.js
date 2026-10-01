(window.LESSON_CARDS=window.LESSON_CARDS||{})["garbled"]={
 slot:"One random 64-bit label per wire; its meaning (0 or 1) is hidden",
 values:"One bit per wire; this ReLU circuit has 37 wires (10 inputs, 27 gates)",
 ops:"Any boolean gate; XOR and NOT free, AND costs a 4-row table (2 with half-gates)",
 linear:"Not done here: z arrives secret-shared from an HE or MPC linear layer, and the circuit adds the shares",
 relu:"Exact: 4 AND gates on the bits, plus a 4-AND adder for the shares",
 noise:"None",
 budget:"8 garbled AND gates, 5 oblivious transfers, ≈ 540 bytes",
 refresh:"None needed",
 result:"0.3500 exactly",
 security:"Semi-honest 2PC; hash modelled as random oracle; OT from discrete log (toy group here)",
 exact:"exact", interaction:"constant rounds (OT + one message)"
};
