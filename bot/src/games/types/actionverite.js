// ============================================================
// ACTION OU VÉRITÉ — jeu social tour par tour.
// - Pas de score, pas de bonne réponse.
// - Ayumi désigne automatiquement le joueur suivant parmi ceux
//   qui ont rejoint (/jouer). Si personne, invite à rejoindre.
// - Le joueur tape /action ou /verite (ou répond Action/Vérité).
// - /next pour passer au joueur suivant.
// ============================================================
import { ACTION_QUESTIONS, VERITE_QUESTIONS } from "../data.js";
import { pickRandom } from "../../utils/text.js";

export default {
  name: "Action ou Vérité",
  social: true,
  totalRounds: 99, // illimité, on s'arrête avec /stop
  points: 0,
  nextRound(state) {
    const players = [...state.players.values()];
    if (!players.length) {
      state.current = { waiting: true };
      return {
        prompt:
          "Personne n'a rejoint la partie 🙃\nTapez */jouer* pour participer, puis */next* pour démarrer.",
      };
    }
    // Choisir un joueur ≠ du précédent si possible
    const prev = state.lastPlayerJid;
    const pool = players.filter((p) => p.jid !== prev);
    const chosen = pickRandom(pool.length ? pool : players);
    state.current = {
      targetJid: chosen.jid,
      targetName: chosen.name,
      phase: "choice",
    };
    state.lastPlayerJid = chosen.jid;
    return {
      prompt:
        `🎲 *${chosen.name}*, Action ou Vérité ?\n` +
        "_Réponds *action* ou *vérité*. /next pour passer ton tour._",
      mentions: [chosen.jid],
    };
  },
  // Le moteur social appelle handleSocial(state, userJid, name, text)
  // au lieu de checkAnswer. Retourne { text, advance? }.
  handleSocial(state, userJid, name, text) {
    const cur = state.current;
    if (!cur) return null;
    if (cur.waiting) return null;
    if (cur.targetJid && userJid !== cur.targetJid) return null; // pas son tour
    const t = String(text).toLowerCase().trim();

    if (cur.phase === "choice") {
      if (/^(action|a)\b/.test(t)) {
        cur.phase = "challenge";
        cur.kind = "action";
        return { text: `🎯 Action pour *${cur.targetName}* :\n${pickRandom(ACTION_QUESTIONS)}\n\n_Réponds quand t'as fait. /next pour passer au suivant._` };
      }
      if (/^(verit[ée]|v)\b/.test(t)) {
        cur.phase = "challenge";
        cur.kind = "verite";
        return { text: `🔮 Vérité pour *${cur.targetName}* :\n${pickRandom(VERITE_QUESTIONS)}\n\n_Réponds honnêtement. /next pour passer au suivant._` };
      }
      return null; // ignore le reste
    }
    return null;
  },
  // checkAnswer requis par l'engine, mais inutilisé en mode social
  checkAnswer() {
    return { correct: false };
  },
};
