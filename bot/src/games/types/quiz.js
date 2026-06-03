import { QUIZ } from "../data.js";
import { normalize } from "../../utils/text.js";

function pickUnused(pool, used) {
  const free = pool.map((_, i) => i).filter((i) => !used.has(i));
  return free[Math.floor(Math.random() * free.length)];
}

export default {
  name: "Quiz culture G",
  totalRounds: 5,
  points: 2,
  nextRound(state) {
    const i = pickUnused(QUIZ, state.used) ?? Math.floor(Math.random() * QUIZ.length);
    state.used.add(i);
    state.current = { ...QUIZ[i] };
    return { prompt: `❓ ${state.current.q}`, _i: i };
  },
  checkAnswer(state, guess) {
    if (!state.current) return null;
    const win = state.current.a.some((a) => normalize(a) === guess);
    return { correct: win };
  },
};
