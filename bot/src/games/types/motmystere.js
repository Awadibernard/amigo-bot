import { MOTS_MYSTERES } from "../data.js";
import { normalize } from "../../utils/text.js";

export default {
  name: "Mot mystère",
  totalRounds: 4,
  points: 2,
  nextRound(state) {
    const free = MOTS_MYSTERES.map((_, i) => i).filter((i) => !state.used.has(i));
    const i = free.length
      ? free[Math.floor(Math.random() * free.length)]
      : Math.floor(Math.random() * MOTS_MYSTERES.length);
    state.used.add(i);
    state.current = { ...MOTS_MYSTERES[i] };
    return { prompt: `🔍 Devine le mot : ${state.current.q}` };
  },
  checkAnswer(state, guess) {
    if (!state.current) return null;
    return { correct: state.current.a.some((a) => normalize(a) === guess) };
  },
};
