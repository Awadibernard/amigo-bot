import { QUI_EST_LE_PLUS_SUSCEPTIBLE } from "../data.js";
import { pickRandom } from "../../utils/text.js";

export default {
  name: "Qui est le plus susceptible de…",
  social: true,
  totalRounds: 99,
  points: 0,
  nextRound(state) {
    const q = pickRandom(QUI_EST_LE_PLUS_SUSCEPTIBLE);
    state.current = { q };
    return {
      prompt:
        `👉 ${q}\n\n` +
        "_Chacun envoie le prénom de celui/celle qu'il vise. /next pour la suivante._",
    };
  },
  handleSocial() {
    return null;
  },
  checkAnswer() {
    return { correct: false };
  },
};
