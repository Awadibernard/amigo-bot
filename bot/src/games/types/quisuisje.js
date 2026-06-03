import { QUI_SUIS_JE } from "../data.js";
import { normalize } from "../../utils/text.js";

export default {
  name: "Qui suis-je ?",
  totalRounds: 4,
  points: 3,
  nextRound(state) {
    const free = QUI_SUIS_JE.map((_, i) => i).filter((i) => !state.used.has(i));
    const i = free.length
      ? free[Math.floor(Math.random() * free.length)]
      : Math.floor(Math.random() * QUI_SUIS_JE.length);
    state.used.add(i);
    state.current = { ...QUI_SUIS_JE[i] };
    return { prompt: `🕵️ ${state.current.q}` };
  },
  checkAnswer(state, guess) {
    if (!state.current) return null;
    return { correct: state.current.a.some((a) => normalize(a) === guess) };
  },
};
