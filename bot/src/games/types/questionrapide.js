import { QUESTIONS_RAPIDES } from "../data.js";
import { pickRandom } from "../../utils/text.js";

export default {
  name: "Questions rapides",
  social: true,
  totalRounds: 99,
  points: 0,
  nextRound(state) {
    const q = pickRandom(QUESTIONS_RAPIDES);
    state.current = { q };
    return {
      prompt: `⚡ ${q}\n\n_Réponse en 1 mot. /next pour la suivante._`,
    };
  },
  handleSocial() {
    return null;
  },
  checkAnswer() {
    return { correct: false };
  },
};
