// Je n'ai jamais — jeu social, on enchaîne avec /next
import { JE_N_AI_JAMAIS } from "../data.js";
import { pickRandom } from "../../utils/text.js";

export default {
  name: "Je n'ai jamais",
  social: true,
  totalRounds: 99,
  points: 0,
  nextRound(state) {
    const stmt = pickRandom(JE_N_AI_JAMAIS);
    state.current = { stmt };
    return {
      prompt:
        `🍻 *Je n'ai jamais...*\n${stmt}\n\n` +
        "_Répondez ✅ si vous l'avez déjà fait, ❌ sinon. /next pour la suivante._",
    };
  },
  handleSocial() {
    return null;
  },
  checkAnswer() {
    return { correct: false };
  },
};
