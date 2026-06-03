import { BLINDTEXT } from "../data.js";
import { normalize } from "../../utils/text.js";

export default {
  name: "Blind test (texte)",
  totalRounds: 4,
  points: 2,
  nextRound(state) {
    const free = BLINDTEXT.map((_, i) => i).filter((i) => !state.used.has(i));
    const i = free.length
      ? free[Math.floor(Math.random() * free.length)]
      : Math.floor(Math.random() * BLINDTEXT.length);
    state.used.add(i);
    state.current = { ...BLINDTEXT[i] };
    const hint = state.current.hint ? `\n_indice : ${state.current.hint}_` : "";
    return { prompt: `🎬 D'où vient cette réplique ?\n${state.current.q}${hint}` };
  },
  checkAnswer(state, guess) {
    if (!state.current) return null;
    return {
      correct: state.current.a.some((a) => normalize(a) === guess || guess.includes(normalize(a))),
    };
  },
};
