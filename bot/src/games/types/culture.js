import { CULTURE } from "../data.js";
import { normalize } from "../../utils/text.js";

export default {
  name: "Culture générale",
  totalRounds: 5,
  points: 2,
  nextRound(state) {
    const free = CULTURE.map((_, i) => i).filter((i) => !state.used.has(i));
    const i = free.length
      ? free[Math.floor(Math.random() * free.length)]
      : Math.floor(Math.random() * CULTURE.length);
    state.used.add(i);
    state.current = { ...CULTURE[i] };
    return { prompt: `🎓 ${state.current.q}` };
  },
  checkAnswer(state, guess) {
    if (!state.current) return null;
    return { correct: state.current.a.some((a) => normalize(a) === guess) };
  },
};
