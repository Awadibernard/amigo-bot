import { ROLEPLAY_SCENES } from "../data.js";
import { pickRandom } from "../../utils/text.js";

export default {
  name: "Jeu de rôle léger",
  totalRounds: 5,
  points: 1,
  nextRound(state) {
    const prompt = pickRandom(ROLEPLAY_SCENES);
    state.current = { prompt, a: [] };
    return { prompt: `🎭 ${prompt}` };
  },
  checkAnswer() {
    return { correct: false };
  },
};
