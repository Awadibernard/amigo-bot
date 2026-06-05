import { DEFIS_DU_JOUR } from "../data.js";
import { pickRandom } from "../../utils/text.js";

export default {
  name: "Défi du jour",
  social: true,
  totalRounds: 99,
  points: 0,
  nextRound(state) {
    const q = pickRandom(DEFIS_DU_JOUR);
    state.current = { q };
    return {
      prompt: `🏆 *Défi du jour*\n${q}\n\n_Relevez-le. /next pour un autre défi._`,
    };
  },
  handleSocial() {
    return null;
  },
  checkAnswer() {
    return { correct: false };
  },
};
