import { DEBATS } from "../data.js";
import { pickRandom } from "../../utils/text.js";

export default {
  name: "Débat",
  social: true,
  totalRounds: 99,
  points: 0,
  nextRound(state) {
    const q = pickRandom(DEBATS);
    state.current = { q };
    return {
      prompt:
        `🗣️ *Débat*\n${q}\n\n` +
        "_Donnez votre avis + un argument. /next pour un autre sujet._",
    };
  },
  handleSocial() {
    return null;
  },
  checkAnswer() {
    return { correct: false };
  },
};
