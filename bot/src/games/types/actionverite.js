import { ACTION_VERITE } from "../data.js";
import { pickRandom } from "../../utils/text.js";

// Jeu sans scoring automatique : on enchaîne les défis, /stop pour finir.
export default {
  name: "Action ou Vérité",
  totalRounds: 8,
  points: 1,
  nextRound(state) {
    const prompt = pickRandom(ACTION_VERITE);
    state.current = { prompt, a: [] }; // pas de réponse à valider
    return { prompt: `🎲 ${prompt}\n_Répondez librement. Tape /jeu next pour passer._` };
  },
  checkAnswer() {
    return { correct: false };
  },
};
