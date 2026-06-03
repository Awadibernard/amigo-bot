import { DEVINETTES } from "../data.js";
import { normalize } from "../../utils/text.js";

export default {
  name: "Devinettes",
  totalRounds: 4,
  points: 3,
  nextRound(state) {
    const free = DEVINETTES.map((_, i) => i).filter((i) => !state.used.has(i));
    const i = free.length
      ? free[Math.floor(Math.random() * free.length)]
      : Math.floor(Math.random() * DEVINETTES.length);
    state.used.add(i);
    state.current = { ...DEVINETTES[i] };
    return { prompt: `🧩 ${state.current.q}` };
  },
  checkAnswer(state, guess) {
    if (!state.current) return null;
    return { correct: state.current.a.some((a) => normalize(a) === guess) };
  },
};
