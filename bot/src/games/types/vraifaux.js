import { VRAI_FAUX } from "../data.js";
import { normalize } from "../../utils/text.js";

export default {
  name: "Vrai ou Faux",
  totalRounds: 6,
  points: 1,
  nextRound(state) {
    const free = VRAI_FAUX.map((_, i) => i).filter((i) => !state.used.has(i));
    const i = free.length
      ? free[Math.floor(Math.random() * free.length)]
      : Math.floor(Math.random() * VRAI_FAUX.length);
    state.used.add(i);
    state.current = { ...VRAI_FAUX[i] };
    return { prompt: `🤔 Vrai ou faux ?\n${state.current.q}` };
  },
  checkAnswer(state, guess) {
    if (!state.current) return null;
    return { correct: state.current.a.some((a) => normalize(a) === guess) };
  },
};
