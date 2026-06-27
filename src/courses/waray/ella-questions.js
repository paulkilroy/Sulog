/* Open questions for a native Daram/Samar Waray speaker (Ella). The Ask Ella panel
   in the app renders these. Resolving them feeds back into the courses + dialect
   notes (variants.js, the challenger course, the reader). Append freely. */

export const ELLA_QUESTIONS = [
  {
    id: "an-vs-in",
    topic: "Challenger · core marker",
    q: "Does Daram Waray use “in” (or “it”) as the everyday noun marker instead of standard “an”?",
    detail: "e.g. “Aadi in balay” vs “Aadi an balay” (the house is here). Gemini insisted on “in/it” for Samar; we shipped the Challenger course with safe standard “an”. If “in” is what people really say in Daram, we'll switch it.",
  },
  {
    id: "dadi",
    topic: "Challenger · vocabulary",
    q: "Is “dadi” the natural Daram word for “come here”?",
    detail: "Or is it “kadi”, “ngarihi”, or “kani”? Taught in Unit 2.",
  },
  {
    id: "kamusta-kumusta",
    topic: "Challenger · spelling",
    q: "In Daram, is it “kamusta” or “kumusta”?",
    detail: "We teach “kamusta”. Minor, but worth getting right for the very first greeting.",
  },
  {
    id: "kagugub-an",
    topic: "Reader · register",
    q: "Is “kagugub-an” (forest) literary/“deep Waray”, with “kagurangan” the everyday Samar word?",
    detail: "Appears in the Bloom story “An Banog ha Bukid Huraw”. We want beginners learning the common form.",
  },
  {
    id: "bfc-stories",
    topic: "Reader · correction set",
    q: "Correct the 7 Bible-for-Children stories from dialectal to standard Waray.",
    detail: "Machine-translated, came out dialectal (san→han, sira→hira, aron, kumila…). Pulled from the Read tab until fixed. Full list + guesses in docs/ella-todo-bfc-correction.md.",
  },
  {
    id: "samar-variants",
    topic: "Dialect · confirm variants",
    q: "Confirm the Samar/Daram everyday forms we're assuming.",
    detail: "di (for diri), sin (for hin), mayda (= may ada / there is), wara (= waray), gihap (= gihapon). Are these how you'd actually say them in Daram?",
  },
];
