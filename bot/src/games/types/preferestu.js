import { PREFERES_TU } from "../data.js";
import { pickRandom } from "../../utils/text.js";

export default {
  name: "Préfères-tu",
  social: true,
  totalRounds: 99,
  points: 0,
  nextRound(state) {
    const q = pickRandom(PREFERES_TU);
    state.current = { q };
    return {
      prompt: `🤔 ${q}\n\n_Chacun donne sa réponse + pourquoi. /next pour la suivante._`,
    };
  },
  handleSocial() {
    return null;
  },
  checkAnswer() {
    return { correct: false };
  },
};
